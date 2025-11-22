# 3D 世界 OOP 架构说明

## 概述

本次重构将原有的过程式代码转换为面向对象（OOP）架构，提高了代码的可维护性、可扩展性和可重用性。新的架构采用模块化设计，每个类都有明确的职责和接口。

## 类层次结构

```
World (世界管理器)
│
├── Terrain (地形系统)
│   ├── 地形生成
│   ├── 高度计算
│   ├── 地层生成
│   └── 生物群系判断
│
├── Village (村庄系统)
│   ├── Building[] (建筑列表)
│   │   ├── TownHall (市政厅)
│   │   ├── Tower (塔楼)
│   │   ├── Blacksmith (铁匠铺)
│   │   ├── House (民居)
│   │   ├── Barn (谷仓)
│   │   └── Storage (储藏室)
│   ├── Farm[] (农田列表)
│   ├── Path[] (道路列表)
│   └── Decoration[] (装饰列表)
│       ├── Tree (树)
│       ├── Fountain (喷泉)
│       ├── Fence (围栏)
│       ├── Garden (花园)
│       ├── Square (广场)
│       ├── Well (水井)
│       └── Grass (草丛)
│
├── VoxelBuilder (方块渲染器)
│   └── Block[] (方块列表)
│
└── DecorationManager (装饰管理器)
    └── Natural Decorations
```

## 核心类说明

### 1. Block 类 (`js/class/Block.js`)

**职责**：表示一个基础方块

**属性**：
- `type`: 方块类型（grass, dirt, stone, wood, leaves, glass, roof, water, sand）
- `x, y, z`: 坐标位置
- `variant`: 纹理变体（0-3）
- `metadata`: 扩展数据（如朝向、特殊属性等）

**方法**：
- `getPosition()`: 获取方块位置
- `setPosition(x, y, z)`: 设置位置
- `clone()`: 克隆方块

### 2. Terrain 类 (`js/class/Terrain.js`)

**职责**：管理地形生成和计算

**属性**：
- `settings`: 地形配置（世界大小、水位、雪线等）
- `noise2D`: 噪声生成器
- `heightCache`: 高度缓存（优化性能）

**方法**：
- `getHeight(x, z)`: 获取地形高度
- `getSurfaceBlockType(x, z)`: 获取表面方块类型
- `generateTerrain(builder)`: 生成整个地形
- `isUnderwater(x, z)`: 检查是否在水下
- `isSnowBiome(x, z)`: 检查是否在雪地生物群系

### 3. Building 基类 (`js/class/Building.js`)

**职责**：所有建筑的父类，定义通用属性和方法

**属性**：
- `x, y, z`: 位置
- `width, depth, height`: 尺寸
- `wallMaterial`: 墙体材质
- `roofMaterial`: 屋顶材质
- `foundationMaterial`: 地基材质
- `hasWindows`: 是否有窗户
- `hasDoor`: 是否有门

**方法**：
- `build(builder, occupiedSet)`: 建造建筑（模板方法模式）
- `buildFoundation(builder)`: 构建地基
- `buildWalls(builder)`: 构建墙体（子类可重写）
- `buildRoof(builder)`: 构建屋顶（子类可重写）
- `buildDetails(builder)`: 构建细节（子类可重写）

### 4. 建筑类型类 (`js/class/BuildingTypes.js`)

**TownHall（市政厅）**：
- 村庄中心建筑，尺寸 10x10x8
- 石头地基 + 木墙 + 金字塔屋顶

**Tower（塔楼）**：
- 防御建筑，尺寸 6x6x12
- 石头基座 + 木结构 + 圆锥屋顶
- 每层有窗户

**Blacksmith（铁匠铺）**：
- 工业建筑，尺寸 8x8x5
- 全石头结构，有锻造炉装饰

**House（民居）**：
- 居民建筑，尺寸 6x6x5
- 木墙，有门和窗户

**Barn（谷仓）**：
- 农业建筑，尺寸 12x8x6
- 大木结构，有大门开口

**Storage（储藏室）**：
- 存储建筑，尺寸 6x6x4
- 全木结构

### 5. Farm 类 (`js/class/Farm.js`)

**职责**：Minecraft风格的农田系统

**特性**：
- 9x9 农田大小
- 木质围栏边界
- 3x3 灌溉网格
- 按棋盘格模式种植作物
- 可选农舍

**方法**：
- `buildFence(builder)`: 构建围栏
- `buildFarmland(builder)`: 构建农田土壤
- `buildIrrigation(builder)`: 构建灌溉系统
- `buildCrops(builder)`: 构建作物
- `buildFarmHut(builder, terrain)`: 构建农舍

### 6. Village 类 (`js/class/Village.js`)

**职责**：管理村庄内的所有元素

**属性**：
- `x, y, z, radius`: 村庄中心和半径
- `buildings[]`: 建筑列表
- `farms[]`: 农田列表
- `paths[]`: 道路列表
- `decorations[]`: 装饰列表
- `buildingConfig[]`: 建筑配置（数量、优先级、距离范围）

**建筑布局策略**：
- TownHall：中心（0-20% 距离）
- Tower：外围（50-80% 距离）
- Blacksmith/House：中环（20-50% 距离）
- Barn：中外环（40-70% 距离）
- Farm：最外环（60-100% 距离）
- Storage：中环（30-60% 距离）

