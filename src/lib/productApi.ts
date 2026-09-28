import { Product } from '../types';
import { isBackendConfigured, requestJson } from './api';
import { normalizeApiProduct } from './normalizers';

export type ProductsResult =
  | { source: 'backend'; products: Product[] }
  | { source: 'local'; products: Product[] | null };

/**
 * GET /api/products — accepts the contract response `{ products: [...] }` or a
 * bare array, normalizes each record into the UI Product model, and skips
 * draft/archived records the storefront must never see.
 */
export const fetchProductsFromBackend = async (): Promise<ProductsResult> => {
  if (!isBackendConfigured()) {
    return { source: 'local', products: null };
  }
  try {
    const data = await requestJson<unknown>('/api/products', { method: 'GET' });
    const list = Array.isArray(data) ? data : (data as { products?: unknown })?.products;
    if (!Array.isArray(list)) {
      throw new Error('Unexpected products payload');
    }
    const products = list
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => normalizeApiProduct(item))
      .filter((product) => product.status !== 'draft' && product.status !== 'archived');
    return { source: 'backend', products };
  } catch (error) {
    console.warn('[api] GET /api/products failed — using local catalogue.', error);
    return { source: 'local', products: null };
  }
};