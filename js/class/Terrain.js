import { createNoise2D } from 'simplex-noise'
import { SeededRandom } from './Random.js'

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
            noiseAmplitude2: settings.noiseAmplitude2 || 2,
            chunkSize: settings.chunkSize || 16,
            // 生物群系噪声参数
            temperatureScale: settings.temperatureScale || 0.005,
            moistureScale: settings.moistureScale || 0.005,
            seed: settings.seed || Date.now()
        }

        // 种子化随机源，确保地形确定性
        this.random = new SeededRandom(this.settings.seed)

        // 初始化噪声生成器
        this.noise2D = createNoise2D(() => this.random.float())
        // 额外的气候噪声（使用偏移后的随机源，避免高度噪声相关性）
        this.temperatureNoise = createNoise2D(() => this.random.cloneWithOffset(101).float())
        this.moistureNoise = createNoise2D(() => this.random.cloneWithOffset(202).float())

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
            return null
        }

        const biome = this.getBiome(x, z)
        switch (biome.name) {
            case 'desert':
            case 'beach':
                return 'sand'
            case 'snow':
            case 'taiga':
                return 'snow'
            default:
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
        const minCoord = -size
        const maxCoord = size - 1

        // 按chunk遍历，便于后续惰性加载
        const chunkStartX = Math.floor(minCoord / this.settings.chunkSize)
        const chunkEndX = Math.floor(maxCoord / this.settings.chunkSize)
        const chunkStartZ = Math.floor(minCoord / this.settings.chunkSize)
        const chunkEndZ = Math.floor(maxCoord / this.settings.chunkSize)

        for (let cx = chunkStartX; cx <= chunkEndX; cx++) {
            for (let cz = chunkStartZ; cz <= chunkEndZ; cz++) {
                this.generateChunk(builder, cx, cz, minCoord, maxCoord)
            }
        }

        console.timeEnd('Terrain Generation')
    }

    /**
     * 生成单个chunk（目前仍然一次性生成，后续可按需加载）
     * @param {VoxelBuilder} builder
     * @param {number} chunkX
     * @param {number} chunkZ
     * @param {number} minCoord
     * @param {number} maxCoord
     */
    generateChunk(builder, chunkX, chunkZ, minCoord, maxCoord, chunkKey = null) {
        const chunkSize = this.settings.chunkSize
        const startX = chunkX * chunkSize
        const startZ = chunkZ * chunkSize
        const endX = startX + chunkSize
        const endZ = startZ + chunkSize

        const key = chunkKey || `${chunkX},${chunkZ}`

        for (let x = startX; x < endX; x++) {
            if (x < minCoord || x > maxCoord) continue

            for (let z = startZ; z < endZ; z++) {
                if (z < minCoord || z > maxCoord) continue

                const surfaceY = this.getHeight(x, z)

                // ===== 获取地表类型（按群系） =====
                let surfaceType = this.getSurfaceBlockType(x, z)
                if (!surfaceType) {
                    // 水下默认使用沙子顶部
                    surfaceType = 'sand'
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
                    builder.addBlock(undergroundType, x, y, z, null, key)
                }

                // ===== 2. 地表方块 =====
                builder.addBlock(surfaceType, x, surfaceY, z, null, key)

                // ===== 3. 水层（水面以下的所有层） =====
                // 注意：只有当 surfaceY <= waterLevel 时才有水
                for (let y = surfaceY + 1; y <= this.settings.waterLevel; y++) {
                    builder.addBlock('water', x, y, z, null, key)
                }
            }
        }
    }

    /**
     * 获取地形设置
     * @returns {object}
     */
    getSettings() {
        return { ...this.settings }
    }

    /**
     * 采样气候噪声，返回温度/湿度 0-1
     * @param {number} x
     * @param {number} z
     * @returns {{temperature:number, moisture:number}}
     */
    sampleClimate(x, z) {
        const t = this.temperatureNoise(x * this.settings.temperatureScale, z * this.settings.temperatureScale)
        const m = this.moistureNoise(x * this.settings.moistureScale, z * this.settings.moistureScale)
        // 将噪声映射到 0-1
        return {
            temperature: 0.5 * (t + 1),
            moisture: 0.5 * (m + 1)
        }
    }

    /**
     * 根据高度 + 气候判断生物群系
     * 简化版，后续可扩展更细分的群系/混合边界
     * @param {number} x
     * @param {number} z
     * @returns {{name:string, temperature:number, moisture:number}}
     */
    getBiome(x, z) {
        const climate = this.sampleClimate(x, z)
        const h = this.getHeight(x, z)

        // 水面以下或很靠近水面，判定为海/海滩
        if (h <= this.settings.waterLevel) {
            return { name: 'ocean', ...climate }
        }
        if (h <= this.settings.waterLevel + 1) {
            return { name: 'beach', ...climate }
        }

        // 简单阈值决策
        if (climate.temperature > 0.6 && climate.moisture < 0.35) {
            return { name: 'desert', ...climate }
        }

        if (climate.temperature < 0.35 && h >= this.settings.snowLevel - 2) {
            return { name: 'snow', ...climate }
        }

        if (climate.temperature < 0.45 && climate.moisture > 0.45) {
            return { name: 'taiga', ...climate }
        }

        if (climate.moisture > 0.6) {
            return { name: 'forest', ...climate }
        }

        return { name: 'plains', ...climate }
    }

    /**
     * 更新地形设置
     * @param {object} newSettings
     */
    updateSettings(newSettings) {
        const seedChanged = newSettings.seed !== undefined && newSettings.seed !== this.settings.seed
        this.settings = { ...this.settings, ...newSettings }
        this.heightCache.clear() // 清空缓存

        if (seedChanged) {
            // 重新初始化随机源与噪声
            this.random = new SeededRandom(this.settings.seed)
            this.noise2D = createNoise2D(() => this.random.float())
            this.temperatureNoise = createNoise2D(() => this.random.cloneWithOffset(101).float())
            this.moistureNoise = createNoise2D(() => this.random.cloneWithOffset(202).float())
        }
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
