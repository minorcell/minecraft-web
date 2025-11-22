import * as THREE from 'three'
import { Terrain } from './Terrain.js'
import { VoxelBuilder } from '../voxel.js'
import { Village } from './Village.js'
import { Decoration } from './Decoration.js'
import { SeededRandom } from './Random.js'
import { ChunkManager } from './ChunkManager.js'
import { BlockStore } from './BlockStore.js'
import { BlockDefinitions } from './BlockDefinitions.js'
import { EventBus } from '../core/EventBus.js'
import { RenderCoordinator } from '../core/RenderCoordinator.js'
import { WorkerCoordinator } from '../core/WorkerCoordinator.js'

/**
 * 世界类 - 管理整个游戏世界
 */
export class World {
    /**
     * @param {object} options
     * @param {THREE.Scene} options.scene - Three.js场景
     * @param {object} options.settings - 世界设置
     */
    constructor(options = {}) {
        this.scene = options.scene
        this.settings = {
            worldSize: options.worldSize || 128,
            villageCount: options.villageCount || 8,
            treeCount: options.treeCount || 520,
            grassCount: options.grassCount || 1000,
            seed: options.seed || Date.now(),
            ...options.settings
        }

        // 世界级随机源，确保生成可重现
        this.seed = this.settings.seed
        this.random = new SeededRandom(this.seed)

        // 初始化系统
        this.blockDefs = new BlockDefinitions()
        this.registry = new BlockStore()
        this.terrain = new Terrain({
            worldSize: this.settings.worldSize,
            bottomLevel: -10,
            waterLevel: -4,
            sandLevel: -3,
            snowLevel: 12,
            groundDepth: 10,
            seed: this.seed
        })

        this.voxelBuilder = new VoxelBuilder({
            seed: this.seed,
            chunkSize: this.terrain.settings.chunkSize,
            registry: this.registry,
            blockDefs: this.blockDefs
        })
        this.villages = []
        this.decorations = []
        this.chunkManager = new ChunkManager({
            chunkSize: this.terrain.settings.chunkSize,
            viewDistance: options.viewDistance || 6
        })
        this.events = new EventBus()
        this.renderCoordinator = new RenderCoordinator(this.scene, this.voxelBuilder)
        this.workerCoordinator = new WorkerCoordinator({
            terrainSettings: this.terrain.getSettings(),
            blockIds: this.blockDefs.getAllIds(),
            onChunkData: (payload) => this.applyChunkData(payload),
            onDecorData: (payload) => this.applyDecorData(payload),
            onError: (msg) => console.error(msg)
        })
        this.useChunkWorker = true
        this.useDecorWorker = true
        // 碰撞检测
        this.occupied = new Set()
        this.lastChunkCheckPos = null
        this.lastChunkCheckChunk = null
        this.chunkCheckThreshold = this.terrain.settings.chunkSize * 0.45
        this.lastChunkCheckTime = 0
        this.chunkCheckInterval = 0.12 // seconds
        this.maxChunkRequestsPerTick = 4
        this.lowDetailRadius = this.terrain.settings.chunkSize * Math.max(1, (this.chunkManager.viewDistance - 2))
    }

    applyChunkData(payload) {
        const { chunkKey } = payload
        if (payload.blocks) {
            for (const block of payload.blocks) {
                this.voxelBuilder.addBlock(block.type, block.x, block.y, block.z, null, chunkKey)
            }
        } else if (payload.xs && payload.ys && payload.zs && payload.types) {
            const ids = payload.blockIds && payload.blockIds.length ? payload.blockIds : this.blockDefs.getAllIds()
            const { xs, ys, zs, types } = payload
            const len = types.length
            for (let i = 0; i < len; i++) {
                const type = ids[types[i]] || ids[0]
                this.voxelBuilder.addBlock(type, xs[i], ys[i], zs[i], null, chunkKey)
            }
        }
        this.chunkManager.markLoaded(chunkKey)
        this.renderChunk(chunkKey)
        this.events.emit('chunk:loaded', chunkKey)
    }

    applyDecorData(payload) {
        const affectedChunks = new Set()
        const blocks = payload?.blocks || []
        for (const block of blocks) {
            this.voxelBuilder.addBlock(block.type, block.x, block.y, block.z, null, block.chunkKey)
            if (block.chunkKey) {
                affectedChunks.add(block.chunkKey)
            }
        }

        if (Array.isArray(payload?.decorations)) {
            this.decorations.push(...payload.decorations)
        }

        for (const chunkKey of affectedChunks) {
            if (this.chunkManager.loaded.has(chunkKey)) {
                this.renderChunk(chunkKey)
            }
        }
        this.events.emit('decorations:generated', { blocks: blocks.length, decorations: payload?.decorations?.length || 0 })
    }

