import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/productApi';
import type { Product } from '../types/product';
import { ReviewSection } from '../components/review/ReviewSection';

export const ProductDetail: React.FC = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => id ? productApi.getProduct(id).then((res) => res.data) : Promise.resolve(null),
    enabled: !!id,
  });

  if (isLoading) return <div style={{ padding: '4rem' }}>Đang tải...</div>;
  if (error) return <div style={{ padding: '4rem', color: 'red' }}>Không thể tải chi tiết sản phẩm</div>;

  const product = data as Product | null;

  if (!product) return <div style={{ padding: '4rem' }}>Sản phẩm không tồn tại</div>;

  const image = product.images && product.images.length > 0 ? product.images[0].url : '';

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', gap: 40, marginBottom: '2rem' }}>
        <div style={{ width: 400, background: 'white', padding: 16, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
          {image ? <img src={image} alt={product.name} style={{ width: '100%', borderRadius: 8 }} /> : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', background: '#f5f5f5', borderRadius: 8 }}>No image</div>}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>{product.name}</h1>
          <div style={{ color: 'var(--color-gold)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>{(product.minPrice ?? 0).toLocaleString()} đ</div>
          <div style={{ marginBottom: 32, color: 'var(--color-gray-700)', lineHeight: 1.8 }}>{product.description}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/products" className="btn btn--outline">Quay lại danh sách</Link>
          </div>
        </div>
      </div>

      {id && <ReviewSection productId={id} />}
    </div>
  );
};

export default ProductDetail;
