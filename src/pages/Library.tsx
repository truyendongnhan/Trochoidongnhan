import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { WORLDS } from '../data/worlds';
import { BookOpen, Compass, Trash2, Globe, Sparkles, X } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const { 
    projects, 
    setActiveProject, 
    deleteProject, 
    customWorlds, 
    publishedNovels, 
    publishProjectAsNovel 
  } = useStore();

  // Modal management
  const [publishingProject, setPublishingProject] = useState<any>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleOpenProject = (id: string) => {
    setActiveProject(id);
    navigate('/dashboard');
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingProject) return;

    setIsSubmitting(true);
    setMessage('');
    
    try {
      const success = await publishProjectAsNovel(publishingProject.id, customTitle, customSummary);
      if (success) {
        setMessage('Đăng ký phát hành thành công! Tác phẩm đang chờ duyệt tại Bảng Quản Trị.');
        setTimeout(() => {
          setPublishingProject(null);
          setMessage('');
        }, 3000);
      } else {
        setMessage('Thất bại: Có lỗi xảy ra trong quá trình thiết lập.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Lỗi mạng hoặc quyền đồng bộ hóa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header section with refined font pairing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif italic text-white mb-2 tracking-wide">Kho Tàng Thế Giới</h1>
          <p className="text-[10px] font-extrabold tracking-widest text-[#a88248] uppercase">Kênh Phát Hành & Cương Lĩnh Sáng Tạo Đồng Nhân</p>
        </div>
        
        <button 
          onClick={() => navigate('/world')}
          className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-3.5 rounded-sm tracking-wider uppercase text-[10px] font-bold transition flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95"
        >
          <Compass className="w-4 h-4" /> Khởi Tạo Thế Giới
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/20 border border-slate-950 border-dashed rounded-sm">
          <BookOpen className="w-12 h-12 text-[#a88248] mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400 mb-4 font-serif italic text-sm">Cát bụi thời gian phủ bóng, chưa có bản đồng nhân tiên tri nào tồn tại.</p>
          <button 
            onClick={() => navigate('/world')}
            className="text-emerald-400 hover:text-emerald-300 font-extrabold text-[10px] tracking-widest uppercase transition"
          >
            Khai Thiên Tịch Địa Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects.map(project => {
            const world = WORLDS[project.worldId] || customWorlds.find(w => w.id === project.worldId);
            const publishedInfo = (publishedNovels || []).find(n => n.id === project.id);
             
            return (
              <div 
                key={project.id}
                className="bg-slate-950/60 border border-slate-900 hover:border-emerald-500/40 rounded-sm p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between group h-[270px] hover:-translate-y-1 shadow-lg hover:shadow-2xl"
                onClick={() => handleOpenProject(project.id)}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[8px] tracking-widest uppercase font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      {world?.name || "Bản Thảo Hoang Sơ"}
                    </span>

                    {publishedInfo && (
                      <span className={`text-[8.5px] tracking-widest uppercase font-bold px-2 py-0.5 rounded font-mono border ${
                        publishedInfo.status === 'approved' 
                          ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/30' 
                          : publishedInfo.status === 'rejected'
                          ? 'text-red-400 bg-red-450/5 border-red-500/30'
                          : 'text-amber-400 bg-amber-500/5 border-amber-500/30 font-semibold'
                      }`}>
                        {publishedInfo.status === 'approved' 
                          ? 'ĐÃ DUYỆT' 
                          : publishedInfo.status === 'rejected'
                          ? 'BỊ TỪ CHỐI'
                          : 'ĐANG XÉT'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-serif italic text-white mb-2 line-clamp-1 leading-tight group-hover:text-emerald-400 transition-colors">
                    {project.story.title || 'Vô danh dị bản'}
                  </h3>
                  
                  <p className="text-xs text-slate-450 font-serif mb-2">
                    Ký tự chuyển sinh: <span className="font-bold text-slate-300 font-sans">{project.character.name}</span>
                  </p>
                  
                  <p className="text-[11px] text-slate-500 font-serif leading-relaxed line-clamp-3 italic md:text-xs">
                    {project.story.summary || "Bản nháp ban đầu chưa hoàn chỉnh văn án..."}
                  </p>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-900/80 pt-4 mt-4 shrink-0 font-mono text-[9.5px]">
                  <span className="text-slate-500 uppercase tracking-widest font-semibold">
                    {project.chapters?.length || 0} chương dã viết
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPublishingProject(project);
                        setCustomTitle(project.story.title || '');
                        setCustomSummary(project.story.summary || '');
                        setMessage('');
                      }}
                      className="text-slate-400 hover:text-emerald-400 p-2 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-all"
                      title="Phát hành lên Chuyển Sinh Online"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Bạn có chắc chắn muốn xóa tác phẩm này vĩnh viễn?')) {
                          deleteProject(project.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-400 p-2 hover:bg-slate-900 rounded border border-transparent hover:border-slate-800 transition-all font-semibold"
                      title="Hủy bỏ vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Novel Publishing Modal */}
      {publishingProject && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-sm max-w-xl w-full p-6 md:p-8 shadow-2xl relative space-y-6">
            
            <button 
              onClick={() => setPublishingProject(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[8px] tracking-[0.2em] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/15 inline-block font-mono">
                Cương lĩnh ấn phẩm
              </span>
              <h2 className="text-xl md:text-2xl font-serif italic text-white tracking-wide">
                Xem Xét Xuất Bản Đồng Nhân
              </h2>
              <p className="text-xs text-slate-400 font-serif leading-relaxed">
                Đăng tả tác trình thế giới lên Thư viện của các độc giả toàn cầu để cùng ngâm cứu, tương tương với việc đồng hóa dòng lịch sử.
              </p>
            </div>

            {message ? (
              <div className="p-5 bg-slate-900/50 rounded-sm border border-emerald-500/20 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-xs text-slate-200 font-serif leading-relaxed">{message}</p>
              </div>
            ) : (
              <form onSubmit={handlePublishSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-450 block font-mono">Bảng Tên Vĩnh Cổ</label>
                  <input 
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-sm px-4 py-3 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors font-serif italic focus:bg-slate-950/60"
                    placeholder="Nhập tên chính thức cho tiểu thuyết..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-slate-450 block font-mono">Chân Dung Lược Sử (Bản Văn Án)</label>
                  <textarea 
                    rows={4}
                    required
                    value={customSummary}
                    onChange={(e) => setCustomSummary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-sm px-4 py-3 text-xs leading-relaxed text-slate-300 placeholder:text-slate-705 focus:outline-none focus:border-emerald-500 transition-colors font-serif whitespace-pre-wrap"
                    placeholder="Viết văn án kích thích trí tò mò..."
                  />
                </div>

                <div className="bg-slate-900/40 p-4 rounded-sm border border-slate-900 space-y-2 font-serif text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Mệnh danh nhân gian (Nhân vật gốc):</span>
                    <strong className="text-slate-200 font-sans">{publishingProject.character.name}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Quyết chiến diễn viên (Số chương tương ứng):</span>
                    <strong className="text-emerald-400 font-mono text-xs">{publishingProject.chapters?.length || 0} chương</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setPublishingProject(null)}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-slate-900 hover:text-white hover:bg-slate-800 text-slate-450 rounded-sm tracking-wider uppercase text-[10px] font-bold transition"
                  >
                    Bãi bỏ
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || (publishingProject.chapters?.length || 0) === 0}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 disabled:text-slate-600 text-black font-extrabold rounded-sm transition tracking-[0.1em] uppercase text-[10px] flex items-center gap-1.5 shadow-lg shadow-emerald-500/5 cursor-pointer"
                  >
                    {isSubmitting ? 'Đồng bộ hóa...' : 'Duyệt Đăng Ấn Bản'}
                  </button>
                </div>
                {(publishingProject.chapters?.length || 0) === 0 && (
                  <p className="text-[10px] text-red-500 text-center font-serif mt-2">
                    * Thể thức bất hợp lệ: Hãy tạo tối thiểu 1 chương trước khi gieo duyệt dòng truyện.
                  </p>
                )}
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
