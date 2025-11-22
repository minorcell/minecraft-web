export const blocks = [
  {
    id: 'grass',
    name: '草方块',
    hardness: 0.4,
    solid: true,
    breakable: true,
    drops: [{ id: 'dirt', count: 1 }],
    textures: { top: 'grass_top', bottom: 'dirt', side: 'grass_side' }
  },
  {
    id: 'dirt',
    name: '泥土',
    hardness: 0.4,
    solid: true,
    breakable: true,
    drops: [{ id: 'dirt', count: 1 }],
    textures: { all: 'dirt' }
  },
  {
    id: 'stone',
    name: '石头',
    hardness: 1.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'stone', count: 1 }],
    textures: { all: 'stone' }
  },
  {
    id: 'bedrock',
    name: '基岩',
    hardness: 9999,
    solid: true,
    breakable: false,
    drops: [],
    textures: { all: 'stone' }
  },
  {
    id: 'wood',
    name: '木头',
    hardness: 0.8,
    solid: true,
    breakable: true,
    drops: [{ id: 'wood', count: 1 }],
    textures: { side: 'wood_side', top: 'wood_top', bottom: 'wood_top' }
  },
  {
    id: 'leaves',
    name: '橡树叶',
    hardness: 0.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'leaves', count: 1 }],
    transparent: false,
    opacity: 1.0,
    renderLayer: 'solid',
    textures: { all: 'leaves' }
  },
  {
    id: 'spruce_leaves',
    name: '云杉叶',
    hardness: 0.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'spruce_leaves', count: 1 }],
    transparent: false,
    opacity: 1.0,
    renderLayer: 'solid',
    textures: { all: 'spruce_leaves' }
  },
  {
    id: 'birch_leaves',
    name: '桦树叶',
    hardness: 0.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'birch_leaves', count: 1 }],
    transparent: false,
    opacity: 1.0,
    renderLayer: 'solid',
    textures: { all: 'birch_leaves' }
  },
  {
    id: 'jungle_leaves',
    name: '丛林叶',
    hardness: 0.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'jungle_leaves', count: 1 }],
    transparent: false,
    opacity: 1.0,
    renderLayer: 'solid',
    textures: { all: 'jungle_leaves' }
  },
  {
    id: 'glass',
    name: '玻璃',
    hardness: 0.3,
    solid: true,
    breakable: true,
    drops: [],
    transparent: true,
    opacity: 0.6,
    renderLayer: 'alpha',
    textures: { all: 'glass' }
  },
  {
    id: 'roof',
    name: '屋顶瓦',
    hardness: 1.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'roof', count: 1 }],
    textures: { all: 'roof' }
  },
  {
    id: 'water',
    name: '水',
    hardness: 9999,
    solid: false,
    breakable: false,
    drops: [],
    transparent: true,
    opacity: 0.7,
    renderLayer: 'water',
    textures: { all: 'water' }
  },
  {
    id: 'sand',
    name: '沙子',
    hardness: 0.4,
    solid: true,
    breakable: true,
    drops: [{ id: 'sand', count: 1 }],
    textures: { all: 'sand' }
  },
  {
    id: 'snow',
    name: '雪',
    hardness: 0.4,
    solid: true,
    breakable: true,
    drops: [{ id: 'snow', count: 1 }],
    textures: { all: 'snow' }
  },
  {
    id: 'cactus',
    name: '仙人掌',
    hardness: 0.8,
    solid: true,
    breakable: true,
    drops: [{ id: 'cactus', count: 1 }],
    textures: { all: 'cactus' }
  },
  {
    id: 'flower',
    name: '花簇',
    hardness: 0.2,
    solid: true,
    breakable: true,
    drops: [{ id: 'flower', count: 1 }],
    textures: { all: 'flower' }
  }
]

// 工具效率表：key 为手持方块/工具ID，值为效率系数
export const tools = {
  default: 1.0,
  empty: 0.6,
  wood: 1.5,
  stone: 2.0,
  sand: 1.1,
  cactus: 1.1
}
