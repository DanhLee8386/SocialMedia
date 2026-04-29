import api from './api';
import { ApiResponse, PaginatedResponse, User, UserSearch } from '../types';

export const userService = {
  getMe: () =>
    api.get<ApiResponse<User>>('/users/me'),

  getById: (id: string) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  updateProfile: (data: { fullName?: string; bio?: string; dateOfBirth?: string }) =>
    api.put<ApiResponse<User>>('/users/me', data),

  updateAvatar: (imageUrl: string) =>
    api.put<ApiResponse<string>>('/users/me/avatar', { imageUrl }),

  updateCover: (imageUrl: string) =>
    api.put<ApiResponse<string>>('/users/me/cover', { imageUrl }),

  search: (query: string, page = 1, pageSize = 10) =>
    api.get<ApiResponse<PaginatedResponse<UserSearch>>>(`/users/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`),

  getAll: () =>
    api.get<ApiResponse<User[]>>('/users'),

  toggleActive: (userId: string) =>
    api.put<ApiResponse<string>>(`/users/${userId}/toggle-active`),
};
