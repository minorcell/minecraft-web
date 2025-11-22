import { Building } from './Building.js'
import { Storage } from './BuildingTypes.js'

/**
 * 农田类 - Minecraft风格的农田系统
 */
export class Farm extends Building {
    /**
     * @param {object} options
     * @param {number} options.x - 农田中心X
     * @param {number} options.y - 农田中心Y
     * @param {number} options.z - 农田中心Z
     * @param {number} options.width - 农田宽度
     * @param {number} options.depth - 农田深度
     */
    constructor(options = {}) {
        super({
            ...options,
            type: 'farm',
            width: options.width || 9,
            depth: options.depth || 9,
            height: 1, // 农田高度通常只有1层
            wallMaterial: 'wood', // 围栏
            foundationMaterial: 'dirt', // 农田土壤
            hasWindows: false,
            hasDoor: false
        })

        // 农田配置
        this.hasIrrigation = options.hasIrrigation !== undefined ? options.hasIrrigation : true
        this.cropType = options.cropType || 'wheat'
        this.hasHut = options.hasHut !== false // 默认有小屋
    }

    /**
     * 检查位置是否可用
     * @param {number} x
     * @param {number} z
     * @param {Set} occupiedSet
     * @returns {boolean}
     */
    static isPositionOccupied(x, z, width, depth, occupiedSet) {
        // 农田占用空间较小，只需要检查中心点
        return occupiedSet.has(`${x},${z}`)
    }

    /**
     * 标记位置为已占用
     * @param {number} x
     * @param {number} z
     * @param {number} width
     * @param {number} depth
     * @param {Set} occupiedSet
     */
    static markPositionOccupied(x, z, width, depth, occupiedSet) {
        occupiedSet.add(`${x},${z}`)
    }

    /**
     * 构建农田
     * @param {VoxelBuilder} builder
     * @param {Set} occupiedSet
     * @param {Terrain} terrain
     * @returns {boolean}
     */
    build(builder, occupiedSet, terrain = null) {
        // 检查位置是否可用
        if (Farm.isPositionOccupied(this.x, this.z, this.width, this.depth, occupiedSet)) {
            return false
        }

        // 标记位置为已占用
        Farm.markPositionOccupied(this.x, this.z, this.width, this.depth, occupiedSet)

        // 构建围栏边界
        this.buildFence(builder)

        // 构建农田内部
        this.buildFarmland(builder)

        // 构建灌溉系统
        if (this.hasIrrigation) {
            this.buildIrrigation(builder)
        }

        // 构建作物
        this.buildCrops(builder)

        // 构建农舍（可选）
        if (this.hasHut && terrain) {
            this.buildFarmHut(builder, terrain)
        }

        this.isBuilt = true
        return true
    }

    /**
     * 构建围栏
     * @param {VoxelBuilder} builder
     */
    buildFence(builder) {
        for (let i = -this.width / 2; i < this.width / 2; i++) {
            for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                // 围栏边界
                if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                    j === -this.depth / 2 || j === this.depth / 2 - 1) {
                    // 围栏柱子
                    builder.addBlock('wood', this.x + i, this.y + 1, this.z + j)
                    builder.addBlock('wood', this.x + i, this.y + 2, this.z + j)

                    // 添加横杆 - 使用整数坐标
                    // 在两个高度添加水平横杆
                    builder.addBlock('wood', this.x + i, this.y + 1, this.z + j + 1)
                    builder.addBlock('wood', this.x + i, this.y + 1, this.z + j - 1)
                    builder.addBlock('wood', this.x + i, this.y + 2, this.z + j + 1)
                    builder.addBlock('wood', this.x + i, this.y + 2, this.z + j - 1)
                }
            }
        }
    }

    /**
     * 构建农田土壤
     * @param {VoxelBuilder} builder
     */
    buildFarmland(builder) {
        for (let i = -this.width / 2 + 1; i < this.width / 2 - 1; i++) {
            for (let j = -this.depth / 2 + 1; j < this.depth / 2 - 1; j++) {
                // 农田土壤层
                builder.addBlock('dirt', this.x + i, this.y, this.z + j)
            }
        }
    }

    /**
     * 构建灌溉系统
     * @param {VoxelBuilder} builder
     */
    buildIrrigation(builder) {
        // 3x3网格的灌溉通道
        for (let i = -this.width / 2 + 1; i < this.width / 2 - 1; i++) {
            for (let j = -this.depth / 2 + 1; j < this.depth / 2 - 1; j++) {
                // 每隔3格挖一条灌溉渠
                if (i % 3 === 0 && j % 3 === 0) {
                    // 灌溉渠
                    builder.addBlock('water', this.x + i, this.y + 1, this.z + j)
                }
            }
        }
    }

    /**
     * 构建作物
     * @param {VoxelBuilder} builder
     */
    buildCrops(builder) {
        for (let i = -this.width / 2 + 1; i < this.width / 2 - 1; i++) {
            for (let j = -this.depth / 2 + 1; j < this.depth / 2 - 1; j++) {
                // 跳过灌溉渠位置
                if (this.hasIrrigation && i % 3 === 0 && j % 3 === 0) {
                    continue
                }

                // 按棋盘格模式种植作物
                if ((i + j) % 2 === 0) {
                    // 不同生长阶段的作物
                    const height = 1 + Math.floor(Math.random() * 2)

                    // 创建茎
                    for (let h = 1; h <= height; h++) {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j) // 茎
                    }

                    // 在顶部添加叶子/麦穗
                    const topHeight = height + 1
                    if (Math.random() > 0.3) {
                        builder.addBlock('leaves', this.x + i, this.y + topHeight, this.z + j)
                    }

                    // 添加侧枝 - 让作物更分散
                    if (height > 1) {
                        const midHeight = Math.floor(height / 2) + 1
                        if (Math.random() > 0.5) {
                            // 添加左侧枝
                            builder.addBlock('leaves', this.x + i - 1, this.y + midHeight, this.z + j)
                        }
                        if (Math.random() > 0.5) {
                            // 添加右侧枝
                            builder.addBlock('leaves', this.x + i + 1, this.y + midHeight, this.z + j)
                        }
                        if (Math.random() > 0.5) {
                            // 添加前后枝
                            builder.addBlock('leaves', this.x + i, this.y + midHeight, this.z + j - 1)
                        }
                        if (Math.random() > 0.5) {
                            builder.addBlock('leaves', this.x + i, this.y + midHeight, this.z + j + 1)
                        }
                    }
                }
            }
        }
    }

    /**
     * 构建农舍
     * @param {VoxelBuilder} builder
     * @param {Terrain} terrain
     */
    buildFarmHut(builder, terrain) {
        const hutX = this.x + this.width / 2 + 2
        const hutZ = this.z
        const hutY = terrain.getHeight(hutX, hutZ)

        if (!terrain.isUnderwater(hutX, hutZ)) {
            const hut = new Storage({ x: hutX, y: hutY, z: hutZ })
            hut.build(builder, new Set())
        }
    }

    /**
     * 获取农田信息
     * @returns {object}
     */
    getInfo() {
        return {
            ...super.getInfo(),
            hasIrrigation: this.hasIrrigation,
            cropType: this.cropType,
            hasHut: this.hasHut
        }
    }
}
