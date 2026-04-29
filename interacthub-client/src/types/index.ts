export interface UserSearch {
  id: string;
  userName: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
  createdAt: string;
  lastActive: string | null;
  isActive: boolean;
  friendsCount: number;
  postsCount: number;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  user: User;
}

export interface Post {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: UserSearch;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLikedByCurrentUser: boolean;
  originalPost: Post | null;
  hashtags: string[];
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: UserSearch;
}

export interface Friendship {
  id: number;
  status: string;
  createdAt: string;
  user: UserSearch;
}

export interface Story {
  id: number;
  imageUrl: string | null;
  content: string | null;
  createdAt: string;
  expiresAt: string;
  user: UserSearch;
}

export interface Notification {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  triggeredByUser: UserSearch | null;
  postId: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
