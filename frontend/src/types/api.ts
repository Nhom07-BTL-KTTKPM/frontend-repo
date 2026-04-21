export interface ApiResponse<T = any> {
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
  issuedAt: string;
  expiresAt: string;
}
