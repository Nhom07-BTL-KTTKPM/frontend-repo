import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>
          <div>
            <h3 className="footer__brand-name" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', fontSize: '1.5rem', marginBottom: '1rem' }}>LUMIÈRE</h3>
            <p className="footer__brand-desc">
              Nơi hội tụ những thương hiệu mỹ phẩm hàng đầu thế giới. 
              Mang đến trải nghiệm mua sắm thông minh với AI tư vấn cá nhân hóa.
            </p>
            <div className="footer__social" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Link to="#" className="footer__social-link"><i className="fab fa-facebook-f"></i></Link>
              <Link to="#" className="footer__social-link"><i className="fab fa-instagram"></i></Link>
              <Link to="#" className="footer__social-link"><i className="fab fa-tiktok"></i></Link>
              <Link to="#" className="footer__social-link"><i className="fab fa-youtube"></i></Link>
            </div>
          </div>

          <div>
            <h4 className="footer__heading" style={{ color: 'var(--color-black)', marginBottom: '1.5rem' }}>Mua Sắm</h4>
            <ul className="footer__links">
              <li><Link to="/products" className="footer__link">Sản phẩm mới</Link></li>
              <li><Link to="/products" className="footer__link">Best Sellers</Link></li>
              <li><Link to="/products" className="footer__link">Khuyến mãi</Link></li>
              <li><Link to="/products" className="footer__link">Thương hiệu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__heading" style={{ color: 'var(--color-black)', marginBottom: '1.5rem' }}>Hỗ Trợ</h4>
            <ul className="footer__links">
              <li><Link to="#" className="footer__link">Hướng dẫn mua hàng</Link></li>
              <li><Link to="#" className="footer__link">Chính sách đổi trả</Link></li>
              <li><Link to="#" className="footer__link">FAQ</Link></li>
              <li><Link to="#" className="footer__link">Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer__heading" style={{ color: 'var(--color-black)', marginBottom: '1.5rem' }}>Liên Hệ</h4>
            <ul className="footer__links">
              <li><span className="footer__link"><i className="fas fa-map-marker-alt" style={{ width: '16px', marginRight: '8px', color: 'var(--color-gold)' }}></i>123 Nguyễn Huệ, Q.1, TP.HCM</span></li>
              <li><span className="footer__link"><i className="fas fa-phone" style={{ width: '16px', marginRight: '8px', color: 'var(--color-gold)' }}></i>1900 8888</span></li>
              <li><span className="footer__link"><i className="fas fa-envelope" style={{ width: '16px', marginRight: '8px', color: 'var(--color-gold)' }}></i>hello@lumiere.vn</span></li>
              <li><span className="footer__link"><i className="fas fa-clock" style={{ width: '16px', marginRight: '8px', color: 'var(--color-gold)' }}></i>8:00 - 22:00 hàng ngày</span></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-gray-300)' }}>
          <span>© 2026 Lumière Beauty. All rights reserved.</span>
          <div className="footer__payment" style={{ display: 'flex', gap: '1rem', color: 'var(--color-gray-500)' }}>
            <div className="footer__payment-icon"><i className="fab fa-cc-visa"></i></div>
            <div className="footer__payment-icon"><i className="fab fa-cc-mastercard"></i></div>
            <div className="footer__payment-icon"><i className="fab fa-cc-jcb"></i></div>
            <div className="footer__payment-icon" style={{ fontWeight: 'bold' }}>VNP</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
