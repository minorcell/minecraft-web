import * as THREE from 'three'

/**
 * 玩家控制器：基础移动/重力/跳跃 + 简易第一/第三人称切换
 * 方块级AABB碰撞，水中有阻尼，支持按键移动
 */
export class PlayerController {
    /**
     * @param {object} options
     * @param {THREE.Camera} options.camera
     * @param {THREE.Scene} options.scene
     * @param {import('./Terrain.js').Terrain} options.terrain
     * @param {import('./World.js').World} options.world
     */
    constructor({ camera, scene, terrain, world }) {
        this.camera = camera
        this.scene = scene
        this.terrain = terrain
        this.world = world

        this.position = new THREE.Vector3(0, 10, 0)
        this.velocity = new THREE.Vector3()
        this.direction = new THREE.Vector3()
        this.up = new THREE.Vector3(0, 1, 0)

        this.isOnGround = false
        this.isThirdPerson = false
        this.speed = 6.5 // 移动速度减缓约20%
        this.jumpStrength = 6.5 // 跳跃力度略减，时间更短
        this.gravity = 22 // 增大重力让跳跃更快落地
        this.waterDrag = 0.4
        this.waterBuoyancy = 6
        this.playerHeight = 2.0 // 玩家高度两格
        this.stepHeight = 1.0 // 最大跨越一格高度
        this.bodyHalf = 0.35 // XZ半宽，稍宽以减少穿模
        this.solidBlocks = new Set(['grass', 'dirt', 'stone', 'wood', 'sand', 'snow', 'cactus', 'roof', 'leaves', 'bedrock'])
        this.yaw = 0
        this.pitch = 0
        this.mouseSensitivity = 0.002
        this.pointerLocked = false

        this.keys = {}
        this.initInput()
    }

