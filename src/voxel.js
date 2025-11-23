import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { TextureFactory } from './textures.js'
import { SeededRandom } from './class/Random.js'

export class VoxelBuilder {
    constructor(options = {}) {
        const {
            geometry = null,
            seed = Date.now(),
            registry = null,
            chunkSize = 16,
            blockDefs = null,
            shadowOptions = {}
        } = options
        // 使用传入的几何体或默认立方体
        this.geometry = geometry || new THREE.BoxGeometry(1, 1, 1)
        this.factory = new TextureFactory()
        this.variants = 4
        this.variantSeed = SeededRandom.hash(seed)
        const shadowCfg = shadowOptions || {}
        this.shadowOptions = {
            cast: shadowCfg.cast !== false,
            receive: shadowCfg.receive !== false
        }

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
        this.shapeGeometryCache = {
            slab: this.createSlabGeometry(),
            stair: this.createStairGeometry(),
            torch: this.createTorchGeometry(),
            flower: this.createFlowerGeometry(),
            cactus: this.createCactusGeometry()
        }
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

    setShadowOptions(options = {}) {
        const shadowCfg = options || {}
        this.shadowOptions = {
            cast: shadowCfg.cast !== false,
            receive: shadowCfg.receive !== false
        }
    }

    createSlabGeometry() {
        // 半高方块，保持与 BoxGeometry 相同的组设置
        return new THREE.BoxGeometry(1, 0.5, 1)
    }

    createStairGeometry() {
        // 由两段方块组成的阶梯：底层全深，顶层半深
        const base = new THREE.BoxGeometry(1, 0.5, 1)
        base.translate(0, -0.25, 0)
        const top = new THREE.BoxGeometry(1, 0.5, 0.5)
        // 默认朝向 North（高端在 -Z 侧）
        top.translate(0, 0.25, -0.25)
        return mergeBufferGeometries([base, top], true)
    }

    createTorchGeometry() {
        // 细杆 + 顶部立体的火焰形状

        // 杆部分：0.15x0.8x0.15
        const stickGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15)
        stickGeometry.translate(0, -0.05, 0)

        // 创建一个更立体的火焰形状：使用多个几何体组合
        // 底部：较大的椭圆形
        const baseFlame = new THREE.BoxGeometry(0.3, 0.15, 0.3)
        baseFlame.translate(0, 0.28, 0)

        // 中间：中等大小的火焰体
        const midFlame = new THREE.BoxGeometry(0.22, 0.12, 0.22)
        midFlame.translate(0, 0.42, 0)

        // 顶部：较小的尖端
        const topFlame = new THREE.BoxGeometry(0.12, 0.08, 0.12)
        topFlame.translate(0, 0.52, 0)

        // 合并所有火焰部分为单一几何体
        const flameGeometry = mergeBufferGeometries([baseFlame, midFlame, topFlame], true)

        // 返回包含两个几何体的对象
        return { stick: stickGeometry, flame: flameGeometry }
    }

    createFlowerGeometry() {
        // 细杆（茎） + 花朵顶部，单材质
        const stem = new THREE.BoxGeometry(0.1, 0.7, 0.1)
        stem.translate(0, -0.1, 0)

        // 创建花朵 - 使用5个小方块组成花瓣形状
        const petalSize = 0.25
        const petalY = 0.35
        const petalOffset = 0.15

        const petals = []

        // 中央花瓣
        const centerPetal = new THREE.BoxGeometry(petalSize, petalSize * 0.6, petalSize)
        centerPetal.translate(0, petalY, 0)
        petals.push(centerPetal)

        // 上花瓣
        const topPetal = new THREE.BoxGeometry(petalSize, petalSize * 0.6, petalSize)
        topPetal.translate(0, petalY, -petalOffset)
        petals.push(topPetal)

        // 下花瓣
        const bottomPetal = new THREE.BoxGeometry(petalSize, petalSize * 0.6, petalSize)
        bottomPetal.translate(0, petalY, petalOffset)
        petals.push(bottomPetal)

        // 左花瓣
        const leftPetal = new THREE.BoxGeometry(petalSize, petalSize * 0.6, petalSize)
        leftPetal.translate(-petalOffset, petalY, 0)
        petals.push(leftPetal)

        // 右花瓣
        const rightPetal = new THREE.BoxGeometry(petalSize, petalSize * 0.6, petalSize)
        rightPetal.translate(petalOffset, petalY, 0)
        petals.push(rightPetal)

        return mergeBufferGeometries([stem, ...petals], true)
    }

