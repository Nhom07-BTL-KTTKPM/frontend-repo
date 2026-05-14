import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore, useIsAdmin, useIsEmployee } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { cartApi } from '../../api/cartApi';
import { Search, ShoppingBag, UserCircle, ClipboardList } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accountId = useAuthStore((state) => state.user?.accountId);
  const { logoutMutation } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    let isMounted = true;

    const loadCartCount = async () => {
      if (!isAuthenticated || !accountId) {
        setCartCount(0);
        return;
      }
      try {
        const res = await cartApi.getCartByAccountId(accountId);
        if (isMounted) {
          const total = res.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
          setCartCount(total);
        }
      } catch {
        if (isMounted) {
          setCartCount(0);
        }
      }
    };

    loadCartCount();
    const handler = () => loadCartCount();
    window.addEventListener('cart:updated', handler);

    return () => {
      isMounted = false;
      window.removeEventListener('cart:updated', handler);
    };
  }, [isAuthenticated, accountId]);


  const isAdmin = useIsAdmin();
  const isEmployee = useIsEmployee();
  const canAccessDashboard = isAdmin || isEmployee;

  return (
    <header className="header" id="header" style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(250, 246, 240, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(201,169,110,0.15)' }}>
      <div className="header__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px', maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>

        {/* Logo */}
        <Link to="/" className="logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span className="logo__main" style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-black)', letterSpacing: '6px', textTransform: 'uppercase' }}>Lumière</span>
          <span className="logo__sub" style={{ fontFamily: 'var(--font-accent)', fontSize: '0.7rem', color: 'var(--color-gold)', letterSpacing: '5px', textTransform: 'uppercase' }}>Beauty & Skincare</span>
        </Link>

        {/* Navigation */}
        <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <ul className="nav__list" style={{ display: 'flex', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li className="nav__item">
              <Link to="/" className="nav__link">Trang chủ</Link>
            </li>
            <li className="nav__item">
              <Link to="/products" className="nav__link">Sản phẩm</Link>
            </li>
            {canAccessDashboard && (
              <li className="nav__item">
                <Link to="/admin/dashboard" className="nav__link" style={{ color: 'var(--color-error)', fontWeight: 'bold' }}>Dashboard Nội Bộ</Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="header__actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="header__action-btn" aria-label="Tìm kiếm" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px' }}>
            <Search size={20} />
          </button>
          <Link to="/cart" className="header__action-btn" aria-label="Giỏ hàng" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px', position: 'relative' }}>
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="badge" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-gold)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '50%' }}>{cartCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/orders" className="header__action-btn" aria-label="Đơn hàng" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px' }}>
                <ClipboardList size={20} />
              </Link>
              <Link to="/profile" className="header__action-btn" aria-label="Tài khoản" style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '10px' }}>
                <UserCircle size={20} />
              </Link>
              <button onClick={() => logoutMutation.mutate()} style={{ background: 'none', border: '1px solid var(--color-gray-300)', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="btn btn--primary btn--sm" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
