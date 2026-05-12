import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import api from '../services/api';
import { Post, Comment, ApiResponse } from '../types';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import StoryBar from '../components/stories/StoryBar';

// ─── ShareModal ──────────────────────────────────────────────────────────────
function ShareModal({
  post,
  onClose,
  onShared,
}: {
  post: Post;
  onClose: () => void;
  onShared: (newPost: Post) => void;
}) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleShare = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await postService.share(post.id, { content: caption.trim() });
      onShared(res.data.data);
      onClose();
    } catch {
      setError('Không thể chia sẻ bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1C1E21]">Chia sẻ bài viết</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] text-[#65676B] transition"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Caption input */}
        <div className="px-5 py-4">
          <div className="flex gap-3 mb-4">
            <Avatar src={user?.avatarUrl} fallback={user?.fullName} size="md" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1C1E21]">{user?.fullName}</p>
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết gì đó về bài viết này..."
                rows={3}
                className="mt-1 w-full bg-[#F0F2F5] rounded-xl px-4 py-2.5 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 resize-none transition"
              />
            </div>
          </div>

          {/* Original post preview */}
          <div className="border border-gray-200 rounded-xl p-3 bg-[#F7F8FA]">
            <div className="flex items-center gap-2 mb-2">
              <Avatar src={post.user.avatarUrl} fallback={post.user.fullName} size="sm" />
              <div>
                <p className="text-xs font-semibold text-[#1C1E21]">{post.user.fullName}</p>
                <p className="text-xs text-[#65676B]">@{post.user.userName}</p>
              </div>
            </div>
            {post.content && (
              <p className="text-sm text-[#1C1E21] line-clamp-3 leading-relaxed">{post.content}</p>
            )}
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Ảnh bài viết"
                className="mt-2 w-full rounded-lg object-cover max-h-40"
              />
            )}
          </div>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleShare} loading={loading}>
            Chia sẻ ngay
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PostCard ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onDelete, onCommentAdded, onShare }: {
  post: Post;
  onLike: (id: number) => void;
  onDelete?: (id: number) => void;
  onCommentAdded?: (postId: number) => void;
  onShare?: (post: Post) => void;
}) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.id === post.user.id;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await postService.getComments(post.id, 1, 50);
      setComments(res.data.data.items);
    } catch {
      // silent
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      loadComments();
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await postService.addComment(post.id, { content: commentText.trim() });
      setComments((prev) => [res.data.data, ...prev]);
      setCommentText('');
      onCommentAdded?.(post.id);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silent
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    onDelete?.(post.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Link to={`/profile/${post.user.id}`}>
          <Avatar src={post.user.avatarUrl} fallback={post.user.fullName} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.user.id}`} className="font-semibold text-[#1C1E21] hover:underline text-sm">
            {post.user.fullName}
          </Link>
          <p className="text-xs text-[#65676B]">@{post.user.userName} · {formatDate(post.createdAt)}</p>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-[#65676B] hover:text-red-500 transition p-1 rounded"
            aria-label="Xóa bài viết"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
            </svg>
          </button>
        )}
      </div>

      {/* Shared post banner */}
      {post.originalPost && (
        <div className="mx-4 mb-2 p-3 bg-[#F0F2F5] rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Avatar src={post.originalPost.user.avatarUrl} fallback={post.originalPost.user.fullName} size="sm" />
            <span className="text-sm font-semibold text-[#1C1E21]">{post.originalPost.user.fullName}</span>
          </div>
          <p className="text-sm text-[#1C1E21] line-clamp-3">{post.originalPost.content}</p>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-[#1C1E21] whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-[#1877F2] hover:underline cursor-pointer">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <img
            src={post.imageUrl}
            alt="Ảnh bài viết"
            className="w-full max-h-[500px] object-cover rounded-xl"
          />
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-[#65676B]">
        <span>{post.likesCount} lượt thích</span>
        <button type="button" onClick={handleToggleComments} className="hover:underline">
          {post.commentsCount + comments.filter(c => !c.id).length} bình luận
        </button>
        <span>{post.sharesCount} chia sẻ</span>
      </div>

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-2">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${post.isLikedByCurrentUser ? 'text-[#1877F2] bg-[#E7F3FF]' : 'text-[#65676B] hover:bg-[#F0F2F5]'}`}
        >
          <svg className="w-4 h-4" fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          Thích
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Bình luận
        </button>
        <button
          type="button"
          onClick={() => onShare?.(post)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Chia sẻ
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {/* Comment input */}
          <div className="flex gap-2">
            <Avatar src={user?.avatarUrl} fallback={user?.fullName} size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleComment()}
                placeholder="Viết bình luận..."
                className="flex-1 bg-[#F0F2F5] rounded-full px-4 py-2 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
              <Button size="sm" onClick={handleComment} loading={submitting} disabled={!commentText.trim()}>
                Gửi
              </Button>
            </div>
          </div>

          {/* Comments list */}
          {loadingComments ? (
            <div className="flex justify-center py-3">
              <LoadingSpinner size="sm" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[#65676B] text-center py-2">Chưa có bình luận nào</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 group">
                  <Link to={`/profile/${c.user.id}`}>
                    <Avatar src={c.user.avatarUrl} fallback={c.user.fullName} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#F0F2F5] rounded-2xl px-3 py-2">
                      <Link to={`/profile/${c.user.id}`} className="text-xs font-semibold text-[#1C1E21] hover:underline">
                        {c.user.fullName}
                      </Link>
                      <p className="text-sm text-[#1C1E21]">{c.content}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 px-1">
                      <span className="text-xs text-[#65676B]">{formatDate(c.createdAt)}</span>
                      {c.user.id === user?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-xs text-[#65676B] hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CreatePostForm ───────────────────────────────────────────────────────────
function CreatePostForm({ onCreated }: { onCreated: (post: Post) => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const payload: { content: string; imageUrl?: string } = { content: content.trim() };
      if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();
      const res = await postService.create(payload);
      onCreated(res.data.data);
      setContent('');
      setImageUrl('');
      setExpanded(false);
    } catch {
      setError('Không thể đăng bài. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex gap-3">
        <Avatar src={user?.avatarUrl} fallback={user?.fullName} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder={`${user?.fullName ?? 'Bạn'} ơi, bạn đang nghĩ gì vậy?`}
            rows={expanded ? 3 : 1}
            className="w-full bg-[#F0F2F5] rounded-xl px-4 py-2.5 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 resize-none transition"
          />

          {expanded && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL ảnh (tùy chọn)..."
                className="w-full bg-[#F0F2F5] rounded-xl px-4 py-2 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setExpanded(false); setContent(''); setImageUrl(''); }}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSubmit} loading={loading} disabled={!content.trim()}>
                  Đăng bài
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// ─── TrendingHashtags ─────────────────────────────────────────────────────────
function TrendingHashtags() {
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState<{ id: number; name: string; usageCount: number }[]>([]);

  useEffect(() => {
    api.get<ApiResponse<{ id: number; name: string; usageCount: number }[]>>('/hashtags/trending')
      .then((r) => setHashtags(r.data.data ?? []))
      .catch(() => {});
  }, []);

  if (hashtags.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-[#1C1E21] mb-3">Hashtag thịnh hành</h3>
      <ul className="space-y-2">
        {hashtags.slice(0, 10).map((h) => (
          <li key={h.id} className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(`/search?q=%23${h.name}`)}
              className="text-sm text-[#1877F2] font-medium hover:underline cursor-pointer"
            >
              #{h.name}
            </button>
            <span className="text-xs text-[#65676B]">{h.usageCount} bài</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── FeedPage ─────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadPosts = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await postService.getFeed(pageNum, 10);
      const data = res.data.data;
      if (pageNum === 1) {
        setPosts(data.items);
      } else {
        setPosts((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.hasNextPage);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPosts(next);
  };

  const handlePostCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleLike = async (id: number) => {
    // Optimistic update - cập nhật UI trước
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isLikedByCurrentUser: !p.isLikedByCurrentUser,
              likesCount: p.isLikedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );
    try {
      await postService.toggleLike(id);
    } catch {
      // Revert nếu lỗi
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                isLikedByCurrentUser: !p.isLikedByCurrentUser,
                likesCount: p.isLikedByCurrentUser ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p
        )
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await postService.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silent
    }
  };

  // ── Share ──────────────────────────────────────────────────────────────────
  const [shareTargetPost, setShareTargetPost] = useState<Post | null>(null);

  const handleShareClick = (post: Post) => {
    setShareTargetPost(post);
  };

  const handleShareDone = (newPost: Post) => {
    // Prepend shared post to feed + increment sharesCount on original
    setPosts((prev) => [
      newPost,
      ...prev.map((p) =>
        p.id === shareTargetPost?.id ? { ...p, sharesCount: p.sharesCount + 1 } : p
      ),
    ]);
  };

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-20 space-y-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar src={user?.avatarUrl} fallback={user?.fullName} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1C1E21] truncate">{user?.fullName}</p>
                <p className="text-xs text-[#65676B] truncate">@{user?.userName}</p>
              </div>
            </div>
            <nav className="space-y-1">
              {[
                { to: '/feed', label: 'Trang chủ', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { to: '/friends', label: 'Bạn bè', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { to: '/notifications', label: 'Thông báo', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                { to: `/profile/${user?.id}`, label: 'Trang cá nhân', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              ].map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[#1C1E21] hover:bg-[#F0F2F5] transition"
                >
                  <svg className="w-5 h-5 text-[#1877F2] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Center - feed */}
      <div className="flex-1 min-w-0 space-y-4">
        <CreatePostForm onCreated={handlePostCreated} />

        {initialLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <LoadingSkeleton />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <svg className="w-12 h-12 text-[#65676B] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[#65676B] font-medium">Chưa có bài viết nào</p>
            <p className="text-[#65676B] text-sm mt-1">Hãy kết bạn để xem bài viết của họ!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDelete}
                onShare={handleShareClick}
                onCommentAdded={(postId) =>
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
                    )
                  )
                }
              />
            ))}

            {/* Share Modal */}
            {shareTargetPost && (
              <ShareModal
                post={shareTargetPost}
                onClose={() => setShareTargetPost(null)}
                onShared={handleShareDone}
              />
            )}
            {hasMore && (
              <div className="text-center">
                <Button variant="secondary" onClick={handleLoadMore} loading={loading}>
                  Tải thêm bài viết
                </Button>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-sm text-[#65676B] py-4">Bạn đã xem hết bài viết</p>
            )}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-20 space-y-4">
          <StoryBar />
          <TrendingHashtags />
        </div>
      </aside>
    </div>
  );
}