    createCactusGeometry() {
        // 主干 - 较高的圆柱形，单材质
        const trunk = new THREE.BoxGeometry(0.6, 2.5, 0.6)
        trunk.translate(0, 0.25, 0)

        // 分支 - 左右两侧的小枝条
        const branches = []

        // 左侧分支
        const leftBranch = new THREE.BoxGeometry(0.3, 1.0, 0.3)
        leftBranch.translate(-0.4, 0.5, 0)
        branches.push(leftBranch)

        // 右侧分支
        const rightBranch = new THREE.BoxGeometry(0.3, 1.0, 0.3)
        rightBranch.translate(0.4, 0.5, 0)
        branches.push(rightBranch)

        // 顶部小分支
        const topBranch = new THREE.BoxGeometry(0.25, 0.8, 0.25)
        topBranch.translate(0, 1.8, 0)
        branches.push(topBranch)

        return mergeBufferGeometries([trunk, ...branches], true)
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

    addBlock(type, x, y, z, variant = null, chunkKey = null, meta = null) {
        let blockType = type

        if (type === 'water') {
            const isTopWater = !this.registry || !this.registry.has(x, y + 1, z)
            blockType = isTopWater ? 'water_wavy' : 'water_still'
        }

        this.ensureMaterial(blockType)
        if (!this.materialsCache.has(blockType)) return

        // Use provided variant or random
        const v = variant !== null ? variant : this.getVariantFromHash(type, x, y, z)

        const metaData = meta !== null ? meta : (this.blockDefs?.getDefaultMeta(type) || null)
        this.applyTransform(type, { x, y, z }, metaData)
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
            layer,
            meta: metaData
        })

