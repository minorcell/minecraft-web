import * as THREE from 'three'

/**
 * 简易天气系统：在玩家附近生成降雨/降雪粒子，并平滑调整天空色与雾、灯光
 */
export class WeatherSystem {
    /**
     * @param {object} options
     * @param {THREE.Scene} options.scene
     * @param {THREE.Camera} options.camera
     * @param {import('./Terrain.js').Terrain} options.terrain
     * @param {THREE.AmbientLight} [options.ambientLight]
     * @param {THREE.DirectionalLight} [options.dirLight]
     */
    constructor({ scene, camera, terrain, ambientLight = null, dirLight = null }) {
        this.scene = scene
        this.camera = camera
        this.terrain = terrain
        this.ambientLight = ambientLight
        this.dirLight = dirLight

        this.stateSettings = {
            clear: {
                sky: new THREE.Color(0x87ceeb),
                fogNear: 50,
                fogFar: 300,
                ambient: 0.6,
                dir: 0.8,
                precipitation: null,
                intensity: 0
            },
            rain: {
                sky: new THREE.Color(0x7694b8),
                fogNear: 42,
                fogFar: 200,
                ambient: 0.55,
                dir: 0.64,
                precipitation: 'rain',
                intensity: 0.65
            },
            storm: {
                sky: new THREE.Color(0x4a5d73),
                fogNear: 38,
                fogFar: 170,
                ambient: 0.5,
                dir: 0.55,
                precipitation: 'rain',
                intensity: 1.0
            },
            snow: {
                sky: new THREE.Color(0xdfe7f5),
                fogNear: 34,
                fogFar: 180,
                ambient: 0.68,
                dir: 0.62,
                precipitation: 'snow',
                intensity: 0.75
            }
        }

        this.currentState = 'clear'
        this.previousState = 'clear'
        this.transition = 1
        this.transitionDuration = 4
        this.stateTimer = 0
        this.stateDuration = this.randomDurationFor('clear')

        this.precipitations = {
            rain: this.createPrecipitation({
                type: 'rain',
                count: 1800,
                area: 80,
                height: 35,
                size: 0.06,
                color: 0x9db8e6,
                speed: [18, 28],
                baseOpacity: 0.9
            }),
            snow: this.createPrecipitation({
                type: 'snow',
                count: 1400,
                area: 70,
                height: 30,
                size: 0.2,
                color: 0xffffff,
                speed: [3, 6],
                drift: 2.0,
                baseOpacity: 0.85
            })
        }

        this.colorScratch = new THREE.Color()
        this.tempVec = new THREE.Vector3()
        this.label = this.createLabel()
    }

    createLabel() {
        const el = document.createElement('div')
        el.id = 'weather-indicator'
        el.textContent = '天气：晴朗'
        document.body.appendChild(el)
        return el
    }

    randBetween(min, max) {
        return min + Math.random() * (max - min)
    }

    randomDurationFor(state) {
        switch (state) {
            case 'storm': return this.randBetween(35, 70)
            case 'rain': return this.randBetween(45, 80)
            case 'snow': return this.randBetween(60, 90)
            default: return this.randBetween(70, 120)
        }
    }

    createPrecipitation(options) {
        const { type, count, area, height, size, color, speed, drift = 0, baseOpacity = 1 } = options
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        const speeds = new Float32Array(count)
        const swayX = new Float32Array(count)
        const swayZ = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            positions[i * 3] = this.randBetween(-area * 0.5, area * 0.5)
            positions[i * 3 + 1] = Math.random() * height
            positions[i * 3 + 2] = this.randBetween(-area * 0.5, area * 0.5)
            speeds[i] = this.randBetween(speed[0], speed[1])
            swayX[i] = drift ? this.randBetween(-drift, drift) : 0
            swayZ[i] = drift ? this.randBetween(-drift, drift) : 0
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const material = new THREE.PointsMaterial({
            size,
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false
        })
        const points = new THREE.Points(geometry, material)
        points.frustumCulled = false
        points.visible = false
        this.scene.add(points)

        return {
            type,
            points,
            geometry,
            material,
            positions,
            speeds,
            swayX,
            swayZ,
            area,
            height,
            baseOpacity,
            strength: 0,
            targetStrength: 0
        }
    }

    getBiomeName(position) {
        if (!this.terrain) return 'plains'
        const biome = this.terrain.getBiome(Math.floor(position.x), Math.floor(position.z))
        return biome?.name || 'plains'
    }

    chooseNextState(biome) {
        const table = []
        if (biome === 'desert' || biome === 'beach') {
            table.push(['clear', 0.7], ['rain', 0.2], ['storm', 0.1])
        } else if (biome === 'snow' || biome === 'taiga') {
            table.push(['clear', 0.35], ['snow', 0.45], ['storm', 0.2])
        } else {
            table.push(['clear', 0.45], ['rain', 0.35], ['storm', 0.15], ['snow', 0.05])
        }

        const total = table.reduce((sum, [, w]) => sum + w, 0)
        let roll = Math.random() * total
        for (const [state, weight] of table) {
            roll -= weight
            if (roll <= 0) return state
        }
        return 'clear'
    }

    resolvePrecipitationType(state, biome) {
        const setting = this.stateSettings[state] || this.stateSettings.clear
        if (!setting.precipitation) return null
        if (setting.precipitation === 'rain' && (biome === 'snow' || biome === 'taiga')) {
            return 'snow'
        }
        return setting.precipitation
    }

