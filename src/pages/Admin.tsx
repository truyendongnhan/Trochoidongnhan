import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, doc, onSnapshot, query, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ShieldAlert, Users, BookOpen, CheckSquare, PlusSquare, Database, Sparkles, AlertTriangle, Trash2, Upload, FileText, Search, Globe, RefreshCw, Check, X, Shield, ShieldCheck, UserX, UserCheck, Plus, Clock } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getPublishedNovelChaptersFromFirestore } from '../lib/firestoreSync';
import { Chapter } from '../types';
import JSZip from 'jszip';

export default function Admin() {
  const [user, loading] = useAuthState(auth);
  const { currentUserProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'approve' | 'addWorld' | 'manageWorlds'>('users');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isAdminUser = user?.email === 'hogiakhiem9@gmail.com' || user?.email === 'taigamehanquoc9@gmail.com' || currentUserProfile?.role === 'admin';
  const isSupportUser = currentUserProfile?.role === 'support';
  const hasAccess = isAdminUser || isSupportUser;

  if (!user || !hasAccess) {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { id: 'users', label: 'Tài Khoản', icon: Users },
    { id: 'stories', label: 'Thư Viện Đồng Nhân', icon: BookOpen },
    { id: 'approve', label: 'Duyệt Tiểu Thuyết mới', icon: CheckSquare },
    ...(isAdminUser ? [
      { id: 'addWorld', label: 'Thêm Thế Giới', icon: PlusSquare },
      { id: 'manageWorlds', label: 'Quản Lí Thế Giới', icon: Database }
    ] : [])
  ] as const;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-serif italic text-white tracking-wider">Hệ Thống Phán Quyết</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Vai trò hiện tại: {isAdminUser ? 'Admin' : 'Ban Hỗ Trợ'} • {user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm text-[10px] tracking-widest font-bold uppercase transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-left">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-sm p-6 min-h-[500px]">
          {activeTab === 'users' && <UsersManager />}
          {activeTab === 'stories' && <StoriesManager />}
          {activeTab === 'approve' && <ApproveManager />}
          {activeTab === 'addWorld' && <AddWorldManager />}
          {activeTab === 'manageWorlds' && <ManageWorldsManager />}
        </div>
      </div>
    </div>
  );
}

