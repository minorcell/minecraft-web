import { Building } from './Building.js'

/**
 * 市政厅 - 村庄中心建筑
 */
export class TownHall extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'townhall',
            width: options.width || 10,
            depth: options.depth || 10,
            height: options.height || 8,
            wallMaterial: 'wood',
            foundationMaterial: 'stone',
            roofMaterial: 'roof'
        })
    }

    buildWalls(builder) {
        const halfW = this.width / 2
        const halfD = this.depth / 2
        const doorJ = halfD - 1
        for (let h = 1; h <= this.height; h++) {
            for (let i = -halfW; i < halfW; i++) {
                for (let j = -halfD; j < halfD; j++) {
                    const onEdge = i === -halfW || i === halfW - 1 || j === -halfD || j === halfD - 1
                    if (!onEdge) continue

                    // 中央门洞（正面）
                    if (this.hasDoor && j === doorJ && i === 0 && h <= 2) continue

                    // 窗户：两层高度，四面中心
                    if (this.hasWindows && h >= 3 && h <= 4 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', this.x + i, this.y + h, this.z + j)
                        continue
                    }

                    const mat = h <= 2 ? 'stone' : 'wood'
                    builder.addBlock(mat, this.x + i, this.y + h, this.z + j)
                }
            }
        }
    }

    buildRoof(builder) {
        // 金字塔式屋顶
        for (let level = 0; level < 4; level++) {
            const levelSize = this.width - level * 2
            for (let i = -levelSize / 2; i < levelSize / 2; i++) {
                for (let j = -levelSize / 2; j < levelSize / 2; j++) {
                    builder.addBlock('roof', this.x + i, this.y + this.height + level + 1, this.z + j)
                }
            }
        }
    }
}

/**
 * 塔楼 - 防御建筑
 */
export class Tower extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'tower',
            width: options.width || 6,
            depth: options.depth || 6,
            height: options.height || 12,
            wallMaterial: 'wood',
            foundationMaterial: 'stone',
            roofMaterial: 'roof'
        })
    }

    buildWalls(builder) {
        // 石头基座
        for (let h = 0; h <= 3; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    const doorJ = this.depth / 2 - 1
                    if (this.hasDoor && j === doorJ && i === 0 && h >= 1) continue
                    builder.addBlock('stone', this.x + i, this.y + h, this.z + j)
                }
            }
        }

        // 上层木结构带窗户
        const halfW = this.width / 2
        const halfD = this.depth / 2
        const doorJ = halfD - 1
        for (let h = 4; h <= this.height; h++) {
            for (let i = -halfW; i < halfW; i++) {
                for (let j = -halfD; j < halfD; j++) {
                    const onEdge = i === -halfW || i === halfW - 1 || j === -halfD || j === halfD - 1
                    if (!onEdge) continue

                    // 门洞（保留通路到塔内）
                    if (this.hasDoor && j === doorJ && i === 0 && h <= 5) continue

                    // 窗户：偶数层四向中心
                    if (this.hasWindows && h % 2 === 0 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', this.x + i, this.y + h, this.z + j)
                    } else {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }

    buildRoof(builder) {
        // 圆锥屋顶
        for (let level = 0; level < 5; level++) {
            const levelSize = this.width - level * 2
            for (let i = -levelSize / 2; i < levelSize / 2; i++) {
                for (let j = -levelSize / 2; j < this.depth / 2; j++) {
                    if (levelSize > 0) {
                        builder.addBlock('roof', this.x + i, this.y + this.height + level + 1, this.z + j)
                    }
                }
            }
        }
    }
}

/**
 * 铁匠铺 - 工业建筑
 */
export class Blacksmith extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'blacksmith',
            width: options.width || 8,
            depth: options.depth || 8,
            height: options.height || 5,
            wallMaterial: 'stone',
            foundationMaterial: 'stone',
            roofMaterial: 'roof'
        })
    }

    buildWalls(builder) {
        const halfW = this.width / 2
        const halfD = this.depth / 2
        const doorJ = halfD - 1

        // 地面石板
        for (let i = -halfW; i < halfW; i++) {
            for (let j = -halfD; j < halfD; j++) {
                builder.addBlock('stone', this.x + i, this.y, this.z + j)
            }
        }

        // 墙体
        for (let h = 1; h <= this.height; h++) {
            for (let i = -halfW; i < halfW; i++) {
                for (let j = -halfD; j < halfD; j++) {
                    const onEdge = i === -halfW || i === halfW - 1 || j === -halfD || j === halfD - 1
                    if (!onEdge) continue

                    // 门洞
                    if (this.hasDoor && j === doorJ && i === 0 && h <= 2) continue

                    // 窗户
                    if (this.hasWindows && h === 3 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', this.x + i, this.y + h, this.z + j)
                    } else {
                        builder.addBlock('stone', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }

    buildDetails(builder) {
        // 锻造炉（装饰）
        for (let i = -1; i <= 1; i++) {
            builder.addBlock('stone', this.x + i, this.y + 1, this.z + this.depth / 2)
        }
    }
}

/**
 * 民居 - 居民建筑
 */
export class House extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'house',
            width: options.width || 6,
            depth: options.depth || 6,
            height: options.height || 5,
            wallMaterial: 'wood',
            foundationMaterial: 'stone',
            roofMaterial: 'roof'
        })
    }

    getDoorOffsets() {
        if (!this.hasDoor) return []
        const halfD = this.depth / 2
        return [
            { xOffset: 0, zOffset: halfD - 1, dirZ: 1 },
            { xOffset: 0, zOffset: -halfD, dirZ: -1 }
        ]
    }

    buildWalls(builder) {
        for (let h = 1; h <= this.height; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                        j === -this.depth / 2 || j === this.depth / 2 - 1) {
                        if (h <= 2 && i === 0 && this.hasDoor) {
                            continue // 门洞留空
                        } else if (this.hasWindows && h >= 2 && h <= 3 && (i === -2 || i === 2 || j === -2 || j === 2)) {
                            builder.addBlock('glass', this.x + i, this.y + h, this.z + j) // 窗户
                        } else {
                            builder.addBlock(this.wallMaterial, this.x + i, this.y + h, this.z + j)
                        }
                    }
                }
            }
        }
    }
}

