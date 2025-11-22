/**
 * 装饰基类和装饰类型
 */

/**
 * 装饰基类
 */
export class Decoration {
    constructor(x, y, z, random = null) {
        this.x = x
        this.y = y
        this.z = z
        this.type = 'decoration'
        this.random = random
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z }
    }

    /**
     * 安全获取随机数，允许传入种子随机源
     * @returns {number}
     */
    rand() {
        return this.random ? this.random.float() : Math.random()
    }

    build(builder, terrain) {
        // 子类实现
    }
}

/**
 * 树装饰
 */
Decoration.Tree = class extends Decoration {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {SeededRandom|null} random
     * @param {'oak'|'spruce'|'shrub'} style
     */
    constructor(x, y, z, random = null, style = 'oak') {
        super(x, y, z, random)
        this.type = 'tree'
        this.style = style
        this.height = 3 + Math.floor(this.rand() * 3)
    }

    build(builder, terrain) {
        if (this.style === 'spruce') {
            this.buildSpruce(builder)
            return
        }
        if (this.style === 'shrub') {
            this.buildShrub(builder)
            return
        }
        this.buildOak(builder)
    }

    /**
     * 橡木样式：粗短树干 + 球状树冠
     */
    buildOak(builder) {
        // 树干
        for (let h = 1; h <= this.height; h++) {
            builder.addBlock('wood', this.x, this.y + h, this.z)
        }

        // 树叶球冠
        for (let h = this.height - 1; h <= this.height + 2; h++) {
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    if (Math.abs(i) + Math.abs(j) < 3) {
                        if (i === 0 && j === 0 && h < this.height + 1) continue
                        builder.addBlock('leaves', this.x + i, this.y + h, this.z + j)
                    }
                }
            }
        }
    }

    /**
     * 云杉样式：更高的树干 + 锥形树冠
     */
    buildSpruce(builder) {
        const h = this.height + 2 // 云杉更高
        for (let y = 1; y <= h; y++) {
            builder.addBlock('wood', this.x, this.y + y, this.z)
        }

        // 锥形叶子，底部宽，上部窄
        for (let level = 0; level < 4; level++) {
            const radius = 3 - level
            const leafY = this.y + h - level
            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    if (Math.abs(i) + Math.abs(j) <= radius + 1) {
                        builder.addBlock('leaves', this.x + i, leafY, this.z + j)
                    }
                }
            }
        }
        // 顶尖
        builder.addBlock('leaves', this.x, this.y + h + 1, this.z)
    }

    /**
     * 灌木样式：矮小的叶团，适合沙漠/灌木丛
     */
    buildShrub(builder) {
        const shrubHeight = 1 + Math.floor(this.rand() * 2)
        builder.addBlock('wood', this.x, this.y + 1, this.z)
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let h = 0; h <= shrubHeight; h++) {
                    if (Math.abs(i) + Math.abs(j) <= 2) {
                        builder.addBlock('leaves', this.x + i, this.y + 1 + h, this.z + j)
                    }
                }
            }
        }
    }
}

/**
 * 喷泉装饰
 */
Decoration.Fountain = class extends Decoration {
    constructor(x, y, z) {
        super(x, y, z)
        this.type = 'fountain'
    }

    build(builder, terrain) {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                if (Math.abs(i) === 2 || Math.abs(j) === 2) {
                    // 喷泉边界
                    builder.addBlock('stone', this.x + i, this.y, this.z + j)
                    builder.addBlock('stone', this.x + i, this.y + 1, this.z + j)
                } else {
                    // 喷泉水
                    builder.addBlock('water', this.x + i, this.y + 1, this.z + j)
                }
            }
        }
    }
}

/**
 * 围栏装饰 - Minecraft风格的围栏
 */
Decoration.Fence = class extends Decoration {
    constructor(x, y, z) {
        super(x, y, z)
        this.type = 'fence'
        this.height = 2
    }

    build(builder, terrain) {
        // 围栏柱子 - 核心部分
        for (let h = 0; h < this.height; h++) {
            builder.addBlock('wood', this.x, this.y + h, this.z)
        }

        // 围栏横杆 - 水平连接
        for (let h = 0; h < this.height - 1; h++) {
            // 在每个高度层级添加横杆
            const railY = this.y + h + 1
            for (let offset = -1; offset <= 1; offset++) {
                if (offset !== 0) {
                    builder.addBlock('wood', this.x + offset, railY, this.z)
                }
            }
        }

        // 顶部装饰 - 添加一些细节
        builder.addBlock('wood', this.x, this.y + this.height, this.z)
    }
}

/**
 * 花园装饰
 */
Decoration.Garden = class extends Decoration {
    constructor(x, y, z, random = null) {
        super(x, y, z, random)
        this.type = 'garden'
        this.size = 3
    }

    build(builder, terrain) {
        for (let gx = -1; gx <= 1; gx++) {
            for (let gz = -1; gz <= 1; gz++) {
                if (this.rand() > 0.4) {
                    builder.addBlock('dirt', this.x + gx, this.y, this.z + gz)
                    if (this.rand() > 0.6) {
                        builder.addBlock('flower', this.x + gx, this.y + 1, this.z + gz) // 花朵
                    }
                }
            }
        }
    }
}

