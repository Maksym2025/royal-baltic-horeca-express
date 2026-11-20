export const processingMethods = ["unprocessed", "hot-smoked", "cold-smoked", "smoked", "salted", "dried", "unspecified"] as const;
export type ProcessingMethod = (typeof processingMethods)[number];
export type CatalogFacets = {
  storageCondition?: "chilled" | "frozen" | "unspecified";
  temperatureMinC?: number | null;
  temperatureMaxC?: number | null;
  processingMethod?: ProcessingMethod;
};
type ProductText = CatalogFacets & {
  title?: string; description?: string | null;
  translations?: Record<string, { title?: string; description?: string }>;
};
export function productProcessing(product: ProductText): ProcessingMethod {
  if (product.processingMethod && processingMethods.includes(product.processingMethod)) return product.processingMethod;
  const text = [product.title, product.description, ...Object.values(product.translations || {}).flatMap(t => [t.title, t.description])].join(" ").normalize("NFKC").toLowerCase();
  const hot = /hot[ -]?smok|fum[ée]\w* à chaud|heißgeräuch|heissgeräuch|горячего копч|горяч[её]го копч/u.test(text);
  const cold = /cold[ -]?smok|fum[ée]\w* à froid|kaltgeräuch|холодного копч/u.test(text);
  if (hot !== cold) return hot ? "hot-smoked" : "cold-smoked";
  if (hot || cold || /smoked|fum[ée]|geräuch|копч[её]/u.test(text)) return "smoked";
  if (/dried|air[ -]?dried|s[ée]ch[ée]|getrocknet|суш[её]н|вялен/u.test(text)) return "dried";
  if (/salted|malossol|sal[ée](?:e|s)?(?:\s|$|,)|gesalzen|малосол|малосоль|сол[её]н/u.test(text)) return "salted";
  return "unspecified";
}
export function matchesProcessing(product: ProductText, method: string) {
  const actual = productProcessing(product);
  return !method || actual === method || (method === "smoked" && (actual === "hot-smoked" || actual === "cold-smoked"));
}
export function temperatureLabel(product: CatalogFacets, locale: string): string | null {
  const min = product.temperatureMinC, max = product.temperatureMaxC;
  if (min == null && max == null) return null;
  if ([min, max].some(n => n != null && (typeof n !== "number" || !Number.isFinite(n) || n < -80 || n > 40))) return null;
  if (min != null && max != null && min > max) return null;
  const number = (n: number) => new Intl.NumberFormat(locale, { signDisplay: n > 0 ? "always" : "auto", maximumFractionDigits: 1 }).format(n).replace(/-/g, "−");
  if (min == null) return `≤ ${number(max!)} °C`;
  if (max == null) return `≥ ${number(min)} °C`;
  return `${number(min)}${min === max ? "" : `…${number(max)}`} °C`;
}
