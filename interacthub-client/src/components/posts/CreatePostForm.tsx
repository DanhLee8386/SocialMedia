import { useState, useRef } from 'react';
import { FaImage, FaTimes } from 'react-icons/fa';
import { Post } from '../../types';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';

interface CreatePostFormProps {
  onPostCreated?: (post: Post) => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUrlChange = (value: string) => {
    setImageUrl(value);
    setImageError(false);
  };

  const clearImage = () => {
    setImageUrl('');
    setShowImageInput(false);
    setImageError(false);
  };

  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent && !imageUrl) return;
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      const payload: { content: string; imageUrl?: string } = { content: trimmedContent };
      if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();

      const res = await postService.create(payload);
      if (res.data.success) {
        setContent('');
        setImageUrl('');
        setShowImageInput(false);
        setImageError(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        onPostCreated?.(res.data.data);
      } else {
        setError(res.data.message || 'Đăng bài thất bại. Vui lòng thử lại.');
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = (content.trim().length > 0 || imageUrl.trim().length > 0) && !loading;
  const hasValidImage = imageUrl.trim().length > 0 && !imageError;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar
          src={user?.avatarUrl}
          alt={user?.fullName}
          fallback={user?.fullName}
          size="md"
        />
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={handleTextareaInput}
            placeholder={`${user?.fullName || 'Bạn'} ơi, bạn đang nghĩ gì thế?`}
            rows={2}
            className="w-full bg-[#F0F2F5] rounded-2xl px-4 py-2.5 text-sm text-[#1C1E21] placeholder-[#65676B] resize-none outline-none leading-relaxed"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />
        </div>
      </div>

      {/* Input URL ảnh */}
      {showImageInput && (
        <div className="mt-3 ml-13">
          <div className="flex items-center gap-2 bg-[#F0F2F5] rounded-xl px-3 py-2">
            <FaImage size={14} className="text-[#65676B] shrink-0" />
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="Dán URL ảnh vào đây..."
              className="flex-1 bg-transparent text-sm text-[#1C1E21] placeholder-[#65676B] outline-none"
            />
            {imageUrl && (
              <button
                onClick={clearImage}
                className="text-[#65676B] hover:text-[#1C1E21] transition-colors"
                aria-label="Xóa ảnh"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          {/* Preview ảnh */}
          {imageUrl.trim() && !imageError && (
            <div className="relative mt-2 rounded-xl overflow-hidden bg-[#F0F2F5]">
              <img
                src={imageUrl}
                alt="Xem trước ảnh"
                className="w-full max-h-64 object-cover"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Xóa ảnh"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}

          {imageError && imageUrl.trim() && (
            <p className="mt-1 text-xs text-red-500">URL ảnh không hợp lệ hoặc không thể tải.</p>
          )}
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
        {/* Nút thêm ảnh */}
        <button
          type="button"
          onClick={() => setShowImageInput((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showImageInput || hasValidImage
              ? 'text-[#1877F2] bg-blue-50'
              : 'text-[#65676B] hover:bg-[#F0F2F5]'
          }`}
        >
          <FaImage size={16} />
          Ảnh
        </button>

        {/* Nút đăng */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-5 py-1.5 bg-[#1877F2] text-white text-sm font-semibold rounded-lg hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang đăng...
            </span>
          ) : (
            'Đăng'
          )}
        </button>
      </div>
    </div>
  );
}
