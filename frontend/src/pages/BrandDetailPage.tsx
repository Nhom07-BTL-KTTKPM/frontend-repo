import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brandApi } from '../api/brandApi';
import { useApi } from '../hooks/useApi';
import type { BrandResponse } from '../types/catalog';
import './BrandDetailPage.css';

const MOCK_BRAND: BrandResponse = {
  id: '1',
  name: 'Aquamarine',
  slug: 'aquamarine',
  description: 'Thương hiệu hàng đầu trong lĩnh vực chăm sóc làm đẹp',
  originCountry: 'Việt Nam',
  isActive: true,
};

export const BrandDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  if (!slug) return <div>Không tìm thấy thương hiệu</div>;

  const apiCall = useCallback(() => brandApi.getBrandBySlug(slug), [slug]);
  const { data: brand, isUsingFallback, loading } = useApi(apiCall, MOCK_BRAND);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!brand) {
    return <div className="error">Không tìm thấy thương hiệu</div>;
  }

  return (
    <div className="brand-detail-page">
      <div className="container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        {isUsingFallback && (
          <div className="fallback-notice">
            Máy chủ phản hồi chậm hơn bình thường. Đang dùng dữ liệu tạm thời
          </div>
        )}

        <div className="brand-detail">
          <div className="brand-detail__header">
            <h1 className="brand-detail__title">{brand.name}</h1>
            {brand.originCountry && (
              <p className="brand-detail__country">🌍 {brand.originCountry}</p>
            )}
          </div>

          {brand.description && (
            <p className="brand-detail__description">{brand.description}</p>
          )}

          {brand.websiteUrl && (
            <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              Truy cập trang web
            </a>
          )}

          <div className="brand-detail__content">
            <div className="products-section">
              <h2>Sản phẩm từ thương hiệu này</h2>
              <p className="placeholder">Danh sách sản phẩm sẽ được hiển thị ở đây</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
