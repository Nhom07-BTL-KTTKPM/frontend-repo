import { useAuthStore } from '../store/authStore';

export const Profile = () => {
    const user = useAuthStore(state => state.user);

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Hồ sơ tài khoản</h2>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '1rem' }}>
                        <span style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Họ và tên</span>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.fullName || 'Người dùng'}</div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '1rem' }}>
                        <span style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Email</span>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.email}</div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--color-gray-100)', paddingBottom: '1rem' }}>
                        <span style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Số điện thoại</span>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.phoneNumber || 'Chưa cập nhật'}</div>
                    </div>
                    <div>
                        <span style={{ color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Vai trò</span>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--color-gold)' }}>{user?.role}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
