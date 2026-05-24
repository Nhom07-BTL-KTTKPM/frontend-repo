import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, ChevronRight, Copy, Package, Star, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { productApi } from '../api/productApi';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from '../store/authStore';
import { useCustomerId } from '../hooks/useCustomerId';
import { useGuestCartStore } from '../store/guestCartStore';
import type { Product, ProductImage, ProductVariant } from '../types/product';
import { ReviewSection } from '../components/review/ReviewSection';

type DetailTab = 'description' | 'info' | 'reviews';

type RichProduct = Product & {
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  ingredients?: string;
  usageInstructions?: string;
  suitableSkinTypes?: string[];
  skinConcerns?: string[];
  isFeatured?: boolean;
  brandName?: string;
  categoryName?: string;
  brandLogoUrl?: string;
};

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DetailTab>('description');
  const [isAdding, setIsAdding] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { customerId } = useCustomerId();
  const addGuestItem = useGuestCartStore((s) => s.addItem);
  const stateProductId = (location.state as { productId?: string } | null)?.productId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug, stateProductId],
    queryFn: async () => {
      if (stateProductId) {
        return productApi.getProduct(stateProductId);
      }

      if (!slug) {
        return null;
      }

      const bySlug = await productApi.getProductBySlug(slug);
      const hasDetailFields = Boolean(
        bySlug?.description ||
        bySlug?.images?.length ||
        bySlug?.variants?.length ||
        (bySlug as Product & { categoryId?: string; brandId?: string })?.categoryId ||
        (bySlug as Product & { categoryId?: string; brandId?: string })?.brandId
      );

      if (hasDetailFields) {
        return bySlug;
      }

      const resolvedId = bySlug?.id || bySlug?.productId;
      return resolvedId ? productApi.getProduct(resolvedId) : bySlug;
    },
    enabled: !!slug || !!stateProductId,
  });

  const product = data as RichProduct | null;
  const actualProductId = product?.productId || product?.id;

  const galleryImages = useMemo<ProductImage[]>(() => {
    const source = Array.isArray(product?.images) ? product!.images : [];
    const normalized = source
      .filter((image) => Boolean(image?.url))
      .map((image, index) => ({
        id: image.id || `${product?.id || product?.productId || 'product'}-${index}`,
        url: image.url,
        altText: image.altText || product?.name,
        isPrimary: image.isPrimary,
      }));

    if (!normalized.length && product?.thumbnail) {
      normalized.push({
        id: `${product.id || product.productId || 'product'}-thumbnail`,
        url: product.thumbnail,
        altText: product.name,
        isPrimary: true,
      });
    }

    return normalized;
  }, [product]);

  const activeVariant = selectedVariant ?? (product?.variants?.[0] || null);
  const displayPrice = activeVariant?.price ?? product?.minPrice ?? 0;
  const originalPrice = activeVariant?.originalPrice ?? product?.maxPrice;
  const categoryName = product?.categoryName || product?.category?.name || 'Chưa phân loại';
  const brandName = product?.brandName || product?.brand?.name || 'Chưa xác định';
  const averageRating = product?.averageRating ?? 0;
  const totalReviews = product?.totalReviews ?? 0;
  const totalSold = product?.totalSold ?? 0;
  const mainImage = galleryImages[selectedImageIndex] || galleryImages[0] || null;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    setSelectedVariant(null);
    setSelectedImageIndex(0);
    setActiveTab('description');
    setIsLinkCopied(false);
  }, [product?.id]);

  useEffect(() => {
    if (selectedImageIndex >= galleryImages.length) {
      setSelectedImageIndex(0);
    }
  }, [galleryImages.length, selectedImageIndex]);

  useEffect(() => {
    if (!isLinkCopied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setIsLinkCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [isLinkCopied]);

  if (isLoading) return <div style={{ padding: '4rem' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '4rem', color: 'red' }}>Không thể tải chi tiết sản phẩm</div>;
  if (!product) return <div style={{ padding: '4rem' }}>Sản phẩm không tồn tại</div>;

  const handleAddToCart = async () => {
    if (!activeVariant) return;

    if (isAuthenticated && customerId) {
      setIsAdding(true);
      try {
        await cartApi.addItem(customerId, {
          productVariantId: activeVariant.id,
          quantity: 1,
          unitPrice: activeVariant.price,
        });
        toast.success('Đã thêm sản phẩm vào giỏ hàng');
        window.dispatchEvent(new CustomEvent('cart:updated'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Thêm vào giỏ hàng thất bại';
        toast.error(message);
      } finally {
        setIsAdding(false);
      }
    } else {
      addGuestItem({
        productVariantId: activeVariant.id,
        quantity: 1,
        unitPrice: activeVariant.price,
        variantName: activeVariant.variantName || '',
        productName: product.name,
        imageUrl: mainImage?.url || '',
      });
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsLinkCopied(true);
      toast.success('Đã sao chép liên kết');
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };



  const detailTags = [
    categoryName,
    brandName,
    product.isFeatured ? 'Nổi bật' : null,
    activeVariant?.variantName || null,
    activeVariant?.stockQuantity && activeVariant.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng',
  ].filter((value): value is string => Boolean(value));

  const additionalInfo = [
    { label: 'SKU', value: activeVariant?.sku || 'Chưa có SKU' },
    { label: 'Thương hiệu', value: brandName },
    { label: 'Danh mục', value: categoryName },
    { label: 'Phân loại', value: activeVariant?.variantName || 'Chưa chọn' },
    { label: 'Giá hiện tại', value: `${displayPrice.toLocaleString('vi-VN')} đ` },
    { label: 'Giá gốc', value: originalPrice ? `${originalPrice.toLocaleString('vi-VN')} đ` : 'Chưa có' },
    { label: 'Tồn kho', value: activeVariant?.stockQuantity != null ? `${activeVariant.stockQuantity}` : 'Chưa cập nhật' },
    { label: 'Đã bán', value: `${totalSold}` },
    { label: 'Đánh giá', value: `${averageRating.toFixed(1)} / 5` },
    { label: 'Số review', value: `${totalReviews}` },
  ];

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={`${product.id}-star-${index}`}
        size={16}
        fill={index < Math.round(rating) ? 'currentColor' : 'none'}
        strokeWidth={2}
      />
    ));

  const goToImage = (direction: 'prev' | 'next') => {
    if (galleryImages.length <= 1) return;

    setSelectedImageIndex((current) => {
      if (direction === 'prev') {
        return current === 0 ? galleryImages.length - 1 : current - 1;
      }

      return current === galleryImages.length - 1 ? 0 : current + 1;
    });
  };

  const detailSectionStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 18px 40px rgba(212, 175, 55, 0.08)',
    border: '1px solid rgba(212, 175, 55, 0.12)',
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    border: 'none',
    background: 'transparent',
    padding: '0.85rem 1.1rem',
    borderBottom: isActive ? '2px solid #D4AF37' : '2px solid transparent',
    color: isActive ? '#1f2937' : '#7a7a7a',
    fontWeight: isActive ? 700 : 600,
    cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: 'linear-gradient(180deg, #f9f7f4 0%, #fffaf0 100%)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '14px', color: '#666' }}>
          <Link to="/" style={{ color: '#D4AF37', textDecoration: 'none' }}>Trang chủ</Link>
          {' / '}
          <Link to="/products" style={{ color: '#D4AF37', textDecoration: 'none' }}>Sản phẩm</Link>
          {' / '}
          <span>{product.name}</span>
        </div>

        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            alignItems: 'flex-start',
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '24px',
            boxShadow: '0 18px 50px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ flex: '0 1 380px', maxWidth: 380, minWidth: 0 }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '22px', background: '#f8f4eb' }}>
              {mainImage?.url ? (
                <img
                  src={mainImage.url}
                  alt={mainImage.altText || product.name}
                  style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', maxHeight: 380 }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: 380,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9a9a9a',
                    background: '#f3efe6',
                    fontSize: '1rem',
                  }}
                >
                  Không có hình ảnh
                </div>
              )}

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goToImage('prev')}
                    aria-label="Ảnh trước"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '0.9rem',
                      transform: 'translateY(-50%)',
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToImage('next')}
                    aria-label="Ảnh sau"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      right: '0.9rem',
                      transform: 'translateY(-50%)',
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,0.92)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(74px, 1fr))', gap: '0.65rem', marginTop: '0.85rem', maxWidth: 380 }}>
                {galleryImages.map((image, index) => (
                  <button
                    key={image.id || image.url || index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    style={{
                      padding: 0,
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: index === selectedImageIndex ? '2px solid #D4AF37' : '1px solid rgba(0,0,0,0.08)',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={image.url} alt={image.altText || product.name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 460px', minWidth: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(212,175,55,0.12)', color: '#9b7a1d', fontSize: 12, fontWeight: 700 }}>
                {categoryName}
              </span>
              {product.isFeatured ? (
                <span style={{ padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#15803d', fontSize: 12, fontWeight: 700 }}>
                  Nổi bật
                </span>
              ) : null}
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: 999, background: 'rgba(17,24,39,0.05)', color: '#374151', fontSize: 12, fontWeight: 700 }}>
                {brandName}
              </span>
            </div>

            <h1 style={{ margin: '0 0 0.75rem 0', fontSize: 'clamp(1.9rem, 3vw, 3rem)', lineHeight: 1.1, color: '#1f2937' }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D4AF37' }}>
                {renderStars(averageRating || 0)}
              </div>
              <span style={{ fontWeight: 700, color: '#1f2937' }}>{averageRating ? averageRating.toFixed(1) : '0.0'}</span>
              <span style={{ color: '#7a7a7a' }}>({totalReviews} review)</span>
              <span style={{ color: '#7a7a7a' }}>• {totalSold} đã bán</span>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', color: '#D4AF37', fontWeight: 800 }}>
                {displayPrice.toLocaleString('vi-VN')} đ
              </div>
              {originalPrice && originalPrice > displayPrice && (
                <div style={{ fontSize: '1rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                  {originalPrice.toLocaleString('vi-VN')} đ
                </div>
              )}
            </div>

            <p style={{ margin: '0 0 1.25rem', lineHeight: 1.8, color: '#5b5b5b', fontSize: '1rem' }}>
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {detailTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.45rem 0.8rem',
                    borderRadius: 999,
                    background: '#faf7ef',
                    border: '1px solid rgba(212,175,55,0.16)',
                    color: '#5f4a11',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <Tag size={14} />
                  {tag}
                </span>
              ))}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 700, color: '#374151' }}>
                  Chọn phân loại
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
                  {product.variants.map((variant) => {
                    const isActive = activeVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '14px',
                          border: isActive ? '1px solid #D4AF37' : '1px solid rgba(0,0,0,0.08)',
                          background: isActive ? 'rgba(212,175,55,0.08)' : 'white',
                          color: '#374151',
                          fontWeight: isActive ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {variant.variantName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!activeVariant || (activeVariant.stockQuantity ?? 0) <= 0 || isAdding}
                style={{
                  padding: '0.95rem 1.4rem',
                  minWidth: 200,
                  background: '#D4AF37',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: (activeVariant?.stockQuantity ?? 0) > 0 && !isAdding ? 'pointer' : 'not-allowed',
                  opacity: (activeVariant?.stockQuantity ?? 0) > 0 && !isAdding ? 1 : 0.65,
                  boxShadow: '0 12px 24px rgba(212,175,55,0.24)',
                }}
              >
                {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
              </button>


              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.95rem 1.2rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {isLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                {isLinkCopied ? 'Đã sao chép' : 'Sao chép link'}
              </button>
            </div>

            {activeVariant && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: '0.95rem' }}>
                <Package size={16} />
                {activeVariant.stockQuantity && activeVariant.stockQuantity > 0 ? (
                  <span>Còn {activeVariant.stockQuantity} sản phẩm</span>
                ) : (
                  <span style={{ color: '#dc2626' }}>Hết hàng</span>
                )}
                {activeVariant.sku ? <span>• SKU: {activeVariant.sku}</span> : null}
              </div>
            )}
          </div>
        </section>

        <section style={{ marginTop: '1.5rem', ...detailSectionStyle }}>
          <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
            {(['description', 'info', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={tabButtonStyle(activeTab === tab)}
              >
                {tab === 'description' && 'Description'}
                {tab === 'info' && 'Additional Information'}
                {tab === 'reviews' && 'Review'}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ color: '#4b5563', lineHeight: 1.85 }}>
                {product.description || 'Chưa có mô tả cho sản phẩm này.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {product.ingredients ? (
                  <div style={{ padding: '1rem', borderRadius: '16px', background: '#faf7ef', border: '1px solid rgba(212,175,55,0.14)' }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Thành phần</strong>
                    <div style={{ color: '#5b5b5b', lineHeight: 1.75 }}>{product.ingredients}</div>
                  </div>
                ) : null}
                {product.usageInstructions ? (
                  <div style={{ padding: '1rem', borderRadius: '16px', background: '#faf7ef', border: '1px solid rgba(212,175,55,0.14)' }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Cách dùng</strong>
                    <div style={{ color: '#5b5b5b', lineHeight: 1.75 }}>{product.usageInstructions}</div>
                  </div>
                ) : null}
              </div>

              {Array.isArray(product.suitableSkinTypes) && product.suitableSkinTypes.length > 0 ? (
                <div>
                  <strong style={{ display: 'block', marginBottom: 10 }}>Loại da phù hợp</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.suitableSkinTypes.map((item) => (
                      <span key={item} style={{ padding: '0.5rem 0.8rem', borderRadius: 999, background: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {Array.isArray(product.skinConcerns) && product.skinConcerns.length > 0 ? (
                <div>
                  <strong style={{ display: 'block', marginBottom: 10 }}>Vấn đề da</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {product.skinConcerns.map((item) => (
                      <span key={item} style={{ padding: '0.5rem 0.8rem', borderRadius: 999, background: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem' }}>
              {additionalInfo.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '1rem 1.1rem',
                    borderRadius: '16px',
                    background: '#faf7ef',
                    border: '1px solid rgba(212,175,55,0.14)',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: '#8b8b8b', marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, color: '#1f2937' }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && actualProductId && (
            <ReviewSection productId={actualProductId as string} embedded />
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;