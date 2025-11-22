# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码仓库中工作提供指导。

## 项目概述

这是一个受 Minecraft 启发的 **3D 体素世界生成器**，使用 Three.js 构建。它生成程序化的 3D 世界，包含村庄、建筑、地形和装饰元素。代码库最近从单体结构重构为模块化 OOP 架构，包含多个专业类。

## 核心架构

### 高级系统设计

```
World（根管理器）
│
├── Terrain（程序化生成）
│   ├── 多八度 Perlin 噪声
│   ├── 高度缓存（性能优化）
│   └── 生物群系判断（水/沙/草/石）
│
├── Village[]（村庄生成）
│   ├── Building[]（建筑结构）
│   │   ├── TownHall, Tower, Blacksmith
│   │   └── House, Barn, Storage
│   ├── Path[]（道路网络）
│   └── Decoration[]（围栏、花园、广场、水井）
│
└── VoxelBuilder（渲染）
    ├── InstancedMesh 批量渲染
    ├── 9 种材质类型（草、土、石、木、叶、玻璃、屋顶、水、沙）
    └── 每种材质 4 个纹理变体
```

### 关键设计模式

1. **模板方法模式**（Building 类）

   - 基础 `build()` 方法定义构建流程
   - 子类重写 `buildWalls()`、`buildRoof()`、`buildDetails()`

2. **策略模式**（村庄建筑定位）

   - 基于距离的建筑类型定位策略
   - 可在 `Village.buildingConfig[]` 中配置

3. **组合模式**（世界层次结构）

   - World → Village → Building/Decoration
   - 每一层管理其子元素

4. **建造者模式**（VoxelBuilder）

   - 累积方块，一次性渲染全部
   - 使用 Three.js InstancedMesh 提升性能

## 重要系统

### 1. 地形生成（`js/class/Terrain.js`）

- **多层噪声**：两个不同尺度的 Perlin 噪声层
- **生物群系判断**：基于高度阈值
  - `waterLevel`：-5（默认）
  - `sandLevel`：3
  - `snowLevel`：12
- **高度缓存**：基于 Map 的缓存以提升性能
- **地形生成顺序**：
  1. 地下层（土/石或沙/石）
  2. 地表方块（草/沙/石）
  3. 水层（从 surfaceY+1 到 waterLevel）

### 2. 体素渲染（`js/voxel.js`）

- 使用 Three.js `InstancedMesh` 实现高效的批量渲染
- 9 种材质类型，每种 4 个纹理变体
- 材质支持多面纹理（草和木）
- 水有透明度（0.7 不透明度）

### 3. 程序化纹理（`js/textures.js`）

- 基于 Canvas 的程序化生成
- 64x64 纹理，包含噪声、图案和变化
- 种子随机数确保变体一致性
- 纹理类型：
  - `grass_top`、`grass_side`（多面）
  - `dirt`、`stone`、`sand`
  - `wood_side`、`wood_top`（多面）
  - `leaves`、`glass`、`roof`、`water`

### 4. 村庄布局系统（`js/class/Village.js`）

建筑使用径向距离策略定位：

- **TownHall（市政厅）**：0-20% 半径（中心）
- **Tower（塔楼）**：50-80% 半径（外围防御）
- **Blacksmith/House（铁匠铺/民居）**：20-50% 半径（居住区）
- **Barn（谷仓）**：40-70% 半径（农业区）
- **Storage（储藏室）**：30-60% 半径（中心存储）

### 5. 建筑系统（`js/class/Building.js`）

- 建造使用模板方法模式
- 所有建筑使用：地基 + 墙体 + 屋顶 + 细节
- 通过 `occupiedSet` 检查位置防止重叠
- `BuildingTypes.js` 中的子类：
  - `TownHall`：10x10x8，石制地基，金字塔屋顶
  - `Tower`：6x6x12，防御结构带窗户
  - `Blacksmith`：8x8x5，工业建筑带锻造装饰
  - `House`：6x6x5，住宅带门窗
  - `Barn`：12x8x6，农业建筑带大门
  - `Storage`：6x6x4，简易存储建筑

### 6. 装饰系统（`js/class/Decoration.js`）

自然和结构装饰：

- **Tree（树）**：随机高度（3-6），树干 + 树叶
- **Fence（围栏）**：2格高柱带水平横杆
- **Grass（草地）**：2-5 簇，多层带花朵
- **Garden（花园）**：3x3 地块带花朵
- **Square（广场）**：村庄中心的石制广场
- **Well（水井）**：石制井壁带水
- **Fountain（喷泉）**：装饰性水景
- **Path（道路）**：使用线性插值连接建筑

## 常见开发任务

### 修改世界生成

要更改世界参数，编辑 `js/main.js`：

```javascript
const world = new World({
  scene: scene,
  settings: {
    worldSize: 128, // 世界尺寸（半尺寸）
    villageCount: 8, // 村庄数量
    treeCount: 100, // 自然树木
    grassCount: 1000, // 草丛簇数
  },
})
```

### 调整地形设置

修改 `js/class/Terrain.js` 构造函数或运行时更新：

```javascript
const terrain = new Terrain({
  worldSize: 128,
  bottomLevel: -10,
  waterLevel: -5,
  sandLevel: 3,
  snowLevel: 12,
  groundDepth: 10,
  noiseScale1: 0.01, // 大尺度特征
  noiseScale2: 0.05, // 小尺度细节
  noiseAmplitude1: 10, // 山地高度
  noiseAmplitude2: 2, // 表面变化
})
```

### 添加新建筑

1. 在 `js/class/BuildingTypes.js` 中创建新类：

