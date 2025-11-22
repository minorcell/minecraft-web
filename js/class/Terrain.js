import { createNoise2D } from 'simplex-noise'

/**
 * 地形管理系统
 * 负责地形生成、高度计算、地层生成
 */
export class Terrain {
    constructor(settings = {}) {
        // 地形配置
        this.settings = {
            worldSize: settings.worldSize || 128,
            bottomLevel: settings.bottomLevel || -10,
            waterLevel: settings.waterLevel || -5,
            sandLevel: settings.sandLevel || 3,
            snowLevel: settings.snowLevel || 12,
            groundDepth: settings.groundDepth || 10,
            noiseScale1: settings.noiseScale1 || 0.01,
            noiseScale2: settings.noiseScale2 || 0.05,
            noiseAmplitude1: settings.noiseAmplitude1 || 10,
            noiseAmplitude2: settings.noiseAmplitude2 || 2
        }

        // 初始化噪声生成器
        this.noise2D = createNoise2D()

        // 地形高度缓存（可选优化）
        this.heightCache = new Map()
    }

    /**
     * 获取指定坐标的地形高度
     * @param {number} x - X坐标
     * @param {number} z - Z坐标
     * @returns {number} 地形高度
     */
    getHeight(x, z) {
        // 检查缓存
        const cacheKey = `${x},${z}`
        if (this.heightCache.has(cacheKey)) {
            return this.heightCache.get(cacheKey)
        }

        // 多层噪声生成细节
        const h1 = this.noise2D(x * this.settings.noiseScale1, z * this.settings.noiseScale1) * this.settings.noiseAmplitude1
        const h2 = this.noise2D(x * this.settings.noiseScale2, z * this.settings.noiseScale2) * this.settings.noiseAmplitude2
        const height = Math.floor(h1 + h2)

        // 缓存结果
        this.heightCache.set(cacheKey, height)

        return height
    }

    /**
     * 获取指定坐标的表面方块类型
     * @param {number} x - X坐标
     * @param {number} z - Z坐标
     * @returns {string} 方块类型
     */
    getSurfaceBlockType(x, z) {
        const y = this.getHeight(x, z)

        if (y <= this.settings.waterLevel) {
            // 在水下，不返回表面类型
            return null
        } else if (y <= this.settings.sandLevel) {
            return 'sand'
        } else if (y >= this.settings.snowLevel) {
            return 'stone'
        } else {
            return 'grass'
        }
    }

    /**
     * 获取指定坐标和深度处的方块类型
     * @param {number} x - X坐标
     * @param {number} z - Z坐标
     * @param {number} y - Y坐标
     * @returns {string} 方块类型
     */
    getBlockTypeAt(x, z, y) {
        const surfaceY = this.getHeight(x, z)

        if (y > surfaceY) {
            return null // 空气
        }

        if (surfaceY < this.settings.waterLevel) {
            // 水下地形
            if (y > surfaceY && y <= this.settings.waterLevel) {
                return 'water'
            }

            // 地下层
            const depthFromSurface = surfaceY - y
            if (depthFromSurface > 7) {
                return 'stone'
            } else {
                return 'sand'
            }
        } else {
            // 陆地地形
            if (y === surfaceY) {
                return this.getSurfaceBlockType(x, z)
            }

            // 地下层
            const depthFromSurface = surfaceY - y
            if (depthFromSurface > 7) {
                return 'stone'
            } else {
                return 'dirt'
            }
        }
    }

    /**
     * 生成整个地形的方块数据
     * @param {VoxelBuilder} builder - 方块构建器
     */
    generateTerrain(builder) {
        console.time('Terrain Generation')

        const size = this.settings.worldSize

        for (let x = -size; x < size; x++) {
            for (let z = -size; z < size; z++) {
                const surfaceY = this.getHeight(x, z)

                // ===== 获取地表类型 =====
                let surfaceType
                if (surfaceY <= this.settings.sandLevel) {
                    surfaceType = 'sand'
                } else if (surfaceY >= this.settings.snowLevel) {
                    surfaceType = 'stone'
                } else {
                    surfaceType = 'grass'
                }

                // ===== 1. 地下层（从底部到地表） =====
                for (let y = this.settings.bottomLevel; y < surfaceY; y++) {
                    const depthFromSurface = surfaceY - y
                    let undergroundType
                    if (surfaceY < this.settings.waterLevel) {
                        // 水下地形：地下层是 sand/stone
                        undergroundType = (depthFromSurface > 7) ? 'stone' : 'sand'
                    } else {
                        // 陆地地形：地下层是 dirt/stone
                        undergroundType = (depthFromSurface > 7) ? 'stone' : 'dirt'
                    }
                    builder.addBlock(undergroundType, x, y, z)
                }

                // ===== 2. 地表方块 =====
                builder.addBlock(surfaceType, x, surfaceY, z)

                // ===== 3. 水层（水面以下的所有层） =====
                // 注意：只有当 surfaceY <= waterLevel 时才有水
                for (let y = surfaceY + 1; y <= this.settings.waterLevel; y++) {
                    builder.addBlock('water', x, y, z)
                }
            }
        }

        console.timeEnd('Terrain Generation')
    }

    /**
     * 获取地形设置
     * @returns {object}
     */
    getSettings() {
        return { ...this.settings }
    }

    /**
     * 更新地形设置
     * @param {object} newSettings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings }
        this.heightCache.clear() // 清空缓存
    }

    /**
     * 检查坐标是否在水下
     * @param {number} x
     * @param {number} z
     * @returns {boolean}
     */
    isUnderwater(x, z) {
        return this.getHeight(x, z) <= this.settings.waterLevel
    }

    /**
     * 检查坐标是否在雪线以上
     * @param {number} x
     * @param {number} z
     * @returns {boolean}
     */
    isSnowBiome(x, z) {
        return this.getHeight(x, z) >= this.settings.snowLevel
    }
}