/**
 * 谷仓 - 农业建筑
 */
export class Barn extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'barn',
            width: options.width || 12,
            depth: options.depth || 8,
            height: options.height || 6,
            wallMaterial: 'wood',
            foundationMaterial: 'wood',
            roofMaterial: 'roof'
        })
    }

    buildWalls(builder) {
        const halfW = this.width / 2
        const halfD = this.depth / 2
        const doorJ1 = halfD - 1
        const doorJ2 = halfD - 2

        // 地板
        for (let i = -halfW; i < halfW; i++) {
            for (let j = -halfD; j < halfD; j++) {
                builder.addBlock('wood', this.x + i, this.y, this.z + j)
            }
        }

        // 墙体
        for (let h = 1; h <= this.height; h++) {
            for (let i = -halfW; i < halfW; i++) {
                for (let j = -halfD; j < halfD; j++) {
                    const onEdge = i === -halfW || i === halfW - 1 || j === -halfD || j === halfD - 1
                    if (!onEdge) continue

                    // 双开门洞
                    if (this.hasDoor && j >= doorJ2 && j <= doorJ1 && i === 0 && h <= 3) continue

                    // 简易通风窗
                    if (this.hasWindows && h === 3 && (i === -halfW || i === halfW - 1)) {
                        builder.addBlock('glass', this.x + i, this.y + h, this.z + j)
                    } else {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }

    buildDetails(builder) {
        // 可选：门楣横梁
        builder.addBlock('wood', this.x, this.y + 4, this.z + this.depth / 2 - 1)
    }
}

/**
 * 储藏室 - 存储建筑
 */
export class Storage extends Building {
    constructor(options = {}) {
        super({
            ...options,
            type: 'storage',
            width: options.width || 6,
            depth: options.depth || 6,
            height: options.height || 4,
            wallMaterial: 'wood',
            foundationMaterial: 'wood',
            roofMaterial: 'roof'
        })
    }

    buildWalls(builder) {
        const halfW = this.width / 2
        const halfD = this.depth / 2
        const doorJ = halfD - 1

        // 地板
        for (let i = -halfW; i < halfW; i++) {
            for (let j = -halfD; j < halfD; j++) {
                builder.addBlock('wood', this.x + i, this.y, this.z + j)
            }
        }

        for (let h = 1; h <= this.height; h++) {
            for (let i = -halfW; i < halfW; i++) {
                for (let j = -halfD; j < halfD; j++) {
                    const onEdge = i === -halfW || i === halfW - 1 || j === -halfD || j === halfD - 1
                    if (!onEdge && h !== this.height) continue

                    // 门洞
                    if (this.hasDoor && j === doorJ && i === 0 && h <= 2) continue

                    // 窗户
                    if (this.hasWindows && h === 2 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', this.x + i, this.y + h, this.z + j)
                    } else {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }
}
