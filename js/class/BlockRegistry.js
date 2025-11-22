/**
 * 方块注册表：记录世界中每个方块的类型，支持查询/增删
 * 仅存储基本类型和坐标，便于射线拾取和交互
 */
export class BlockRegistry {
    constructor() {
        /** @type {Map<string, string>} */
        this.map = new Map()
    }

    /**
     * 坐标转Key
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {string}
     */
    key(x, y, z) {
        return `${x},${y},${z}`
    }

    add(type, x, y, z) {
        this.map.set(this.key(x, y, z), type)
    }

    remove(x, y, z) {
        this.map.delete(this.key(x, y, z))
    }

    get(x, y, z) {
        return this.map.get(this.key(x, y, z)) || null
    }

    has(x, y, z) {
        return this.map.has(this.key(x, y, z))
    }
}
