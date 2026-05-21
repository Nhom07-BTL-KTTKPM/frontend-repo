export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 'COD' | 'VNPAY' | 'BANK_TRANSFER';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type VoucherType = 'PERCENT' | 'AMOUNT' | 'FREE_SHIPPING';

export type VoucherStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';

export interface VoucherResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  quantity: number;
  maxUsagePerUser?: number | null;
  status: VoucherStatus;
  startDate: string;
  endDate: string;
  createdAt?: string;
}

export interface VoucherValidationRequest {
  customerId?: string | null;
  orderAmount: number;
  shippingFee?: number;
}

export interface VoucherValidationResponse {
  voucherId: string;
  code: string;
  valid: boolean;
  message: string;
  discountAmount: number;
  remainingQuantity: number;
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
  voucherId?: string | null;
  voucherCode?: string | null;
  shippingFee: number;
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
  selectedItemIds: string[];
  voucherCode?: string;
  shippingFee?: number;
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
  shippingFee?: number;
}
