const API_KEY_STORAGE = 'monday_api_key';
const USER_STORAGE = 'monday_user';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function setApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function clearApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE);
}

export function getUser(): any {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_STORAGE);
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE, JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE);
}
