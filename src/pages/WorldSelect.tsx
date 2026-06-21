import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { WORLDS } from '../data/worlds';
import { World } from '../types';
import { Compass, Globe, Sparkles, BookOpen, Layers, Milestone } from 'lucide-react';

export default function WorldSelect() {
  const navigate = useNavigate();
  const { setWorld, customWorlds } = useStore();

  const handleSelectWorld = (worldId: string) => {
    setWorld(worldId);
    navigate('/character-design');
  };

  const allWorlds: World[] = [
    ...Object.values(WORLDS),
    ...(customWorlds || [])
  ].filter(w => !w.isHidden);

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 animate-fade-in pb-12">
      {/* Dynamic Aesthetic Banner */}
      <div className="relative text-center py-12 md:py-16 rounded-sm overflow-hidden bg-radial from-slate-900 via-slate-950 to-slate-950 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(184,147,84,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.05),transparent_40%)]"></div>
        <div className="relative z-10 space-y-4 max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30 text-[9px] tracking-widest uppercase font-extrabold">
            <Milestone className="w-3.5 h-3.5" /> Bến Khởi Hành Linh Hồn
          </div>
          <h1 className="text-3xl md:text-5xl font-serif italic text-white tracking-wider uppercase">
            Cổng Chuyển Sinh
          </h1>
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto"></div>
          <p className="text-xs md:text-sm text-slate-400 font-serif leading-relaxed">
            Thiết lập tọa độ linh hồn, gieo quẻ thần thông gacha của riêng bạn. Chọn lấy một chân trời giả tưởng để bắt đầu hành trình viết nên truyền thuyết đồng nhân của chính mình.
          </p>
        </div>
      </div>

      {/* World Interactive Cards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" /> Bản Đồ Điểm Đến Hiện Hữu ({allWorlds.length})
          </h2>
          <span className="text-[10px] font-mono text-slate-500 tracking-wider">
            Sẵn sàng kết nối Gemini-3.5-Flash
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allWorlds.map((world) => {
            const isCustom = world.type === 'custom';
            return (
              <div
                key={world.id}
                onClick={() => handleSelectWorld(world.id)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-sm bg-slate-950/45 border border-slate-900 hover:border-emerald-500/50 hover:bg-slate-950/80 transition-all duration-300 hover:-translate-y-1 cursor-pointer p-5 md:p-6 shadow-xl hover:shadow-emerald-500/5 min-h-[220px]"
              >
                {/* Visual Accent Corner Glow */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-radial from-emerald-500/5 to-transparent blur-xl group-hover:from-emerald-500/10 transition-all duration-500 rounded-full"></div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] tracking-widest uppercase font-extrabold text-slate-550 bg-slate-900 border border-slate-850 px-2 py-1 rounded-sm font-mono">
                      #{world.type}
                    </span>
                    {isCustom ? (
                      <span className="text-[8px] tracking-widest uppercase font-extrabold text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-sm border border-amber-500/20 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" /> Bản Cộng Đồng
                      </span>
                    ) : (
                      <span className="text-[8px] tracking-widest uppercase font-extrabold text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-sm border border-emerald-500/20 flex items-center gap-1 font-mono">
                        <Sparkles className="w-2.5 h-2.5" /> Bản Hệ Thống
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg md:text-xl font-serif italic text-white group-hover:text-emerald-400 transition-colors leading-tight mb-2">
                      {world.name}
                    </h3>
                    
                    <p className="text-xs text-slate-400 font-serif leading-relaxed line-clamp-2 md:line-clamp-3">
                      {world.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-900/60 mt-5">
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono tracking-wide">
                    <div className="truncate">Hệ lực lượng: <strong className="text-slate-350 font-serif italic">{world.powerSystem}</strong></div>
                    <div className="truncate">Thế lực thống trị: <strong className="text-slate-300">{world.majorFactions?.length || 0} phe</strong></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest font-mono">
                    <span className="text-slate-600">Đơn vị tệ: <span className="text-emerald-500/90">{world.currencyName}</span></span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                      Tiến Vào Chuyển Sinh &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
