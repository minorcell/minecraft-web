import * as THREE from 'three'

/**
 * 玩家控制器：基础移动/重力/跳跃 + 简易第一/第三人称切换
 * 采用高度图贴地碰撞，水中有阻尼，支持按键移动
 */
export class PlayerController {
    /**
     * @param {object} options
     * @param {THREE.Camera} options.camera
     * @param {THREE.Scene} options.scene
     * @param {import('./Terrain.js').Terrain} options.terrain
     */
    constructor({ camera, scene, terrain }) {
        this.camera = camera
        this.scene = scene
        this.terrain = terrain

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
     * 基于高度图的地面检测
     */
    resolveGround(dt) {
        const groundY = this.terrain.getHeight(this.position.x, this.position.z) + 1.01
        const waterLevel = this.terrain.settings.waterLevel + 0.5

        // 水中阻尼
        const inWater = this.position.y < waterLevel
        if (inWater) {
            this.velocity.multiplyScalar(1 - this.waterDrag * dt)
            this.velocity.y += this.waterBuoyancy * dt
        }

        // 重力
        this.velocity.y -= this.gravity * dt

        // 简易阶梯平滑：允许抬升 stepHeight 内的落差（默认1格）
        const nextY = this.position.y + this.velocity.y * dt
        if (nextY <= groundY + this.stepHeight) {
            this.position.y = Math.max(nextY, groundY)
            if (this.position.y <= groundY + 0.05) {
                this.position.y = groundY
                this.velocity.y = 0
                this.isOnGround = true
            } else {
                this.isOnGround = false
            }
        } else {
            this.isOnGround = false
        }
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

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize()
            const sprint = this.keys['ShiftLeft'] ? 1.4 : 1.0
            this.position.add(this.direction.multiplyScalar(this.speed * sprint * dt))
        }

        // 跳跃
        if (this.keys['Space'] && this.isOnGround) {
            this.velocity.y = this.jumpStrength
            this.isOnGround = false
        }

        // 重力/水中
        this.resolveGround(dt)

        // 位置更新（垂直分量）
        this.position.add(new THREE.Vector3(0, this.velocity.y * dt, 0))

        this.updateCameraOffset()
    }
}
