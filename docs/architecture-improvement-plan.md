# 架构改进与长期规划

## 愿景与目标

基于当前架构评审，我们制定了为期6个月的技术演进路线图，旨在将项目从概念验证(PoC)提升为生产就绪的企业级3D世界生成器。

---

## 架构演进路线图

### 当前状态 → 目标状态

```
当前 (单体架构)
├─ World (聚合根) - 承担过多职责
├─ Terrain (地形系统) - 功能完整
├─ Village (村庄系统) - 设计良好
├─ VoxelBuilder (渲染) - 性能可优化
└─ Player (玩家控制) - 基础功能

目标 (分层+插件架构)
├─ Core Layer (核心层)
│  ├─ Event System (事件系统)
│  ├─ Service Container (服务容器)
│  └─ Plugin Manager (插件管理器)
├─ Domain Layer (领域层)
│  ├─ World Aggregate (世界聚合)
│  ├─ Terrain Service (地形服务)
│  └─ Village Service (村庄服务)
├─ Infrastructure Layer (基础设施层)
│  ├─ Render Engine (渲染引擎)
│  ├─ Physics Engine (物理引擎)
│  └─ Storage Engine (存储引擎)
└─ Application Layer (应用层)
   ├─ Game Loop (游戏循环)
   ├─ Input Manager (输入管理)
   └─ UI System (UI系统)
```

---

## 第一阶段：架构重构 (1-2个月)

### 1.1 引入IoC容器

**目标**: 解耦依赖关系，提升可测试性

**文件**: `js/core/Container.js`

```javascript
/**
 * 依赖注入容器 - 管理服务生命周期
 */
export class Container {
  constructor() {
    this.services = new Map()
    this.factories = new Map()
    this.singletons = new Map()
  }

  /**
   * 注册服务 (每次请求返回新实例)
   * @param {string} name
   * @param {Function} factory
   */
  register(name, factory) {
    this.factories.set(name, factory)
  }

  /**
   * 注册单例 (仅创建一次)
   * @param {string} name
   * @param {Function} factory
   */
  registerSingleton(name, factory) {
    this.services.set(name, factory)
  }

  /**
   * 获取服务实例
   * @param {string} name
   * @returns {any}
   */
  get(name) {
    // 单例模式
    if (this.singletons.has(name)) {
      return this.singletons.get(name)
    }

    // 工厂模式
    if (this.factories.has(name)) {
      const instance = this.factories.get(name)(this)
      this.singletons.set(name, instance)
      return instance
    }

    // 服务模式
    if (this.services.has(name)) {
      const FactoryClass = this.services.get(name)
      const instance = new FactoryClass(this)
      this.singletons.set(name, instance)
      return instance
    }

    throw new Error(`Service not found: ${name}`)
  }

  /**
   * 检查服务是否存在
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this.factories.has(name) ||
           this.services.has(name) ||
           this.singletons.has(name)
  }
}
```

**使用示例**:

```javascript
// js/core/ServiceRegistry.js
import { Container } from './Container.js'
import { Terrain } from '../class/Terrain.js'
import { World } from '../class/World.js'

export const container = new Container()

// 注册服务
container.register('Terrain', (c) => new Terrain({
  // ... 配置
}))

container.register('World', (c) => new World({
  terrain: c.get('Terrain'),
  // ...
}))

// 使用服务
const world = container.get('World')
world.generate()
```

### 1.2 建立事件系统

**目标**: 解耦组件通信，支持观察者模式

**文件**: `js/core/EventEmitter.js`

```javascript
/**
 * 事件发射器 - 实现观察者模式
 */
export class EventEmitter {
  constructor() {
    this.events = new Map()
    this.maxListeners = 10
  }

  /**
   * 订阅事件
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }

    const listeners = this.events.get(event)
    if (listeners.length >= this.maxListeners) {
      console.warn(`Max listeners exceeded for event: ${event}`)
    }

    listeners.push(callback)

    // 返回取消订阅函数
    return () => this.off(event, callback)
  }

  /**
   * 只订阅一次
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const off = this.on(event, (...args) => {
      callback(...args)
      off()
    })
  }

  /**
   * 取消订阅
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this.events.has(event)) return

    const listeners = this.events.get(event)
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * 发射事件
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return

    const listeners = this.events.get(event).slice() // 复制数组
    for (const callback of listeners) {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    }
  }

  /**
   * 异步发射事件
   * @param {string} event
   * @param  {...any} args
   */
  async emitAsync(event, ...args) {
    if (!this.events.has(event)) return

    const listeners = this.events.get(event).slice()
    const promises = listeners.map(callback => {
      try {
        return Promise.resolve(callback(...args))
      } catch (error) {
        return Promise.reject(error)
      }
    })

    return Promise.all(promises)
  }

  /**
   * 移除所有监听器
   * @param {string} [event]
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }
}
```

