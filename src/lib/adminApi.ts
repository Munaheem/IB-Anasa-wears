import { AdminUser } from '../types';
import { ApiRequestError, isBackendConfigured, requestJson } from './api';
import { ApiProductInput } from './normalizers';

export const ADMIN_TOKEN_KEY = 'ib_anasa_admin_token';

export const getAdminToken = (): string | undefined => {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || undefined;
  } catch {
    return undefined;
  }
};

export const storeAdminToken = (token?: string): void => {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // storage unavailable
  }
};

export const clearAdminToken = (): void => storeAdminToken(undefined);

export interface AdminLoginResult {
  ok: boolean;
  user?: AdminUser;
  message?: string;
}

const authHeaders = (): Record<string, string> => {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const toAdminUser = (raw: Record<string, unknown>, fallbackEmail: string): AdminUser => ({
  email: String(raw.email ?? fallbackEmail),
  name: String(raw.name ?? 'Store Admin'),
  picture: raw.picture ? String(raw.picture) : undefined,
  role: String(raw.role ?? 'Store Manager'),
  authMethod: 'password',
  signedInAt: new Date().toISOString()
});

/**
 * POST /api/auth/login (contract §3.2). Stores the JWT in sessionStorage so the
 * rest of the admin surface can attach Bearer headers. When no backend is
 * configured this mirrors the old local demo behaviour.
 */
export const adminLogin = async (email: string, password: string): Promise<AdminLoginResult> => {
  if (!isBackendConfigured()) {
    return {
      ok: true,
      user: toAdminUser({ email, name: 'Store Admin', role: 'Store Manager' }, email)
    };
  }
  try {
    const res = await requestJson<{ token?: string; user?: Record<string, unknown> }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) storeAdminToken(res.token);
    return { ok: true, user: toAdminUser(res.user ?? {}, email) };
  } catch (error) {
    const message = error instanceof ApiRequestError ? error.message : 'Sign in failed. Please try again.';
    return { ok: false, message };
  }
};

/**
 * GET /api/me — restores the admin session from the stored token on reload.
 */
export const adminMe = async (): Promise<AdminUser | null> => {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const res = await requestJson<Record<string, unknown>>('/api/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    return toAdminUser(res, String(res.email ?? ''));
  } catch (error) {
    return null;
  }
};

const unwrapProduct = (res: Record<string, unknown>): Record<string, unknown> => {
  const inner = res.product;
  return inner && typeof inner === 'object' && !Array.isArray(inner) ? (inner as Record<string, unknown>) : res;
};

/** POST /api/products — creates a product, returns the created record. */
export const createProduct = async (input: ApiProductInput): Promise<Record<string, unknown>> => {
  const res = await requestJson<Record<string, unknown>>('/api/products', {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders()
  });
  return unwrapProduct(res);
};

/** PUT /api/products/:id — full upsert of a product. */
export const updateProduct = async (id: number, input: ApiProductInput): Promise<Record<string, unknown>> => {
  const res = await requestJson<Record<string, unknown>>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    headers: authHeaders()
  });
  return unwrapProduct(res);
};

/** PATCH /api/products/:id — partial update (status, price, fields...). */
export const patchProduct = async (id: number, patch: Record<string, unknown>): Promise<Record<string, unknown>> => {
  return requestJson<Record<string, unknown>>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    headers: authHeaders()
  });
};

/** Soft-delete: flips the product to archived so the storefront hides it. */
export const archiveProduct = (id: number): Promise<Record<string, unknown>> => patchProduct(id, { status: 'archived' });

/** PATCH /api/products/:id/variants/:variantId — stock/price updates per size. */
export const updateProductVariant = async (
  productId: number,
  variantId: string,
  patch: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  return requestJson<Record<string, unknown>>(`/api/products/${productId}/variants/${encodeURIComponent(variantId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    headers: authHeaders()
  });
};