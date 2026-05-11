import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoryApi } from '../api/categoryApi';
import { useApi } from '../hooks/useApi';
import type { CategoryResponse } from '../types/catalog';
import './CategoryDetailPage.css';

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

        <div className="category-detail">
          <h1 className="category-detail__title">{category.name}</h1>
          {category.description && (
            <p className="category-detail__description">{category.description}</p>
          )}

          <div className="category-detail__content">
            <div className="products-section">
              <h2>Sản phẩm trong danh mục này</h2>
              <p className="placeholder">Danh sách sản phẩm sẽ được hiển thị ở đây</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
