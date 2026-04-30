export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export interface ApiError {
  code: number;
  message: string;
  errors?: Record<string, string>;
  traceId?: string;
  path?: string;
  timestamp?: string;
}

export interface AuthTokenResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

export interface UserProfileInfo {
  accountId: string;
  email: string;
  role: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status?: string;
  provider?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  issuedAt: string;
  expiresAt: string;
}
