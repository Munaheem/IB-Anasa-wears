export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
export const isBackendConfigured = (): boolean => Boolean(API_BASE_URL);

export class ApiRequestError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export const requestJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string> | undefined) || {})
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });
  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // non-JSON error body
    }
    const code = body?.error?.code;
    const message =
      body?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, code, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
};

export const withLocalFallback = async <T>({
  path,
  init,
  fallback,
  label
}: {
  path: string;
  init: RequestInit;
  fallback: T;
  label: string;
}): Promise<T> => {
  if (!isBackendConfigured()) {
    return Promise.resolve(fallback);
  }
  try {
    return await requestJson<T>(path, init);
  } catch (error) {
    console.warn(`[api] ${label} — backend unreachable, using local fallback.`, error);
    return fallback;
  }
};