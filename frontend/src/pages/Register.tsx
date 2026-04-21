import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const Register = () => {
    const { registerMutation } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        registerMutation.mutate({ email, password, fullName, phoneNumber }, {
            onSuccess: () => {
                toast.success('Đăng ký thành công. Vui lòng đăng nhập.');
                navigate('/login');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Đăng ký thất bại');
            }
        });
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <div className="auth-form" id="registerForm" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
                <h3 className="auth-modal__title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Tạo tài khoản</h3>
                <p className="auth-modal__subtitle" style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem', fontSize: '0.9rem' }}>Trở thành thành viên của Lumière</p>
                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Họ và tên</label>
                        <input value={fullName} onChange={e => setFullName(e.target.value)} type="text" required className="form-group__input" placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}/>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Số điện thoại</label>
                        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} type="tel" required className="form-group__input" placeholder="0901234567" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}/>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="form-group__input" placeholder="example@email.com" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}/>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mật khẩu</label>
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="form-group__input" placeholder="••••••••" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}/>
                    </div>
                    <button type="submit" disabled={registerMutation.isPending} className="btn btn--primary" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {registerMutation.isPending ? 'Đang xử lý...' : 'Đăng ký'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};
