import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Loader2 } from 'lucide-react';
import type { Product } from '../types/product';

import { useCustomerId } from '../hooks/useCustomerId';
import { useWishlistStore } from '../store/wishlistStore';
import { cartApi } from '../api/cartApi';
import { useAuthStore } from '../store/authStore';
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

  const image = product.thumbnail || (product.images && product.images.length > 0 ? product.images[0].url : '');
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

  const { isFavorite, toggleItem, fetchWishlist, initialized } = useWishlistStore();
  const [favLoading, setFavLoading] = React.useState(false);

  const pid = product.id || product.productId;
  const favorite = pid ? isFavorite(pid) : false;

  React.useEffect(() => {
    if (customerId && !initialized) {
      fetchWishlist(customerId);
    }
  }, [customerId, initialized, fetchWishlist]);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customerId || !pid) {
      // Có thể thêm thông báo yêu cầu đăng nhập ở đây
      return;
    }

    setFavLoading(true);
    try {
      await toggleItem(customerId, pid);
    } catch (err) {
      console.error('toggleWishlist error', err);
    } finally {
      setFavLoading(false);
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
      <Link
        to={`/product/${product.slug || product.productId}`}
        state={{ productId: product.id || product.productId }}
        style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4, marginBottom: 8, background: '#f7f3ea' }}>
          {image ? <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#999' }}>No image</div>}
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
        type="button"
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

      <button
        onClick={handleToggleWishlist}
        disabled={favLoading}
        title={favorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
        className={`absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
          favorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
        }`}
      >
        {favLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Heart
            size={16}
            fill={favorite ? 'currentColor' : 'transparent'}
            stroke="currentColor"
          />
        )}
      </button>
    </div>
  );
};

export default ProductCard;
