import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { brandApi } from '../api/brandApi';
import { useApi } from '../hooks/useApi';
import type { BrandSummaryResponse } from '../types/catalog';

const MOCK_BRANDS: BrandSummaryResponse[] = [
  { id: '1', name: 'Aquamarine', slug: 'aquamarine' },
  { id: '2', name: 'Coral Reef', slug: 'coral-reef' },
  { id: '3', name: 'Seaside', slug: 'seaside' },
  { id: '4', name: 'Wave', slug: 'wave' },
  { id: '5', name: 'Marina', slug: 'marina' },
];

export const BrandsList: React.FC = () => {
  const navigate = useNavigate();
  const apiCall = useCallback(() => brandApi.getBrandSummaries(), []);
  const { data: brands, isUsingFallback } = useApi(apiCall, MOCK_BRANDS);

  const handleBrandClick = useCallback((slug: string) => {
    // Temporarily include a flag to instruct the detail page to skip product API calls
    navigate(`/brands/${slug}?noProducts=true`);
  }, [navigate]);

  if (!brands || !Array.isArray(brands)) {
    return null;
  }

  return (
    <section className="brands-section">
      <div className="container">
        <div className="section-header">
          <span className="section-header__subtitle">Thương hiệu đối tác</span>
          <h2 className="section-header__title">Những thương hiệu uy tín</h2>
          <div className="section-divider"></div>
        </div>

        {isUsingFallback && (
          <div className="fallback-notice">
            Máy chủ phản hồi chậm hơn bình thường. Đang dùng dữ liệu tạm thời
          </div>
        )}

        <div className="brands-grid">
          {brands && Array.isArray(brands) && brands.map((brand) => (
            <div 
              key={brand.id} 
              className="brand-card"
              onClick={() => handleBrandClick(brand.slug)}
            >
              <div className="brand-card__inner">
                <h3 className="brand-card__name">{brand.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