**方法**：
- `generate(terrain, builder)`: 生成整个村庄
- `generateBuildings(terrain, builder)`: 生成建筑
- `generatePaths(builder, terrain)`: 生成道路网络
- `generateCentralSquare(builder, terrain)`: 生成中央广场
- `addFences(builder, terrain)`: 添加围栏
- `addGardens(builder, terrain)`: 添加花园

### 7. Decoration 类 (`js/class/Decoration.js`)

**职责**：各种装饰元素

**装饰类型**：

**Tree（树）**：
- 高度随机（3-6格）
- 树干 + 树叶

**Fountain（喷泉）**：
- 石头边界 + 中央水池

**Fence（围栏）**：
- 简单的木制围栏柱

**Garden（花园）**：
- 3x3 花园
- 泥土 + 随机花朵

**Square（广场）**：
- 石头铺装的村庄中心广场

**Well（水井）**：
- 石头井壁 + 中央井水

**Grass（草丛）**：
- 1-3 簇草丛
- 随机添加花朵

**Path（道路）**：
- 连接两点的道路
- 使用 Bresenham 算法生成

### 8. World 类 (`js/class/World.js`)

**职责**：管理整个游戏世界

**属性**：
- `scene`: Three.js 场景
- `settings`: 世界设置
- `terrain`: 地形系统
- `voxelBuilder`: 方块构建器
- `villages[]`: 村庄列表
- `decorations[]`: 装饰列表

**方法**：
- `generate()`: 生成整个世界
- `generateTerrain()`: 生成地形
- `generateVillages()`: 生成村庄
- `addNaturalDecorations()`: 添加自然装饰
- `addGrass()`: 添加草丛
- `addTrees()`: 添加树木
- `isNearVillage(x, z, minDistance)`: 检查是否靠近村庄
- `render()`: 渲染世界
- `getInfo()`: 获取世界信息
- `getVillageStats()`: 获取村庄统计信息
- `rebuild()`: 重建世界

## 核心设计模式

### 1. 模板方法模式（Building 类）
- `build()` 方法定义了建造建筑的流程
- 子类可以重写特定步骤（`buildWalls`, `buildRoof`, `buildDetails`）

### 2. 策略模式（建筑定位）
- `Village.findBuildingPosition()` 使用距离范围策略定位不同类型的建筑
- 根据建筑类型调整最小/最大距离

### 3. 组合模式（World 管理 Village，Village 管理 Building）
- World 包含多个 Village
- Village 包含多个 Building、Farm、Path、Decoration

### 4. 建造者模式（VoxelBuilder）
- 收集所有方块，然后一次性渲染

## 模块化优势

### 1. 可维护性
- 每个类职责单一，易于理解和修改
- 修改一个模块不影响其他模块

### 2. 可扩展性
- 添加新建筑类型只需继承 Building 类
- 添加新装饰类型只需继承 Decoration 类
- 添加新地形特征只需修改 Terrain 类

### 3. 可重用性
- 建筑类可以在不同村庄中重用
- 装饰类可以在不同场景中重用
- 工具类（Block, Terrain）可在不同上下文中使用

### 4. 性能优化
- 高度缓存减少重复计算
- InstancedMesh 批量渲染提升性能
- 分层加载管理资源

## 文件结构

```
js/
├── main.js                 # 主入口文件（精简）
├── voxel.js               # 方块渲染器（更新）
├── textures.js            # 纹理工厂（不变）
└── class/                 # OOP 类目录
    ├── Block.js           # 方块基类
    ├── Building.js        # 建筑基类
    ├── BuildingTypes.js   # 建筑类型
    ├── Farm.js            # 农田类
    ├── Village.js         # 村庄类
    ├── Decoration.js      # 装饰类和路径类
    ├── Terrain.js         # 地形类
    └── World.js           # 世界类
```

## 使用示例

### 创建新世界

```javascript
import { World } from './class/World.js'

const world = new World({
    scene: scene,
    settings: {
        worldSize: 128,
        villageCount: 8,
        treeCount: 150,
        grassCount: 1000
    }
})

world.generate()
```

### 获取世界信息

```javascript
console.log('世界信息:', world.getInfo())
console.log('村庄统计:', world.getVillageStats())
```

### 重建世界

```javascript
world.updateSettings({ villageCount: 10 })
world.rebuild()
```

## 后续开发建议

1. **配置化**：将建筑参数、地形设置等提取到 JSON 配置文件中
2. **存档系统**：实现世界的序列化和反序列化
3. **动态更新**：支持运行时添加/删除建筑和装饰
4. **更多建筑类型**：教堂、商店、磨坊等
5. **生物系统**：添加动物、NPC 等互动元素
6. **物理系统**：碰撞检测、重力等

## 总结

通过 OOP 重构，代码从 1000+ 行的单体结构转变为清晰的模块化架构。新架构提供了：

- ✅ 更好的代码组织和可读性
- ✅ 更强的可扩展性和可重用性
- ✅ 更易于维护和调试
- ✅ 更高效的性能优化空间
- ✅ 为未来功能扩展奠定坚实基础
