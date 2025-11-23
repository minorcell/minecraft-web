import * as THREE from 'three'
import { World } from './class/World.js'
import { PlayerController } from './class/Player.js'
import { BlockInteractor } from './class/BlockInteractor.js'
import { Inventory } from './class/Inventory.js'
import { GuideBook } from './class/GuideBook.js'
import { WeatherSystem } from './class/WeatherSystem.js'
import { MusicPlayer } from './class/MusicPlayer.js'

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
// 降低环境光，避免阳光“穿透”被封闭的空间
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
scene.add(ambientLight)

// 主光源加强，依赖阴影而非环境光照亮世界
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
dirLight.position.set(100, 100, 50)
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 4096
dirLight.shadow.mapSize.height = 4096
dirLight.shadow.bias = -0.0008 // 减少高亮漏光
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
        villageCount: 5,
        treeCount: 520,
        grassCount: 900 // 减少草/花的总量
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
    // 常用建材/工具放在前排，便于快捷栏
    { type: 'stone', count: 128 },
    { type: 'wood', count: 128 },
    { type: 'copper_roof', count: 128 },
    { type: 'slab_wood', count: 128 },
    { type: 'stair_wood', count: 128 },
    { type: 'torch', count: 128 },
    { type: 'sand', count: 128 },
    { type: 'grass', count: 128 },
    { type: 'dirt', count: 128 },
    // 次要物品放后排（可从背包拖到快捷栏）
    { type: 'snow', count: 128 },
    { type: 'cactus', count: 128 },
    { type: 'flower', count: 128 },
    { type: 'leaves', count: 128 }
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

// 背景音乐：顺序播放后循环
const music = new MusicPlayer({
    playlist: [
        'public/music/001.mp3',
        'public/music/002.mp3',
        'public/music/003.mp3'
    ],
    volume: 0.4
})
music.start()

// 生成世界
world.generate()
player.spawnAtVillage(world)
weather.update(0, player.position)

// ====== 显示世界信息 =====
console.log('========== 世界生成完成 ==========')
console.log('世界信息:', world.getInfo())
console.log('村庄统计:', world.getVillageStats())
console.log('==================================')

// ====== FPS 计数器 ======
let frames = 0
let fps = 0
let lastTime = performance.now()
let fpsUpdateInterval = 500 // 更新间隔（毫秒）
let lastFpsUpdate = lastTime

function updateFPS(currentTime) {
    frames++
    const elapsed = currentTime - lastFpsUpdate

    if (elapsed >= fpsUpdateInterval) {
        fps = Math.round((frames * 1000) / elapsed)
        document.getElementById('fps-counter').textContent = `FPS: ${fps}`
        frames = 0
        lastFpsUpdate = currentTime
    }
}

// ====== 动画循环 ======
const clock = new THREE.Clock()
function animate() {
    requestAnimationFrame(animate)
    const dt = clock.getDelta()
    const currentTime = performance.now()

    player.update(dt)
    interactor.update()
    weather.update(dt, player.position)

    // 按玩家位置加载chunk
    world.updateChunks(player.position, player.getForwardFlat())

    renderer.render(scene, camera)

    // 更新FPS显示
    updateFPS(currentTime)
}
animate()

// ====== 窗口调整 ======
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})
