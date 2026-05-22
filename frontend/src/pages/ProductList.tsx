import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/productApi';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types/product';

export const ProductList: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    // Ưu tiên lấy res.content từ develop (chuẩn Spring Boot Page), fallback về res.data của HEAD
    queryFn: () => productApi.getProducts().then((res: any) => res.content ?? res.data ?? []),
  });

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-gold)' }}>Danh sách sản phẩm</h1>

      {isLoading && <p>Đang tải sản phẩm...</p>}
      {error && <p style={{ color: 'red' }}>Không thể tải sản phẩm</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
        {data && data.map((p: Product) => (
          // Dùng fallback id || productId cho an toàn
          <ProductCard key={p.id || p.productId} product={p} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;