# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码仓库中工作提供指导。

## 项目概述

**Cellcraft** 是一个受 Minecraft 启发的 3D 体素世界生成器，使用 Three.js 构建。项目已从简单的生成器演化为完整的游戏体验，包含分块加载、Web Workers 多线程、方块交互、库存系统、天气效果和玩家控制等功能。

## 核心架构

```
Cellcraft 应用
│
├── World（根管理器）
│   ├── ChunkManager - 基于视距的分块加载
│   ├── Terrain - 程序化地形生成
│   ├── VoxelBuilder - InstancedMesh 渲染
│   ├── WorkerCoordinator - Web Worker 通信
│   └── RenderCoordinator - 渲染管线
│
├── 玩家系统
│   ├── PlayerController - 第一人称控制
│   ├── BlockInteractor - 射线检测放置/破坏方块
│   ├── Inventory - 27格库存系统
│   └── GuideBook - 教程系统
│
└── 天气系统
    ├── 雨/雪粒子效果
    └── 动态光照调整
```

## 关键系统

### 1. 分块加载系统 (`src/class/ChunkManager.js`)
- 性能优化：世界分为 16x16 方块的分块，基于玩家位置动态加载
- 视距：可在 `main.js` 配置（默认 6 个分块）
- 内存管理：自动清理远距离分块

### 2. Web Worker 多线程 (`src/core/WorkerCoordinator.js`)
- 地形和装饰生成在 Worker 中进行，避免阻塞主线程
- `terrainWorker.js`：生成分块地形
- `decorWorker.js`：放置装饰（树木、草地、建筑）

### 3. 方块系统 (`src/class/BlockDefinitions.js`, `src/class/BlockStore.js`)
- 集中式方块类型管理
- 支持添加新方块类型（方块定义 + 纹理 + 材质）

### 4. 体素渲染 (`src/voxel.js`)
- Three.js InstancedMesh 批量渲染
- 9 种方块类型，每种 4 个纹理变体
- 水材质支持透明度（0.7 不透明度）

### 5. 程序化纹理 (`src/textures.js`)
- Canvas API 程序化生成
- 基于种子的随机确保变体一致性
- 64x64 分辨率

### 6. 地形生成 (`src/class/Terrain.js`)
- 多层 Perlin 噪声
- 生物群系：水（-4）、沙（-3）、雪（12）
- 生成顺序：地下层 → 地表 → 水层

### 7. 村庄系统 (`src/class/Village.js`)
- 径向分布：TownHall（中心）→ 住宅区 → 外围防御
- 反重叠：使用 occupiedSet 防止建筑碰撞

### 8. 建筑系统 (`src/class/Building.js`, `src/class/BuildingTypes.js`)
- 模板方法模式：基类 build() + 子类自定义
- 6 种建筑：TownHall、Tower、Blacksmith、House、Barn、Storage

### 9. 装饰系统 (`src/class/Decoration.js`)
- 自然元素：树、草地、花朵
- 结构装饰：围栏、广场、水井、喷泉、道路

### 10. 玩家控制 (`src/class/Player.js`)
- WASD 移动 + 鼠标视角
- 地形碰撞检测
- 为分块加载提供位置追踪

### 11. 方块交互 (`src/class/BlockInteractor.js`)
- 基于射线检测：左键破坏，右键放置
- 数字键选择库存槽位
- 与 GuideBook 集成显示教程

### 12. 库存系统 (`src/class/Inventory.js`)
- 27 格网格库存
- 默认物品：草、土、石、木、沙、雪、仙人掌、花、叶

### 13. 天气系统 (`src/class/WeatherSystem.js`)
- 雨/雪粒子效果
- 云层覆盖影响光照
- 动态环境光/定向光强度

### 14. 事件系统 (`src/core/EventBus.js`)
- 发布/订阅模式解耦系统
- 使用示例：`events.emit('chunk:loaded', key)`，`events.on('chunk:loaded', callback)`

## 项目结构

```
src/
├── class/              # 核心类
│   ├── ChunkManager.js    # 分块管理
│   ├── World.js           # 世界管理器
│   ├── Terrain.js         # 地形生成
│   ├── Player.js          # 玩家控制
│   ├── BlockInteractor.js # 方块交互
│   ├── Inventory.js       # 库存
│   ├── WeatherSystem.js   # 天气
│   ├── Village.js         # 村庄
│   ├── Building.js        # 建筑
│   └── Decoration.js      # 装饰
├── core/               # 核心系统
│   ├── EventBus.js        # 事件系统
│   ├── RenderCoordinator.js
│   └── WorkerCoordinator.js
├── worker/             # Web Workers
│   ├── terrainWorker.js
│   └── decorWorker.js
├── main.js             # 应用入口
├── voxel.js            # 体素渲染
└── textures.js         # 纹理生成
```

