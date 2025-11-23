import { blocks, tools } from '../blocks/blocks.js'

/**
 * 方块定义注册中心：硬度/可破坏/材质键等静态属性
 */
export class BlockDefinitions {
    constructor() {
        this.map = new Map()
        blocks.forEach((def, idx) => this.map.set(def.id, { ...def, _index: idx }))
        this.idList = blocks.map(b => b.id)
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

    getShape(id) {
        const def = this.get(id)
        return def ? def.shape || 'cube' : 'cube'
    }

    getDefaultMeta(id) {
        const def = this.get(id)
        return def && def.defaultMeta ? { ...def.defaultMeta } : null
    }

    getMaterialOptions(id) {
        const def = this.get(id)
        if (!def) return { transparent: false, opacity: 1.0 }
        return {
            transparent: !!def.transparent,
            opacity: def.opacity !== undefined ? def.opacity : 1.0,
            renderLayer: def.renderLayer || 'solid'
        }
    }

    getToolPower(toolId) {
        if (!toolId) return this.tools.empty ?? 0.6
        return this.tools[toolId] ?? this.tools.default ?? 1.0
    }

    getIndex(id) {
        const def = this.get(id)
        return def && def._index !== undefined ? def._index : -1
    }

    getIdByIndex(idx) {
        return this.idList[idx] || null
    }

    getAllIds() {
        return [...this.idList]
    }
}
