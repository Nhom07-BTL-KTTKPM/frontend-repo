import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const ForgotPassword = () => {
    const { forgotPasswordMutation } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        forgotPasswordMutation.mutate({ email }, {
            onSuccess: () => {
                toast.success('Nếu email tồn tại, hệ thống đã gửi mã xác nhận.');
                // Chuyển hướng sang trang reset password và truyền email
                navigate('/reset-password', { state: { email } });
            },
            onError: (err: any) => {
                toast.error(err.message || 'Có lỗi xảy ra khi gửi yêu cầu.');
            }
        });
    };

    return (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
            <div className="auth-form" style={{ background: '#fff', padding: '2.5rem 2rem', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
                <h3 className="auth-modal__title" style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Quên mật khẩu</h3>
                <p className="auth-modal__subtitle" style={{ textAlign: 'center', color: 'var(--color-gray-500)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Vui lòng nhập địa chỉ email bạn đã đăng ký. Chúng tôi sẽ gửi một mã xác nhận để đặt lại mật khẩu.
                </p>
                
                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-group__label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
                        <input 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            type="email" 
                            required 
                            className="form-group__input" 
                            placeholder="example@email.com" 
                            style={{ width: '100%', padding: '12px 10px', border: '1px solid var(--color-gray-300)', borderRadius: '4px' }}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={forgotPasswordMutation.isPending || !email} 
                        className="btn btn--primary" 
                        style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {forgotPasswordMutation.isPending ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                    </button>
                </form>
                
                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    Nhớ mật khẩu? <Link to="/login" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>Quay lại đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};