    beginTransition(nextState) {
        if (nextState === this.currentState) {
            this.stateTimer = 0
            this.stateDuration = this.randomDurationFor(nextState)
            return
        }
        this.previousState = this.currentState
        this.currentState = nextState
        this.transition = 0
        this.stateTimer = 0
        this.stateDuration = this.randomDurationFor(nextState)
    }

    applySkyAndLight(fromState, toState, t) {
        const from = this.stateSettings[fromState] || this.stateSettings.clear
        const to = this.stateSettings[toState] || this.stateSettings.clear

        const sky = this.colorScratch.copy(from.sky).lerp(to.sky, t)
        if (!this.scene.background) {
            this.scene.background = new THREE.Color()
        }
        this.scene.background.copy(sky)
        if (this.scene.fog) {
            this.scene.fog.color.copy(sky)
            this.scene.fog.near = THREE.MathUtils.lerp(from.fogNear, to.fogNear, t)
            this.scene.fog.far = THREE.MathUtils.lerp(from.fogFar, to.fogFar, t)
        }

        if (this.ambientLight) {
            this.ambientLight.intensity = THREE.MathUtils.lerp(from.ambient, to.ambient, t)
        }
        if (this.dirLight) {
            this.dirLight.intensity = THREE.MathUtils.lerp(from.dir, to.dir, t)
        }
    }

    computePrecipitationBlend(fromState, toState, t, biome) {
        const intensities = { rain: 0, snow: 0 }
        const fromType = this.resolvePrecipitationType(fromState, biome)
        const toType = this.resolvePrecipitationType(toState, biome)
        const fromIntensity = (this.stateSettings[fromState] || this.stateSettings.clear).intensity
        const toIntensity = (this.stateSettings[toState] || this.stateSettings.clear).intensity

        if (fromType) {
            intensities[fromType] += fromIntensity * (1 - t)
        }
        if (toType) {
            intensities[toType] += toIntensity * t
        }

        const activeType = intensities.snow > intensities.rain
            ? (intensities.snow > 0 ? 'snow' : null)
            : (intensities.rain > 0 ? 'rain' : null)
        const activeIntensity = activeType ? intensities[activeType] : 0

        return { intensities, activeType, activeIntensity }
    }

    setPrecipitationTargets(intensityMap) {
        for (const key of Object.keys(this.precipitations)) {
            const system = this.precipitations[key]
            const target = intensityMap.intensities[key] || 0
            system.targetStrength = Math.min(1, target)
        }
    }

    updatePrecipitationSystems(dt, playerPosition) {
        const anchor = playerPosition || this.tempVec.set(0, 0, 0)
        for (const system of Object.values(this.precipitations)) {
            const lerpFactor = Math.min(1, dt * 3.2)
            system.strength = THREE.MathUtils.lerp(system.strength, system.targetStrength, lerpFactor)

            system.points.visible = system.strength > 0.02
            system.material.opacity = system.baseOpacity * system.strength
            if (!system.points.visible) continue

            system.points.position.set(anchor.x, anchor.y, anchor.z)
            const { positions, speeds, swayX, swayZ, area, height } = system
            const half = area * 0.5

            for (let i = 0; i < speeds.length; i++) {
                const idx = i * 3
                positions[idx + 1] -= speeds[i] * dt
                if (swayX[i] !== 0 || swayZ[i] !== 0) {
                    positions[idx] += swayX[i] * dt
                    positions[idx + 2] += swayZ[i] * dt * 0.35
                }

                if (positions[idx + 1] < -5 || Math.abs(positions[idx]) > half || Math.abs(positions[idx + 2]) > half) {
                    positions[idx] = this.randBetween(-half, half)
                    positions[idx + 1] = height
                    positions[idx + 2] = this.randBetween(-half, half)
                }
            }
            system.geometry.attributes.position.needsUpdate = true
        }
    }

    describeWeather(state, precipType, intensity) {
        if (!precipType || intensity < 0.05) return '晴朗'
        if (precipType === 'snow') {
            return intensity > 0.8 ? '暴雪' : '飘雪'
        }
        if (state === 'storm' || intensity > 0.85) {
            return '暴雨'
        }
        return '小雨'
    }

    updateLabel(biome, precip) {
        if (!this.label) return
        const text = this.describeWeather(this.currentState, precip.activeType, precip.activeIntensity)
        this.label.textContent = `天气：${text}`
        this.label.style.opacity = precip.activeIntensity > 0 ? '0.95' : '0.8'
    }

    update(dt, playerPosition) {
        const biome = this.getBiomeName(playerPosition || this.tempVec.set(0, 0, 0))
        this.stateTimer += dt
        if (this.stateTimer >= this.stateDuration) {
            const next = this.chooseNextState(biome)
            this.beginTransition(next)
        }

        if (this.transition < 1) {
            this.transition = Math.min(1, this.transition + dt / this.transitionDuration)
            if (this.transition === 1) {
                this.previousState = this.currentState
            }
        }

        this.applySkyAndLight(this.previousState, this.currentState, this.transition)
        const precipBlend = this.computePrecipitationBlend(this.previousState, this.currentState, this.transition, biome)
        this.setPrecipitationTargets(precipBlend)
        this.updatePrecipitationSystems(dt, playerPosition)
        this.updateLabel(biome, precipBlend)
    }
}
