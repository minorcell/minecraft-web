import { Terrain } from '../class/Terrain.js'
import { SeededRandom } from '../class/Random.js'

const getChunkKey = (x, z, chunkSize) => `${Math.floor(x / chunkSize)},${Math.floor(z / chunkSize)}`

const isNearVillage = (x, z, villages = [], minDistance = 25) => {
    for (const v of villages) {
        const dx = x - v.x
        const dz = z - v.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < minDistance + v.radius) return true
    }
    return false
}

const getTreeStyle = (biome, rand) => {
    if (biome === 'taiga' || biome === 'snow') return 'spruce'
    if (biome === 'desert') return 'shrub'
    if (biome === 'forest') {
        // 在森林生物群系中随机选择不同树种
        const r = rand.float()
        if (r < 0.5) return 'oak'
        if (r < 0.75) return 'birch'
        return 'jungle'
    }
    // 默认在平原生物群系中
    return rand.float() > 0.7 ? (rand.float() > 0.5 ? 'birch' : 'spruce') : 'oak'
}

const buildOak = (addBlock, x, y, z, height) => {
    for (let h = 1; h <= height; h++) {
        addBlock('wood', x, y + h, z)
    }

    for (let h = height - 1; h <= height + 2; h++) {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                if (Math.abs(i) + Math.abs(j) < 3) {
                    if (i === 0 && j === 0 && h < height + 1) continue
                    addBlock('leaves', x + i, y + h, z + j)
                }
            }
        }
    }
}

const buildSpruce = (addBlock, x, y, z, height) => {
    const h = height + 2
    for (let yy = 1; yy <= h; yy++) {
        addBlock('wood', x, y + yy, z)
    }

    for (let level = 0; level < 4; level++) {
        const radius = 3 - level
        const leafY = y + h - level
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                if (Math.abs(i) + Math.abs(j) <= radius + 1) {
                    addBlock('spruce_leaves', x + i, leafY, z + j)
                }
            }
        }
    }

    addBlock('spruce_leaves', x, y + h + 1, z)
}

const buildBirch = (addBlock, x, y, z, height) => {
    for (let h = 1; h <= height; h++) {
        addBlock('wood', x, y + h, z)
    }

    // 桦树有更圆的树冠
    for (let h = height - 1; h <= height + 3; h++) {
        for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
                const dist = Math.abs(i) + Math.abs(j)
                if (dist < 4) {
                    if (i === 0 && j === 0 && h < height + 2) continue
                    addBlock('birch_leaves', x + i, y + h, z + j)
                }
            }
        }
    }
}

const buildJungle = (addBlock, x, y, z, height) => {
    // 丛林树更高
    const jungleHeight = height + 2
    for (let h = 1; h <= jungleHeight; h++) {
        addBlock('wood', x, y + h, z)
    }

    // 丛林树有更大更密的树冠
    for (let h = jungleHeight - 1; h <= jungleHeight + 4; h++) {
        for (let i = -4; i <= 4; i++) {
            for (let j = -4; j <= 4; j++) {
                const dist = Math.abs(i) + Math.abs(j)
                if (dist < 5) {
                    if (i === 0 && j === 0 && h < jungleHeight + 2) continue
                    addBlock('jungle_leaves', x + i, y + h, z + j)
                }
            }
        }
    }
}

const buildShrub = (addBlock, x, y, z, rand) => {
    const shrubHeight = 1 + Math.floor(rand.float() * 2)
    addBlock('wood', x, y + 1, z)
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let h = 0; h <= shrubHeight; h++) {
                if (Math.abs(i) + Math.abs(j) <= 2) {
                    addBlock('leaves', x + i, y + 1 + h, z + j)
                }
            }
        }
    }
}

