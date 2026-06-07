export interface UnturnedItem {
  id: number;
  name: string;
  category: 'weapons' | 'ammo' | 'apparel' | 'vehicles' | 'medical' | 'structures' | 'other';
  description: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
  spawnCommand: string;
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

export const MOCK_ITEMS: UnturnedItem[] = [
  // Weapons
  {
    id: 363,
    name: "Maplestrike (枫叶突击步枪)",
    category: "weapons",
    description: "加拿大产的突击步枪，以其极高的高射速、稳定性以及高度的可定制性而闻名，使用军用弹匣。",
    rarity: "Epic",
    spawnCommand: "@give @p/363/1"
  },
  {
    id: 18,
    name: "Timberwolf (森林狼狙击枪)",
    category: "weapons",
    description: "威力巨大的重型栓动狙击步枪，能在超远距离一击毙命，使用森林狼弹匣。",
    rarity: "Legendary",
    spawnCommand: "@give @p/18/1"
  },
  {
    id: 297,
    name: "Grizzly (灰熊狙击枪)",
    category: "weapons",
    description: "半自动反器材步枪，能够摧毁载具和建筑，威力恐怖，使用灰熊弹匣。",
    rarity: "Legendary",
    spawnCommand: "@give @p/297/1"
  },
  {
    id: 122,
    name: "Zubeknakov (尤贝克纳科夫步枪)",
    category: "weapons",
    description: "经典的游骑兵系列突击步枪，耐久度极高，后坐力较大但威力可观，使用游骑兵弹匣。",
    rarity: "Rare",
    spawnCommand: "@give @p/122/1"
  },
  {
    id: 116,
    name: "Honeybadger (蜜獾微声冲锋枪)",
    category: "weapons",
    description: "自带消音器的卡宾枪/冲锋枪，射速极快，近战神器，占用主武器栏但体积小巧。",
    rarity: "Epic",
    spawnCommand: "@give @p/116/1"
  },
  {
    id: 300,
    name: "Shadowstalker (暗影猎手电磁炮)",
    category: "weapons",
    description: "发射电磁轨道弹的高科技武器，能够造成范围爆炸伤害，极其稀有。",
    rarity: "Legendary",
    spawnCommand: "@give @p/300/1"
  },

  // Ammo & Attachments
  {
    id: 17,
    name: "Military Drum (军用鼓弹匣)",
    category: "ammo",
    description: "容纳100发军用子弹的弹鼓，能提供持久的火力输出。",
    rarity: "Epic",
    spawnCommand: "@give @p/17/1"
  },
  {
    id: 6,
    name: "Military Magazine (军用弹匣)",
    category: "ammo",
    description: "标准的30发军用子弹弹匣，广泛适用于Maplestrike等军用武器。",
    rarity: "Common",
    spawnCommand: "@give @p/6/1"
  },
  {
    id: 125,
    name: "Ranger Drum (游骑兵鼓弹匣)",
    category: "ammo",
    description: "容纳75发游骑兵子弹的弹鼓，适用于Zubeknakov等游骑兵武器。",
    rarity: "Epic",
    spawnCommand: "@give @p/125/1"
  },
  {
    id: 21,
    name: "8x Scope (8倍瞄准镜)",
    category: "ammo",
    description: "用于中远距离狙击的倍镜，视野清晰。",
    rarity: "Rare",
    spawnCommand: "@give @p/21/1"
  },

  // Apparel & Backpacks
  {
    id: 253,
    name: "Alicepack (爱丽丝背包)",
    category: "apparel",
    description: "游戏内格子最大的背包，提供高达56格的超大收纳容量，生存玩家梦寐以求。",
    rarity: "Legendary",
    spawnCommand: "@give @p/253/1"
  },
  {
    id: 1173,
    name: "Spec Ops Vest (特种防弹背心)",
    category: "apparel",
    description: "提供极高护甲减伤和18格收纳空间的特种部队防弹衣。",
    rarity: "Legendary",
    spawnCommand: "@give @p/1173/1"
  },
  {
    id: 310,
    name: "Military Vest (军用防弹衣)",
    category: "apparel",
    description: "标准的军用护甲，提供良好的防护力和12格收纳空间。",
    rarity: "Epic",
    spawnCommand: "@give @p/310/1"
  },
  {
    id: 236,
    name: "Ghillie Top (吉利服上衣)",
    category: "apparel",
    description: "覆盖草木伪装的上衣，能在丛林环境中提供极好的隐蔽效果。",
    rarity: "Epic",
    spawnCommand: "@give @p/236/1"
  },

  // Vehicles
  {
    id: 59,
    name: "APC (装甲运兵车 - 黑色)",
    category: "vehicles",
    description: "水陆两栖的重装甲载具，速度适中，防御力极强，能有效抵御枪弹，拥有6个座位。",
    rarity: "Legendary",
    spawnCommand: "@give @p/59/1"
  },
  {
    id: 140,
    name: "Fighter Jet (战斗机)",
    category: "vehicles",
    description: "飞行速度极快的喷气式军用飞机，配有弹射座椅，需要长跑道降落。",
    rarity: "Legendary",
    spawnCommand: "@give @p/140/1"
  },
  {
    id: 1,
    name: "Offroader (越野车 - 黑色)",
    category: "vehicles",
    description: "经典的四座越野车，爬坡能力强，适合崎岖地形。",
    rarity: "Common",
    spawnCommand: "@give @p/1/1"
  },
  {
    id: 10,
    name: "Police Car (警车)",
    category: "vehicles",
    description: "速度较快的警用轿车，带有可开启的警笛，极具辨识度。",
    rarity: "Uncommon",
    spawnCommand: "@give @p/10/1"
  },

  // Medical & Food
  {
    id: 15,
    name: "Medkit (医疗箱)",
    category: "medical",
    description: "最顶级的医疗物品，能够瞬间恢复大量生命值，止血并完全治愈骨折。",
    rarity: "Epic",
    spawnCommand: "@give @p/15/1"
  },
  {
    id: 269,
    name: "Vaccine (疫苗)",
    category: "medical",
    description: "专门用于清除僵尸病毒感染的药剂，可回复50%的免疫值。",
    rarity: "Rare",
    spawnCommand: "@give @p/269/1"
  },
  {
    id: 81,
    name: "MRE (军用干粮)",
    category: "medical",
    description: "高能量的军用即食便当，能够同时完全回复饥饿值和水分值。",
    rarity: "Epic",
    spawnCommand: "@give @p/81/1"
  },

  // Structures & Barricades
  {
    id: 1244,
    name: "Neutral Sentry (中立自动哨兵枪)",
    category: "structures",
    description: "自动防御炮塔，装入枪支和子弹后，会自动射击视野内的敌对目标（需通电）。",
    rarity: "Epic",
    spawnCommand: "@give @p/1244/1"
  },
  {
    id: 1158,
    name: "Claim Flag (领地旗)",
    category: "structures",
    description: "放置后可在一定范围内阻止其他玩家建造建筑物，是建造基地的核心防线。",
    rarity: "Rare",
    spawnCommand: "@give @p/1158/1"
  },
  {
    id: 373,
    name: "Metal Wall (金属墙)",
    category: "structures",
    description: "高强度的基地防壁，只能被C4等高爆炸药摧毁。",
    rarity: "Rare",
    spawnCommand: "@give @p/373/1"
  }
];
