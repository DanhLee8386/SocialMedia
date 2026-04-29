import api from './api';
import { ApiResponse, AuthResponse } from '../types';

export const authService = {
  register: (data: { userName: string; email: string; password: string; fullName: string; dateOfBirth?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),
};
