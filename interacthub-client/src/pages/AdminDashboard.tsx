import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import api from '../services/api';
import { User, ApiResponse } from '../types';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Report {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
  reportedByUser: { id: string; fullName: string; userName: string; avatarUrl: string | null };
  post?: { id: number; content: string };
  targetUser?: { id: string; fullName: string; userName: string };
}

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingReports: number;
}

type Tab = 'overview' | 'users' | 'reports';

// ─── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#65676B]">{label}</span>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1C1E21]">{value.toLocaleString('vi-VN')}</p>
    </div>
  );
}

// ─── AdminDashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalPosts: 0, totalReports: 0, pendingReports: 0 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  const [reportActionId, setReportActionId] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Chỉ admin mới truy cập - kiểm tra qua role trong user object
  // Giả sử user có role hoặc ta kiểm tra qua userName admin
  useEffect(() => {
    // Nếu không phải admin thì redirect
    const isAdmin = (user as unknown as { role?: string })?.role === 'Admin';
    if (user && !isAdmin) {
      navigate('/feed', { replace: true });
    }
  }, [user, navigate]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await api.get<ApiResponse<Report[]>>('/reports');
      setReports(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoadingReports(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get<ApiResponse<Stats>>('/admin/stats');
      setStats(res.data.data);
    } catch {
      // Fallback: tính từ dữ liệu đã load
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadUsers();
    loadReports();
  }, []);

  const handleToggleActive = async (userId: string) => {
    setToggleLoadingId(userId);
    try {
      await userService.toggleActive(userId);
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u)
      );
    } catch {
      // silent
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleResolveReport = async (reportId: number) => {
    setReportActionId(reportId);
    try {
      await api.put(`/reports/${reportId}/resolve`);
      setReports((prev) =>
        prev.map((r) => r.id === reportId ? { ...r, status: 'resolved' } : r)
      );
    } catch {
      // silent
    } finally {
      setReportActionId(null);
    }
  };

  const handleDismissReport = async (reportId: number) => {
    setReportActionId(reportId);
    try {
      await api.put(`/reports/${reportId}/dismiss`);
      setReports((prev) =>
        prev.map((r) => r.id === reportId ? { ...r, status: 'dismissed' } : r)
      );
    } catch {
      // silent
    } finally {
      setReportActionId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.userName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'users', label: 'Người dùng' },
    { key: 'reports', label: 'Báo cáo' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1E21]">Bảng điều khiển Admin</h1>
          <p className="text-sm text-[#65676B] mt-1">Quản lý người dùng và nội dung của InteractHub</p>
        </div>
        <div className="text-sm text-[#65676B]">
          Xin chào, <span className="font-semibold text-[#1C1E21]">{user?.fullName}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'text-[#1877F2] border-b-2 border-[#1877F2]'
                  : 'text-[#65676B] hover:bg-[#F0F2F5]'
              }`}
            >
              {tab.label}
              {tab.key === 'reports' && reports.filter((r) => r.status === 'pending').length > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                  {reports.filter((r) => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div>
          {loadingStats ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tổng người dùng"
                value={stats.totalUsers || users.length}
                icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                color="bg-[#1877F2]"
              />
              <StatCard
                label="Tổng bài viết"
                value={stats.totalPosts}
                icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                color="bg-green-500"
              />
              <StatCard
                label="Tổng báo cáo"
                value={stats.totalReports || reports.length}
                icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                color="bg-yellow-500"
              />
              <StatCard
                label="Báo cáo chờ xử lý"
                value={stats.pendingReports || reports.filter((r) => r.status === 'pending').length}
                icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                color="bg-red-500"
              />
            </div>
          )}

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-[#1C1E21] mb-3">Người dùng gần đây</h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar src={u.avatarUrl} fallback={u.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1C1E21] truncate">{u.fullName}</p>
                      <p className="text-xs text-[#65676B]">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-[#1C1E21] mb-3">Báo cáo mới nhất</h3>
              <div className="space-y-3">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-start gap-3">
                    <Avatar src={r.reportedByUser.avatarUrl} fallback={r.reportedByUser.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1C1E21] truncate">{r.reportedByUser.fullName}</p>
                      <p className="text-xs text-[#65676B] truncate">{r.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'resolved' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {r.status === 'pending' ? 'Chờ xử lý' : r.status === 'resolved' ? 'Đã xử lý' : 'Bỏ qua'}
                    </span>
                  </div>
                ))}
                {reports.length === 0 && (
                  <p className="text-sm text-[#65676B] text-center py-4">Chưa có báo cáo nào</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div>
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#65676B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Tìm kiếm người dùng..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1C1E21] placeholder-[#65676B] outline-none focus:ring-2 focus:ring-[#1877F2]/30 transition"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F0F2F5]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider">Người dùng</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider hidden sm:table-cell">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider hidden md:table-cell">Ngày tham gia</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider">Trạng thái</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F0F2F5] transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar src={u.avatarUrl} fallback={u.fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1C1E21] truncate">{u.fullName}</p>
                              <p className="text-xs text-[#65676B]">@{u.userName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-sm text-[#65676B]">{u.email}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-[#65676B]">
                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Button
                            variant={u.isActive ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => handleToggleActive(u.id)}
                            loading={toggleLoadingId === u.id}
                          >
                            {u.isActive ? 'Khóa' : 'Mở khóa'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-[#65676B] text-sm">
                          {userSearch ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-[#65676B] text-right">
            Hiển thị {filteredUsers.length} / {users.length} người dùng
          </p>
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F0F2F5]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider">Người báo cáo</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider hidden sm:table-cell">Lý do</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider hidden md:table-cell">Ngày báo cáo</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider">Trạng thái</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[#65676B] uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F0F2F5] transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar src={r.reportedByUser.avatarUrl} fallback={r.reportedByUser.fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1C1E21] truncate">{r.reportedByUser.fullName}</p>
                              <p className="text-xs text-[#65676B]">@{r.reportedByUser.userName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <p className="text-sm text-[#1C1E21] max-w-[200px] truncate" title={r.reason}>{r.reason}</p>
                          {r.post && (
                            <p className="text-xs text-[#65676B] mt-0.5 truncate max-w-[200px]">
                              Bài viết: {r.post.content}
                            </p>
                          )}
                          {r.targetUser && (
                            <p className="text-xs text-[#65676B] mt-0.5">
                              Người dùng: {r.targetUser.fullName}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-[#65676B]">
                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {r.status === 'pending' ? 'Chờ xử lý' : r.status === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {r.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleResolveReport(r.id)}
                                loading={reportActionId === r.id}
                              >
                                Xử lý
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDismissReport(r.id)}
                                loading={reportActionId === r.id}
                              >
                                Bỏ qua
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-[#65676B] text-center">Đã xử lý</p>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-[#65676B] text-sm">
                          Chưa có báo cáo nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-[#65676B] text-right">
            Tổng: {reports.length} báo cáo · Chờ xử lý: {reports.filter((r) => r.status === 'pending').length}
          </p>
        </div>
      )}
    </div>
  );
}
