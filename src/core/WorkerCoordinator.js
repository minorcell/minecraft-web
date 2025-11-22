/**
 * Worker 协调器：负责与地形/装饰 worker 通信，避免 World 直接持有 worker 逻辑
 */
export class WorkerCoordinator {
    constructor({ terrainSettings, blockIds = [], onChunkData, onDecorData, onError }) {
        this.terrainSettings = terrainSettings
        this.blockIds = blockIds
        this.onChunkData = onChunkData
        this.onDecorData = onDecorData
        this.onError = onError
        this.chunkWorker = null
        this.decorWorker = null
        this.pendingChunks = new Set()
        this.decorInFlight = false
    }

    initChunkWorker() {
        if (this.chunkWorker) return
        try {
            this.chunkWorker = new Worker(new URL('../worker/terrainWorker.js', import.meta.url), { type: 'module' })
            this.chunkWorker.onmessage = (event) => {
                const { type, payload } = event.data || {}
                if (type === 'chunkData') {
                    this.pendingChunks.delete(payload?.chunkKey)
                    this.onChunkData?.(payload)
                } else if (type === 'error') {
                    this.onError?.(payload?.message || 'chunk worker error')
                }
            }
            this.chunkWorker.onerror = (err) => this.onError?.(err?.message || 'chunk worker error')
        } catch (err) {
            this.onError?.(err?.message || 'chunk worker init failed')
            this.chunkWorker = null
        }
    }

    initDecorWorker() {
        if (this.decorWorker) return
        try {
            this.decorWorker = new Worker(new URL('../worker/decorWorker.js', import.meta.url), { type: 'module' })
            this.decorWorker.onmessage = (event) => {
                const { type, payload } = event.data || {}
                if (type === 'decorationsData') {
                    this.decorInFlight = false
                    this.onDecorData?.(payload)
                } else if (type === 'error') {
                    this.decorInFlight = false
                    this.onError?.(payload?.message || 'decor worker error')
                }
            }
            this.decorWorker.onerror = (err) => {
                this.decorInFlight = false
                this.onError?.(err?.message || 'decor worker error')
            }
        } catch (err) {
            this.onError?.(err?.message || 'decor worker init failed')
            this.decorWorker = null
        }
    }

    requestChunk(cx, cz, key, minCoord, maxCoord, settings) {
        if (!this.chunkWorker) this.initChunkWorker()
        if (!this.chunkWorker) return false
        if (this.pendingChunks.has(key)) return true
        this.pendingChunks.add(key)
        this.chunkWorker.postMessage({
            type: 'generateChunk',
            payload: {
                chunkX: cx,
                chunkZ: cz,
                chunkKey: key,
                minCoord,
                maxCoord,
                terrainSettings: settings || this.terrainSettings,
                blockIds: this.blockIds
            }
        })
        return true
    }

    requestDecorations(payload) {
        if (!this.decorWorker) this.initDecorWorker()
        if (!this.decorWorker || this.decorInFlight) return false
        this.decorInFlight = true
        this.decorWorker.postMessage({ type: 'generateDecorations', payload })
        return true
    }

    clear() {
        this.pendingChunks.clear()
        this.decorInFlight = false
    }
}
