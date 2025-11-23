/**
 * 方块存储：记录世界坐标上的方块类型（轻量级映射）
 */
export class BlockStore {
    constructor() {
        /** @type {Map<string, { type: string, meta?: any }>} */
        this.map = new Map()
    }

    key(x, y, z) {
        return `${x},${y},${z}`
    }

    add(type, x, y, z, meta = null) {
        this.map.set(this.key(x, y, z), { type, meta })
    }

    remove(x, y, z) {
        this.map.delete(this.key(x, y, z))
    }

    get(x, y, z) {
        const entry = this.map.get(this.key(x, y, z))
        return entry ? entry.type : null
    }

    getEntry(x, y, z) {
        return this.map.get(this.key(x, y, z)) || null
    }

    has(x, y, z) {
        return this.map.has(this.key(x, y, z))
    }

    clear() {
        this.map.clear()
    }
}
