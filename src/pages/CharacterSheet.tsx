import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { WORLDS } from '../data/worlds';
import { Shield, Coins, Sword, Backpack, ScrollText, Sparkles, UserCheck, Flame, Compass } from 'lucide-react';
import { getRarityColor } from '../types';

export default function CharacterSheet() {
  const { currentWorldId, character, updateCharacterStats, customWorlds } = useStore();

  if (!currentWorldId || !character) {
    return <Navigate to="/" />;
  }

  const world = WORLDS[currentWorldId] || customWorlds.find(w => w.id === currentWorldId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-12">
      {/* Cinematic Identity Header Card */}
      <div className="relative rounded-sm overflow-hidden bg-slate-950/60 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-emerald-500/10 to-transparent blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 rounded-sm text-[8px] tracking-widest font-mono font-bold text-emerald-400 uppercase mb-3">
              <UserCheck className="w-3 h-3" /> Phiếu trạng thái chuyển sinh
            </div>
            
            <h1 className="text-3xl md:text-5xl font-serif italic text-white tracking-wide mb-3 flex items-baseline gap-3">
              {character.name}
              <span className="text-sm text-slate-450 not-italic font-sans font-medium">({character.gender || 'Nam'})</span>
            </h1>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] tracking-widest uppercase font-bold text-slate-400">
              <span>Huyết mạch: <span className="text-slate-200">{world.name}</span></span>
              <span className="hidden sm:inline border-r border-slate-800 h-3 py-1"></span>
              <span>Thần phận: <strong className={`${getRarityColor(character.backgroundRarity)} font-serif italic font-bold`}>{character.background}</strong></span>
              <span className="hidden sm:inline border-r border-slate-800 h-3 py-1"></span>
              <span>Cơ duyên: <strong className={`${getRarityColor(character.powerRarity)} font-serif italic font-bold`}>{character.power || 'Cơ duyên bình phàm'}</strong></span>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col items-start md:items-end">
            <div className="inline-flex items-center gap-2.5 bg-emerald-500/10 text-emerald-400 px-5 py-3 rounded-sm border border-emerald-500/30 w-full md:w-auto justify-center shadow-lg">
              <Coins className="w-4 h-4 text-emerald-500 animate-pulse" />
              <div className="text-left">
                <p className="text-[8px] uppercase tracking-widest text-[#a88248] font-bold">Số dư hiện kim</p>
                <p className="font-bold text-lg md:text-xl leading-none">
                  {character.wealth} <span className="text-xs font-mono font-medium text-slate-400 uppercase">{world.currencyName}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        
        {/* Left Column: Biography & RPG Stats */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Biography Card */}
          {character.biography && (
            <div className="bg-slate-950/40 rounded-sm border border-slate-800 p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <ScrollText className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Chân Dung & Thiên Mệnh Chi Thư</h2>
              </div>
              <div className="font-serif text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap italic pl-4 border-l-2 border-emerald-500/30">
                {character.biography}
              </div>
            </div>
          )}

          {/* Stats Progress & Growth Panel */}
          <div className="bg-slate-950/40 rounded-sm border border-slate-800 p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Chỉ Số Bản Thể</h2>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[Thiết lập hệ thống tác giả]</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {Object.entries(character.stats).map(([statName, value]) => {
                const percentage = Math.min(100, (value / 25) * 100); // assume max is 25 for gauge
                return (
                  <div key={statName} className="group space-y-2 p-3 bg-slate-950/60 border border-slate-900 rounded hover:border-slate-800 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-350">{statName}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-emerald-400 font-mono text-sm font-bold">{value}</span>
                        <button 
                          onClick={() => updateCharacterStats({ [statName]: value + 1 })}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-black font-extrabold text-xs flex items-center justify-center transition-all shadow-inner"
                          title="Tăng thuộc tính (Bàn tay tác giả)"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* Linear gauge */}
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#a88248] to-[#e2cfae] rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Skills & Gear Inventory */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Skills Panel */}
          <div className="bg-slate-950/40 rounded-sm border border-slate-800 p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Bí Kíp & Nhương Thuật</h2>
              </div>
              <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-3 min-h-[160px] max-h-[350px] overflow-y-auto pr-1">
              {character.skills.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs italic py-10 font-serif">
                  Ngộ tính chưa thông, chưa thọc sâu lĩnh ngộ thần thông bí pháp.
                </div>
              ) : (
                character.skills.map((skill, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-3 rounded border border-slate-900 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-serif italic font-bold text-emerald-400 text-xs">{skill.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                        Hỏa候 Lv.{skill.level}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 font-serif leading-relaxed italic">{skill.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inventory Panel */}
          <div className="bg-slate-950/40 rounded-sm border border-slate-800 p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
              <Backpack className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-extrabold tracking-widest uppercase text-slate-400">Hành Trang Linh Túi</h2>
            </div>

            <div className="min-h-[120px] max-h-[220px] overflow-y-auto pr-1">
              {character.inventory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic py-8 font-serif">
                  <Compass className="w-5 h-5 mb-2 text-slate-700 animate-spin" />
                  Mạng túi không chứa thiên địa dị bảo.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {character.inventory.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/85 p-2.5 rounded border border-slate-900 flex flex-col justify-between text-center min-h-16 hover:border-emerald-500/30 transition">
                      <p className="font-serif font-bold text-slate-300 text-[10.5px] line-clamp-1 leading-tight">{item.name}</p>
                      <span className="text-[9px] text-[#a88248] font-mono mt-1">SL: <strong className="text-white">{item.quantity}</strong></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
