import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { WORLDS } from '../data/worlds';
import { Dices, Save, Sparkles, Loader2, Info } from 'lucide-react';
import { RarityItem, Story, Skill, getRarityColor } from '../types';

const GENRES = [
  "Hành động", "Phiêu lưu", "Tình cảm", "Trinh thám", "Kinh dị", 
  "Hài hước", "Hệ thống", "Hắc ám", "Học đường", "Huyền huyễn", 
  "Tiên hiệp", "Võng du", "Khoa học viễn tưởng", "Xuyên không", 
  "Trọng sinh", "Mạt thế", "Vô địch lưu", "Điền viên", "Kỳ ảo"
];
const STYLES = [
  "Hài hước châm biếm", "Nghiêm túc", "Đậm chất thơ", 
  "Miêu tả chi tiết", "Súc tích mạnh mẽ", "Nhịp độ nhanh", "Kể chuyện chậm rãi"
];
const DIRECTIONS = [
  "Kịch tính", "Sảng văn (main bá đạo)", "Trí tuệ / Đấu trí", 
  "Nhẹ nhàng (Slice of life)", "Đâm chém máu me", "Giấu tài (Cẩu đạo)", 
  "Xây dựng cơ đồ", "Đơn độc", "Quần tượng (Nhiều góc nhìn)"
];

const NAMES = ["Khải Minh", "Tạp Mộc", "Linh Nhi", "Vô Danh", "Kael", "Arthur", "Dương Quá", "Dạ Xoa"];

