import { useState } from 'react';
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaTrash,
  FaEllipsisH,
} from 'react-icons/fa';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

interface PostCardProps {
  post: Post;
  onLike?: (postId: number) => void;
  onDelete?: (postId: number) => void;
  onShare?: (post: Post) => void;
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

function renderContent(content: string) {
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <span key={i} className="text-[#1877F2] font-medium cursor-pointer hover:underline">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function EmbeddedPost({ post }: { post: Post }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-[#F0F2F5] mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          src={post.user.avatarUrl}
          alt={post.user.fullName}
          fallback={post.user.fullName}
          size="sm"
        />
        <div>
          <p className="text-sm font-semibold text-[#1C1E21]">{post.user.fullName}</p>
          <p className="text-xs text-[#65676B]">{formatTimeAgo(post.createdAt)}</p>
        </div>
      </div>
      {post.content && (
        <p className="text-sm text-[#1C1E21] leading-relaxed">{renderContent(post.content)}</p>
      )}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Ảnh bài viết gốc"
          className="mt-2 w-full rounded-lg object-cover max-h-48"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </div>
  );
}

export default function PostCard({ post, onLike, onDelete, onShare }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(post.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const isOwner = currentUser?.id === post.user.id;

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.user.avatarUrl}
            alt={post.user.fullName}
            fallback={post.user.fullName}
            size="md"
          />
          <div>
            <p className="font-semibold text-[#1C1E21] text-sm leading-tight">
              {post.user.fullName}
            </p>
            <p className="text-xs text-[#65676B]">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F2F5] text-[#65676B] transition-colors"
            aria-label="Tuỳ chọn"
          >
            <FaEllipsisH size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-9 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] py-1">
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-[#F0F2F5] transition-colors"
                >
                  <FaTrash size={12} />
                  Xóa bài viết
                </button>
              )}
              {!isOwner && (
                <p className="px-4 py-2 text-sm text-[#65676B]">Không có tùy chọn</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay đóng menu khi click ngoài */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}

      {/* Content */}
      <div className="px-4 pb-2">
        {post.content && (
          <p className="text-[#1C1E21] text-sm leading-relaxed whitespace-pre-wrap">
            {renderContent(post.content)}
          </p>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.map((tag, i) => (
              <span
                key={i}
                className="text-sm text-[#1877F2] font-medium cursor-pointer hover:underline"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bài viết được chia sẻ */}
        {post.originalPost && <EmbeddedPost post={post.originalPost} />}
      </div>

      {/* Ảnh */}
      {post.imageUrl && !post.originalPost && (
        <div className="w-full">
          <img
            src={post.imageUrl}
            alt="Ảnh bài viết"
            className="w-full object-cover max-h-[500px]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Stats */}
      {(likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#65676B] border-t border-gray-100 mt-1">
          <div className="flex items-center gap-1">
            {likesCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <FaHeart size={8} className="text-white" />
                </span>
                {likesCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.commentsCount > 0 && (
              <span>{post.commentsCount} bình luận</span>
            )}
            {post.sharesCount > 0 && (
              <span>{post.sharesCount} lượt chia sẻ</span>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center border-t border-gray-100 mx-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[#F0F2F5] ${
            liked ? 'text-red-500' : 'text-[#65676B]'
          }`}
        >
          {liked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
          Thích
        </button>

        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#65676B] rounded-lg hover:bg-[#F0F2F5] transition-colors">
          <FaComment size={15} />
          Bình luận
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-[#65676B] rounded-lg hover:bg-[#F0F2F5] transition-colors"
        >
          <FaShare size={14} />
          Chia sẻ
        </button>
      </div>
    </article>
  );
}
