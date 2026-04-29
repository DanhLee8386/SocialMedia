import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { Post, UserSearch } from '../types';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

type Tab = 'posts' | 'users';

// ─── PostSearchCard ───────────────────────────────────────────────────────────
function PostSearchCard({ post }: { post: Post }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.user.id}`}>
          <Avatar src={post.user.avatarUrl} fallback={post.user.fullName} size="sm" />
        </Link>
        <div>
          <Link to={`/profile/${post.user.id}`} className="text-sm font-semibold text-[#1C1E21] hover:underline">
            {post.user.fullName}
          </Link>
          <p className="text-xs text-[#65676B]">{formatDate(post.createdAt)}</p>
        </div>
      </div>
      <p className="text-sm text-[#1C1E21] whitespace-pre-wrap leading-relaxed line-clamp-4">{post.content}</p>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Ảnh" className="mt-3 w-full max-h-48 object-cover rounded-xl" />
      )}
      {post.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.hashtags.map((t) => (
            <span key={t} className="text-xs text-[#1877F2]">#{t}</span>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-4 text-xs text-[#65676B]">
        <span>{post.likesCount} thích</span>
        <span>{post.commentsCount} bình luận</span>
      </div>
    </div>
  );
}

// ─── UserSearchCard ───────────────────────────────────────────────────────────
function UserSearchCard({ user }: { user: UserSearch }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <Link to={`/profile/${user.id}`}>
        <Avatar src={user.avatarUrl} fallback={user.fullName} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.id}`} className="font-semibold text-[#1C1E21] hover:underline text-sm block truncate">
          {user.fullName}
        </Link>
        <p className="text-xs text-[#65676B]">@{user.userName}</p>
      </div>
      <Link to={`/profile/${user.id}`}>
        <Button variant="secondary" size="sm">Xem trang</Button>
      </Link>
    </div>
  );
}

// ─── SearchPage ───────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserSearch[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [postPage, setPostPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);

  const searchPosts = useCallback(async (q: string, pageNum: number) => {
    if (pageNum === 1) setLoadingPosts(true);
    else setLoadingMorePosts(true);
    try {
      const res = await postService.search(q, pageNum, 10);
      const data = res.data.data;
      if (pageNum === 1) {
        setPosts(data.items);
      } else {
        setPosts((prev) => [...prev, ...data.items]);
      }
      setHasMorePosts(data.hasNextPage);
    } catch {
      // silent
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  }, []);

  const searchUsers = useCallback(async (q: string, pageNum: number) => {
    if (pageNum === 1) setLoadingUsers(true);
    else setLoadingMoreUsers(true);
    try {
      const res = await userService.search(q, pageNum, 10);
      const data = res.data.data;
      if (pageNum === 1) {
        setUsers(data.items);
      } else {
        setUsers((prev) => [...prev, ...data.items]);
      }
      setHasMoreUsers(data.hasNextPage);
    } catch {
      // silent
    } finally {
      setLoadingUsers(false);
      setLoadingMoreUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    setPostPage(1);
    setUserPage(1);
    searchPosts(query, 1);
    searchUsers(query, 1);
  }, [query, searchPosts, searchUsers]);

  if (!query.trim()) {
    return (
      <div className="max-w-[720px] mx-auto text-center py-20">
        <svg className="w-14 h-14 text-[#65676B] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <p className="text-[#65676B] font-medium text-lg">Nhập từ khóa để tìm kiếm</p>
        <p className="text-[#65676B] text-sm mt-1">Tìm kiếm bài viết, người dùng trên InteractHub</p>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1C1E21]">
          Kết quả tìm kiếm cho &quot;{query}&quot;
        </h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === 'posts'
                ? 'text-[#1877F2] border-b-2 border-[#1877F2]'
                : 'text-[#65676B] hover:bg-[#F0F2F5]'
            }`}
          >
            Bài viết
            {!loadingPosts && (
              <span className="ml-1.5 text-xs bg-[#F0F2F5] text-[#65676B] px-2 py-0.5 rounded-full">
                {posts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              activeTab === 'users'
                ? 'text-[#1877F2] border-b-2 border-[#1877F2]'
                : 'text-[#65676B] hover:bg-[#F0F2F5]'
            }`}
          >
            Người dùng
            {!loadingUsers && (
              <span className="ml-1.5 text-xs bg-[#F0F2F5] text-[#65676B] px-2 py-0.5 rounded-full">
                {users.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="w-12 h-12 text-[#65676B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#65676B] font-medium">Không tìm thấy bài viết nào</p>
              <p className="text-[#65676B] text-sm mt-1">Thử tìm với từ khóa khác</p>
            </div>
          ) : (
            <>
              {posts.map((p) => <PostSearchCard key={p.id} post={p} />)}
              {hasMorePosts && (
                <div className="text-center pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const next = postPage + 1;
                      setPostPage(next);
                      searchPosts(query, next);
                    }}
                    loading={loadingMorePosts}
                  >
                    Tải thêm
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="w-12 h-12 text-[#65676B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-[#65676B] font-medium">Không tìm thấy người dùng nào</p>
              <p className="text-[#65676B] text-sm mt-1">Thử tìm với từ khóa khác</p>
            </div>
          ) : (
            <>
              {users.map((u) => <UserSearchCard key={u.id} user={u} />)}
              {hasMoreUsers && (
                <div className="text-center pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const next = userPage + 1;
                      setUserPage(next);
                      searchUsers(query, next);
                    }}
                    loading={loadingMoreUsers}
                  >
                    Tải thêm
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
