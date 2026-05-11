import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brandApi } from '../api/brandApi';
import { productApi } from '../api/productApi';
import { useApi } from '../hooks/useApi';
import ProductCard from '../components/ProductCard';
import type { BrandResponse } from '../types/catalog';
import type { Product } from '../types/product';
import type { PageResponse } from '../types/api';

const MOCK_BRAND: BrandResponse = {
  id: '1',
  name: 'Aquamarine',
  slug: 'aquamarine',
  description: 'Thương hiệu hàng đầu trong lĩnh vực chăm sóc làm đẹp',
  originCountry: 'Việt Nam',
  isActive: true,
};

const getMonogram = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const BrandDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) return <div>Không tìm thấy thương hiệu</div>;

  const apiCall = useCallback(() => brandApi.getBrandBySlug(slug), [slug]);
  const { data: brand, isUsingFallback, loading } = useApi(apiCall, MOCK_BRAND);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    if (!brand?.id) return;
    let isMounted = true;
    setProductsLoading(true);
    productApi
      .getProductsByBrand(brand.id, { size: 12 })
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res)
          ? (res as Product[])
          : ((res as PageResponse<Product>).content ?? []);
        setProducts(list);
      })
      .catch((err) => {
        console.warn('Failed to load products by brand:', err);
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setProductsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [brand?.id]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!brand) {
    return <div className="error">Không tìm thấy thương hiệu</div>;
  }

  const monogram = getMonogram(brand.name);

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

        {/* HERO */}
        <section className="brand-hero">
          <span className="brand-hero__dots brand-hero__dots--tl" />
          <span className="brand-hero__dots brand-hero__dots--br" />
          <div className="brand-hero__inner">
            <div className="brand-hero__content">
              <p className="brand-hero__eyebrow">Thương hiệu nổi bật</p>
              <h1 className="brand-hero__title">
                <span>{brand.name}</span>
              </h1>
              {brand.description && (
                <p className="brand-hero__desc">{brand.description}</p>
              )}
              <div className="brand-hero__actions">
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    const el = document.getElementById('brand-products');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Mua ngay
                </button>
                {brand.websiteUrl && (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--dark"
                  >
                    Tìm hiểu thêm
                  </a>
                )}
              </div>
              {brand.originCountry && (
                <span className="brand-hero__country">🌍 {brand.originCountry}</span>
              )}
            </div>
            <div className="brand-hero__visual">
              <div className="brand-hero__logo-circle">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} />
                ) : (
                  <span className="brand-hero__monogram">{monogram}</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="brand-about">
          <div className="brand-about__content">
            <h2 className="brand-about__title">About Us</h2>
            <p className="brand-about__text">
              {brand.description ||
                `${brand.name} mang đến những sản phẩm chăm sóc sắc đẹp được nghiên cứu kỹ lưỡng, lấy cảm hứng từ thiên nhiên và công nghệ hiện đại.`}
            </p>
            <p className="brand-about__text">
              Mỗi sản phẩm được tuyển chọn từ những nguyên liệu tinh khiết nhất, nhằm tôn vinh
              vẻ đẹp tự nhiên và mang lại trải nghiệm chăm sóc da toàn diện cho khách hàng.
            </p>
            <div className="brand-about__actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  const el = document.getElementById('brand-products');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Xem sản phẩm
              </button>
              <button className="btn btn--dark" onClick={() => navigate('/products')}>
                Chi tiết
              </button>
            </div>
          </div>
          <div className="brand-about__visual">
            <div className="brand-about__circle">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.name} />
              ) : (
                <span className="brand-about__circle-monogram">{monogram}</span>
              )}
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="brand-products" className="brand-products">
          <div className="brand-products__header">
            <h2 className="brand-products__title">Sản phẩm của chúng tôi</h2>
            <p className="brand-products__subtitle">
              Khám phá các sản phẩm nổi bật từ thương hiệu {brand.name} — được chọn lọc kỹ lưỡng
              cho hành trình chăm sóc sắc đẹp của bạn.
            </p>
          </div>

          {productsLoading ? (
            <div className="brand-products__loading">Đang tải sản phẩm...</div>
          ) : products.length === 0 ? (
            <div className="brand-products__empty">
              Hiện chưa có sản phẩm nào cho thương hiệu này.
            </div>
          ) : (
            <div className="brand-products__grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
