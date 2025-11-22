import { Decoration, Path } from './Decoration.js'
import { VoxelBuilder } from '../voxel.js'
import { Terrain } from './Terrain.js'
import { SeededRandom } from './Random.js'
import { wireBuildingTypes } from '../config/contentRegistry.js'
import * as BuildingTypes from './BuildingTypes.js'

/**
 * 村庄类
 * 管理村庄内的所有建筑、道路、装饰等
 */
export class Village {
    /**
     * @param {object} options
     * @param {number} options.x - 村庄中心X坐标
     * @param {number} options.y - 村庄中心Y坐标
     * @param {number} options.z - 村庄中心Z坐标
     * @param {number} options.radius - 村庄半径
     */
    constructor(options = {}) {
        this.x = options.x || 0
        this.y = options.y || 0
        this.z = options.z || 0
        this.radius = options.radius || 20
        this.random = options.random || new SeededRandom('village')
        this.biome = options.biome || 'plains'

        // 村庄组件
        this.buildings = []
        this.paths = []
        this.decorations = []

        // 建筑配置
        this.buildingConfig = wireBuildingTypes(BuildingTypes)
        // 默认数量，与配置分离，便于未来扩展
        this.buildingConfig.forEach(cfg => {
            cfg.count = cfg.count || 1
        })

        this.occupiedPositions = new Set()
    }

    /**
     * 生成村庄
     * @param {Terrain} terrain
     * @param {VoxelBuilder} builder
     */
    generate(terrain, builder) {
        console.log(`Generating village at (${this.x}, ${this.z})`)

        // 生成建筑
        this.generateBuildings(terrain, builder)

        // 生成道路
        this.generatePaths(builder, terrain)

        // 生成装饰
        this.generateDecorations(terrain, builder)

        // 生成中央广场
        this.generateCentralSquare(builder, terrain)
    }

    /**
     * 生成村庄建筑
     * @param {Terrain} terrain
     * @param {VoxelBuilder} builder
     */
    generateBuildings(terrain, builder) {
        for (const config of this.buildingConfig) {
            for (let i = 0; i < config.count; i++) {
                const pos = this.findBuildingPosition(terrain, config.type.name, config.distanceRange)
                if (pos) {
                    // 创建建筑实例
                    const materialOverrides = this.getBiomeMaterials(config.type.name)
                    const building = new config.type({
                        ...pos,
                        ...materialOverrides,
                        random: this.random.cloneWithOffset(this.buildings.length + i + 1)
                    })

                    // 建造建筑
                    if (building.build(builder, this.occupiedPositions)) {
                        this.buildings.push(building)

                        // 记录占用位置
                        const key = `${pos.x},${pos.z}`
                        this.occupiedPositions.add(key)

                        console.log(`  Built ${config.type.name} at (${pos.x}, ${pos.y}, ${pos.z})`)
                    }
                }
            }
        }
    }

