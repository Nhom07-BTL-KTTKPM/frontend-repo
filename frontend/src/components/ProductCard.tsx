import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '../types/product';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const image = product.images && product.images.length > 0 ? product.images[0].url : '';
  const price = product.minPrice ?? product.variants?.[0]?.price ?? 0;

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
      <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
        title="Thêm vào giỏ hàng"
      >
        <ShoppingCart size={18} />
      </button>
    </div>
  );
};

export default ProductCard;