const rollRarityItem = (items: RarityItem[]) => {
  const roll = Math.random();
  let selectedRarity = 'Common';
  if (roll > 0.98) selectedRarity = 'Legendary';
  else if (roll > 0.90) selectedRarity = 'Epic';
  else if (roll > 0.70) selectedRarity = 'Rare';
  
  let candidates = items.filter(i => i.rarity === selectedRarity);
  if (candidates.length === 0) {
    candidates = items;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export default function CharacterDesign() {
  const navigate = useNavigate();
  const { currentWorldId, createProject, customWorlds } = useStore();
  
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [customGender, setCustomGender] = useState('');
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [writingStyle, setWritingStyle] = useState(STYLES[0]);
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  
  const [background, setBackground] = useState<RarityItem | null>(null);
  const [power, setPower] = useState<RarityItem | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBio, setAiBio] = useState('');
  const [aiStoryTitle, setAiStoryTitle] = useState('');
  const [aiStorySummary, setAiStorySummary] = useState('');
  const [aiSkills, setAiSkills] = useState<Skill[]>([]);

  const [showRarityInfo, setShowRarityInfo] = useState(false);

  // Handle world undefined
  if (!currentWorldId) {
    return <Navigate to="/world" />;
  }

  const world = WORLDS[currentWorldId] || customWorlds.find(w => w.id === currentWorldId);

  const handleRandomName = () => {
    setName(NAMES[Math.floor(Math.random() * NAMES.length)]);
  };

  const handleToggleGenre = (g: string) => {
    if (selectedGenres.includes(g)) {
      setSelectedGenres(selectedGenres.filter(x => x !== g));
    } else {
      setSelectedGenres([...selectedGenres, g]);
    }
  };

  const handleToggleDirection = (d: string) => {
    if (selectedDirections.includes(d)) {
      setSelectedDirections(selectedDirections.filter(x => x !== d));
    } else {
      if (selectedDirections.length < 2) {
        setSelectedDirections([...selectedDirections, d]);
      }
    }
  };

  const randomizeAllAssets = () => {
    const newStats: Record<string, number> = {};
    world.baseStats.forEach(stat => {
      newStats[stat] = Math.floor(Math.random() * 10) + 1;
    });
    setStats(newStats);
    
    setBackground(rollRarityItem(world.backgrounds));
    setPower(rollRarityItem(world.powers));
    
    // reset AI stuff if re-rolling everything
    setAiBio('');
    setAiStoryTitle('');
    setAiStorySummary('');
    setAiSkills([]);
  };

  useEffect(() => {
    if (currentWorldId) {
      randomizeAllAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorldId]);

  const generateAIBackstory = async () => {
    if (!name.trim()) return alert("Vui lòng nhập tên hoặc random tên trước!");
    if (selectedGenres.length === 0) return alert("Vui lòng chọn ít nhất 1 thể loại!");
    if (selectedDirections.length === 0) return alert("Vui lòng chọn ít nhất 1 hướng đi!");
    if (!background || !power) return alert("Vui lòng random Thân phận và Sức mạnh trước!");

    setAiLoading(true);
    try {
      const actualGender = gender === 'Khác' ? customGender : gender;
      const res = await fetch('/api/generate-character-bio-and-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldName: world.name,
          characterName: name,
          gender: actualGender,
          background: background?.name || '',
          power: power?.name || '',
          genres: selectedGenres,
          writingStyle,
          storyDirections: selectedDirections
        })
      });
      
      if (!res.ok) throw new Error("Chưa thêm GEMINI_API_KEY hoặc lỗi API");
      
      const data = await res.json();
      setAiBio(data.biography);
      setAiStoryTitle(data.storyTitle);
      setAiStorySummary(data.storySummary);
      setAiSkills(data.startingSkills || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Có lỗi xảy ra khi tạo tiểu sử.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!aiBio || !aiStoryTitle) {
      alert("Vui lòng yêu cầu AI sinh Tiểu Sử & Tên Truyện trước khi lưu!");
      return;
    }
    
    const actualGender = gender === 'Khác' ? customGender : gender;

    const character = {
      name,
      gender: actualGender,
      background: background?.name || '',
      backgroundRarity: background?.rarity,
      power: power?.name || '',
      powerRarity: power?.rarity,
      biography: aiBio,
      stats,
      skills: aiSkills,
      inventory: [],
      wealth: 100,
    };
    
    const story: Story = {
      title: aiStoryTitle,
      summary: aiStorySummary,
      genres: selectedGenres,
      writingStyle,
      storyDirections: selectedDirections
    };
    
    createProject(currentWorldId, character, story);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-800 rounded-sm border border-slate-700 p-6 md:p-8 space-y-8">
      <div className="text-center border-b border-slate-700 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-serif italic text-emerald-400 mb-2 tracking-wider uppercase">Chuẩn Bị Nhập Vai</h1>
        <p className="text-[10px] tracking-widest uppercase text-slate-400 font-bold">Thế giới điểm đến: <span className="text-emerald-400">{world.name}</span></p>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <section className="bg-slate-900/50 p-4 border border-slate-700 rounded-sm">
          <div className="mb-6 pb-4 border-b border-slate-700/50">
            <h2 className="text-sm tracking-widest uppercase text-emerald-500 font-bold mb-3">Tác Phẩm Gốc</h2>
            <div className="bg-slate-800 p-4 rounded border border-slate-700 space-y-4">
              <div>
                <h3 className="text-xl font-serif italic text-emerald-400">{world.name}</h3>
                <p className="text-sm text-slate-300 mt-1">{world.description}</p>
              </div>
              
              {world.settingDetails && (
                <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-500 mb-1">Bối Cảnh Chi Tiết</p>
                  <p className="text-sm text-slate-400 font-serif leading-relaxed">{world.settingDetails}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-500 mb-1">Hệ thống sức mạnh</p>
                  <p className="text-sm text-emerald-300 font-bold">{world.powerSystem}</p>
                </div>
                <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-500 mb-1">Đơn vị tiền tệ</p>
                  <p className="text-sm text-emerald-300 font-bold">{world.currencyName}</p>
                </div>
              </div>
              
              {world.majorFactions && world.majorFactions.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-500 mb-2">Các Thế Lực Chính</p>
                  <div className="flex flex-wrap gap-2">
                    {world.majorFactions.map((faction, i) => (
                      <span key={i} className="text-xs bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-300">
                        {faction}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-sm tracking-widest uppercase text-emerald-500 font-bold mb-4">1. Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Tên Nhân Vật</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Nhập tên nhân vật..."
                />
                <button 
                  onClick={handleRandomName}
                  className="bg-slate-700 hover:bg-emerald-600 px-3 py-2 rounded-sm text-xs font-bold transition"
                >
                  <Dices className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Giới Tính</label>
              <div className="flex items-center gap-4 h-10">
                {['Nam', 'Nữ', 'Khác'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                    <input 
                      type="radio" 
                      name="gender" 
                      checked={gender === g}
                      onChange={() => setGender(g)}
                      className="accent-emerald-500"
                    />
                    {g}
                  </label>
                ))}
              </div>
              {gender === 'Khác' && (
                <input
                  type="text"
                  value={customGender}
                  onChange={(e) => setCustomGender(e.target.value)}
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Nhập giới tính của bạn..."
                />
              )}
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="bg-slate-900/50 p-4 border border-slate-700 rounded-sm">
          <h2 className="text-sm tracking-widest uppercase text-emerald-500 font-bold mb-4">2. Định hướng phong cách</h2>
          
          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Thể loại</label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => handleToggleGenre(g)}
                  className={`text-xs px-3 py-2 rounded-sm transition ${selectedGenres.includes(g) ? 'bg-emerald-600 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Hướng đi (Tối đa 2)</label>
            <div className="flex flex-wrap gap-2">
              {DIRECTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => handleToggleDirection(d)}
                  className={`text-xs px-3 py-2 rounded-sm transition ${selectedDirections.includes(d) ? 'bg-emerald-600 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Hành văn</label>
            <select
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
            >
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </section>

        {/* Step 3 */}
        <section className="bg-slate-900/50 p-5 md:p-6 border border-slate-700 rounded-sm relative space-y-6">
           <div className="flex justify-between items-center mb-1 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-extrabold tracking-widest uppercase text-emerald-400">3. Vòng quay số phận (Gacha)</h2>
              <button 
                onClick={() => setShowRarityInfo(!showRarityInfo)}
                className="text-slate-400 hover:text-emerald-400 transition"
                title="Xem tỉ lệ ngẫu nhiên"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={randomizeAllAssets}
              className="flex items-center gap-1.5 text-[9px] bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 hover:text-black px-3.5 py-1.5 rounded-sm text-slate-300 transition-all font-extrabold tracking-wider uppercase cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" /> Thử Vận May Mới
            </button>
          </div>

          {showRarityInfo && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm text-xs text-slate-300 space-y-2 animate-fade-in shadow-inner">
              <p className="font-extrabold text-emerald-400 uppercase tracking-wider mb-2 border-b border-slate-800/80 pb-2">Xác Suất Thiên Định</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                <ul className="space-y-1">
                  <li><span className="text-slate-450">Common (Phổ thông):</span> <span className="text-slate-300 font-bold">70%</span></li>
                  <li><span className="text-blue-500">Rare (Hiển hách):</span> <span className="text-blue-400 font-bold">20%</span></li>
                  <li><span className="text-purple-500">Epic (Kỳ ngộ):</span> <span className="text-purple-400 font-bold">8%</span></li>
                  <li><span className="text-amber-500">Legendary (Thiên kiêu):</span> <span className="text-amber-400 font-bold">2%</span></li>
                </ul>
                <div className="text-[10px] space-y-1 text-slate-500 leading-relaxed">
                  <p>Hệ thống tự động quy đổi dựa trên bối cảnh hiện tại của nguyên tác để gieo quẻ thân phận ban đầu phù hợp nhất.</p>
                </div>
              </div>
            </div>
          )}
           
          {/* Detailed Rarity Cards with custom borders & backgrounds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Background Card */}
            <div className={`p-4 rounded-sm bg-slate-950/60 border ${
              background?.rarity === 'Legendary' ? 'border-orange-500/30 shadow-lg shadow-orange-500/5' :
              background?.rarity === 'Epic' ? 'border-purple-500/30' :
              background?.rarity === 'Rare' ? 'border-blue-500/30' : 'border-slate-800'
            } transition-all duration-300 flex flex-col justify-between h-28`}>
              <div>
                <p className="text-[9px] tracking-widest font-extrabold uppercase text-slate-500">Thần Phận Sơ Thủy</p>
                <h4 className={`text-base font-serif italic font-bold mt-1.5 uppercase tracking-wide leading-tight ${getRarityColor(background?.rarity)}`}>
                  {background?.name || 'Vô Danh Tiểu Tốt'}
                </h4>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono border-t border-slate-900 pt-2 text-slate-500">
                <span>Rarity: <strong className={getRarityColor(background?.rarity)}>{background?.rarity || 'Common'}</strong></span>
                <span className="text-emerald-500/60 font-semibold">[Gacha Approved]</span>
              </div>
            </div>

            {/* Power Card */}
            <div className={`p-4 rounded-sm bg-slate-950/60 border ${
              power?.rarity === 'Legendary' ? 'border-orange-500/30 shadow-lg shadow-orange-500/5' :
              power?.rarity === 'Epic' ? 'border-purple-500/30' :
              power?.rarity === 'Rare' ? 'border-blue-500/30' : 'border-slate-800'
            } transition-all duration-300 flex flex-col justify-between h-28`}>
              <div>
                <p className="text-[9px] tracking-widest font-extrabold uppercase text-slate-500">Cơ Duyên Bản Mệnh</p>
                <h4 className={`text-base font-serif italic font-bold mt-1.5 uppercase tracking-wide leading-tight ${getRarityColor(power?.rarity)}`}>
                  {power?.name || 'Không có dị bảo'}
                </h4>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono border-t border-slate-900 pt-2 text-slate-500">
                <span>Rarity: <strong className={getRarityColor(power?.rarity)}>{power?.rarity || 'Common'}</strong></span>
                <span className="text-emerald-500/60 font-semibold">[Gacha Approved]</span>
              </div>
            </div>
          </div>

          {/* Stats Bar Panel - BEAUTIFUL NEW RPG ADDITION */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-sm space-y-3">
              <p className="text-[9px] tracking-widest font-extrabold uppercase text-slate-400">Chỉ Số Thiên Phú Ban Đầu</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {Object.entries(stats).map(([statName, val]) => {
                  const numValue = Number(val) || 0;
                  const pct = Math.min(100, Math.max(10, (numValue / 10) * 100));
                  return (
                    <div key={statName} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-serif italic font-medium">{statName}</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">{numValue}/10</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Step 4 */}
        <section className="bg-emerald-950/5 p-5 md:p-6 border border-emerald-500/20 rounded-sm space-y-4 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-emerald-500/20 pb-4">
            <h2 className="text-sm tracking-widest uppercase text-emerald-400 font-bold">4. Hoàn Thiện Nhân Vật</h2>
            <button 
              onClick={generateAIBackstory}
              disabled={aiLoading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 rounded-sm text-[10px] font-bold tracking-widest uppercase transition disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? "Đang Sinh..." : "Triệu Hồi AI"}
            </button>
          </div>

          <div className="space-y-4">
            {aiStoryTitle && (
               <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Tên Tác Phẩm AI Gợi Ý:</p>
                  <input
                    type="text"
                    value={aiStoryTitle}
                    onChange={(e) => setAiStoryTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-emerald-400 font-serif italic focus:outline-none focus:border-emerald-500 transition-colors text-lg"
                  />
               </div>
            )}
             {aiBio && (
               <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Tiểu Sử & Bối Cảnh:</p>
                  <div className="w-full min-h-32 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-slate-300 font-serif leading-relaxed whitespace-pre-wrap">
                    {aiBio}
                  </div>
               </div>
            )}
            {aiStorySummary && (
               <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-1">Tóm Tắt Truyện:</p>
                  <div className="w-full min-h-24 bg-slate-900 border border-slate-700 rounded-sm px-3 py-2 text-slate-300 font-serif leading-relaxed whitespace-pre-wrap">
                    {aiStorySummary}
                  </div>
               </div>
            )}
            
            {aiSkills && aiSkills.length > 0 && (
               <div>
                  <p className="text-[10px] tracking-widest font-bold uppercase text-slate-400 mb-2">Kỹ Năng Theo Cơ Duyên:</p>
                  <div className="space-y-2">
                    {aiSkills.map((skill, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-700 p-3 rounded-sm flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-300 font-bold text-sm uppercase">{skill.name}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">Level {skill.level}</span>
                        </div>
                        <span className="text-xs text-slate-400 italic font-serif">{skill.description}</span>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        </section>

        <button 
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-white text-slate-900 rounded-sm px-4 py-4 font-bold tracking-widest uppercase text-[10px] transition-colors mt-8 shadow-lg shadow-emerald-500/10"
        >
          <Save className="w-5 h-5" />
          Phủ Dấu Ấn Thời Gian & Bắt Đầu Hành Trình
        </button>
      </div>
    </div>
  );
}

