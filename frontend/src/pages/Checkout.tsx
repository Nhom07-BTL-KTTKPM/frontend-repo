import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cartApi } from '../api/cartApi';
import { catalogApi } from '../api/catalogApi';
import { orderApi } from '../api/orderApi';
import { addressApi } from '../api/addressApi';
import { userApi } from '../api/userApi';
import { PaymentMethod } from '../types/order';
import type { CartResponse } from '../types/cart';
import type { CatalogProductVariant } from '../types/catalog';
import { toast } from 'sonner';

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

export const Checkout = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [variants, setVariants] = useState<Record<string, CatalogProductVariant>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [recipientName, setRecipientName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.COD);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thanh toán');
            navigate('/login?redirect=/checkout');
            return;
        }

        const fetchInitialData = async () => {
            try {
                // 1. Get customerId
                const userRes = await userApi.getCustomerByAccountId(user!.accountId);
                const payload = userRes as unknown as Record<string, unknown>;
                const cId = ((payload.data as Record<string, unknown>)?.id ?? payload.id) as string;
                
                if (!cId) {
                    toast.error('Không tìm thấy thông tin khách hàng');
                    return;
                }
                setCustomerId(cId);

                // 2. Fetch default address
                try {
                    const addressRes = await addressApi.getDefaultAddress(cId);
                    const addr = (addressRes as unknown as Record<string, unknown>).data ?? addressRes;
                    if (addr && addr.street) {
                        setShippingAddress(`${addr.street}, ${addr.ward}, ${addr.district}, ${addr.city}`);
                        if (addr.recipientName) setRecipientName(addr.recipientName);
                        if (addr.phone) setPhone(addr.phone);
                    }
                } catch {
                    console.log('No default address found');
                }

                // Fill from user profile if not filled by address
                if (!recipientName && user?.fullName) setRecipientName(user.fullName);
                if (!email && user?.email) setEmail(user.email);
                if (!phone && user?.phoneNumber) setPhone(user.phoneNumber);

                // 3. Fetch cart
                const cartRes = await cartApi.getCartByCustomerId(cId);
                const cartData = (cartRes as unknown as Record<string, unknown>).data ?? cartRes;
                setCart(cartData);

                // 4. Fetch variants
                if (cartData && cartData.items && cartData.items.length > 0) {
                    const variantData: Record<string, CatalogProductVariant> = {};
                    for (const item of cartData.items) {
                        try {
                            const vRes = await catalogApi.getVariantById(item.productVariantId);
                            const vData = (vRes as unknown as Record<string, unknown>).data ?? vRes;
                            variantData[item.productVariantId] = vData as CatalogProductVariant;
                        } catch {
                            console.error('Failed to fetch variant', item.productVariantId);
                        }
                    }
                    setVariants(variantData);
                }
            } catch {
                toast.error('Lỗi tải thông tin thanh toán');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user, navigate]);

    const calculateTotal = () => {
        if (!cart?.items) return 0;
        return cart.items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId) return;
        if (!recipientName || !email || !phone || !shippingAddress) {
            toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
            return;
        }

        if (!cart?.items || cart.items.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
        }

        setSubmitting(true);
        try {
            await orderApi.createOrder({
                customerId,
                recipientName,
                email,
                phone,
                shippingAddress,
                note,
                paymentMethod
            });

            toast.success('Đặt hàng thành công!');
            // Chuyển hướng theo phương thức thanh toán
            if (paymentMethod === PaymentMethod.COD) {
                navigate('/orders'); // Redirect to order history
            } else {
                navigate('/payment'); // Giả lập payment gateway
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Lỗi khi đặt hàng');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '4rem', textAlign: 'center' }}>Đang tải thông tin thanh toán...</div>;
    }

    if (!cart?.items || cart.items.length === 0) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--color-gold)' }}>Giỏ hàng trống</h1>
                <p style={{ marginTop: '1rem' }}>Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
                <button className="btn btn--primary" style={{ marginTop: '1rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/products')}>
                    Tiếp tục mua sắm
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)', textAlign: 'center', marginBottom: '2rem' }}>Thanh toán</h1>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Left Column: Form */}
                <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Thông tin giao hàng</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Họ và tên *</label>
                            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Số điện thoại *</label>
                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Địa chỉ giao hàng chi tiết *</label>
                        <textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} required rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }} />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ghi chú (Tùy chọn)</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Phương thức thanh toán</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === PaymentMethod.COD ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === PaymentMethod.COD ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value={PaymentMethod.COD} checked={paymentMethod === PaymentMethod.COD} onChange={() => setPaymentMethod(PaymentMethod.COD)} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Thanh toán khi nhận hàng (COD)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === PaymentMethod.VNPAY ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === PaymentMethod.VNPAY ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value={PaymentMethod.VNPAY} checked={paymentMethod === PaymentMethod.VNPAY} onChange={() => setPaymentMethod(PaymentMethod.VNPAY)} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Thanh toán qua VNPAY</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === PaymentMethod.BANK_TRANSFER ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value={PaymentMethod.BANK_TRANSFER} checked={paymentMethod === PaymentMethod.BANK_TRANSFER} onChange={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Chuyển khoản ngân hàng</span>
                        </label>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div style={{ background: '#f9f9f9', padding: '2rem', borderRadius: '12px', height: 'fit-content', position: 'sticky', top: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Đơn hàng của bạn</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '40vh', overflowY: 'auto' }}>
                        {cart.items.map((item) => {
                            const variant = variants[item.productVariantId];
                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    {variant?.imageUrl ? (
                                        <img src={variant.imageUrl} alt={variant.variantName} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ width: '60px', height: '60px', background: '#ddd', borderRadius: '8px' }}></div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-black)' }}>{variant?.variantName || 'Sản phẩm'}</h4>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', margin: '4px 0' }}>SL: {item.quantity}</p>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>
                                        {formatCurrency(item.unitPrice * item.quantity)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ borderTop: '1px solid #ddd', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tạm tính</span>
                            <strong>{formatCurrency(calculateTotal())}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Phí giao hàng</span>
                            <strong>Miễn phí</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', color: 'var(--color-gold)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #ddd' }}>
                            <strong>Tổng cộng</strong>
                            <strong>{formatCurrency(calculateTotal())}</strong>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        style={{ 
                            width: '100%', padding: '15px', marginTop: '2rem', 
                            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', 
                            color: 'white', border: 'none', borderRadius: '8px', 
                            fontSize: '1.1rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.7 : 1
                        }}
                    >
                        {submitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                    </button>
                    <button 
                        type="button"
                        onClick={() => navigate('/cart')}
                        style={{ 
                            width: '100%', padding: '15px', marginTop: '1rem', 
                            background: 'transparent', color: 'var(--color-gray-600)', 
                            border: '1px solid var(--color-gray-300)', borderRadius: '8px', 
                            fontSize: '1rem', fontWeight: 500, cursor: 'pointer'
                        }}
                    >
                        Quay lại giỏ hàng
                    </button>
                </div>
            </form>
        </div>
    );
};
