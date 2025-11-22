import { Terrain } from '../class/Terrain.js'

/**
 * 生成单个chunk的方块数据（与 Terrain.generateChunk 逻辑一致，但输出块列表）
 * @param {Terrain} terrain
 * @param {number} chunkX
 * @param {number} chunkZ
 * @param {number} minCoord
 * @param {number} maxCoord
 * @param {string} chunkKey
 * @returns {Array<{type:string,x:number,y:number,z:number,chunkKey:string}>}
 */
function estimateBlockCount(terrain, startX, endX, startZ, endZ, minCoord, maxCoord, lowDetail = false) {
    let total = 0
    const bedrock = terrain.settings.bedrockLevel
    const water = terrain.settings.waterLevel
    for (let x = startX; x < endX; x++) {
        if (x < minCoord || x > maxCoord) continue
        for (let z = startZ; z < endZ; z++) {
            if (z < minCoord || z > maxCoord) continue
            const surfaceY = terrain.getHeight(x, z)
            const underground = lowDetail ? 0 : Math.max(0, surfaceY - bedrock)
            const surface = 1
            const waterLayers = surfaceY < water ? (water - surfaceY) : 0
            total += underground + surface + waterLayers
        }
    }
    return total
}

function generateChunkBlocksPacked(terrain, chunkX, chunkZ, minCoord, maxCoord, blockIds, lowDetail = false) {
    const chunkSize = terrain.settings.chunkSize
    const startX = chunkX * chunkSize
    const startZ = chunkZ * chunkSize
    const endX = startX + chunkSize
    const endZ = startZ + chunkSize
    const total = estimateBlockCount(terrain, startX, endX, startZ, endZ, minCoord, maxCoord, lowDetail)

    const xs = new Int16Array(total)
    const ys = new Int16Array(total)
    const zs = new Int16Array(total)
    const types = new Uint16Array(total)
    const typeToIndex = new Map(blockIds.map((id, idx) => [id, idx]))
    const bedrock = terrain.settings.bedrockLevel
    const water = terrain.settings.waterLevel

    let idx = 0

    for (let x = startX; x < endX; x++) {
        if (x < minCoord || x > maxCoord) continue

        for (let z = startZ; z < endZ; z++) {
            if (z < minCoord || z > maxCoord) continue

            const surfaceY = terrain.getHeight(x, z)

            // ===== 获取地表类型（按群系） =====
            let surfaceType = terrain.getSurfaceBlockType(x, z)
            if (!surfaceType) {
                // 水下默认使用沙子顶部
                surfaceType = 'sand'
            }

            // ===== 1. 地下层（从底部到地表） =====
            if (!lowDetail) {
                for (let y = bedrock; y < surfaceY; y++) {
                    const depthFromSurface = surfaceY - y
                    let undergroundType
                    if (y <= bedrock + 1) {
                        undergroundType = 'bedrock'
                    } else if (surfaceY < water) {
                        // 水下地形：地下层是 sand/stone
                        undergroundType = (depthFromSurface > 7) ? 'stone' : 'sand'
                    } else {
                        // 陆地地形：地下层是 dirt/stone
                        undergroundType = (depthFromSurface > 7) ? 'stone' : 'dirt'
                    }
                    xs[idx] = x
                    ys[idx] = y
                    zs[idx] = z
                    types[idx] = typeToIndex.get(undergroundType) ?? 0
                    idx++
                }
            }

            // ===== 2. 地表方块 =====
            xs[idx] = x
            ys[idx] = surfaceY
            zs[idx] = z
            types[idx] = typeToIndex.get(surfaceType) ?? 0
            idx++

            // ===== 3. 水层（水面以下的所有层） =====
            // 注意：只有当 surfaceY <= waterLevel 时才有水
            for (let y = surfaceY + 1; y <= water; y++) {
                xs[idx] = x
                ys[idx] = y
                zs[idx] = z
                types[idx] = typeToIndex.get('water') ?? 0
                idx++
            }
        }
    }

    // 可能因为 min/max 裁剪导致总量小于估算，做一次截断
    return {
        xs: idx === xs.length ? xs : xs.slice(0, idx),
        ys: idx === ys.length ? ys : ys.slice(0, idx),
        zs: idx === zs.length ? zs : zs.slice(0, idx),
        types: idx === types.length ? types : types.slice(0, idx)
    }
}

let terrainCache = null
let terrainSettingsKey = ''

function ensureTerrain(settings) {
    // 使用简单序列化判断设置变化
    const key = JSON.stringify(settings)
    if (!terrainCache || terrainSettingsKey !== key) {
        terrainCache = new Terrain(settings)
        terrainSettingsKey = key
    }
    return terrainCache
}

self.onmessage = (event) => {
    const { type, payload } = event.data || {}

    if (type === 'generateChunk') {
        try {
            const { chunkX, chunkZ, minCoord, maxCoord, chunkKey, terrainSettings, blockIds = [], lowDetail = false } = payload
            const terrain = ensureTerrain(terrainSettings)
            const packed = generateChunkBlocksPacked(terrain, chunkX, chunkZ, minCoord, maxCoord, blockIds, lowDetail)
            self.postMessage(
                { type: 'chunkData', payload: { chunkKey, blockIds, ...packed } },
                [packed.xs.buffer, packed.ys.buffer, packed.zs.buffer, packed.types.buffer]
            )
        } catch (err) {
            console.error('Worker chunk generation failed', err)
            self.postMessage({ type: 'error', payload: { message: err?.message || String(err) } })
        }
    }
}
