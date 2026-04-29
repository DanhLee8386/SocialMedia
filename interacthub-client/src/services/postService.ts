import api from './api';
import { ApiResponse, PaginatedResponse, Post, Comment } from '../types';

export const postService = {
  create: (data: { content: string; imageUrl?: string }) =>
    api.post<ApiResponse<Post>>('/posts', data),

  getById: (id: number) =>
    api.get<ApiResponse<Post>>(`/posts/${id}`),

  getFeed: (page = 1, pageSize = 10) =>
    api.get<ApiResponse<PaginatedResponse<Post>>>(`/posts/feed?page=${page}&pageSize=${pageSize}`),

  getUserPosts: (userId: string, page = 1, pageSize = 10) =>
    api.get<ApiResponse<PaginatedResponse<Post>>>(`/posts/user/${userId}?page=${page}&pageSize=${pageSize}`),

  update: (id: number, data: { content: string }) =>
    api.put<ApiResponse<Post>>(`/posts/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<string>>(`/posts/${id}`),

  toggleLike: (id: number) =>
    api.post<ApiResponse<{ liked: boolean; likesCount: number }>>(`/posts/${id}/like`),

  addComment: (postId: number, data: { content: string }) =>
    api.post<ApiResponse<Comment>>(`/posts/${postId}/comments`, data),

  getComments: (postId: number, page = 1, pageSize = 10) =>
    api.get<ApiResponse<PaginatedResponse<Comment>>>(`/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`),

  deleteComment: (commentId: number) =>
    api.delete<ApiResponse<string>>(`/posts/comments/${commentId}`),

  share: (postId: number, data: { content?: string }) =>
    api.post<ApiResponse<Post>>(`/posts/${postId}/share`, data),

  search: (query: string, page = 1, pageSize = 10) =>
    api.get<ApiResponse<PaginatedResponse<Post>>>(`/posts/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`),
};
