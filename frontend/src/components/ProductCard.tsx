import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types/product';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const image = product.images && product.images.length > 0 ? product.images[0].url : '';
  const price = product.minPrice ?? product.variants?.[0]?.price ?? 0;

  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, width: 220, background: 'white' }}>
      <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {image ? <img src={image} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <div style={{ color: '#999' }}>No image</div>}
        </div>
        <h3 style={{ fontSize: 16, margin: '8px 0' }}>{product.name}</h3>
        <div style={{ color: 'var(--color-gold)', fontWeight: 700 }}>{price.toLocaleString()} đ</div>
      </Link>
    </div>
  );
};

export default ProductCard;
