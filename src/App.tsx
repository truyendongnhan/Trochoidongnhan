import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, logout } from './lib/firebase';
import { useStore } from './store/useStore';
import { subscribeToUserProjects, subscribeToCustomWorlds, subscribeToPublishedNovels, testConnection, syncUserProfile } from './lib/firestoreSync';
import { ShieldAlert, LogOut } from 'lucide-react';

import Layout from './components/Layout';
import Library from './pages/Library';
import WorldSelect from './pages/WorldSelect';
import CharacterDesign from './pages/CharacterDesign';
import Dashboard from './pages/Dashboard';
import CharacterSheet from './pages/CharacterSheet';
import ChapterEditor from './pages/ChapterEditor';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import OnlineWorlds from './pages/OnlineWorlds';

export default function App() {
  const [user] = useAuthState(auth);
  const { setProjects, setCustomWorlds, setPublishedNovels, currentUserProfile, setCurrentUserProfile } = useStore();

  // Validate Firestore Connection on Application Init
  useEffect(() => {
    testConnection();
  }, []);

  // Sync and listen to user profile in real time
  useEffect(() => {
    if (!user) {
      setCurrentUserProfile(null);
      return;
    }

    // Sync initial profile
    syncUserProfile(user).then((profile) => {
      if (profile) {
        setCurrentUserProfile(profile);
      }
    });

    // Sub to user profile updates
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUserProfile(snapshot.data());
      }
    }, (error) => {
      console.warn("Realtime user profile stream error or offline:", error);
    });

    return () => {
      unsubscribeUser();
    };
  }, [user, setCurrentUserProfile]);

  // Sync state in real-time from Firestore on auth changes
  useEffect(() => {
    // Subscribe to custom worlds
    const unsubscribeWorlds = subscribeToCustomWorlds((worlds) => {
      setCustomWorlds(worlds);
    });

    // Subscribe to projects if user logs in
    let unsubscribeProjects = () => {};
    let unsubscribeNovels = () => {};
    
    if (user) {
      unsubscribeProjects = subscribeToUserProjects(user.uid, (projects) => {
        setProjects(projects);
      });

      unsubscribeNovels = subscribeToPublishedNovels((novels) => {
        setPublishedNovels(novels);
      });
    }

    return () => {
      unsubscribeWorlds();
      unsubscribeProjects();
      unsubscribeNovels();
    };
  }, [user, setProjects, setCustomWorlds, setPublishedNovels]);

  const isBanned = currentUserProfile?.banInfo?.isBanned && currentUserProfile?.banInfo?.bannedUntil > Date.now();

  if (isBanned) {
    const banDate = new Date(currentUserProfile.banInfo.bannedUntil);
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans selection:bg-red-500/30">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-950/10 space-y-6">
          <div className="inline-flex p-4 rounded-full bg-red-950/30 text-red-400 border border-red-500/20">
            <ShieldAlert size={40} className="animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Tài Khoản Đang Bị Khóa</h1>
            <p className="text-sm text-slate-400">Tài khoản của bạn đã vi phạm điều khoản quy định của hệ thống.</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-3">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Lý do khóa</span>
              <span className="text-sm text-red-200 mt-1 block font-medium">{currentUserProfile.banInfo.reason || 'Vi phạm nội quy hệ thống'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Thời hạn đến</span>
              <span className="text-sm text-slate-200 mt-1 block font-mono">{banDate.toLocaleString('vi-VN')}</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 font-medium py-3 px-4 rounded-xl transition duration-200 cursor-pointer"
          >
            <LogOut size={16} />
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WorldSelect />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<Admin />} />
          <Route path="online-worlds" element={<OnlineWorlds />} />
          <Route path="library" element={<Library />} />
          <Route path="world" element={<WorldSelect />} />
          <Route path="character-design" element={<CharacterDesign />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="character" element={<CharacterSheet />} />
          <Route path="editor/:chapterId" element={<ChapterEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
