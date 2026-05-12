import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { catalogApi } from '../api/catalogApi';
import { cartApi } from '../api/cartApi';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../store/authStore';
import type { CatalogProduct, CatalogProductVariant } from '../types/catalog';
import type { CartResponse } from '../types/cart';

interface CustomerResponse {
  data?: { id: string; [key: string]: unknown };
  id?: string;
  [key: string]: unknown;
}

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

const extractCustomer = (res: unknown): { id?: string } => {
  if (typeof res === 'object' && res !== null) {
    if ('data' in res) {
      return (res as Record<string, unknown>).data as { id?: string };
    }
    if ('id' in res) {
      return res as { id?: string };
    }
  }
  return {};
};

const useCustomerId = () => {
    const accountId = useAuthStore((state) => state.user?.accountId);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchCustomerId = async () => {
            if (!accountId) {
                setCustomerId(null);
                return;
            }

            setLoading(true);
            try {
                const res = await userApi.getCustomerByAccountId(accountId);
                if (isMounted) {
                    // user-service trả Customer trực tiếp (không wrap ApiResponse)
                    // axiosClient interceptor đã unwrap response.data → res = Customer object
                    const customer = extractCustomer(res);
                    setCustomerId(customer.id ?? null);
                }
            } catch {
                if (isMounted) {
                    setCustomerId(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCustomerId();

        return () => {
            isMounted = false;
        };
    }, [accountId]);

    return { customerId, loading };
};

export const Home = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Home Page</h1>
            <p>Trang chủ - Trưng bày sản phẩm</p>
        </div>
    );
};

export const ProductList = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Danh sách sản phẩm</h1>
            <p>Trang danh sach san pham do ban ban phu trach.</p>
        </div>
    );
};

export const ProductDetail = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Chi tiết sản phẩm</h1>
            <p>Trang chi tiet san pham do ban ban phu trach.</p>
        </div>
    );
};

export const Cart = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { customerId, loading: customerLoading } = useCustomerId();
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [variantMap, setVariantMap] = useState<Record<string, CatalogProductVariant>>({});
    const [productMap, setProductMap] = useState<Record<string, CatalogProduct>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchCart = async () => {
            if (!customerId) {
                setCart(null);
                return;
            }

            setLoading(true);
            try {
                const res = await cartApi.getCartByCustomerId(customerId);
                if (isMounted) {
                    setCart(res);
                }
            } catch (err) {
                if (isMounted) {
                    const message = err instanceof Error ? err.message : 'Khong the tai gio hang';
                    setError(message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCart();

        return () => {
            isMounted = false;
        };
    }, [customerId]);

    useEffect(() => {
        let isMounted = true;

        const loadDetails = async () => {
            if (!cart?.items?.length) {
                setVariantMap({});
                return;
            }

            try {
                const variantResults = await Promise.all(
                    cart.items.map((item) => catalogApi.getVariantById(item.productVariantId))
                );
                if (!isMounted) {
                    return;
                }

                const variantLookup = variantResults.reduce<Record<string, CatalogProductVariant>>((acc, variant) => {
                    acc[variant.id] = variant;
                    return acc;
                }, {});

                setVariantMap(variantLookup);

                const productRes = await catalogApi.getProducts(0, 200);
                if (!isMounted) {
                    return;
                }
                const productLookup = (productRes.content ?? []).reduce<Record<string, CatalogProduct>>((acc, product) => {
                    acc[product.id] = product;
                    return acc;
                }, {});
                setProductMap(productLookup);
            } catch {
                if (isMounted) {
                    setVariantMap({});
                    setProductMap({});
                }
            }
        };

        loadDetails();

        return () => {
            isMounted = false;
        };
    }, [cart]);

    const subtotal = useMemo(() => {
        if (!cart?.items) {
            return 0;
        }
        return cart.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    }, [cart]);

    const handleUpdateQty = async (itemId: string, quantity: number) => {
        if (!customerId) {
            return;
        }
        try {
            const res = await cartApi.updateItemQuantity(customerId, itemId, { quantity });
            setCart(res);
            window.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Cap nhat gio hang that bai';
            toast.error(message);
        }
    };

    const handleRemove = async (itemId: string) => {
        if (!customerId) {
            return;
        }
        try {
            const res = await cartApi.removeItem(customerId, itemId);
            setCart(res);
            window.dispatchEvent(new CustomEvent('cart:updated'));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Xoa san pham that bai';
            toast.error(message);
        }
    };

    return (
        <div style={{ padding: '3.5rem 6vw' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)', marginBottom: '0.5rem' }}>Gio hang</h1>
            <p style={{ color: 'var(--color-gray-500)', marginBottom: '2rem' }}>Kiem tra san pham va so luong truoc khi dat hang.</p>

            {!isAuthenticated && (
                <div style={{ padding: '2rem', borderRadius: '12px', background: 'rgba(201,169,110,0.1)' }}>
                    <p>Vui long dang nhap de xem gio hang.</p>
                    <button className="btn btn--primary" style={{ marginTop: '1rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/login')}>
                        Đăng nhập
                    </button>
                </div>
            )}

            {isAuthenticated && (customerLoading || loading) && <p>Dang tai gio hang...</p>}
            {isAuthenticated && error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

            {isAuthenticated && !loading && cart?.items?.length === 0 && (
                <div style={{ padding: '2rem', borderRadius: '12px', background: '#fff' }}>
                    <p>Gio hang dang trong. Hay them san pham tu <Link to="/products">danh sach san pham</Link>.</p>
                </div>
            )}

            {isAuthenticated && cart?.items?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                        {cart.items.map((item) => {
                            const variant = variantMap[item.productVariantId];
                            const productName = variant ? productMap[variant.productId]?.name : undefined;
                            const imageUrl = variant?.imageUrl;

                            return (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--color-cream)', overflow: 'hidden', flexShrink: 0 }}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={productName ?? 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
                                                Không có ảnh
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{productName ?? 'San pham'}</p>
                                        <p style={{ margin: '0.35rem 0', color: 'var(--color-gray-500)' }}>{formatCurrency(Number(item.unitPrice))}</p>
                                        <p style={{ margin: 0, color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>Variant: {item.productVariantId}</p>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: 0 }}
                                    >
                                        Xoa
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer' }}
                                    >
                                        -
                                    </button>
                                    <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button
                                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer' }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', height: 'fit-content', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Tong tam tinh</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <span>Subtotal</span>
                            <strong>{formatCurrency(subtotal)}</strong>
                        </div>
                        <button
                            className="btn btn--primary"
                            style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                            onClick={() => navigate('/checkout')}
                        >
                            Tien hanh thanh toan
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export const Checkout = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Thanh toán</h1>
            <p>Nhập thông tin giao hàng</p>
            <button className="btn btn--primary" style={{ marginTop: '1rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
                Quay lại
            </button>
        </div>
    );
};

export const Payment = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Giả lập cổng Thanh toán (VNPay...)</h1>
            <p>Thực hiện thanh toán...</p>
        </div>
    );
};

export const Dashboard = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-error)' }}>Dashboard (Nội bộ)</h1>
            <p>Trang quản trị dành riêng cho nhân viên và admin</p>
        </div>
    );
};

export { VerifyEmail } from './VerifyEmail';
export { ForgotPassword } from './ForgotPassword';
export { ResetPassword } from './ResetPassword';
