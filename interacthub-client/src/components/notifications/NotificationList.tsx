import { useState, useEffect, useCallback } from 'react';
import {
  FaHeart,
  FaComment,
  FaUserPlus,
  FaShare,
  FaBell,
  FaCheck,
  FaCheckDouble,
} from 'react-icons/fa';
import { Notification } from '../../types';
import { notificationService } from '../../services/notificationService';
import Avatar from '../common/Avatar';

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

interface NotificationIconProps {
  type: string;
}

function NotificationIcon({ type }: NotificationIconProps) {
  const lower = type.toLowerCase();

  if (lower.includes('like') || lower.includes('thich')) {
    return (
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
        <FaHeart size={14} className="text-red-500" />
      </div>
    );
  }
  if (lower.includes('comment') || lower.includes('binh_luan')) {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <FaComment size={14} className="text-blue-500" />
      </div>
    );
  }
  if (lower.includes('friend') || lower.includes('ban_be') || lower.includes('follow')) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <FaUserPlus size={14} className="text-green-500" />
      </div>
    );
  }
  if (lower.includes('share') || lower.includes('chia_se')) {
    return (
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <FaShare size={14} className="text-purple-500" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <FaBell size={14} className="text-[#65676B]" />
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
  isMarkingRead: boolean;
}

function NotificationItem({ notification, onRead, isMarkingRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead && !isMarkingRead) {
      onRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors rounded-xl ${
        notification.isRead
          ? 'hover:bg-[#F0F2F5]'
          : 'bg-blue-50 hover:bg-blue-100'
      }`}
    >
      {/* Avatar + Icon */}
      <div className="relative shrink-0">
        {notification.triggeredByUser ? (
          <>
            <Avatar
              src={notification.triggeredByUser.avatarUrl}
              alt={notification.triggeredByUser.fullName}
              fallback={notification.triggeredByUser.fullName}
              size="md"
            />
            <div className="absolute -bottom-1 -right-1">
              <NotificationIcon type={notification.type} />
            </div>
          </>
        ) : (
          <NotificationIcon type={notification.type} />
        )}
      </div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            notification.isRead ? 'text-[#65676B]' : 'text-[#1C1E21] font-medium'
          }`}
        >
          {notification.message}
        </p>
        <p
          className={`text-xs mt-1 ${
            notification.isRead ? 'text-[#65676B]' : 'text-[#1877F2] font-medium'
          }`}
        >
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Chấm chưa đọc */}
      {!notification.isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] shrink-0 mt-1.5" />
      )}

      {/* Icon đã đọc */}
      {notification.isRead && (
        <FaCheck size={10} className="text-[#65676B] shrink-0 mt-1.5 opacity-60" />
      )}
    </div>
  );
}

// ─── NotificationList chính ──────────────────────────────────────────────────
export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await notificationService.getAll(pageNum);
      if (res.data.success) {
        const { items, hasNextPage } = res.data.data;
        setNotifications((prev) => (append ? [...prev, ...items] : items));
        setHasMore(hasNextPage);
        setPage(pageNum);
      }
    } catch {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    if (markingId) return;
    try {
      setMarkingId(id);
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Lỗi câm
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      setError('Không thể đánh dấu tất cả. Vui lòng thử lại.');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-[#1C1E21]">Thông báo</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-[#1877F2] text-white text-xs font-bold rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-medium text-[#1877F2] hover:text-[#166fe5] disabled:opacity-50 transition-colors"
          >
            <FaCheckDouble size={12} />
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      {/* Lỗi */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-2.5 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notifications.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F0F2F5] flex items-center justify-center mb-4">
            <FaBell size={24} className="text-[#65676B]" />
          </div>
          <p className="text-sm font-medium text-[#1C1E21] mb-1">Không có thông báo</p>
          <p className="text-xs text-[#65676B]">
            Khi có hoạt động mới, thông báo sẽ xuất hiện ở đây.
          </p>
        </div>
      )}

      {/* Danh sách thông báo */}
      {!loading && notifications.length > 0 && (
        <>
          <div className="p-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleMarkRead}
                isMarkingRead={markingId === notification.id}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-2 rounded-xl bg-[#F0F2F5] text-sm font-medium text-[#1877F2] hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? 'Đang tải...' : 'Xem thêm thông báo'}
              </button>
            </div>
          )}

          {/* Tất cả đã đọc badge */}
          {unreadCount === 0 && notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-[#65676B]">
              <FaCheckDouble size={11} className="text-green-500" />
              Tất cả thông báo đã được đọc
            </div>
          )}
        </>
      )}
    </div>
  );
}
