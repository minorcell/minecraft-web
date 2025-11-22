/**
 * 装饰基类和装饰类型
 */

/**
 * 装饰基类
 */
export class Decoration {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
        this.type = 'decoration'
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z }
    }

    build(builder, terrain) {
        // 子类实现
    }
}

/**
 * 树装饰
 */
Decoration.Tree = class extends Decoration {
    constructor(x, y, z) {
        super(x, y, z)
        this.type = 'tree'
        this.height = 3 + Math.floor(Math.random() * 3)
    }

    build(builder, terrain) {
        // 树干
        for (let h = 1; h <= this.height; h++) {
            builder.addBlock('wood', this.x, this.y + h, this.z)
        }

        // 树叶
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
    constructor(x, y, z) {
        super(x, y, z)
        this.type = 'garden'
        this.size = 3
    }

    build(builder, terrain) {
        for (let gx = -1; gx <= 1; gx++) {
            for (let gz = -1; gz <= 1; gz++) {
                if (Math.random() > 0.4) {
                    builder.addBlock('dirt', this.x + gx, this.y, this.z + gz)
                    if (Math.random() > 0.6) {
                        builder.addBlock('leaves', this.x + gx, this.y + 1, this.z + gz) // 花朵
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
    constructor(x, y, z) {
        super(x, y, z)
        this.type = 'grass'
        this.count = 2 + Math.floor(Math.random() * 4) // 2-5株草
    }

    build(builder, terrain) {
        for (let t = 0; t < this.count; t++) {
            // 随机偏移位置
            const offsetX = Math.floor((Math.random() - 0.5) * 2)
            const offsetZ = Math.floor((Math.random() - 0.5) * 2)
            const groundY = terrain.getHeight(this.x + offsetX, this.z + offsetZ)

            if (groundY > terrain.settings.waterLevel && groundY < terrain.settings.snowLevel) {
                // 创建草叶 - 多层高度
                const height = 1 + Math.floor(Math.random() * 2) // 1-2层高
                for (let h = 1; h <= height; h++) {
                    // 主体草叶
                    builder.addBlock('leaves', this.x + offsetX, groundY + h, this.z + offsetZ)

                    // 添加侧叶 - 让草更分散
                    if (h === height && Math.random() > 0.6) {
                        // 添加一些侧叶
                        const directions = [
                            { x: 1, z: 0 },
                            { x: -1, z: 0 },
                            { x: 0, z: 1 },
                            { x: 0, z: -1 }
                        ]
                        // 随机选择1-2个方向添加侧叶
                        const dirCount = 1 + Math.floor(Math.random() * 2)
                        for (let d = 0; d < dirCount; d++) {
                            const dir = directions[Math.floor(Math.random() * directions.length)]
                            builder.addBlock('leaves', this.x + offsetX + dir.x, groundY + h, this.z + offsetZ + dir.z)
                        }
                    }
                }

                // 随机添加花朵
                if (Math.random() > 0.7) {
                    builder.addBlock('leaves', this.x + offsetX, groundY + height + 1, this.z + offsetZ)
                }
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
