export type ShopCart = Record<string, number>;
export const cartKey = (userId: string) => `rb-cart-${userId}`;
export function parseCart(raw: string | null): ShopCart {
  try {
    const data: unknown = JSON.parse(raw || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter(
        ([, v]) =>
          typeof v === "number" && Number.isInteger(v) && v > 0 && v <= 1000,
      ),
    );
  } catch {
    return {};
  }
}
export function readShopCart(userId: string): ShopCart {
  try {
    const own = parseCart(sessionStorage.getItem(cartKey(userId)));
    if (userId !== "guest" && !sessionStorage.getItem(`rb-pending-${userId}`)) {
      const guest = parseCart(sessionStorage.getItem(cartKey("guest")));
      for (const [id, qty] of Object.entries(guest))
        own[id] = Math.min(1000, (own[id] || 0) + qty);
      if (Object.keys(guest).length) {
        sessionStorage.setItem(cartKey(userId), JSON.stringify(own));
        sessionStorage.removeItem(cartKey("guest"));
      }
    }
    return own;
  } catch {
    return {};
  }
}
