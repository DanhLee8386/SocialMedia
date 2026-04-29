import { useState, useEffect, useCallback } from 'react';
import { FaTrash, FaPaperPlane } from 'react-icons/fa';
import { Comment } from '../../types';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

interface CommentSectionProps {
  postId: number;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user: currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await postService.getComments(postId);
      if (res.data.success) {
        setComments(res.data.data.items);
      }
    } catch {
      setError('Không thể tải bình luận. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    try {
      setSubmitting(true);
      const res = await postService.addComment(postId, { content: trimmed });
      if (res.data.success) {
        setComments((prev) => [res.data.data, ...prev]);
        setContent('');
      }
    } catch {
      setError('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (deletingId) return;
    try {
      setDeletingId(commentId);
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError('Không thể xóa bình luận.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="px-4 pb-4">
      {/* Form thêm bình luận */}
      <form onSubmit={handleSubmit} className="flex items-start gap-2 mb-4">
        <Avatar
          src={currentUser?.avatarUrl}
          alt={currentUser?.fullName}
          fallback={currentUser?.fullName}
          size="sm"
        />
        <div className="flex-1 flex items-center gap-2 bg-[#F0F2F5] rounded-full px-4 py-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Viết bình luận..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#1C1E21] placeholder-[#65676B] resize-none outline-none leading-5"
            style={{ maxHeight: '80px' }}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="text-[#1877F2] disabled:text-[#65676B] transition-colors shrink-0"
            aria-label="Gửi bình luận"
          >
            <FaPaperPlane size={14} />
          </button>
        </div>
      </form>

      {/* Lỗi */}
      {error && (
        <p className="text-sm text-red-500 mb-3">{error}</p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && comments.length === 0 && !error && (
        <p className="text-sm text-[#65676B] text-center py-4">
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </p>
      )}

      {/* Danh sách bình luận */}
      {!loading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isOwner = currentUser?.id === comment.user.id;
            return (
              <div key={comment.id} className="flex items-start gap-2 group">
                <Avatar
                  src={comment.user.avatarUrl}
                  alt={comment.user.fullName}
                  fallback={comment.user.fullName}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="inline-block bg-[#F0F2F5] rounded-2xl px-3 py-2 max-w-full">
                    <p className="text-xs font-semibold text-[#1C1E21] mb-0.5">
                      {comment.user.fullName}
                    </p>
                    <p className="text-sm text-[#1C1E21] leading-relaxed break-words">
                      {comment.content}
                    </p>
                  </div>
                  <p className="text-xs text-[#65676B] mt-1 ml-1">
                    {formatTimeAgo(comment.createdAt)}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 mt-2 text-[#65676B] hover:text-red-500 transition-all shrink-0"
                    aria-label="Xóa bình luận"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
