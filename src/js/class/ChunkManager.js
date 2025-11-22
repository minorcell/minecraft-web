import * as THREE from 'three'

/**
 * Chunk管理器：根据相机位置确定需要加载的chunk，维护加载状态
 */
export class ChunkManager {
    /**
     * @param {object} options
     * @param {number} options.chunkSize
     * @param {number} options.viewDistance - 以chunk为单位的视距
     */
    constructor({ chunkSize = 16, viewDistance = 6 } = {}) {
        this.chunkSize = chunkSize
        this.viewDistance = viewDistance
        /** @type {Set<string>} */
        this.loaded = new Set()
    }

    /**
     * 将世界坐标转换为chunk坐标
     * @param {number} x
     * @param {number} z
     * @returns {{cx:number, cz:number}}
     */
    worldToChunk(x, z) {
        return {
            cx: Math.floor(x / this.chunkSize),
            cz: Math.floor(z / this.chunkSize)
        }
    }

    /**
     * 获取视距内需要的chunk列表
     * @param {THREE.Vector3} position
     * @returns {Array<{cx:number, cz:number, key:string}>}
     */
    requiredChunks(position) {
        const { cx, cz } = this.worldToChunk(position.x, position.z)
        const list = []
        for (let x = cx - this.viewDistance; x <= cx + this.viewDistance; x++) {
            for (let z = cz - this.viewDistance; z <= cz + this.viewDistance; z++) {
                const key = `${x},${z}`
                list.push({ cx: x, cz: z, key })
            }
        }
        return list
    }

    /**
     * 基于当前位置计算需要加载/卸载的chunk键
     * @param {THREE.Vector3} position
     * @returns {{toLoad: Array<{cx:number, cz:number, key:string}>, toUnload: string[]}}
     */
    diff(position) {
        const required = this.requiredChunks(position)
        const requiredKeys = new Set(required.map(r => r.key))

        const toUnload = []
        for (const key of this.loaded) {
            if (!requiredKeys.has(key)) {
                toUnload.push(key)
            }
        }

        const toLoad = required.filter(r => !this.loaded.has(r.key))
        return { toLoad, toUnload }
    }

    markLoaded(key) {
        this.loaded.add(key)
    }

    markUnloaded(key) {
        this.loaded.delete(key)
    }
}
