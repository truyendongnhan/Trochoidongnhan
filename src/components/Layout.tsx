import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Map, User, Home as HomeIcon, Menu, X, Library, LogOut, ShieldAlert, Globe } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../lib/firebase';

function NavLinks({ activeProjectId, onClick, isAdmin }: { activeProjectId: string | null, onClick?: () => void, isAdmin?: boolean }) {
  return (
    <>
      <Link to="/" onClick={onClick} className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-2 py-2 md:py-0">
        <Map className="w-4 h-4" /> Cổng Chuyển Sinh
      </Link>
      <Link to="/online-worlds" onClick={onClick} className="text-slate-400 hover:text-white transition flex items-center gap-2 py-2 md:py-0">
        <Globe className="w-4 h-4" /> Chuyển Sinh Online
      </Link>
      <Link to="/library" onClick={onClick} className="text-slate-400 hover:text-white transition flex items-center gap-2 py-2 md:py-0">
        <Library className="w-4 h-4" /> Kho Thế Giới
      </Link>
      {activeProjectId && (
        <Link to="/dashboard" onClick={onClick} className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-2 py-2 md:py-0 md:border-l md:border-slate-700 md:pl-6 md:ml-2">
          <BookOpen className="w-4 h-4" /> Bàn Làm Việc
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" onClick={onClick} className="text-orange-400 hover:text-orange-300 transition flex items-center gap-2 py-2 md:py-0 md:border-l md:border-slate-700 md:pl-6 md:ml-2">
          <ShieldAlert className="w-4 h-4" /> Quản Trị Viên
        </Link>
      )}
    </>
  );
}

export default function Layout() {
  const { activeProjectId, currentUserProfile } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, loading] = useAuthState(auth);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl md:text-2xl font-serif italic tracking-wider uppercase text-emerald-400 flex items-center gap-2 md:gap-3">
            <BookOpen className="text-emerald-500 w-5 h-5 md:w-6 md:h-6 shrink-0" />
            <span className="truncate">Studio Đồng Nhân</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-[10px] tracking-widest font-bold uppercase">
            <NavLinks activeProjectId={activeProjectId} isAdmin={user?.email === 'hogiakhiem9@gmail.com' || user?.email === 'taigamehanquoc9@gmail.com'} />
            
            <div className="ml-4 pl-4 border-l border-slate-800 flex items-center">
              {!loading && (
                user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-sm font-mono text-[11px] font-bold normal-case select-none" title="Số dư Kim Ngọc">
                      <span>💎</span>
                      <span>{currentUserProfile?.kimNgoc ?? 0}</span>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                      <img src={user.photoURL || ''} alt="avatar" className="w-6 h-6 rounded-full border border-slate-700" />
                      <span className="text-xs font-medium text-slate-300 normal-case">{user.displayName}</span>
                    </Link>
                    <button 
                      onClick={logout}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Đăng xuất"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={signInWithGoogle}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold rounded-sm border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Đăng Nhập
                  </button>
                )
              )}
            </div>
          </nav>

          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 text-[10px] tracking-widest font-bold uppercase flex flex-col gap-2">
            <NavLinks activeProjectId={activeProjectId} onClick={() => setIsMobileMenuOpen(false)} isAdmin={user?.email === 'hogiakhiem9@gmail.com' || user?.email === 'taigamehanquoc9@gmail.com'} />
            <div className="border-t border-slate-800 pt-3 mt-1">
              {!loading && (
                user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-sm font-mono text-[11px] font-bold normal-case select-none">
                        <span>💎</span>
                        <span>{currentUserProfile?.kimNgoc ?? 0} KN</span>
                      </div>
                      <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <img src={user.photoURL || ''} alt="avatar" className="w-6 h-6 rounded-full border border-slate-700" />
                        <span className="text-xs font-medium text-slate-300 normal-case">{user.displayName}</span>
                      </Link>
                    </div>
                    <button 
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      signInWithGoogle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 w-max text-[10px] font-bold rounded-sm border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Đăng Nhập
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 w-full">
        <Outlet />
      </main>
    </div>
  );
}
