import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cartApi } from '../api/cartApi';
import { catalogApi } from '../api/catalogApi';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { addressApi } from '../api/addressApi';
import { userApi } from '../api/userApi';
import type { PaymentMethod } from '../types/order';
import type { CartResponse } from '../types/cart';
import type { CatalogProductVariant } from '../types/catalog';
import type { Address } from '../types/address';
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
    const location = useLocation();
    const { user, isAuthenticated } = useAuthStore();
    
    const selectedItemIds: string[] = location.state?.selectedItemIds || [];
    
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [variants, setVariants] = useState<Record<string, CatalogProductVariant>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    
    const [email, setEmail] = useState('');
    const [note, setNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để thanh toán');
            navigate('/login?redirect=/checkout');
            return;
        }

        if (selectedItemIds.length === 0) {
            toast.error('Vui lòng chọn sản phẩm để thanh toán');
            navigate('/cart');
            return;
        }

        const fetchInitialData = async () => {
            try {
                // 1. Get customerId
                const userRes = await userApi.getCustomerByAccountId(user!.accountId);
                const payload = userRes as unknown as { data?: { id?: string }, id?: string };
                const cId = payload.data?.id ?? payload.id;
                
                if (!cId) {
                    toast.error('Không tìm thấy thông tin khách hàng');
                    return;
                }
                setCustomerId(cId);

                // 2. Fetch addresses
                try {
                    const addressesRes = await addressApi.getAddressesByCustomerId(cId);
                    const addressList = ((addressesRes as unknown as { data?: Address[] }).data ?? addressesRes) as Address[];
                    if (addressList && addressList.length > 0) {
                        setAddresses(addressList);
                        const defaultAddr = addressList.find(a => a.isDefault);
                        if (defaultAddr && defaultAddr.id) {
                            setSelectedAddressId(defaultAddr.id);
                        } else if (addressList[0].id) {
                            setSelectedAddressId(addressList[0].id);
                        }
                    }
                } catch {
                    console.log('No addresses found');
                }

                // Fill from user profile if not filled by address
                if (!email && user?.email) setEmail(user.email);

                // 3. Fetch cart
                let cartData: CartResponse | null = null;
                try {
                    const cartRes = await cartApi.getCartByCustomerId(cId);
                    cartData = ((cartRes as unknown as { data?: CartResponse }).data ?? cartRes) as CartResponse;
                    if (cartData && cartData.items) {
                        cartData.items = cartData.items.filter(item => selectedItemIds.includes(item.id));
                    }
                    setCart(cartData);
                } catch (err: any) {
                    if (err?.response?.status !== 404) {
                        throw err;
                    }
                }

                // 4. Fetch variants
                if (cartData && cartData.items && cartData.items.length > 0) {
                    const variantData: Record<string, CatalogProductVariant> = {};
                    for (const item of cartData.items) {
                        try {
                            const vRes = await catalogApi.getVariantById(item.productVariantId);
                            const vData = ((vRes as unknown as { data?: CatalogProductVariant }).data ?? vRes) as CatalogProductVariant;
                            variantData[item.productVariantId] = vData;
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
        
        const selectedAddress = addresses.find(a => a.id === selectedAddressId);
        
        if (!selectedAddress) {
            toast.error('Vui lòng chọn địa chỉ giao hàng');
            return;
        }
        if (!email) {
            toast.error('Vui lòng nhập email liên hệ');
            return;
        }

        if (!cart?.items || cart.items.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
        }

        setSubmitting(true);
        try {
            const shippingAddressStr = `${selectedAddress.street}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}`;
            const orderRes = await orderApi.createOrder({
                customerId,
                recipientName: selectedAddress.recipientName,
                email,
                phone: selectedAddress.phone,
                shippingAddress: shippingAddressStr,
                note,
                paymentMethod,
                selectedItemIds
            });

            const orderPayload = orderRes as unknown as { data?: { id?: string }, id?: string };
            const orderId = orderPayload.data?.id ?? orderPayload.id;

            if (!orderId) {
                throw new Error('Không lấy được orderId sau khi tạo đơn');
            }

            try {
                for (const itemId of selectedItemIds) {
                    await cartApi.removeItem(customerId, itemId);
                }
            } catch (cartError) {
                console.error('Failed to remove items from cart:', cartError);
            }

            window.dispatchEvent(new CustomEvent('cart:updated'));

            toast.success('Đặt hàng thành công!');
            // Chuyển hướng theo phương thức thanh toán
            if (paymentMethod === 'COD') {
                navigate('/orders'); // Redirect to order history
            } else if (paymentMethod === 'VNPAY') {
                const paymentRes = await paymentApi.createPayment({ orderId });
                const paymentPayload = paymentRes as unknown as { paymentUrl?: string };
                if (!paymentPayload.paymentUrl) {
                    throw new Error('Không lấy được link thanh toán VNPAY');
                }
                window.location.href = paymentPayload.paymentUrl;
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
                    
                    {/* Address Selection Box */}
                    <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '1.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-black)', fontWeight: 600 }}>Địa chỉ</h3>
                            <button type="button" onClick={() => setIsAddressModalOpen(true)} style={{ color: '#007bff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 500 }}>Chọn địa chỉ</button>
                        </div>
                        
                        {addresses.length > 0 && selectedAddressId ? (() => {
                            const selectedAddress = addresses.find(a => a.id === selectedAddressId);
                            if (!selectedAddress) return null;
                            return (
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {selectedAddress.recipientName} 
                                        <span style={{ fontWeight: 400, color: '#666', borderLeft: '1px solid #ddd', paddingLeft: '8px' }}>{selectedAddress.phone}</span>
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{selectedAddress.street}</div>
                                    <div style={{ color: '#555', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.city}</div>
                                    {selectedAddress.isDefault && (
                                        <span style={{ border: '1px solid #ee4d2d', color: '#ee4d2d', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>Mặc định</span>
                                    )}
                                </div>
                            );
                        })() : (
                            <div style={{ color: '#888', fontStyle: 'italic', padding: '1rem 0' }}>Chưa có địa chỉ giao hàng. Vui lòng chọn hoặc thêm địa chỉ mới.</div>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ghi chú (Tùy chọn)</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', resize: 'vertical' }} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-black)' }}>Phương thức thanh toán</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === 'COD' ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'COD' ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Thanh toán khi nhận hàng (COD)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === 'VNPAY' ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'VNPAY' ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value="VNPAY" checked={paymentMethod === 'VNPAY'} onChange={() => setPaymentMethod('VNPAY')} style={{ accentColor: 'var(--color-gold)' }} />
                            <span>Thanh toán qua VNPAY</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: `1px solid ${paymentMethod === 'BANK_TRANSFER' ? 'var(--color-gold)' : '#ddd'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'BANK_TRANSFER' ? '#fff9f0' : '#fff' }}>
                            <input type="radio" name="paymentMethod" value="BANK_TRANSFER" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} style={{ accentColor: 'var(--color-gold)' }} />
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

            {/* Address Selection Modal */}
            {isAddressModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-black)' }}>Địa chỉ của tôi</h2>
                            <button type="button" onClick={() => setIsAddressModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', lineHeight: 1, color: '#999' }}>&times;</button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {addresses.length === 0 ? (
                                <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>Bạn chưa lưu địa chỉ nào.</p>
                            ) : (
                                addresses.map(addr => (
                                    <div 
                                        key={addr.id} 
                                        onClick={() => {
                                            setSelectedAddressId(addr.id!);
                                            setIsAddressModalOpen(false);
                                        }}
                                        style={{ 
                                            padding: '1.5rem', 
                                            border: `1px solid ${selectedAddressId === addr.id ? '#007bff' : '#ddd'}`, 
                                            borderRadius: '8px', 
                                            cursor: 'pointer', 
                                            background: selectedAddressId === addr.id ? '#f0f8ff' : '#fff',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--color-black)' }}>{addr.recipientName}</span>
                                            <span style={{ fontWeight: 400, color: '#666', marginLeft: '8px', borderLeft: '1px solid #ddd', paddingLeft: '8px' }}>{addr.phone}</span>
                                        </div>
                                        <div style={{ color: '#555', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{addr.street}</div>
                                        <div style={{ color: '#555', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{addr.ward}, {addr.district}, {addr.city}</div>
                                        {addr.isDefault && (
                                            <span style={{ border: '1px solid #ee4d2d', color: '#ee4d2d', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px' }}>Mặc định</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd', display: 'flex' }}>
                            <button 
                                type="button" 
                                onClick={() => navigate('/profile')} 
                                style={{ 
                                    color: '#007bff', background: 'none', border: '1px solid #007bff', 
                                    cursor: 'pointer', fontSize: '1rem', fontWeight: 500, padding: '10px 20px', borderRadius: '4px',
                                    display: 'flex', alignItems: 'center', gap: '8px' 
                                }}
                            >
                                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Thêm địa chỉ mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
