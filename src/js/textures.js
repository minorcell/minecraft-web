import * as THREE from 'three'

export class TextureFactory {
    constructor() {
        // Cache for textures by type and variant
        this.textureCache = {}
        this.variants = 4 // Number of texture variants per type
    }

    createTexture(type, variant = 0) {
        const key = `${type}_${variant}`
        if (this.textureCache[key]) {
            return this.textureCache[key]
        }

        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        const seed = variant / this.variants // Use variant as seed

        switch (type) {
            case 'grass_top':
                this.fillNoise(ctx, '#55aa55', '#449944', 0.2, seed)
                // Add grass details
                const rand0 = this.seededRandom(seed)
                for (let i = 0; i < 30; i++) {
                    ctx.fillStyle = this.adjustColor('#55aa55', rand0() > 0.5 ? 30 : -10)
                    ctx.globalAlpha = 0.3
                    const x = Math.floor(rand0() * 32) * 2
                    const y = Math.floor(rand0() * 32) * 2
                    ctx.fillRect(x, y, 2, 2)
                }
                ctx.globalAlpha = 1.0
                break

            case 'grass_side':
                // Dirt base with more variation
                this.fillNoise(ctx, '#885533', '#774422', 0.1, seed)
                // Grass trim on top
                ctx.fillStyle = this.adjustColor('#55aa55', 10)
                ctx.fillRect(0, 0, 64, 20)
                this.addNoise(ctx, 0, 0, 64, 20, '#449944', 0.2, seed)
                break

            case 'dirt':
                this.fillNoise(ctx, '#885533', '#774422', 0.15, seed)
                // Add small stones
                let random = this.seededRandom(seed)
                ctx.fillStyle = '#553322'
                for (let i = 0; i < 15; i++) {
                    ctx.globalAlpha = 0.4
                    const x = Math.floor(random() * 16) * 4
                    const y = Math.floor(random() * 16) * 4
                    ctx.fillRect(x, y, 3, 3)
                }
                ctx.globalAlpha = 1.0
                break

            case 'stone':
                this.fillNoise(ctx, '#777777', '#666666', 0.1, seed)
                // Enhanced cracks with variant-based positions
                const rand1 = this.seededRandom(seed)
                ctx.strokeStyle = this.adjustColor('#555555', rand1() > 0.5 ? 20 : -20)
                ctx.lineWidth = 2
                ctx.beginPath()
                const crackCount = 3 + Math.floor(rand1() * 3)
                for (let c = 0; c < crackCount; c++) {
                    let x = rand1() * 60 + 2
                    let y = rand1() * 60 + 2
                    ctx.moveTo(x, y)
                    const segments = 5
                    for (let s = 0; s < segments; s++) {
                        x += (rand1() - 0.5) * 15
                        y += (rand1() - 0.5) * 15
                        ctx.lineTo(x, y)
                    }
                }
                ctx.stroke()
                break

            case 'wood_side':
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.1, seed)
                // Variable wood streaks
                const rand2 = this.seededRandom(seed)
                ctx.fillStyle = '#6a2400'
                const streakCount = 4 + Math.floor(rand2() * 4)
                for (let i = 0; i < streakCount; i++) {
                    const x = 5 + i * (50 / streakCount) + rand2() * 5
                    ctx.globalAlpha = 0.8
                    ctx.fillRect(x, 0, 2 + rand2() * 3, 64)
                }
                ctx.globalAlpha = 1.0
                break

            case 'wood_top':
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.1, seed)
                // Variant-based rings
                const rand3 = this.seededRandom(seed)
                ctx.strokeStyle = '#6a2400'
                ctx.lineWidth = 2
                const ringCount = 3 + Math.floor(rand3() * 3)
                for (let i = 0; i < ringCount; i++) {
                    const radius = 15 + i * 5 + rand3() * 5
                    ctx.beginPath()
                    ctx.arc(32 + (rand3() - 0.5) * 10, 32 + (rand3() - 0.5) * 10, radius, 0, Math.PI * 2)
                    ctx.stroke()
                }
                break

