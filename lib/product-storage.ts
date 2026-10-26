export const storageConditions = ["chilled", "frozen", "unspecified"] as const;
export type StorageCondition = (typeof storageConditions)[number];
// A reserved description line preserves compatibility with the existing database.
// It is written by the product editor and removed from customer-facing text.
const marker = /^\[cold-chain:(chilled|frozen|unspecified)\]\s*$/gm;
export function productDescription(description: string | null | undefined) {
  return (description || "").replace(marker, "").trim();
}
export function productStorage(product: {
  storageCondition?: StorageCondition;
  title?: string;
  description?: string | null;
  category?: string;
}): StorageCondition {
  if (
    product.storageCondition &&
    storageConditions.includes(product.storageCondition)
  )
    return product.storageCondition;
  const explicit = /^\[cold-chain:(chilled|frozen|unspecified)\]\s*$/m.exec(
    product.description || "",
  );
  if (explicit) return explicit[1] as StorageCondition;
  const text =
    `${product.title || ""} ${product.description || ""} ${product.category || ""}`
      .normalize("NFKC")
      .toLowerCase();
  const frozen =
    /(?:frozen|surgel|congel|tiefkühl|tiefkuehl|gefroren|заморож|морожен|مجمد|[−-]\s*18\s*°?\s*c)/u.test(
      text,
    );
  const chilled =
    /(?:chilled|fresh|frais|fraîch|frisch|gekühlt|gekuhlt|охлажд|свеж|مبرد|طازج)/u.test(
      text,
    );
  return frozen && !chilled
    ? "frozen"
    : chilled && !frozen
      ? "chilled"
      : "unspecified";
}
export function withProductStorage(
  description: string | null | undefined,
  storage: StorageCondition | undefined,
) {
  if (storage === undefined) return description;
  return `${productDescription(description)}\n[cold-chain:${storage}]`.trim();
}
