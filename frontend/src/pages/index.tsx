export { ProductList } from './ProductList';
export { ProductDetail } from './ProductDetail';
export { HomePage as Home } from './HomePage';
export { CategoryDetailPage } from './CategoryDetailPage';
export { BrandDetailPage } from './BrandDetailPage';
export { Cart } from './Cart';
export { Checkout } from './Checkout';
export { OrderHistory } from './OrderHistory';
export const Payment = () => {
    return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-gold)' }}>Giả lập cổng Thanh toán (VNPay...)</h1>
            <p>Thực hiện thanh toán...</p>
        </div>
    );
};

export { Chat } from './Chat';
export { VerifyEmail } from './VerifyEmail';
export { ForgotPassword } from './ForgotPassword';
export { ResetPassword } from './ResetPassword';
export { HomePage } from './HomePage';