**集成到World类**:

```javascript
// js/class/World.js
import { EventEmitter } from '../core/EventEmitter.js'

export class World extends EventEmitter {
  constructor(options = {}) {
    super() // 初始化事件系统

    this.scene = options.scene
    this.settings = { ...options.settings }

    // 订阅chunk加载事件
    this.on('chunk:loading', (chunkKey) => {
      console.log(`Loading chunk: ${chunkKey}`)
    })

    this.on('chunk:loaded', (chunkKey) => {
      console.log(`Chunk loaded: ${chunkKey}`)
      this.emit('render:update', chunkKey) // 触发渲染更新
    })

    this.on('chunk:unloaded', (chunkKey) => {
      console.log(`Chunk unloaded: ${chunkKey}`)
    })

    // 订阅村庄生成事件
    this.on('village:generated', (village) => {
      console.log(`Village generated at (${village.x}, ${village.z})`)
    })

    // ...
  }

  generate() {
    // 发射事件
    this.emit('world:generation:start')

    // 1. 生成地形
    this.updateChunks({ x: 0, z: 0 })
    this.emit('terrain:generated')

    // 2. 生成村庄
    this.generateVillages()
    this.emit('villages:generated', this.villages)

    // 3. 添加自然装饰
    this.addNaturalDecorations()
    this.emit('decorations:added')

    this.emit('world:generation:complete', this.getInfo())
  }

  requestChunkFromWorker(cx, cz, key, minCoord, maxCoord) {
    if (!this.chunkWorker) return false

    // 发射事件
    this.emit('chunk:loading', key)

    this.pendingChunks.add(key)
    this.chunkWorker.postMessage({
      type: 'generateChunk',
      payload: { chunkX: cx, chunkZ: cz, chunkKey: key }
    })
    return true
  }

  handleChunkWorkerMessage(event) {
    const { type, payload } = event.data || {}
    if (type === 'chunkData') {
      const { chunkKey } = payload
      this.pendingChunks.delete(chunkKey)
      this.chunkManager.markLoaded(chunkKey)
      this.emit('chunk:loaded', chunkKey) // 通知监听器
    }
  }
}
```

**监听事件**:

```javascript
// js/main.js
const world = new World({ scene, settings })

// 监听世界生成事件
world.on('world:generation:complete', (info) => {
  console.log('世界生成完成:', info)
})

// 监听性能事件
world.on('chunk:loading', (chunkKey) => {
  PerformanceMonitor.startTimer(`chunk:${chunkKey}`)
})

world.on('chunk:loaded', (chunkKey) => {
  PerformanceMonitor.endTimer(`chunk:${chunkKey}`)
})
```

### 1.3 拆分World职责

**当前问题**: World类承担过多职责
- Chunk管理
- 渲染协调
- 世界生成
- 事件发布

**重构方案**:

**文件**: `js/core/WorldManager.js` (新建)

