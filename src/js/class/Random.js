/**
 * 简单的可重复随机数生成器（Mulberry32）
 * 支持字符串或数字种子，用于确保世界生成的确定性
 */
export class SeededRandom {
    /**
     * @param {string|number} seed - 随机种子
     */
    constructor(seed = Date.now()) {
        this.seed = SeededRandom.hash(seed)
        this.state = this.seed
    }

    /**
     * 将任意输入转成32位无符号整数种子
     * @param {string|number} seed
     * @returns {number}
     */
    static hash(seed) {
        if (typeof seed === 'number') {
            return seed >>> 0
        }

        // xmur3 字符串哈希
        let h = 1779033703 ^ String(seed).length
        for (let i = 0; i < String(seed).length; i++) {
            h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353)
            h = (h << 13) | (h >>> 19)
        }
        h = Math.imul(h ^ (h >>> 16), 2246822507)
        h = Math.imul(h ^ (h >>> 13), 3266489909)
        h ^= h >>> 16
        return h >>> 0
    }

    /**
     * 生成一个新的随机32位无符号整数
     * @returns {number}
     */
    next() {
        let t = this.state + 0x6D2B79F5
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        this.state = t ^ (t >>> 14)
        return this.state >>> 0
    }

    /**
     * 返回 [0,1) 区间的浮点数
     * @returns {number}
     */
    float() {
        return this.next() / 0x100000000
    }

    /**
     * 返回 [min, max) 区间的浮点数
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    range(min, max) {
        return min + (max - min) * this.float()
    }

    /**
     * 返回 [min, max) 区间的整数
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    int(min, max) {
        return Math.floor(this.range(min, max))
    }

    /**
     * 基于当前状态偏移生成新的随机源（避免互相影响）
     * @param {number} offset
     * @returns {SeededRandom}
     */
    cloneWithOffset(offset = 1) {
        return new SeededRandom((this.state + offset) >>> 0)
    }
}
