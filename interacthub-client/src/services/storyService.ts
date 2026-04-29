import api from './api';
import { ApiResponse, Story } from '../types';

export const storyService = {
  create: (data: { content?: string; imageUrl?: string }) =>
    api.post<ApiResponse<Story>>('/stories', data),

  getFeed: () =>
    api.get<ApiResponse<Story[]>>('/stories/feed'),

  getMine: () =>
    api.get<ApiResponse<Story[]>>('/stories/me'),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/stories/${id}`),
};
