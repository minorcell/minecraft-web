import * as THREE from 'three'
import { TextureFactory } from '../textures.js'
import { BlockPreviewRenderer } from './Inventory.js'

/**
 * 方块交互管理：射线拾取、高亮、破坏/放置、热键栏、背包、说明书
 */
export class BlockInteractor {
    /**
     * @param {object} options
     * @param {THREE.Camera} options.camera
     * @param {THREE.Scene} options.scene
     * @param {import('./World.js').World} options.world
     * @param {import('./Inventory.js').Inventory} options.inventory
     * @param {import('./GuideBook.js').GuideBook} [options.guideBook]
     * @param {import('./Player.js').PlayerController} [options.player]
     */
    constructor({ camera, scene, world, inventory, guideBook = null, player = null }) {
        this.camera = camera
        this.scene = scene
        this.world = world
        this.inventory = inventory
        this.guideBook = guideBook
        this.blockDefs = world.blockDefs
        this.player = player
        this.registry = world.registry
        this.maxDistance = 6

        this.highlight = this.createHighlightMesh()
        this.scene.add(this.highlight)
        this.crackOverlay = this.createCrackOverlay()
        this.scene.add(this.crackOverlay)
        this.crosshair = this.createCrosshair()

        this.rayDir = new THREE.Vector3()
        this.currentTarget = null
        this.lastEmpty = null

        this.hotbarSize = 9
        this.selectedIndex = 0
        this.hotbarSlots = []
        this.inventorySlots = []
        this.blockMeta = this.createBlockMeta()
        this.textureFactory = new TextureFactory()
        this.previewRenderer = new BlockPreviewRenderer(this.blockDefs, this.textureFactory)
        this.hotbarUI = this.createHotbarUI()
        this.hotbarLabel = this.createHotbarLabel()
        this.inventoryUI = this.createInventoryUI()
        this.heldItem = null
        this.heldIcon = this.createHeldIcon()
        this.progressUI = this.createProgressUI()
        this.inventoryOpen = false
        this.isBreaking = false
        this.breakStart = 0
        this.breakDuration = 0
        this.breakTargetKey = null
        this.drops = []
        this.dropGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35)
        this.dropMats = {}

