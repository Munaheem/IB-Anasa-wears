export interface PaystackIntent {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackPaymentResult {
  reference: string;
  status: string;
  transaction?: string;
}

type PaystackHandler = {
  openIframe: () => void;
};

type PaystackPop = {
  setup: (options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata?: Record<string, unknown>;
    callback: (response: { reference: string; status?: string; transaction?: string }) => void;
    onClose: () => void;
  }) => PaystackHandler;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

export const PAYSTACK_CURRENCY = 'NGN';

export const getPaystackPublicKey = (): string | undefined =>
  import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.trim();

export const isPaystackConfigured = (): boolean => Boolean(getPaystackPublicKey());

export const createPaymentReference = (prefix = 'IB'): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

let scriptLoadPromise: Promise<PaystackPop> | null = null;

export const loadPaystackSDK = (): Promise<PaystackPop> => {
  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve(window.PaystackPop);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        if (window.PaystackPop) {
          resolve(window.PaystackPop);
        } else {
          scriptLoadPromise = null;
          reject(new Error('Paystack failed to initialize'));
        }
      };
      script.onerror = () => {
        scriptLoadPromise = null;
        reject(new Error('Unable to load Paystack SDK'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptLoadPromise;
};

export const payWithPaystack = (intent: PaystackIntent): Promise<PaystackPaymentResult> => {
  const key = getPaystackPublicKey();
  if (!key) {
    return Promise.reject(new Error('Paystack is not configured. Set VITE_PAYSTACK_PUBLIC_KEY.'));
  }

  return loadPaystackSDK().then((pop) => {
    return new Promise<PaystackPaymentResult>((resolve, reject) => {
      const handler = pop.setup({
        key,
        email: intent.email,
        amount: intent.amount,
        currency: intent.currency,
        ref: intent.reference,
        metadata: intent.metadata,
        callback: (response) =>
          resolve({
            reference: response.reference,
            status: response.status || 'success',
            transaction: response.transaction
          }),
        onClose: () => reject(new Error('Payment window closed'))
      });
      handler.openIframe();
    });
  });
};