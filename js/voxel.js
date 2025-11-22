import * as THREE from 'three'
import { TextureFactory } from './textures.js'
import { SeededRandom } from './class/Random.js'

export class VoxelBuilder {
    constructor(options = {}) {
        const { geometry = null, seed = Date.now(), registry = null, chunkSize = 16, blockDefs = null } = options
        // 使用传入的几何体或默认立方体
        this.geometry = geometry || new THREE.BoxGeometry(1, 1, 1)
        this.factory = new TextureFactory()
        this.variants = 4
        this.variantSeed = SeededRandom.hash(seed)

        // Helper to create material
        const mat = (map, transparent = false, opacity = 1.0) => {
            return new THREE.MeshLambertMaterial({
                map: map,
                transparent: transparent,
                opacity: opacity
            })
        }

        // 按 chunk 存储实例：Map<chunkKey, { [type]: Array<{matrix,variant,x,y,z}> }>
        this.instances = new Map()
        this.chunkSize = chunkSize
        this.registry = registry
        this.blockDefs = blockDefs
        this.materialsCache = new Map()

        this.dummy = new THREE.Object3D()
    }

    /**
     * 基于坐标和类型生成稳定的变体索引
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {number}
     */
    getVariantFromHash(type, x, y, z) {
        // 通过整数混合减少碰撞，并保持跨平台一致
        let h = this.variantSeed
        h ^= SeededRandom.hash(type)
        h ^= (x * 374761393) ^ (y * 668265263) ^ (z * 2147483647)
        h = Math.imul(h ^ (h >>> 15), 2246822519)
        h ^= h >>> 13
        return (h >>> 0) % this.variants
    }

    addBlock(type, x, y, z, variant = null, chunkKey = null) {
        this.ensureMaterial(type)
        if (!this.materialsCache.has(type)) return

        // Use provided variant or random
        const v = variant !== null ? variant : this.getVariantFromHash(type, x, y, z)

        this.dummy.position.set(x, y, z)
        this.dummy.updateMatrix()

        const key = chunkKey || this.getChunkKeyFromPosition(x, z)

        if (!this.instances.has(key)) {
            this.instances.set(key, {})
        }
        const bucket = this.instances.get(key)
        if (!bucket[type]) {
            bucket[type] = []
        }

        bucket[type].push({
            matrix: this.dummy.matrix.clone(),
            variant: v,
            x,
            y,
            z
        })

        // 记录到方块注册表
        if (this.registry) {
            this.registry.add(type, x, y, z)
        }
    }

    /**
     * 基于坐标获得chunk key
     * @param {number} x
     * @param {number} z
     * @returns {string}
     */
    getChunkKeyFromPosition(x, z) {
        const cx = Math.floor(x / this.chunkSize)
        const cz = Math.floor(z / this.chunkSize)
        return `${cx},${cz}`
    }

    /**
     * 从Block对象添加方块
     * @param {Block} block - 方块对象
     */
    addBlockFromObject(block) {
        this.addBlock(block.type, block.x, block.y, block.z, block.variant)
    }

    /**
     * 移除指定坐标的方块（从实例和注册表）
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {string|null} chunkKey
     */
    removeBlock(x, y, z, chunkKey = null) {
        const key = chunkKey || this.getChunkKeyFromPosition(x, z)
        const chunkData = this.instances.get(key)
        if (!chunkData) return

        for (const type of Object.keys(chunkData)) {
            chunkData[type] = chunkData[type].filter(inst => !(inst.x === x && inst.y === y && inst.z === z))
        }

        if (this.registry) {
            this.registry.remove(x, y, z)
        }
    }

    render(scene, chunkKey = 'default') {
        const chunkData = this.instances.get(chunkKey)
        if (!chunkData) return []

        const meshes = []
        for (const [type, instances] of Object.entries(chunkData)) {
            if (!instances || instances.length === 0) continue

            // Group by variant
            const groups = {}
            for (const instance of instances) {
                const v = instance.variant
                if (!groups[v]) groups[v] = []
                groups[v].push(instance)
            }

            const mats = this.materialsCache.get(type)
            if (!mats) continue

            for (const [variant, variantInstances] of Object.entries(groups)) {
                const matEntry = mats[variant % mats.length]
                const mesh = new THREE.InstancedMesh(this.geometry, matEntry, variantInstances.length)
                for (let i = 0; i < variantInstances.length; i++) {
                    mesh.setMatrixAt(i, variantInstances[i].matrix)
                }
                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.instanceMatrix.needsUpdate = true
                scene.add(mesh)
                meshes.push(mesh)
            }
        }
        return meshes
    }

    clearChunk(chunkKey) {
        this.instances.delete(chunkKey)
    }

    clearAll() {
        this.instances.clear()
    }

    /**
     * 若未存在材质则基于方块定义生成
     * @param {string} type
     */
    ensureMaterial(type) {
        if (this.materialsCache.has(type)) return
        if (!this.blockDefs) return
        const textures = this.blockDefs.getTextures(type)
        const opts = this.blockDefs.getMaterialOptions(type)
        const mat = (tex) => new THREE.MeshLambertMaterial({
            map: tex,
            transparent: opts.transparent,
            opacity: opts.opacity
        })

        const allTex = textures.all ? this.factory.createTexture(textures.all, 0) : null
        const top = textures.top ? this.factory.createTexture(textures.top, 0) : allTex
        const bottom = textures.bottom ? this.factory.createTexture(textures.bottom, 0) : allTex
        const side = textures.side ? this.factory.createTexture(textures.side, 0) : allTex

        let variants = []

        if (top && bottom && side) {
            variants.push([
                mat(side),
                mat(side),
                mat(top),
                mat(bottom),
                mat(side),
                mat(side)
            ])
        } else if (allTex) {
            variants.push(mat(allTex))
        } else {
            variants.push(mat(this.factory.createTexture('stone', 0)))
        }

        this.materialsCache.set(type, variants)
    }
}
