import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryApi } from '../api/categoryApi';
import { productApi } from '../api/productApi';
import { useApi } from '../hooks/useApi';
import ProductCard from '../components/ProductCard';
import type { CategoryResponse } from '../types/catalog';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';

const MOCK_CATEGORY: CategoryResponse = {
  id: '1',
  name: 'Chăm sóc da',
  slug: 'chăm-sóc-da',
  description: 'Các sản phẩm chăm sóc da chuyên sâu cho mọi loại da',
  isActive: true,
};

export const CategoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) return <div>Không tìm thấy phân loại</div>;

  const apiCall = useCallback(() => categoryApi.getCategoryBySlug(slug), [slug]);
  const { data: category, isUsingFallback, loading } = useApi(apiCall, MOCK_CATEGORY);

  const resolvedCategoryId = !isUsingFallback ? category?.id ?? '' : '';

  const [subs, setSubs] = useState<CategoryResponse[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    setActiveSubId(null);
  }, [category?.id]);

  useEffect(() => {
    if (!resolvedCategoryId) return;
    let isMounted = true;
    categoryApi
      .getChildCategories(resolvedCategoryId)
      .then((list) => {
        if (isMounted) setSubs(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (isMounted) setSubs([]);
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedCategoryId]);

  useEffect(() => {
    if (!resolvedCategoryId) return;
    let isMounted = true;

    setProductsLoading(true);
    const productRequest: Promise<PageResponse<Product> | Product[]> = activeSubId
      ? productApi.getProductsByCategory(activeSubId, { size: 24 })
      : productApi.getProductsByCategoryRoot(resolvedCategoryId, { size: 24 });

    productRequest
      .then((res: PageResponse<Product> | Product[]) => {
        if (!isMounted) return;
        const list = Array.isArray(res)
          ? (res as Product[])
          : ((res as PageResponse<Product>).content ?? []);
        setProducts(list);
      })
      .catch((err: unknown) => {
        console.warn('Failed to load products by category:', err);
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [resolvedCategoryId, activeSubId]);

  const resultsLabel = useMemo(
    () => `${products.length} sản phẩm`,
    [products.length]
  );

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!category) {
    return <div className="error">Không tìm thấy phân loại</div>;
  }

  return (
    <div className="category-detail-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        {isUsingFallback && (
          <div className="fallback-notice">
            Máy chủ phản hồi chậm hơn bình thường. Đang dùng dữ liệu tạm thời
          </div>
        )}

        <header className="category-detail__header">
          <h1 className="category-detail__title">{category.name}</h1>
          {category.description && (
            <p className="category-detail__description">{category.description}</p>
          )}
        </header>

        <div className="category-detail__toolbar">
          <span>{resultsLabel}</span>
          <span>Bộ lọc</span>
          <span>Sắp xếp / phổ biến</span>
        </div>

        {subs.length > 0 && (
          <div className="category-detail__subs">
            <button
              className={`category-detail__sub-chip${activeSubId === null ? ' active' : ''}`}
              onClick={() => setActiveSubId(null)}
            >
              Tất cả
            </button>
            {subs.map((sub) => (
              <button
                key={sub.id}
                className={`category-detail__sub-chip${activeSubId === sub.id ? ' active' : ''}`}
                onClick={() => setActiveSubId(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {productsLoading ? (
          <div className="category-detail__loading">Đang tải sản phẩm...</div>
        ) : products.length === 0 ? (
          <div className="category-detail__empty">
            Hiện chưa có sản phẩm nào trong phân loại này.
          </div>
        ) : (
          <div className="category-detail__grid">
            {products.map((p) => (
              <div key={p.id} className="category-detail__grid-item">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