        this.initInput()
        this.updateInventoryUI()
    }

    createHighlightMesh() {
        const geo = new THREE.BoxGeometry(1.02, 1.02, 1.02)
        const edges = new THREE.EdgesGeometry(geo)
        const mat = new THREE.LineBasicMaterial({ color: 0xffff00 })
        const mesh = new THREE.LineSegments(edges, mat)
        mesh.visible = false
        return mesh
    }

    /**
     * 创建裂纹覆盖层
     */
    createCrackOverlay() {
        const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01)
        const texture = this.world.voxelBuilder.factory.createDestructionTexture(0)
        texture.transparent = true
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.visible = false
        return mesh
    }

    /**
     * 创建屏幕中心的十字准星（HTML/CSS，不占用3D性能）
     */
    createCrosshair() {
        const crosshair = document.createElement('div')
        crosshair.id = 'crosshair'
        crosshair.style.position = 'absolute'
        crosshair.style.left = '50%'
        crosshair.style.top = '50%'
        crosshair.style.transform = 'translate(-50%, -50%)'
        crosshair.style.width = '14px'
        crosshair.style.height = '14px'
        crosshair.style.pointerEvents = 'none'
        crosshair.style.display = 'block'

        // 水平和垂直线
        const horizontal = document.createElement('div')
        horizontal.style.position = 'absolute'
        horizontal.style.left = '0'
        horizontal.style.top = '50%'
        horizontal.style.transform = 'translateY(-50%)'
        horizontal.style.width = '14px'
        horizontal.style.height = '2px'
        horizontal.style.background = 'rgba(255,255,255,0.85)'

        const vertical = document.createElement('div')
        vertical.style.position = 'absolute'
        vertical.style.left = '50%'
        vertical.style.top = '0'
        vertical.style.transform = 'translateX(-50%)'
        vertical.style.width = '2px'
        vertical.style.height = '14px'
        vertical.style.background = 'rgba(255,255,255,0.85)'

        crosshair.appendChild(horizontal)
        crosshair.appendChild(vertical)
        document.body.appendChild(crosshair)
        return crosshair
    }

    /**
     * 定义方块的图标颜色/标记
     */
    createBlockMeta() {
        return {
            grass: { color: '#55aa55', secondary: '#3c8c3c', short: '草' },
            dirt: { color: '#8b5a2b', secondary: '#6f3f1e', short: '土' },
            stone: { color: '#8a8a8a', secondary: '#707070', short: '石' },
            wood: { color: '#9c6b3c', secondary: '#7a4c20', short: '木' },
            sand: { color: '#e2cf8c', secondary: '#cdb470', short: '沙' },
            snow: { color: '#f4f7fb', secondary: '#dce5f2', short: '雪' },
            cactus: { color: '#3b8c3b', secondary: '#2f7030', short: '仙' },
            flower: { color: '#ff7eb6', secondary: '#ffb347', short: '花' },
            leaves: { color: '#2f8a2f', secondary: '#237323', short: '叶' },
            water: { color: '#2277dd', secondary: '#1256aa', short: '水' },
            default: { color: '#888', secondary: '#555', short: '?' }
        }
    }

    createDropMaterial(type) {
        const textures = this.blockDefs.getTextures(type) || {}
        const opts = this.blockDefs.getMaterialOptions(type)
        const meta = this.blockMeta[type] || this.blockMeta.default

        const makeMaterial = (texName) => {
            if (!texName) {
                return new THREE.MeshStandardMaterial({
                    color: meta.color,
                    emissive: meta.secondary,
                    emissiveIntensity: 0.05,
                    roughness: 0.9,
                    metalness: 0.0
                })
            }
            const tex = this.textureFactory.createTexture(texName, 0)
            return new THREE.MeshStandardMaterial({
                map: tex,
                transparent: opts.transparent,
                opacity: opts.opacity,
                roughness: 0.95,
                metalness: 0.0
            })
        }

        if (textures.all) {
            const mat = makeMaterial(textures.all)
            return [mat, mat, mat, mat, mat, mat]
        }

        const sideTex = textures.side || textures.all || textures.top || textures.bottom || null
        const topTex = textures.top || sideTex
        const bottomTex = textures.bottom || sideTex

        const sideMat = makeMaterial(sideTex)
        const topMat = makeMaterial(topTex)
        const bottomMat = makeMaterial(bottomTex)

        return [
            sideMat,
            sideMat,
            topMat,
            bottomMat,
            sideMat,
            sideMat
        ]
    }

    createIcon(style) {
        const icon = document.createElement('div')
        icon.style.width = '32px'
        icon.style.height = '32px'
        icon.style.borderRadius = '4px'
        icon.style.display = 'grid'
        icon.style.placeItems = 'center'
        icon.style.fontWeight = 'bold'
        icon.style.color = '#111'
        icon.style.textShadow = '0 1px 1px rgba(255,255,255,0.6)'
        icon.className = 'hud-icon'
        return icon
    }

    createHeldIcon() {
        const holder = document.createElement('div')
        holder.id = 'hud-held'
        holder.className = 'hud-held'
        holder.style.display = 'none'

        const icon = this.createIcon(this.blockMeta.default)
        icon.classList.add('hud-held-icon')
        const count = document.createElement('div')
        count.className = 'hud-count'

        const inner = document.createElement('div')
        inner.className = 'hud-slot-inner'
        inner.appendChild(icon)
        inner.appendChild(count)

        holder.appendChild(inner)
        document.body.appendChild(holder)
        return { holder, icon, count }
    }

    renderSlot(slotEl, slotData, active, indexLabel) {
        const iconEl = slotEl.querySelector('.hud-icon')
        const countEl = slotEl.querySelector('.hud-count')
        const meta = slotData ? (this.blockMeta[slotData.type] || this.blockMeta.default) : null
        const preview = slotData ? this.previewRenderer.getPreview(slotData.type) : null

        if (preview) {
            iconEl.style.backgroundImage = `url(${preview})`
            iconEl.style.backgroundColor = 'rgba(0,0,0,0.1)'
            iconEl.textContent = ''
        } else if (meta) {
            iconEl.style.backgroundImage = 'none'
            iconEl.style.background = `linear-gradient(135deg, ${meta.color}, ${meta.secondary})`
            iconEl.textContent = meta.short
        } else {
            iconEl.style.backgroundImage = 'none'
            iconEl.style.background = 'rgba(255,255,255,0.08)'
            iconEl.textContent = ''
        }

        countEl.textContent = slotData && slotData.count > 1 ? slotData.count : ''
        slotEl.classList.toggle('is-active', active)
        slotEl.classList.toggle('is-empty', !slotData)
        slotEl.title = slotData ? `${indexLabel} ${slotData.type} x${slotData.count}` : `${indexLabel} 空`
    }

    createHotbarUI() {
        const bar = document.createElement('div')
        bar.id = 'hud-hotbar'
        bar.className = 'hud-hotbar'

        for (let idx = 0; idx < this.hotbarSize; idx++) {
            const slot = document.createElement('div')
            slot.className = 'hud-slot hotbar-slot'

            const icon = this.createIcon(this.blockMeta.default)
            const count = document.createElement('div')
            count.className = 'hud-count'

            const wrapper = document.createElement('div')
            wrapper.className = 'hud-slot-inner'
            wrapper.appendChild(icon)
            wrapper.appendChild(count)

            const idxLabel = document.createElement('div')
            idxLabel.className = 'hud-idx'
            idxLabel.textContent = idx + 1

            slot.appendChild(idxLabel)
            slot.appendChild(wrapper)
            bar.appendChild(slot)
            this.hotbarSlots.push(slot)

            slot.addEventListener('click', (e) => {
                if (!this.inventoryOpen) return
                e.stopPropagation()
                this.handleSlotClick(idx)
            })

            slot.addEventListener('contextmenu', (e) => {
                if (!this.inventoryOpen) return
                e.preventDefault()
                e.stopPropagation()
                this.handleSlotRightClick(idx)
            })
        }

        document.body.appendChild(bar)
        return bar
    }

    createHotbarLabel() {
        const label = document.createElement('div')
        label.id = 'hotbar-label'
        label.className = 'hotbar-label'
        label.textContent = ''
        document.body.appendChild(label)
        return label
    }

    updateHotbarUI() {
        this.hotbarSlots.forEach((slot, idx) => {
            const slotData = this.inventory.getSlot(idx)
            this.renderSlot(slot, slotData, idx === this.selectedIndex, `${idx + 1}`)
        })
        this.updateHotbarLabel()
    }

    createInventoryUI() {
        const panel = document.createElement('div')
        panel.id = 'hud-inventory'
        panel.className = 'hud-inventory-panel'
        panel.style.display = 'none'

        const stopBubble = (e) => {
            e.stopPropagation()
        }
        ;['click', 'mousedown', 'mouseup', 'wheel', 'contextmenu'].forEach(evt => {
            panel.addEventListener(evt, stopBubble)
        })

        const title = document.createElement('div')
        title.className = 'hud-panel-title'
        title.textContent = '物品栏 (E 关闭)'
        panel.appendChild(title)

        const inv = document.createElement('div')
        inv.className = 'hud-inventory-grid'
        panel.appendChild(inv)

        for (let i = 0; i < this.inventory.size; i++) {
            const slot = document.createElement('div')
            slot.className = 'hud-slot inventory-slot'
            slot.dataset.index = i

            const icon = this.createIcon(this.blockMeta.default)
            const count = document.createElement('div')
            count.className = 'hud-count'

            const wrapper = document.createElement('div')
            wrapper.className = 'hud-slot-inner'
            wrapper.appendChild(icon)
            wrapper.appendChild(count)

            slot.appendChild(wrapper)
            inv.appendChild(slot)
            this.inventorySlots.push(slot)

            slot.addEventListener('click', (e) => {
                if (!this.inventoryOpen) return
                e.stopPropagation()
                this.handleSlotClick(i)
            })

            slot.addEventListener('contextmenu', (e) => {
                if (!this.inventoryOpen) return
                e.preventDefault()
                e.stopPropagation()
                this.handleSlotRightClick(i)
            })
        }

        document.body.appendChild(panel)
        return panel
    }

    updateInventoryUI() {
        this.inventorySlots.forEach((slot, idx) => {
            const data = this.inventory.getSlot(idx)
            this.renderSlot(slot, data, false, `${idx + 1}`)
        })
        this.updateHotbarUI()
        this.updateHeldIcon()
    }

    handleSlotClick(index) {
        if (!this.inventory) return
        const slotData = this.inventory.getSlot(index)

        // 拾取
        if (!this.heldItem && slotData) {
            this.heldItem = { ...slotData }
            this.inventory.slots[index] = null
        } else if (this.heldItem) {
            if (!slotData) {
                this.inventory.slots[index] = { ...this.heldItem }
                this.heldItem = null
            } else if (slotData.type === this.heldItem.type) {
                this.inventory.slots[index] = { type: slotData.type, count: slotData.count + this.heldItem.count }
                this.heldItem = null
            } else {
                this.inventory.slots[index] = { ...this.heldItem }
                this.heldItem = { ...slotData }
            }
        }

        this.updateInventoryUI()
    }

    handleSlotRightClick(index) {
        if (!this.inventory) return
        const slotData = this.inventory.getSlot(index)

        if (this.heldItem) {
            // 放置单个
            if (!slotData) {
                this.inventory.slots[index] = { type: this.heldItem.type, count: 1 }
                this.heldItem.count -= 1
            } else if (slotData.type === this.heldItem.type) {
                this.inventory.slots[index] = { type: slotData.type, count: slotData.count + 1 }
                this.heldItem.count -= 1
            } else {
                // 不同类型则交换
                this.inventory.slots[index] = { ...this.heldItem }
                this.heldItem = { ...slotData }
            }
            if (this.heldItem && this.heldItem.count <= 0) {
                this.heldItem = null
            }
        } else if (slotData) {
            // 拆分一半
            const take = Math.ceil(slotData.count / 2)
            this.heldItem = { type: slotData.type, count: take }
            const remain = slotData.count - take
            this.inventory.slots[index] = remain > 0 ? { type: slotData.type, count: remain } : null
        }

        this.updateInventoryUI()
    }

    updateHeldIcon() {
        if (!this.heldIcon) return
        const { holder, icon, count } = this.heldIcon
        if (!this.heldItem) {
            holder.style.display = 'none'
            return
        }
        const preview = this.previewRenderer.getPreview(this.heldItem.type)
        if (preview) {
            icon.style.backgroundImage = `url(${preview})`
            icon.style.backgroundColor = 'rgba(0,0,0,0.1)'
            icon.textContent = ''
        } else {
            const meta = this.blockMeta[this.heldItem.type] || this.blockMeta.default
            icon.style.backgroundImage = 'none'
            icon.style.background = `linear-gradient(135deg, ${meta.color}, ${meta.secondary})`
            icon.textContent = meta.short
        }
        count.textContent = this.heldItem.count > 1 ? this.heldItem.count : ''
        holder.style.display = 'block'
        this.updateHotbarLabel()
    }

    stashHeldItem() {
        if (!this.heldItem) return
        const success = this.inventory.add(this.heldItem.type, this.heldItem.count)
        if (success) {
            this.heldItem = null
            this.updateInventoryUI()
            this.updateHotbarLabel()
        }
    }

    updateHotbarLabel() {
        if (!this.hotbarLabel) return
        const slot = this.inventory.getSlot(this.selectedIndex)
        if (!slot) {
            this.hotbarLabel.textContent = ''
            this.hotbarLabel.style.opacity = '0'
            return
        }
        const def = this.blockDefs.get(slot.type)
        const name = def?.name || slot.type
        this.hotbarLabel.textContent = name
        this.hotbarLabel.style.opacity = '1'
    }

    /**
     * 破坏进度UI - 我的世界风格
     */
    createProgressUI() {
        const ui = document.createElement('div')
        ui.style.position = 'absolute'
        ui.style.left = '50%'
        ui.style.top = '50%'
        ui.style.transform = 'translate(-50%, -50%)'
        ui.style.width = '40px'
        ui.style.height = '40px'
        ui.style.borderRadius = '50%'
        ui.style.border = '2px solid rgba(0,0,0,0.6)'
        ui.style.background = 'conic-gradient(#ffa500 0deg, rgba(0,0,0,0.2) 0deg)'
        ui.style.display = 'none'
        ui.style.pointerEvents = 'none'
        ui.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.1), inset 0 0 10px rgba(0,0,0,0.4)'
        ui.style.zIndex = '1600'
        document.body.appendChild(ui)
        return ui
    }

    updateProgressUI(progress) {
        if (progress <= 0) {
            this.progressUI.style.display = 'none'
            return
        }
        this.progressUI.style.display = 'block'
        const deg = Math.min(360, progress * 360)
        this.progressUI.style.background = `conic-gradient(#ffa500 ${deg}deg, rgba(0,0,0,0.2) ${deg}deg)`
    }

    getBlockHardness(type) {
        const def = this.blockDefs.get(type)
        if (!def) return 0.6
        if (def.breakable === false) return Infinity
        return def.hardness ?? 0.6
    }

    /**
     * 当前手持工具的破坏力系数
     */
    getToolPower() {
        const slot = this.inventory.getSlot(this.selectedIndex)
        if (!slot || slot.count <= 0) {
            return this.blockDefs.getToolPower(null)
        }
        return this.blockDefs.getToolPower(slot.type)
    }

    targetKey(t) {
        return `${t.x},${t.y},${t.z}`
    }

    spawnDrop(type, x, y, z) {
        if (!this.dropMats[type]) {
            this.dropMats[type] = this.createDropMaterial(type)
        }
        const mesh = new THREE.Mesh(this.dropGeo, this.dropMats[type])
        mesh.position.set(x, y, z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)

        this.drops.push({
            type,
            mesh,
            vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 2 + Math.random() * 0.5, (Math.random() - 0.5) * 1.5)
        })
    }

    initInput() {
        // 禁用默认右键菜单，确保右键放置可用
        window.addEventListener('contextmenu', (e) => e.preventDefault())

        window.addEventListener('keydown', (e) => {
            // 热键栏 1-9
            if (e.code.startsWith('Digit')) {
                const num = parseInt(e.code.replace('Digit', ''), 10)
                if (num >= 1 && num <= this.hotbarSize) {
                    this.selectedIndex = num - 1
                    this.updateHotbarUI()
                    this.updateHotbarLabel()
                }
            }

            // E 打开/关闭背包
            if (e.code === 'KeyE') {
                const next = !this.inventoryOpen
                if (!next) {
                    this.stashHeldItem()
                }
                this.inventoryOpen = next
                this.inventoryUI.style.display = this.inventoryOpen ? 'flex' : 'none'
                if (this.inventoryOpen && document.pointerLockElement) {
                    document.exitPointerLock()
                }
            }

            // B 打开/关闭说明书
            if (e.code === 'KeyB' && this.guideBook) {
                this.guideBook.toggle()
            }
        })

        window.addEventListener('mousedown', (e) => {
            if (this.inventoryOpen) {
                e.stopPropagation()
                return
            }
            if (e.button === 2) e.preventDefault()
            if (e.button === 0) {
                this.startBreaking()
            } else if (e.button === 2) {
                this.placeBlock()
            }
        })

        window.addEventListener('mouseup', (e) => {
            if (this.inventoryOpen) {
                e.stopPropagation()
                return
            }
            if (e.button === 0) {
                this.stopBreaking()
            }
        })

        // 滚轮切换热键栏
        window.addEventListener('wheel', (e) => {
            if (this.inventoryOpen) {
                e.stopPropagation()
                return
            }
            const dir = Math.sign(e.deltaY)
            this.selectedIndex = (this.selectedIndex + dir + this.hotbarSize) % this.hotbarSize
            this.updateHotbarUI()
            this.updateHotbarLabel()
        })

        window.addEventListener('mousemove', (e) => {
            if (!this.heldIcon || !this.heldItem) return
            this.heldIcon.holder.style.left = `${e.clientX + 6}px`
            this.heldIcon.holder.style.top = `${e.clientY + 6}px`
        })

        window.addEventListener('click', (e) => {
            if (!this.inventoryOpen) return
            const target = e.target
            if (target.closest('#hud-inventory') || target.closest('#hud-hotbar') || target.closest('#hud-held')) return
            e.stopPropagation()
            e.preventDefault()
        }, true)
    }

    /**
     * 射线拾取当前瞄准的方块
     */
    updateHighlight() {
        this.camera.getWorldDirection(this.rayDir)
        const origin = this.camera.position.clone()
        const step = 0.2
        let hit = null
        this.lastEmpty = null

        for (let t = 0; t < this.maxDistance; t += step) {
            const point = origin.clone().add(this.rayDir.clone().multiplyScalar(t))
            const bx = Math.floor(point.x + 0.5)
            const by = Math.floor(point.y + 0.5)
            const bz = Math.floor(point.z + 0.5)

            if (this.registry.has(bx, by, bz)) {
                hit = { x: bx, y: by, z: bz }
                break
            } else {
                this.lastEmpty = { x: bx, y: by, z: bz }
            }
        }

        this.currentTarget = hit
        // 取消3D高亮，使用屏幕十字准星
        this.highlight.visible = false
        if (!hit) {
            this.stopBreaking()
        }
    }

    /**
     * 简单破坏：移除方块并刷新chunk
     */
    breakBlockInstant(target) {
        const { x, y, z } = target
        const type = this.registry.get(x, y, z)

        // 水方块不允许直接挖掉
        if (type === 'water') return

        // 收集要清除的方块位置（仙人掌需整株摧毁）
        const positions = [{ x, y, z }]
        if (type === 'cactus') {
            // 向上收集连续仙人掌
            let offset = 1
            while (this.registry.get(x, y + offset, z) === 'cactus') {
                positions.push({ x, y: y + offset, z })
                offset++
            }
            // 向下收集连续仙人掌（防止中间破坏）
            offset = -1
            while (this.registry.get(x, y + offset, z) === 'cactus') {
                positions.push({ x, y: y + offset, z })
                offset--
            }
        }

        // 生成掉落实体
        const drops = this.blockDefs.getDrops(type)
        for (const pos of positions) {
            this.world.voxelBuilder.removeBlock(pos.x, pos.y, pos.z)
            drops.forEach(drop => {
                const count = drop.count || 1
                for (let i = 0; i < count; i++) {
                    this.spawnDrop(drop.id, pos.x + 0.2 * (Math.random() - 0.5), pos.y + 0.6, pos.z + 0.2 * (Math.random() - 0.5))
                }
            })
        }

        // 简单水流：仅在水位以下或相邻侧面有水且下方有支撑时填充
        const neighbors = [
            [1, 0, 0], [-1, 0, 0],
            [0, 1, 0], [0, -1, 0],
            [0, 0, 1], [0, 0, -1]
        ]
        const waterLevel = this.world.terrain.settings.waterLevel
        for (const [dx, dy, dz] of neighbors) {
            const nx = x + dx
            const ny = y + dy
            const nz = z + dz
            if (this.registry.get(nx, ny, nz) === 'water') {
                // 下方需要有方块或位于水位以下，避免水悬空
                const below = this.registry.get(x, y - 1, z)
                if (y <= waterLevel || below) {
                    this.world.voxelBuilder.addBlock('water', x, y, z)
                }
                break
            }
        }

        this.world.refreshChunkAt(x, z)
    }

    /**
     * 开始破坏计时
     */
    startBreaking() {
        if (!this.currentTarget) return
        const type = this.registry.get(this.currentTarget.x, this.currentTarget.y, this.currentTarget.z)
        const hardness = this.getBlockHardness(type)
        if (!type || hardness === Infinity) return
        this.isBreaking = true
        this.breakStart = performance.now()
        const toolPower = this.getToolPower()
        this.breakDuration = (hardness / toolPower) * 1000
        this.breakTargetKey = this.targetKey(this.currentTarget)
    }

    stopBreaking() {
        this.isBreaking = false
        this.breakTargetKey = null
        this.updateProgressUI(0)
    }

    /**
     * 放置方块：基于射线方向将方块放在目标方块外侧
     */
    placeBlock() {
        if (!this.currentTarget) return
        const slot = this.inventory.getSlot(this.selectedIndex)
        if (!slot || slot.count <= 0) return
        const type = slot.type

        // 优先使用上一次射线的空位（命中的方块外侧空气格）
        let px, py, pz
        if (this.lastEmpty) {
            px = this.lastEmpty.x
            py = this.lastEmpty.y
            pz = this.lastEmpty.z
        } else {
            const normal = this.getPlacementNormal()
            px = this.currentTarget.x + normal.x
            py = this.currentTarget.y + normal.y
            pz = this.currentTarget.z + normal.z
        }

        // 避免覆盖已有方块
        if (this.registry.has(px, py, pz)) return

        this.world.voxelBuilder.addBlock(type, px, py, pz)
        this.registry.add(type, px, py, pz)
        this.inventory.consume(this.selectedIndex)
        this.updateInventoryUI()
        this.world.refreshChunkAt(px, pz)
    }

    /**
     * 根据视线方向估算放置的法线
     * @returns {{x:number,y:number,z:number}}
     */
    getPlacementNormal() {
        const dir = this.rayDir.clone()
        const abs = dir.clone().set(Math.abs(dir.x), Math.abs(dir.y), Math.abs(dir.z))
        if (abs.x > abs.y && abs.x > abs.z) {
            return { x: Math.sign(dir.x), y: 0, z: 0 }
        }
        if (abs.y > abs.x && abs.y > abs.z) {
            return { x: 0, y: Math.sign(dir.y), z: 0 }
        }
        return { x: 0, y: 0, z: Math.sign(dir.z) }
    }

    update() {
        this.updateHighlight()

        // 破坏计时更新
        if (this.isBreaking) {
            const now = performance.now()
            const targetChanged = !this.currentTarget || this.targetKey(this.currentTarget) !== this.breakTargetKey
            if (targetChanged) {
                this.stopBreaking()
            } else {
                const progress = (now - this.breakStart) / this.breakDuration
                this.updateProgressUI(progress)
                this.updateCrackOverlay(progress)
                if (progress >= 1) {
                    // 在摧毁方块之前先隐藏裂纹覆盖层
                    this.hideCrackOverlay()
                    this.breakBlockInstant(this.currentTarget)
                    this.stopBreaking()
                }
            }
        } else {
            this.updateProgressUI(0)
            this.hideCrackOverlay()
        }

        this.updateDrops()
    }

    /**
     * 更新裂纹覆盖层的位置和不透明度
     */
    updateCrackOverlay(progress) {
        if (!this.currentTarget) {
            this.hideCrackOverlay()
            return
        }
        const { x, y, z } = this.currentTarget
        this.crackOverlay.position.set(x, y, z)
        this.crackOverlay.visible = true
        // 根据进度调整破坏可见度与阶段纹理
        const stages = 5
        const stage = Math.min(stages, Math.max(0, Math.floor(progress * (stages + 1))))
        if (this.crackOverlay.material._stage !== stage) {
            const tex = this.world.voxelBuilder.factory.createDestructionTexture(stage, stages)
            this.crackOverlay.material.map = tex
            this.crackOverlay.material._stage = stage
            this.crackOverlay.material.needsUpdate = true
        }
        this.crackOverlay.material.opacity = Math.min(1, 0.4 + progress * 0.8)
    }

    hideCrackOverlay() {
        this.crackOverlay.visible = false
    }

    /**
     * 掉落物更新：重力、简单地面碰撞、拾取
     */
    updateDrops() {
        if (!this.player) return
        const playerPos = this.player.position
        const gravity = 30
        const pickupRadius = 1.2
        const remaining = []
        const dt = 1 / 60

        for (const drop of this.drops) {
            drop.vel.y -= gravity * dt
            drop.mesh.position.add(drop.vel.clone().multiplyScalar(dt))

            const support = this.findSupportBelow(drop.mesh.position)
            if (support.hit) {
                const targetY = support.y + 0.2
                if (drop.mesh.position.y <= targetY) {
                    drop.mesh.position.y = targetY
                    drop.vel.y *= -0.2
                    drop.vel.x *= 0.7
                    drop.vel.z *= 0.7
                }
            }

            // 拾取检测
            if (drop.mesh.position.distanceTo(playerPos) <= pickupRadius) {
                this.inventory.add(drop.type, 1)
                this.updateInventoryUI()
                this.scene.remove(drop.mesh)
                continue
            }

            remaining.push(drop)
        }
        this.drops = remaining
    }

    /**
     * 从当前位置向下扫描，找到最近的实心方块顶部；若无则返回地形高度
     * @param {THREE.Vector3} pos
     * @returns {{hit:boolean,y:number}}
     */
    findSupportBelow(pos) {
        const bx = Math.floor(pos.x + 0.5)
        const bz = Math.floor(pos.z + 0.5)
        const startY = Math.floor(pos.y + 0.5)
        const minY = this.world.terrain.settings.bedrockLevel

        for (let y = startY; y >= minY; y--) {
            const type = this.registry.get(bx, y, bz)
            if (type && this.blockDefs.isSolid(type)) {
                const belowType = this.registry.get(bx, y - 1, bz)
                if (y <= minY || (belowType && this.blockDefs.isSolid(belowType))) {
                    return { hit: true, y: y + 0.5 }
                }
                // 漂浮块（下方是空气/非实心），忽略继续向下找
            }
        }

        const groundY = this.world.terrain.getHeight(bx, bz)
        return { hit: false, y: groundY + 0.5 }
    }
}
