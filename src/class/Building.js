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
        this.foundationDepth = options.foundationDepth || 2
        this.floorMaterial = options.floorMaterial || 'wood'

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
    static isPositionOccupied(x, z, width, depth, occupiedSet, padding = 0) {
        const halfW = Math.floor(width / 2) + padding
        const halfD = Math.floor(depth / 2) + padding
        for (let i = x - halfW; i <= x + halfW; i++) {
            for (let j = z - halfD; j <= z + halfD; j++) {
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
    static markPositionOccupied(x, z, width, depth, occupiedSet, padding = 0) {
        const halfW = Math.floor(width / 2) + padding
        const halfD = Math.floor(depth / 2) + padding
        for (let i = x - halfW; i <= x + halfW; i++) {
            for (let j = z - halfD; j <= z + halfD; j++) {
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
        const depth = Math.max(1, this.foundationDepth)
        const minX = -Math.floor(this.width / 2)
        const maxX = Math.ceil(this.width / 2) - 1
        const minZ = -Math.floor(this.depth / 2)
        const maxZ = Math.ceil(this.depth / 2) - 1
        for (let h = 0; h < depth; h++) {
            const y = this.y - h
            for (let i = minX; i <= maxX; i++) {
                for (let j = minZ; j <= maxZ; j++) {
                    builder.addBlock(this.foundationMaterial, this.x + i, y, this.z + j)
                }
            }
        }
    }

    /**
     * 构建屋顶（默认实现，子类可重写）
     * @param {VoxelBuilder} builder
     */
    buildRoof(builder) {
        const minX = -Math.floor(this.width / 2) - 1
        const maxX = Math.ceil(this.width / 2)
        const minZ = -Math.floor(this.depth / 2) - 1
        const maxZ = Math.ceil(this.depth / 2)
        for (let i = minX; i <= maxX; i++) {
            for (let j = minZ; j <= maxZ; j++) {
                builder.addBlock(this.roofMaterial, this.x + i, this.y + this.height + 1, this.z + j)
            }
        }
    }

    /**
     * 构建墙体（默认实现，子类可重写）
     * @param {VoxelBuilder} builder
     */
    buildWalls(builder) {
        const minX = -Math.floor(this.width / 2)
        const maxX = Math.ceil(this.width / 2) - 1
        const minZ = -Math.floor(this.depth / 2)
        const maxZ = Math.ceil(this.depth / 2) - 1
        for (let h = 1; h <= this.height; h++) {
            for (let i = minX; i <= maxX; i++) {
                for (let j = minZ; j <= maxZ; j++) {
                    if (i === minX || i === maxX ||
                        j === minZ || j === maxZ) {
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
    build(builder, occupiedSet, terrain = null) {
        // 检查位置是否可用
        const spacing = 2 // 最少留出2格间距
        if (Building.isPositionOccupied(this.x, this.z, this.width, this.depth, occupiedSet, spacing)) {
            return false
        }

        // 标记位置为已占用
        Building.markPositionOccupied(this.x, this.z, this.width, this.depth, occupiedSet, spacing)

        // 清理地形占位，确保室内/地基平整
        this.clearFootprint(builder)

        // 构建建筑的各个部分
        this.buildFoundation(builder)
        this.buildFloor(builder)
        this.buildWalls(builder)
        this.buildRoof(builder)
        this.buildDetails(builder)
        this.buildEntranceStairs(builder, terrain)

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
            foundationDepth: this.foundationDepth,
            floorMaterial: this.floorMaterial,
            hasWindows: this.hasWindows,
            hasDoor: this.hasDoor
        })
    }

    /**
     * 铺设室内地板（默认木地板，覆盖内部，不含墙体边界）
     * @param {VoxelBuilder} builder
     */
    buildFloor(builder) {
        const minX = -Math.floor(this.width / 2) + 1
        const maxX = Math.ceil(this.width / 2) - 2
        const minZ = -Math.floor(this.depth / 2) + 1
        const maxZ = Math.ceil(this.depth / 2) - 2
        if (minX > maxX || minZ > maxZ) return
        for (let i = minX; i <= maxX; i++) {
            for (let j = minZ; j <= maxZ; j++) {
                builder.addBlock(this.floorMaterial, this.x + i, this.y, this.z + j)
            }
        }
    }

    /**
     * 返回门洞位置（相对偏移），默认正面中心
     * @returns {Array<{xOffset:number,zOffset:number,dirZ:number}>}
     */
    getDoorOffsets() {
        if (!this.hasDoor) return []
        const halfDepth = Math.floor(this.depth / 2)
        return [
            {
                xOffset: 0,
                zOffset: halfDepth - 1,
                dirZ: 1
            }
        ]
    }

    /**
     * 为高于周围地面的入口添加简易台阶
     * @param {VoxelBuilder} builder
     * @param {import('./Terrain.js').Terrain|null} terrain
     */
    buildEntranceStairs(builder, terrain) {
        if (!terrain || !this.hasDoor) return
        const floorY = this.y
        for (const door of this.getDoorOffsets()) {
            const doorX = this.x + door.xOffset
            const doorZ = this.z + door.zOffset
            const dirZ = door.dirZ || 1
            const outsideZ = doorZ + dirZ
            const ground = terrain.getHeight(doorX, outsideZ)
            const delta = floorY - ground
            if (delta <= 0) continue

            // 从地面开始向上铺台阶（全方块坡道）
            for (let step = 0; step <= delta; step++) {
                const stepY = ground + 1 + step
                const stepZ = outsideZ + dirZ * step
                if (stepY > floorY) break
                builder.addBlock(this.floorMaterial, doorX, stepY, stepZ)
            }
        }
    }

    /**
     * 清理建筑占用范围内的方块，避免室内残留地形/水体
     * @param {VoxelBuilder} builder
     */
    clearFootprint(builder) {
        if (!builder?.removeBlock) return
        const minX = -Math.floor(this.width / 2)
        const maxX = Math.ceil(this.width / 2) - 1
        const minZ = -Math.floor(this.depth / 2)
        const maxZ = Math.ceil(this.depth / 2) - 1
        const minY = this.y - Math.max(1, this.foundationDepth) - 1
        const maxY = this.y + this.height + 6 // 覆盖屋内及屋顶空间

        for (let x = this.x + minX; x <= this.x + maxX; x++) {
            for (let z = this.z + minZ; z <= this.z + maxZ; z++) {
                for (let y = minY; y <= maxY; y++) {
                    builder.removeBlock(x, y, z)
                }
            }
        }
    }
}
