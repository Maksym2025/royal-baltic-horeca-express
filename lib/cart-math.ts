/** Weight labels are display data; unknown units must never become €/kg prices. */
export function kilograms(label: string | null | undefined): number | null {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*(kg|кг|g|г)\s*$/iu.exec(label || "");
  if (!match) return null;
  const value = Number(match[1].replace(",", ".")) / (/^(g|г)$/iu.test(match[2]) ? 1000 : 1);
  return Number.isFinite(value) && value > 0 ? value : null;
}
export function remainingCartons(stock: number, current: number): number {
  return Math.max(0, Math.min(1000, Math.floor(stock)) - Math.max(0, current));
}
