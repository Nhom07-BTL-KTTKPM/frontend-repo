import { useAuthStore } from '../store/authStore';
import { User, Mail, Phone, ShieldCheck, Calendar, Activity, CheckCircle, XCircle } from 'lucide-react';

export const Profile = () => {
    const user = useAuthStore(state => state.user);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Chưa có thông tin';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('vi-VN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }).format(date);
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0', minHeight: '80vh' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center', color: 'var(--color-primary-dark)' }}>Hồ sơ tài khoản</h2>
                
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    {/* Header Banner */}
                    <div style={{ background: 'linear-gradient(135deg, var(--color-primary-light, #fcd34d), var(--color-primary, #fbbf24))', height: '120px', position: 'relative' }}>
                    </div>
                    
                    {/* Avatar & Basic Info */}
                    <div style={{ padding: '0 2rem', marginTop: '-50px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
                        <div style={{ 
                            width: '100px', height: '100px', borderRadius: '50%', background: '#fff', 
                            padding: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', position: 'relative', flexShrink: 0
                        }}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-gray-100, #f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-500, #6b7280)' }}>
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        <div style={{ paddingBottom: '10px' }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>{user?.fullName || 'Người dùng'}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', marginTop: '4px' }}>
                                <span style={{ 
                                    background: user?.role === 'ADMIN' ? '#fee2e2' : user?.role === 'EMPLOYEE' ? '#fef3c7' : '#e0e7ff',
                                    color: user?.role === 'ADMIN' ? '#ef4444' : user?.role === 'EMPLOYEE' ? '#f59e0b' : '#6366f1',
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                                }}>
                                    {user?.role}
                                </span>
                                {user?.status === 'ACTIVE' && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem' }}>
                                        <CheckCircle size={14} /> Hoạt động
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ padding: '0 2rem 2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Column 1 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <Mail size={16} /> Email
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ wordBreak: 'break-all' }}>{user?.email}</span>
                                        {user?.emailVerified ? 
                                            <span title="Đã xác thực" style={{ color: '#10b981', display: 'flex', flexShrink: 0 }}><CheckCircle size={16} /></span> : 
                                            <span title="Chưa xác thực" style={{ color: '#f59e0b', display: 'flex', flexShrink: 0 }}><XCircle size={16} /></span>
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <Phone size={16} /> Số điện thoại
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{user?.phoneNumber || 'Chưa cập nhật'}</div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <ShieldCheck size={16} /> Phương thức đăng nhập
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                                        {user?.provider === 'GOOGLE' ? 'Google OAuth2' : 'Tài khoản thường (Local)'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Column 2 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <Activity size={16} /> Trạng thái tài khoản
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                                        {user?.status === 'ACTIVE' ? 'Đang hoạt động' : 
                                         user?.status === 'DISABLED' ? 'Đã bị khóa' : 'Chờ xác thực'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <Calendar size={16} /> Ngày tham gia
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{formatDate(user?.createdAt)}</div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gray-500, #6b7280)', fontSize: '0.9rem', marginBottom: '4px' }}>
                                        <Calendar size={16} /> Lần đăng nhập gần nhất
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{formatDate(user?.lastLoginAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
