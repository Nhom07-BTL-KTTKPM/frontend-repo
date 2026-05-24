import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types/product';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from '../store/authStore';
import { useCustomerId } from '../hooks/useCustomerId';
import { useGuestCartStore } from '../store/guestCartStore';
import { toast } from 'sonner';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { customerId } = useCustomerId();
  const addGuestItem = useGuestCartStore((s) => s.addItem);

  const image = product.images && product.images.length > 0 ? product.images[0].url : '';
  const activeVariant = product.variants?.[0] || null;
  const price = activeVariant?.price ?? product.minPrice ?? 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!activeVariant) {
        toast.error('Sản phẩm hiện không có sẵn');
        return;
    }

    if (isAuthenticated && customerId) {
      setIsAdding(true);
      try {
        await cartApi.addItem(customerId, {
          productVariantId: activeVariant.id,
          quantity: 1,
          unitPrice: activeVariant.price
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
        imageUrl: image,
      });
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    }
  };

  return (
    <div style={{ 
      border: '1px solid #eee', 
      borderRadius: 8, 
      padding: 12, 
      width: 220, 
      background: 'white',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fallback sử dụng slug, nếu không có sẽ tự lùi về productId */}
      <Link to={`/product/${product.slug || product.productId}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4, marginBottom: 8 }}>
          {image ? <img src={image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <div style={{ color: '#999' }}>No image</div>}
        </div>
        <h3 style={{ 
          fontSize: 14, 
          margin: '0 0 8px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.4',
          minHeight: '2.8em'
        }}>
          {product.name}
        </h3>
        <div style={{ color: 'var(--color-gold)', fontWeight: 700, marginTop: 'auto' }}>{price.toLocaleString()} đ</div>
      </Link>
      
      <button
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--color-gold)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onClick={handleAddToCart}
        disabled={isAdding || !activeVariant || (activeVariant.stockQuantity ?? 0) <= 0}
        title="Thêm vào giỏ hàng"
      >
        {isAdding ? <span style={{fontSize: '12px', fontWeight: 600}}>...</span> : <ShoppingCart size={18} />}
      </button>
    </div>
  );
};

export default ProductCard;