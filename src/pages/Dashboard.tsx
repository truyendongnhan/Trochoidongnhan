import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BookPlus, Edit3, Trash2, User, Sparkles, Coins, ScrollText, ListMusic, PlusCircle, LayoutDashboard, Notebook, Award } from 'lucide-react';
import { getRarityColor } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentWorldId, character, story, chapters, setStoryInfo, deleteChapter, customWorlds } = useStore();
  
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [tempTitle, setTempTitle] = useState(story.title);
  const [tempSummary, setTempSummary] = useState(story.summary);

  if (!currentWorldId || !character) {
    return <Navigate to="/" />;
  }

  const handleSaveStoryInfo = () => {
    setStoryInfo({ title: tempTitle, summary: tempSummary });
    setIsEditingStory(false);
  };

  const totalWordsEstimate = chapters.reduce((acc, c) => acc + (c.content?.split(/\s+/).length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-12">
      
      {/* Authors Quick Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-sm bg-slate-950/40 border border-slate-800 flex items-center gap-3">
          <Notebook className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Số Chương</p>
            <p className="text-sm font-semibold font-mono text-white">{chapters.length} chương</p>
          </div>
        </div>
        <div className="p-4 rounded-sm bg-slate-950/40 border border-slate-800 flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Ước tính Dung lượng</p>
            <p className="text-sm font-semibold font-mono text-white">{totalWordsEstimate.toLocaleString('vi-VN')} từ</p>
          </div>
        </div>
        <div className="p-4 rounded-sm bg-slate-950/40 border border-slate-800 flex items-center gap-3">
          <Coins className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Tiền tệ Nhân Vật</p>
            <p className="text-sm font-semibold text-white truncate">{character.wealth}</p>
          </div>
        </div>
        <div className="p-4 rounded-sm bg-slate-950/40 border border-slate-800 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Cấp bậc Cơ duyên</p>
            <p className={`text-sm font-semibold ${getRarityColor(character.powerRarity)} capitalize truncate`}>
              {character.powerRarity || 'Common'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Left 2/3: Story Info & Chapter Tree */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Story details panel */}
          <div className="bg-slate-950/40 rounded-sm border border-slate-800 p-5 md:p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Ấn Phẩm Thiết Kế</h2>
              </div>
              
              <button 
                onClick={() => setIsEditingStory(!isEditingStory)}
                className="text-slate-400 hover:text-emerald-400 transition text-xs flex items-center gap-1 font-bold"
                title="Sửa thông tin cốt truyện"
              >
                <Edit3 className="w-4 h-4" /> <span className="text-[10px] uppercase font-mono">Hiệu Chỉnh</span>
              </button>
            </div>

            {isEditingStory ? (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-[9px] tracking-widest font-bold uppercase text-slate-500 mb-1">Tên Tiểu Thuyết Đồng Nhân</label>
                  <input 
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-sm px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-serif italic text-base"
                    placeholder="Nhập tên mới..."
                  />
                </div>
                <div>
                  <label className="block text-[9px] tracking-widest font-bold uppercase text-slate-500 mb-1">Tóm Tắt (Mở đầu thế bối)</label>
                  <textarea 
                    value={tempSummary}
                    onChange={(e) => setTempSummary(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-850 rounded-sm px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-serif text-sm"
                    placeholder="Mô tả tóm lược cốt truyện..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setIsEditingStory(false)}
                    className="bg-slate-800 hover:text-white text-slate-300 px-4 py-2 rounded-sm text-[9px] font-bold tracking-widest uppercase transition"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleSaveStoryInfo}
                    className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-sm text-[9px] font-bold tracking-widest uppercase transition"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="text-xl md:text-3xl font-serif italic text-white leading-tight">
                  {story.title || 'Đang Khởi Tạo Bản Thảo...'}
                </h1>
                <p className="text-xs md:text-sm text-slate-400 font-serif leading-relaxed italic border-l-2 border-emerald-500/20 pl-4 py-1">
                  {story.summary || 'Trang giấy trắng chưa ghi chép lại truyền thuyết bối cảnh...'}
                </p>
              </div>
            )}
          </div>

          {/* Chapters Manager */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Danh Mục Chương Viết</h2>
              
              <button 
                onClick={() => navigate(chapters.length > 0 ? `/editor/${chapters[chapters.length - 1].id}` : '/editor/new')}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-sm font-extrabold text-[9px] tracking-widest uppercase transition-all shadow-md shadow-emerald-500/5"
              >
                <BookPlus className="w-3.5 h-3.5" />
                {chapters.length > 0 ? 'Viết tiếp cốt truyện' : 'Khai bút chương 1'}
              </button>
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/30 border border-slate-900 border-dashed rounded-sm">
                <ScrollText className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-bounce" />
                <p className="text-xs text-slate-400 mb-4 font-serif italic">Thảo cương trống rỗng. Hãy để ý tưởng nhảy múa bằng chương đầu tiên.</p>
                <button 
                  onClick={() => navigate('/editor/new')}
                  className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] tracking-widest uppercase transition"
                >
                  Bắt đầu sáng tác ngay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter, index) => (
                  <div 
                    key={chapter.id} 
                    className="bg-slate-950/40 border border-slate-900 hover:border-emerald-500/40 rounded-sm p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-950/60 cursor-pointer"
                    onClick={() => navigate(`/editor/${chapter.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-emerald-500/70 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/5 mr-2">
                        CHƯƠNG {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <h3 className="inline-block text-sm md:text-base font-serif italic text-white hover:text-emerald-400 transition-colors truncate">
                        {chapter.title}
                      </h3>
                      <p className="text-[9px] text-slate-500 font-mono tracking-wider mt-1.5 uppercase">
                        SÁNG TẠO: {new Date(chapter.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link 
                        to={`/editor/${chapter.id}`}
                        className="p-1.5 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 rounded transition"
                        title="Viết tiếp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(window.confirm('Bạn có chắc chắn muốn xoá chương này?')) {
                            deleteChapter(chapter.id);
                          }
                        }}
                        className="p-1.5 border border-slate-800 hover:border-red-500/55 text-slate-600 hover:text-red-400 rounded transition"
                        title="Xoá bỏ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3: Miniature Character Profile Widget */}
        <div className="space-y-6">
          <div className="bg-slate-950/40 rounded-sm border border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
              <h3 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Chuyển Sinh Thân Bản</h3>
              <Link to="/character" className="text-[9px] text-emerald-400 hover:text-emerald-300 font-extrabold tracking-widest uppercase">
                Chi Tiết &rarr;
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="space-y-3 font-serif">
              <div>
                <p className="text-[8px] font-mono tracking-widest uppercase text-slate-500 font-bold">KÝ DANH:</p>
                <p className="text-base font-bold text-white leading-tight italic">{character.name}</p>
              </div>

              <div>
                <p className="text-[8px] font-mono tracking-widest uppercase text-slate-500 font-bold">THÂN PHẬN KHỞI NGUYÊN:</p>
                <p className={`text-xs font-bold italic truncate ${getRarityColor(character.backgroundRarity)}`}>
                  {character.background}
                </p>
              </div>

              <div>
                <p className="text-[8px] font-mono tracking-widest uppercase text-slate-500 font-bold">THẦN PHÁP CƠ DUYÊN:</p>
                <p className={`text-xs font-bold italic truncate ${getRarityColor(character.powerRarity)}`}>
                  {character.power || 'Phổ thông'}
                </p>
              </div>
            </div>

            {/* Attribute gauges preview */}
            <div className="border-t border-slate-900 pt-4 space-y-3.5">
              <p className="text-[8px] font-mono tracking-widest uppercase text-slate-500 font-bold">BẢN THỂ CHI SỐ:</p>
              <div className="space-y-2">
                {Object.entries(character.stats).slice(0, 4).map(([statName, val]) => {
                  const percent = Math.min(100, (val / 15) * 100);
                  return (
                    <div key={statName} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-450 font-serif italic">{statName}</span>
                        <span className="text-emerald-400 font-mono font-bold">{val}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#a88248] to-emerald-500 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
