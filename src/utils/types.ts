export interface BlueprintItem {
  idOrGuid: string;
  amount: number;
  isTool: boolean;
}

export interface Blueprint {
  inputs: BlueprintItem[];
  outputs: BlueprintItem[];
  typeOrCategory: string;
  skill?: string;
  skillLevel?: number;
  mapIndex?: number;
}

export interface UnturnedItem {
  id: number;
  guid?: string;
  name: string;
  category: 'weapons' | 'ammo' | 'apparel' | 'vehicles' | 'medical' | 'structures' | 'other';
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
  blueprints?: Blueprint[];
}

export const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'weapons', label: '武器' },
  { key: 'ammo', label: '弹药/配件' },
  { key: 'apparel', label: '衣物/背包' },
  { key: 'vehicles', label: '载具' },
  { key: 'medical', label: '医疗/食物' },
  { key: 'structures', label: '建筑/防具' },
];

export const RARITY_COLORS: Record<UnturnedItem['rarity'], { color: string; bg: string }> = {
  Common: { color: '#808080', bg: '#f0f0f0' },
  Uncommon: { color: '#1f8b4c', bg: '#e8f5e9' },
  Rare: { color: '#2062af', bg: '#e3f2fd' },
  Epic: { color: '#a030d0', bg: '#f3e5f5' },
  Legendary: { color: '#e67e22', bg: '#fff3e0' },
  Mythical: { color: '#e74c3c', bg: '#ffebee' },
};
