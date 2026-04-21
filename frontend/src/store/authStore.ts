import { create } from 'zustand';
import type { UserProfileInfo } from '../types/api';

interface AuthState {
  accessToken: string | null;
  user: UserProfileInfo | null;

  // Trạng thái kiểm tra xem ứng dụng đã load xong session tĩnh chưa (dùng cho Splash Screen/Loading ban đầu)
  isInitialized: boolean;
  isAuthenticated: boolean;

  // Actions
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserProfileInfo | null) => void;

  // Set toàn bộ dữ liệu cùng lúc khi Login thành công để tránh Re-render nhiều lần
  setCredentials: (user: UserProfileInfo, token: string) => void;

  // Đánh dấu app đã khởi tạo xong state (Thường gọi ở App.tsx sau khi call /me hoặc silent refresh)
  setInitialized: () => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  isAuthenticated: false,

  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

  setUser: (user) => set({ user }),

  setCredentials: (user, token) => set({
    user,
    accessToken: token,
    isAuthenticated: true
  }),

  setInitialized: () => set({ isInitialized: true }),

  logout: () => set({
    accessToken: null,
    user: null,
    isAuthenticated: false
  }),
}));

// Thêm các Custom Selectors tiện lợi để Component dùng thẳng không cần viết lại Logic
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'ADMIN');
export const useIsEmployee = () => useAuthStore((state) => state.user?.role === 'EMPLOYEE');
export const useIsCustomer = () => useAuthStore((state) => state.user?.role === 'CUSTOMER');
