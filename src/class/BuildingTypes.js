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
        // 主建筑 - 木墙配石头地基
        for (let h = 1; h <= this.height; h++) {
            for (let i = -this.width / 2 + 1; i < this.width / 2 - 1; i++) {
                for (let j = -this.depth / 2 + 1; j < this.depth / 2 - 1; j++) {
                    if (h <= 2) {
                        builder.addBlock('stone', this.x + i, this.y + h, this.z + j)
                    } else {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j)
                    }
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
                    builder.addBlock('stone', this.x + i, this.y + h, this.z + j)
                }
            }
        }

        // 上层木结构带窗户
        for (let h = 4; h <= this.height; h++) {
            for (let i = -this.width / 2 + 1; i < this.width / 2 - 1; i++) {
                for (let j = -this.depth / 2 + 1; j < this.depth / 2 - 1; j++) {
                    // 窗户
                    if (h % 2 === 0 && (i === 0 || j === 0)) {
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
        for (let h = 0; h <= this.height; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                        j === -this.depth / 2 || j === this.depth / 2 - 1 || h === 0) {
                        builder.addBlock('stone', this.x + i, this.y + h, this.z + j)
                    } else if (h === 3 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', this.x + i, this.y + h, this.z + j) // 窗户
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

    buildWalls(builder) {
        for (let h = 1; h <= this.height; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                        j === -this.depth / 2 || j === this.depth / 2 - 1) {
                        if (h === 2 && i === 0) {
                            builder.addBlock('glass', this.x + i, this.y + h, this.z + j) // 门
                        } else if (h >= 2 && h <= 3 && (i === -2 || i === 2 || j === -2 || j === 2)) {
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
        for (let h = 0; h <= this.height; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                        j === -this.depth / 2 || j === this.depth / 2 - 1 || h === 0) {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }

    buildDetails(builder) {
        // 大门开口
        for (let h = 1; h <= 3; h++) {
            builder.addBlock('wood', this.x, this.y + h, this.z + this.depth / 2 - 1)
        }
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
        for (let h = 0; h <= this.height; h++) {
            for (let i = -this.width / 2; i < this.width / 2; i++) {
                for (let j = -this.depth / 2; j < this.depth / 2; j++) {
                    if (i === -this.width / 2 || i === this.width / 2 - 1 ||
                        j === -this.depth / 2 || j === this.depth / 2 - 1 ||
                        h === 0 || h === this.height) {
                        builder.addBlock('wood', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }
}
