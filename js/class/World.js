import * as THREE from 'three'
import { Terrain } from './Terrain.js'
import { VoxelBuilder } from '../voxel.js'
import { Village } from './Village.js'
import { Decoration } from './Decoration.js'
import { SeededRandom } from './Random.js'
import { ChunkManager } from './ChunkManager.js'
import { BlockStore } from './BlockStore.js'
import { BlockDefinitions } from './BlockDefinitions.js'

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
            treeCount: options.treeCount || 150,
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
        this.chunkMeshes = new Map()

        // 碰撞检测
        this.occupied = new Set()
    }

    /**
     * 生成整个世界
     */
    generate() {
        console.time('World Generation')

        // 1. 生成地形（初始视距范围）
        this.updateChunks({ x: 0, z: 0 })

        // 2. 生成村庄
        this.generateVillages()

        // 3. 添加自然装饰
        this.addNaturalDecorations()

        // 4. 刷新已加载chunk的渲染，包含建筑/装饰
        this.render()

        console.timeEnd('World Generation')
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

        // 添加草丛
        this.addGrass()

        // 添加树木
        this.addTrees()

        // 添加花簇
        this.addFlowers()

        // 添加仙人掌
        this.addCactus()

        console.log('Natural decorations added.')
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
        // 先卸载旧mesh
        if (this.chunkMeshes.has(chunkKey)) {
            for (const mesh of this.chunkMeshes.get(chunkKey)) {
                this.scene.remove(mesh)
            }
        }
        const meshes = this.voxelBuilder.render(this.scene, chunkKey)
        this.chunkMeshes.set(chunkKey, meshes)
    }

    /**
     * 卸载chunk：从场景移除mesh（保留数据以便再次渲染）
     * @param {string} chunkKey
     */
    unloadChunk(chunkKey) {
        if (this.chunkMeshes.has(chunkKey)) {
            for (const mesh of this.chunkMeshes.get(chunkKey)) {
                this.scene.remove(mesh)
            }
            this.chunkMeshes.delete(chunkKey)
        }
    }

    /**
     * 更新视野内chunk：根据相机位置加载/卸载
     * @param {{x:number,z:number}} position
     */
    updateChunks(position) {
        const diff = this.chunkManager.diff(new THREE.Vector3(position.x, 0, position.z))
        const minCoord = -this.settings.worldSize
        const maxCoord = this.settings.worldSize - 1

        // 卸载
        for (const key of diff.toUnload) {
            this.unloadChunk(key)
            this.chunkManager.markUnloaded(key)
            // 保留数据（未调用clearChunk），以便重新渲染
        }

        // 加载
        for (const item of diff.toLoad) {
            const { cx, cz, key } = item
            const startX = cx * this.terrain.settings.chunkSize
            const startZ = cz * this.terrain.settings.chunkSize
            // 边界检查，限制在 worldSize 范围内
            if (startX < minCoord || startX > maxCoord || startZ < minCoord || startZ > maxCoord) {
                continue
            }

            this.terrain.generateChunk(
                this.voxelBuilder,
                cx,
                cz,
                minCoord,
                maxCoord,
                key
            )
            this.chunkManager.markLoaded(key)
            this.renderChunk(key)
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
        }

        // 如果地形设置改变，更新地形
        if (newSettings.terrain) {
            this.terrain.updateSettings(newSettings.terrain)
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
