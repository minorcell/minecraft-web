import * as THREE from 'three'
import { World } from './class/World.js'
import { PlayerController } from './class/Player.js'
import { BlockInteractor } from './class/BlockInteractor.js'
import { Inventory } from './class/Inventory.js'
import { GuideBook } from './class/GuideBook.js'
import { WeatherSystem } from './class/WeatherSystem.js'

// ====== 场景设置 ======
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87CEEB) // 天空蓝
scene.fog = new THREE.Fog(0x87CEEB, 50, 300)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 20, 20)
camera.lookAt(0, 10, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// ====== 光照 ======
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
dirLight.position.set(100, 100, 50)
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 4096
dirLight.shadow.mapSize.height = 4096
dirLight.shadow.camera.near = 0.5
dirLight.shadow.camera.far = 500
dirLight.shadow.camera.left = -250
dirLight.shadow.camera.right = 250
dirLight.shadow.camera.top = 250
dirLight.shadow.camera.bottom = -250
scene.add(dirLight)

// ====== 创建世界 ======
const world = new World({
    scene: scene,
    settings: {
        worldSize: 256,
        villageCount: 8,
        treeCount: 300,
        grassCount: 2000
    },
    viewDistance: 6
})

// 玩家与交互
const player = new PlayerController({
    camera,
    scene,
    terrain: world.terrain,
    world
})

const inventory = new Inventory(27, [
    { type: 'grass', count: 16 },
    { type: 'dirt', count: 32 },
    { type: 'stone', count: 32 },
    { type: 'wood', count: 16 },
    { type: 'sand', count: 16 },
    { type: 'snow', count: 16 },
    { type: 'cactus', count: 8 },
    { type: 'flower', count: 16 },
    { type: 'leaves', count: 16 }
])

const interactor = new BlockInteractor({
    camera,
    scene,
    world,
    inventory,
    guideBook: new GuideBook(),
    player
})

const weather = new WeatherSystem({
    scene,
    camera,
    terrain: world.terrain,
    ambientLight,
    dirLight
})

// 生成世界
world.generate()
player.findSafeSpawn({ x: 0, z: 0 }, 20)
weather.update(0, player.position)

// ====== 显示世界信息 =====
console.log('========== 世界生成完成 ==========')
console.log('世界信息:', world.getInfo())
console.log('村庄统计:', world.getVillageStats())
console.log('==================================')

// ====== 动画循环 ======
const clock = new THREE.Clock()
function animate() {
    requestAnimationFrame(animate)
    const dt = clock.getDelta()

    player.update(dt)
    interactor.update()
    weather.update(dt, player.position)

    // 按玩家位置加载chunk
    world.updateChunks(player.position, player.getForwardFlat())

    renderer.render(scene, camera)
}
animate()

// ====== 窗口调整 ======
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})
