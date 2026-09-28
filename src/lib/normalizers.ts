import { CustomerAccount, Order, Product, ProductStatus, ProductVariant, SavedAddress, SavedCard } from '../types';

/**
 * Maps the contract's Product shape ({ category, images, variants[], ... })
 * to the UI's Product shape ({ cat, img, sizes[], colors[], ... }).
 * Tolerates camelCase JSON too, so a backend that already mirrors the UI
 * fields keeps working.
 */
export const normalizeApiProduct = (api: Record<string, unknown>): Product => {
  const id = Number(api.id ?? 0);
  const price = Number(api.price ?? 0);

  const rawVariants = Array.isArray(api.variants) ? (api.variants as Record<string, unknown>[]) : [];
  const variants: ProductVariant[] = rawVariants
    .filter((v) => typeof v?.size === 'string')
    .map((v) => ({
      id: String(v.id !== undefined ? v.id : `${id}-${v.size}-${v.colour ?? ''}`),
      size: String(v.size),
      colour: v.colour ? String(v.colour) : undefined,
      price: v.price !== undefined ? Number(v.price) : price,
      stock: Math.max(0, Number(v.stock ?? 0))
    }));

  const sizes = Array.from(new Set(variants.map((v) => v.size)));
  const colors = Array.from(new Set(variants.map((v) => v.colour).filter((c): c is string => Boolean(c))));
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  const images = Array.isArray(api.images)
    ? (api.images as unknown[]).filter((img): img is string => typeof img === 'string' && Boolean(img))
    : [];

  const rawStatus = String(api.status ?? 'active');
  const status: ProductStatus =
    rawStatus === 'draft' || rawStatus === 'archived' || rawStatus === 'out_of_stock'
      ? rawStatus
      : rawStatus === 'active'
        ? 'active'
        : totalStock > 0
          ? 'active'
          : 'out_of_stock';

  return {
    id,
    name: String(api.name ?? 'Untitled garment'),
    cat: String(api.category ?? api.cat ?? 'shirts'),
    price,
    img: images[0] || '/images/essentials polo.jpg',
    altImg: images[1] ? String(images[1]) : undefined,
    gallery: images.length > 1 ? images : undefined,
    sizes: sizes.length ? sizes : ['One Size'],
    colors: colors.length ? colors : undefined,
    description: api.description ? String(api.description) : undefined,
    composition: api.composition ? String(api.composition) : undefined,
    status,
    inStock: status !== 'draft' && totalStock > 0,
    featured: Boolean(api.featured),
    newArrival: Boolean(api.new_arrival),
    dateAdded: api.date_added ? String(api.date_added) : api.created_at ? String(api.created_at) : undefined,
    variants
  };
};

/**
 * Builds an API Product input (snake_case, contract §2.2) from the UI Product.
 * Used by the admin sync (POST/PUT /api/products).
 */
export interface ApiProductInput {
  name: string;
  category: string;
  price: number;
  images: string[];
  description?: string;
  status: ProductStatus;
  featured: boolean;
  new_arrival: boolean;
  date_added?: string;
  variants: Array<{
    id?: string | number;
    size: string;
    colour?: string;
    price: number;
    stock: number;
  }>;
}

const deriveVariants = (product: Product): Array<{ id?: string; size: string; colour?: string; price: number; stock: number }> => {
  const sizes = product.sizes.length ? product.sizes : ['One Size'];
  const colours = product.colors && product.colors.length ? product.colors : [undefined];
  const variants: Array<{ id?: string; size: string; colour?: string; price: number; stock: number }> = [];
  for (const size of sizes) {
    for (const colour of colours) {
      const uiVar = product.variants?.find(
        (v) => v.size === size && ((v.colour ?? undefined) === (colour ?? undefined))
      );
      variants.push({
        id: uiVar?.id,
        size,
        colour,
        price: uiVar?.price ?? product.price,
        stock: uiVar?.stock ?? 0
      });
    }
  }
  return variants;
};

export const toApiProduct = (product: Product): ApiProductInput => {
  const gallery = product.gallery || [];
  const images = [product.img, ...gallery].filter((img, index, all) => Boolean(img) && all.indexOf(img) === index);
  const variants = (product.variants && product.variants.length ? product.variants : deriveVariants(product)).map((v) => ({
    id: v.id !== undefined ? String(v.id) : undefined,
    size: String(v.size),
    colour: v.colour,
    price: v.price !== undefined && v.price >= 0 ? Math.round(Number(v.price)) : product.price,
    stock: Math.max(0, Math.round(Number(v.stock) || 0))
  }));

  return {
    name: product.name,
    category: product.cat,
    price: product.price,
    images,
    description: product.description,
    status: product.status && ['active', 'out_of_stock', 'draft', 'archived'].includes(product.status) ? product.status : 'draft',
    featured: Boolean(product.featured),
    new_arrival: Boolean(product.newArrival),
    date_added: product.dateAdded,
    variants
  };
};

