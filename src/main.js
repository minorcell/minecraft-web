import * as THREE from 'three'
import { World } from './class/World.js'
import { PlayerController } from './class/Player.js'
import { BlockInteractor } from './class/BlockInteractor.js'
import { Inventory } from './class/Inventory.js'
import { GuideBook } from './class/GuideBook.js'
import { WeatherSystem } from './class/WeatherSystem.js'
import { MusicPlayer } from './class/MusicPlayer.js'

// ====== 配置与性能预设 ======
const params = new URLSearchParams(window.location.search)
const performanceMode = params.get('perf') === '1' || params.get('performance') === '1' || params.get('performance') === 'true'
const defaultPixelRatio = 1.2
const maxPixelRatio = 1.5
const worldProfiles = {
    quality: {
        viewDistance: 5,
        treeCount: 520,
        grassCount: 900
    },
    performance: {
        viewDistance: 4,
        treeCount: 300,
        grassCount: 500
    }
}
const worldProfile = performanceMode ? worldProfiles.performance : worldProfiles.quality
const weatherParam = params.get('weather')
const weatherEnabled = weatherParam === 'on' ? true : weatherParam === 'off' ? false : false
const defaultShadowEnabled = false

// ====== 场景设置 ======
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87CEEB) // 天空蓝
scene.fog = new THREE.Fog(0x87CEEB, 50, 300)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 20, 20)
camera.lookAt(0, 10, 0)

const renderer = new THREE.WebGLRenderer({ antialias: !performanceMode })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(defaultPixelRatio, maxPixelRatio))
renderer.shadowMap.enabled = defaultShadowEnabled
renderer.shadowMap.type = performanceMode ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// ====== 光照 ======
// 降低环境光，避免阳光“穿透”被封闭的空间
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)
scene.add(ambientLight)

// 主光源加强，依赖阴影而非环境光照亮世界
const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
dirLight.position.set(100, 100, 50)
dirLight.castShadow = defaultShadowEnabled
dirLight.shadow.mapSize.width = performanceMode ? 1024 : 2048
dirLight.shadow.mapSize.height = performanceMode ? 1024 : 2048
dirLight.shadow.bias = -0.0006 // 减少高亮漏光
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
        treeCount: worldProfile.treeCount,
        grassCount: worldProfile.grassCount // 减少草/花的总量
    },
    viewDistance: worldProfile.viewDistance,
    shadowOptions: {
        cast: defaultShadowEnabled,
        receive: defaultShadowEnabled
    }
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
let weatherActive = weatherEnabled
weather.setEnabled(weatherEnabled)

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
if (weather) {
    weather.update(0, player.position)
}

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
let isPaused = false
let shouldRelockPointer = false
const fpsEl = document.getElementById('fps-counter')

function updateFPS(currentTime) {
    frames++
    const elapsed = currentTime - lastFpsUpdate

    if (elapsed >= fpsUpdateInterval) {
        fps = Math.round((frames * 1000) / elapsed)
        fpsEl.textContent = `FPS: ${fps}`
        frames = 0
        lastFpsUpdate = currentTime
    }
}

function togglePauseMenu(show) {
    isPaused = show
    interactor.setPaused(show)
    pauseUI.setVisible(show)
    if (show) {
        shouldRelockPointer = document.pointerLockElement === document.body
        if (document.pointerLockElement) {
            document.exitPointerLock()
        }
        fpsEl.textContent = 'FPS: 暂停'
    } else {
        const needLock = shouldRelockPointer || !document.pointerLockElement
        if (needLock) {
            document.body.requestPointerLock()
        }
        shouldRelockPointer = false
    }
}

// ====== 动画循环 ======
const clock = new THREE.Clock()
function animate() {
    requestAnimationFrame(animate)
    const dt = clock.getDelta()
    const currentTime = performance.now()

    if (!isPaused) {
        player.update(dt)
        interactor.update()
        if (weather && weatherActive) {
            weather.update(dt, player.position)
        }
        // 按玩家位置加载chunk
        world.updateChunks(player.position, player.getForwardFlat())
        updateFPS(currentTime)
    }

    renderer.render(scene, camera)
}
animate()

// ====== 窗口调整 ======
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(defaultPixelRatio, maxPixelRatio))
    renderer.setSize(window.innerWidth, window.innerHeight)
})

// ====== ESC 暂停/选项菜单 ======
function makeToggle(label, initial, disabled, onChange) {
    const row = document.createElement('div')
    row.className = 'pause-row'
    const text = document.createElement('div')
    text.textContent = label
    const btn = document.createElement('button')
    btn.className = 'pause-toggle'
    const applyState = (state) => {
        btn.classList.toggle('on', state)
        btn.textContent = state ? '开启' : '关闭'
        btn.disabled = disabled
    }
    applyState(initial)
    btn.addEventListener('click', () => {
        const next = !btn.classList.contains('on')
        applyState(next)
        onChange?.(next)
    })
    row.appendChild(text)
    row.appendChild(btn)
    return { row, applyState }
}

