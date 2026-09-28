import { CartItem, CustomerAccount, Order, OrderStatus, PaymentStatus, SavedAddress } from '../types';
import { CURRENCY, DELIVERY_FEE_NGN } from '../data/initialData';
import { isBackendConfigured, requestJson, withLocalFallback } from './api';
import { getAdminToken } from './adminApi';
import { normalizeApiOrder, toApiOrderPatch } from './normalizers';

export { API_BASE_URL, isBackendConfigured } from './api';

export const getDeliveryFee = (): number => DELIVERY_FEE_NGN;

export const generateRefer = (prefix = 'IB'): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const generateOrderNumber = (): string => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `IBA-${stamp}-${String(Math.floor(1000 + Math.random() * 9000))}`;
};

export interface CheckoutItemPayload {
  productId: number;
  name: string;
  size: string;
  color?: string;
  qty: number;
  unitPrice: number;
}

export interface CheckoutPayload {
  customer: { name: string; email: string; phone: string };
  delivery: {
    label: string;
    line1: string;
    city: string;
    state: string;
    country: string;
    notes?: string;
  };
  items: CheckoutItemPayload[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

export interface BackendPaymentInit {
  reference: string;
  amount: number;
  currency: string;
  access_code?: string;
  authorization_url?: string;
}

export interface CreatedOrderResult {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentStatus: PaymentStatus;
  payment: BackendPaymentInit;
  createdAt: string;
}

export interface OrderStatusResult {
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  updatedAt: string;
}

const toCartItemPayloads = (items: CartItem[]): CheckoutItemPayload[] =>
  items.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    size: item.size,
    color: item.color,
    qty: item.qty,
    unitPrice: item.product.price
  }));

export interface BuildCheckoutArgs {
  account: CustomerAccount;
  address: SavedAddress;
  notes?: string;
  items: CartItem[];
}

/**
 * Sends the exact body a backend implementing API_CONTRACT.md §4.2 must accept.
 * Amounts are in naira (Paystack conversion to kobo happens backend-side).
 */
export const buildCheckoutPayload = ({
  account,
  address,
  notes,
  items
}: BuildCheckoutArgs): CheckoutPayload => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const deliveryFee = getDeliveryFee();
  return {
    customer: { name: account.name, email: account.email, phone: account.phone },
    delivery: { ...address, notes },
    items: toCartItemPayloads(items),
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    currency: CURRENCY
  };
};

interface CreateOrderResponse {
  order?: Record<string, unknown>;
  payment?: BackendPaymentInit;
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
}

/**
 * POST /api/orders — parses the contract response `{ order, payment }`
 * (payment.amount in kobo as issued by the backend). Also tolerates the
 * legacy flattened shape returned by older demo backends.
 */
