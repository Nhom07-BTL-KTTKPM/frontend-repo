export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

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
}
