import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productApi } from '../api/productApi';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from '../store/authStore';
import { useCustomerId } from '../hooks/useCustomerId';
import type { Product, ProductVariant } from '../types/product';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { customerId } = useCustomerId();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => slug ? productApi.getProductBySlug(slug) : Promise.resolve(null),
    enabled: !!slug,
  });

  const product = data as Product | null;

  // Set default variant on load
  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  if (isLoading) return <div style={{ padding: '4rem' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '4rem', color: 'red' }}>Không thể tải chi tiết sản phẩm</div>;
  if (!product) return <div style={{ padding: '4rem' }}>Sản phẩm không tồn tại</div>;

  const displayImage = product.images && product.images.length > 0 ? product.images[0].url : '';
  const displayPrice = selectedVariant?.price ?? product.minPrice ?? 0;
  const originalPrice = selectedVariant?.originalPrice ?? product.maxPrice;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      navigate('/login');
      return;
    }

    if (!customerId) {
      toast.error('Không tìm thấy thông tin khách hàng. Vui lòng thử lại.');
      return;
    }

    if (selectedVariant) {
      setIsAdding(true);
      try {
        await cartApi.addItem(customerId, {
          productVariantId: selectedVariant.id,
          quantity: 1,
          unitPrice: selectedVariant.price
        });
        toast.success('Đã thêm sản phẩm vào giỏ hàng');
        // Notify other components that cart has been updated
        window.dispatchEvent(new CustomEvent('cart:updated'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Thêm vào giỏ hàng thất bại';
        toast.error(message);
      } finally {
        setIsAdding(false);
      }
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f9f7f4' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '2rem', fontSize: '14px', color: '#666' }}>
        <Link to="/" style={{ color: '#D4AF37', textDecoration: 'none' }}>
          Trang chủ
        </Link>
        {' / '}
        <Link to="/products" style={{ color: '#D4AF37', textDecoration: 'none' }}>
          Sản phẩm
        </Link>
        {' / '}
        <span>{product.name}</span>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '3rem', backgroundColor: 'white', padding: '2rem', borderRadius: '12px' }}>
        {/* Left: Product Image */}
        <div style={{ width: '400px', flexShrink: 0 }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.name}
                style={{ width: '100%', borderRadius: '6px', objectFit: 'cover', aspectRatio: '1' }}
              />
            ) : (
              <div
                style={{
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                }}
              >
                No image
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '28px', color: '#333' }}>{product.name}</h1>

          {/* Price Display */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '24px', color: '#D4AF37', fontWeight: 700 }}>
              {displayPrice.toLocaleString()} đ
            </div>
            {originalPrice && originalPrice > displayPrice && (
              <div style={{ fontSize: '14px', color: '#999', textDecoration: 'line-through' }}>
                {originalPrice.toLocaleString()} đ
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem', lineHeight: '1.6', color: '#555' }}>
            {product.description}
          </div>

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Chọn phân loại:
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    style={{
                      padding: '10px 16px',
                      border: selectedVariant?.id === variant.id ? '2px solid #D4AF37' : '1px solid #ddd',
                      background: selectedVariant?.id === variant.id ? '#fff9f0' : 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#333',
                      transition: 'all 0.2s',
                    }}
                  >
                    {variant.variantName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || (selectedVariant.stockQuantity ?? 0) <= 0 || isAdding}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: '#D4AF37',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: (selectedVariant?.stockQuantity ?? 0) > 0 && !isAdding ? 'pointer' : 'not-allowed',
                opacity: (selectedVariant?.stockQuantity ?? 0) > 0 && !isAdding ? 1 : 0.6,
              }}
            >
              {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          </div>

          {/* Stock Info */}
          {selectedVariant && (
            <div style={{ marginTop: '1rem', fontSize: '13px', color: '#666' }}>
              {selectedVariant.stockQuantity && selectedVariant.stockQuantity > 0 ? (
                <span>Còn {selectedVariant.stockQuantity} sản phẩm</span>
              ) : (
                <span style={{ color: '#e74c3c' }}>Hết hàng</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;