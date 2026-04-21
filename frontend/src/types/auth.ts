export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber: string;
}

export interface RegisterResponse {
  accountId: string;
  email: string;
  role: string;
}