    initInput() {
        // 锁定指针以获取鼠标移动
        window.addEventListener('click', () => {
            if (!this.pointerLocked) {
                document.body.requestPointerLock()
            }
        })

        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === document.body
        })

        // 鼠标移动控制视角
        window.addEventListener('mousemove', (e) => {
            if (!this.pointerLocked) return
            this.yaw -= e.movementX * this.mouseSensitivity
            this.pitch -= e.movementY * this.mouseSensitivity
            const maxPitch = Math.PI / 2 - 0.1
            this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
        })

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true
            // V 切换视角
            if (e.code === 'KeyV') {
                this.isThirdPerson = !this.isThirdPerson
            }
        })
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false
        })
    }

    /**
     * 获取玩家AABB边界
     */
    getAABB(pos = this.position) {
        return {
            minX: pos.x - this.bodyHalf,
            maxX: pos.x + this.bodyHalf,
            minY: pos.y,
            maxY: pos.y + this.playerHeight,
            minZ: pos.z - this.bodyHalf,
            maxZ: pos.z + this.bodyHalf
        }
    }

    /**
     * 检查与任意实心方块的碰撞
     * @param {object} aabb
     * @returns {boolean}
     */
    collides(aabb) {
        const minX = Math.floor(aabb.minX)
        const maxX = Math.floor(aabb.maxX)
        const minY = Math.floor(aabb.minY)
        const maxY = Math.floor(aabb.maxY)
        const minZ = Math.floor(aabb.minZ)
        const maxZ = Math.floor(aabb.maxZ)

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const type = this.world.registry.get(x, y, z)
                    if (type && this.solidBlocks.has(type)) {
                        // 方块AABB（占据整个格子）
                        const bMinX = x - 0.5
                        const bMaxX = x + 0.5
                        const bMinY = y - 0.5
                        const bMaxY = y + 0.5
                        const bMinZ = z - 0.5
                        const bMaxZ = z + 0.5

                        if (aabb.minX < bMaxX && aabb.maxX > bMinX &&
                            aabb.minY < bMaxY && aabb.maxY > bMinY &&
                            aabb.minZ < bMaxZ && aabb.maxZ > bMinZ) {
                            return true
                        }
                    }
                }
            }
        }
        return false
    }

    /**
     * 尝试沿单轴移动，返回实际移动量，并处理台阶抬升
     */
    moveAxis(pos, axis, delta, allowStep) {
        const nextPos = pos.clone()
        nextPos[axis] += delta
        let aabb = this.getAABB(nextPos)

        if (!this.collides(aabb)) {
            return { pos: nextPos, moved: delta, collided: false }
        }

        // 尝试台阶抬升
        if (allowStep) {
            const stepPos = pos.clone()
            stepPos.y += this.stepHeight
            stepPos[axis] += delta
            const stepAABB = this.getAABB(stepPos)
            if (!this.collides(stepAABB)) {
                return { pos: stepPos, moved: delta, collided: false, stepped: true }
            }
        }

        // 碰撞时将玩家贴到方块边界
        const sign = Math.sign(delta)
        const small = 0.001
        // 二分回退
        let low = 0, high = Math.abs(delta), best = 0
        for (let i = 0; i < 5; i++) {
            const mid = (low + high) / 2
            const testPos = pos.clone()
            testPos[axis] += sign * mid
            if (!this.collides(this.getAABB(testPos))) {
                best = mid
                low = mid
            } else {
                high = mid
            }
        }
        const finalPos = pos.clone()
        finalPos[axis] += sign * (best - small)
        return { pos: finalPos, moved: sign * best, collided: true }
    }

    updateCameraOffset() {
        // 根据 yaw/pitch 设置相机朝向
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
        this.camera.quaternion.setFromEuler(euler)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion)

        if (this.isThirdPerson) {
            // 第三人称：让相机在玩家身后一定距离
            const offset = forward.clone().multiplyScalar(-4)
            offset.y += 2
            this.camera.position.copy(this.position.clone().add(offset))
            this.camera.lookAt(this.position)
        } else {
            // 第一人称：相机位于玩家头部
            this.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, this.playerHeight - 0.2, 0)))
        }
    }

    /**
     * 每帧更新
     * @param {number} dt - delta time in seconds
     */
    update(dt) {
        // 基于 yaw/pitch 计算前向
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'))
        forward.y = 0
        forward.normalize()
        const right = new THREE.Vector3().crossVectors(forward, this.up).normalize()

        this.direction.set(0, 0, 0)
        if (this.keys['KeyW']) this.direction.add(forward)
        if (this.keys['KeyS']) this.direction.add(forward.clone().multiplyScalar(-1))
        if (this.keys['KeyA']) this.direction.add(right.clone().multiplyScalar(-1))
        if (this.keys['KeyD']) this.direction.add(right)

        let moveDir = new THREE.Vector3()
        if (this.direction.lengthSq() > 0) {
            moveDir = this.direction.normalize()
        }

        // 跳跃
        if (this.keys['Space'] && this.isOnGround) {
            this.velocity.y = this.jumpStrength
            this.isOnGround = false
        }

        // 水中阻尼
        const waterLevel = this.terrain.settings.waterLevel + 0.5
        const inWater = this.position.y < waterLevel
        if (inWater) {
            this.velocity.multiplyScalar(1 - this.waterDrag * dt)
            this.velocity.y += this.waterBuoyancy * dt
        }

        // 重力
        this.velocity.y -= this.gravity * dt

        // 先水平移动并处理碰撞/台阶
        const sprint = this.keys['ShiftLeft'] ? 1.4 : 1.0
        const moveSpeed = this.speed * sprint * dt
        const desired = moveDir.clone().multiplyScalar(moveSpeed)
        let pos = this.position.clone()

        // 按轴分解，允许台阶抬升
        const mx = this.moveAxis(pos, 'x', desired.x, true)
        pos = mx.pos
        const mz = this.moveAxis(pos, 'z', desired.z, true)
        pos = mz.pos

        // 垂直位移
        const my = this.moveAxis(pos, 'y', this.velocity.y * dt, false)
        pos = my.pos
        if (my.collided && this.velocity.y < 0) {
            this.velocity.y = 0
            this.isOnGround = true
        } else {
            this.isOnGround = false
        }

        // 如果有台阶抬升，稍微偏移相机高度，减小突兀感
        if ((mx.stepped || mz.stepped) && this.isThirdPerson === false) {
            // 平滑插值相机位置
            const camTarget = pos.clone().add(new THREE.Vector3(0, this.playerHeight - 0.2, 0))
            this.camera.position.lerp(camTarget, 0.4)
        }

        this.position.copy(pos)
        this.updateCameraOffset()
    }
}
