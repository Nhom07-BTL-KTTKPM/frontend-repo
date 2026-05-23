import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { orderApi } from '../api/orderApi';
import { userApi } from '../api/userApi';
import type { OrderResponse, OrderStatus, PaymentStatus } from '../types/order';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { ReviewForm } from '../components/review/ReviewForm';

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
        case 'PENDING':
            return { color: '#f59e0b', label: 'Chờ xác nhận', icon: <Clock size={16} /> };
        case 'CONFIRMED':
            return { color: '#3b82f6', label: 'Đã xác nhận', icon: <CheckCircle size={16} /> };
        case 'PROCESSING':
            return { color: '#8b5cf6', label: 'Đang xử lý', icon: <Package size={16} /> };
        case 'SHIPPING':
            return { color: '#0ea5e9', label: 'Đang giao hàng', icon: <Truck size={16} /> };
        case 'DELIVERED':
            return { color: '#10b981', label: 'Đã giao thành công', icon: <CheckCircle size={16} /> };
        case 'CANCELLED':
            return { color: '#ef4444', label: 'Đã hủy', icon: <XCircle size={16} /> };
        case 'REFUNDED':
            return { color: '#64748b', label: 'Đã hoàn tiền', icon: <XCircle size={16} /> };
        default:
            return { color: '#6b7280', label: status, icon: <Clock size={16} /> };
    }
};

const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
        case 'PENDING': return 'Chưa thanh toán';
        case 'PAID': return 'Đã thanh toán';
        case 'FAILED': return 'Thanh toán thất bại';
        case 'REFUNDED': return 'Đã hoàn tiền';
        default: return status;
    }
};

export const OrderHistory = () => {
    const { user } = useAuthStore();
    const [orderList, setOrderList] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    // Merge state review từ nhánh HEAD
    const [reviewingItem, setReviewingItem] = useState<{ productId: string, orderItemId: string, customerId: string } | null>(null);
    const [customerId, setCustomerId] = useState<string>('');

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user?.accountId) return;
            try {
                // 1. Get customerId
                const userRes = await userApi.getCustomerByAccountId(user.accountId);
                const payload = userRes as unknown as { data?: { id?: string }, id?: string };
                const cId = payload.data?.id ?? payload.id;
                
                if (!cId) {
                    toast.error('Không tìm thấy thông tin khách hàng');
                    return;
                }
                setCustomerId(cId);

                // 2. Get orders
                const ordersRes = await orderApi.getOrdersByCustomerId(cId);
                const data = ((ordersRes as unknown as { data?: OrderResponse[] }).data ?? ordersRes) as OrderResponse[];
                setOrderList(Array.isArray(data) ? data : []);
            } catch {
                toast.error('Lỗi khi tải danh sách đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    if (!user) {
        return <div style={{ padding: '4rem 0', textAlign: 'center' }}>Vui lòng đăng nhập để xem đơn hàng.</div>;
    }

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
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <div style={{ fontWeight: 500 }}>
                                                {formatCurrency(item.totalPrice)}
                                            </div>
                                            {/* Merge nút Đánh giá từ HEAD */}
                                            {order.status === 'DELIVERED' && (
                                                <button 
                                                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--color-gold)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    onClick={() => setReviewingItem({ 
                                                        productId: (item as any).productId || (item as any).productVariantId || '', 
                                                        orderItemId: item.id,
                                                        customerId: customerId
                                                    })}
                                                >
                                                    Đánh giá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
                                    <p style={{ margin: '0 0 4px 0' }}>Thanh toán: <strong>{order.paymentMethod}</strong> ({getPaymentStatusLabel(order.paymentStatus)})</p>
                                    <p style={{ margin: 0 }}>Giao đến: {order.recipientName} - {order.shippingAddress}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', marginRight: '10px' }}>Tổng tiền:</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold)' }}>{formatCurrency(order.total)}</span>
                                    </div>
                                    <Link
                                        to={`/orders/${order.id}`}
                                        style={{ padding: '8px 14px', borderRadius: '6px', background: '#f3f4f6', color: '#374151', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        Xem chi tiết
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Merge Modal Đánh Giá từ nhánh HEAD */}
            {reviewingItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ width: '100%', maxWidth: 600 }}>
                        <ReviewForm 
                            productId={reviewingItem.productId} 
                            orderItemId={reviewingItem.orderItemId}
                            customerId={reviewingItem.customerId}
                            onCancel={() => setReviewingItem(null)}
                            onSuccess={() => {
                                toast.success('Cảm ơn bạn đã đánh giá!');
                                setReviewingItem(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;