```javascript
import { World } from '../class/World.js'
import { ChunkManager } from '../class/ChunkManager.js'
import { RenderCoordinator } from './RenderCoordinator.js'
import { EventEmitter } from './EventEmitter.js'

/**
 * 世界管理器 - 负责协调各个子系统
 */
export class WorldManager extends EventEmitter {
  constructor(scene, settings) {
    super()

    this.world = new World({ scene, settings })
    this.chunkManager = new ChunkManager({
      chunkSize: this.world.terrain.settings.chunkSize,
      viewDistance: settings.viewDistance || 6
    })
    this.renderCoordinator = new RenderCoordinator(scene, this.world.voxelBuilder)

    this._setupEventListeners()
  }

  _setupEventListeners() {
    // World事件 → WorldManager转发
    this.world.on('chunk:loading', (chunkKey) => {
      this.emit('chunk:loading', chunkKey)
    })

    this.world.on('chunk:loaded', (chunkKey) => {
      this.chunkManager.markLoaded(chunkKey)
      this.renderCoordinator.renderChunk(chunkKey)
      this.emit('chunk:loaded', chunkKey)
    })

    this.world.on('chunk:unloaded', (chunkKey) => {
      this.chunkManager.markUnloaded(chunkKey)
      this.renderCoordinator.unloadChunk(chunkKey)
      this.emit('chunk:unloaded', chunkKey)
    })

    this.world.on('world:generation:complete', (info) => {
      this.emit('world:ready', info)
    })
  }

  /**
   * 生成世界
   */
  generate() {
    this.world.generate()
  }

  /**
   * 更新chunk（基于玩家位置）
   * @param {Object} position
   */
  updateChunks(position) {
    const diff = this.chunkManager.diff(position)

    // 卸载chunk
    for (const key of diff.toUnload) {
      this.world.unloadChunk(key)
    }

    // 加载chunk
    for (const item of diff.toLoad) {
      const { cx, cz, key } = item
      this.world.requestChunkFromWorker(cx, cz, key)
    }
  }

  /**
   * 获取世界实例
   */
  getWorld() {
    return this.world
  }
}
```

**文件**: `js/core/RenderCoordinator.js` (新建)

```javascript
/**
 * 渲染协调器 - 专门负责渲染相关逻辑
 */
export class RenderCoordinator {
  constructor(scene, voxelBuilder) {
    this.scene = scene
    this.voxelBuilder = voxelBuilder
    this.chunkMeshes = new Map()
  }

  renderChunk(chunkKey) {
    // 先卸载旧mesh
    this.unloadChunk(chunkKey)

    const meshes = this.voxelBuilder.render(this.scene, chunkKey)
    this.chunkMeshes.set(chunkKey, meshes)
  }

  unloadChunk(chunkKey) {
    if (this.chunkMeshes.has(chunkKey)) {
      const meshes = this.chunkMeshes.get(chunkKey)
      for (const mesh of meshes) {
        this.scene.remove(mesh)
        // 释放GPU资源
        this._disposeMesh(mesh)
      }
      this.chunkMeshes.delete(chunkKey)
    }
  }

  _disposeMesh(mesh) {
    if (mesh.geometry) {
      mesh.geometry.dispose()
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        if (mat.map) mat.map.dispose()
        mat.dispose()
      })
    } else if (mesh.material) {
      if (mesh.material.map) mesh.material.map.dispose()
      mesh.material.dispose()
    }
  }

  /**
   * 清理所有资源
   */
  dispose() {
    for (const chunkKey of this.chunkMeshes.keys()) {
      this.unloadChunk(chunkKey)
    }
    this.chunkMeshes.clear()
  }
}
```

**简化后的World类**:

```javascript
// js/class/World.js (重构后)
export class World extends EventEmitter {
  constructor(options = {}) {
    super()

    this.scene = options.scene
    this.settings = {
      worldSize: options.worldSize || 128,
      villageCount: options.villageCount || 8,
      // ... 其他设置
    }

    // 只负责领域逻辑
    this.terrain = new Terrain({ ... })
    this.villages = []
    this.decorations = []
    this.voxelBuilder = new VoxelBuilder({ ... })
    this.registry = new BlockStore()
    this.blockDefs = new BlockDefinitions()

    // 移除chunk管理相关逻辑
    // 移除渲染协调相关逻辑
  }

  generate() {
    this.emit('world:generation:start')

    this.generateVillages()
    this.emit('villages:generated', this.villages)

    this.addNaturalDecorations()
    this.emit('decorations:added')

    this.emit('world:generation:complete', this.getInfo())
  }

  // 只保留领域相关方法
  generateVillages() { ... }
  addNaturalDecorations() { ... }
  getInfo() { ... }
}
```

---

## 第二阶段：性能优化 (2-3个月)

### 2.1 空间分割 - Octree实现

**目标**: 优化碰撞检测和可见性裁剪

**文件**: `js/core/Octree.js`