/**
 * 广场装饰
 */
Decoration.Square = class extends Decoration {
    constructor(x, z, size = 5) {
        super(x, 0, z) // y将在build时计算
        this.type = 'square'
        this.size = size
    }

    build(builder, terrain) {
        const y = terrain.getHeight(this.x, this.z)

        for (let x = -this.size; x <= this.size; x++) {
            for (let z = -this.size; z <= this.size; z++) {
                const groundY = terrain.getHeight(this.x + x, this.z + z)
                if (groundY > terrain.settings.waterLevel) {
                    builder.addBlock('stone', this.x + x, groundY, this.z + z)
                }
            }
        }
    }
}

/**
 * 水井装饰
 */
Decoration.Well = class extends Decoration {
    constructor(x, z) {
        super(x, 0, z) // y将在build时计算
        this.type = 'well'
    }

    build(builder, terrain) {
        const y = terrain.getHeight(this.x, this.z)

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const groundY = terrain.getHeight(this.x + i, this.z + j)
                if (Math.abs(i) === 1 || Math.abs(j) === 1) {
                    // 井壁
                    builder.addBlock('stone', this.x + i, groundY, this.z + j)
                    builder.addBlock('stone', this.x + i, groundY + 1, this.z + j)
                } else {
                    // 井水
                    builder.addBlock('water', this.x + i, groundY + 1, this.z + j)
                }
            }
        }
    }
}

/**
 * 草丛装饰 - Minecraft风格的草叶
 */
Decoration.Grass = class extends Decoration {
    constructor(x, y, z, random = null) {
        super(x, y, z, random)
        this.type = 'grass'
        this.count = 2 + Math.floor(this.rand() * 4) // 2-5株草
    }

    build(builder, terrain) {
        for (let t = 0; t < this.count; t++) {
            // 随机偏移位置
            const offsetX = Math.floor((this.rand() - 0.5) * 2)
            const offsetZ = Math.floor((this.rand() - 0.5) * 2)
            const groundY = terrain.getHeight(this.x + offsetX, this.z + offsetZ)

            if (groundY > terrain.settings.waterLevel && groundY < terrain.settings.snowLevel) {
                builder.addBlock('flower', this.x + offsetX, groundY + 1, this.z + offsetZ)
            }
        }
    }
}

/**
 * 仙人掌装饰 - 沙漠群系
 */
Decoration.Cactus = class extends Decoration {
    constructor(x, y, z, random = null) {
        super(x, y, z, random)
        this.type = 'cactus'
        this.height = 2 + Math.floor(this.rand() * 3)
    }

    build(builder, terrain) {
        for (let h = 0; h < this.height; h++) {
            builder.addBlock('cactus', this.x, this.y + 1 + h, this.z)
        }
    }
}

/**
 * 花簇装饰 - 平原/森林群系
 */
Decoration.FlowerCluster = class extends Decoration {
    constructor(x, y, z, random = null) {
        super(x, y, z, random)
        this.type = 'flower'
        this.count = 3 + Math.floor(this.rand() * 4)
    }

    build(builder, terrain) {
        for (let i = 0; i < this.count; i++) {
            const ox = Math.floor((this.rand() - 0.5) * 3)
            const oz = Math.floor((this.rand() - 0.5) * 3)
            const gy = terrain.getHeight(this.x + ox, this.z + oz)
            if (gy > terrain.settings.waterLevel) {
                builder.addBlock('flower', this.x + ox, gy + 1, this.z + oz)
            }
        }
    }
}

/**
 * 道路装饰（连接两点）
 */
export class Path extends Decoration {
    constructor(x1, z1, x2, z2) {
        super(x1, 0, z1) // 起始点
        this.endX = x2
        this.endZ = z2
        this.type = 'path'
        this.width = 2
    }

    build(builder, terrain) {
        const steps = Math.max(Math.abs(this.endX - this.x), Math.abs(this.endZ - this.z))

        for (let i = 0; i <= steps; i++) {
            const t = i / steps
            const x = Math.floor(this.x + (this.endX - this.x) * t)
            const z = Math.floor(this.z + (this.endZ - this.z) * t)
            const y = terrain.getHeight(x, z)

            if (y > terrain.settings.waterLevel) {
                // 创建道路表面
                for (let px = -this.width; px <= this.width; px++) {
                    for (let pz = -this.width; pz <= this.width; pz++) {
                        const py = terrain.getHeight(x + px, z + pz)
                        if (py > terrain.settings.waterLevel && py <= y + 1) {
                            builder.addBlock('stone', x + px, py, z + pz)
                        }
                    }
                }
            }
        }
    }
}
