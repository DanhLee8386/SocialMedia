import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { friendService } from '../services/friendService';
import { User, Post, Friendship } from '../types';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LoadingSkeleton from '../components/common/LoadingSkeleton';

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function EmbeddedPostMini({ post }: { post: Post }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-[#F0F2F5] mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Avatar
          src={post.user.avatarUrl}
          fallback={post.user.fullName}
          size="sm"
        />
        <div>
          <p className="text-sm font-semibold text-[#1C1E21]">{post.user.fullName}</p>
          <p className="text-xs text-[#65676B]">{formatTimeAgo(post.createdAt)}</p>
        </div>
      </div>
      {post.content && (
        <p className="text-sm text-[#1C1E21] leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Ảnh bài viết gốc"
          className="mt-2 w-full rounded-lg object-cover max-h-48"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

// ─── Mini PostCard dùng trong ProfilePage ────────────────────────────────────
function ProfilePostCard({ post, onLike, onDelete, isOwner }: {
  post: Post;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  isOwner: boolean;
}) {
  const [liked, setLiked] = useState(post.isLikedByCurrentUser);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike(post.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header: avatar + tên + thời gian + nút xóa */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar
            src={post.user.avatarUrl}
            fallback={post.user.fullName}
            size="sm"
          />
          <div>
            <p className="text-sm font-semibold text-[#1C1E21] leading-tight">{post.user.fullName}</p>
            <p className="text-xs text-[#65676B]">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => { if (window.confirm('Xóa bài viết này?')) onDelete(post.id); }}
            className="text-[#65676B] hover:text-red-500 transition"
            aria-label="Xóa"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {post.content && (
          <p className="text-sm text-[#1C1E21] whitespace-pre-wrap leading-relaxed">{post.content}</p>
        )}
        {post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((t) => (
              <span key={t} className="text-xs text-[#1877F2] font-medium">#{t}</span>
            ))}
          </div>
        )}
        {/* Bài viết được chia sẻ (share post) */}
        {post.originalPost && <EmbeddedPostMini post={post.originalPost} />}
      </div>

      {/* Ảnh - chỉ hiện khi không phải share post */}
      {post.imageUrl && !post.originalPost && (
        <img
          src={post.imageUrl}
          alt="Ảnh bài viết"
          className="w-full max-h-[400px] object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-1 text-xs text-[#65676B]">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition hover:bg-[#F0F2F5] font-medium ${
            liked ? 'text-[#1877F2] font-semibold' : 'text-[#65676B]'
          }`}
        >
          <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {likesCount > 0 ? `${likesCount} ` : ''}Thích
        </button>
        <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[#65676B]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.commentsCount > 0 ? `${post.commentsCount} ` : ''}Bình luận
        </span>
        <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[#65676B]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {post.sharesCount > 0 ? `${post.sharesCount} ` : ''}Chia sẻ
        </span>
      </div>
    </div>
  );
}

// ─── EditProfileModal ─────────────────────────────────────────────────────────
type EditTab = 'info' | 'avatar' | 'cover';

function EditProfileModal({ user, onClose, onUpdated }: {
  user: User;
  onClose: () => void;
  onUpdated: (u: User) => void;
}) {
  const { updateUser } = useAuth();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<EditTab>('info');

  // ── Info tab ──
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio ?? '');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState('');

  // ── Avatar tab ──
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  // ── Cover tab ──
  const [coverUrl, setCoverUrl] = useState(user.coverPhotoUrl ?? '');
  const [coverPreview, setCoverPreview] = useState(user.coverPhotoUrl ?? '');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [coverSuccess, setCoverSuccess] = useState(false);

  // ── Handlers ──
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setInfoError('Tên không được để trống'); return; }
    setInfoLoading(true);
    setInfoError('');
    try {
      const res = await userService.updateProfile({ fullName: fullName.trim(), bio: bio.trim() });
      const updated = res.data.data;
      updateUser(updated);
      onUpdated(updated);
      onClose();
    } catch {
      setInfoError('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarUrl.trim()) { setAvatarError('Vui lòng nhập URL ảnh'); return; }
    setAvatarLoading(true);
    setAvatarError('');
    setAvatarSuccess(false);
    try {
      await userService.updateAvatar(avatarUrl.trim());
      const updated: User = { ...user, avatarUrl: avatarUrl.trim() };
      updateUser(updated);
      onUpdated(updated);
      setAvatarSuccess(true);
    } catch {
      setAvatarError('Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveCover = async () => {
    if (!coverUrl.trim()) { setCoverError('Vui lòng nhập URL ảnh'); return; }
    setCoverLoading(true);
    setCoverError('');
    setCoverSuccess(false);
    try {
      await userService.updateCover(coverUrl.trim());
      const updated: User = { ...user, coverPhotoUrl: coverUrl.trim() };
      updateUser(updated);
      onUpdated(updated);
      setCoverSuccess(true);
    } catch {
      setCoverError('Cập nhật ảnh bìa thất bại. Vui lòng thử lại.');
    } finally {
      setCoverLoading(false);
    }
  };

  const tabs: { key: EditTab; label: string; icon: string }[] = [
    { key: 'info',   label: 'Thông tin', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'avatar', label: 'Ảnh đại diện', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' },
    { key: 'cover',  label: 'Ảnh bìa', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1C1E21]">Chỉnh sửa trang cá nhân</h2>
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

        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition border-b-2 ${
                activeTab === t.key
                  ? 'border-[#1877F2] text-[#1877F2]'
                  : 'border-transparent text-[#65676B] hover:text-[#1C1E21] hover:bg-[#F0F2F5]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Thông tin ── */}
        {activeTab === 'info' && (
          <form onSubmit={handleInfoSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1C1E21] mb-1">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1C1E21] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1E21] mb-1">Giới thiệu</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Viết gì đó về bản thân..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1C1E21] outline-none focus:ring-2 focus:ring-[#1877F2]/30 resize-none transition"
              />
            </div>
            {infoError && <p className="text-red-500 text-sm">{infoError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={onClose}>Hủy</Button>
              <Button type="submit" loading={infoLoading}>Lưu thay đổi</Button>
            </div>
          </form>
        )}

        {/* ── Tab: Ảnh đại diện ── */}
        {activeTab === 'avatar' && (
          <div className="px-6 py-5 space-y-4">
            {/* Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview ảnh đại diện"
                    onError={() => setAvatarPreview('')}
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-[#1877F2]/20 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-[#F0F2F5] ring-4 ring-gray-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[#65676B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center shadow">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-[#65676B]">Xem trước ảnh đại diện</p>
            </div>

            {/* URL input */}
            <div>
              <label className="block text-sm font-medium text-[#1C1E21] mb-1">URL ảnh đại diện</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value); setAvatarSuccess(false); }}
                placeholder="https://example.com/avatar.jpg"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1C1E21] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
              <p className="text-xs text-[#65676B] mt-1">Dán URL ảnh để xem trước ngay lập tức</p>
            </div>

            {avatarError && <p className="text-red-500 text-sm">{avatarError}</p>}
            {avatarSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cập nhật ảnh đại diện thành công!
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={onClose}>Đóng</Button>
              <Button onClick={handleSaveAvatar} loading={avatarLoading} disabled={!avatarUrl.trim()}>
                Lưu ảnh đại diện
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab: Ảnh bìa ── */}
        {activeTab === 'cover' && (
          <div className="px-6 py-5 space-y-4">
            {/* Preview */}
            <div>
              <p className="text-xs text-[#65676B] mb-2">Xem trước ảnh bìa</p>
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-r from-[#1877F2] to-[#42A5F5] shadow-inner">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Preview ảnh bìa"
                    onError={() => setCoverPreview('')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Camera overlay button */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ảnh bìa
                </div>
              </div>
            </div>

            {/* URL input */}
            <div>
              <label className="block text-sm font-medium text-[#1C1E21] mb-1">URL ảnh bìa</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => { setCoverUrl(e.target.value); setCoverPreview(e.target.value); setCoverSuccess(false); }}
                placeholder="https://example.com/cover.jpg"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#1C1E21] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
              <p className="text-xs text-[#65676B] mt-1">Dán URL ảnh để xem trước ngay lập tức</p>
            </div>

            {coverError && <p className="text-red-500 text-sm">{coverError}</p>}
            {coverSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-xl px-4 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cập nhật ảnh bìa thành công!
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" type="button" onClick={onClose}>Đóng</Button>
              <Button onClick={handleSaveCover} loading={coverLoading} disabled={!coverUrl.trim()}>
                Lưu ảnh bìa
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendship, setFriendship] = useState<Friendship | null>(null);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoadingProfile(true);
    try {
      const res = await userService.getById(userId);
      setProfile(res.data.data);
    } catch {
      // silent
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const loadPosts = useCallback(async (pageNum: number) => {
    if (!userId) return;
    if (pageNum === 1) setLoadingPosts(true);
    else setLoadingMore(true);
    try {
      const res = await postService.getUserPosts(userId, pageNum, 10);
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
      setLoadingMore(false);
    }
  }, [userId]);

  const loadFriendStatus = useCallback(async () => {
    if (!userId || isOwnProfile) return;
    try {
      const res = await friendService.getStatus(userId);
      setFriendStatus(res.data.data?.status ?? 'none');
    } catch {
      // silent
    }
  }, [userId, isOwnProfile]);

  useEffect(() => {
    loadProfile();
    loadPosts(1);
    loadFriendStatus();
  }, [loadProfile, loadPosts, loadFriendStatus]);

  const handleSendRequest = async () => {
    if (!userId) return;
    setFriendActionLoading(true);
    try {
      const res = await friendService.sendRequest(userId);
      setFriendship(res.data.data);
      setFriendStatus('pending');
    } catch {
      // silent
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId) return;
    if (!window.confirm('Hủy kết bạn với người này?')) return;
    setFriendActionLoading(true);
    try {
      await friendService.remove(userId);
      setFriendStatus('none');
      setFriendship(null);
    } catch {
      // silent
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleLike = async (id: number) => {
    try {
      const res = await postService.toggleLike(id);
      const { liked, likesCount } = res.data.data;
      setPosts((prev) =>
        prev.map((p) => p.id === id ? { ...p, isLikedByCurrentUser: liked, likesCount } : p)
      );
    } catch {
      // silent
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await postService.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setProfile((prev) => prev ? { ...prev, postsCount: prev.postsCount - 1 } : prev);
    } catch {
      // silent
    }
  };

  const handleLoadMorePosts = () => {
    const next = postPage + 1;
    setPostPage(next);
    loadPosts(next);
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-[#65676B] font-medium">Không tìm thấy người dùng.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Cover + avatar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {/* Cover photo */}
        <div className="relative h-48 bg-gradient-to-r from-[#1877F2] to-[#42A5F5]">
          {profile.coverPhotoUrl && (
            <img src={profile.coverPhotoUrl} alt="Ảnh bìa" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          {/* Avatar overlapping cover */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="ring-4 ring-white rounded-full z-100">
              <Avatar src={profile.avatarUrl} fallback={profile.fullName} size="xl" className="!w-24 !h-24 !text-2xl" />
            </div>
            <div className="flex gap-2 mt-8">
              {isOwnProfile ? (
                <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa profile
                </Button>
              ) : (
                <>
                  {friendStatus === 'none' && (
                    <Button size="sm" onClick={handleSendRequest} loading={friendActionLoading}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Kết bạn
                    </Button>
                  )}
                  {friendStatus === 'pending' && (
                    <Button variant="secondary" size="sm" disabled>
                      Đã gửi lời mời
                    </Button>
                  )}
                  {friendStatus === 'accepted' && (
                    <Button variant="secondary" size="sm" onClick={handleRemoveFriend} loading={friendActionLoading}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                      Hủy kết bạn
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Name, bio, stats */}
          <h1 className="text-2xl font-bold text-[#1C1E21]">{profile.fullName}</h1>
          <p className="text-sm text-[#65676B] mt-0.5">@{profile.userName}</p>
          {profile.bio && (
            <p className="mt-2 text-sm text-[#1C1E21] leading-relaxed">{profile.bio}</p>
          )}
          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C1E21]">{profile.postsCount}</p>
              <p className="text-xs text-[#65676B]">Bài viết</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#1C1E21]">{profile.friendsCount}</p>
              <p className="text-xs text-[#65676B]">Bạn bè</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#1C1E21] px-1">Bài viết</h2>

        {loadingPosts ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <LoadingSkeleton />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-[#65676B]">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <ProfilePostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onDelete={handleDeletePost}
                isOwner={isOwnProfile}
              />
            ))}
            {hasMorePosts && (
              <div className="text-center">
                <Button variant="secondary" onClick={handleLoadMorePosts} loading={loadingMore}>
                  Tải thêm
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      {editModalOpen && profile && (
        <EditProfileModal
          user={profile}
          onClose={() => setEditModalOpen(false)}
          onUpdated={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}
