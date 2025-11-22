import { Terrain } from './Terrain.js'
import { VoxelBuilder } from '../voxel.js'
import { Village } from './Village.js'
import { Decoration } from './Decoration.js'

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
            ...options.settings
        }

        // 初始化系统
        this.terrain = new Terrain({
            worldSize: this.settings.worldSize,
            bottomLevel: -10,
            waterLevel: -4,
            sandLevel: -3,
            snowLevel: 12,
            groundDepth: 10
        })

        this.voxelBuilder = new VoxelBuilder()
        this.villages = []
        this.decorations = []

        // 碰撞检测
        this.occupied = new Set()
    }

    /**
     * 生成整个世界
     */
    generate() {
        console.time('World Generation')

        // 1. 生成地形
        this.generateTerrain()

        // 2. 生成村庄
        this.generateVillages()

        // 3. 添加自然装饰
        this.addNaturalDecorations()

        // 4. 渲染世界
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
            const centerX = Math.floor((Math.random() - 0.5) * this.settings.worldSize * 1.5)
            const centerZ = Math.floor((Math.random() - 0.5) * this.settings.worldSize * 1.5)
            const centerY = this.terrain.getHeight(centerX, centerZ)

            // 只在陆地上生成村庄
            if (!this.terrain.isUnderwater(centerX, centerZ)) {
                const radius = 20 + Math.floor(Math.random() * 15)
                const village = new Village({
                    x: centerX,
                    y: centerY,
                    z: centerZ,
                    radius: radius
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

        console.log('Natural decorations added.')
    }

    /**
     * 添加草丛
     */
    addGrass() {
        for (let i = 0; i < this.settings.grassCount; i++) {
            const x = Math.floor((Math.random() - 0.5) * this.settings.worldSize * 2)
            const z = Math.floor((Math.random() - 0.5) * this.settings.worldSize * 2)
            const y = this.terrain.getHeight(x, z)

            // 只在草地上添加草丛
            if (y > this.terrain.settings.waterLevel &&
                y < this.terrain.settings.snowLevel &&
                !this.terrain.isUnderwater(x, z)) {

                const grass = new Decoration.Grass(x, y, z)
                grass.build(this.voxelBuilder, this.terrain)
                this.decorations.push(grass)
            }
        }
    }

    /**
     * 添加树木
     */
    addTrees() {
        let treeCount = 0
        for (let i = 0; i < this.settings.treeCount; i++) {
            const x = Math.floor((Math.random() - 0.5) * this.settings.worldSize * 2)
            const z = Math.floor((Math.random() - 0.5) * this.settings.worldSize * 2)
            const y = this.terrain.getHeight(x, z)

            if (y > this.terrain.settings.waterLevel && !this.terrain.isUnderwater(x, z)) {
                // 避免在村庄附近生成树
                if (!this.isNearVillage(x, z, 25)) {
                    const tree = new Decoration.Tree(x, y, z)
                    tree.build(this.voxelBuilder, this.terrain)
                    this.decorations.push(tree)
                    treeCount++
                }
            }
        }

        console.log(`Generated ${treeCount} trees`)
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
        this.voxelBuilder.render(this.scene)
    }

    /**
     * 获取世界信息
     * @returns {object}
     */
    getInfo() {
        return {
            settings: this.settings,
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
        this.settings = { ...this.settings, ...newSettings }

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
        this.voxelBuilder.clear()
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
