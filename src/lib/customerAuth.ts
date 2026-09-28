import { CustomerAccount, CustomerCredential } from '../types';
import { ApiRequestError, isBackendConfigured, requestJson } from './api';
import { normalizeApiCustomer } from './normalizers';

export const CUSTOMER_CREDENTIALS_KEY = 'ib_anasa_customer_credentials';

export const normalizeIdentifier = (value: string): string => value.trim().toLowerCase();

export const normalizePhone = (value: string): string => value.trim().replace(/[\s\-()]/g, '');

export const loadSavedCredentials = (): CustomerCredential[] => {
  try {
    const raw = localStorage.getItem(CUSTOMER_CREDENTIALS_KEY);
    return raw ? (JSON.parse(raw) as CustomerCredential[]) : [];
  } catch {
    return [];
  }
};

export const persistCredential = (credential: CustomerCredential): void => {
  const all = loadSavedCredentials();
  const id = normalizeIdentifier(credential.email || credential.phone);
  const others = all.filter((cred) => normalizeIdentifier(cred.email || cred.phone) !== id);
  localStorage.setItem(CUSTOMER_CREDENTIALS_KEY, JSON.stringify([credential, ...others]));
};

export const findCredentialByIdentifier = (identifier: string): CustomerCredential | undefined => {
  const id = normalizeIdentifier(identifier);
  return loadSavedCredentials().find((cred) => {
    const emailId = normalizeIdentifier(cred.email);
    const phoneId = normalizeIdentifier(cred.phone);
    return emailId === id || phoneId === id;
  });
};

export const authenticate = (
  identifier: string,
  password: string
): { ok: boolean; credential?: CustomerCredential; message?: string } => {
  const credential = findCredentialByIdentifier(identifier);
  if (!credential) {
    return {
      ok: false,
      message: 'No account found with that email or phone number. Check your details or create an account.'
    };
  }
  if (credential.password !== password) {
    return { ok: false, message: 'Incorrect password. Please try again or reset your password.' };
  }
  return { ok: true, credential };
};

export const createCredential = (
  name: string,
  identifier: string,
  password: string
): { ok: boolean; credential?: CustomerCredential; message?: string } => {
  const trimmed = identifier.trim();
  if (findCredentialByIdentifier(trimmed)) {
    return {
      ok: false,
      message: 'An account already exists with that email or phone number. Please sign in instead.'
    };
  }
  const isEmail = /^\S+@\S+\.\S+$/.test(trimmed);
  const isPhone = /^[+\d][\d\s\-()]{6,}$/.test(trimmed);
  if (!isEmail && !isPhone) {
    return { ok: false, message: 'Enter a valid email address or phone number to open your account.' };
  }
  const credential: CustomerCredential = {
    name: name.trim(),
    email: isEmail ? trimmed.toLowerCase() : '',
    phone: isEmail ? '' : normalizePhone(trimmed),
    password,
    createdAt: new Date().toISOString()
  };
  persistCredential(credential);
  return { ok: true, credential };
};

export const updateCredentialPassword = (
  identifier: string,
  newPassword: string
): { ok: boolean; message: string; credential?: CustomerCredential } => {
  const credential = findCredentialByIdentifier(identifier);
  if (!credential) {
    return { ok: false, message: 'No account found with that email or phone number.' };
  }
  const updated = { ...credential, password: newPassword };
  persistCredential(updated);
  return { ok: true, message: 'Password updated. Sign in with your new password.', credential: updated };
};

export const buildAccountFromCredential = (
  credential: CustomerCredential,
  existing?: CustomerAccount | null
): CustomerAccount => {
  if (existing) {
    const emailMatches =
      Boolean(existing.email) &&
      Boolean(credential.email) &&
      normalizeIdentifier(existing.email) === normalizeIdentifier(credential.email);
    const phoneMatches =
      Boolean(existing.phone) &&
      Boolean(credential.phone) &&
      normalizeIdentifier(existing.phone) === normalizeIdentifier(credential.phone);
    if (emailMatches || phoneMatches) {
      return {
        ...existing,
        name: credential.name || existing.name,
        email: credential.email || existing.email,
        phone: credential.phone || existing.phone,
        password: credential.password,
        signedInAt: new Date().toISOString()
      };
    }
  }
  return {
    id: `customer-${Date.now()}`,
    name: credential.name,
    email: credential.email,
    phone: credential.phone,
    points: 0,
    addresses: [],
    savedCards: [],
    createdAt: new Date().toISOString(),
    password: credential.password,
    signedInAt: new Date().toISOString()
  };
};

export const CUSTOMER_TOKEN_KEY = 'ib_anasa_customer_token';

export const getCustomerToken = (): string | undefined => {
  try {
    return sessionStorage.getItem(CUSTOMER_TOKEN_KEY) || undefined;
  } catch {
    return undefined;
  }
};

export const clearCustomerToken = (): void => {
  try {
    sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    // storage unavailable
  }
};

export interface CustomerAuthResult {
  ok: boolean;
  account?: CustomerAccount;
  token?: string;
  localSideEffects?: boolean;
  message?: string;
}

const toErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof ApiRequestError ? error.message : fallback;

const storeOrClearToken = (token?: string): void => {
  try {
    if (token) sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    else sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
  } catch {
    // storage unavailable
  }
};

/**
 * API-first when a backend is configured (POST /api/auth/customer/login,
 * contract §5.1). Otherwise falls back to the local browser credentials.
 */
export const signInCustomer = async (
  identifier: string,
  password: string,
  existing?: CustomerAccount | null
): Promise<CustomerAuthResult> => {
  if (!isBackendConfigured()) {
    const local = authenticate(identifier, password);
    if (!local.ok || !local.credential) {
      return { ok: false, message: local.message ?? 'Sign in failed.' };
    }
    return { ok: true, account: buildAccountFromCredential(local.credential, existing) };
  }
  try {
    const res = await requestJson<{ token?: string; customer?: Record<string, unknown> }>('/api/auth/customer/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    storeOrClearToken(res.token);
    return { ok: true, account: normalizeApiCustomer(res.customer ?? {}), token: res.token };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error, 'Sign in failed. Please try again.') };
  }
};

export const registerCustomer = async (
  name: string,
  identifier: string,
  password: string,
  existing?: CustomerAccount | null
): Promise<CustomerAuthResult> => {
  if (!isBackendConfigured()) {
    const created = createCredential(name, identifier, password);
    if (!created.ok || !created.credential) {
      return { ok: false, message: created.message ?? 'Could not create your account.' };
    }
    return {
      ok: true,
      account: buildAccountFromCredential(created.credential, existing),
      localSideEffects: true
    };
  }
  try {
    const res = await requestJson<{ token?: string; customer?: Record<string, unknown> }>('/api/auth/customer/register', {
      method: 'POST',
      body: JSON.stringify({ name, identifier, password })
    });
    storeOrClearToken(res.token);
    return { ok: true, account: normalizeApiCustomer(res.customer ?? {}), token: res.token };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error, 'Could not create your account. Please try again.') };
  }
};

export const resetCustomerPassword = async (
  identifier: string,
  newPassword: string
): Promise<{ ok: boolean; message: string; credential?: CustomerCredential }> => {
  if (!isBackendConfigured()) {
    return updateCredentialPassword(identifier, newPassword);
  }
  try {
    await requestJson('/api/auth/customer/reset-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, new_password: newPassword })
    });
    return { ok: true, message: 'Password updated. Sign in with your new password.' };
  } catch (error) {
    return {
      ok: false,
      message: toErrorMessage(error, 'Could not reset your password. Please try again.')
    };
  }
};