```javascript
export class NewBuilding extends Building {
  constructor(options = {}) {
    super({
      ...options,
      type: "newbuilding",
      width: 8,
      depth: 8,
      height: 6,
      wallMaterial: "wood",
      roofMaterial: "roof",
    })
  }

  buildWalls(builder) {
    // 自定义墙体逻辑
  }

  buildRoof(builder) {
    // 自定义屋顶逻辑
  }
}
```

2. 在 `js/class/Village.js` 的 Village 的 buildingConfig 中添加：

```javascript
{ type: NewBuilding, count: 1, priority: 4, distanceRange: [0.2, 0.5] }
```

### 自定义材质

编辑 `js/voxel.js` 中的材质定义：

```javascript
// 示例：修改水的透明度
this.materials.water.push(
  mat(this.factory.createTexture("water", v), true, 0.7)
)

// 示例：添加新材质
this.materials.newType = []
for (let v = 0; v < this.variants; v++) {
  this.materials.newType.push(mat(this.factory.createTexture("newType", v)))
}
```

### 修改纹理

在 `js/textures.js` 中添加纹理生成：

```javascript
case 'newTexture':
    this.fillNoise(ctx, '#color1', '#color2', 0.1, seed)
    // 添加自定义图案逻辑
    break
```

### 调试地形问题

需要检查的关键区域：

1. **水覆盖地面**：检查 `generateTerrain()` - 水应从 `surfaceY + 1` 开始
2. **缺少草地**：验证 `generateTerrain()` 中的表面类型逻辑
3. **高度计算**：使用 `terrain.getHeight()` 并验证缓存

### 性能优化

- 地形使用高度缓存（`this.heightCache`）
- VoxelBuilder 按材质和变体批量实例
- 对于大型世界，考虑：
  - 分块系统
  - 细节层次（LOD）
  - 视锥体剔除

## 关键文件参考

| 文件                     | 用途                           | 关键类/方法                                                        |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------ |
| `js/main.js`             | 场景设置，世界初始化           | Scene, Camera, Renderer, World.generate()                          |
| `js/class/World.js`      | 顶层世界管理                   | generate(), generateTerrain(), generateVillages(), addNaturalDecorations() |
| `js/class/Terrain.js`    | 程序化地形生成                 | getHeight(), getSurfaceBlockType(), generateTerrain(), isUnderwater()      |
| `js/voxel.js`            | 体素渲染系统                   | VoxelBuilder, addBlock(), render()                                 |
| `js/textures.js`         | 程序化纹理生成                 | TextureFactory, createTexture(), seededRandom()                    |
| `js/class/Village.js`    | 村庄生成系统                   | generate(), generateBuildings(), generatePaths(), findBuildingPosition()   |
| `js/class/Building.js`   | 基础建筑架构                   | build(), buildFoundation(), buildWalls(), buildRoof()（模板方法）    |
| `js/class/Decoration.js` | 装饰元素                       | Tree, Fence, Grass, Garden, Square, Well, Fountain, Path           |

## 已知问题和解决方案

### 地形水渲染

- **问题**：水覆盖了地表方块
- **解决方案**：水层应从 `surfaceY + 1` 开始，而不是 `surfaceY`
- **位置**：`Terrain.generateTerrain()` 第 159-162 行

### 地表方块类型

- **问题**：陆地区域显示为土而不是草
- **解决方案**：直接在 `generateTerrain()` 中判断 surface 类型，不依赖 `getSurfaceBlockType()` 的 waterLevel 检查
- **位置**：`Terrain.generateTerrain()` 第 131-139 行

### 建筑重叠预防

- 建筑在放置前检查 `occupiedSet`
- 每个建筑标记其占用的区域

### 性能瓶颈

- 大量草丛（1000+）会影响性能
- 测试时考虑减少 `grassCount` 设置
- InstancedMesh 批量处理有帮助但有上限

## 最近更改

- **OOP 重构**：将 1000+ 行单体代码转换为 11 个模块化类
- **增强水效果**：不透明度从 0.4 增加到 0.7，颜色加深
- **3D 装饰**：增强围栏、作物和草地的建模，使其从平面变为立体
- **地形逻辑**：修复水层生成和地表方块确定
- **纹理变体**：每种材质 4 个变体以提供视觉多样性

## 外部依赖

- **Three.js**（v0.160.0）：3D 渲染
  - 通过 `index.html` 导入映射从 CDN 导入
- **simplex-noise**（v4.0.1）：地形的 Perlin 噪声
  - 在 `Terrain` 类中用于高度生成

所有依赖都通过 CDN 链接以 ES 模块形式加载，无需 npm 安装。

## 测试工作流程

1. 启动本地服务器（使用 Live Server 或其他方式）
2. 在浏览器中打开应用程序
3. 检查控制台的生成统计信息
4. 旋转相机检查世界
5. 修改 `main.js` 或类文件中的参数
6. 刷新以测试更改

## 配置建议

- **测试用小世界**：将 `worldSize` 减少到 64 或 32
- **减少村庄数量**：将 `villageCount` 设置为 2-4 以加快生成速度
- **禁用装饰**：在 `World.generate()` 中注释掉 `addNaturalDecorations()`
- **专注单一村庄**：将 `villageCount` 设置为 1 并增加大小

## 控制台输出

生成后，控制台显示：

```
========== 世界生成完成 ==========
世界信息: { terrainSize, villageCount, buildingCount, decorationCount }
村庄统计: { TownHall: 1, Tower: 1, ... }
==================================
```

此信息用于验证生成成功和调试放置问题。
