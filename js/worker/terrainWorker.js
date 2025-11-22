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
function generateChunkBlocks(terrain, chunkX, chunkZ, minCoord, maxCoord, chunkKey) {
    const blocks = []
    const chunkSize = terrain.settings.chunkSize
    const startX = chunkX * chunkSize
    const startZ = chunkZ * chunkSize
    const endX = startX + chunkSize
    const endZ = startZ + chunkSize

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
            for (let y = terrain.settings.bedrockLevel; y < surfaceY; y++) {
                const depthFromSurface = surfaceY - y
                let undergroundType
                if (y <= terrain.settings.bedrockLevel + 1) {
                    undergroundType = 'bedrock'
                } else if (surfaceY < terrain.settings.waterLevel) {
                    // 水下地形：地下层是 sand/stone
                    undergroundType = (depthFromSurface > 7) ? 'stone' : 'sand'
                } else {
                    // 陆地地形：地下层是 dirt/stone
                    undergroundType = (depthFromSurface > 7) ? 'stone' : 'dirt'
                }
                blocks.push({ type: undergroundType, x, y, z, chunkKey })
            }

            // ===== 2. 地表方块 =====
            blocks.push({ type: surfaceType, x, y: surfaceY, z, chunkKey })

            // ===== 3. 水层（水面以下的所有层） =====
            // 注意：只有当 surfaceY <= waterLevel 时才有水
            for (let y = surfaceY + 1; y <= terrain.settings.waterLevel; y++) {
                blocks.push({ type: 'water', x, y, z, chunkKey })
            }
        }
    }

    return blocks
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
            const { chunkX, chunkZ, minCoord, maxCoord, chunkKey, terrainSettings } = payload
            const terrain = ensureTerrain(terrainSettings)
            const blocks = generateChunkBlocks(terrain, chunkX, chunkZ, minCoord, maxCoord, chunkKey)
            self.postMessage({ type: 'chunkData', payload: { chunkKey, blocks } })
        } catch (err) {
            console.error('Worker chunk generation failed', err)
            self.postMessage({ type: 'error', payload: { message: err?.message || String(err) } })
        }
    }
}