```javascript
/**
 * 八叉树空间分割 - 优化空间查询
 */
export class Octree {
  constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
    this.maxObjects = maxObjects
    this.maxLevels = maxLevels
    this.level = level
    this.bounds = bounds // { min: THREE.Vector3, max: THREE.Vector3 }

    this.objects = []
    this.nodes = []
  }

  /**
   * 清空树
   */
  clear() {
    this.objects = []
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i]) {
        this.nodes[i].clear()
      }
    }
    this.nodes = []
  }

  /**
   * 分割节点
   */
  split() {
    const subWidth = (this.bounds.max.x - this.bounds.min.x) / 2
    const subHeight = (this.bounds.max.y - this.bounds.min.y) / 2
    const subDepth = (this.bounds.max.z - this.bounds.min.z) / 2

    this.nodes[0] = new Octree({
      min: { x: this.bounds.min.x + subWidth, y: this.bounds.min.y, z: this.bounds.min.z + subDepth },
      max: { x: this.bounds.max.x, y: this.bounds.min.y + subHeight, z: this.bounds.max.z }
    }, this.maxObjects, this.maxLevels, this.level + 1)

    this.nodes[1] = new Octree({
      min: { x: this.bounds.min.x, y: this.bounds.min.y, z: this.bounds.min.z + subDepth },
      max: { x: this.bounds.min.x + subWidth, y: this.bounds.min.y + subHeight, z: this.bounds.max.z }
    }, this.maxObjects, this.maxLevels, this.level + 1)

    this.nodes[2] = new Octree({
      min: { x: this.bounds.min.x, y: this.bounds.min.y, z: this.bounds.min.z },
      max: { x: this.bounds.min.x + subWidth, y: this.bounds.min.y + subHeight, z: this.bounds.min.z + subDepth }
    }, this.maxObjects, this.maxLevels, this.level + 1)

    // ... 其他6个节点
  }

  /**
   * 获取对象属于哪个节点
   * @param {Object} bounds
   * @returns {number[]} 节点索引数组
   */
  getIndex(bounds) {
    const indexes = []

    const verticalMidpoint = (this.bounds.max.x + this.bounds.min.x) / 2
    const horizontalMidpoint = (this.bounds.max.y + this.bounds.min.y) / 2
    const depthMidpoint = (this.bounds.max.z + this.bounds.min.z) / 2

    const topQuadrant = bounds.min.y > horizontalMidpoint
    const bottomQuadrant = bounds.max.y < horizontalMidpoint

    if (bounds.min.x > verticalMidpoint) {
      if (bounds.min.z > depthMidpoint) {
        indexes.push(0) // 右上后
      } else if (bounds.max.z < depthMidpoint) {
        indexes.push(1) // 右前
      } else {
        indexes.push(2) // 右中
      }
    } else if (bounds.max.x < verticalMidpoint) {
      if (bounds.min.z > depthMidpoint) {
        indexes.push(3) // 左上后
      } else if (bounds.max.z < depthMidpoint) {
        indexes.push(4) // 左前
      } else {
        indexes.push(5) // 左中
      }
    } else {
      if (bounds.min.z > depthMidpoint) {
        indexes.push(6) // 中上后
      } else if (bounds.max.z < depthMidpoint) {
        indexes.push(7) // 中前
      } else {
        indexes.push(8) // 中中
      }
    }

    return indexes
  }

  /**
   * 插入对象
   * @param {Object} object
   */
  insert(object) {
    if (this.nodes.length > 0) {
      const index = this.getIndex(object.bounds)

      for (let i = 0; i < index.length; i++) {
        const nodeIndex = index[i]
        if (this.nodes[nodeIndex]) {
          this.nodes[nodeIndex].insert(object)
          return
        }
      }
    }

    this.objects.push(object)

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split()
      }

      let i = 0
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i].bounds)
        if (index.length === 1 && this.nodes[index[0]]) {
          this.nodes[index[0]].insert(this.objects.splice(i, 1)[0])
        } else {
          i++
        }
      }
    }
  }

  /**
   * 检索可能碰撞的对象
   * @param {Object} bounds
   * @returns {Array}
   */
  retrieve(bounds) {
    const returnObjects = this.objects.slice()

    if (this.nodes.length > 0) {
      const index = this.getIndex(bounds)
      for (let i = 0; i < index.length; i++) {
        if (this.nodes[index[i]]) {
          returnObjects.push(...this.nodes[index[i]].retrieve(bounds))
        }
      }
    }

    return returnObjects
  }
}
```

### 2.2 视锥体裁剪

**文件**: `js/core/FrustumCuller.js`

