import { z } from "zod";
import type { LiveProduct } from "./live-api";
export type AnnouncedProduct = LiveProduct & {
  launchMode: "preorder" | "planned";
  expectedAt: string | null;
  demandThreshold: number;
  packageTranslations: Record<string, string>;
};
export type Preorder = {
  id: string;
  productId: string;
  quantity: number;
  status: "reserved" | "cancelled" | "converted";
  orderId: string | null;
  title: string;
  translations: LiveProduct["translations"];
  packageType: string;
  createdAt: string;
};
export type IntentData = {
  products: AnnouncedProduct[];
  counts: Record<string, number>;
  liked: string[];
  preorders: Preorder[];
};
export const intentSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("reserve"),
      productId: z.string().uuid(),
      quantity: z.number().int().min(0).max(1000),
    })
    .strict(),
  z
    .object({
      action: z.literal("interest"),
      productId: z.string().uuid(),
      interested: z.boolean(),
    })
    .strict(),
]);
export function mergeAnnouncements(
  products: LiveProduct[],
  announcements: AnnouncedProduct[],
): LiveProduct[] {
  const overrides = new Map(announcements.map((p) => [p.id, p]));
  return [
    ...products.map((p) => overrides.get(p.id) ?? p),
    ...announcements.filter((p) => !products.some((x) => x.id === p.id)),
  ];
}
