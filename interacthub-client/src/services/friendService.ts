import api from './api';
import { ApiResponse, Friendship } from '../types';

export const friendService = {
  sendRequest: (receiverId: string) =>
    api.post<ApiResponse<Friendship>>(`/friends/request/${receiverId}`),

  accept: (friendshipId: number) =>
    api.put<ApiResponse<Friendship>>(`/friends/accept/${friendshipId}`),

  reject: (friendshipId: number) =>
    api.put<ApiResponse<string>>(`/friends/reject/${friendshipId}`),

  remove: (friendId: string) =>
    api.delete<ApiResponse<string>>(`/friends/${friendId}`),

  getAll: () =>
    api.get<ApiResponse<Friendship[]>>('/friends'),

  getPending: () =>
    api.get<ApiResponse<Friendship[]>>('/friends/pending'),

  getStatus: (userId: string) =>
    api.get<ApiResponse<{ status: string }>>(`/friends/status/${userId}`),
};
