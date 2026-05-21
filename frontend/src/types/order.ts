export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'DELIVERY_FAILED';

export type PaymentMethod = 'COD' | 'VNPAY' | 'BANK_TRANSFER';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItemResponse {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  recipientName: string;
  shippingAddress: string;
  email: string;
  phone: string;
  note?: string;
  cancelReason?: string;
  orderDate: string;
  updatedAt: string;
  items: OrderItemResponse[];
}

export interface CreateOrderRequest {
  customerId: string;
  recipientName: string;
  shippingAddress: string;
  email: string;
  phone: string;
  note?: string;
  paymentMethod: PaymentMethod;
  selectedItemIds: string[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  cancelReason?: string;
}

export interface GuestOrderItem {
  productVariantId: string;
  quantity: number;
}

export interface CreateGuestOrderRequest {
  recipientName: string;
  shippingAddress: string;
  email: string;
  phone: string;
  note?: string;
  items: GuestOrderItem[];
}
