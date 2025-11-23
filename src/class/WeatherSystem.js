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
     * @param {number} [options.dayLength] 单个昼夜循环的秒数，默认 1200s（与 MC 20 分钟一致）
     * @param {number} [options.timeScale] 时间流速倍率，默认 1
     * @param {number} [options.startTime] 初始时间（0-1，对应 0:00-24:00），默认 8:30
     */
    constructor({ scene, camera, terrain, ambientLight = null, dirLight = null, dayLength = 1200, timeScale = 1, startTime = 8.5 / 24 }) {
        this.scene = scene
        this.camera = camera
        this.terrain = terrain
        this.ambientLight = ambientLight
        this.dirLight = dirLight
        if (this.dirLight && this.scene) {
            this.scene.add(this.dirLight.target)
            if (this.dirLight.shadow) {
                this.dirLight.shadow.bias = -0.001
                this.dirLight.shadow.normalBias = 0.02
                this.dirLight.shadow.radius = 2
            }
        }

        this.stateSettings = {
            clear: {
                sky: new THREE.Color(0x87ceeb),
                fogNear: 50,
                fogFar: 300,
                ambient: 0.6,
                dir: 0.8,
                lightTint: new THREE.Color(0xffffff),
                precipitation: null,
                intensity: 0
            },
            rain: {
                sky: new THREE.Color(0x7694b8),
                fogNear: 42,
                fogFar: 200,
                ambient: 0.55,
                dir: 0.64,
                lightTint: new THREE.Color(0xd7e2f3),
                precipitation: 'rain',
                intensity: 0.65
            },
            storm: {
                sky: new THREE.Color(0x4a5d73),
                fogNear: 38,
                fogFar: 170,
                ambient: 0.5,
                dir: 0.55,
                lightTint: new THREE.Color(0xbac7da),
                precipitation: 'rain',
                intensity: 1.0
            },
            snow: {
                sky: new THREE.Color(0xdfe7f5),
                fogNear: 34,
                fogFar: 180,
                ambient: 0.68,
                dir: 0.62,
                lightTint: new THREE.Color(0xf5fbff),
                precipitation: 'snow',
                intensity: 0.75
            }
        }

        this.timeStates = {
            night: {
                sky: new THREE.Color(0x0b1633),
                fogNear: 28,
                fogFar: 160,
                ambient: 0.12,
                dir: 0.32,
                sunColor: new THREE.Color(0x9bb5ff),
                moonColor: new THREE.Color(0xcad7ff)
            },
            dawn: {
                sky: new THREE.Color(0xffc48a),
                fogNear: 40,
                fogFar: 240,
                ambient: 0.34,
                dir: 0.6,
                sunColor: new THREE.Color(0xffd59a),
                moonColor: new THREE.Color(0xcad7ff)
            },
            day: {
                sky: new THREE.Color(0x87ceeb),
                fogNear: 52,
                fogFar: 320,
                ambient: 0.62,
                dir: 0.95,
                sunColor: new THREE.Color(0xffffff),
                moonColor: new THREE.Color(0xcad7ff)
            },
            dusk: {
                sky: new THREE.Color(0xf69b8d),
                fogNear: 38,
                fogFar: 230,
                ambient: 0.36,
                dir: 0.58,
                sunColor: new THREE.Color(0xffb88f),
                moonColor: new THREE.Color(0xcad7ff)
            }
        }

        this.timeOfDay = THREE.MathUtils.clamp(startTime, 0, 1)
        this.dayLength = Math.max(1, dayLength)
        this.timeScale = timeScale
        this.skyDistance = 420
        this.sunDir = new THREE.Vector3()
        this.moonDir = new THREE.Vector3()
        this.shadowSnap = this.computeShadowSnap()

        this.currentState = 'clear'
        this.previousState = 'clear'
        this.transition = 1
        this.transitionDuration = 4
        this.stateTimer = 0
        this.stateDuration = this.randomDurationFor('clear')

        this.precipitations = {
            rain: this.createPrecipitation({
                type: 'rain',
                count: 700,
                area: 80,
                height: 35,
                size: 0.06,
                color: 0x9db8e6,
                speed: [16, 24],
                baseOpacity: 0.8
            }),
            snow: this.createPrecipitation({
                type: 'snow',
                count: 520,
                area: 70,
                height: 30,
                size: 0.18,
                color: 0xffffff,
                speed: [2.6, 4.5],
                drift: 1.4,
                baseOpacity: 0.85
            })
        }
        this.enabled = true

        this.timeCache = {
            sky: new THREE.Color(),
            sunColor: new THREE.Color(),
            moonColor: new THREE.Color()
        }
        this.colorScratch = new THREE.Color()
        this.secondaryColor = new THREE.Color()
        this.lightColorScratch = new THREE.Color()
        this.weatherLightTint = new THREE.Color()
        this.tempVec = new THREE.Vector3()
        this.label = this.createLabel()
        this.createCelestialBodies()
    }

    setPrecipitationVisibility(visible) {
        Object.values(this.precipitations || {}).forEach(p => {
            if (!p) return
            p.points.visible = visible && p.targetStrength > 0
            p.material.opacity = visible ? p.material.opacity : 0
        })
    }

    setEnabled(enabled) {
        this.enabled = !!enabled
        if (!this.enabled) {
            this.currentState = 'clear'
            this.previousState = 'clear'
            this.stateTimer = 0
            this.stateDuration = this.randomDurationFor('clear')
            this.setPrecipitationVisibility(false)
            if (this.label) {
                this.label.textContent = `时间 ${this.formatTime()} | 天气：关闭`
                this.label.style.opacity = '0.7'
            }
        }
    }

    computeShadowSnap() {
        if (!this.dirLight || !this.dirLight.shadow || !this.dirLight.shadow.camera) return 0
        const cam = this.dirLight.shadow.camera
        if (cam.right === undefined || cam.left === undefined) return 0
        const width = Math.abs(cam.right - cam.left)
        const mapSize = this.dirLight.shadow.mapSize?.width || 1024
        if (!width || !mapSize) return 0
        return width / mapSize
    }

    createCelestialBody(color, size) {
        const material = new THREE.SpriteMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        })
        const sprite = new THREE.Sprite(material)
        sprite.scale.set(size, size, size)
        sprite.visible = false
        return sprite
    }

    createCelestialBodies() {
        this.celestialGroup = new THREE.Group()
        if (this.scene) {
            this.scene.add(this.celestialGroup)
        }
        this.sunSprite = this.createCelestialBody(0xfff1c1, 34)
        this.moonSprite = this.createCelestialBody(0xdfe6ff, 26)
        this.celestialGroup.add(this.sunSprite)
        this.celestialGroup.add(this.moonSprite)

        this.moonLight = new THREE.DirectionalLight(0xcad7ff, 0)
        this.moonLight.castShadow = false
        this.moonLight.visible = true
        if (this.scene) {
            this.scene.add(this.moonLight)
            this.scene.add(this.moonLight.target)
        }
    }

    createLabel() {
        const el = document.createElement('div')
        el.id = 'weather-indicator'
        el.textContent = `时间 ${this.formatTime()} | 天气：晴朗`
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

    advanceTime(dt) {
        if (!this.dayLength || this.dayLength <= 0) return
        const delta = (dt * this.timeScale) / this.dayLength
        this.timeOfDay = (this.timeOfDay + delta) % 1
    }

    getTimePhase(t) {
        const segments = [
            { start: 0, end: 0.18, from: 'night', to: 'night' },
            { start: 0.18, end: 0.30, from: 'night', to: 'dawn' },
            { start: 0.30, end: 0.38, from: 'dawn', to: 'day' },
            { start: 0.38, end: 0.68, from: 'day', to: 'day' },
            { start: 0.68, end: 0.78, from: 'day', to: 'dusk' },
            { start: 0.78, end: 0.86, from: 'dusk', to: 'night' },
            { start: 0.86, end: 1.01, from: 'night', to: 'night' }
        ]

        for (const seg of segments) {
            if (t >= seg.start && t < seg.end) {
                const alpha = seg.from === seg.to ? 0 : THREE.MathUtils.smoothstep(t, seg.start, seg.end)
                return { from: seg.from, to: seg.to, alpha }
            }
        }
        return { from: 'night', to: 'night', alpha: 0 }
    }

    computeTimeSettings() {
        const phase = this.getTimePhase(this.timeOfDay)
        const from = this.timeStates[phase.from] || this.timeStates.day
        const to = this.timeStates[phase.to] || this.timeStates.day
        const mix = THREE.MathUtils.clamp(phase.alpha, 0, 1)

        const sky = this.timeCache.sky.copy(from.sky).lerp(to.sky, mix)
        const fogNear = THREE.MathUtils.lerp(from.fogNear, to.fogNear, mix)
        const fogFar = THREE.MathUtils.lerp(from.fogFar, to.fogFar, mix)
        const ambient = THREE.MathUtils.lerp(from.ambient, to.ambient, mix)
        const dir = THREE.MathUtils.lerp(from.dir, to.dir, mix)
        const sunColor = this.timeCache.sunColor.copy(from.sunColor).lerp(to.sunColor, mix)
        const moonColor = this.timeCache.moonColor.copy(from.moonColor).lerp(to.moonColor, mix)

        const sunAngle = (this.timeOfDay - 0.25) * Math.PI * 2
        const sunHeight = Math.sin(sunAngle)
        const sunStrength = THREE.MathUtils.clamp(sunHeight, 0, 1)
        const moonStrength = THREE.MathUtils.clamp(-sunHeight, 0, 1)

        return { sky, fogNear, fogFar, ambient, dir, sunColor, moonColor, sunStrength, moonStrength, sunAngle }
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
            table.push(['clear', 0.6], ['snow', 0.2], ['storm', 0.2])
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

    applySkyAndLight(fromState, toState, t, timeSettings) {
        const from = this.stateSettings[fromState] || this.stateSettings.clear
        const to = this.stateSettings[toState] || this.stateSettings.clear

        const weatherSky = this.secondaryColor.copy(from.sky).lerp(to.sky, t)
        const finalSky = this.colorScratch.copy(timeSettings.sky).lerp(weatherSky, 0.55)

        if (!this.scene.background) {
            this.scene.background = new THREE.Color()
        }
        this.scene.background.copy(finalSky)
        if (this.scene.fog) {
            this.scene.fog.color.copy(finalSky)
            const fogNearWeather = THREE.MathUtils.lerp(from.fogNear, to.fogNear, t)
            const fogFarWeather = THREE.MathUtils.lerp(from.fogFar, to.fogFar, t)
            this.scene.fog.near = Math.max(5, THREE.MathUtils.lerp(timeSettings.fogNear, fogNearWeather, 0.6))
            this.scene.fog.far = Math.max(this.scene.fog.near + 20, THREE.MathUtils.lerp(timeSettings.fogFar, fogFarWeather, 0.6))
        }

        const weatherAmbient = THREE.MathUtils.lerp(from.ambient, to.ambient, t)
        const weatherDir = THREE.MathUtils.lerp(from.dir, to.dir, t)
        const weatherMix = THREE.MathUtils.lerp(0.3, 0.65, timeSettings.sunStrength)

        const ambient = THREE.MathUtils.lerp(timeSettings.ambient, weatherAmbient, weatherMix)
        const dir = THREE.MathUtils.lerp(timeSettings.dir, weatherDir, weatherMix)
        const weatherLightTint = this.weatherLightTint.copy(from.lightTint).lerp(to.lightTint, t)
        const sunColor = this.lightColorScratch.copy(timeSettings.sunColor).lerp(
            weatherLightTint,
            THREE.MathUtils.lerp(0.25, 0.55, timeSettings.sunStrength)
        )

        const sunIntensity = Math.max(0, dir * timeSettings.sunStrength)
        const moonIntensity = timeSettings.moonStrength * 0.22 * (1 - weatherMix * 0.35)

        if (this.ambientLight) {
            this.ambientLight.intensity = ambient
        }
        if (this.dirLight) {
            this.dirLight.intensity = sunIntensity
            this.dirLight.color.copy(sunColor)
        }
        if (this.moonLight) {
            this.moonLight.intensity = moonIntensity
            this.moonLight.color.copy(timeSettings.moonColor)
        }

        return { sunColor, sunIntensity, moonIntensity, sky: finalSky }
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

                // world coords用于检测落地
                const worldX = anchor.x + positions[idx]
                const worldZ = anchor.z + positions[idx + 2]
                const worldY = anchor.y + positions[idx + 1]
                const groundY = this.terrain ? this.terrain.getHeight(Math.floor(worldX), Math.floor(worldZ)) + 0.5 : -Infinity

                const outOfBounds = Math.abs(positions[idx]) > half || Math.abs(positions[idx + 2]) > half
                const hitGround = Number.isFinite(groundY) ? worldY <= groundY : positions[idx + 1] < 0

                if (hitGround || outOfBounds) {
                    positions[idx] = this.randBetween(-half, half)
                    positions[idx + 1] = height
                    positions[idx + 2] = this.randBetween(-half, half)
                }
            }
            system.geometry.attributes.position.needsUpdate = true
        }
    }

    updateCelestialBodies(timeSettings, lightInfo, anchor = null) {
        const sunAngle = timeSettings.sunAngle
        this.sunDir.set(Math.cos(sunAngle), Math.sin(sunAngle), 0.35).normalize()
        this.moonDir.copy(this.sunDir).multiplyScalar(-1)

        if (this.dirLight) {
            const baseX = anchor ? anchor.x : 0
            const baseZ = anchor ? anchor.z : 0
            const snap = this.shadowSnap || 0
            let snappedX = baseX
            let snappedZ = baseZ
            if (snap > 0) {
                snappedX = Math.round(baseX / snap) * snap
                snappedZ = Math.round(baseZ / snap) * snap
            }

            this.dirLight.position.set(
                this.sunDir.x * 200 + snappedX,
                this.sunDir.y * 200 + 60,
                this.sunDir.z * 200 + snappedZ
            )
            this.dirLight.target.position.set(snappedX, 0, snappedZ)
            this.dirLight.target.updateMatrixWorld()
            this.dirLight.castShadow = timeSettings.sunStrength > 0.02
        }

        if (this.moonLight) {
            this.moonLight.position.copy(this.moonDir).multiplyScalar(180)
            this.moonLight.target.position.set(0, 0, 0)
            this.moonLight.target.updateMatrixWorld()
            this.moonLight.visible = timeSettings.moonStrength > 0.02
        }

        if (this.sunSprite) {
            const opacity = lightInfo ? Math.min(1, lightInfo.sunIntensity * 1.25) : timeSettings.sunStrength
            this.sunSprite.material.opacity = opacity
            this.sunSprite.material.color.copy(lightInfo?.sunColor || timeSettings.sunColor)
            this.sunSprite.visible = opacity > 0.02
            this.sunSprite.position.copy(this.sunDir).multiplyScalar(this.skyDistance)
        }

        if (this.moonSprite) {
            const moonOpacity = Math.min(0.85, timeSettings.moonStrength * 0.9)
            this.moonSprite.material.opacity = moonOpacity
            this.moonSprite.material.color.copy(timeSettings.moonColor)
            this.moonSprite.visible = moonOpacity > 0.02
            this.moonSprite.position.copy(this.moonDir).multiplyScalar(this.skyDistance * 0.92)
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

    updateLabel(biome, precip, timeText) {
        if (!this.label) return
        const time = timeText || this.formatTime()
        const text = this.describeWeather(this.currentState, precip.activeType, precip.activeIntensity)
        this.label.textContent = `时间 ${time} | 天气：${text}`
        this.label.style.opacity = precip.activeIntensity > 0 ? '0.95' : '0.82'
    }

    formatTime() {
        const totalMinutes = Math.floor(this.timeOfDay * 24 * 60)
        const hours = Math.floor(totalMinutes / 60) % 24
        const minutes = totalMinutes % 60
        const pad = v => (v < 10 ? `0${v}` : `${v}`)
        return `${pad(hours)}:${pad(minutes)}`
    }

    update(dt, playerPosition) {
        if (!this.enabled) {
            this.advanceTime(dt)
            const timeSettings = this.computeTimeSettings()
            const lightInfo = this.applySkyAndLight('clear', 'clear', 1, timeSettings)
            this.setPrecipitationVisibility(false)
            this.updateCelestialBodies(timeSettings, lightInfo, playerPosition)
            if (this.label) {
                this.label.textContent = `时间 ${this.formatTime()} | 天气：关闭`
                this.label.style.opacity = '0.7'
            }
            return
        }

        this.advanceTime(dt)
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

        const timeSettings = this.computeTimeSettings()
        const lightInfo = this.applySkyAndLight(this.previousState, this.currentState, this.transition, timeSettings)
        const precipBlend = this.computePrecipitationBlend(this.previousState, this.currentState, this.transition, biome)
        this.setPrecipitationTargets(precipBlend)
        this.updatePrecipitationSystems(dt, playerPosition)
        this.updateCelestialBodies(timeSettings, lightInfo, playerPosition)
        this.updateLabel(biome, precipBlend, this.formatTime())
    }
}
