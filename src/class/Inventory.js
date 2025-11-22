/**
 * 简易背包系统：固定槽位，支持添加/消耗、热键栏选中
 */
export class Inventory {
    /**
     * @param {number} size 总槽位
     * @param {Array<{type:string,count:number}>} initial 初始物品
     */
    constructor(size = 27, initial = []) {
        this.size = size
        this.slots = new Array(size).fill(null)
        initial.slice(0, size).forEach((item, idx) => {
            this.slots[idx] = { ...item }
        })
    }

    /**
     * 添加物品（简单叠加，不考虑最大堆叠）
     * @param {string} type
     * @param {number} count
     * @returns {boolean} 是否成功
     */
    add(type, count = 1) {
        // 先尝试叠加同类型
        for (let i = 0; i < this.size; i++) {
            if (this.slots[i] && this.slots[i].type === type) {
                this.slots[i].count += count
                return true
            }
        }
        // 找空位
        for (let i = 0; i < this.size; i++) {
            if (!this.slots[i]) {
                this.slots[i] = { type, count }
                return true
            }
        }
        return false
    }

    /**
     * 消耗指定槽位的一个物品
     * @param {number} index
     * @returns {string|null} 消耗的类型
     */
    consume(index) {
        const slot = this.slots[index]
        if (!slot || slot.count <= 0) return null
        slot.count -= 1
        const type = slot.type
        if (slot.count <= 0) this.slots[index] = null
        return type
    }

    /**
     * 获取槽位信息
     * @param {number} index
     * @returns {{type:string,count:number}|null}
     */
    getSlot(index) {
        return this.slots[index]
    }
}
