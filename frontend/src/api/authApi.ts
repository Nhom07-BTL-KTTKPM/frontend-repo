import { axiosClient } from './axiosClient';
import type { ApiResponse, AuthTokenResponse, UserProfileInfo } from '../types/api';
import type { LoginRequest, RegisterRequest, RegisterResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest } from '../types/auth';

export const authApi = {
  // Thực hiện đăng nhập
  login: (data: LoginRequest) => {
    return axiosClient.post<unknown, ApiResponse<AuthTokenResponse>>('/auth/login', data);
  },

  // Thực hiện đăng ký
  register: (data: RegisterRequest) => {
    return axiosClient.post<unknown, ApiResponse<RegisterResponse>>('/auth/register', data);
  },

  // Tải lại Access token (dùng cho trường hợp chủ động)
  refresh: () => {
    return axiosClient.post<unknown, ApiResponse<AuthTokenResponse>>('/auth/refresh');
  },

  // Đăng xuất và clear refresh-cookie trên Backend
  logout: () => {
    return axiosClient.post<unknown, ApiResponse<void>>('/auth/logout');
  },

  // Truy vấn thông tin tài khoản đang đăng nhập
  getProfile: () => {
    return axiosClient.get<unknown, ApiResponse<UserProfileInfo>>('/auth/me');
  },

  // Xác thực email
  verifyEmail: (token: string) => {
    return axiosClient.get<unknown, ApiResponse<void>>(`/auth/verify-email?token=${token}`);
  },

  // Quên mật khẩu
  forgotPassword: (data: ForgotPasswordRequest) => {
    return axiosClient.post<unknown, ApiResponse<void>>('/auth/forgot-password', data);
  },

  // Đặt lại mật khẩu
  resetPassword: (data: ResetPasswordRequest) => {
    return axiosClient.post<unknown, ApiResponse<void>>('/auth/reset-password', data);
  },

  // Yêu cầu đổi mật khẩu
  requestChangePassword: () => {
    return axiosClient.post<unknown, ApiResponse<void>>('/auth/change-password/request');
  },

  // Xác nhận đổi mật khẩu
  confirmChangePassword: (data: ChangePasswordRequest) => {
    return axiosClient.post<unknown, ApiResponse<void>>('/auth/change-password/confirm', data);
  },
};