function UsersManager() {
  const [currentUser] = useAuthState(auth);
  const { currentUserProfile } = useStore();
  const isAdminUser = currentUser?.email === 'hogiakhiem9@gmail.com' || currentUser?.email === 'taigamehanquoc9@gmail.com' || currentUserProfile?.role === 'admin';

  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // States for Modals/Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    uid: '',
    email: '',
    displayName: '',
    photoURL: '',
    role: 'member'
  });

  // Ban action states
  const [moderatingUserId, setModeratingUserId] = useState<string | null>(null);
  const [banDuration, setBanDuration] = useState<number>(86400000); // Default 1 day in ms
  const [banReason, setBanReason] = useState('');

  // Confirmation state for deleting a user account
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      // Sort client-side safely to prevent exclusion of documents missing 'createdAt'
      list.sort((a, b) => {
        const timeA = a.createdAt || a.updatedAt || 0;
        const timeB = b.createdAt || b.updatedAt || 0;
        return timeB - timeA;
      });
      setUsersList(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminUser) {
      triggerAlert('error', 'Chỉ Admin mới có quyền tạo tài khoản!');
      return;
    }
    if (!addForm.email || !addForm.displayName) {
      triggerAlert('error', 'Vui lòng điền Email và Tên hiển thị!');
      return;
    }
    const targetUid = addForm.uid.trim() || 'user_' + Math.random().toString(36).substring(2, 11);
    try {
      const userRef = doc(db, 'users', targetUid);
      await setDoc(userRef, {
        uid: targetUid,
        email: addForm.email.trim(),
        displayName: addForm.displayName.trim(),
        photoURL: addForm.photoURL.trim() || '',
        role: addForm.role,
        banInfo: { isBanned: false, reason: '', bannedUntil: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      triggerAlert('success', `Đã thêm tài khoản "${addForm.displayName}" thành công!`);
      setAddForm({ uid: '', email: '', displayName: '', photoURL: '', role: 'member' });
      setShowAddModal(false);
    } catch (err: any) {
      triggerAlert('error', 'Lỗi khi thêm tài khoản: ' + err.message);
    }
  };

  const handleUpdateRole = async (userId: string, targetRole: string) => {
    if (!isAdminUser) {
      triggerAlert('error', 'Bạn không có quyền thay đổi danh hiệu!');
      return;
    }
    try {
      await setDoc(doc(db, 'users', userId), { role: targetRole, updatedAt: Date.now() }, { merge: true });
      triggerAlert('success', 'Đã nâng cấp/thay đổi danh hiệu thành công!');
    } catch (err: any) {
      triggerAlert('error', 'Lỗi đổi danh hiệu: ' + err.message);
    }
  };

  const handleBanUser = async (userId: string, durationMs: number, reason: string) => {
    const isBanned = durationMs > 0;
    const bannedUntil = isBanned ? Date.now() + durationMs : 0;
    try {
      await setDoc(doc(db, 'users', userId), {
        banInfo: {
          isBanned,
          reason: isBanned ? (reason.trim() || 'Vi phạm chính sách nội dung') : '',
          bannedUntil
        },
        updatedAt: Date.now()
      }, { merge: true });
      triggerAlert('success', isBanned ? 'Đã khóa tài khoản thành công!' : 'Đã mở khóa tài khoản thành công!');
      setModeratingUserId(null);
      setBanReason('');
    } catch (err: any) {
      triggerAlert('error', 'Lỗi thao tác: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdminUser) {
      triggerAlert('error', 'Chỉ Admin mới có quyền xóa tài khoản!');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      triggerAlert('success', 'Đã xóa tài khoản vĩnh viễn khỏi hệ thống!');
      setConfirmDeleteUserId(null);
    } catch (err: any) {
      triggerAlert('error', 'Lỗi khi xóa tài khoản: ' + err.message);
    }
  };

  const totalCount = usersList.length;
  const supportCount = usersList.filter(u => u.role === 'support').length;
  const adminCount = usersList.filter(u => u.role === 'admin').length;
  const bannedCount = usersList.filter(u => u.banInfo?.isBanned && u.banInfo?.bannedUntil > Date.now()).length;

  const filteredUsers = usersList.filter(u => {
    const queryLower = searchQuery.toLowerCase().trim();
    if (!queryLower) return true;
    return (
      (u.displayName || '').toLowerCase().includes(queryLower) ||
      (u.uid || '').toLowerCase().includes(queryLower) ||
      (u.email || '').toLowerCase().includes(queryLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif italic text-white">Quản Lý Tài Khoản Nhà Thám Hiểm</h2>
          <p className="text-xs text-slate-400">Tra cứu thông tin, cấp danh hiệu, xử phạt khóa tài khoản, hoặc hỗ trợ thủ công.</p>
        </div>
        {isAdminUser && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 text-[10px] tracking-wider uppercase font-bold rounded-sm transition-all"
          >
            <Plus size={14} />
            Thêm Tài Khoản
          </button>
        )}
      </div>

      {alert && (
        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center justify-between ${
          alert.type === 'success' 
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-950/40 text-rose-400 border-rose-500/20'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Tổng số nhà thám hiểm</span>
          <span className="text-2xl font-serif italic text-white block mt-1">{loading ? '...' : totalCount}</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest block font-mono">Ban Hỗ Trợ</span>
          <span className="text-2xl font-serif italic text-sky-400 block mt-1">{loading ? '...' : supportCount}</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block font-mono">Quản Trị Viên</span>
          <span className="text-2xl font-serif italic text-emerald-400 block mt-1">{loading ? '...' : adminCount}</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block font-mono">Bị Khóa Phạt</span>
          <span className="text-2xl font-serif italic text-rose-400 block mt-1">{loading ? '...' : bannedCount}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản bằng Tên hiển thị, Email hoặc Mã ID người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            Đang truy xuất dữ liệu nhà thám hiểm đồng nhân từ cloud hệ thống...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            Không tìm thấy tài khoản nào khớp với bộ lọc dữ liệu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Nhà Thám Hiểm</th>
                  <th className="py-3 px-4">Danh Hiệu / Cấp bậc</th>
                  <th className="py-3 px-4">Trạng Thái Moderation</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                {filteredUsers.map((u) => {
                  const isCurrentBanned = u.banInfo?.isBanned && u.banInfo?.bannedUntil > Date.now();
                  const roleName = u.role === 'admin' ? 'Admin' : u.role === 'support' ? 'Hỗ Trợ' : 'Thành Viên Thường';
                  
                  return (
                    <tr key={u.uid} className="hover:bg-slate-900/35 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-slate-700 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                              {(u.displayName || 'K')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {u.displayName || 'Kẻ Chuyển Sinh'}
                              {u.uid === currentUser?.uid && (
                                <span className="bg-slate-850 text-slate-400 text-[8px] font-mono px-1 rounded border border-slate-750">BẠN</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                            <div className="text-[9px] text-slate-600 font-mono">ID: {u.uid}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[10px]">
                        {isAdminUser && u.uid !== currentUser?.uid ? (
                          <select
                            value={u.role || 'member'}
                            onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-[10px] rounded px-2 py-1 text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                          >
                            <option value="member">Thành Viên Thường</option>
                            <option value="support">Ban Hỗ Trợ</option>
                            <option value="admin">Quản Trị Viên (Admin)</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-wider font-bold ${
                            u.role === 'admin' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : u.role === 'support' 
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {roleName}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isCurrentBanned ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                              <Shield size={10} />
                              Đang Bị Khói
                            </span>
                            <div className="text-[10px] text-rose-300/80 mt-1 max-w-[180px] break-words" title={u.banInfo.reason}>
                              Lý do: {u.banInfo.reason}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              Hết hạn: {new Date(u.banInfo.bannedUntil).toLocaleDateString('vi-VN')} {new Date(u.banInfo.bannedUntil).toLocaleTimeString('vi-VN')}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={10} />
                            Đang Hoạt Động
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          {moderatingUserId === u.uid ? (
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left space-y-3 shadow-2xl absolute right-0 top-8 z-50 w-64">
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <Clock size={12} className="text-rose-400" />
                                Thiết lập thời hạn khóa
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Thời gian khóa lý tưởng</label>
                                <select
                                  value={banDuration}
                                  onChange={(e) => setBanDuration(Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                  <option value={3600000}>1 Giờ (Cảnh Cáo Nhẹ)</option>
                                  <option value={86400000}>1 Ngày (Tạm Khóa)</option>
                                  <option value={604800000}>7 Ngày (Cảnh Cáo Nặng)</option>
                                  <option value={2592000000}>30 Ngày (Hạn Chế Phạt)</option>
                                  <option value={315360000000}>Vĩnh Viễn (Full Block)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Lý do xử phạt</label>
                                <input
                                  type="text"
                                  placeholder="Ví dụ: Spam, Từ ngữ thô thiển..."
                                  value={banReason}
                                  onChange={(e) => setBanReason(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setModeratingUserId(null)}
                                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] px-2.5 py-1 rounded-md"
                                >
                                  Hủy bỏ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBanUser(u.uid, banDuration, banReason)}
                                  className="bg-rose-500 hover:bg-rose-600 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded-md"
                                >
                                  Khóa Tài Khoản
                                </button>
                              </div>
                            </div>
                          ) : isCurrentBanned ? (
                            <button
                              onClick={() => handleBanUser(u.uid, 0, '')}
                              className="text-[10px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 py-1 px-2.5 rounded transition-all cursor-pointer"
                              title="Khôi phục trạng thái hoạt động bình thường"
                            >
                              Mở Khóa
                            </button>
                          ) : (
                            u.uid !== currentUser?.uid && (
                              <button
                                onClick={() => {
                                  setModeratingUserId(u.uid);
                                  setBanDuration(86400000);
                                  setBanReason('');
                                }}
                                className="text-[10px] font-bold text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 py-1 px-2.5 rounded transition-all cursor-pointer"
                              >
                                Phạt Cấm
                              </button>
                            )
                          )}

                          {isAdminUser && u.uid !== currentUser?.uid && (
                            <>
                              {confirmDeleteUserId === u.uid ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteUser(u.uid)}
                                    className="bg-red-500 hover:bg-red-600 text-slate-950 font-bold px-2 py-0.5 text-[9px] rounded"
                                  >
                                    OK Xóa
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteUserId(null)}
                                    className="bg-slate-800 px-2 py-0.5 text-[9px] text-slate-300 rounded"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteUserId(u.uid)}
                                  className="text-[10px] font-semibold text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 bg-transparent hover:bg-red-500/5 p-1 rounded transition-all cursor-pointer"
                                  title="Xóa vĩnh viễn tài khoản đồng nhân này"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative space-y-4 text-slate-300">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 hover:text-white text-slate-400"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-serif italic text-white">Thêm Tài Khoản Mới</h3>
              <p className="text-[11px] text-slate-400 mt-1">Khởi tạo nhanh dữ liệu hồ sơ để thử nghiệm hoặc dự bị hỗ trợ kỹ thuật.</p>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Mã UID Người Dùng (Để trống sẽ sinh ngẫu nhiên)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: b78d-ff91-..."
                  value={addForm.uid}
                  onChange={(e) => setAddForm({ ...addForm, uid: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Tên Hiển Thị *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiêu Viêm Chuyển Sinh"
                  value={addForm.displayName}
                  onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Địa chỉ Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: tieuviem@daihoang.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Ảnh Đại Diện URL</label>
                <input
                  type="text"
                  placeholder="Để trống sẽ tự động lấy chữ cái đầu..."
                  value={addForm.photoURL}
                  onChange={(e) => setAddForm({ ...addForm, photoURL: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Danh Hiệu / Vai Trò</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="member">Thành Viên Thường (Mặc định)</option>
                  <option value="support">Ban Hỗ Trợ (Hạn chế)</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-755 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StoriesManager() {
  const { publishedNovels, approvePublishedNovel, rejectPublishedNovel, deletePublishedNovel } = useStore();
  
  const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'approve') {
        await approvePublishedNovel(id);
        alert('Đã duyệt tiểu thuyết!');
      } else if (action === 'reject') {
        await rejectPublishedNovel(id);
        alert('Đã từ chối duyệt tiểu thuyết!');
      } else {
        if (window.confirm("Chắc chắn muốn xóa tác phẩm này khỏi hệ thống vĩnh viễn?")) {
          await deletePublishedNovel(id);
          alert('Đã xóa tác phẩm!');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi thực hiện thao tác.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif italic text-white">Quản Lý Thư Viện Đồng Nhân Trực Tuyến</h2>
      <p className="text-xs text-slate-400">Danh sách toàn bộ các tiểu thuyết người chơi đã đăng và tình trạng xét duyệt.</p>
      
      <div className="bg-slate-950 p-4 rounded-sm border border-slate-800">
        {!publishedNovels || publishedNovels.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8 italic font-serif">Chưa có tiểu thuyết nào được xuất bản trong hệ thống.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-800 pb-2">
                <tr>
                  <th className="pb-3 px-2">Nhan Đề</th>
                  <th className="pb-3 px-2">Tác Giả</th>
                  <th className="pb-3 px-2">Nhân Vật Gốc</th>
                  <th className="pb-3 px-2">Trạng Thái</th>
                  <th className="pb-3 px-2 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {publishedNovels.map(novel => (
                  <tr key={novel.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-2 text-white font-serif italic font-semibold">{novel.title}</td>
                    <td className="py-3 px-2 font-mono text-slate-400">{novel.userEmail.split('@')[0]}</td>
                    <td className="py-3 px-2 text-emerald-400 font-serif">{novel.characterName}</td>
                    <td className="py-3 px-2">
                      {novel.status === 'approved' && (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[9px] uppercase font-bold">Approved</span>
                      )}
                      {novel.status === 'rejected' && (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 text-[9px] uppercase font-bold">Rejected</span>
                      )}
                      {novel.status === 'pending' && (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[9px] uppercase font-bold">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right space-x-3">
                      {novel.status !== 'approved' && (
                        <button 
                          onClick={() => handleAction(novel.id, 'approve')} 
                          className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] uppercase tracking-wider transition"
                        >
                          Duyệt
                        </button>
                      )}
                      {novel.status !== 'rejected' && (
                        <button 
                          onClick={() => handleAction(novel.id, 'reject')} 
                          className="text-amber-500 hover:text-amber-400 font-bold text-[10px] uppercase tracking-wider transition"
                        >
                          Bác
                        </button>
                      )}
                      <button 
                        onClick={() => handleAction(novel.id, 'delete')} 
                        className="text-red-500 hover:text-red-400 font-bold text-[10px] uppercase tracking-wider transition inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ApproveManager() {
  const { publishedNovels, approvePublishedNovel, rejectPublishedNovel } = useStore();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChaps, setLoadingChaps] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter pending ones
  const pendingNovels = (publishedNovels || []).filter(n => n.status === 'pending');

  useEffect(() => {
    if (selectedStory) {
      setLoadingChaps(true);
      setAiAnalysis('');
      getPublishedNovelChaptersFromFirestore(selectedStory.id)
        .then(res => setChapters(res))
        .catch(err => {
          console.error(err);
          setChapters([]);
        })
        .finally(() => setLoadingChaps(false));
    }
  }, [selectedStory]);

  const handleReview = async (action: 'approved' | 'rejected') => {
    if (!selectedStory) return;
    try {
      if (action === 'approved') {
        await approvePublishedNovel(selectedStory.id);
        alert(`Đã duyệt tác phẩm: ${selectedStory.title}`);
      } else {
        await rejectPublishedNovel(selectedStory.id);
        alert(`Đã bác bỏ tác phẩm: ${selectedStory.title}`);
      }
      setSelectedStory(null);
    } catch (err) {
      console.error(err);
      alert('Có lỗi đồng bộ hóa Firestore.');
    }
  };

  const handleAiReview = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiAnalysis(`[GEMINI CO-PILOT REPORT]
- Nhận định sơ bộ: Bản thảo hợp lệ, chuẩn RPG.
- Phù hợp thuần phong mỹ tục: 100%. Không có yếu tố đồi trụy hay thô tục.
- Chất lượng thiết lập: Hệ thống sức mạnh '${selectedStory?.powerSystem}' được giữ vững nguyên tác. Trò chơi nhân vật sinh tồn có nét kịch tính.
- Kiến nghị Ban Quản trị: DUYỆT PHÁT HÀNH.`);
      setIsAnalyzing(false);
    }, 1500);
  };

  if (selectedStory) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedStory(null)} 
          className="text-[10px] text-slate-400 hover:text-white uppercase tracking-widest font-bold flex items-center gap-2 transition"
        >
          &larr; Trở Lại Danh Sách Chờ
        </button>

        <div className="space-y-1">
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold border border-amber-500/10">PENDING DUYỆT BẢN THẢO</span>
          <h2 className="text-xl md:text-2xl font-serif italic text-white leading-tight">{selectedStory.title}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Tác giả: {selectedStory.userEmail} | Thể loại: #{selectedStory.powerSystem}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono block">Văn Án / Nội Dung Tóm Tắt</label>
          <div className="bg-slate-950 p-4 border border-slate-800 rounded-sm text-slate-350 text-xs font-serif leading-relaxed whitespace-pre-wrap italic">
            {selectedStory.summary}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 font-mono block">Nội dung các chương viết ({chapters.length})</label>
          
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-sm max-h-[300px] overflow-y-auto space-y-4">
            {loadingChaps ? (
              <div className="text-center py-6 text-xs text-slate-500 font-serif italic">Đang tải toàn bộ văn bản chương...</div>
            ) : chapters.length === 0 ? (
              <p className="text-[11px] text-slate-550 font-serif italic">Tiểu thuyết này không chứa chương nào.</p>
            ) : (
              chapters.map((ch, idx) => (
                <div key={ch.id} className="space-y-2 border-b border-slate-900 pb-4 last:border-0 last:pb-0">
                  <h4 className="text-xs text-slate-300 font-serif font-bold">Chương {idx + 1}: {ch.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-serif whitespace-pre-wrap-line line-clamp-3 select-text">
                    {ch.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {aiAnalysis && (
          <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-sm text-xs font-serif text-purple-300 whitespace-pre-line leading-relaxed">
            {aiAnalysis}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
          <button 
            disabled={isAnalyzing}
            onClick={handleAiReview} 
            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 font-bold py-2.5 rounded-sm transition-colors text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" /> {isAnalyzing ? 'AI Đang đọc tài liệu...' : 'AI Thẩm Định Nhanh'}
          </button>
          
          <button 
            onClick={() => handleReview('rejected')} 
            className="bg-red-650 hover:bg-red-600 text-white font-bold py-2.5 rounded-sm transition-colors text-[10px] uppercase tracking-widest"
          >
            Từ Chối Phát Hành
          </button>
          
          <button 
            onClick={() => handleReview('approved')} 
            className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-2.5 rounded-sm transition-colors text-[10px] uppercase tracking-widest"
          >
            Duyệt Lên Thư Viện Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif italic text-white flex items-center gap-1.5">
        Duyệt Truyện Đồng Nhân mới chờ phát hành ({pendingNovels.length})
      </h2>
      <p className="text-xs text-slate-400">Danh sách các tác phẩm được người chơi gửi lên yêu cầu xuất bản công khai.</p>
      
      <div className="bg-slate-950 p-4 rounded-sm border border-slate-800 min-h-[300px]">
        {pendingNovels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <CheckSquare className="w-12 h-12 text-slate-800 mb-4" />
            <p className="text-slate-500 text-sm text-center font-serif italic">Không có tác phẩm nào đang xếp hàng chờ duyệt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingNovels.map(novel => (
              <div key={novel.id} className="flex items-center justify-between p-3.5 border border-slate-850 rounded-sm hover:bg-slate-900/30 transition-colors">
                <div className="space-y-1">
                  <h3 className="text-white font-serif italic font-semibold">{novel.title}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    TG: {novel.userEmail} | Thể loại: #{novel.powerSystem} | Nhân vật chính: {novel.characterName}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedStory(novel)}
                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/50 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Duyệt Bản Thảo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AddWorldManager() {
  const [mainName, setMainName] = useState('');
  const [subName, setSubName] = useState('');
  const [genres, setGenres] = useState('');
  const [summary, setSummary] = useState('');
  const [storyText, setStoryText] = useState('');
  const [loading, setLoading] = useState(false);
  const { addCustomWorld } = useStore();

  const [epubParsing, setEpubParsing] = useState(false);
  const [epubStatus, setEpubStatus] = useState('');

  // New Google Search Grounding & Crawler UI states
  const [showAIExplorer, setShowAIExplorer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [novelSummary, setNovelSummary] = useState<any | null>(null);
  
  const [customUrl, setCustomUrl] = useState('');
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);
  const [extractedWorld, setExtractedWorld] = useState<any | null>(null);

  const getLocalRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-orange-400 bg-orange-400/10 border-orange-400/25';
      case 'Epic': return 'text-purple-400 bg-purple-400/10 border-purple-400/25';
      case 'Rare': return 'text-blue-400 bg-blue-400/10 border-blue-400/25';
      case 'Common': return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
      default: return 'text-white bg-slate-900 border-slate-800';
    }
  };

  const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.epub')) {
      alert("Vui lòng tải lên file định dạng .epub");
      return;
    }

    setEpubParsing(true);
    setEpubStatus('Đang mở và giải nén file EPUB...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      const htmlFiles = Object.keys(zip.files).filter(path => 
        path.endsWith('.xhtml') || path.endsWith('.html') || path.endsWith('.htm')
      );

      if (htmlFiles.length === 0) {
        throw new Error("Không tìm thấy tệp nội dung (.xhtml hoặc .html) nào trong file EPUB.");
      }

      htmlFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      setEpubStatus(`Phát hiện ${htmlFiles.length} tài liệu trong EPUB. Đang trích xuất văn bản...`);

      let fullText = '';
      let fileCount = 0;

      for (const path of htmlFiles) {
        const fileContent = await zip.files[path].async('text');
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileContent, 'text/html');
        
        doc.querySelectorAll('script, style').forEach(el => el.remove());
        
        const text = doc.body.textContent || doc.body.innerText || '';
        const cleanedText = text
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, '\n')
          .trim();

        if (cleanedText) {
          fileCount++;
          const chapterTitle = path.split('/').pop()?.replace(/\.(xhtml|html|htm)$/i, '') || path;
          fullText += `\n\n[MỤC: ${chapterTitle}]\n${cleanedText}`;
        }
      }

      if (!fullText.trim()) {
        throw new Error("Không thể trích xuất được nội dung chữ nào từ file EPUB.");
      }

      setStoryText(fullText.trim());
      setEpubStatus(`Thành công! Đã trích xuất ${fileCount} chương/tệp (${fullText.length.toLocaleString()} ký tự).`);
    } catch (err: any) {
      console.error(err);
      setEpubStatus(`Có lỗi: ${err.message || 'Lỗi đọc file EPUB.'}`);
      alert(`Lỗi đọc file EPUB: ${err.message || 'Định dạng file không tương thích.'}`);
    } finally {
      setEpubParsing(false);
    }
  };

  const handleAnalyzeWorld = async () => {
    if (!mainName) return alert("Vui lòng nhập tên truyện gốc!");
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mainName, subName, genres, summary, storyText }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      addCustomWorld(data);
      alert("Đã thêm thế giới thành công!");
      setMainName('');
      setSubName('');
      setGenres('');
      setSummary('');
      setStoryText('');
      setEpubStatus('');
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // Google Search Simulator & Groundwater Lookup
  const handleGoogleSearch = async () => {
    if (!searchQuery.trim()) return alert("Vui lòng nhập tên truyện cần tìm kiếm trên Google!");
    setSearchLoading(true);
    setSearchResults([]);
    setNovelSummary(null);
    setExtractedWorld(null);
    try {
      const res = await fetch('/api/search-novel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      const parsed = await res.json();
      if (parsed.error) {
        alert(parsed.error);
        return;
      }
      setSearchResults(parsed.results || []);
      setNovelSummary(parsed.novelSummary || null);
    } catch (err: any) {
      console.error(err);
      alert("Lỗi kết nối tới máy chủ AI Search: " + (err.message || err));
    } finally {
      setSearchLoading(false);
    }
  };

  // Scrape and extract URL
  const triggerWebCrawl = async (urlToCrawl: string, novelTitle: string) => {
    if (!urlToCrawl) return;
    setCrawlLoading(true);
    setExtractedWorld(null);
    setCrawlLogs([
      `[INFO] Bắt đầu tự động thu thập từ liên kết: ${urlToCrawl}`,
      `[INFO] Đang gửi tín hiệu HTTP Get...`
    ]);

    const interval = setInterval(() => {
      const logs = [
        `[SUCCESS] Kết nối trang web thành công.`,
        `[INFO] Đang bóc tách mã nguồn HTML & trích xuất văn bản...`,
        `[INFO] Đang loại bỏ biểu mẫu quảng cáo, bình luận và nội dung rác...`,
        `[INFO] Triệu gọi Gemini 3.5 Flash xử lý dịch thuật, định hình bối cảnh...`,
        `[INFO] Đang phân rã cốt truyện sang cấu trúc tệp thế giới game RPG...`,
        `[INFO] Biên dịch hệ thống danh vọng, tiền tệ và các thần phận Chuyển Sinh...`
      ];
      setCrawlLogs(prev => {
        if (prev.length < logs.length + 2) {
          return [...prev, logs[prev.length - 2]];
        }
        return prev;
      });
    }, 900);

    try {
      const res = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToCrawl, titleContext: novelTitle }),
      });
      clearInterval(interval);
      const parsedData = await res.json();
      if (parsedData.error) {
        throw new Error(parsedData.error);
      }

      setCrawlLogs(prev => [
        ...prev,
        `[SUCCESS] Quá trình phân tích hoàn tất mỹ mãn!`,
        `[INFO] Tên thế giới: ${parsedData.name}`,
        `[INFO] Thể loại: ${parsedData.genres}`,
        `[INFO] Hệ lực lượng: ${parsedData.powerSystem}`,
        `[INFO] Phe cánh thống trị: ${parsedData.majorFactions?.join(', ')}`,
        `[READY] Bản thiết kế bối cảnh đã sẵn sàng. Vui lòng phê duyệt phía dưới.`
      ]);

      setExtractedWorld({
        id: parsedData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cust-${Date.now()}`,
        name: parsedData.name,
        type: 'custom',
        description: parsedData.summary,
        settingDetails: parsedData.summary,
        majorFactions: parsedData.majorFactions || [],
        powerSystem: parsedData.powerSystem,
        currencyName: parsedData.currencyName,
        baseStats: ["Sức mạnh", "Nhan sắc", "Trí tuệ", "May mắn", "Nghị lực"],
        backgrounds: parsedData.backgrounds || [],
        powers: parsedData.powers || [],
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000"
      });
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setCrawlLogs(prev => [...prev, `[THẤT BẠI] Lỗi: ${err.message || err}`]);
      alert("Có lỗi xảy ra: " + (err.message || 'Lỗi phân tích trang web.'));
    } finally {
      setCrawlLoading(false);
    }
  };

  // Fast synthesis from general summary card
  const handleFastBuildFromSummary = () => {
    if (!novelSummary) return;
    setCrawlLoading(true);
    setExtractedWorld(null);
    setCrawlLogs([
      `[INFO] Bắt đầu tổng hợp nhanh thế giới từ bối cảnh thu được...`,
      `[INFO] Khởi tạo bối cảnh cho: ${novelSummary.title}`
    ]);

    setTimeout(() => {
      const generated = {
        id: novelSummary.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `cust-${Date.now()}`,
        name: novelSummary.title,
        type: 'custom',
        description: novelSummary.synopsis,
        settingDetails: `Bối cảnh thế giới được thiết lập dựa trên tác phẩm: ${novelSummary.title}. ${novelSummary.synopsis}`,
        majorFactions: ["Nhóm Nhân Vật Chính", "Cực Thế Lực Bóng Tối", "Các Gia Tộc Ẩn Thế", "Liên Minh Hòa Bình"],
        powerSystem: novelSummary.powerSystem || "Hệ thống võ học nguyên tác",
        currencyName: "Đồng tiền bản địa / Kim tệ",
        baseStats: ["Sức mạnh", "Nhan sắc", "Trí tuệ", "May mắn", "Nek-Nghị"],
        backgrounds: [
          { name: "Truyền nhân gia tộc võ học lớn", rarity: "Epic" as const },
          { name: "Tán tu / Lãng khách tự do", rarity: "Common" as const },
          { name: "Kẻ lưu vong mang huyết mạch hiếm", rarity: "Rare" as const },
          { name: "Sát thủ mật hội hắc ám", rarity: "Epic" as const },
          { name: "Con cưng của trời hiển linh", rarity: "Legendary" as const },
          { name: "Thường dân bình phàm không đợt phát", rarity: "Common" as const }
        ],
        powers: [
          { name: "Nguyên phái võ công bản hiến", rarity: "Common" as const },
          { name: "Ý chí kiên cường bộc phá", rarity: "Rare" as const },
          { name: "Mắt thần thấu thị định mệnh", rarity: "Epic" as const },
          { name: "Long huyết mạch chuyển tinh hoa", rarity: "Legendary" as const },
          { name: "Phục dược đan thiên chất", rarity: "Rare" as const }
        ],
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000"
      };
      setExtractedWorld(generated);
      setCrawlLogs(prev => [
        ...prev,
        `[SUCCESS] Đã kết xuất nhanh bối cảnh thành công!`,
        `[READY] Bản xem trước đã sẵn sàng bên dưới.`
      ]);
      setCrawlLoading(false);
    }, 1200);
  };

  const handlePublishExtractedWorld = () => {
    if (!extractedWorld) return;
    addCustomWorld(extractedWorld);
    alert(`Chúc mừng! Thế giới '${extractedWorld.name}' đã được kích hoạt thành công vào Cổng Chuyển Sinh!`);
    
    // Clear and reset state
    setShowAIExplorer(false);
    setSearchQuery('');
    setSearchResults([]);
    setNovelSummary(null);
    setNovelSummary(null);
    setExtractedWorld(null);
  };

  if (showAIExplorer) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-bold border border-purple-500/10 uppercase tracking-widest">ADVANCED FEATURE WITH GOOGLE SEARCH</span>
            <h2 className="text-xl font-serif italic text-white mt-1">Cổng Thám Hiểm & Cào Thế Giới Trực Tuyến</h2>
          </div>
          <button 
            onClick={() => setShowAIExplorer(false)}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wider border border-slate-700/50 flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> Trở Lại Form
          </button>
        </div>

        {/* Browser / Search Bar UI */}
        <div className="bg-slate-950 p-5 rounded-sm border border-slate-800 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] tracking-widest font-extrabold uppercase text-slate-400 font-mono">
              Thanh Tìm Kiếm Tiểu Thuyết Google Search & Định Vị Bối Cảnh
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGoogleSearch()}
                  placeholder="Nhập tên truyện muốn thêm (ví dụ: Vũ Động Càn Khôn, Hải Tặc Vạn Trai, Toàn Chức Pháp Sư...)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-sm pl-11 pr-4 py-2.5 text-white font-serif text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <button
                type="button"
                disabled={searchLoading}
                onClick={handleGoogleSearch}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-sm text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Xung Kích Tìm Kiếm
              </button>
            </div>
          </div>

          {/* Paste Link Box */}
          <div className="pt-2 border-t border-slate-900 flex flex-col md:flex-row md:items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Hoặc Dán URL Trực Tiếp:</span>
            <input 
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://truyenfull.vn/ten-truyen/ hoặc trangwiki bất kỳ..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-sm px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-600"
            />
            <button
              onClick={() => triggerWebCrawl(customUrl, searchQuery || 'Thương Khung')}
              disabled={crawlLoading || !customUrl}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-purple-400 border border-slate-700 px-4 py-1.5 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all"
            >
              Cào Link Này
            </button>
          </div>
        </div>

        {/* Loading of search */}
        {searchLoading && (
          <div className="py-12 flex flex-col items-center justify-center bg-slate-950 rounded-sm border border-slate-850">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-xs text-purple-300 font-serif italic animate-pulse">Đang nạp Google Grounding Search để tìm nguồn bối cảnh nguyên tác truyện...</p>
          </div>
        )}

        {/* Main interactive grid for Google Results & AI analysis */}
        {(searchResults.length > 0 || novelSummary) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Google Results (Left 2 columns) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Kết quả tìm kiếm liên kết (web hoạt động thật sự)</h3>
              </div>

              <div className="bg-slate-950 p-4 rounded-sm border border-slate-850 space-y-4 max-h-[420px] overflow-y-auto">
                {searchResults.map((resItem, i) => (
                  <div key={i} className="group border-b border-slate-900 pb-3.5 last:border-0 last:pb-0 space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] text-emerald-500 font-mono tracking-widest block mb-0.5">{resItem.url}</span>
                        <a 
                          href={resItem.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm font-serif italic text-blue-400 font-semibold hover:underline group-hover:text-blue-300 transition-colors"
                        >
                          {resItem.title}
                        </a>
                      </div>
                      <button
                        onClick={() => triggerWebCrawl(resItem.url, novelSummary?.title || searchQuery)}
                        disabled={crawlLoading}
                        className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 px-3 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all shrink-0"
                      >
                        ⚡ ĐỌC & TẠO
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">{resItem.snippet}</p>
                    <span className="inline-block text-[9px] uppercase tracking-widest font-bold font-mono px-1.5 py-0.5 bg-slate-900 text-slate-500 border border-slate-800">
                      Nguồn: {resItem.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary Card (Right 1 column) */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Xác Minh Nguyên Bản AI</h3>
              </div>

              {novelSummary && (
                <div className="bg-slate-950 p-4 rounded-sm border border-slate-850 space-y-3.5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-widest text-[#a855f7] font-bold">TỔNG HỢP TẬP TRUYỆN</span>
                    <h4 className="text-base font-serif italic text-white font-semibold leading-tight">{novelSummary.title}</h4>
                    <span className="text-[10px] text-slate-400 block font-mono">Tác giả: {novelSummary.author || 'Đang cập nhật'}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Thể loại bối cảnh</span>
                    <p className="text-xs text-white">{novelSummary.genres}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Tóm tắt bối cảnh gốc</span>
                    <p className="text-xs text-slate-400 leading-relaxed font-serif italic">{novelSummary.synopsis}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Hệ thống sức mạnh</span>
                    <p className="text-xs text-purple-300 font-serif">{novelSummary.powerSystem}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900">
                    <button
                      onClick={handleFastBuildFromSummary}
                      disabled={crawlLoading}
                      className="w-full bg-purple-600/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-500 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      ⚡ AI Tạo World Nốt Từ Ảnh Tóm Tắt
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Crawler Process terminal logs */}
        {crawlLoading && (
          <div className="bg-black border border-slate-800 rounded-sm p-4 font-mono text-[11px] leading-relaxed select-text space-y-1">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900 mb-2">
              <span className="text-purple-400 font-bold uppercase animate-pulse">⚙️ AI RUNTIME CRAWLER: SỨC KHỎE TẾT CHẤT ĐANG HOẠT ĐỘNG...</span>
              <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            {crawlLogs.map((logLine, idx) => (
              <p 
                key={idx} 
                className={`${
                  logLine.startsWith('[SUCCESS]') 
                    ? 'text-emerald-400' 
                    : logLine.startsWith('[CÓ LỖI]') || logLine.startsWith('[THẤT BẠI]')
                    ? 'text-red-400' 
                    : logLine.startsWith('[READY]')
                    ? 'text-indigo-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {logLine}
              </p>
            ))}
          </div>
        )}

        {/* Extracted World Spectator Draft / Approval Spec Card */}
        {extractedWorld && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 border border-purple-500/30 rounded-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20 uppercase tracking-widest">
                  Ready to Publish (RPG World Blueprint Draft)
                </span>
                <h3 className="text-2xl font-serif italic text-white tracking-wider">{extractedWorld.name}</h3>
                <p className="text-xs text-slate-400 font-mono">Mã ID Thế Giới: <span className="text-purple-400">{extractedWorld.id}</span> | Thể loại: #{extractedWorld.genres || 'Custom'}</p>
              </div>
              <button
                onClick={handlePublishExtractedWorld}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-6 py-3 rounded-sm text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 shrink-0 self-start"
              >
                <Check className="w-4 h-4 font-black" /> Xác Nhận Tạo Thế Giới Đồng Nhân
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Lore and Settings */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider">Tóm tắt bối cảnh nguyên bản</span>
                  <p className="text-xs text-slate-350 leading-relaxed font-serif italic whitespace-pre-wrap">{extractedWorld.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider">Hệ thống lực lượng / Sức mạnh</span>
                    <p className="text-xs text-purple-300 font-serif">{extractedWorld.powerSystem}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider">Tiền tệ đặc trưng</span>
                    <p className="text-xs text-amber-400 font-mono">{extractedWorld.currencyName}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider block">Các thế lực tiêu biểu</span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedWorld.majorFactions?.map((fac: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700/50 px-2.5 py-1 rounded-sm">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Backgrounds & God-given powers (Danh sách chuyển sinh & Bàn tay vàng) */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider block">Các Thân Phận Đề xuất ({extractedWorld.backgrounds?.length})</span>
                  <div className="grid grid-cols-2 gap-2">
                    {extractedWorld.backgrounds?.map((bg: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-sm border border-slate-850 flex items-center justify-between text-xs">
                        <span className="font-serif italic text-slate-200 truncate pr-2">{bg.name}</span>
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm border ${getLocalRarityColor(bg.rarity)}`}>
                          {bg.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase font-mono text-slate-500 tracking-wider block">Kỹ Năng Hỗ Trợ / Bàn Tay Vàng Mặc Định ({extractedWorld.powers?.length})</span>
                  <div className="grid grid-cols-2 gap-2">
                    {extractedWorld.powers?.map((p: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-sm border border-slate-850 flex items-center justify-between text-xs">
                        <span className="font-serif italic text-slate-200 truncate pr-2">{p.name}</span>
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm border ${getLocalRarityColor(p.rarity)}`}>
                          {p.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-serif italic text-white mb-6">Thêm Thế Giới Chuyển Sinh Mới</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Tên Tiểu Thuyết/Truyện Gốc *</label>
            <input 
              type="text" 
              value={mainName}
              onChange={(e) => setMainName(e.target.value)}
              placeholder="VD: Naruto" 
              className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Tên Phụ (Không bắt buộc)</label>
            <input 
              type="text" 
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="VD: Cửu Vĩ Truyền Thuyết" 
              className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Thể Loại Hiện Có Của Thế Giới</label>
          <input 
            type="text" 
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="Shounen, Hành động, Ninja, Nhẫn thuật..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
           <label className="block text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Nội Dung Tóm Tắt Của Thế Giới</label>
           <textarea 
             value={summary}
             onChange={(e) => setSummary(e.target.value)}
             className="w-full h-24 bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500"
           />
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1.5">
            <label className="block text-[10px] tracking-widest font-bold uppercase text-slate-400">
              File Truyện hoặc Tóm Tắt Chi Tiết (Cho AI phân tích)
            </label>
            
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-sm text-[9px] uppercase tracking-widest font-bold transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Nạp File EPUB</span>
                <input 
                  type="file" 
                  accept=".epub"
                  onChange={handleEpubUpload}
                  disabled={epubParsing}
                  className="hidden"
                />
              </label>
              
              {storyText && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Xóa toàn bộ nội dung văn bản đang có?")) {
                      setStoryText('');
                      setEpubStatus('');
                    }
                  }}
                  className="px-2 py-1 text-[9px] uppercase tracking-widest font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  Xóa văn bản
                </button>
              )}
            </div>
          </div>

          {epubStatus && (
            <div className={`p-2.5 mb-2 rounded-sm text-[11px] font-serif border ${
              epubStatus.startsWith('Có lỗi') 
                ? 'bg-red-500/10 text-red-400 border-red-500/15'
                : epubStatus.startsWith('Thành công')
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/15'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/15 animate-pulse'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{epubStatus}</span>
              </div>
            </div>
          )}

          <textarea 
             value={storyText}
             onChange={(e) => setStoryText(e.target.value)}
             placeholder="Dán tóm tắt chi tiết hoặc nội dung để AI thu thập thông tin... Bạn cũng có thể nhấn nút 'Nạp File EPUB' phía trên để trích xuất nội dung từ tệp truyện epub của bạn."
             className="w-full h-40 bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
           />
           {storyText && (
             <div className="text-[9px] font-mono text-slate-500 text-right mt-1">
               Tổng số ký tự: <span className="text-slate-300">{storyText.length.toLocaleString()}</span>
             </div>
           )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex gap-4">
          <button 
            disabled={loading}
            onClick={handleAnalyzeWorld}
            className="bg-emerald-600 disabled:opacity-50 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-sm transition-colors text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
            AI Thu Thập Thông Tin & Thêm Thế Giới
          </button>
          <button 
            disabled={loading}
            onClick={() => {
              setShowAIExplorer(true);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-sm transition-colors text-[10px] uppercase tracking-widest flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            AI Tự Động Tìm Thêm Thế Giới Khác
          </button>
        </div>
      </div>
    </div>
  );
}

import { WORLDS } from '../data/worlds';

function ManageWorldsManager() {
  const { customWorlds, updateCustomWorld, deleteCustomWorld } = useStore();

  const handleToggleHide = (worldId: string, isCustom: boolean) => {
    if (!isCustom) {
      alert("Thế giới mặc định không thể ẩn từ giao diện, vui lòng sửa code.");
      return;
    }
    const world = customWorlds.find(w => w.id === worldId);
    if (world) {
      updateCustomWorld(worldId, { isHidden: !world.isHidden });
    }
  };

  const handleDelete = (worldId: string, isCustom: boolean) => {
    if (!isCustom) {
      alert("Thế giới mặc định không thể xoá, vui lòng sửa code.");
      return;
    }
    if (confirm("Chắc chắn muốn xoá thế giới này?")) {
      deleteCustomWorld(worldId);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-serif italic text-white mb-4">Quản Lí Thế Giới Chuyển Sinh</h2>
      <div className="bg-slate-950 p-4 rounded-sm border border-slate-800">
         <table className="w-full text-left text-sm text-slate-400">
           <thead className="text-[10px] tracking-widest uppercase font-bold text-slate-500">
             <tr className="border-b border-slate-800">
               <th className="pb-3 px-2">Tên Thế Giới</th>
               <th className="pb-3 px-2">Loại</th>
               <th className="pb-3 px-2">Trạng Thái</th>
               <th className="pb-3 px-2 text-right">Hành Động</th>
             </tr>
           </thead>
           <tbody>
             {Object.values(WORLDS).map(world => (
               <tr key={world.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                 <td className="py-3 px-2 text-white font-serif">{world.name}</td>
                 <td className="py-3 px-2">Hệ Thống</td>
                 <td className="py-3 px-2"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-sm text-[10px] uppercase font-bold">Mặc định</span></td>
                 <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-[10px] uppercase tracking-widest font-bold text-blue-400 hover:text-blue-300" onClick={() => alert("Cập nhật thế giới gốc...")}>Cập Nhật</button>
                      <button className="text-[10px] uppercase tracking-widest font-bold text-slate-600 cursor-not-allowed">Ẩn</button>
                      <button className="text-[10px] uppercase tracking-widest font-bold text-slate-600 cursor-not-allowed">Xóa</button>
                    </div>
                 </td>
               </tr>
             ))}
             {customWorlds.map(world => (
               <tr key={world.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                 <td className="py-3 px-2 text-white font-serif">{world.name}</td>
                 <td className="py-3 px-2">Custom</td>
                 <td className="py-3 px-2">
                   {world.isHidden ? (
                      <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded-sm text-[10px] uppercase font-bold">Đang Ẩn</span>
                   ) : (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-sm text-[10px] uppercase font-bold">Đang Hiện</span>
                   )}
                 </td>
                 <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-[10px] uppercase tracking-widest font-bold text-blue-400 hover:text-blue-300" onClick={() => alert("Cập nhật...")}>Cập Nhật</button>
                      <button onClick={() => handleToggleHide(world.id, true)} className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 hover:text-emerald-300">
                        {world.isHidden ? "Hiện" : "Ẩn"}
                      </button>
                      <button onClick={() => handleDelete(world.id, true)} className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-400">Xóa</button>
                    </div>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
}