```javascript
/**
 * 视锥体裁剪 - 减少不必要的渲染
 */
export class FrustumCuller {
  constructor(camera) {
    this.camera = camera
    this.frustum = new THREE.Frustum()
    this.projScreenMatrix = new THREE.Matrix4()
  }

  /**
   * 更新视锥体
   */
  update() {
    this.camera.updateMatrixWorld()
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse)

    this.projScreenMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    )

    this.frustum.setFromProjectionMatrix(this.projScreenMatrix)
  }

  /**
   * 检查对象是否在视锥体内
   * @param {THREE.Object3D} object
   * @returns {boolean}
   */
  isInFrustum(object) {
    if (!object.geometry) return false

    const geometry = object.geometry
    const matrix = object.matrixWorld

    // 对于InstancedMesh，检查实例边界
    if (object.isInstancedMesh) {
      return this._checkInstancedMesh(object, matrix)
    }

    // 对于普通网格，检查包围球
    const sphere = geometry.boundingSphere
    if (!sphere) {
      geometry.computeBoundingSphere()
    }

    const center = sphere.center.clone().applyMatrix4(matrix)
    const radius = sphere.radius

    return this.frustum.intersectsSphere(new THREE.Sphere(center, radius))
  }

  /**
   * 检查InstancedMesh
   * @param {THREE.InstancedMesh} mesh
   * @param {THREE.Matrix4} matrix
   */
  _checkInstancedMesh(mesh, matrix) {
    // 简化版：检查整个实例组是否在视锥体内
    const sphere = new THREE.Sphere()
    sphere.copy(mesh.geometry.boundingSphere)
    sphere.applyMatrix4(matrix)

    return this.frustum.intersectsSphere(sphere)
  }

  /**
   * 裁剪chunk
   * @param {Array} chunks
   * @returns {Array} 可见的chunk
   */
  cullChunks(chunks) {
    this.update()
    return chunks.filter(chunk => this.isInFrustum(chunk.mesh))
  }
}
```

---

## 第三阶段：插件系统 (3-4个月)

### 3.1 插件管理器

**文件**: `js/core/PluginManager.js`

```javascript
/**
 * 插件管理器 - 支持动态加载插件
 */
export class PluginManager extends EventEmitter {
  constructor(container) {
    super()
    this.container = container
    this.plugins = new Map()
    this.hooks = new Map()
  }

  /**
   * 注册插件
   * @param {string} name
   * @param {Object} plugin
   */
  register(name, plugin) {
    if (!plugin.initialize) {
      throw new Error(`Plugin ${name} must have initialize method`)
    }

    if (this.plugins.has(name)) {
      console.warn(`Plugin ${name} already registered, replacing...`)
    }

    this.plugins.set(name, plugin)

    // 执行初始化
    const context = {
      container: this.container,
      hooks: this.hooks,
      emit: this.emit.bind(this)
    }

    plugin.initialize(context)

    this.emit('plugin:registered', name)
    console.log(`Plugin registered: ${name}`)
  }

  /**
   * 注销插件
   * @param {string} name
   */
  unregister(name) {
    const plugin = this.plugins.get(name)
    if (plugin && plugin.dispose) {
      plugin.dispose()
    }

    this.plugins.delete(name)
    this.emit('plugin:unregistered', name)
  }

  /**
   * 注册钩子
   * @param {string} event
   * @param {Function} callback
   */
  hook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, [])
    }
    this.hooks.get(event).push(callback)
  }

  /**
   * 执行钩子
   * @param {string} event
   * @param {...any} args
   */
  executeHook(event, ...args) {
    if (!this.hooks.has(event)) return

    const hooks = this.hooks.get(event)
    for (const hook of hooks) {
      hook(...args)
    }
  }

  /**
   * 列出所有插件
   * @returns {Array}
   */
  listPlugins() {
    return Array.from(this.plugins.keys())
  }
}
```

### 3.2 示例插件

**文件**: `js/plugins/FogPlugin.js`

```javascript
/**
 * 雾效插件 - 动态调整雾效
 */
export const FogPlugin = {
  name: 'fog',

  initialize({ container, hooks }) {
    // 注册钩子
    hooks.push(['world:generation:complete', this._onWorldReady.bind(this)])
    hooks.push(['render:update', this._onRenderUpdate.bind(this)])

    this.container = container
    this.fogDensity = 0.001
  },

  _onWorldReady(worldInfo) {
    // 根据世界大小调整雾效
    const scene = this.container.get('World').scene
    const fog = new THREE.FogExp2(0x87CEEB, this.fogDensity)
    scene.fog = fog
  },

  _onRenderUpdate(delta) {
    // 动态调整雾效（基于玩家高度）
    const world = this.container.get('World')
    if (world && world.player) {
      const height = world.player.position.y
      const density = 0.001 + Math.max(0, height - 20) * 0.0001
      if (world.scene.fog) {
        world.scene.fog.density = density
      }
    }
  },

  dispose() {
    // 清理资源
  }
}
```

