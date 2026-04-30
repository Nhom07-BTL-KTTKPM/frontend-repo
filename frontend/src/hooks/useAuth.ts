import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types/auth';

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
      } catch {
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

  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token)
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data)
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data)
  });

  const requestChangePasswordMutation = useMutation({
    mutationFn: () => authApi.requestChangePassword()
  });

  const confirmChangePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.confirmChangePassword(data)
  });

  const initSession = async () => {
    try {
      let token = useAuthStore.getState().accessToken;

      // Nếu bộ nhớ RAM đang không có Token (Vừa F5 tải lại trang), ta CHỦ ĐỘNG đi xin lại bằng Refresh API
      // Thay vì gọi ngang /me và bị Interceptor vứt bỏ do thiếu AccessToken.
      if (!token) {
        const refreshRes = await authApi.refresh();
        // axiosClient interceptor đã unwrap response.data rồi,
        // nên refreshRes là ApiResponse<AuthTokenResponse> trực tiếp (không phải AxiosResponse)
        token = refreshRes.data.accessToken;
        useAuthStore.getState().setAccessToken(token); // Tạm ghi nhận để axios gửi tiếp call /me
      }

      // Lúc này chắc chắn có accessToken rồi, gọi lấy Profile
      const res = await authApi.getProfile();

      if (token) {
        setCredentials(res.data, token);
      }
    } catch {
      // Văng lỗi tức session trắng (Hết cả 2 token)
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
    verifyEmailMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
    requestChangePasswordMutation,
    confirmChangePasswordMutation,
    initSession
  };
};
