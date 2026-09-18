// Preserve the existing PostgreSQL values and atomic placement default.
export const statusLabels = { pending: 'NEW', confirmed: 'CONFIRMED', processing: 'PREPARING', preparing: 'PREPARING', ready: 'READY', in_transit: 'DISPATCHED', delivered: 'DELIVERED', cancelled: 'CANCELLED' } as const;
export type OrderStatus = keyof typeof statusLabels;
export const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed','cancelled'], confirmed: ['preparing','cancelled'],
  processing: ['ready','cancelled'], preparing: ['ready','cancelled'],
  ready: ['in_transit','cancelled'], in_transit: ['delivered'], delivered: [], cancelled: [],
};