    /**
     * 为建筑寻找合适位置
     * @param {Terrain} terrain
     * @param {string} buildingType
     * @param {[number, number]} distanceRange
     * @returns {object|null}
     */
    findBuildingPosition(terrain, buildingType, distanceRange) {
        const maxAttempts = 50
        const [minDist, maxDist] = distanceRange

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const angle = (attempt / maxAttempts) * Math.PI * 2 + this.random.range(0, 0.5)
            const distance = minDist + this.random.range(0, maxDist - minDist)
            const x = Math.floor(this.x + Math.cos(angle) * distance * this.radius)
            const z = Math.floor(this.z + Math.sin(angle) * distance * this.radius)
            const y = terrain.getHeight(x, z)

            if (!terrain.isUnderwater(x, z)) {
                const key = `${x},${z}`
                if (!this.occupiedPositions.has(key)) {
                    return { x, y, z }
                }
            }
        }
        return null
    }

    /**
     * 生成村庄道路
     * @param {VoxelBuilder} builder
     * @param {Terrain} terrain
     */
    generatePaths(builder, terrain) {
        const buildingPositions = this.buildings.map(b => ({ x: b.x, z: b.z, y: terrain.getHeight(b.x, b.z) }))

        if (buildingPositions.length < 2) return

        // 连接每个建筑到村庄中心
        for (const building of buildingPositions) {
            const path = new Path(this.x, this.z, building.x, building.z)
            path.build(builder, terrain)
            this.paths.push(path)
        }

        // 连接建筑之间
        for (let i = 0; i < buildingPositions.length; i++) {
            for (let j = i + 1; j < buildingPositions.length; j++) {
                const b1 = buildingPositions[i]
                const b2 = buildingPositions[j]

                const distance = Math.sqrt((b1.x - b2.x) ** 2 + (b1.z - b2.z) ** 2)
                if (distance < this.radius * 0.6) {
                    const path = new Path(b1.x, b1.z, b2.x, b2.z)
                    path.build(builder, terrain)
                    this.paths.push(path)
                }
            }
        }
    }

    /**
     * 生成中央广场
     * @param {VoxelBuilder} builder
     * @param {Terrain} terrain
     */
    generateCentralSquare(builder, terrain) {
        const squareSize = 5
        const square = new Decoration.Square(this.x, this.z, squareSize)
        square.build(builder, terrain)
        this.decorations.push(square)

        // 生成井
        const well = new Decoration.Well(this.x, this.z)
        well.build(builder, terrain)
        this.decorations.push(well)
    }

    /**
     * 生成村庄装饰
     * @param {Terrain} terrain
     * @param {VoxelBuilder} builder
     */
    generateDecorations(terrain, builder) {
        // 添加围栏
        this.addFences(builder, terrain)

        // 添加花园
        this.addGardens(builder, terrain)
    }

    /**
     * 添加围栏
     * @param {VoxelBuilder} builder
     * @param {Terrain} terrain
     */
    addFences(builder, terrain) {
        const fenceCount = 8
        for (let i = 0; i < fenceCount; i++) {
            const angle = (i / fenceCount) * Math.PI * 2
            const distance = this.radius + 2
            const x = Math.floor(this.x + Math.cos(angle) * distance)
            const z = Math.floor(this.z + Math.sin(angle) * distance)
            const y = terrain.getHeight(x, z)

            if (!terrain.isUnderwater(x, z)) {
                const fence = new Decoration.Fence(x, y, z)
                fence.build(builder, terrain)
                this.decorations.push(fence)
            }
        }
    }

    /**
     * 添加花园
     * @param {VoxelBuilder} builder
     * @param {Terrain} terrain
     */
    addGardens(builder, terrain) {
        const gardenCount = 5
        for (let i = 0; i < gardenCount; i++) {
            const angle = this.random.range(0, Math.PI * 2)
            const distance = this.radius * 0.7
            const x = Math.floor(this.x + Math.cos(angle) * distance)
            const z = Math.floor(this.z + Math.sin(angle) * distance)
            const y = terrain.getHeight(x, z)

            if (!terrain.isUnderwater(x, z)) {
                const garden = new Decoration.Garden(x, y, z, this.random)
                garden.build(builder, terrain)
                this.decorations.push(garden)
            }
        }
    }

    /**
     * 获取村庄信息
     * @returns {object}
     */
    getInfo() {
        return {
            position: { x: this.x, y: this.y, z: this.z },
            radius: this.radius,
            buildingCount: this.buildings.length,
            pathCount: this.paths.length,
            decorationCount: this.decorations.length
        }
    }

    /**
     * 获取所有建筑
     * @returns {Array}
     */
    getBuildings() {
        return [...this.buildings]
    }

    /**
     * 获取建筑数量统计
     * @returns {object}
     */
    getBuildingStats() {
        const stats = {}
        for (const building of this.buildings) {
            stats[building.type] = (stats[building.type] || 0) + 1
        }
        return stats
    }

    /**
     * 按生物群系返回材质覆盖，保持基础方块但更符合环境
     * @param {string} buildingType
     * @returns {{wallMaterial?:string, foundationMaterial?:string, roofMaterial?:string}}
     */
    getBiomeMaterials(buildingType) {
        if (this.biome === 'desert' || this.biome === 'beach') {
            return {
                wallMaterial: 'sand',
                foundationMaterial: 'stone',
                roofMaterial: 'roof'
            }
        }

        if (this.biome === 'snow' || this.biome === 'taiga') {
            return {
                wallMaterial: 'wood',
                foundationMaterial: 'stone',
                roofMaterial: 'roof'
            }
        }

        // 默认平原/森林
        return {}
    }
}