function generateDecorations(payload) {
    const { seed, worldSize, terrainSettings, counts = {}, villages = [] } = payload
    const rand = new SeededRandom(seed)
    const terrain = new Terrain(terrainSettings)
    const chunkSize = terrain.settings.chunkSize
    const waterLevel = terrain.settings.waterLevel
    const snowLevel = terrain.settings.snowLevel

    const grassCount = counts.grassCount || 0
    const treeCount = counts.treeCount || 0
    const flowerCount = counts.flowerCount ?? Math.floor(grassCount * 0.25)
    const cactusCount = counts.cactusCount ?? Math.floor(treeCount * 0.3)

    const blocks = []
    const decorations = []

    const addBlock = (type, x, y, z) => {
        blocks.push({ type, x, y, z, chunkKey: getChunkKey(x, z, chunkSize) })
    }

    // 草丛（当前实现为地面花朵）
    for (let i = 0; i < grassCount; i++) {
        const x = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const z = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const y = terrain.getHeight(x, z)
        const biome = terrain.getBiome(x, z)

        if (y > waterLevel &&
            y < snowLevel &&
            !terrain.isUnderwater(x, z) &&
            !['desert', 'beach', 'snow'].includes(biome.name)) {

            decorations.push({ type: 'grass', x, y, z })
            const count = 2 + Math.floor(rand.float() * 4)
            for (let t = 0; t < count; t++) {
                const offsetX = Math.floor((rand.float() - 0.5) * 2)
                const offsetZ = Math.floor((rand.float() - 0.5) * 2)
                const gy = terrain.getHeight(x + offsetX, z + offsetZ)
                if (gy > waterLevel && gy < snowLevel) {
                    addBlock('flower', x + offsetX, gy + 1, z + offsetZ)
                }
            }
        }
    }

    // 花簇
    for (let i = 0; i < flowerCount; i++) {
        const x = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const z = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const y = terrain.getHeight(x, z)
        const biome = terrain.getBiome(x, z)

        if (['plains', 'forest'].includes(biome.name) &&
            y > waterLevel &&
            !terrain.isUnderwater(x, z)) {
            const count = 3 + Math.floor(rand.float() * 4)
            let placed = 0
            for (let j = 0; j < count; j++) {
                const ox = Math.floor((rand.float() - 0.5) * 3)
                const oz = Math.floor((rand.float() - 0.5) * 3)
                const gy = terrain.getHeight(x + ox, z + oz)
                if (gy > waterLevel) {
                    addBlock('flower', x + ox, gy + 1, z + oz)
                    placed++
                }
            }
            if (placed > 0) {
                decorations.push({ type: 'flower', x, y, z })
            }
        }
    }

    // 仙人掌
    for (let i = 0; i < cactusCount; i++) {
        const x = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const z = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const y = terrain.getHeight(x, z)
        const biome = terrain.getBiome(x, z)

        if (biome.name === 'desert' &&
            y > waterLevel &&
            !terrain.isUnderwater(x, z)) {
            const height = 2 + Math.floor(rand.float() * 3)
            for (let h = 0; h < height; h++) {
                addBlock('cactus', x, y + 1 + h, z)
            }
            decorations.push({ type: 'cactus', x, y, z })
        }
    }

    // 树木
    for (let i = 0; i < treeCount; i++) {
        const x = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const z = Math.floor((rand.float() - 0.5) * worldSize * 2)
        const y = terrain.getHeight(x, z)

        if (y > waterLevel && !terrain.isUnderwater(x, z)) {
            const biome = terrain.getBiome(x, z)
            if (['desert', 'beach', 'snow'].includes(biome.name)) {
                continue
            }
            if (isNearVillage(x, z, villages, 25)) {
                continue
            }
            const style = getTreeStyle(biome.name, rand)
            const height = 3 + Math.floor(rand.float() * 3)

            if (style === 'spruce') {
                buildSpruce(addBlock, x, y, z, height)
            } else if (style === 'birch') {
                buildBirch(addBlock, x, y, z, height)
            } else if (style === 'jungle') {
                buildJungle(addBlock, x, y, z, height)
            } else if (style === 'shrub') {
                buildShrub(addBlock, x, y, z, rand)
            } else {
                buildOak(addBlock, x, y, z, height)
            }

            decorations.push({ type: 'tree', style, x, y, z })
        }
    }

    return { blocks, decorations }
}

self.onmessage = (event) => {
    const { type, payload } = event.data || {}
    if (type === 'generateDecorations') {
        try {
            const result = generateDecorations(payload)
            self.postMessage({ type: 'decorationsData', payload: result })
        } catch (err) {
            console.error('Decor worker failed', err)
            self.postMessage({ type: 'error', payload: { message: err?.message || String(err) } })
        }
    }
}
