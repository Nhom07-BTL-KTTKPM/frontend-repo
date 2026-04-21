import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import { LoginRequest, RegisterRequest } from '../types/auth';
import { ApiError } from '../types/api';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const logout = useAuthStore((state) => state.logout);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  // Lấy User profile (Trigger ngầm khi trang mới Load)
  const useMeQuery = (enabled = true) => useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getProfile(),
    enabled,
    retry: false, // Thất bại 1 lần = logout, ko cần retry /me
    staleTime: 5 * 60 * 1000, // Cache sống vài phút để tránh request liên tục
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (res) => {
      // 1. Phản hồi api có mang theo AccessToken
      const token = res.data.accessToken;
      
      // 2. Chờ tải thông tin Profile ngay sau khi login
      try {
        // Ta set tạm Token vào store để trigger Header cho request `/me` sắp tới
        useAuthStore.getState().setAccessToken(token); 
        const profileRes = await authApi.getProfile();
        
        // 3. Batch toàn bộ Session vào Zustand cùng lúc
        setCredentials(profileRes.data, token);
      } catch (e) {
        logout(); // Nếu lấy profile fail
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data)
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Xoá mọi cache hiện tại và đẩy Store về None bất chấp thành công hay thất bại server
      queryClient.clear();
      logout();
    }
  });

  // Một helper chạy ẩn để Init App (thường để ở Main Layout)
  const initSession = async () => {
    try {
      // Gọi /me. Nếu còn Session/Cookie, axios interceptor sẽ lo liệu refesh token -> gỡ rối 401
      const res = await authApi.getProfile();
      
      // Cập nhật profile (accessToken lúc này sẽ do interceptor tự động restore nếu có)
      const token = useAuthStore.getState().accessToken;
      if (token) {
         setCredentials(res.data, token);
      }
    } catch (e) {
      // Văng lỗi tức session trắng
      logout();
    } finally {
      setInitialized();
    }
  };

  return {
    useMeQuery,
    loginMutation,
    registerMutation,
    logoutMutation,
    initSession
  };
};
