import { useNavigate } from 'react-router-dom';

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
            <p>Hiển thị các sản phẩm filter</p>
        </div>
    );
};

export const ProductDetail = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Chi tiết sản phẩm</h1>
            <p>Product ID: ...</p>
        </div>
    );
};

export const Cart = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Giỏ hàng</h1>
            <p>Danh sách item trong giỏ</p>
            <button className="btn btn--primary" style={{ marginTop: '1rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/checkout')}>Tiến hành thanh toán</button>
        </div>
    );
};

export const Checkout = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Thanh toán</h1>
            <p>Nhập thông tin giao hàng</p>
            <button className="btn btn--primary" style={{ marginTop: '1rem', padding: '10px 20px', background: 'var(--color-gold)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/payment')}>Sang cổng giả lập Payment</button>
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

export * from './VerifyEmail';
export * from './ForgotPassword';
export * from './ResetPassword';
