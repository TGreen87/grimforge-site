export const storageKeys = {
  wishlist: "orr_wishlist",
  cart: "orr_cart_v1",
  user: "orr_user",
} as const;

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

export function migrateKey(oldKey: string, newKey: string) {
  try {
    const existing = localStorage.getItem(oldKey);
    if (existing && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, existing);
      localStorage.removeItem(oldKey);
    }
  } catch {
    // no-op
  }
}
