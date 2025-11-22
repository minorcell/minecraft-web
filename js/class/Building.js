/**
 * 建筑基类
 * 所有建筑的父类，定义通用属性和方法
 */
export class Building {
    /**
     * @param {object} options
     * @param {number} options.x - X坐标
     * @param {number} options.y - Y坐标
     * @param {number} options.z - Z坐标
     * @param {number} options.width - 宽度
     * @param {number} options.depth - 深度
     * @param {number} options.height - 高度
     * @param {string} options.type - 建筑类型
     */
    constructor(options = {}) {
        this.x = options.x || 0
        this.y = options.y || 0
        this.z = options.z || 0
        this.width = options.width || 5
        this.depth = options.depth || 5
        this.height = options.height || 5
        this.type = options.type || 'building'

        // 建筑样式
        this.wallMaterial = options.wallMaterial || 'wood'
        this.roofMaterial = options.roofMaterial || 'roof'
        this.foundationMaterial = options.foundationMaterial || 'stone'

        // 建筑状态
        this.isBuilt = false
        this.occupiedPositions = new Set()

        // 建筑装饰
        this.hasWindows = options.hasWindows !== undefined ? options.hasWindows : true
        this.hasDoor = options.hasDoor !== undefined ? options.hasDoor : true
    }

    /**
     * 检查位置是否被占用
     * @param {number} x
     * @param {number} z
     * @param {number} width
     * @param {number} depth
     * @returns {boolean}
     */
    static isPositionOccupied(x, z, width, depth, occupiedSet) {
        for (let i = x - Math.floor(width / 2); i <= x + Math.floor(width / 2); i++) {
            for (let j = z - Math.floor(depth / 2); j <= z + Math.floor(depth / 2); j++) {
                if (occupiedSet.has(`${i},${j}`)) return true
            }
        }
        return false
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
        for (let i = x - Math.floor(width / 2); i <= x + Math.floor(width / 2); i++) {
            for (let j = z - Math.floor(depth / 2); j <= z + Math.floor(depth / 2); j++) {
                occupiedSet.add(`${i},${j}`)
            }
        }
    }

    /**
     * 获取建筑位置
     * @returns {{x:number, y:number, z:number}}
     */
    getPosition() {
        return { x: this.x, y: this.y, z: this.z }
    }

    /**
     * 获取建筑尺寸
     * @returns {{width:number, depth:number, height:number}}
     */
    getSize() {
        return { width: this.width, depth: this.depth, height: this.height }
    }

    /**
     * 获取建筑边界
     * @returns {{minX:number, maxX:number, minZ:number, maxZ:number}}
     */
    getBounds() {
        return {
            minX: this.x - Math.floor(this.width / 2),
            maxX: this.x + Math.floor(this.width / 2),
            minZ: this.z - Math.floor(this.depth / 2),
            maxZ: this.z + Math.floor(this.depth / 2)
        }
    }

    /**
     * 构建建筑基础（所有建筑共有的部分）
     * @param {VoxelBuilder} builder
     */
    buildFoundation(builder) {
        for (let i = -this.width / 2; i < this.width / 2; i++) {
            for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                builder.addBlock(this.foundationMaterial, this.x + i, this.y, this.z + j)
            }
        }
    }

    /**
     * 构建屋顶（默认实现，子类可重写）
     * @param {VoxelBuilder} builder
     */
    buildRoof(builder) {
        for (let i = -this.width / 2 - 1; i <= this.width / 2; i++) {
            for (let j = -this.depth / 2 - 1; j <= this.depth / 2; j++) {
                builder.addBlock(this.roofMaterial, this.x + i, this.y + this.height + 1, this.z + j)
            }
        }
    }

    /**
     * 构建墙体（默认实现，子类可重写）
     * @param {VoxelBuilder} builder
     */
    buildWalls(builder) {
        for (let h = 1; h <= this.height; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                        j === -this.depth / 2 || j === this.depth / 2 - 1) {
                        builder.addBlock(this.wallMaterial, this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }

    /**
     * 建造建筑（模板方法模式）
     * @param {VoxelBuilder} builder
     * @param {Set} occupiedSet
     * @returns {boolean} 是否成功建造
     */
    build(builder, occupiedSet) {
        // 检查位置是否可用
        if (Building.isPositionOccupied(this.x, this.z, this.width, this.depth, occupiedSet)) {
            return false
        }

        // 标记位置为已占用
        Building.markPositionOccupied(this.x, this.z, this.width, this.depth, occupiedSet)

        // 构建建筑的各个部分
        this.buildFoundation(builder)
        this.buildWalls(builder)
        this.buildRoof(builder)
        this.buildDetails(builder)

        this.isBuilt = true
        return true
    }

    /**
     * 构建建筑细节（子类可重写）
     * @param {VoxelBuilder} builder
     */
    buildDetails(builder) {
        // 默认空实现，子类可重写
    }

    /**
     * 获取建筑信息
     * @returns {object}
     */
    getInfo() {
        return {
            type: this.type,
            position: this.getPosition(),
            size: this.getSize(),
            isBuilt: this.isBuilt
        }
    }

    /**
     * 克隆建筑
     * @returns {Building}
     */
    clone() {
        const BuildingClass = this.constructor
        return new BuildingClass({
            x: this.x,
            y: this.y,
            z: this.z,
            width: this.width,
            depth: this.depth,
            height: this.height,
            wallMaterial: this.wallMaterial,
            roofMaterial: this.roofMaterial,
            foundationMaterial: this.foundationMaterial,
            hasWindows: this.hasWindows,
            hasDoor: this.hasDoor
        })
    }
}
