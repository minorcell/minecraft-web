/**
 * 方块基础类
 * 管理方块的类型、位置、变体等属性
 */
export class Block {
    /**
     * @param {string} type - 方块类型 (grass, dirt, stone, wood, etc.)
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} z - Z坐标
     * @param {number} variant - 纹理变体 (0-3)
     */
    constructor(type, x, y, z, variant = null) {
        this.type = type
        this.x = x
        this.y = y
        this.z = z
        this.variant = variant
        this.metadata = {} // 扩展数据，如朝向、特殊属性等
    }

    /**
     * 获取方块位置
     * @returns {{x:number, y:number, z:number}}
     */
    getPosition() {
        return { x: this.x, y: this.y, z: this.z }
    }

    /**
     * 设置位置
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPosition(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    /**
     * 获取方块类型
     * @returns {string}
     */
    getType() {
        return this.type
    }

    /**
     * 设置元数据
     * @param {string} key
     * @param {any} value
     */
    setMetadata(key, value) {
        this.metadata[key] = value
    }

    /**
     * 获取元数据
     * @param {string} key
     * @returns {any}
     */
    getMetadata(key) {
        return this.metadata[key]
    }

    /**
     * 克隆方块
     * @returns {Block}
     */
    clone() {
        const block = new Block(this.type, this.x, this.y, this.z, this.variant)
        block.metadata = { ...this.metadata }
        return block
    }

    /**
     * 转换为字符串
     * @returns {string}
     */
    toString() {
        return `Block(${this.type}, ${this.x}, ${this.y}, ${this.z}, variant:${this.variant})`
    }
}
