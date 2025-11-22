/**
 * 渲染协调器：管理 chunk mesh 的创建与销毁
 */
export class RenderCoordinator {
    constructor(scene, voxelBuilder) {
        this.scene = scene
        this.voxelBuilder = voxelBuilder
        this.chunkMeshes = new Map()
    }

    /**
     * 渲染指定 chunk
     * @param {string} chunkKey
     */
    renderChunk(chunkKey) {
        this.unloadChunk(chunkKey)
        const meshes = this.voxelBuilder.render(this.scene, chunkKey)
        this.chunkMeshes.set(chunkKey, meshes)
    }

    /**
     * 卸载指定 chunk mesh 并释放资源
     * @param {string} chunkKey
     */
    unloadChunk(chunkKey) {
        if (!this.chunkMeshes.has(chunkKey)) return
        for (const mesh of this.chunkMeshes.get(chunkKey)) {
            this.scene.remove(mesh)
        }
        this.chunkMeshes.delete(chunkKey)
    }

    /**
     * 卸载所有 chunk
     */
    clear() {
        for (const key of this.chunkMeshes.keys()) {
            this.unloadChunk(key)
        }
        this.chunkMeshes.clear()
    }
}
