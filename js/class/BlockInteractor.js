import * as THREE from 'three'

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
     */
    constructor({ camera, scene, world, inventory, guideBook = null }) {
        this.camera = camera
        this.scene = scene
        this.world = world
        this.inventory = inventory
        this.guideBook = guideBook
        this.registry = world.registry
        this.maxDistance = 6

        this.highlight = this.createHighlightMesh()
        this.scene.add(this.highlight)

        this.rayDir = new THREE.Vector3()
        this.currentTarget = null

        this.hotbarSize = 9
        this.selectedIndex = 0
        this.hotbarSlots = []
        this.inventorySlots = []
        this.blockMeta = this.createBlockMeta()
        this.hotbarUI = this.createHotbarUI()
        this.inventoryUI = this.createInventoryUI()
        this.inventoryOpen = false

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

    createIcon(style) {
        const icon = document.createElement('div')
        icon.style.width = '32px'
        icon.style.height = '32px'
        icon.style.borderRadius = '4px'
        icon.style.background = `linear-gradient(135deg, ${style.color}, ${style.secondary})`
        icon.style.display = 'grid'
        icon.style.placeItems = 'center'
        icon.style.fontWeight = 'bold'
        icon.style.color = '#111'
        icon.style.textShadow = '0 1px 1px rgba(255,255,255,0.6)'
        icon.className = 'hud-icon'
        return icon
    }

    renderSlot(slotEl, slotData, active, indexLabel) {
        const iconEl = slotEl.querySelector('.hud-icon')
        const countEl = slotEl.querySelector('.hud-count')
        const meta = slotData ? (this.blockMeta[slotData.type] || this.blockMeta.default) : null

        if (meta) {
            iconEl.style.background = `linear-gradient(135deg, ${meta.color}, ${meta.secondary})`
            iconEl.textContent = meta.short
        } else {
            iconEl.style.background = 'rgba(255,255,255,0.08)'
            iconEl.textContent = ''
        }

        countEl.textContent = slotData && slotData.count > 1 ? slotData.count : ''
        slotEl.style.background = active ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.35)'
        slotEl.style.outline = active ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.25)'
        slotEl.title = slotData ? `${indexLabel} ${slotData.type} x${slotData.count}` : `${indexLabel} 空`
    }

    createHotbarUI() {
        const bar = document.createElement('div')
        bar.style.position = 'absolute'
        bar.style.bottom = '16px'
        bar.style.left = '50%'
        bar.style.transform = 'translateX(-50%)'
        bar.style.display = 'flex'
        bar.style.gap = '6px'
        bar.style.padding = '6px'
        bar.style.background = 'rgba(0,0,0,0.3)'
        bar.style.borderRadius = '6px'
        bar.style.fontFamily = 'monospace'
        bar.style.color = '#fff'
        bar.style.userSelect = 'none'

        for (let idx = 0; idx < this.hotbarSize; idx++) {
            const slot = document.createElement('div')
            slot.style.display = 'grid'
            slot.style.placeItems = 'center'
            slot.style.padding = '4px'
            slot.style.borderRadius = '6px'
            slot.style.minWidth = '44px'
            slot.style.minHeight = '48px'

            const icon = this.createIcon(this.blockMeta.default)
            const count = document.createElement('div')
            count.className = 'hud-count'
            count.style.position = 'absolute'
            count.style.right = '6px'
            count.style.bottom = '2px'
            count.style.fontSize = '12px'
            count.style.textShadow = '0 1px 1px rgba(0,0,0,0.6)'

            const wrapper = document.createElement('div')
            wrapper.style.position = 'relative'
            wrapper.appendChild(icon)
            wrapper.appendChild(count)

            const idxLabel = document.createElement('div')
            idxLabel.className = 'hud-idx'
            idxLabel.textContent = idx + 1
            idxLabel.style.position = 'absolute'
            idxLabel.style.left = '6px'
            idxLabel.style.top = '2px'
            idxLabel.style.fontSize = '11px'
            idxLabel.style.opacity = '0.8'

            slot.style.position = 'relative'
            slot.appendChild(idxLabel)
            slot.appendChild(wrapper)
            bar.appendChild(slot)
            this.hotbarSlots.push(slot)
        }

        document.body.appendChild(bar)
        return bar
    }

    updateHotbarUI() {
        this.hotbarSlots.forEach((slot, idx) => {
            const slotData = this.inventory.getSlot(idx)
            this.renderSlot(slot, slotData, idx === this.selectedIndex, `${idx + 1}`)
        })
    }

    createInventoryUI() {
        const inv = document.createElement('div')
        inv.style.position = 'absolute'
        inv.style.left = '50%'
        inv.style.top = '50%'
        inv.style.transform = 'translate(-50%, -50%)'
        inv.style.display = 'none'
        inv.style.gridTemplateColumns = 'repeat(9, 1fr)'
        inv.style.gap = '6px'
        inv.style.padding = '12px'
        inv.style.background = 'rgba(0,0,0,0.6)'
        inv.style.border = '1px solid rgba(255,255,255,0.2)'
        inv.style.borderRadius = '8px'
        inv.style.color = '#fff'
        inv.style.fontFamily = 'monospace'
        inv.style.zIndex = '1500'

        for (let i = 0; i < this.inventory.size; i++) {
            const slot = document.createElement('div')
            slot.style.display = 'grid'
            slot.style.placeItems = 'center'
            slot.style.padding = '6px'
            slot.style.minWidth = '64px'
            slot.style.minHeight = '64px'
            slot.style.borderRadius = '8px'
            slot.dataset.index = i

            const icon = this.createIcon(this.blockMeta.default)
            icon.style.width = '48px'
            icon.style.height = '48px'
            const count = document.createElement('div')
            count.className = 'hud-count'
            count.style.position = 'absolute'
            count.style.right = '6px'
            count.style.bottom = '2px'
            count.style.fontSize = '12px'
            count.style.textShadow = '0 1px 1px rgba(0,0,0,0.6)'

            const wrapper = document.createElement('div')
            wrapper.style.position = 'relative'
            wrapper.appendChild(icon)
            wrapper.appendChild(count)

            slot.appendChild(wrapper)
            inv.appendChild(slot)
            this.inventorySlots.push(slot)
        }

        document.body.appendChild(inv)
        return inv
    }

    updateInventoryUI() {
        this.inventorySlots.forEach((slot, idx) => {
            const data = this.inventory.getSlot(idx)
            this.renderSlot(slot, data, false, `${idx + 1}`)
        })
        this.updateHotbarUI()
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            // 热键栏 1-9
            if (e.code.startsWith('Digit')) {
                const num = parseInt(e.code.replace('Digit', ''), 10)
                if (num >= 1 && num <= this.hotbarSize) {
                    this.selectedIndex = num - 1
                    this.updateHotbarUI()
                }
            }

            // E 打开/关闭背包
            if (e.code === 'KeyE') {
                this.inventoryOpen = !this.inventoryOpen
                this.inventoryUI.style.display = this.inventoryOpen ? 'grid' : 'none'
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
            if (e.button === 2) e.preventDefault()
            if (e.button === 0) {
                this.breakBlock()
            } else if (e.button === 2) {
                this.placeBlock()
            }
        })

        // 滚轮切换热键栏
        window.addEventListener('wheel', (e) => {
            const dir = Math.sign(e.deltaY)
            this.selectedIndex = (this.selectedIndex + dir + this.hotbarSize) % this.hotbarSize
            this.updateHotbarUI()
        })
    }

    /**
     * 射线拾取当前瞄准的方块
     */
    updateHighlight() {
        this.camera.getWorldDirection(this.rayDir)
        const origin = this.camera.position.clone()
        const step = 0.2
        let hit = null

        for (let t = 0; t < this.maxDistance; t += step) {
            const point = origin.clone().add(this.rayDir.clone().multiplyScalar(t))
            const bx = Math.floor(point.x + 0.5)
            const by = Math.floor(point.y + 0.5)
            const bz = Math.floor(point.z + 0.5)

            if (this.registry.has(bx, by, bz)) {
                hit = { x: bx, y: by, z: bz }
                break
            }
        }

        this.currentTarget = hit
        if (hit) {
            this.highlight.position.set(hit.x, hit.y, hit.z)
            this.highlight.visible = true
        } else {
            this.highlight.visible = false
        }
    }

    /**
     * 简单破坏：移除方块并刷新chunk
     */
    breakBlock() {
        if (!this.currentTarget) return
        const { x, y, z } = this.currentTarget
        const type = this.registry.get(x, y, z)

        // 水方块不允许直接挖掉
        if (type === 'water') return

        this.world.voxelBuilder.removeBlock(x, y, z)

        // 将掉落加入背包
        if (type) {
            this.inventory.add(type, 1)
            this.updateInventoryUI()
        }

        // 简单水流：若邻近有水，则用水填充当前挖空的方块
        const neighbors = [
            [1, 0, 0], [-1, 0, 0],
            [0, 1, 0], [0, -1, 0],
            [0, 0, 1], [0, 0, -1]
        ]
        for (const [dx, dy, dz] of neighbors) {
            if (this.registry.get(x + dx, y + dy, z + dz) === 'water') {
                this.world.voxelBuilder.addBlock('water', x, y, z)
                break
            }
        }

        this.world.refreshChunkAt(x, z)
    }

    /**
     * 放置方块：基于射线方向将方块放在目标方块外侧
     */
    placeBlock() {
        if (!this.currentTarget) return
        const slot = this.inventory.getSlot(this.selectedIndex)
        if (!slot || slot.count <= 0) return
        const type = slot.type

        const normal = this.getPlacementNormal()
        const px = this.currentTarget.x + normal.x
        const py = this.currentTarget.y + normal.y
        const pz = this.currentTarget.z + normal.z

        // 避免覆盖已有方块
        if (this.registry.has(px, py, pz)) return

        this.world.voxelBuilder.addBlock(type, px, py, pz)
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
    }
}
