import { blocks, tools } from '../blocks/blocks.js'

/**
 * 方块定义注册中心：硬度/可破坏/材质键等静态属性
 */
export class BlockDefinitions {
    constructor() {
        this.map = new Map()
        blocks.forEach(def => this.map.set(def.id, def))
        this.tools = tools || {}
    }

    get(id) {
        return this.map.get(id) || null
    }

    isSolid(id) {
        const def = this.get(id)
        return def ? !!def.solid : false
    }

    isBreakable(id) {
        const def = this.get(id)
        return def ? def.breakable !== false : true
    }

    getHardness(id) {
        const def = this.get(id)
        if (!def) return 0.6
        if (def.breakable === false) return Infinity
        return def.hardness ?? 0.6
    }

    getDrops(id) {
        const def = this.get(id)
        return def ? def.drops || [] : []
    }

    getTextures(id) {
        const def = this.get(id)
        return def ? def.textures || {} : {}
    }

    getMaterialOptions(id) {
        const def = this.get(id)
        if (!def) return { transparent: false, opacity: 1.0 }
        return {
            transparent: !!def.transparent,
            opacity: def.opacity !== undefined ? def.opacity : 1.0
        }
    }

    getToolPower(toolId) {
        if (!toolId) return this.tools.empty ?? 0.6
        return this.tools[toolId] ?? this.tools.default ?? 1.0
    }
}