**文件**: `js/plugins/DayNightCyclePlugin.js`

```javascript
/**
 * 昼夜循环插件 - 动态光照
 */
export const DayNightCyclePlugin = {
  name: 'dayNight',

  initialize({ container, hooks }) {
    this.container = container
    this.time = 0 // 0-24小时
    this.dayLength = 60 // 一天60秒

    hooks.push(['render:update', this._onUpdate.bind(this)])
  },

  _onUpdate(delta) {
    // 更新时间
    this.time = (this.time + delta * 24 / this.dayLength) % 24

    const world = this.container.get('World')
    if (world && world.scene) {
      // 计算光照强度
      const lightIntensity = this._calculateLightIntensity()
      const lightColor = this._calculateLightColor()

      // 更新光照
      const dirLight = world.scene.children.find(
        child => child.type === 'DirectionalLight'
      )

      if (dirLight) {
        dirLight.intensity = lightIntensity
        dirLight.color.setHex(lightColor)
      }
    }
  },

  _calculateLightIntensity() {
    if (this.time < 6 || this.time > 18) {
      return 0.1 // 夜晚
    } else if (this.time < 7 || this.time > 17) {
      return 0.3 // 黎明/黄昏
    } else {
      return 1.0 // 白天
    }
  },

  _calculateLightColor() {
    if (this.time < 6 || this.time > 18) {
      return 0x4a5a8a // 夜晚（蓝色）
    } else if (this.time < 7 || this.time > 17) {
      return 0xffaa66 // 黎明/黄昏（橙色）
    } else {
      return 0xffffff // 白天（白色）
    }
  },

  dispose() {
    // 恢复默认光照
  }
}
```

---

## 第四阶段：测试与文档 (4-5个月)

### 4.1 单元测试框架

**文件**: `test/unit/terrain.test.js`

```javascript
import { Terrain } from '../../src/js/class/Terrain.js'
import { container } from '../../src/js/core/Container.js'

// 注册测试依赖
container.register('Random', () => ({
  float: () => 0.5,
  int: () => 5,
  range: () => 0.5
}))

describe('Terrain', () => {
  let terrain

  beforeEach(() => {
    terrain = new Terrain({
      seed: 'test-seed',
      worldSize: 128,
      waterLevel: -5
    })
  })

  describe('height calculation', () => {
    test('should return deterministic heights', () => {
      const h1 = terrain.getHeight(10, 20)
      const h2 = terrain.getHeight(10, 20)
      expect(h1).toBe(h2)
    })

    test('should vary with different coordinates', () => {
      const h1 = terrain.getHeight(10, 20)
      const h2 = terrain.getHeight(10, 21)
      expect(h1).not.toBe(h2)
    })

    test('should respect world boundaries', () => {
      expect(() => {
        terrain.getHeight(1000, 1000)
      }).not.toThrow()
    })
  })

  describe('biome classification', () => {
    test('should classify ocean biome', () => {
      // Mock height below water level
      const biome = terrain.getBiome(0, 0)
      expect(['ocean', 'beach']).toContain(biome.name)
    })

    test('should return valid climate values', () => {
      const biome = terrain.getBiome(50, 50)
      expect(biome.temperature).toBeGreaterThanOrEqual(0)
      expect(biome.temperature).toBeLessThanOrEqual(1)
      expect(biome.moisture).toBeGreaterThanOrEqual(0)
      expect(biome.moisture).toBeLessThanOrEqual(1)
    })
  })

  describe('block type generation', () => {
    test('should return correct surface block', () => {
      const type = terrain.getSurfaceBlockType(0, 0)
      expect(type).toBeOneOf(['grass', 'sand', 'snow'])
    })

    test('should not return water for surface blocks', () => {
      const type = terrain.getSurfaceBlockType(0, 0)
      expect(type).not.toBe('water')
    })
  })
})
```

### 4.2 集成测试

**文件**: `test/integration/world-generation.test.js`

