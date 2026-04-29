import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { friendService } from '../services/friendService';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { Friendship, UserSearch } from '../types';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await friendService.getAll();
      setFriends(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await friendService.getPending();
      setRequests(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  // Search users
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      setSearchLoading(true);
      try {
        const res = await userService.search(debouncedSearch, 1, 20);
        // Filter out self
        const filtered = (res.data.data.items ?? []).filter((u) => u.id !== user?.id);
        setSearchResults(filtered);
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    };
    search();
  }, [debouncedSearch, user?.id]);

  const handleRemoveFriend = async (userId: string) => {
    if (!window.confirm('Hủy kết bạn với người này?')) return;
    try {
      await friendService.remove(userId);
      setFriends((prev) => prev.filter((f) => f.user.id !== userId));
    } catch {
      // silent
    }
  };

  const handleAccept = async (friendship: Friendship) => {
    setActionLoadingId(friendship.id);
    try {
      await friendService.accept(friendship.id);
      setRequests((prev) => prev.filter((r) => r.id !== friendship.id));
      const res = await friendService.getAll();
      setFriends(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (friendship: Friendship) => {
    setActionLoadingId(friendship.id);
    try {
      await friendService.reject(friendship.id);
      setRequests((prev) => prev.filter((r) => r.id !== friendship.id));
    } catch {
      // silent
    } finally {
      setActionLoadingId(null);
    }
  };

  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSendRequest = async (receiverId: string) => {
    setActionLoadingId(receiverId);
    try {
      await friendService.sendRequest(receiverId);
      setSentIds((prev) => new Set(prev).add(receiverId));
    } catch {
      // Đã gửi trước đó
      setSentIds((prev) => new Set(prev).add(receiverId));
    } finally {
      setActionLoadingId(null);
    }
  };

  const isFriend = (userId: string) => friends.some((f) => f.user.id === userId);
  const wasSent = (userId: string) => sentIds.has(userId);

  return (
    <div className="max-w-[720px] mx-auto">
      <h1 className="text-xl font-bold text-[#1C1E21] mb-4">Bạn bè</h1>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'friends' as Tab, label: 'Bạn bè', count: friends.length, color: 'bg-[#F0F2F5] text-[#65676B]' },
            { key: 'requests' as Tab, label: 'Lời mời', count: requests.length, color: 'bg-red-100 text-red-600' },
            { key: 'search' as Tab, label: 'Tìm bạn bè', count: 0, color: '' },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                activeTab === key
                  ? 'text-[#1877F2] border-b-2 border-[#1877F2]'
                  : 'text-[#65676B] hover:bg-[#F0F2F5]'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-bold ${color}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search tab */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm người dùng theo tên, username, email..."
                className="w-full bg-[#F0F2F5] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
                autoFocus
              />
            </div>
          </div>

          {searchLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : searchQuery.trim() && searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-[#65676B] text-sm">Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            searchResults.map((u) => {
              const alreadyFriend = isFriend(u.id);
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
                >
                  <Link to={`/profile/${u.id}`}>
                    <Avatar src={u.avatarUrl} fallback={u.fullName} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${u.id}`}
                      className="font-semibold text-[#1C1E21] hover:underline text-sm block truncate"
                    >
                      {u.fullName}
                    </Link>
                    <p className="text-xs text-[#65676B] truncate">@{u.userName}</p>
                  </div>
                  {alreadyFriend ? (
                    <span className="text-xs text-[#65676B] bg-[#F0F2F5] px-3 py-1.5 rounded-lg font-medium">
                      Đã là bạn bè
                    </span>
                  ) : wasSent(u.id) ? (
                    <span className="text-xs text-[#1877F2] bg-[#E7F3FF] px-3 py-1.5 rounded-lg font-medium">
                      Đã gửi lời mời
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(u.id)}
                      loading={actionLoadingId === u.id}
                    >
                      Kết bạn
                    </Button>
                  )}
                </div>
              );
            })
          )}

          {!searchQuery.trim() && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <svg className="w-12 h-12 text-[#65676B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-[#65676B] font-medium">Nhập tên để tìm bạn bè</p>
              <p className="text-[#65676B] text-sm mt-1">Tìm theo tên, username hoặc email</p>
            </div>
          )}
        </div>
      )}

      {/* Friends tab */}
      {activeTab === 'friends' && (
        <div className="space-y-2">
          {loadingFriends ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : friends.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="w-12 h-12 text-[#65676B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-[#65676B] font-medium">Chưa có bạn bè nào</p>
              <p className="text-[#65676B] text-sm mt-1">Hãy chuyển sang tab "Tìm bạn bè" để kết nối!</p>
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
              >
                <Link to={`/profile/${f.user.id}`}>
                  <Avatar src={f.user.avatarUrl} fallback={f.user.fullName} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${f.user.id}`}
                    className="font-semibold text-[#1C1E21] hover:underline text-sm block truncate"
                  >
                    {f.user.fullName}
                  </Link>
                  <p className="text-xs text-[#65676B] truncate">@{f.user.userName}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRemoveFriend(f.user.id)}
                >
                  Hủy kết bạn
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div className="space-y-2">
          {loadingRequests ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <svg className="w-12 h-12 text-[#65676B] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <p className="text-[#65676B] font-medium">Không có lời mời kết bạn nào</p>
            </div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
              >
                <Link to={`/profile/${r.user.id}`}>
                  <Avatar src={r.user.avatarUrl} fallback={r.user.fullName} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${r.user.id}`}
                    className="font-semibold text-[#1C1E21] hover:underline text-sm block truncate"
                  >
                    {r.user.fullName}
                  </Link>
                  <p className="text-xs text-[#65676B] truncate">@{r.user.userName}</p>
                  <p className="text-xs text-[#65676B] mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(r)}
                    loading={actionLoadingId === r.id}
                  >
                    Chấp nhận
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReject(r)}
                    loading={actionLoadingId === r.id}
                  >
                    Từ chối
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
