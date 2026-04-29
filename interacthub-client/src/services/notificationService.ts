import api from './api';
import { ApiResponse, PaginatedResponse, Notification } from '../types';

export const notificationService = {
  getAll: (page = 1, pageSize = 20) =>
    api.get<ApiResponse<PaginatedResponse<Notification>>>(`/notifications?page=${page}&pageSize=${pageSize}`),

  getUnreadCount: () =>
    api.get<ApiResponse<number>>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    api.put<ApiResponse<string>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiResponse<string>>('/notifications/read-all'),
};
