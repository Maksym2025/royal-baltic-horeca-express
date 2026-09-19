"use client";
import type { OrderStatus } from "./order-status";
export type LiveCompany = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string;
  billingAddress: string | null;
  contactPerson: string | null;
  vatNumber: string;
  paymentTerms: "INVOICE_7_DAYS" | "CARD_IMMEDIATE";
  verified: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";
  createdAt: string;
};
export type CatalogImage = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};
export type LiveProduct = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  origin: string | null;
  species: string | null;
  unitWeight: string | null;
  imageUrl: string | null;
  images: CatalogImage[];
  translations: Record<string, { title: string; description: string }>;
  packageType: string;
  priceNetto: number;
  vatRate: number;
  stock: number;
  stockStatus: string;
  active: boolean;
};
export type LiveCategory = {
  id: string;
  name: string;
  active: boolean;
  translations: Record<string, string>;
};
export type LiveSlot = {
  id: string;
  deliveryDate: string;
  window: string;
  cutoffAt: string;
  enabled: boolean;
};
export type LiveOrderItem = {
  productId: string;
  quantity: number;
  priceAtMoment: number;
  vatRate: number;
  productTitle: string;
  packageType: string;
};
export type LiveOrder = {
  id: string;
  totalAmountNetto: number;
  totalVat: number;
  totalAmountBrutto: number;
  status: OrderStatus;
  deliveryDate: string;
  deliverySlotId: string;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
  items: LiveOrderItem[];
  payments?: { status: "pending" | "succeeded" | "failed" }[];
};
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(r.status, body.error || "Request failed.");
  return body as T;
}
export type OrderRequest = {
  idempotencyKey: string;
  deliverySlotId: string;
  paymentMethod: "invoice" | "card_on_delivery" | "advance";
  items: { productId: string; quantity: number }[];
};
export const liveApi = {
  company: () =>
    apiJson<{ company: LiveCompany | null; role: "ADMIN" | "CUSTOMER" }>(
      "/api/company",
    ),
  profile: () => apiJson<LiveCompany>("/api/profile"),
  products: () => apiJson<LiveProduct[]>("/api/products"),
  categories: () => apiJson<LiveCategory[]>("/api/categories"),
  slots: () => apiJson<LiveSlot[]>("/api/delivery-slots"),
  orders: () => apiJson<LiveOrder[]>("/api/orders"),
  placeOrder: (body: OrderRequest) =>
    apiJson<{ orderId: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
