import { useState, useEffect, useRef } from 'react';
import { FaPlus, FaTimes, FaImage } from 'react-icons/fa';
import { Story } from '../../types';
import { storyService } from '../../services/storyService';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

// ─── Modal xem story ────────────────────────────────────────────────────────
interface StoryViewModalProps {
  story: Story;
  onClose: () => void;
}

function StoryViewModal({ story, onClose }: StoryViewModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: '9/16', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ảnh nền */}
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt="Story"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1877F2] to-purple-600 flex items-center justify-center p-8">
            <p className="text-white text-xl font-semibold text-center leading-relaxed">
              {story.content}
            </p>
          </div>
        )}

        {/* Overlay gradient trên */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50 pointer-events-none" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-3">
          <Avatar
            src={story.user.avatarUrl}
            alt={story.user.fullName}
            fallback={story.user.fullName}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{story.user.fullName}</p>
            <p className="text-white/70 text-xs">
              {new Date(story.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
            aria-label="Đóng"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content (khi có ảnh) */}
        {story.imageUrl && story.content && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-white text-sm leading-relaxed text-center">{story.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal tạo story ─────────────────────────────────────────────────────────
interface CreateStoryModalProps {
  onClose: () => void;
  onCreated: (story: Story) => void;
}

function CreateStoryModal({ onClose, onCreated }: CreateStoryModalProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl.trim()) return;
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const payload: { content?: string; imageUrl?: string } = {};
      if (content.trim()) payload.content = content.trim();
      if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();

      const res = await storyService.create(payload);
      if (res.data.success) {
        onCreated(res.data.data);
        onClose();
      } else {
        setError(res.data.message || 'Tạo story thất bại.');
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#1C1E21]">Tạo story mới</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center text-[#65676B] transition-colors"
            aria-label="Đóng"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nội dung */}
          <div>
            <label className="block text-sm font-medium text-[#1C1E21] mb-1.5">
              Nội dung
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì..."
              rows={3}
              className="w-full bg-[#F0F2F5] rounded-xl px-4 py-3 text-sm text-[#1C1E21] placeholder-[#65676B] resize-none outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
            />
          </div>

          {/* URL ảnh */}
          <div>
            <label className="block text-sm font-medium text-[#1C1E21] mb-1.5">
              URL ảnh (tuỳ chọn)
            </label>
            <div className="flex items-center gap-2 bg-[#F0F2F5] rounded-xl px-3 py-2.5">
              <FaImage size={14} className="text-[#65676B] shrink-0" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-transparent text-sm text-[#1C1E21] placeholder-[#65676B] outline-none"
              />
            </div>
            {imageUrl.trim() && !imageError && (
              <div className="mt-2 rounded-xl overflow-hidden bg-[#F0F2F5] max-h-40">
                <img
                  src={imageUrl}
                  alt="Xem trước"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            )}
            {imageError && imageUrl.trim() && (
              <p className="mt-1 text-xs text-red-500">URL ảnh không hợp lệ.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={(!content.trim() && !imageUrl.trim()) || loading}
              className="flex-1 py-2 rounded-xl bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang đăng...' : 'Đăng story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── StoryBar chính ───────────────────────────────────────────────────────────
export default function StoryBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await storyService.getFeed();
        if (res.data.success) setStories(res.data.data);
      } catch {
        // Lỗi câm - không cần show error cho feed
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleCreated = (story: Story) => {
    setStories((prev) => [story, ...prev]);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Nút tạo story */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-1 shrink-0 w-16 group"
            aria-label="Tạo story mới"
          >
            <div className="w-14 h-14 rounded-full bg-[#F0F2F5] border-2 border-dashed border-[#1877F2] flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <FaPlus size={18} className="text-[#1877F2]" />
            </div>
            <span className="text-[10px] font-medium text-[#65676B] text-center leading-tight w-full truncate">
              Tạo story
            </span>
          </button>

          {/* Loading skeletons */}
          {loading &&
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0 w-16 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="h-2.5 bg-gray-200 rounded w-10" />
              </div>
            ))}

          {/* Danh sách stories */}
          {!loading &&
            stories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center gap-1 shrink-0 w-16 group"
              >
                <div
                  className="w-14 h-14 rounded-full p-0.5 shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                    {story.imageUrl ? (
                      <img
                        src={story.imageUrl}
                        alt={story.user.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1877F2] to-purple-500 flex items-center justify-center">
                        <Avatar
                          src={story.user.avatarUrl}
                          alt={story.user.fullName}
                          fallback={story.user.fullName}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#1C1E21] text-center leading-tight w-full truncate group-hover:text-[#1877F2] transition-colors">
                  {story.user.fullName.split(' ').slice(-1)[0]}
                </span>
              </button>
            ))}

          {!loading && stories.length === 0 && (
            <p className="text-sm text-[#65676B] self-center pl-2">
              Chưa có story nào. Hãy tạo story đầu tiên!
            </p>
          )}
        </div>
      </div>

      {/* Modal xem story */}
      {selectedStory && (
        <StoryViewModal story={selectedStory} onClose={() => setSelectedStory(null)} />
      )}

      {/* Modal tạo story */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
