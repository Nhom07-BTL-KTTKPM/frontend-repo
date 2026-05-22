export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'DELIVERY_FAILED';

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  price: number;
}

export interface OrderResponse {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: string;
  shippingAddress?: string;
  items: OrderItemResponse[];
  createdAt: string;
}
