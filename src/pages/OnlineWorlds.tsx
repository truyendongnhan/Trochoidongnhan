import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { WORLDS } from '../data/worlds';
import { World, PublishedNovel, Chapter, getRarityColor } from '../types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { getPublishedNovelChaptersFromFirestore, updateUserKimNgoc } from '../lib/firestoreSync';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Globe, 
  Search, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Compass, 
  ShieldAlert, 
  Trash2,
  X,
  Book,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck
} from 'lucide-react';

export default function OnlineWorlds() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { customWorlds, setWorld, deleteCustomWorld, publishedNovels, currentUserProfile } = useStore();
  
  // Design tab or view mode: worlds (Destinations) or novels (Reader Library)
  const [viewMode, setViewMode] = useState<'worlds' | 'novels'>('worlds');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'system'>('all');
  
  // Selected detailed world
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);

  // Novel reader states
  const [readingNovel, setReadingNovel] = useState<PublishedNovel | null>(null);
  const [novelChapters, setNovelChapters] = useState<Chapter[]>([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isTipping, setIsTipping] = useState(false);

  const handleTipAuthor = async (amount: number) => {
    if (!user) {
      alert("Vui lòng đăng nhập để tặng Kim Ngọc!");
      return;
    }
    
    if (!readingNovel) return;
    
    const balance = currentUserProfile?.kimNgoc ?? 0;
    if (balance < amount) {
      alert(`Đồng đạo không đủ Kim Ngọc! Số dư hiện tại là: ${balance} KN. Hãy điểm danh hấp thu linh khí trong Hồ Sơ.`);
      return;
    }
    
    if (readingNovel.userId === user.uid) {
      alert("Đạo hữu không thể tự tặng quà cho chính mình.");
      return;
    }

    setIsTipping(true);
    try {
      // 1. Deduct from sender
      await updateUserKimNgoc(user.uid, -amount, balance);
      
      // 2. Fetch and add to recipient
      const authorRef = doc(db, 'users', readingNovel.userId);
      const authorSnap = await getDoc(authorRef);
      let authorCurrentKimNgoc = 0;
      if (authorSnap.exists()) {
        authorCurrentKimNgoc = authorSnap.data().kimNgoc ?? 0;
      }
      
      await setDoc(authorRef, {
        kimNgoc: authorCurrentKimNgoc + amount,
        updatedAt: Date.now()
      }, { merge: true });
      
      alert(`Khánh điển! Đồng đạo đã hào phóng tặng ${amount} Kim Ngọc để cổ vũ tinh thần của đạo hữu ${readingNovel.userEmail.split('@')[0]}!`);
    } catch (err) {
      console.error("Lỗi khi tặng Kim Ngọc:", err);
      alert("Đường truyền linh khí trục trặc, tặng quà thất bại.");
    } finally {
      setIsTipping(false);
    }
  };

  // Prepare lists
  const systemWorldsList = Object.values(WORLDS);
  const customWorldsList = (customWorlds || []).filter(w => !w.isHidden);

  let displayedWorlds: World[] = [];
  if (activeTab === 'all') {
    displayedWorlds = [...systemWorldsList, ...customWorldsList];
  } else if (activeTab === 'system') {
    displayedWorlds = systemWorldsList;
  } else {
    displayedWorlds = customWorldsList;
  }

  // Filter worlds
  displayedWorlds = displayedWorlds.filter(w => {
    const matchesSearch = 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.powerSystem && w.powerSystem.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesConfigType = 
      selectedType === 'all' || 
      w.type.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesConfigType;
  });

  // Filter public approved novels
  const approvedNovels = (publishedNovels || []).filter(n => n.status === 'approved');
  
  const displayedNovels = approvedNovels.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.characterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.powerSystem.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSelectWorld = (worldId: string) => {
    setWorld(worldId);
    navigate('/character-design');
  };

  const handleAdminDelete = (worldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bạn là Quản Trị Viên. Bạn có chắc chắn muốn xóa vĩnh viễn thế giới này khỏi hệ thống?")) {
      deleteCustomWorld(worldId);
      if (selectedWorld?.id === worldId) {
        setSelectedWorld(null);
      }
    }
  };

  const handleReadNovel = async (novel: PublishedNovel) => {
    setReadingNovel(novel);
    setIsLoadingChapters(true);
    setNovelChapters([]);
    setSelectedChapterIndex(0);
    try {
      const chaps = await getPublishedNovelChaptersFromFirestore(novel.id);
      setNovelChapters(chaps);
    } catch (err) {
      console.error("Error reading community novel chapters:", err);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const isAdmin = user?.email === 'hogiakhiem9@gmail.com' || user?.email === 'taigamehanquoc9@gmail.com';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-slate-200">
      
      {/* Hero Header */}
      <div className="relative rounded-sm overflow-hidden border border-slate-850 bg-slate-950/60 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] uppercase tracking-widest font-bold">
            <Globe className="w-3.5 h-3.5" /> Chuyển Sinh Trực Tuyến
          </div>
          <h1 className="text-3xl md:text-5xl font-serif italic text-white tracking-wider leading-none">
            Cộng Đồng <span className="text-emerald-400">Đồng Nhân</span> Việt
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-serif">
            Nơi giao lưu, thám hiểm thế giới và đọc các tiểu thuyết đồng nhân độc đáo được chính cộng đồng người chơi viết ra nhờ sự trợ giúp của trí tuệ nhân tạo Gemini.
          </p>
        </div>
        
        <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="w-full text-center bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 px-6 py-3 rounded-sm tracking-widest uppercase text-[10px] font-bold transition flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" /> Bảng Điều Hành Admin
            </button>
          )}
          <button 
            onClick={() => navigate('/world')}
            className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-3 rounded-sm tracking-widest uppercase text-[10px] font-bold transition flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" /> Bắt Đầu Viết Đồng Nhân
          </button>
        </div>
      </div>

      {/* Main Mode Toggle Tab bar */}
      <div className="flex border-b border-slate-850 pb-px gap-2">
        <button
          onClick={() => { setViewMode('worlds'); setSearchQuery(''); }}
          className={`px-5 py-3.5 text-xs font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${
            viewMode === 'worlds'
              ? 'border-emerald-400 text-emerald-400 font-extrabold bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" /> Bảng Thế Giới ({systemWorldsList.length + customWorldsList.length})
        </button>
        <button
          onClick={() => { setViewMode('novels'); setSearchQuery(''); }}
          className={`px-5 py-3.5 text-xs font-bold tracking-widest uppercase border-b-2 transition flex items-center gap-2 ${
            viewMode === 'novels'
              ? 'border-emerald-400 text-emerald-400 font-extrabold bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" /> Thư Viện Tiểu Thuyết ({approvedNovels.length})
        </button>
      </div>

      {/* Database Filters & Actions panel */}
      {viewMode === 'worlds' ? (
        <div className="space-y-6">
          <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-sm space-y-4">
            {/* Search controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm: Tên thế giới, hệ thống sức mạnh, bối cảnh..."
                  className="w-full bg-slate-900 border border-slate-750 rounded-sm pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-serif"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-slate-900 border border-slate-755 rounded-sm px-4 py-2.5 text-xs font-bold tracking-wider text-slate-300 uppercase focus:outline-none"
                >
                  <option value="all">Tất cả Thể loại</option>
                  <option value="anime">Anime (One Piece, Naruto...)</option>
                  <option value="tu_tien">Tu Tiên (Tục Gia, Cổ Kính...)</option>
                  <option value="magic">Phép Thuật & Kỳ Ảo</option>
                  <option value="murim">Võ Lâm Trung Nguyên</option>
                  <option value="custom">Do User Tạo</option>
                </select>
              </div>
            </div>

            {/* Tab Selection */}
            <div className="flex border-b border-slate-850 pt-2 gap-4 select-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 text-[10px] uppercase font-bold tracking-widest border-b-2 transition-all ${
                  activeTab === 'all' 
                    ? 'border-emerald-400 text-emerald-400' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Tất Cả ({systemWorldsList.length + customWorldsList.length})
              </button>
              
              <button
                onClick={() => setActiveTab('custom')}
                className={`pb-3 text-[10px] uppercase font-bold tracking-widest border-b-2 transition-all ${
                  activeTab === 'custom' 
                    ? 'border-emerald-400 text-emerald-400' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Cộng Đồng ({customWorldsList.length})
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`pb-3 text-[10px] uppercase font-bold tracking-widest border-b-2 transition-all ${
                  activeTab === 'system' 
                    ? 'border-emerald-400 text-emerald-400' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Hệ Thống Mặc Định ({systemWorldsList.length})
              </button>
            </div>
          </div>

          {/* Worlds Display Grid */}
          {displayedWorlds.length === 0 ? (
            <div className="text-center py-20 border border-slate-800 border-dashed rounded-sm bg-slate-950/20">
              <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-400 font-serif italic">Không tìm thấy thế giới đồng nhân nào phù hợp với điều kiện tìm kiếm.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedType('all'); setActiveTab('all'); }}
                className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
              >
                Thiết Lập Lại Bộ Lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedWorlds.map((world) => {
                const isCustom = !systemWorldsList.some(sw => sw.id === world.id);
                return (
                  <div
                    key={world.id}
                    onClick={() => setSelectedWorld(world)}
                    className="group relative flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-sm p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 h-[280px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] tracking-wider uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          #{world.type}
                        </span>
                        
                        {isCustom ? (
                          <span className="text-[9px] tracking-wider uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10">
                            Cộng Đồng
                          </span>
                        ) : (
                          <span className="text-[9px] tracking-wider uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                            Hệ Thống
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-serif italic text-white group-hover:text-emerald-400 transition mb-2 line-clamp-1 leading-tight">
                        {world.name}
                      </h3>
                      
                      <p className="text-xs text-slate-400 font-serif line-clamp-3 leading-relaxed mb-4">
                        {world.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-850">
                      <div className="flex justify-between text-[10px] text-slate-500 tracking-wide font-mono">
                        <span>Hệ thống: <strong className="text-slate-350">{world.powerSystem || 'N/A'}</strong></span>
                        <span>Tiền tệ: <strong className="text-slate-350">{world.currencyName || 'N/A'}</strong></span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectWorld(world.id);
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-emerald-400 hover:text-emerald-300 uppercase transition-colors"
                        >
                          Bắt Đầu <ArrowRight className="w-3.5 h-3.5" />
                        </span>

                        {isAdmin && isCustom && (
                          <button 
                            onClick={(e) => handleAdminDelete(world.id, e)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10 transition-colors"
                            title="Xóa thế giới này (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Novel Viewer / Library layout */
        <div className="space-y-6">
          <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tiểu thuyết: Tên truyện, nhân vật chính, hệ thống sức mạnh..."
                className="w-full bg-slate-900 border border-slate-750 rounded-sm pl-10 pr-4 py-2.5 text-sm text-slate-250 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-serif"
              />
            </div>
          </div>

          {displayedNovels.length === 0 ? (
            <div className="text-center py-20 border border-slate-800 border-dashed rounded-sm bg-slate-950/20">
              <Book className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-400 font-serif italic">Thư viện trống hoặc chưa có tiểu thuyết nào được Ban quản trị duyệt xuất bản.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedNovels.map((novel) => (
                <div
                  key={novel.id}
                  onClick={() => handleReadNovel(novel)}
                  className="group relative flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-sm p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 h-[270px]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] tracking-widest font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                        #{novel.powerSystem}
                      </span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                        <User className="w-3 h-3 text-emerald-500" /> {novel.userEmail.split('@')[0]}
                      </span>
                    </div>

                    <h3 className="text-lg font-serif italic text-white group-hover:text-emerald-400 transition mb-2 line-clamp-2 leading-tight">
                      {novel.title}
                    </h3>
                    
                    <p className="text-xs text-slate-300 font-serif mb-2 font-semibold">
                      Nhân vật chính: <span className="text-emerald-300">{novel.characterName}</span>
                    </p>

                    <p className="text-xs text-slate-400 font-serif line-clamp-3 leading-relaxed whitespace-pre-line italic">
                      Văn án: {novel.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-850 mt-4 flex items-center justify-between shrink-0">
                    <span className="text-[9px] text-slate-500 font-mono">
                      Cập nhật: {new Date(novel.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                      Đọc Truyện <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* World Inspector Detail Modal */}
      {selectedWorld && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-sm max-w-4xl w-full max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl relative">
            
            {/* Header / info banner */}
            <div className="relative p-6 md:p-8 bg-slate-950 shrink-0 border-b border-slate-850 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.06),transparent_50%)]"></div>
              
              <button 
                onClick={() => setSelectedWorld(null)}
                className="absolute top-5 right-5 text-slate-450 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 max-w-2xl relative z-10">
                <span className="text-[8px] tracking-widest font-bold uppercase bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 inline-block font-mono">
                  #{selectedWorld.type}
                </span>
                <h2 className="text-2xl md:text-3.5xl font-serif italic text-white tracking-wide mt-1">
                  {selectedWorld.name}
                </h2>
              </div>
            </div>

            {/* Core Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Introduction description */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 border-b border-slate-800 pb-1.5">Tóm Tắt Bối Cảnh</h4>
                <p className="text-slate-300 font-serif leading-relaxed text-sm">
                  {selectedWorld.description}
                </p>
              </div>

              {/* Extended settings */}
              {selectedWorld.settingDetails && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 border-b border-slate-800 pb-1.5">Chi Tiết Thiết Lập Thế Giới (Lore)</h4>
                  <p className="text-slate-400 font-serif leading-relaxed text-xs whitespace-pre-line">
                    {selectedWorld.settingDetails}
                  </p>
                </div>
              )}

              {/* Power structures Info card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-sm border border-slate-800">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Cơ Chế Sức Mạnh</span>
                  <span className="text-sm font-serif italic text-emerald-400 font-bold">{selectedWorld.powerSystem}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-sm border border-slate-800">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-slate-500 block mb-1">Đồng Tiền Lưu Hành</span>
                  <span className="text-sm font-serif italic text-white font-bold">{selectedWorld.currencyName}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-sm border border-slate-800 col-span-1">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-slate-500 block mb-1 font-mono">Chỉ Số Đọc Thể</span>
                  <span className="text-xs text-slate-400 select-none flex flex-wrap gap-1 font-mono">
                    {selectedWorld.baseStats?.join(' • ') || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Factions */}
              {selectedWorld.majorFactions && selectedWorld.majorFactions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 border-b border-slate-800 pb-1.5">Các Thế Lực Lớn</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorld.majorFactions.map((fac, idx) => (
                      <span key={idx} className="bg-slate-950 px-3 py-1.5 text-xs text-slate-350 rounded-sm border border-slate-800 hover:border-slate-700 transition font-serif italic">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Start setups: backgrounds vs initial powers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Backgrounds */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 border-b border-slate-800 pb-1.5">Thân Phận Đồng Nhân (Khởi Đầu)</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {selectedWorld.backgrounds && selectedWorld.backgrounds.map((bg, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-sm border border-slate-800/60 hover:bg-slate-850/40 transition">
                        <span className="text-xs font-serif text-slate-300 italic">{bg.name}</span>
                        <span className={`text-[9px] font-mono tracking-wider font-bold uppercase ${getRarityColor(bg.rarity)}`}>
                          {bg.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Powers */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 border-b border-slate-800 pb-1.5">Khởi Đầu Cơ Duyên & Bàn Tay Vàng</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {selectedWorld.powers && selectedWorld.powers.map((pw, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-sm border border-slate-800/60 hover:bg-slate-850/40 transition">
                        <span className="text-xs font-serif text-slate-300 italic">{pw.name}</span>
                        <span className={`text-[9px] font-mono tracking-wider font-bold uppercase ${getRarityColor(pw.rarity)}`}>
                          {pw.rarity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Footer action */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shrink-0">
              <span className="text-[9px] tracking-wide font-mono text-slate-500 uppercase">
                World ID: {selectedWorld.id}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedWorld(null)}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-sm transition tracking-wider uppercase text-[10px] font-bold"
                >
                  Đóng Lại
                </button>
                <button 
                  onClick={() => {
                    setSelectedWorld(null);
                    handleSelectWorld(selectedWorld.id);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-sm transition tracking-widest uppercase text-[10px] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Bắt Đầu Chuyển Sinh Ngay
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Immersive Community Fanfiction Ebook Reader Modal */}
      {readingNovel && (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col md:flex-row shadow-2xl animate-fade-in text-slate-250">
          
          {/* Left Panel: Chapter selection / metadata (collapsible on mobile, fixed on desktop) */}
          <div className="w-full md:w-80 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between max-h-[40vh] md:max-h-full">
            <div className="p-5 border-b border-slate-800 shrink-0 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[8px] uppercase tracking-widest font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {readingNovel.powerSystem}
                </span>
                <button 
                  onClick={() => setReadingNovel(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-lg font-serif italic text-white line-clamp-2 leading-tight">{readingNovel.title}</h2>
              <div className="text-[10px] text-slate-500 font-mono">
                Tác giả: {readingNovel.userEmail.split('@')[0]}
              </div>
              <div className="text-[10px] text-emerald-300 font-serif">
                Nhân vật: {readingNovel.characterName}
              </div>
            </div>

            {/* Tipping Section */}
            {user && readingNovel.userId !== user?.uid && (
              <div className="p-4 bg-slate-950 border-t border-b border-slate-850 space-y-2 relative overflow-hidden shrink-0">
                <div className="flex items-center gap-1.5 z-10 relative">
                  <span className="text-sm">💎</span>
                  <span className="text-[9px] tracking-wider font-extrabold uppercase text-amber-500">Ủng Hộ Kim Ngọc</span>
                </div>
                <p className="text-[10px] text-slate-400 font-serif leading-relaxed z-10 relative normal-case font-normal">
                  Dành tặng linh thạch cổ vũ tâm huyết sáng tạo dị bản của tác giả.
                </p>
                <div className="grid grid-cols-4 gap-1.5 pt-1 z-10 relative">
                  {[50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      disabled={isTipping}
                      onClick={() => handleTipAuthor(val)}
                      className="bg-slate-900 border border-amber-500/20 hover:border-amber-500 text-amber-450 hover:text-slate-950 hover:bg-amber-500 text-[10px] font-mono font-bold py-1 px-1 rounded transition-colors duration-200 cursor-pointer disabled:opacity-45"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters list index */}
            <div className="overflow-y-auto flex-1 p-3">
              <span className="text-[9px] tracking-wider uppercase font-bold text-slate-500 px-2 block mb-2 font-mono">Danh sách chương ({novelChapters.length})</span>
              {isLoadingChapters ? (
                <div className="flex justify-center items-center py-10">
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : novelChapters.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 italic font-serif">Truyện này chưa có chương nào được duyệt.</div>
              ) : (
                <div className="space-y-1">
                  {novelChapters.map((ch, idx) => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapterIndex(idx)}
                      className={`w-full text-left font-serif p-2.5 rounded-sm text-xs transition ${
                        selectedChapterIndex === idx 
                          ? 'bg-emerald-600/10 text-emerald-400 font-bold border border-emerald-500/20' 
                          : 'hover:bg-slate-800/50 text-slate-400'
                      }`}
                    >
                      {idx + 1}. {ch.title || 'Chương Không Tên'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 text-center text-[10px] text-slate-550 font-mono select-none">
              Thiết kế bởi Fanfiction RPG
            </div>
          </div>

          {/* Right Panel: Reading paper page */}
          <div className="flex-1 bg-slate-950 flex flex-col justify-between overflow-y-auto">
            
            {/* Header control */}
            <div className="px-6 py-4 bg-slate-900/40 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono select-none">
                <Book className="w-3.5 h-3.5 text-emerald-500" /> COMMUNITY ARCHIVE
              </div>
              <button 
                onClick={() => setReadingNovel(null)}
                className="text-xs font-bold tracking-widest text-emerald-400 hover:text-emerald-300 uppercase font-mono"
              >
                Trở lại Thư Viện
              </button>
            </div>

            {/* Reading Context Pane */}
            <div className="p-6 md:p-12 max-w-2xl mx-auto flex-1 w-full space-y-6">
              {isLoadingChapters ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 italic font-serif">Đang mở phong ấn cổ thư...</p>
                </div>
              ) : novelChapters[selectedChapterIndex] ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">Chương {selectedChapterIndex + 1}</span>
                    <h1 className="text-2xl md:text-3.5xl font-serif text-white italic tracking-wide leading-tight">
                      {novelChapters[selectedChapterIndex].title}
                    </h1>
                    <div className="border-b border-slate-850 pt-2 pb-1.5 flex justify-center md:justify-start items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(novelChapters[selectedChapterIndex].createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Novel Text Body */}
                  <div className="font-serif leading-relaxed text-slate-300 space-y-6 text-sm md:text-base selection:bg-emerald-500/20 whitespace-pre-line text-justify md:text-left select-text">
                    {novelChapters[selectedChapterIndex].content}
                  </div>

                  {/* Active RPG Choices historical record */}
                  {novelChapters[selectedChapterIndex].choices && novelChapters[selectedChapterIndex].choices.length > 0 && (
                    <div className="bg-slate-900 p-4 border border-slate-800 rounded-sm space-y-2 mt-8 shrink-0">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block font-mono">Quyết định kế tiếp trong game:</span>
                      <div className="space-y-1.5">
                        {novelChapters[selectedChapterIndex].choices.map((choice, cidx) => (
                          <div key={cidx} className="text-xs font-serif italic text-emerald-400/80 leading-relaxed ps-2 border-l-2 border-emerald-500/30">
                            • {choice}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-64">
                  <BookOpen className="w-12 h-12 text-slate-800 mb-2" />
                  <p className="text-slate-500 italic font-serif text-xs">Hãy chọn một chương ở bảng bên trái để dạo chơi.</p>
                </div>
              )}
            </div>

            {/* Bottom reading navigation bar */}
            {novelChapters.length > 0 && (
              <div className="p-4 bg-slate-900/60 border-t border-slate-850 shrink-0">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                  <button
                    disabled={selectedChapterIndex === 0}
                    onClick={() => setSelectedChapterIndex(prev => prev - 1)}
                    className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 hover:text-white uppercase disabled:opacity-30 disabled:hover:text-slate-450 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Chương Trước
                  </button>
                  
                  <span className="text-xs text-slate-500 font-mono select-none">
                    {selectedChapterIndex + 1} / {novelChapters.length}
                  </span>

                  <button
                    disabled={selectedChapterIndex === novelChapters.length - 1}
                    onClick={() => setSelectedChapterIndex(prev => prev + 1)}
                    className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 hover:text-white uppercase disabled:opacity-30 disabled:hover:text-slate-450 transition"
                  >
                    Chương Sau <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
