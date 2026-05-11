import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/productApi';
import type { Product } from '../types/product';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => id ? productApi.getProduct(id) : Promise.resolve(null),
    enabled: !!id,
  });

  if (isLoading) return <div style={{ padding: '4rem' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '4rem', color: 'red' }}>Không thể tải chi tiết sản phẩm</div>;

  const product = data as Product | null;

  if (!product) return <div style={{ padding: '4rem' }}>Sản phẩm không tồn tại</div>;

  const image = product.images && product.images.length > 0 ? product.images[0].url : '';

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: 24 }}>
      <div style={{ width: 360, background: 'white', padding: 12, borderRadius: 8 }}>
        {image ? <img src={image} alt={product.name} style={{ width: '100%', borderRadius: 6 }} /> : <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No image</div>}
      </div>
      <div style={{ flex: 1 }}>
        <h1 style={{ marginTop: 0 }}>{product.name}</h1>
        <div style={{ color: 'var(--color-gold)', fontWeight: 700, marginBottom: 12 }}>{(product.minPrice ?? 0).toLocaleString()} đ</div>
        <div style={{ marginBottom: 12 }}>{product.description}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/products" style={{ padding: '8px 12px', borderRadius: 6, background: '#eee' }}>Quay lại</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;