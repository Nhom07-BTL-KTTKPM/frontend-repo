import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoriesList } from '../components/CategoriesList';
import { BrandsList } from '../components/BrandsList';
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero__content">
            <h1 className="hero__title">Khám phá vẻ đẹp tự nhiên</h1>
            <p className="hero__subtitle">
              Những sản phẩm chăm sóc da cao cấp từ các thương hiệu hàng đầu
            </p>
            <div className="hero__actions">
              <button 
                className="btn btn--primary"
                onClick={() => navigate('/products')}
              >
                Khám phá ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      <CategoriesList />
      <BrandsList />
    </div>
  );
};
