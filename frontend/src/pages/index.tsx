
import { useNavigate } from 'react-router-dom';
export { ProductList } from './ProductList';
export { ProductDetail } from './ProductDetail';
export { HomePage as Home } from './HomePage';
export { CategoryDetailPage } from './CategoryDetailPage';
export { BrandDetailPage } from './BrandDetailPage';
export { Cart } from './Cart';
export { Checkout } from './Checkout';
export { OrderHistory } from './OrderHistory';

export const Home = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Home Page</h1>
            <p>Trang chủ - Trưng bày sản phẩm</p>
        </div>
    );
};

export const ProductList = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Danh sách sản phẩm</h1>
            <p>Trang danh sach san pham do ban ban phu trach.</p>
        </div>
    );
};

export const ProductDetail = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Chi tiết sản phẩm</h1>
            <p>Trang chi tiet san pham do ban ban phu trach.</p>
        </div>
    );
};



export const Payment = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Giả lập cổng Thanh toán (VNPay...)</h1>
            <p>Thực hiện thanh toán...</p>
        </div>
    );
};

export const Dashboard = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-error)' }}>Dashboard (Nội bộ)</h1>
            <p>Trang quản trị dành riêng cho nhân viên và admin</p>
        </div>
    );
};

export { VerifyEmail } from './VerifyEmail';
export { ForgotPassword } from './ForgotPassword';
export { ResetPassword } from './ResetPassword';
export { HomePage } from './HomePage';
