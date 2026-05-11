import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryCard } from './CategoryCard';
import { categoryApi } from '../api/categoryApi';
import { useApi } from '../hooks/useApi';
import type { Category } from '../types/catalog';

const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Chăm sóc da', slug: 'chăm-sóc-da', isActive: true },
  { id: '2', name: 'Trang điểm', slug: 'trang-điểm', isActive: true },
  { id: '3', name: 'Chăm sóc tóc', slug: 'chăm-sóc-tóc', isActive: true },
  { id: '4', name: 'Chăm sóc cơ thể', slug: 'chăm-sóc-cơ-thể', isActive: true },
  { id: '5', name: 'Chăm sóc nắng', slug: 'chăm-sóc-nắng', isActive: true },
  { id: '6', name: 'Bộ quà tặng', slug: 'bộ-quà-tặng', isActive: true },
];

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const apiCall = useCallback(() => categoryApi.getRootCategories(), []);
  const { data: categories, isUsingFallback } = useApi(apiCall, MOCK_CATEGORIES);

  const handleCategoryClick = useCallback((category: Category) => {
    navigate(`/categories/${category.slug}`);
  }, [navigate]);

  if (!categories || !Array.isArray(categories)) {
    return null;
  }

  return (
    <section className="categories-section">
      <div className="container">
        <div className="section-header">
          <span className="section-header__subtitle">Phân loại sản phẩm</span>
          <h2 className="section-header__title">Khám phá theo danh mục</h2>
          <div className="section-divider"></div>
        </div>

        {isUsingFallback && (
          <div className="fallback-notice">
            Máy chủ phản hồi chậm hơn bình thường. Đang dùng dữ liệu tạm thời
          </div>
        )}

        <div className="categories-grid">
          {categories && Array.isArray(categories) && categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={handleCategoryClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
