import * as THREE from 'three'
import { generateGrassTop } from './generators/grass_top.js'
import { generateGrassSide } from './generators/grass_side.js'
import { generateDirt } from './generators/dirt.js'
import { generateStone } from './generators/stone.js'
import { generateWoodSide } from './generators/wood_side.js'
import { generateWoodTop } from './generators/wood_top.js'
import { generateLeaves } from './generators/leaves.js'
import { generateSpruceLeaves } from './generators/spruce_leaves.js'
import { generateBirchLeaves } from './generators/birch_leaves.js'
import { generateJungleLeaves } from './generators/jungle_leaves.js'
import { generateSand } from './generators/sand.js'
import { generateWater, generateWaterStill } from './generators/water.js'
import { generateSnow } from './generators/snow.js'
import { generateCactus } from './generators/cactus.js'
import { generateFlower } from './generators/flower.js'
import { generateGlass } from './generators/glass.js'
import { generateRoof } from './generators/roof.js'
import { generateCopperRoof } from './generators/copper_roof.js'
import { generateCrack } from './generators/crack.js'
import { generateTorch } from './generators/torch.js'
import { generateFlame } from './generators/flame.js'
import { generateFlameTip } from './generators/flame_tip.js'
import { generateFlowerPetal } from './generators/flower_petal.js'
import { generateFlowerStem } from './generators/flower_stem.js'
import { generateDefault } from './generators/default.js'

const generators = {
    grass_top: generateGrassTop,
    grass_side: generateGrassSide,
    dirt: generateDirt,
    stone: generateStone,
    bedrock: generateStone,
    wood_side: generateWoodSide,
    wood_top: generateWoodTop,
    leaves: generateLeaves,
    spruce_leaves: generateSpruceLeaves,
    birch_leaves: generateBirchLeaves,
    jungle_leaves: generateJungleLeaves,
    sand: generateSand,
    water: generateWater,
    water_wavy: generateWater,
    water_still: generateWaterStill,
    snow: generateSnow,
    cactus: generateCactus,
    flower: generateFlower,
    glass: generateGlass,
    roof: generateRoof,
    copper_roof: generateCopperRoof,
    crack: generateCrack,
    torch: generateTorch,
    flame: generateFlame,
    flame_tip: generateFlameTip,
    flower_petal: generateFlowerPetal,
    flower_stem: generateFlowerStem,
    default: generateDefault
}

export class TextureFactory {
    constructor() {
        this.textureCache = {}
        this.canvasCache = {}
        this.variants = 4
    }

    createTexture(type, variant = 0) {
        const key = `${type}_${variant}`
        if (this.textureCache[key]) return this.textureCache[key]

        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        const gen = generators[type] || generators.default
        gen(ctx, variant, variant)

        this.canvasCache[key] = canvas
        const texture = new THREE.CanvasTexture(canvas)
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        texture.colorSpace = THREE.SRGBColorSpace
        this.textureCache[key] = texture
        return texture
    }

    getCanvas(type, variant = 0) {
        const key = `${type}_${variant}`
        if (this.canvasCache[key]) return this.canvasCache[key]
        this.createTexture(type, variant)
        return this.canvasCache[key] || null
    }

    createDestructionTexture(stage = 0, totalStages = 5) {
        const s = Math.max(0, Math.min(totalStages, stage | 0))
        const key = `destruction_${s}_${totalStages}`
        if (this.textureCache[key]) return this.textureCache[key]

        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, 64, 64)

        ctx.strokeStyle = '#111'
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.9
        const rand = Math.random
        ctx.beginPath()
        let x = rand() * 30 + 17
        let y = rand() * 30 + 17
        ctx.moveTo(x, y)
        const segments = 7
        for (let i = 0; i < segments; i++) {
            x += (rand() - 0.5) * 18
            y += (rand() - 0.5) * 18
            x = Math.max(4, Math.min(60, x))
            y = Math.max(4, Math.min(60, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()

        ctx.strokeStyle = '#222'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        for (let i = 0; i < 4; i++) {
            ctx.beginPath()
            const bx = rand() * 50 + 7
            const by = rand() * 50 + 7
            ctx.moveTo(bx, by)
            ctx.lineTo(bx + (rand() - 0.5) * 22, by + (rand() - 0.5) * 22)
            ctx.stroke()
        }

        ctx.globalCompositeOperation = 'destination-out'
        const holes = 6 + s * 4
        const maxSize = 10 + s * 2
        for (let i = 0; i < holes; i++) {
            const w = 4 + rand() * maxSize
            const h = 4 + rand() * maxSize
            const hx = rand() * (64 - w)
            const hy = rand() * (64 - h)
            ctx.fillRect(hx, hy, w, h)
        }
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0

        const tex = new THREE.CanvasTexture(canvas)
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        tex.colorSpace = THREE.SRGBColorSpace
        this.textureCache[key] = tex
        this.canvasCache[key] = canvas
        return tex
    }
}
