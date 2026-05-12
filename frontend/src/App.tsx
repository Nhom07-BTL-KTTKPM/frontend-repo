import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

// Layouts & Guards
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { GuestRoute } from './routes/GuestRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Home, ProductList, ProductDetail, Cart, Checkout, OrderHistory, Payment, VerifyEmail, ForgotPassword, ResetPassword, CategoryDetailPage, BrandDetailPage, Chat } from './pages';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { ProductManagement } from './pages/admin/ProductManagement';
import { UserManagement } from './pages/admin/UserManagement';


function App() {
  const { initSession } = useAuth();
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Hiển thị vòng xoáy (Loading screen) hoặc logo trong lúc chờ khôi phục session từ Backend
  if (!isInitialized) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-cream)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', letterSpacing: '4px', animation: 'sparkle 2s infinite' }}>LUMIÈRE</h1>
        <p style={{ color: 'var(--color-gray-500)' }}>Đang tải cửa hàng...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Nhóm Main Layout (có Header/Footer) */}
        <Route element={<MainLayout />}>
          
          {/* Public Routes (Ai cũng xem được) */}
          <Route path="/" element={<Home />} />
          <Route path="/categories/:slug" element={<CategoryDetailPage />} />
          <Route path="/brands/:slug" element={<BrandDetailPage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Guest Routes (Chỉ người CHƯA đăng nhập) */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes (Chỉ người ĐÃ đăng nhập) */}
        <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/ai-chat" element={<Chat />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<ProductManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