    /**
     * 向worker请求生成chunk
     */
    requestChunkFromWorker(cx, cz, key, minCoord, maxCoord) {
        if (!this.useChunkWorker) return false
        this.events.emit('chunk:requested', key)
        return this.workerCoordinator.requestChunk(cx, cz, key, minCoord, maxCoord, this.terrain.getSettings())
    }

    /**
     * 请求装饰/树生成，成功则返回true
     */
    requestDecorationsFromWorker() {
        if (!this.useDecorWorker) return false

        const villages = this.villages.map(v => ({ x: v.x, z: v.z, radius: v.radius }))
        const flowerCount = Math.floor(this.settings.grassCount * 0.25)
        const cactusCount = Math.floor(this.settings.treeCount * 0.3)
        const ok = this.workerCoordinator.requestDecorations({
            seed: this.seed,
            worldSize: this.settings.worldSize,
            terrainSettings: this.terrain.getSettings(),
            counts: {
                grassCount: this.settings.grassCount,
                treeCount: this.settings.treeCount,
                flowerCount,
                cactusCount
            },
            villages
        })
        if (ok) this.events.emit('decorations:requested')
        return ok
    }

    /**
     * 生成整个世界
     */
    generate() {
        console.time('World Generation')
        this.events.emit('world:start')

        // 1. 生成地形（初始视距范围）
        this.updateChunks({ x: 0, z: 0 })

        // 2. 生成村庄
        this.generateVillages()

        // 3. 添加自然装饰
        this.addNaturalDecorations()

        // 4. 刷新已加载chunk的渲染，包含建筑/装饰
        this.render()

        console.timeEnd('World Generation')
        this.events.emit('world:ready', this.getInfo())
    }

    /**
     * 生成地形
     */
    generateTerrain() {
        this.terrain.generateTerrain(this.voxelBuilder)
    }

    /**
     * 生成所有村庄
     */
    generateVillages() {
        console.log(`Generating ${this.settings.villageCount} villages...`)

        for (let i = 0; i < this.settings.villageCount; i++) {
            // 生成村庄位置
            const centerX = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 1.5)
            const centerZ = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 1.5)
            const centerY = this.terrain.getHeight(centerX, centerZ)
            const biome = this.terrain.getBiome(centerX, centerZ).name

