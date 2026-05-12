import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { notificationService } from '../services/notificationService';
import Avatar from '../components/common/Avatar';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search -> navigate
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length > 0) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  }, [debouncedSearch]);

  // Fetch unread notification count mỗi 30s
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnreadCount(res.data.data ?? 0);
      } catch {
        // im silent
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link
            to="/feed"
            className="shrink-0 text-[#1877F2] font-extrabold text-xl tracking-tight mr-2"
          >
            InteractHub
          </Link>

          {/* Search - giữa */}
          <div className="flex-1 max-w-[320px] hidden sm:block">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm trên InteractHub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F0F2F5] rounded-full pl-9 pr-4 py-2 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/feed"
              className="px-3 py-2 rounded-lg text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1C1E21] transition"
            >
              Trang chủ
            </Link>
            <Link
              to="/friends"
              className="px-3 py-2 rounded-lg text-sm font-medium text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1C1E21] transition"
            >
              Bạn bè
            </Link>
          </nav>

          {/* Notification icon */}
          <Link
            to="/notifications"
            className="relative p-2 rounded-full hover:bg-[#F0F2F5] transition text-[#65676B]"
            aria-label="Thông báo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdown((v) => !v)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-[#F0F2F5] transition"
              aria-label="Menu người dùng"
            >
              <Avatar
                src={user?.avatarUrl}
                alt={user?.fullName}
                fallback={user?.fullName}
                size="sm"
              />
            </button>

            {userDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-[#1C1E21] truncate">{user?.fullName}</p>
                  <p className="text-xs text-[#65676B] truncate">@{user?.userName}</p>
                </div>
                <Link
                  to={`/profile/${user?.id}`}
                  onClick={() => setUserDropdown(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#1C1E21] hover:bg-[#F0F2F5] transition"
                >
                  <svg className="w-4 h-4 text-[#65676B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Trang cá nhân
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>

          {/* Hamburger - mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-[#F0F2F5] transition text-[#65676B]"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F0F2F5] rounded-full pl-9 pr-4 py-2 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
            />
          </div>
        </div>

        {/* Mobile nav menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-2 bg-white">
            <Link
              to="/feed"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1C1E21] hover:bg-[#F0F2F5] transition"
            >
              Trang chủ
            </Link>
            <Link
              to="/friends"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1C1E21] hover:bg-[#F0F2F5] transition"
            >
              Bạn bè
            </Link>
            <Link
              to="/notifications"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1C1E21] hover:bg-[#F0F2F5] transition"
            >
              Thông báo {unreadCount > 0 && <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </Link>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