function makeSlider(label, min, max, step, initial, suffix, onInput) {
    const row = document.createElement('div')
    row.className = 'pause-row'
    const text = document.createElement('div')
    text.textContent = label
    const value = document.createElement('span')
    value.className = 'pause-value'
    const input = document.createElement('input')
    input.type = 'range'
    input.min = min
    input.max = max
    input.step = step
    input.value = initial
    const setValue = (v) => {
        value.textContent = `${Number(v).toFixed(step < 1 ? 1 : 0)}${suffix || ''}`
    }
    setValue(initial)
    input.addEventListener('input', () => {
        setValue(input.value)
        onInput?.(Number(input.value))
    })
    const right = document.createElement('div')
    right.className = 'pause-slider'
    right.appendChild(input)
    right.appendChild(value)
    row.appendChild(text)
    row.appendChild(right)
    return { row, setValue }
}

function createPauseUI(options = {}) {
    const overlay = document.createElement('div')
    overlay.id = 'pause-overlay'
    const panel = document.createElement('div')
    panel.className = 'pause-panel'

    const title = document.createElement('div')
    title.className = 'pause-title'
    title.textContent = '游戏已暂停'
    const subtitle = document.createElement('div')
    subtitle.className = 'pause-subtitle'
    subtitle.textContent = '按 Esc 返回，或调整画质/天气'

    const resumeBtn = document.createElement('button')
    resumeBtn.className = 'pause-btn primary'
    resumeBtn.textContent = '继续游戏 (Esc)'
    resumeBtn.addEventListener('click', () => options.onResume?.())

    const controls = document.createElement('div')
    controls.className = 'pause-controls'

    const viewSlider = makeSlider('视距 (chunk)', 3, 8, 1, options.initialViewDistance || 6, '', (v) => {
        options.onViewDistanceChange?.(v)
    })

    const pixelSlider = makeSlider('像素比', 0.8, maxPixelRatio, 0.1, Math.min(renderer.getPixelRatio ? renderer.getPixelRatio() : defaultPixelRatio, maxPixelRatio), 'x', (v) => {
        options.onPixelRatioChange?.(v)
    })

    const shadowToggle = makeToggle('阴影', options.shadowEnabled !== false, false, (state) => {
        options.onShadowToggle?.(state)
    })

    const weatherToggle = makeToggle(
        weather ? '天气效果' : '天气效果（当前未加载）',
        weatherActive,
        !weather,
        (state) => {
            if (!weather) return
            options.onWeatherToggle?.(state)
        }
    )

    controls.appendChild(viewSlider.row)
    controls.appendChild(pixelSlider.row)
    controls.appendChild(shadowToggle.row)
    controls.appendChild(weatherToggle.row)

    const tips = document.createElement('div')
    tips.className = 'pause-tips'
    tips.textContent = '提示：性能模式推荐关闭阴影、降低像素比/视距；天气关闭可减少粒子开销。'

    panel.appendChild(title)
    panel.appendChild(subtitle)
    panel.appendChild(resumeBtn)
    panel.appendChild(controls)
    panel.appendChild(tips)
    overlay.appendChild(panel)
    document.body.appendChild(overlay)

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            options.onResume?.()
        }
    })

    return {
        setVisible: (v) => {
            overlay.style.display = v ? 'flex' : 'none'
        },
        setViewDistance: (v) => viewSlider.setValue(v),
        setPixelRatio: (v) => pixelSlider.setValue(v),
        setShadow: (v) => shadowToggle.applyState(v),
        setWeather: (v) => weatherToggle.applyState(v)
    }
}

const pauseUI = createPauseUI({
    initialViewDistance: world.chunkManager.viewDistance,
    shadowEnabled: defaultShadowEnabled,
    onResume: () => togglePauseMenu(false),
    onViewDistanceChange: (v) => {
        world.setViewDistance(v)
        world.updateChunks(player.position, player.getForwardFlat())
    },
    onPixelRatioChange: (v) => {
        const clamped = Math.min(Math.max(v, 0.8), maxPixelRatio)
        renderer.setPixelRatio(clamped)
        renderer.setSize(window.innerWidth, window.innerHeight)
    },
    onShadowToggle: (enabled) => {
        renderer.shadowMap.enabled = enabled
        world.setShadowOptions({ cast: enabled, receive: enabled })
    },
    onWeatherToggle: (enabled) => {
        weatherActive = enabled
        weather?.setEnabled(enabled)
    }
})
pauseUI.setVisible(false)

window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
        e.preventDefault()
        if (interactor.isInventoryOpen()) {
            interactor.closeInventory()
            return
        }
        if (interactor.isMapOpen()) {
            interactor.closeMap()
            return
        }
        togglePauseMenu(!isPaused)
    }
})