        // 记录到方块注册表
        if (this.registry) {
            this.registry.add(type, x, y, z, metaData)
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
        this.addBlock(block.type, block.x, block.y, block.z, block.variant, null, block.meta || null)
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

    getShape(type) {
        return this.blockDefs ? this.blockDefs.getShape(this.normalizeType(type)) : 'cube'
    }

    getFacingRotation(facing) {
        switch (facing) {
            case 'east': return Math.PI / 2
            case 'south': return Math.PI
            case 'west': return -Math.PI / 2
            default: return 0 // north
        }
    }

    applyTransform(type, pos, meta) {
        const shape = this.getShape(type)
        this.dummy.position.set(pos.x, pos.y, pos.z)
        this.dummy.rotation.set(0, 0, 0)

        if (shape === 'slab') {
            const half = meta?.half === 'top' ? 'top' : 'bottom'
            const offsetY = half === 'top' ? 0.25 : -0.25
            this.dummy.position.y += offsetY
        } else if (shape === 'stair') {
            const facing = meta?.facing || 'north'
            this.dummy.rotation.y = this.getFacingRotation(facing)
        } else if (shape === 'torch') {
            this.dummy.rotation.set(0, 0, 0)
            this.dummy.position.y -= 0.05
        }
    }

    isFaceExposed(type, nx, ny, nz) {
        if (!this.registry || !this.blockDefs) return true
        const entry = this.registry.getEntry(nx, ny, nz)
        const t = entry?.type || null
        const baseType = this.normalizeType(type)
        const sameWater = baseType === 'water' && this.normalizeType(t) === 'water'
        if (sameWater) return false
        if (!t) return true
        const norm = this.normalizeType(t)
        const solid = this.blockDefs.isSolid(norm)
        // 非立方体（如半砖、楼梯）不应完全遮挡邻面，保持暴露
        const neighborShape = this.getShape(norm)
        if (neighborShape !== 'cube') return true
        const opt = this.blockDefs.getMaterialOptions(norm)
        return !solid || opt.transparent === true
    }

    getFaceMask(type, x, y, z) {
        if (!this.registry || !this.blockDefs) return this.fullFaceMask
        const shape = this.getShape(type)
        if (shape !== 'cube') return this.fullFaceMask
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

    getGeometry(type, mask) {
        const shape = this.getShape(type)
        if (shape === 'cube') return this.getGeometryForMask(mask)
        if (shape === 'torch') {
            // 火把的几何体是一个对象，包含 stick 和 flame 两部分
            return this.shapeGeometryCache[shape]
        }
        return this.shapeGeometryCache[shape] || this.sharedGeometry
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

                // 特殊处理：火把需要渲染两个部分（杆和火焰）
                if (type === 'torch') {
                    const mats = this.materialsCache.get('torch')
                    if (!mats || mats.length < 2) continue

                    const torchGeom = this.getGeometry('torch', null)
                    const stickGeometry = torchGeom.stick
                    const flameGeometry = torchGeom.flame

                    // 分别收集杆和火焰的实例
                    const stickInstances = filtered
                    const flameInstances = filtered

                    // 渲染杆部分（使用第一种材质）
                    if (stickInstances.length > 0) {
                        const mesh = new THREE.InstancedMesh(stickGeometry, mats[0], stickInstances.length)
                        for (let i = 0; i < stickInstances.length; i++) {
                            mesh.setMatrixAt(i, stickInstances[i].matrix)
                        }
                        mesh.castShadow = this.shadowOptions.cast && layerName === 'solid'
                        mesh.receiveShadow = this.shadowOptions.receive && layerName !== 'water'
                        mesh.instanceMatrix.needsUpdate = true
                        mesh.userData.renderLayer = layerName
                        scene.add(mesh)
                        meshes.push(mesh)
                        layers[layerName].push(mesh)
                    }

                    // 渲染火焰部分（使用第二种材质）
                    if (flameInstances.length > 0) {
                        const mesh = new THREE.InstancedMesh(flameGeometry, mats[1], flameInstances.length)
                        for (let i = 0; i < flameInstances.length; i++) {
                            mesh.setMatrixAt(i, flameInstances[i].matrix)
                        }
                        mesh.castShadow = false
                        mesh.receiveShadow = false
                        mesh.instanceMatrix.needsUpdate = true
                        mesh.userData.renderLayer = layerName
                        scene.add(mesh)
                        meshes.push(mesh)
                        layers[layerName].push(mesh)
                    }

                    continue
                }

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
                        const geometry = this.getGeometry(type, faceMask)
                        if (!geometry) continue
                        const mesh = new THREE.InstancedMesh(geometry, material, variantInstances.length)
                        for (let i = 0; i < variantInstances.length; i++) {
                            mesh.setMatrixAt(i, variantInstances[i].matrix)
                        }
                        mesh.castShadow = this.shadowOptions.cast && layerName === 'solid'
                        mesh.receiveShadow = this.shadowOptions.receive && layerName !== 'water'
                        mesh.instanceMatrix.needsUpdate = true
                        mesh.userData.renderLayer = layerName
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
        const chunkData = this.instances.get(chunkKey)
        if (chunkData && this.registry) {
            for (const type of Object.keys(chunkData)) {
                for (const inst of chunkData[type]) {
                    this.registry.remove(inst.x, inst.y, inst.z)
                }
            }
        }
        this.instances.delete(chunkKey)
        this.layeredInstances.delete(chunkKey)
    }

    clearAll() {
        if (this.registry) {
            this.registry.clear?.()
        }
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
        if (type === 'torch') {
            // 火把由两部分组成：杆（木质）和火焰（发光）
            // 创建木质纹理用于杆部
            const torchTex = this.factory.createTexture('torch', 0)
            const torchMat = new THREE.MeshLambertMaterial({
                map: torchTex,
                transparent: true,
                side: THREE.DoubleSide
            })

            // 创建火焰纹理用于火焰部分
            const flameTex = this.factory.createTexture('flame', 0)
            const flameMat = new THREE.MeshLambertMaterial({
                map: flameTex,
                emissive: new THREE.Color(0xff6600),
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })

            // 火把使用两种材质：[木质杆, 火焰]
            this.materialsCache.set(type, [torchMat, flameMat])
            return
        }
        if (type === 'flower') {
            // Flower使用flower纹理
            const flowerTex = this.factory.createTexture('flower', 0)
            const flowerMat = new THREE.MeshLambertMaterial({
                map: flowerTex,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            })
            this.materialsCache.set(type, [flowerMat])
            return
        }
        if (type === 'cactus') {
            const cactusTex = this.factory.createTexture('cactus', 0)
            const cactusMat = new THREE.MeshLambertMaterial({
                map: cactusTex,
                transparent: true,
                side: THREE.DoubleSide
            })
            this.materialsCache.set(type, [cactusMat])
            return
        }
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