            // 只在陆地上生成村庄
            if (!this.terrain.isUnderwater(centerX, centerZ)) {
                const radius = 20 + this.random.int(0, 15)
                const village = new Village({
                    x: centerX,
                    y: centerY,
                    z: centerZ,
                    radius: radius,
                    biome: biome,
                    random: this.random.cloneWithOffset(i + 1)
                })

                village.generate(this.terrain, this.voxelBuilder)
                this.villages.push(village)
            }
        }

        console.log(`Generated ${this.villages.length} villages`)
    }

    /**
     * 添加自然装饰（树、草等）
     */
    addNaturalDecorations() {
        console.log('Adding natural decorations...')

        // 优先使用 worker 异步生成
        if (this.useDecorWorker && this.requestDecorationsFromWorker()) {
            console.log('Natural decorations requested via worker...')
            return
        }

        console.error('Decor worker unavailable; decorations not generated.')
    }

    /**
     * 添加草丛
     */
    addGrass() {
        for (let i = 0; i < this.settings.grassCount; i++) {
            const x = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const z = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const y = this.terrain.getHeight(x, z)
            const biome = this.terrain.getBiome(x, z)

            // 只在草地上添加草丛
            if (y > this.terrain.settings.waterLevel &&
                y < this.terrain.settings.snowLevel &&
                !this.terrain.isUnderwater(x, z) &&
                !['desert', 'beach', 'snow'].includes(biome.name)) {

                const grass = new Decoration.Grass(x, y, z, this.random)
                grass.build(this.voxelBuilder, this.terrain)
                this.decorations.push(grass)
            }
        }
    }

    /**
     * 添加花簇 - 平原/森林
     */
    addFlowers() {
        const flowerTarget = Math.floor(this.settings.grassCount * 0.25)
        for (let i = 0; i < flowerTarget; i++) {
            const x = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const z = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const y = this.terrain.getHeight(x, z)
            const biome = this.terrain.getBiome(x, z)

            if (['plains', 'forest'].includes(biome.name) &&
                y > this.terrain.settings.waterLevel &&
                !this.terrain.isUnderwater(x, z)) {
                const flower = new Decoration.FlowerCluster(x, y, z, this.random)
                flower.build(this.voxelBuilder, this.terrain)
                this.decorations.push(flower)
            }
        }
    }

    /**
     * 添加仙人掌 - 沙漠
     */
    addCactus() {
        const cactusTarget = Math.floor(this.settings.treeCount * 0.3)
        let cactusCount = 0
        for (let i = 0; i < cactusTarget; i++) {
            const x = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const z = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const y = this.terrain.getHeight(x, z)
            const biome = this.terrain.getBiome(x, z)

            if (biome.name === 'desert' &&
                y > this.terrain.settings.waterLevel &&
                !this.terrain.isUnderwater(x, z)) {
                const cactus = new Decoration.Cactus(x, y, z, this.random)
                cactus.build(this.voxelBuilder, this.terrain)
                this.decorations.push(cactus)
                cactusCount++
            }
        }
        console.log(`Generated ${cactusCount} cacti`)
    }

    /**
     * 添加树木
     */
    addTrees() {
        let treeCount = 0
        for (let i = 0; i < this.settings.treeCount; i++) {
            const x = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const z = Math.floor((this.random.float() - 0.5) * this.settings.worldSize * 2)
            const y = this.terrain.getHeight(x, z)

            if (y > this.terrain.settings.waterLevel && !this.terrain.isUnderwater(x, z)) {
                const biome = this.terrain.getBiome(x, z)
                // 沙漠/海滩/雪原减少树木
                if (['desert', 'beach', 'snow'].includes(biome.name)) {
                    continue
                }

                // 避免在村庄附近生成树
                if (!this.isNearVillage(x, z, 25)) {
                    const style = this.getTreeStyle(biome.name, this.random)
                    const tree = new Decoration.Tree(x, y, z, this.random, style)
                    tree.build(this.voxelBuilder, this.terrain)
                    this.decorations.push(tree)
                    treeCount++
                }
            }
        }

        console.log(`Generated ${treeCount} trees`)
    }

    /**
     * 根据生物群系选择树型
     * @param {string} biome
     * @param {SeededRandom} rand
     * @returns {'oak'|'spruce'|'shrub'}
     */
    getTreeStyle(biome, rand) {
        if (biome === 'taiga' || biome === 'snow') {
            return 'spruce'
        }
        if (biome === 'desert') {
            return 'shrub'
        }
        // 森林或平原：小概率云杉
        return rand.float() > 0.8 ? 'spruce' : 'oak'
    }

    /**
     * 检查位置是否靠近村庄
     * @param {number} x
     * @param {number} z
     * @param {number} minDistance
     * @returns {boolean}
     */
    isNearVillage(x, z, minDistance = 20) {
        for (const village of this.villages) {
            const distance = Math.sqrt((x - village.x) ** 2 + (z - village.z) ** 2)
            if (distance < minDistance + village.radius) {
                return true
            }
        }
        return false
    }

    /**
     * 渲染世界
     */
    render() {
        // 渲染已加载的chunk
        for (const key of this.chunkManager.loaded) {
            this.renderChunk(key)
        }
    }

    /**
     * 渲染指定chunk
     * @param {string} chunkKey
     */
    renderChunk(chunkKey) {
        this.renderCoordinator.renderChunk(chunkKey)
    }

    /**
     * 卸载chunk：从场景移除mesh（保留数据以便再次渲染）
     * @param {string} chunkKey
     */
    unloadChunk(chunkKey) {
        this.renderCoordinator.unloadChunk(chunkKey)
    }

    /**
     * 更新视野内chunk：根据相机位置加载/卸载
     * @param {{x:number,z:number}} position
     */
    updateChunks(position, forward = null) {
        if (!position) return
        const now = performance?.now ? performance.now() : Date.now()
        if (this.lastChunkCheckTime && (now - this.lastChunkCheckTime) < this.chunkCheckInterval * 1000) {
            return
        }
        const { chunkSize } = this.terrain.settings
        const currentChunk = {
            cx: Math.floor(position.x / chunkSize),
            cz: Math.floor(position.z / chunkSize)
        }

        if (this.lastChunkCheckChunk &&
            this.lastChunkCheckChunk.cx === currentChunk.cx &&
            this.lastChunkCheckChunk.cz === currentChunk.cz &&
            this.lastChunkCheckPos) {
            const dx = position.x - this.lastChunkCheckPos.x
            const dz = position.z - this.lastChunkCheckPos.z
            const distSq = dx * dx + dz * dz
            if (distSq < this.chunkCheckThreshold * this.chunkCheckThreshold) {
                return
            }
        }

        this.lastChunkCheckPos = new THREE.Vector3(position.x, 0, position.z)
        this.lastChunkCheckChunk = currentChunk
        this.lastChunkCheckTime = now
        const diff = this.chunkManager.diff(new THREE.Vector3(position.x, 0, position.z))
        const minCoord = -this.settings.worldSize
        const maxCoord = this.settings.worldSize - 1

        // 卸载
        for (const key of diff.toUnload) {
            this.unloadChunk(key)
            this.chunkManager.markUnloaded(key)
            this.workerCoordinator.pendingChunks.delete(key)
            this.events.emit('chunk:unloaded', key)
            // 保留数据（未调用clearChunk），以便重新渲染
        }

        // 加载：按距离排序，限制每次请求数量，缓解抖动
        const fwd = forward ? new THREE.Vector3(forward.x, 0, forward.z).normalize() : null
        const sortedLoads = diff.toLoad
            .map(item => {
                const centerX = (item.cx + 0.5) * this.terrain.settings.chunkSize
                const centerZ = (item.cz + 0.5) * this.terrain.settings.chunkSize
                const dx = centerX - position.x
                const dz = centerZ - position.z
                const distSq = dx * dx + dz * dz
                let score = distSq
                if (fwd) {
                    const dir = new THREE.Vector3(dx, 0, dz).normalize()
                    const dot = Math.max(-1, Math.min(1, dir.dot(fwd)))
                    const bias = 1 - dot // 0 前方, 2 后方
                    score = distSq * (1 + 0.35 * bias)
                }
                return { ...item, distSq, score }
            })
            .sort((a, b) => a.score - b.score)

        let issued = 0
        for (const item of sortedLoads) {
            if (issued >= this.maxChunkRequestsPerTick) break
            const { cx, cz, key } = item
            const startX = cx * this.terrain.settings.chunkSize
            const startZ = cz * this.terrain.settings.chunkSize
            // 边界检查，限制在 worldSize 范围内
            if (startX < minCoord || startX > maxCoord || startZ < minCoord || startZ > maxCoord) {
                continue
            }

            // 优先使用worker生成
            const lowDetail = item.distSq > this.lowDetailRadius * this.lowDetailRadius
            if (this.useChunkWorker && this.requestChunkFromWorker(cx, cz, key, minCoord, maxCoord, { lowDetail })) {
                issued++
                continue
            }

            console.error('Chunk worker unavailable; chunk not generated', key)
        }
    }

    /**
     * 基于方块坐标刷新所在chunk
     * @param {number} x
     * @param {number} z
     */
    refreshChunkAt(x, z) {
        const key = this.voxelBuilder.getChunkKeyFromPosition(x, z)
        this.renderChunk(key)
    }

    /**
     * 获取世界信息
     * @returns {object}
     */
    getInfo() {
        return {
            settings: this.settings,
            seed: this.seed,
            villageCount: this.villages.length,
            decorationCount: this.decorations.length,
            terrainSettings: this.terrain.getSettings()
        }
    }

    /**
     * 获取所有村庄
     * @returns {Village[]}
     */
    getVillages() {
        return [...this.villages]
    }

    /**
     * 获取村庄统计信息
     * @returns {object}
     */
    getVillageStats() {
        const stats = {
            totalVillages: this.villages.length,
            totalBuildings: 0,
            buildingTypes: {}
        }

        for (const village of this.villages) {
            const villageStats = village.getBuildingStats()
            for (const [type, count] of Object.entries(villageStats)) {
                stats.buildingTypes[type] = (stats.buildingTypes[type] || 0) + count
                stats.totalBuildings += count
            }
        }

        return stats
    }

    /**
     * 更新世界设置
     * @param {object} newSettings
     */
    updateSettings(newSettings) {
        const seedChanged = newSettings.seed !== undefined && newSettings.seed !== this.settings.seed
        this.settings = { ...this.settings, ...newSettings }

        if (seedChanged) {
            // 重新配置世界随机源
            this.seed = this.settings.seed
            this.random = new SeededRandom(this.seed)
            this.terrain.updateSettings({ seed: this.seed })
            this.voxelBuilder = new VoxelBuilder({
                seed: this.seed,
                chunkSize: this.terrain.settings.chunkSize,
                registry: this.registry,
                blockDefs: this.blockDefs
            })
            this.renderCoordinator = new RenderCoordinator(this.scene, this.voxelBuilder)
            this.workerCoordinator = new WorkerCoordinator({
                terrainSettings: this.terrain.getSettings(),
                onChunkData: (payload) => this.applyChunkData(payload),
                onDecorData: (payload) => this.applyDecorData(payload),
                onError: (msg) => console.error(msg)
            })
        }

        // 如果地形设置改变，更新地形
        if (newSettings.terrain) {
            this.terrain.updateSettings(newSettings.terrain)
            this.workerCoordinator.terrainSettings = this.terrain.getSettings()
        }
    }

    /**
     * 清空世界（用于重建）
     */
    clear() {
        this.villages = []
        this.decorations = []
        this.occupied.clear()
        this.voxelBuilder.clearAll()
        this.renderCoordinator.clear()
        this.chunkManager.loaded.clear()
        this.workerCoordinator.clear()
    }

    /**
     * 重建世界
     */
    rebuild() {
        console.log('Rebuilding world...')
        this.clear()
        this.generate()
    }
}
