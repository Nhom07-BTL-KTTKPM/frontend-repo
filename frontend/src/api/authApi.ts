import { axiosClient } from './axiosClient';
import type { ApiResponse, AuthTokenResponse, UserProfileInfo } from '../types/api';
import type { LoginRequest, RegisterRequest, RegisterResponse } from '../types/auth';

export const authApi = {
  // Thực hiện đăng nhập
  login: (data: LoginRequest) => {
    return axiosClient.post<any, ApiResponse<AuthTokenResponse>>('/auth/login', data);
  },

  // Thực hiện đăng ký
  register: (data: RegisterRequest) => {
    return axiosClient.post<any, ApiResponse<RegisterResponse>>('/auth/register', data);
  },

  // Tải lại Access token (dùng cho trường hợp chủ động)
  refresh: () => {
    return axiosClient.post<any, ApiResponse<AuthTokenResponse>>('/auth/refresh');
  },

  // Đăng xuất và clear refresh-cookie trên Backend
  logout: () => {
    return axiosClient.post<any, ApiResponse<void>>('/auth/logout');
  },

  // Truy vấn thông tin tài khoản đang đăng nhập
  getProfile: () => {
    return axiosClient.get<any, ApiResponse<UserProfileInfo>>('/auth/me');
  },
};
