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

        // 按 chunk 存储实例：Map<chunkKey, { [type]: Array<{matrix,variant,x,y,z,layer}> }>
        this.instances = new Map()
        this.layeredInstances = new Map() // Map<chunkKey, { solid: [], alpha: [], water: [] }>
        this.chunkSize = chunkSize
        this.registry = registry
        this.blockDefs = blockDefs
        this.materialsCache = new Map()
        this.layeredMaterials = {
            solid: new Map(),
            alpha: new Map(),
            water: new Map()
        }
        this.faceGeometryCache = new Map()
        this.faceDirections = [
            [1, 0, 0],   // +X right
            [-1, 0, 0],  // -X left
            [0, 1, 0],   // +Y top
            [0, -1, 0],  // -Y bottom
            [0, 0, 1],   // +Z front
            [0, 0, -1]   // -Z back
        ]
        this.fullFaceMask = (1 << this.faceDirections.length) - 1

        this.dummy = new THREE.Object3D()
        this.sharedGeometry = this.geometry // 共享几何以避免重复克隆
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
        // 水方块使用更丰富的变体逻辑（基于对角线位置）
        if (type === 'water') {
            // 使用 (x+z) 和 (x-z) 的组合增加变化
            const diag1 = (x + z) % this.variants
            const diag2 = (x - z + 1000) % this.variants
            const combined = (diag1 * 2 + diag2) % this.variants
            return combined
        }

        // 通过整数混合减少碰撞，并保持跨平台一致
        let h = this.variantSeed
        h ^= SeededRandom.hash(type)
        h ^= (x * 374761393) ^ (y * 668265263) ^ (z * 2147483647)
        h = Math.imul(h ^ (h >>> 15), 2246822519)
        h ^= h >>> 13
        return (h >>> 0) % this.variants
    }

    addBlock(type, x, y, z, variant = null, chunkKey = null) {
        let blockType = type

        if (type === 'water') {
            const isTopWater = !this.registry || !this.registry.has(x, y + 1, z)
            blockType = isTopWater ? 'water_wavy' : 'water_still'
        }

        this.ensureMaterial(blockType)
        if (!this.materialsCache.has(blockType)) return

        // Use provided variant or random
        const v = variant !== null ? variant : this.getVariantFromHash(type, x, y, z)

        this.dummy.position.set(x, y, z)
        this.dummy.updateMatrix()

        const key = chunkKey || this.getChunkKeyFromPosition(x, z)

        if (!this.instances.has(key)) {
            this.instances.set(key, {})
            this.layeredInstances.set(key, { solid: [], alpha: [], water: [] })
        }
        const bucket = this.instances.get(key)
        if (!bucket[blockType]) {
            bucket[blockType] = []
        }

        const opts = this.blockDefs.getMaterialOptions(type)
        const layer = opts.renderLayer || 'solid'

        bucket[blockType].push({
            matrix: this.dummy.matrix.clone(),
            variant: v,
            x,
            y,
            z,
            layer
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

    normalizeType(type) {
        if (type === 'water_wavy' || type === 'water_still') return 'water'
        return type
    }

    isFaceExposed(type, nx, ny, nz) {
        if (!this.registry || !this.blockDefs) return true
        const t = this.registry.get(nx, ny, nz)
        const baseType = this.normalizeType(type)
        const sameWater = baseType === 'water' && this.normalizeType(t) === 'water'
        if (sameWater) return false
        if (!t) return true
        const opt = this.blockDefs.getMaterialOptions(this.normalizeType(t))
        return opt.transparent === true
    }

    getFaceMask(type, x, y, z) {
        if (!this.registry || !this.blockDefs) return this.fullFaceMask
        let mask = 0
        const baseType = this.normalizeType(type)
        for (let i = 0; i < this.faceDirections.length; i++) {
            const [dx, dy, dz] = this.faceDirections[i]
            if (this.isFaceExposed(baseType, x + dx, y + dy, z + dz)) {
                mask |= (1 << i)
            }
        }
        return mask
    }

    getGeometryForMask(mask) {
        if (mask === 0) return null
        if (this.faceGeometryCache.has(mask)) return this.faceGeometryCache.get(mask)

        // 默认使用全量几何
        if (mask === this.fullFaceMask || !this.sharedGeometry?.groups?.length) {
            this.faceGeometryCache.set(mask, this.sharedGeometry)
            return this.sharedGeometry
        }

        const geom = this.sharedGeometry.clone()
        geom.clearGroups()
        for (let i = 0; i < this.faceDirections.length; i++) {
            if (mask & (1 << i)) {
                const g = this.sharedGeometry.groups[i]
                if (g) geom.addGroup(g.start, g.count, g.materialIndex)
            }
        }
        this.faceGeometryCache.set(mask, geom)
        return geom
    }

    render(scene, chunkKey = 'default') {
        const chunkData = this.instances.get(chunkKey)
        if (!chunkData) return []

        const layers = this.layeredInstances.get(chunkKey) || { solid: [], alpha: [], water: [] }
        const collectLayer = (layerName, flags) => {
            const meshes = []
            for (const [type, instances] of Object.entries(chunkData)) {
                if (!instances || instances.length === 0) continue
                const filtered = instances.filter(inst => inst.layer === layerName)
                if (filtered.length === 0) continue

                // Group by variant and face mask
                const groups = {}
                for (const inst of filtered) {
                    const v = inst.variant
                    const faceMask = this.getFaceMask(type, inst.x, inst.y, inst.z)
                    if (faceMask === 0) continue
                    if (!groups[v]) groups[v] = {}
                    if (!groups[v][faceMask]) groups[v][faceMask] = []
                    groups[v][faceMask].push(inst)
                }

                const mats = this.materialsCache.get(type)
                if (!mats) continue

                for (const [variant, maskGroups] of Object.entries(groups)) {
                    const material = mats[variant % mats.length]
                    if (flags) {
                        if (Array.isArray(material)) {
                            material.forEach(m => {
                                m.transparent = flags.transparent ?? m.transparent
                                m.opacity = flags.opacity ?? m.opacity
                                m.depthWrite = flags.depthWrite ?? m.depthWrite
                                m.depthTest = flags.depthTest ?? m.depthTest
                            })
                        } else {
                            material.transparent = flags.transparent ?? material.transparent
                            material.opacity = flags.opacity ?? material.opacity
                            material.depthWrite = flags.depthWrite ?? material.depthWrite
                            material.depthTest = flags.depthTest ?? material.depthTest
                        }
                    }
                    for (const [maskStr, variantInstances] of Object.entries(maskGroups)) {
                        const faceMask = Number(maskStr)
                        const geometry = this.getGeometryForMask(faceMask)
                        if (!geometry) continue
                        const mesh = new THREE.InstancedMesh(geometry, material, variantInstances.length)
                        for (let i = 0; i < variantInstances.length; i++) {
                            mesh.setMatrixAt(i, variantInstances[i].matrix)
                        }
                        mesh.castShadow = layerName === 'solid'
                        mesh.receiveShadow = layerName !== 'water'
                        mesh.instanceMatrix.needsUpdate = true
                        scene.add(mesh)
                        meshes.push(mesh)
                        layers[layerName].push(mesh)
                    }
                }
            }
            return meshes
        }

        const result = []
        result.push(...collectLayer('solid'))
        result.push(...collectLayer('alpha', { transparent: true, depthWrite: false }))
        result.push(...collectLayer('water', { transparent: true, depthWrite: false }))
        return result
    }

    clearChunk(chunkKey) {
        this.instances.delete(chunkKey)
        this.layeredInstances.delete(chunkKey)
    }

    clearAll() {
        this.instances.clear()
        this.layeredInstances.clear()
    }

    /**
     * 若未存在材质则基于方块定义生成
     * @param {string} type
     */
    ensureMaterial(type) {
        if (this.materialsCache.has(type)) return
        if (!this.blockDefs) return

        const opts = this.blockDefs.getMaterialOptions(
            type === 'water_wavy' ? 'water' :
            type === 'water_still' ? 'water' : type
        )
        const isWaterMaterial = type === 'water_wavy' || type === 'water_still' || type === 'water'
        const mat = (tex) => new THREE.MeshLambertMaterial({
            map: tex,
            transparent: opts.transparent,
            opacity: opts.opacity,
            side: isWaterMaterial ? THREE.DoubleSide : THREE.FrontSide
        })

        let variants = []

        if (type === 'water_wavy') {
            const wavyTex = this.factory.createTexture('water', 0)
            const stillTex = this.factory.createTexture('water_still', 0)
            const waterMaterials = [
                mat(stillTex),
                mat(stillTex),
                mat(wavyTex),
                mat(stillTex),
                mat(stillTex),
                mat(stillTex)
            ]
            variants.push(waterMaterials)
        } else if (type === 'water_still') {
            const stillTex = this.factory.createTexture('water_still', 0)
            const waterMaterials = Array(6).fill(mat(stillTex))
            variants.push(waterMaterials)
        } else {
            const textures = this.blockDefs.getTextures(type)
            const allTex = textures.all ? this.factory.createTexture(textures.all, 0) : null
            const top = textures.top ? this.factory.createTexture(textures.top, 0) : allTex
            const bottom = textures.bottom ? this.factory.createTexture(textures.bottom, 0) : allTex
            const side = textures.side ? this.factory.createTexture(textures.side, 0) : allTex

            if (top && bottom && side) {
                const shared = [
                    mat(side),
                    mat(side),
                    mat(top),
                    mat(bottom),
                    mat(side),
                    mat(side)
                ]
                variants.push(shared)
            } else if (allTex) {
                variants.push(mat(allTex))
            } else {
                variants.push(mat(this.factory.createTexture('stone', 0)))
            }
        }

        this.materialsCache.set(type, variants)
    }
}
