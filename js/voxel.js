import * as THREE from 'three'
import { TextureFactory } from './textures.js'
import { SeededRandom } from './class/Random.js'

export class VoxelBuilder {
    constructor(options = {}) {
        const { geometry = null, seed = Date.now() } = options
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

        // Create multiple variants for each material type
        this.materials = {
            grass: [],
            dirt: [],
            stone: [],
            wood: [],
            leaves: [],
            glass: [],
            roof: [],
            water: [],
            sand: [],
            snow: [],
            cactus: [],
            flower: []
        }

        // Generate variants for each material
        for (let v = 0; v < this.variants; v++) {
            // Grass: 6 faces (sides, top, bottom)
            this.materials.grass.push([
                mat(this.factory.createTexture('grass_side', v)), // px
                mat(this.factory.createTexture('grass_side', v)), // nx
                mat(this.factory.createTexture('grass_top', v)),  // py (top)
                mat(this.factory.createTexture('dirt', v)),       // ny (bottom)
                mat(this.factory.createTexture('grass_side', v)), // pz
                mat(this.factory.createTexture('grass_side', v))  // nz
            ])

            // Dirt
            this.materials.dirt.push(mat(this.factory.createTexture('dirt', v)))

            // Stone
            this.materials.stone.push(mat(this.factory.createTexture('stone', v)))

            // Wood: 6 faces
            this.materials.wood.push([
                mat(this.factory.createTexture('wood_side', v)),
                mat(this.factory.createTexture('wood_side', v)),
                mat(this.factory.createTexture('wood_top', v)),
                mat(this.factory.createTexture('wood_top', v)),
                mat(this.factory.createTexture('wood_side', v)),
                mat(this.factory.createTexture('wood_side', v))
            ])

            // Leaves
            this.materials.leaves.push(mat(this.factory.createTexture('leaves', v)))

            // Glass
            this.materials.glass.push(mat(this.factory.createTexture('glass', v), true, 0.6))

            // Roof
            this.materials.roof.push(mat(this.factory.createTexture('roof', v)))

            // Water - less transparent for better underwater effect
            this.materials.water.push(mat(this.factory.createTexture('water', v), true, 0.7))

            // Sand
            this.materials.sand.push(mat(this.factory.createTexture('sand', v)))

            // Snow
            this.materials.snow.push(mat(this.factory.createTexture('snow', v)))

            // Cactus
            this.materials.cactus.push(mat(this.factory.createTexture('cactus', v)))

            // Flower
            this.materials.flower.push(mat(this.factory.createTexture('flower', v)))
        }

        // 按 chunk 存储实例：Map<chunkKey, { [type]: Array<{matrix,variant}> }>
        this.instances = new Map()
        this.chunkSize = options.chunkSize || 16

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
        if (!this.materials[type]) {
            console.warn(`Unknown material type: ${type}`)
            return
        }

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
            variant: v
        })
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

            for (const [variant, variantInstances] of Object.entries(groups)) {
                const material = this.materials[type][variant]
                const mesh = new THREE.InstancedMesh(this.geometry, material, variantInstances.length)
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
}
