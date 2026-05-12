import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../api/orderApi';
import { userApi } from '../api/userApi';
import type { OrderResponse } from '../types/order';
import { OrderStatus, PaymentStatus } from '../types/order';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

const formatCurrency = (value?: number) => {
    if (value === null || value === undefined) {
        return '--';
    }
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    } catch {
        return dateString;
    }
};

const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.PENDING:
            return { color: '#f59e0b', label: 'Chờ xác nhận', icon: <Clock size={16} /> };
        case OrderStatus.CONFIRMED:
            return { color: '#3b82f6', label: 'Đã xác nhận', icon: <CheckCircle size={16} /> };
        case OrderStatus.PROCESSING:
            return { color: '#8b5cf6', label: 'Đang xử lý', icon: <Package size={16} /> };
        case OrderStatus.SHIPPING:
            return { color: '#0ea5e9', label: 'Đang giao hàng', icon: <Truck size={16} /> };
        case OrderStatus.DELIVERED:
            return { color: '#10b981', label: 'Đã giao thành công', icon: <CheckCircle size={16} /> };
        case OrderStatus.CANCELLED:
            return { color: '#ef4444', label: 'Đã hủy', icon: <XCircle size={16} /> };
        case OrderStatus.REFUNDED:
            return { color: '#64748b', label: 'Đã hoàn tiền', icon: <XCircle size={16} /> };
        default:
            return { color: '#6b7280', label: status, icon: <Clock size={16} /> };
    }
};

const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
        case PaymentStatus.PENDING: return 'Chưa thanh toán';
        case PaymentStatus.PAID: return 'Đã thanh toán';
        case PaymentStatus.FAILED: return 'Thanh toán thất bại';
        case PaymentStatus.REFUNDED: return 'Đã hoàn tiền';
        default: return status;
    }
};

export const OrderHistory = () => {
    const { user } = useAuthStore();
    const [orderList, setOrderList] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.accountId) return;
            try {
                // 1. Get customerId
                const userRes = await userApi.getCustomerByAccountId(user.accountId);
                const payload = userRes as unknown as Record<string, unknown>;
                const cId = ((payload.data as Record<string, unknown>)?.id ?? payload.id) as string;
                
                if (!cId) {
                    toast.error('Không tìm thấy thông tin khách hàng');
                    return;
                }

                // 2. Get orders
                const ordersRes = await orderApi.getOrdersByCustomerId(cId);
                const data = (ordersRes as unknown as Record<string, unknown>).data ?? ordersRes;
                setOrderList(Array.isArray(data) ? data : []);
            } catch {
                toast.error('Lỗi khi tải danh sách đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải lịch sử đơn hàng...</div>;
    }

    if (orderList.length === 0) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)' }}>Lịch sử đơn hàng</h1>
                <p style={{ marginTop: '2rem', color: 'var(--color-gray-500)' }}>Bạn chưa có đơn hàng nào.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)', marginBottom: '2rem' }}>Lịch sử đơn hàng</h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orderList.map(order => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                        <div key={order.id} style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Đơn hàng <span style={{ color: 'var(--color-gold)' }}>#{order.orderCode}</span></h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>Đặt lúc: {formatDate(order.orderDate)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusConfig.color, background: `${statusConfig.color}15`, padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {statusConfig.icon}
                                    {statusConfig.label}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {order.items?.map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.productName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                                        ) : (
                                            <div style={{ width: '60px', height: '60px', background: '#ddd', borderRadius: '6px' }}></div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.productName}</h4>
                                            {item.variantName && <p style={{ margin: '2px 0', fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>Phân loại: {item.variantName}</p>}
                                            <p style={{ margin: 0, fontSize: '0.85rem' }}>x{item.quantity}</p>
                                        </div>
                                        <div style={{ fontWeight: 500 }}>
                                            {formatCurrency(item.totalPrice)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
                                    <p style={{ margin: '0 0 4px 0' }}>Thanh toán: <strong>{order.paymentMethod}</strong> ({getPaymentStatusLabel(order.paymentStatus)})</p>
                                    <p style={{ margin: 0 }}>Giao đến: {order.recipientName} - {order.shippingAddress}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', marginRight: '10px' }}>Tổng tiền:</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