            case 'leaves':
                this.fillNoise(ctx, '#228b22', '#117a11', 0.3, seed)
                // Add leaf veins
                const rand4 = this.seededRandom(seed)
                ctx.strokeStyle = '#0f5e0f'
                ctx.globalAlpha = 0.5
                for (let i = 0; i < 20; i++) {
                    const x = rand4() * 64
                    const y = rand4() * 64
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + (rand4() - 0.5) * 10, y + (rand4() - 0.5) * 10)
                    ctx.stroke()
                }
                ctx.globalAlpha = 1.0
                break

            case 'sand':
                this.fillNoise(ctx, '#eedd82', '#ddcc71', 0.1, seed)
                // Sand grain details
                const rand5 = this.seededRandom(seed)
                ctx.fillStyle = '#ccbb61'
                for (let i = 0; i < 100; i++) {
                    ctx.globalAlpha = 0.3
                    const x = Math.floor(rand5() * 64)
                    const y = Math.floor(rand5() * 64)
                    ctx.fillRect(x, y, 1, 1)
                }
                ctx.globalAlpha = 1.0
                break

            case 'water':
                // Deeper water color for better underwater effect
                ctx.fillStyle = '#2277dd'
                ctx.fillRect(0, 0, 64, 64)
                break

            case 'snow':
                this.fillNoise(ctx, '#f4f7fb', '#e8eff7', 0.08, seed)
                // 轻微的阴影
                const randSnow = this.seededRandom(seed)
                ctx.fillStyle = '#dce5f2'
                for (let i = 0; i < 40; i++) {
                    ctx.globalAlpha = 0.15
                    const x = Math.floor(randSnow() * 64)
                    const y = Math.floor(randSnow() * 64)
                    ctx.fillRect(x, y, 2, 2)
                }
                ctx.globalAlpha = 1.0
                break

            case 'cactus':
                this.fillNoise(ctx, '#3b8c3b', '#2f7a2f', 0.12, seed)
                // 竖向纹理
                const randCac = this.seededRandom(seed)
                ctx.fillStyle = '#2a6a2a'
                for (let i = 0; i < 6; i++) {
                    const x = 8 + i * 8 + randCac() * 3
                    ctx.globalAlpha = 0.6
                    ctx.fillRect(x, 0, 2, 64)
                }
                // 刺点
                ctx.fillStyle = '#d8e4c0'
                for (let i = 0; i < 80; i++) {
                    ctx.globalAlpha = 0.4
                    const x = Math.floor(randCac() * 64)
                    const y = Math.floor(randCac() * 64)
                    ctx.fillRect(x, y, 1, 1)
                }
                ctx.globalAlpha = 1.0
                break

            case 'flower':
                this.fillNoise(ctx, '#5ea15e', '#4f8f4f', 0.15, seed)
                // 花点
                const randFl = this.seededRandom(seed)
                const petals = ['#ff7eb6', '#ffd966', '#ffb347']
                for (let i = 0; i < 40; i++) {
                    ctx.globalAlpha = 0.8
                    ctx.fillStyle = petals[Math.floor(randFl() * petals.length)]
                    const x = Math.floor(randFl() * 64)
                    const y = Math.floor(randFl() * 64)
                    ctx.fillRect(x, y, 2, 2)
                }
                ctx.globalAlpha = 1.0
                break

            case 'glass':
                ctx.fillStyle = '#add8e6'
                ctx.globalAlpha = 0.3
                ctx.fillRect(0, 0, 64, 64)
                ctx.globalAlpha = 1.0
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 2
                ctx.strokeRect(0, 0, 64, 64)
                // Variant glint
                const rand7 = this.seededRandom(seed)
                ctx.beginPath()
                const glintX = 10 + rand7() * 20
                const glintY = 10 + rand7() * 20
                ctx.moveTo(glintX, glintY)
                ctx.lineTo(glintX + 10, glintY + 10)
                ctx.stroke()
                break

            case 'roof':
                this.fillNoise(ctx, '#a52a2a', '#941919', 0.1, seed)
                // Enhanced bricks
                const rand8 = this.seededRandom(seed)
                ctx.fillStyle = '#730808'
                const brickOffset = rand8() > 0.5 ? 0 : 16
                for (let y = 0; y < 64; y += 16) {
                    ctx.fillRect(0, y, 64, 2)
                    for (let x = brickOffset; x < 64; x += 32) {
                        ctx.fillRect(x, y, 2, 16)
                    }
                }
                break
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        texture.colorSpace = THREE.SRGBColorSpace

        // Cache the texture
        this.textureCache[key] = texture

        return texture
    }

    fillNoise(ctx, color1, color2, factor, seed = 0) {
        // Base fill
        ctx.fillStyle = color1
        ctx.fillRect(0, 0, 64, 64)

        // Use seed-based randomness for consistent variants
        let random = this.seededRandom(seed)
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = random() > 0.5 ? color2 : color1
            ctx.globalAlpha = factor
            const x = Math.floor(random() * 16) * 4
            const y = Math.floor(random() * 16) * 4
            ctx.fillRect(x, y, 4, 4)
        }

        // Add extra details based on color intensity
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = this.adjustColor(color1, random() > 0.5 ? -20 : 20)
            ctx.globalAlpha = factor * 0.5
            const x = Math.floor(random() * 32) * 2
            const y = Math.floor(random() * 32) * 2
            ctx.fillRect(x, y, 2, 2)
        }

        ctx.globalAlpha = 1.0
    }

    addNoise(ctx, x, y, w, h, color, factor, seed = 0) {
        let random = this.seededRandom(seed)
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = color
            ctx.globalAlpha = factor
            const rx = x + Math.floor(random() * (w / 4)) * 4
            const ry = y + Math.floor(random() * (h / 4)) * 4
            ctx.fillRect(rx, ry, 4, 4)
        }
        ctx.globalAlpha = 1.0
    }

    seededRandom(seed) {
        // Simple seeded random number generator
        let value = seed * 1000 + 1
        return function() {
            value = (value * 9301 + 49297) % 233280
            return value / 233280
        }
    }

    adjustColor(color, amount) {
        // Adjust hex color brightness
        const num = parseInt(color.replace('#', ''), 16)
        const r = Math.max(0, Math.min(255, (num >> 16) + amount))
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
    }
}
