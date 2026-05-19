import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { catalogApi } from '../api/catalogApi';
import { cartApi } from '../api/cartApi';

import { useAuthStore } from '../store/authStore';
import { useCustomerId } from '../hooks/useCustomerId';
import type { CatalogProduct, CatalogProductVariant } from '../types/catalog';
import type { CartResponse } from '../types/cart';
import { ShoppingBag } from 'lucide-react';

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



export const Cart = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { customerId, loading: customerLoading } = useCustomerId();
    const [cart, setCart] = useState<CartResponse | null>(null);
    const [variantMap, setVariantMap] = useState<Record<string, CatalogProductVariant>>({});
    const [productMap, setProductMap] = useState<Record<string, CatalogProduct>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        setSelectedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (!cart?.items) return;
        if (selectedItemIds.size === cart.items.length) {
            setSelectedItemIds(new Set());
        } else {
            setSelectedItemIds(new Set(cart.items.map(i => i.id)));
        }
    };

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
            } catch (err: any) {
                if (isMounted) {
                    if (err?.response?.status === 404) {
                        setCart(null);
                        setError(null);
                    } else {
                        const message = err instanceof Error ? err.message : 'Khong the tai gio hang';
                        setError(message);
                    }
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
        return cart.items
            .filter(item => selectedItemIds.has(item.id))
            .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    }, [cart, selectedItemIds]);

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

            {isAuthenticated && !loading && (!cart || cart?.items?.length === 0) && (
                <div style={{ 
                    padding: '4rem 2rem', 
                    borderRadius: '16px', 
                    background: '#fff', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 16px 40px rgba(17,24,39,0.04)' 
                }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--color-gold)' }}>
                        <ShoppingBag size={40} />
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-black)', marginBottom: '0.5rem' }}>Giỏ hàng của bạn đang trống</h2>
                    <p style={{ color: 'var(--color-gray-500)', marginBottom: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                        Có vẻ như bạn chưa thêm bất kỳ sản phẩm nào vào giỏ hàng. Khám phá ngay các sản phẩm làm đẹp của chúng tôi!
                    </p>
                    <button className="btn btn--primary" style={{ padding: '12px 32px', background: 'var(--color-black)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'inline-flex' }} onClick={() => navigate('/products')}>
                        Khám phá sản phẩm
                    </button>
                </div>
            )}

            {isAuthenticated && cart?.items?.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 16px 40px rgba(17,24,39,0.08)' }}>
                        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="checkbox" 
                                checked={cart.items.length > 0 && selectedItemIds.size === cart.items.length} 
                                onChange={toggleAll}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
                            />
                            <span style={{ fontWeight: 500, color: 'var(--color-black)' }}>Chọn tất cả ({cart.items.length} sản phẩm)</span>
                        </div>
                        {cart.items.map((item) => {
                            const variant = variantMap[item.productVariantId];
                            const productName = variant ? productMap[variant.productId]?.name : undefined;
                            const imageUrl = variant?.imageUrl;
                            const variantName = variant?.variantName || 'N/A';

                            return (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItemIds.has(item.id)} 
                                        onChange={() => toggleItem(item.id)}
                                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)', cursor: 'pointer', marginTop: '0.5rem', flexShrink: 0 }}
                                    />
                                    <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'var(--color-cream)', overflow: 'hidden', flexShrink: 0 }}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={productName ?? 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-400)', fontSize: '0.75rem' }}>
                                                Không có ảnh
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName ?? 'San pham'}</p>
                                        <p style={{ margin: '0.35rem 0', color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{variantName}</p>
                                        <p style={{ margin: '0.25rem 0', color: 'var(--color-gray-500)' }}>{formatCurrency(Number(item.unitPrice))}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <button
                                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer', background: 'none' }}
                                        >
                                            -
                                        </button>
                                        <span style={{ minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button
                                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                                            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-gray-300)', cursor: 'pointer', background: 'none' }}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(item.id)}
                                        style={{ border: 'none', background: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '0 0.5rem', minWidth: '40px', textAlign: 'center' }}
                                    >
                                        Xoa
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
                            style={{ width: '100%', padding: '12px 16px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', border: 'none', borderRadius: '8px', color: 'white', cursor: selectedItemIds.size > 0 ? 'pointer' : 'not-allowed', opacity: selectedItemIds.size > 0 ? 1 : 0.6 }}
                            onClick={() => {
                                if (selectedItemIds.size > 0) {
                                    navigate('/checkout', { state: { selectedItemIds: Array.from(selectedItemIds) } });
                                }
                            }}
                            disabled={selectedItemIds.size === 0}
                        >
                            Tien hanh thanh toan ({selectedItemIds.size})
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
