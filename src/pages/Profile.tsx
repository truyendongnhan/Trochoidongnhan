import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { useStore } from '../store/useStore';
import { LogOut, User, BookOpen, Star, Clock, Edit2, Check, X as XIcon, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const obfuscateEmail = (email: string | null) => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name}***@${domain}`;
  return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
};

export default function Profile() {
  const [user, loading] = useAuthState(auth);
  const { projects } = useStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !isEditing) {
      setEditName(user.displayName || '');
      setEditPhotoUrl(user.photoURL || '');
    }
  }, [user, isEditing]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, {
        displayName: editName,
        photoURL: editPhotoUrl
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Lỗi khi cập nhật hồ sơ:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <User className="w-16 h-16 text-slate-600 mx-auto mb-6" />
        <h1 className="text-3xl font-serif italic text-white mb-4">Hồ Sơ Chuyển Sinh</h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Đăng nhập để lưu trữ thông tin linh hồn, đồng bộ các nhân vật đã tạo và tiếp tục cuộc hành trình ở các thế giới khác nhau.
        </p>
        <button
          onClick={signInWithGoogle}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-sm transition-colors uppercase tracking-widest text-sm flex items-center gap-2 mx-auto"
        >
          <User className="w-5 h-5" />
          Tiếp Cận Cổng Dịch Chuyển
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-serif italic text-emerald-400 tracking-wider mb-2">Hồ Sơ Chuyển Sinh</h1>
        <p className="text-[10px] tracking-widest text-slate-400 uppercase font-bold">Thông tin linh hồn & Lưu trữ cốt truyện</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden mb-8">
        <div className="h-32 bg-slate-800 relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-repeat mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 -mt-16 mb-8 text-center md:text-left">
            <div className="relative z-10">
              <img 
                src={isEditing ? editPhotoUrl || 'https://via.placeholder.com/150' : user.photoURL || 'https://via.placeholder.com/150'} 
                alt="Avatar" 
                className="w-32 h-32 rounded-full border-4 border-slate-900 bg-slate-800 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                }}
              />
            </div>
            
            <div className="flex-1 mt-16 md:mt-16 z-10 w-full">
              {isEditing ? (
                <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-1">Tên Hiển Thị</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-1">URL Ảnh Đại Diện</label>
                    <input 
                      type="text" 
                      value={editPhotoUrl}
                      onChange={e => setEditPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-white font-serif focus:outline-none focus:border-emerald-500 text-sm mb-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 px-4 rounded-sm text-[10px] tracking-widest font-bold uppercase flex items-center justify-center gap-2 transition-colors"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <><Check className="w-4 h-4" /> Lưu</>
                      )}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white py-2 px-4 rounded-sm transition-colors"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    <h2 className="text-2xl font-serif italic text-white">{user.displayName || 'Khách Ly Hương'}</h2>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-slate-500 hover:text-emerald-400 bg-slate-800 rounded-full transition-colors"
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{obfuscateEmail(user.email)}</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] uppercase tracking-widest font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-sm border border-emerald-500/20">
                      <Star className="w-3 h-3" />
                      ID Dị Giới: {user.uid.slice(0, 8)}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-300 bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700">
                      <Clock className="w-3 h-3" />
                      Ngày Đăng Ký: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN') : 'Unknown'}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="z-10 mt-0 md:mt-16 mb-2">
              <button 
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 rounded-sm transition-colors text-[10px] uppercase font-bold tracking-widest w-full justify-center md:w-auto"
              >
                <LogOut className="w-4 h-4" />
                Ngắt Kết Nối
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-8">
            <div className="bg-slate-950 p-6 rounded-sm border border-slate-800 text-center">
              <BookOpen className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <div className="text-3xl font-serif text-white mb-1">{projects.length}</div>
              <div className="text-[10px] tracking-widest font-bold uppercase text-slate-500">Nhân Vật Tồn Tại</div>
            </div>
            
            <div className="bg-slate-950 p-6 rounded-sm border border-slate-800 text-center">
               <Star className="w-8 h-8 text-orange-400 mx-auto mb-3" />
               <div className="text-3xl font-serif text-white mb-1">
                 {projects.reduce((acc, p) => acc + (p.character.backgroundRarity === 'Legendary' || p.character.powerRarity === 'Legendary' ? 1 : 0), 0)}
               </div>
               <div className="text-[10px] tracking-widest font-bold uppercase text-slate-500">Thiên Tài Thế Kỷ</div>
            </div>

            <div className="bg-slate-950 p-6 rounded-sm border border-slate-800 text-center">
               <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
               <div className="text-3xl font-serif text-white mb-1">
                 {projects.reduce((acc, p) => acc + p.chapters.length, 0)}
               </div>
               <div className="text-[10px] tracking-widest font-bold uppercase text-slate-500">Tổng Số Chương</div>
            </div>
          </div>
        </div>
      </div>
      
      {projects.length > 0 && (
        <div className="text-center">
           <button 
             onClick={() => navigate('/library')}
             className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 hover:text-emerald-300 flex items-center gap-2 mx-auto justify-center"
           >
             Xem Thư Viện Chuyển Sinh &rarr;
           </button>
        </div>
      )}
    </div>
  );
}
