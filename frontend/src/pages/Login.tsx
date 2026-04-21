import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const Login = () => {
    const { loginMutation } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({ email, password }, {
            onSuccess: () => {
                toast.success('Đăng nhập thành công');
                navigate('/');
            },
            onError: (err: any) => {
                toast.error(err.message || 'Đăng nhập thất bại');
            }
        });
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-form" id="loginForm" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
                <h3 className="auth-modal__title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Chào mừng trở lại</h3>
                <p className="auth-modal__subtitle" style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem', fontSize: '0.9rem' }}>Đăng nhập để trải nghiệm mua sắm tuyệt vời</p>
                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="form-group__input" placeholder="example@email.com" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}/>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem', position: 'relative' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mật khẩu</label>
                        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="form-group__input" placeholder="••••••••" style={{ width: '100%', padding: '10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}/>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-gray-500)', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: 'var(--color-gold)' }}/> Ghi nhớ đăng nhập
                        </label>
                    </div>
                    <button type="submit" disabled={loginMutation.isPending} className="btn btn--primary" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>Đăng ký ngay</Link>
                </p>
            </div>
        </div>
    );
};
