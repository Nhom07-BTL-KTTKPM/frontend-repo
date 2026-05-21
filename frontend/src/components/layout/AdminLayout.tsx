import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar } from '../admin/AdminSidebar';
import { LogOut } from 'lucide-react';

export const AdminLayout = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px 1fr', background: 'var(--color-cream)' }}>
      <AdminSidebar />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.25rem 2rem',
            background: 'rgba(250, 246, 240, 0.92)',
            borderBottom: '1px solid rgba(201,169,110,0.18)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div>
            <p style={{ margin: 0, color: 'var(--color-gold-dark)', fontSize: '0.78rem', letterSpacing: '0.24em', textTransform: 'uppercase' }}>Internal console</p>
            <h1 style={{ margin: '0.15rem 0 0', fontSize: '1.5rem', color: 'var(--color-black)' }}>Lumière</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-black)' }}>{user?.email || 'admin@gmail.com'}</p>
              <p style={{ margin: 0, color: 'var(--color-gray-500)', fontSize: '0.85rem' }}>Khu vực nội bộ</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(201,169,110,0.35)',
                borderRadius: '8px',
                padding: '0.6rem 1rem',
                background: 'var(--color-cream)',
                color: 'var(--color-black)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: logoutMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: logoutMutation.isPending ? 0.6 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              <LogOut size={16} />
              {logoutMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};