export const createOrderAtBackend = async (payload: CheckoutPayload): Promise<CreatedOrderResult> => {
  const fallback: CreatedOrderResult = {
    orderId: `LOCAL-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    amount: payload.total,
    paymentStatus: 'pending',
    payment: {
      reference: generateRefer(),
      amount: payload.total,
      currency: payload.currency
    },
    createdAt: new Date().toISOString()
  };

  const res = await withLocalFallback<unknown>({
    path: '/api/orders',
    init: { method: 'POST', body: JSON.stringify(payload) },
    fallback,
    label: 'createOrder'
  });

  if (res === fallback) return fallback;

  const raw = res as Record<string, unknown>;
  const order = (raw.order && typeof raw.order === 'object' ? (raw.order as Record<string, unknown>) : raw) as Record<string, unknown>;
  const payment = (raw.payment && typeof raw.payment === 'object'
    ? (raw.payment as BackendPaymentInit)
    : ({ reference: generateRefer(), amount: payload.total, currency: payload.currency } as BackendPaymentInit));

  return {
    orderId: String(order.id ?? raw.orderId ?? fallback.orderId),
    orderNumber: String(order.order_number ?? order.orderNumber ?? raw.orderNumber ?? fallback.orderNumber),
    amount: Number(order.total ?? order.amount ?? raw.amount ?? payload.total),
    paymentStatus: String(order.payment_status ?? order.paymentStatus ?? raw.paymentStatus ?? 'pending') as PaymentStatus,
    payment,
    createdAt: String(order.created_at ?? raw.createdAt ?? new Date().toISOString())
  };
};

/**
 * GET /api/orders/:orderId — the frontend polls this after opening the Paystack
 * PopUp. Per contract §4.2, a still-pending order older than ~2 minutes must be
 * re-verified against Paystack server-side before responding.
 */
export const getOrderStatusAtBackend = async (orderId: string): Promise<OrderStatusResult> => {
  const fallback: OrderStatusResult = {
    orderId,
    orderNumber: 'IBA-LOCAL',
    amount: 0,
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    updatedAt: new Date().toISOString()
  };

  const res = await withLocalFallback<unknown>({
    path: `/api/orders/${encodeURIComponent(orderId)}`,
    init: { method: 'GET' },
    fallback,
    label: 'getOrderStatus'
  });

  if (res === fallback) return fallback;

  const raw = res as Record<string, unknown>;
  const order = normalizeApiOrder((raw.order && typeof raw.order === 'object' ? (raw.order as Record<string, unknown>) : raw));
  return {
    orderId: order.id || orderId,
    orderNumber: order.orderNumber || 'IBA-LOCAL',
    amount: order.amount,
    paymentStatus: (order.paymentStatus ?? 'paid') as PaymentStatus,
    orderStatus: (order.orderStatus ?? 'confirmed') as OrderStatus,
    updatedAt: order.updatedAt || new Date().toISOString()
  };
};

export const waitForPaymentConfirmation = async (
  orderId: string,
  attempts = 8,
  intervalMs = 1500
): Promise<OrderStatusResult> => {
  if (!isBackendConfigured()) {
    return {
      orderId,
      orderNumber: 'IBA-LOCAL',
      amount: 0,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      updatedAt: new Date().toISOString()
    };
  }
  let last: OrderStatusResult | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await getOrderStatusAtBackend(orderId);
    last = status;
    if (status.paymentStatus === 'paid' || status.paymentStatus === 'failed' || status.paymentStatus === 'refunded') {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return last || { orderId, orderNumber: 'IBA-LOCAL', amount: 0, paymentStatus: 'pending', orderStatus: 'pending', updatedAt: new Date().toISOString() };
};

/**
 * GET /api/orders (admin) — accepts `{ orders: [...] }` or a bare array.
 */
export const listOrdersAtBackend = async (): Promise<Order[]> => {
  const fallback: unknown[] = [];
  const token = getAdminToken();
  const res = await withLocalFallback<unknown>({
    path: '/api/orders',
    init: { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    fallback,
    label: 'listOrders'
  });
  if (res === fallback) return [];
  const list = Array.isArray(res) ? res : (res as { orders?: unknown }).orders;
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => normalizeApiOrder(item));
};

/**
 * PATCH /api/orders/:orderId (admin) — sends snake_case to match the contract.
 */
export const updateOrderAtBackend = async (
  orderId: string,
  patch: { paymentStatus?: PaymentStatus; orderStatus?: OrderStatus } = {}
): Promise<Order> => {
  const fallback: Order = {
    id: orderId,
    customer: 'LOCAL',
    date: new Date().toLocaleDateString('en-NG'),
    amount: 0,
    status: patch.paymentStatus === 'paid' ? 'completed' : 'pending',
    paymentStatus: patch.paymentStatus,
    orderStatus: patch.orderStatus
  };
  const res = await withLocalFallback<unknown>({
    path: `/api/orders/${encodeURIComponent(orderId)}`,
    init: {
      method: 'PATCH',
      body: JSON.stringify(toApiOrderPatch(patch)),
      headers: (() => {
        const token = getAdminToken();
        return token ? { Authorization: `Bearer ${token}` } : undefined;
      })()
    },
    fallback,
    label: 'updateOrder'
  });
  if (res === fallback) return fallback;
  return normalizeApiOrder(res as Record<string, unknown>);
};