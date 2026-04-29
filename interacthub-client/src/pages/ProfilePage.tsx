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

// ─── Mini PostCard dùng trong ProfilePage ────────────────────────────────────
function ProfilePostCard({ post, onLike, onDelete, isOwner }: {
  post: Post;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  isOwner: boolean;
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <p className="text-xs text-[#65676B]">{formatDate(post.createdAt)}</p>
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
        <p className="mt-2 text-sm text-[#1C1E21] whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((t) => (
              <span key={t} className="text-xs text-[#1877F2]">#{t}</span>
            ))}
          </div>
        )}
      </div>
      {post.imageUrl && (
        <img src={post.imageUrl} alt="Ảnh bài viết" className="w-full max-h-[400px] object-cover" />
      )}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-[#65676B]">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 transition ${post.isLikedByCurrentUser ? 'text-[#1877F2] font-semibold' : 'hover:text-[#1877F2]'}`}
        >
          <svg className="w-4 h-4" fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          {post.likesCount} thích
        </button>
        <span>{post.commentsCount} bình luận</span>
        <span>{post.sharesCount} chia sẻ</span>
      </div>
    </div>
  );
}

// ─── EditProfileModal ─────────────────────────────────────────────────────────
function EditProfileModal({ user, onClose, onUpdated }: {
  user: User;
  onClose: () => void;
  onUpdated: (u: User) => void;
}) {
  const { updateUser } = useAuth();
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Tên không được để trống'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await userService.updateProfile({ fullName: fullName.trim(), bio: bio.trim() });
      const updated = res.data.data;
      updateUser(updated);
      onUpdated(updated);
      onClose();
    } catch {
      setError('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1C1E21]">Chỉnh sửa thông tin</h2>
          <button onClick={onClose} className="text-[#65676B] hover:text-[#1C1E21] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Hủy</Button>
            <Button type="submit" loading={loading}>Lưu thay đổi</Button>
          </div>
        </form>
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
            <div className="ring-4 ring-white rounded-full">
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
