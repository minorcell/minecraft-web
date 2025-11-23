import { createNoise2D } from '../lib/simplex-noise.js'
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
            bedrockLevel: settings.bedrockLevel || -12,
            waterLevel: settings.waterLevel || -4,
            sandLevel: settings.sandLevel || 3,
            snowLevel: settings.snowLevel || 13,
            groundDepth: settings.groundDepth || 10,
            noiseScale1: settings.noiseScale1 || 0.006,
            noiseScale2: settings.noiseScale2 || 0.025,
            noiseAmplitude1: settings.noiseAmplitude1 || 10,
            noiseAmplitude2: settings.noiseAmplitude2 || 3.5,
            noiseScale3: settings.noiseScale3 || 0.08,
            noiseAmplitude3: settings.noiseAmplitude3 || 1.25,
            continentalScale: settings.continentalScale || 0.0012,
            continentalAmplitude: settings.continentalAmplitude || 10,
            erosionScale: settings.erosionScale || 0.009,
            peakScale: settings.peakScale || 0.04,
            peakAmplitude: settings.peakAmplitude || 3,
            riverScale: settings.riverScale || 0.01,
            riverDepth: settings.riverDepth || 14,
            riverThreshold: settings.riverThreshold || 0.06,
            chunkSize: settings.chunkSize || 16,
            // 生物群系噪声参数
            temperatureScale: settings.temperatureScale || 0.005,
            moistureScale: settings.moistureScale || 0.005,
            seed: settings.seed || Date.now()
        }

        // 种子化随机源，确保地形确定性
        this.random = new SeededRandom(this.settings.seed)
        // 限制地表最低高度，避免河道/噪声切穿基岩层
        this.minSurfaceLevel = Math.max(this.settings.bottomLevel, this.settings.bedrockLevel + 1)
        this.maxSurfaceLevel = this.settings.snowLevel + 24
        this.lowlandCenter = this.settings.waterLevel + 3
        this.lowlandRange = 14
        this.lowlandFlattenStrength = 0.4

        // 初始化噪声生成器
        this.noise2D = createNoise2D(() => this.random.float())
        // 额外的气候噪声（使用偏移后的随机源，避免高度噪声相关性）
        this.temperatureNoise = createNoise2D(() => this.random.cloneWithOffset(101).float())
        this.moistureNoise = createNoise2D(() => this.random.cloneWithOffset(202).float())
        this.extraNoise = createNoise2D(() => this.random.cloneWithOffset(303).float())
        this.continentalNoise = createNoise2D(() => this.random.cloneWithOffset(404).float())
        this.erosionNoise = createNoise2D(() => this.random.cloneWithOffset(505).float())
        this.peakNoise = createNoise2D(() => this.random.cloneWithOffset(606).float())
        this.riverNoise = createNoise2D(() => this.random.cloneWithOffset(707).float())

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
        const h3 = this.extraNoise(x * this.settings.noiseScale3, z * this.settings.noiseScale3) * this.settings.noiseAmplitude3
        // 大尺度海陆基线
        const contRaw = this.continentalNoise(x * this.settings.continentalScale, z * this.settings.continentalScale)
        const continentalBase = contRaw * this.settings.continentalAmplitude
        // 侵蚀控制起伏强度
        const erosionRaw = this.erosionNoise(x * this.settings.erosionScale, z * this.settings.erosionScale)
        // map [-1,1] -> [0.5,1.5]
        const erosionMul = 0.5 + (erosionRaw + 1) * 0.5
        // 山峰 ridge，仅在大陆高区
        const peakRaw = this.peakNoise(x * this.settings.peakScale, z * this.settings.peakScale)
        const ridge = Math.pow(1 - Math.abs(peakRaw), 2) * this.settings.peakAmplitude
        const peakWeight = Math.max(0, Math.min(1, (contRaw - 0.25) / 0.55)) * 0.25
        const peaks = ridge * peakWeight
        // 河道切削
        const riverVal = Math.abs(this.riverNoise(x * this.settings.riverScale, z * this.settings.riverScale))
        const riverCut = riverVal < this.settings.riverThreshold
            ? Math.pow((this.settings.riverThreshold - riverVal) / this.settings.riverThreshold, 1.1) * this.settings.riverDepth
            : 0

        const detail = (h2 * 0.6) + (h3 * 0.35) + (peaks * 0.7)
        const baseHeight = continentalBase + (h1 * 0.65) + erosionMul * detail
        const rawHeight = baseHeight - riverCut
        const flattened = this.flattenLowlands(rawHeight)
        const clamped = Math.max(this.minSurfaceLevel, Math.min(flattened, this.maxSurfaceLevel))
        const height = Math.floor(clamped)

        // 缓存结果
        this.heightCache.set(cacheKey, height)

        return height
    }

    /**
     * 在低地附近压平地形，增加平原/河谷面积
     * @param {number} height
     * @returns {number}
     */
    flattenLowlands(height) {
        const t = 1 - Math.min(1, Math.abs(height - this.lowlandCenter) / this.lowlandRange)
        if (t <= 0) return height
        const k = t * this.lowlandFlattenStrength
        return height * (1 - k) + this.lowlandCenter * k
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
                for (let y = this.settings.bedrockLevel; y < surfaceY; y++) {
                    const depthFromSurface = surfaceY - y
                    let undergroundType
                    if (y <= this.settings.bedrockLevel + 1) {
                        undergroundType = 'bedrock'
                    } else if (surfaceY < this.settings.waterLevel) {
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

        if (h >= this.settings.snowLevel + 4 || (climate.temperature < 0.3 && h >= this.settings.snowLevel + 2)) {
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
        this.minSurfaceLevel = Math.max(this.settings.bottomLevel, this.settings.bedrockLevel + 1)
        this.maxSurfaceLevel = this.settings.snowLevel + 24
        this.lowlandCenter = this.settings.waterLevel + 3
        this.lowlandRange = 14
        this.lowlandFlattenStrength = 0.4
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
        return this.getHeight(x, z) >= this.settings.snowLevel + 3
    }
}