## 常用开发任务

### 运行应用
1. 启动本地服务器（ES 模块需要）：
   ```bash
   python -m http.server 8000
   # 或
   npx serve
   ```
2. 浏览器打开：`http://localhost:8000`

### 修改世界设置（`src/main.js`）
```javascript
const world = new World({
    scene: scene,
    settings: {
        worldSize: 256,      // 世界半尺寸
        villageCount: 8,     // 村庄数量
        treeCount: 300,      // 树木数量
        grassCount: 2000,    // 草丛数量
        seed: Date.now()     // 世界种子
    },
    viewDistance: 6         // 分块视距
})
```

### 调整地形参数（`src/class/Terrain.js`）
```javascript
this.terrain = new Terrain({
    worldSize: 256,
    bottomLevel: -10,
    waterLevel: -4,
    sandLevel: -3,
    snowLevel: 12,
    groundDepth: 10,
    chunkSize: 16,
    seed: this.seed
})
```

### 添加新建筑类型
1. 在 `src/class/BuildingTypes.js` 创建类：
```javascript
export class NewBuilding extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'newbuilding',
            width: 8,
            depth: 8,
            height: 6
        })
    }
    buildWalls(builder) { /* 自定义逻辑 */ }
    buildRoof(builder) { /* 自定义逻辑 */ }
}
```
2. 在 `src/class/Village.js` 的 buildingConfig 中添加：
```javascript
{ type: NewBuilding, count: 1, priority: 4, distanceRange: [0.2, 0.5] }
```

### 添加新方块类型
1. `src/blocks/blocks.js` - 定义方块属性
2. `src/class/BlockDefinitions.js` - 注册方块
3. `src/textures.js` - 添加纹理生成
4. `src/voxel.js` - 注册材质

### 性能优化
- 大世界：增加 `viewDistance` 至 8-10，使用 Workers
- 测试：减少 `worldSize` 到 128，`grassCount` 到 500-1000，`viewDistance` 到 4
- 监控：浏览器 Performance 标签，分块加载日志

### 常见问题调试
**分块未加载**：
- 检查 ChunkManager.requiredChunks() 输出
- 验证 Worker 初始化
- 查看浏览器网络标签 Worker 脚本错误

**性能问题**：
- 降低 `viewDistance`（从 6 降到 4）
- 减少 `grassCount` 和 `treeCount`
- 检查 Workers 是否启用

**地形生成错误**：
- 检查种子值
- 验证 World.js 中地形设置
- 查看 Worker 控制台错误

**方块交互无效**：
- 验证 BlockInteractor 射线检测器
- 检查库存是否有物品
- 确认事件监听器正确附加

## 关键文件参考

| 文件 | 用途 | 关键方法 |
|------|------|---------|
| `src/main.js` | 应用入口，场景设置 | Scene, Camera, Renderer 初始化 |
| `src/class/World.js` | 世界管理 | `generate()`, `updateChunks()` |
| `src/class/ChunkManager.js` | 分块加载 | `requiredChunks()`, `markLoaded()` |
| `src/class/Player.js` | 玩家控制 | `update()`, 移动, 位置追踪 |
| `src/class/BlockInteractor.js` | 方块放置/破坏 | 射线检测, 点击处理 |
| `src/voxel.js` | 体素渲染 | `VoxelBuilder`, `addBlock()` |
| `src/class/Terrain.js` | 地形生成 | `getHeight()`, `generateTerrain()` |
| `src/class/WeatherSystem.js` | 天气效果 | `update()`, 粒子系统 |

## 依赖

**外部**（通过 CDN 导入）：
- **Three.js** (v0.160.0)：3D 渲染
- **simplex-noise** (v4.0.1)：Perlin 噪声（位于 `src/lib/simplex-noise.js`）

**无需构建**：使用原生 ES 模块，无需打包器。

## 控制台输出

**世界生成完成**：
```
========== 世界生成完成 ==========
世界信息: { terrainSize: 256, villageCount: 8, ... }
村庄统计: { TownHall: 8, Tower: 4, ... }
==================================
```

**游戏运行时**：
```
Chunk loaded: 5,3
Weather: raining
```

使用这些输出调试生成问题和验证系统正常工作。

## 最近变更

- **分块加载**：可扩展世界大小
- **Web Workers**：多线程地形/装饰生成
- **方块交互**：完整放置/破坏系统
- **库存系统**：27格库存选择
- **天气系统**：动态天气和光照
- **玩家控制**：第一人称移动
- **事件系统**：解耦架构
- **渲染协调**：优化渲染管线
