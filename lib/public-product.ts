import { productDescription, productStorage } from "./product-storage";
// This allowlist is intentionally independent of the full admin/database row.
export function publicProduct(p: {
  id: string;
  title: string;
  category: string;
  description: string | null;
  origin: string | null;
  species: string | null;
  unitWeight: string | null;
  imageUrl: string | null;
  packageType: string;
  priceNetto: number;
  vatRate: number;
  stock: number;
  stockStatus: string;
  translations: Record<string, { title: string; description: string }>;
}) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    description: productDescription(p.description),
    origin: p.origin,
    species: p.species,
    unitWeight: p.unitWeight,
    imageUrl: p.imageUrl,
    packageType: p.packageType,
    priceNetto: p.priceNetto,
    vatRate: p.vatRate,
    stock: p.stock,
    stockStatus: p.stockStatus,
    active: true,
    images: [],
    storageCondition: productStorage(p),
    translations: Object.fromEntries(
      ["fr", "en", "ru", "ar"]
        .filter((l) => p.translations?.[l])
        .map((l) => [
          l,
          {
            title: p.translations[l].title,
            description: productDescription(p.translations[l].description),
          },
        ]),
    ),
  };
}
