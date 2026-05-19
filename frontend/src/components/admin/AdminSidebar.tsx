import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, Users, Settings } from 'lucide-react';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.9rem 1rem',
  borderRadius: '14px',
  color: isActive ? 'var(--color-black)' : '#f5f0e7',
  background: isActive ? 'linear-gradient(135deg, var(--color-gold-light), var(--color-gold))' : 'transparent',
  textDecoration: 'none',
  fontWeight: 600,
  boxShadow: isActive ? '0 14px 30px rgba(201,169,110,0.28)' : 'none',
});

export const AdminSidebar = () => {
  return (
    <aside
      style={{
        padding: '1.5rem',
        background: 'linear-gradient(180deg, var(--color-charcoal) 0%, var(--color-black) 100%)',
        color: 'var(--color-cream)',
        boxShadow: 'inset -1px 0 0 rgba(201,169,110,0.14)',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-gold-light)' }}>
          Internal console
        </p>
        <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem', color: 'var(--color-cream)' }}>Lumière</h2>
      </div>

      <nav style={{ display: 'grid', gap: '0.75rem' }}>
        <NavLink to="/admin/dashboard" style={linkStyle}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/admin/products" style={linkStyle}>
          <PackageSearch size={18} />
          Quản lý sản phẩm
        </NavLink>
        <NavLink to="/admin/users" style={linkStyle}>
          <Users size={18} />
          Quản lý người dùng
        </NavLink>
        <NavLink to="/admin/profile" style={linkStyle}>
          <Settings size={18} />
          Quản lý thông tin cá nhân
        </NavLink>
      </nav>
    </aside>
  );
};