```javascript
import { World } from '../../src/js/class/World.js'
import { container } from '../../src/js/core/Container.js'

describe('World Generation Integration', () => {
  let world
  let scene

  beforeEach(() => {
    scene = new THREE.Scene()
    container.register('Scene', () => scene)

    world = new World({
      scene,
      settings: {
        worldSize: 64,
        villageCount: 2,
        treeCount: 50
      }
    })
  })

  test('should generate complete world', async () => {
    const generationPromise = new Promise((resolve) => {
      world.on('world:generation:complete', (info) => {
        resolve(info)
      })
    })

    world.generate()

    const info = await generationPromise
    expect(info.villageCount).toBeGreaterThan(0)
    expect(info.decorationCount).toBeGreaterThan(0)
  })

  test('should handle chunk loading/unloading', () => {
    world.generate()

    const initialLoaded = world.chunkManager.loaded.size
    expect(initialLoaded).toBeGreaterThan(0)

    // 移动玩家位置
    world.updateChunks({ x: 100, z: 0 })

    // 应该卸载旧的chunk，加载新的
    const afterUpdate = world.chunkManager.loaded.size
    expect(afterUpdate).toBeGreaterThan(0)
  })

  test('should emit events during generation', (done) => {
    const events = []

    world.on('terrain:generated', () => events.push('terrain'))
    world.on('villages:generated', () => events.push('villages'))
    world.on('decorations:added', () => events.push('decorations'))
    world.on('world:generation:complete', () => {
      events.push('complete')
      expect(events).toEqual(['terrain', 'villages', 'decorations', 'complete'])
      done()
    })

    world.generate()
  })
})
```

### 4.3 性能测试

**文件**: `test/performance/chunk-generation.test.js`

```javascript
describe('Chunk Generation Performance', () => {
  test('chunk generation should complete within 100ms', async () => {
    const terrain = new Terrain({ worldSize: 128, seed: 'perf-test' })
    const start = performance.now()

    // 生成多个chunk
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 5; z++) {
        terrain.generateChunk(null, x, z, -64, 63)
      }
    }

    const duration = performance.now() - start
    expect(duration).toBeLessThan(100)
  })

  test('memory usage should be stable', async () => {
    const world = new World({ scene: new THREE.Scene(), settings: { worldSize: 64 } })
    const initialMemory = performance.memory?.usedJSHeapSize || 0

    // 生成世界
    world.generate()

    // 加载卸载chunk多次
    for (let i = 0; i < 10; i++) {
      world.updateChunks({ x: i * 20, z: 0 })
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory

    // 内存增长不应超过100MB
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
  })
})
```

---

## 第五阶段：生产就绪 (5-6个月)

### 5.1 性能监控系统

**文件**: `js/core/PerformanceMonitor.js`

```javascript
/**
 * 性能监控 - 生产环境指标收集
 */
export class PerformanceMonitor {
  static metrics = {
    chunks: {
      generated: 0,
      loaded: 0,
      unloaded: 0,
      avgLoadTime: 0
    },
    render: {
      fps: 0,
      frameTime: 0,
      drawCalls: 0
    },
    memory: {
      usedHeap: 0,
      totalHeap: 0
    }
  }

  static observers = []

  /**
   * 开始性能测量
   * @param {string} name
   * @returns {number} measurement id
   */
  static startMeasure(name) {
    const id = performance.now()
    this.observers.push({ name, start: id, end: null })
    return id
  }

  /**
   * 结束性能测量
   * @param {number} id
   * @returns {number} duration in ms
   */
  static endMeasure(id) {
    const observer = this.observers.find(o => o.start === id && o.end === null)
    if (observer) {
      observer.end = performance.now()
      const duration = observer.end - observer.start

      // 记录到指标
      this._recordMetric(observer.name, duration)

      return duration
    }
    return 0
  }

  static _recordMetric(name, value) {
    // 更新相关指标
    if (name.startsWith('chunk:load')) {
      this.metrics.chunks.avgLoadTime =
        (this.metrics.chunks.avgLoadTime * this.metrics.chunks.loaded + value) /
        (this.metrics.chunks.loaded + 1)
      this.metrics.chunks.loaded++
    }
  }

  /**
   * 获取性能报告
   */
  static getReport() {
    const memory = performance.memory ? {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
    } : 'N/A'

    return {
      chunks: this.metrics.chunks,
      memory,
      timestamp: Date.now()
    }
  }

  /**
   * 导出性能数据
   */
  static exportData() {
    const data = {
      metrics: this.metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    }

    // 发送到监控服务器（如果有）
    if (window.MONITORING_ENDPOINT) {
      fetch(window.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    }

    return data
  }
}
```

