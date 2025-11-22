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

/**
 * 方块预览渲染器：用 Canvas 2D 将方块顶面+侧面组合成等距小图标
 */
export class BlockPreviewRenderer {
    /**
     * @param {import('./BlockDefinitions.js').BlockDefinitions} blockDefs
     * @param {import('../textures.js').TextureFactory} textureFactory
     * @param {number} [size] 输出尺寸（正方形像素）
     */
    constructor(blockDefs, textureFactory, size = 64) {
        this.blockDefs = blockDefs
        this.textureFactory = textureFactory
        this.size = size
        this.cache = new Map()
        this.imageCache = new Map()
    }

    getTextureCanvas(name) {
        if (!name) return null
        if (this.imageCache.has(name)) return this.imageCache.get(name)
        const canvas = this.textureFactory.getCanvas(name, 0)
        if (canvas) this.imageCache.set(name, canvas)
        return canvas
    }

    drawPreview(topName, sideName) {
        const canvas = document.createElement('canvas')
        canvas.width = this.size
        canvas.height = this.size
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false

        const topImg = this.getTextureCanvas(topName)
        const sideImg = this.getTextureCanvas(sideName || topName)

        const topSize = this.size * 0.68
        const sideH = this.size * 0.38
        const x = (this.size - topSize) * 0.5
        const y = this.size * 0.08

        // 顶面
        if (topImg) {
            ctx.save()
            ctx.translate(x, y)
            ctx.transform(1, -0.5, 1, 0.5, 0, 0)
            ctx.drawImage(topImg, 0, 0, 64, 64, 0, 0, topSize, topSize)
            ctx.restore()
        }

        // 右侧
        if (sideImg) {
            ctx.save()
            ctx.translate(x + topSize, y + topSize * 0.5)
            ctx.transform(1, 0.5, 0, 1, 0, 0)
            ctx.globalAlpha = 0.95
            ctx.drawImage(sideImg, 0, 0, 64, 64, 0, 0, topSize * 0.55, sideH)
            ctx.globalAlpha = 1
            ctx.fillStyle = 'rgba(0,0,0,0.10)'
            ctx.fillRect(0, 0, topSize * 0.55, sideH)
            ctx.restore()
        }

        // 左侧
        if (sideImg) {
            ctx.save()
            ctx.translate(x, y + topSize * 0.5)
            ctx.transform(1, 0.5, 0, 1, 0, 0)
            ctx.scale(-1, 1)
            ctx.globalAlpha = 0.92
            ctx.drawImage(sideImg, 0, 0, 64, 64, 0, 0, topSize * 0.55, sideH)
            ctx.globalAlpha = 1
            ctx.fillStyle = 'rgba(0,0,0,0.14)'
            ctx.fillRect(0, 0, topSize * 0.55, sideH)
            ctx.restore()
        }

        return canvas.toDataURL('image/png')
    }

    /**
     * 获取指定方块的预览 dataURL
     * @param {string} blockId
     * @returns {string|null}
     */
    getPreview(blockId) {
        if (!blockId) return null
        if (this.cache.has(blockId)) return this.cache.get(blockId)
        const textures = this.blockDefs.getTextures(blockId) || {}
        const top = textures.top || textures.all || textures.side || textures.bottom || null
        const side = textures.side || textures.all || textures.top || textures.bottom || top
        if (!top && !side) return null
        const url = this.drawPreview(top, side)
        this.cache.set(blockId, url)
        return url
    }
}