/**
 * Maps the contract Order shape (snake_case, contract §2.3) to the UI Order.
 * Tolerates camelCase JSON as well.
 */
export const normalizeApiOrder = (item: Record<string, unknown>): Order => {
  const delivery = (item.delivery ?? {}) as Record<string, unknown>;
  const customer = (item.customer ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(item.items) ? (item.items as Record<string, unknown>[]) : [];

  const paymentStatus = String(item.payment_status ?? item.paymentStatus ?? 'pending');
  const orderStatus = String(item.order_status ?? item.orderStatus ?? 'pending');

  const status: Order['status'] =
    paymentStatus === 'paid' ? 'completed' : paymentStatus === 'failed' || paymentStatus === 'refunded' ? 'cancelled' : 'pending';

  const textItems = rawItems
    .map((i) => `${Number(i.quantity) ?? 0}x ${String(i.product_name ?? i.name ?? '')} (${String(i.size ?? '')})`)
    .filter(Boolean);

  const createdAt = item.created_at ?? item.createdAt ?? item.date ?? '';
  const parsedDate = typeof createdAt === 'string' ? new Date(createdAt) : null;

  const shippingAddress: SavedAddress | undefined =
    typeof (delivery as Record<string, unknown>).line1 === 'string'
      ? {
          id: String(delivery.id ?? ''),
          label: String(delivery.label ?? 'Home'),
          line1: String(delivery.line1),
          city: String(delivery.city ?? ''),
          state: String(delivery.state ?? ''),
          country: String(delivery.country ?? 'Nigeria')
        }
      : undefined;

  const subtotal = Number(item.subtotal ?? 0);
  const deliveryFee = Number(item.delivery_fee ?? item.deliveryFee ?? 0);
  const total = Number(item.total ?? 0);

  return {
    id: String(item.id ?? ''),
    orderNumber: item.order_number ? String(item.order_number) : String(item.orderNumber ?? ''),
    customer: String(customer.name ?? item.customerName ?? ''),
    phone: customer.phone ? String(customer.phone) : item.phone ? String(item.phone) : undefined,
    email: customer.email ? String(customer.email) : item.email ? String(item.email) : undefined,
    date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString('en-NG') : String(createdAt ?? ''),
    amount: total || subtotal + deliveryFee,
    status,
    shippingStatus: mapOrderStatus(orderStatus as Order['orderStatus']),
    paymentReference: item.payment_reference ? String(item.payment_reference) : item.paymentReference ? String(item.paymentReference) : undefined,
    shippingAddress,
    items: textItems.join(', ') || undefined,
    subtotal,
    deliveryFee,
    deliveryNotes: typeof delivery.notes === 'object' ? String((delivery.notes as { text?: string }).text ?? '') : delivery.notes ? String(delivery.notes) : undefined,
    paymentStatus: paymentStatus as Order['paymentStatus'],
    orderStatus: orderStatus as Order['orderStatus'],
    updatedAt: item.updated_at ? String(item.updated_at) : item.updatedAt ? String(item.updatedAt) : undefined
  };
};

const mapOrderStatus = (orderStatus: Order['orderStatus']): Order['shippingStatus'] => {
  switch (orderStatus) {
    case 'processing':
      return 'Processing';
    case 'ready':
      return 'Ready for dispatch';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Processing';
    default:
      return 'Processing';
  }
};

export const toApiOrderPatch = (
  patch: { paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'; orderStatus?: Order['orderStatus'] }
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (patch.paymentStatus) body.payment_status = patch.paymentStatus;
  if (patch.orderStatus) body.order_status = patch.orderStatus;
  return body;
};

export const normalizeApiCustomer = (api: Record<string, unknown>): CustomerAccount => {
  const rawAddresses = Array.isArray(api.addresses) ? (api.addresses as Record<string, unknown>[]) : [];
  const rawCards = Array.isArray(api.saved_cards ?? api.savedCards)
    ? ((api.saved_cards ?? api.savedCards) as Record<string, unknown>[])
    : [];

  return {
    id: String(api.id ?? `customer-${Date.now()}`),
    name: String(api.name ?? ''),
    email: String(api.email ?? ''),
    phone: String(api.phone ?? ''),
    points: Number(api.points ?? 0),
    addresses: rawAddresses.map((addr) => ({
      id: String(addr.id ?? ''),
      label: String(addr.label ?? 'Home'),
      line1: String(addr.line1 ?? ''),
      city: String(addr.city ?? ''),
      state: String(addr.state ?? ''),
      country: String(addr.country ?? 'Nigeria')
    })) as SavedAddress[],
    savedCards: rawCards.map((card) => ({
      id: String(card.id ?? ''),
      brand: String(card.brand ?? 'Paystack secured card'),
      last4: String(card.last4 ?? ''),
      reference: String(card.reference ?? '')
    })) as SavedCard[],
    createdAt: String(api.created_at ?? api.createdAt ?? new Date().toISOString()),
    signedInAt: new Date().toISOString()
  };
};