### 5.2 错误追踪系统

**文件**: `js/core/ErrorTracker.js`

```javascript
/**
 * 错误追踪 - 收集和分析错误
 */
export class ErrorTracker {
  static errors = []
  static maxErrors = 100

  /**
   * 记录错误
   * @param {Error} error
   * @param {Object} context
   */
  static record(error, context = {}) {
    const errorInfo = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.errors.push(errorInfo)

    // 限制错误数量
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // 发送到错误监控服务
    this._sendToService(errorInfo)

    // 控制台输出
    console.error('[ErrorTracker]', errorInfo)
  }

  static _sendToService(errorInfo) {
    if (window.ERROR_TRACKING_ENDPOINT) {
      fetch(window.ERROR_TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo)
      }).catch(err => {
        console.warn('Failed to send error to tracking service:', err)
      })
    }
  }

  /**
   * 获取错误报告
   */
  static getReport() {
    const grouped = this.errors.reduce((acc, error) => {
      const key = error.message
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          examples: []
        }
      }
      acc[key].count++
      if (acc[key].examples.length < 3) {
        acc[key].examples.push({
          timestamp: error.timestamp,
          stack: error.stack
        })
      }
      return acc
    }, {})

    return {
      total: this.errors.length,
      unique: Object.keys(grouped).length,
      grouped,
      lastError: this.errors[this.errors.length - 1]
    }
  }

  /**
   * 设置全局错误处理器
   */
  static setupGlobalHandler() {
    window.addEventListener('error', (event) => {
      this.record(event.error, {
        type: 'window:error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.record(new Error(event.reason), {
        type: 'unhandledrejection'
      })
    })
  }
}
```

---

## 总结

### 实施时间表

```
Month 1: 架构重构
├─ Week 1: IoC容器实现
├─ Week 2: 事件系统建立
├─ Week 3: World职责拆分
└─ Week 4: 测试与优化

Month 2-3: 性能优化
├─ Week 1-2: Octree空间分割
├─ Week 3-4: 视锥体裁剪
├─ Week 5-6: 渲染优化
└─ Week 7-8: 内存管理

Month 3-4: 插件系统
├─ Week 1-2: 插件管理器
├─ Week 3-4: 核心插件开发
├─ Week 5-6: API设计
└─ Week 7-8: 文档编写

Month 4-5: 测试与文档
├─ Week 1-2: 单元测试
├─ Week 3-4: 集成测试
├─ Week 5-6: 性能测试
└─ Week 7-8: 文档完善

Month 5-6: 生产就绪
├─ Week 1-2: 监控系统
├─ Week 3-4: 错误追踪
├─ Week 5-6: 部署准备
└─ Week 7-8: 上线验收
```

### 关键指标

| 阶段 | 性能指标 | 代码质量 | 测试覆盖率 |
|------|----------|----------|------------|
| 当前 | 30-45 FPS | B | <20% |
| 阶段1 | 50-60 FPS | B+ | 40% |
| 阶段2 | 60 FPS | A- | 60% |
| 阶段3 | 60 FPS | A | 70% |
| 阶段4 | 60 FPS | A | 80% |
| 阶段5 | 60 FPS | A+ | 85% |

### 资源需求

- **人力**: 2-3名全职开发者
- **时间**: 6个月
- **测试设备**: 多种性能配置电脑
- **监控服务**: 错误追踪 + 性能监控

### 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 架构重构失败 | 中 | 高 | 渐进式重构，保持向后兼容 |
| 性能未达预期 | 中 | 中 | 性能基准测试，持续优化 |
| 团队知识不足 | 低 | 中 | 培训 + 外部咨询 |
| 进度延期 | 中 | 中 | 里程碑管理，优先级调整 |

### 预期收益

1. **性能提升**: 60FPS稳定运行
2. **可维护性**: 模块化设计，易于扩展
3. **稳定性**: 完善的错误处理和监控
4. **可测试性**: 80%+测试覆盖率
5. **用户体验**: 流畅的渲染和交互

---

**下一步行动**:

1. ✅ 制定详细开发计划
2. ⏳ 分配团队成员
3. ⏳ 建立开发环境
4. ⏳ 每周进度同步
5. ⏳ 月度评审

本规划将确保项目在6个月内达到生产就绪状态。
