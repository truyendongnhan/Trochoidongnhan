export type WorldType = 'anime' | 'tu_tien' | 'magic' | 'murim';

export interface StatInfo {
  name: string;
  value: number;
  max?: number;
}

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface RarityItem {
  name: string;
  rarity: Rarity;
  description?: string;
}

export interface World {
  id: string;
  name: string;
  type: WorldType | string;
  description: string;
  settingDetails?: string;
  majorFactions?: string[];
  image: string;
  powerSystem: string;
  currencyName: string;
  baseStats: string[];
  backgrounds: RarityItem[];
  powers: RarityItem[];
  isHidden?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

export const getRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'Legendary': return 'text-orange-400';
    case 'Epic': return 'text-purple-400';
    case 'Rare': return 'text-blue-400';
    case 'Common': return 'text-slate-300';
    default: return 'text-white';
  }
};

export interface Character {
  name: string;
  gender: string;
  background: string;
  backgroundRarity?: Rarity;
  power: string;
  powerRarity?: Rarity;
  biography: string;
  stats: Record<string, number>;
  skills: Skill[];
  inventory: Item[];
  wealth: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  choices?: string[];
  createdAt: number;
}

export interface Story {
  title: string;
  summary: string;
  genres: string[];
  writingStyle: string;
  storyDirections: string[];
}

export interface Project {
  id: string;
  worldId: string;
  character: Character;
  story: Story;
  chapters: Chapter[];
  updatedAt: number;
}

export interface PublishedNovel {
  id: string;
  projectId: string;
  userId: string;
  userEmail: string;
  worldId: string;
  title: string;
  summary: string;
  characterName: string;
  powerSystem: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

