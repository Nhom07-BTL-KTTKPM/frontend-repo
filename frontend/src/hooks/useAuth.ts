import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const logout = useAuthStore((state) => state.logout);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  const useMeQuery = (enabled = true) => useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getProfile(),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (res) => {
      const token = res.data.accessToken;
      try {
        useAuthStore.getState().setAccessToken(token);
        const profileRes = await authApi.getProfile();
        setCredentials(profileRes.data, token);
      } catch {
        logout();
      }
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (idToken: string) => authApi.googleLogin(idToken),
    onSuccess: async (res) => {
      const token = res.data.accessToken;
      try {
        useAuthStore.getState().setAccessToken(token);
        const profileRes = await authApi.getProfile();
        setCredentials(profileRes.data, token);
      } catch {
        logout();
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data)
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
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

      if (!token) {
        const { hasEverLoggedIn } = useAuthStore.getState();
        if (!hasEverLoggedIn) {
          // Fresh visitor, never logged in before - skip refresh to avoid 500/401 console spam
          return;
        }
        const refreshRes = await authApi.refresh();
        token = refreshRes.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
      }

      const res = await authApi.getProfile();
      if (token) {
        setCredentials(res.data, token);
      }
    } catch {
      logout();
    } finally {
      setInitialized();
    }
  };

  return {
    useMeQuery,
    loginMutation,
    googleLoginMutation,
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
