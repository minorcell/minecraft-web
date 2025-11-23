import * as THREE from 'three'

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
     * @param {import('../voxel.js').VoxelBuilder|null} voxelBuilder
     * @param {number} [size] 输出尺寸（正方形像素）
     */
    constructor(blockDefs, textureFactory, voxelBuilder = null, size = 96) {
        this.blockDefs = blockDefs
        this.textureFactory = textureFactory
        this.voxelBuilder = voxelBuilder
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

        const stripH = this.size * 0.28
        const stripY = this.size - stripH - 4
        const faceSize = this.size * 0.78
        const faceX = (this.size - faceSize) * 0.5
        const faceY = this.size * 0.08

        // 背景微光
        const grad = ctx.createLinearGradient(0, 0, 0, this.size)
        grad.addColorStop(0, 'rgba(255,255,255,0.04)')
        grad.addColorStop(1, 'rgba(0,0,0,0.18)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, this.size, this.size)

        // 侧面条带
        if (sideImg) {
            ctx.drawImage(sideImg, 0, 0, 64, 64, 2, stripY, this.size - 4, stripH)
            ctx.fillStyle = 'rgba(0,0,0,0.22)'
            ctx.fillRect(2, stripY, this.size - 4, stripH)
        }

        // 顶面
        if (topImg) {
            ctx.drawImage(topImg, 0, 0, 64, 64, faceX, faceY, faceSize, faceSize)
            ctx.strokeStyle = 'rgba(0,0,0,0.35)'
            ctx.lineWidth = 2
            ctx.strokeRect(faceX + 1, faceY + 1, faceSize - 2, faceSize - 2)
        } else {
            ctx.fillStyle = '#777'
            ctx.fillRect(faceX, faceY, faceSize, faceSize)
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
        const shape = this.blockDefs.getShape(blockId)

        // 优先用 3D 缩略图（真实模型）
        const url3d = this.create3DPreview(blockId, shape, textures)
        if (url3d) {
            this.cache.set(blockId, url3d)
            return url3d
        }

        // 非立方体：直接使用主要纹理贴图缩放作为预览，避免误导
        if (shape !== 'cube') {
            const texName = textures.all || textures.side || textures.top || textures.bottom || null
            const texCanvas = this.getTextureCanvas(texName)
            if (texCanvas) {
                const canvas = document.createElement('canvas')
                canvas.width = this.size
                canvas.height = this.size
                const ctx = canvas.getContext('2d')
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(texCanvas, 0, 0, 64, 64, 8, 8, this.size - 16, this.size - 16)
                const url = canvas.toDataURL('image/png')
                this.cache.set(blockId, url)
                return url
            }
        }

        const top = textures.top || textures.all || textures.side || textures.bottom || null
        const side = textures.side || textures.all || textures.top || textures.bottom || top
        if (!top && !side) return null
        const url = this.drawPreview(top, side)
        this.cache.set(blockId, url)
        return url
    }

    /**
     * 使用 Three.js 渲染真实模型到离屏 Canvas
     */
    create3DPreview(blockId, shape, textures) {
        if (typeof THREE === 'undefined') return null
        try {
            const size = this.size
            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true
            })
            renderer.setSize(size, size)
            renderer.setPixelRatio(window.devicePixelRatio || 1)

            const scene = new THREE.Scene()
            const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
            camera.position.set(0, 3.5, 1.5)
            camera.lookAt(0, 0, 0)

            const ambient = new THREE.AmbientLight(0xffffff, 0.9)
            const dir = new THREE.DirectionalLight(0xffffff, 0.8)
            dir.position.set(3, 6, 4)
            scene.add(ambient, dir)

            const mesh = this.createMeshForPreview(blockId, shape, textures)
            if (!mesh) {
                renderer.dispose()
                return null
            }
            mesh.rotation.y = Math.PI / 4
            mesh.rotation.x = -0.52
            this.centerAndFit(mesh)
            scene.add(mesh)

            renderer.render(scene, camera)
            const url = renderer.domElement.toDataURL('image/png')
            renderer.dispose()
            return url
        } catch (e) {
            console.warn('Preview render failed', e)
            return null
        }
    }

    createMeshForPreview(blockId, shape, textures) {
        const opts = this.blockDefs.getMaterialOptions(blockId)
        const texName = textures.all || textures.side || textures.top || textures.bottom || null
        const mat = (name, transparent = opts.transparent, opacity = opts.opacity) => {
            if (!name) {
                return new THREE.MeshLambertMaterial({ color: '#d0d0d0', transparent, opacity })
            }
            const tex = this.textureFactory.createTexture(name, 0)
            return new THREE.MeshLambertMaterial({ map: tex, transparent, opacity })
        }

        const createFaceMats = () => {
            const side = textures.side || texName || textures.top || textures.bottom
            const top = textures.top || side
            const bottom = textures.bottom || side
            const mSide = mat(side)
            const mTop = mat(top)
            const mBottom = mat(bottom)
            return [mSide, mSide, mTop, mBottom, mSide, mSide]
        }

        const vb = this.voxelBuilder
        const group = new THREE.Group()

        if (shape === 'cube' || !vb) {
            const geo = new THREE.BoxGeometry(1, 1, 1)
            const mats = createFaceMats()
            const mesh = new THREE.Mesh(geo, mats)
            mesh.castShadow = true
            mesh.receiveShadow = true
            group.add(mesh)
            return group
        }

        // 从 voxelBuilder 的形状缓存中获取几何并缩放
        const cloneScale = (geom, s = 0.85) => {
            const g = geom.clone()
            g.scale(s, s, s)
            return g
        }

        const torchGeo = vb.shapeGeometryCache?.torch
        const flowerGeo = vb.shapeGeometryCache?.flower
        const cactusGeo = vb.shapeGeometryCache?.cactus
        const slabGeo = vb.shapeGeometryCache?.slab
        const stairGeo = vb.shapeGeometryCache?.stair

        if (shape === 'torch' && torchGeo) {
            const stickMat = mat('torch', true, 0.9)
            const flameTex = this.textureFactory.createTexture('flame', 0)
            const flameMat = new THREE.MeshLambertMaterial({
                map: flameTex,
                transparent: true,
                opacity: 0.9,
                emissive: new THREE.Color(0xff6600),
                emissiveIntensity: 0.8
            })
            const stick = new THREE.Mesh(cloneScale(torchGeo.stick, 0.9), stickMat)
            const flame = new THREE.Mesh(cloneScale(torchGeo.flame, 0.9), flameMat)
            group.add(stick, flame)
            return group
        }

        if (shape === 'flower' && flowerGeo) {
            const m = mat('flower', true, 0.9)
            const mesh = new THREE.Mesh(cloneScale(flowerGeo, 0.9), m)
            group.add(mesh)
            return group
        }

        if (shape === 'cactus' && cactusGeo) {
            const m = mat('cactus', false, 1)
            const mesh = new THREE.Mesh(cloneScale(cactusGeo, 0.8), m)
            group.add(mesh)
            return group
        }

        if (shape === 'slab' && slabGeo) {
            const m = mat(texName || textures.side || textures.top || textures.bottom)
            const mesh = new THREE.Mesh(cloneScale(slabGeo, 0.9), m)
            group.add(mesh)
            return group
        }

        if (shape === 'stair' && stairGeo) {
            const m = mat(texName || textures.side || textures.top || textures.bottom)
            const mesh = new THREE.Mesh(cloneScale(stairGeo, 0.9), m)
            group.add(mesh)
            return group
        }

        // 默认：用立方体预览
        const geo = new THREE.BoxGeometry(1, 1, 1)
        const mats = createFaceMats()
        const mesh = new THREE.Mesh(geo, mats)
        group.add(mesh)
        return group
    }

    centerAndFit(obj) {
        const box = new THREE.Box3().setFromObject(obj)
        const size = new THREE.Vector3()
        box.getSize(size)
        const center = new THREE.Vector3()
        box.getCenter(center)

        // 平移到原点
        obj.position.sub(center)

        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) {
            const scale = 1.8 / maxDim
            obj.scale.setScalar(scale)
            // 再次居中，避免缩放导致偏移
            const box2 = new THREE.Box3().setFromObject(obj)
            const center2 = new THREE.Vector3()
            box2.getCenter(center2)
            obj.position.sub(center2)
        }
    }
}
