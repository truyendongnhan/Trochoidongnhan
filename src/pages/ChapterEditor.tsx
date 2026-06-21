import { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Save, ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';
import { WORLDS } from '../data/worlds';
import { auth } from '../lib/firebase';
import { updateUserKimNgoc } from '../lib/firestoreSync';

export default function ChapterEditor() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { currentWorldId, chapters, addChapter, character, story, customWorlds, currentUserProfile } = useStore();
  
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [startPrompt, setStartPrompt] = useState('Bắt đầu câu chuyện tại điểm xuất phát ngẫu nhiên.');
  
  const isNew = chapterId === 'new';
  const chapter = chapters.find(c => c.id === chapterId);

  // If not new and chapter not found, or world not selected -> redirect
  if (!currentWorldId || (!isNew && !chapter)) {
    return <Navigate to="/dashboard" />;
  }

  const world = WORLDS[currentWorldId] || customWorlds.find(w => w.id === currentWorldId);

  const handleGenerate = async (promptText: string) => {
    if (!character) return;
    setLoading(true);
    try {
      const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyTitle: story.title,
          worldName: world.name,
          character,
          previousChapters: chapters.slice(-3), // send last 3 chapters for context
          prompt: promptText
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi từ server');
      }

      const data = await response.json();
      
      const newChap = {
        id: crypto.randomUUID(),
        title: data.chapterTitle || `Chương ${chapters.length + 1}`,
        content: data.chapterContent || '...',
        choices: data.choices || [],
        createdAt: Date.now(),
      };
      
      addChapter(newChap);
      
      // Reward 50 Kim Ngọc for writing a new chapter
      if (auth.currentUser) {
        updateUserKimNgoc(auth.currentUser.uid, 50, currentUserProfile?.kimNgoc ?? 0)
          .catch(err => console.error("Lỗi khi cộng Kim Ngọc cho chương mới:", err));
      }
      
      navigate(`/editor/${newChap.id}`);
      setCustomInput('');
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi tạo chương mới. Vui lòng kiểm tra lại GEMINI_API_KEY ở Settings.');
    } finally {
      setLoading(false);
    }
  };

  const isLatestChapter = chapters.length > 0 && chapters[chapters.length - 1].id === chapterId;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[85vh] md:min-h-0">
      <div className="flex items-center justify-between mb-4 md:mb-6 px-2 md:px-0">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 md:gap-2 text-[10px] tracking-widest font-bold uppercase text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden md:inline">Trở Về Bàn Làm Việc</span><span className="md:hidden">Trở Về</span>
        </button>
      </div>

      {isNew && chapters.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 p-5 md:p-8 flex flex-col mt-2 md:mt-4 rounded-sm mx-2 md:mx-0">
          <h2 className="text-xl md:text-2xl font-serif italic text-emerald-400 mb-3 md:mb-4 tracking-wider uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 shrink-0" /> Điểm Bắt Đầu
          </h2>
          <p className="text-sm md:text-base text-slate-400 mb-4 md:mb-6 font-serif">Bạn có thể tự định hướng mở đầu cho câu chuyện, hoặc để hệ thống tự động sinh khởi điểm.</p>
          <textarea 
            value={startPrompt}
            onChange={(e) => setStartPrompt(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-300 p-4 focus:outline-none focus:border-emerald-500 mb-4 h-32 rounded-sm font-serif md:text-lg"
            placeholder="Ví dụ: Nhân vật chính tỉnh dậy giữa một trận chiến..."
          />
          <button 
            onClick={() => handleGenerate(startPrompt)}
            disabled={loading}
            className="w-full md:w-auto self-end flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-6 md:px-8 py-4 md:py-3 rounded-sm tracking-widest uppercase text-[10px] font-bold transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Đang Tạo Kịch Bản...' : 'Viết Chương 1'}
          </button>
        </div>
      ) : isNew && chapters.length > 0 ? (
        <div className="bg-slate-800 border-none p-8 flex flex-col items-center justify-center mt-4 h-64">
           {loading ? (
             <div className="text-center">
               <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
               <p className="text-emerald-400 font-serif italic tracking-widest uppercase">Hệ thống đang suy diễn thế giới...</p>
             </div>
           ) : (
            <p className="text-slate-400">Vui lòng quay lại chương mới nhất để tiếp tục.</p>
           )}
        </div>
      ) : chapter ? (
        <>
          {/* Immersive Novel Book Title Banner */}
          <div className="bg-slate-950/60 border border-slate-800 p-6 md:p-8 flex flex-col mt-2 md:mt-4 rounded-t-sm mx-2 md:mx-0 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-radial from-emerald-500/5 to-transparent blur-2xl pointer-events-none"></div>
            <p className="text-[8px] font-mono tracking-[0.3em] text-emerald-500 font-bold uppercase mb-2">Đấu Đồng Nhân Bản Thảo - Đang Phát Trình</p>
            <h1 className="w-full bg-transparent text-2xl md:text-4xl font-serif italic tracking-wide text-white font-bold leading-tight">
              {chapter.title}
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-auto mt-4"></div>
          </div>
          
          {/* Classical Book Reading Canvas */}
          <div className="flex-1 bg-slate-950/20 border border-t-0 border-slate-800 flex flex-col p-5 md:p-10 rounded-b-sm mx-2 md:mx-0 mb-6 shadow-2xl">
            <div 
              className="text-base md:text-lg font-serif leading-loose text-slate-200 space-y-6 mb-12 md:mb-16 max-w-3xl mx-auto break-words select-text px-2 md:px-4 text-justify"
              dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n\n/g, '<br/><br/>') }}
            />

            {isLatestChapter && (
              <div className="mt-6 md:mt-12 border-t border-slate-900 pt-8 max-w-3xl w-full mx-auto">
                <h3 className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase mb-5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> Thiên Kiếp Quyế Định (Bình Chọn Tiếp Bước)
                </h3>
                
                {loading ? (
                  <div className="text-center py-8 bg-slate-950/30 border border-slate-900 rounded p-6">
                    <Loader2 className="w-8 h-8 text-emerald-555 animate-spin mx-auto mb-4" />
                    <p className="text-[10px] text-emerald-400 font-serif italic tracking-widest uppercase">Mệnh Vận Cơ đang suy luận bối cảnh tương lai...</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 md:space-y-4">
                    {chapter.choices?.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleGenerate(choice)}
                        className="w-full text-left p-4 bg-slate-950/50 hover:bg-slate-900/80 border border-slate-900 hover:border-emerald-500/50 rounded-sm text-slate-350 hover:text-white transition-all duration-300 group flex gap-4 items-start shadow-sm"
                      >
                        <span className="text-emerald-500 font-mono text-xs font-bold mt-1 shrink-0 bg-emerald-500/10 min-w-6 h-6 rounded-full flex items-center justify-center border border-emerald-500/20">
                          {idx + 1}
                        </span>
                        <span className="font-serif group-hover:text-emerald-300 text-sm md:text-base leading-relaxed pt-0.5">{choice}</span>
                      </button>
                    ))}

                    {/* Custom Action Entry Form */}
                    <div className="flex flex-col sm:flex-row gap-2.5 mt-6 pt-4 border-t border-slate-900/60">
                      <input 
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Có chính kiến khác? Tự gõ quyết tâm hành động của nhân vật..."
                        className="flex-1 bg-slate-950/80 border border-slate-850 rounded-sm px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 font-serif text-sm md:text-base placeholder:text-slate-600 focus:bg-slate-950 transition-all shadow-inner"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInput.trim()) {
                            handleGenerate(customInput);
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (customInput.trim()) handleGenerate(customInput);
                        }}
                        disabled={!customInput.trim()}
                        className="bg-emerald-600 hover:bg-emerald-500 text-black px-7 py-3.5 rounded-sm transition font-bold text-xs uppercase tracking-wider disabled:opacity-30 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 shadow-lg"
                      >
                        <span>Hành Động</span>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
