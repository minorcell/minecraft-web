import * as THREE from 'three'

export class TextureFactory {
    constructor() {
        // No shared canvas
    }

    createTexture(type) {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')

        switch (type) {
            case 'grass_top':
                this.fillNoise(ctx, '#55aa55', '#449944', 0.2)
                break
            case 'grass_side':
                this.fillNoise(ctx, '#885533', '#774422', 0.1) // Dirt base
                ctx.fillStyle = '#55aa55'
                ctx.fillRect(0, 0, 64, 20) // Grass top trim
                this.addNoise(ctx, 0, 0, 64, 20, '#449944', 0.2)
                break
            case 'dirt':
                this.fillNoise(ctx, '#885533', '#774422', 0.15)
                break
            case 'stone':
                this.fillNoise(ctx, '#777777', '#666666', 0.1)
                // Add cracks
                ctx.strokeStyle = '#555555'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(10, 10); ctx.lineTo(20, 20)
                ctx.moveTo(40, 40); ctx.lineTo(50, 30)
                ctx.stroke()
                break
            case 'wood_side':
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.1)
                // Streaks
                ctx.fillStyle = '#6a2400'
                for (let i = 0; i < 6; i++) {
                    ctx.fillRect(10 + i * 8, 0, 4, 64)
                }
                break
            case 'wood_top':
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.1)
                // Rings
                ctx.strokeStyle = '#6a2400'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(32, 32, 20, 0, Math.PI * 2)
                ctx.arc(32, 32, 10, 0, Math.PI * 2)
                ctx.stroke()
                break
            case 'leaves':
                this.fillNoise(ctx, '#228b22', '#117a11', 0.3)
                break
            case 'sand':
                this.fillNoise(ctx, '#eedd82', '#ddcc71', 0.1)
                break
            case 'water':
                this.fillNoise(ctx, '#0000ff', '#0000dd', 0.1)
                break
            case 'glass':
                ctx.fillStyle = '#add8e6'
                ctx.globalAlpha = 0.3
                ctx.fillRect(0, 0, 64, 64)
                ctx.globalAlpha = 1.0
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 2
                ctx.strokeRect(0, 0, 64, 64) // Frame
                ctx.beginPath()
                ctx.moveTo(10, 10); ctx.lineTo(20, 20) // Glint
                ctx.stroke()
                break
            case 'roof':
                this.fillNoise(ctx, '#a52a2a', '#941919', 0.1)
                // Bricks
                ctx.fillStyle = '#730808'
                for (let y = 0; y < 64; y += 16) {
                    ctx.fillRect(0, y, 64, 2)
                    for (let x = (y % 32 == 0 ? 0 : 16); x < 64; x += 32) {
                        ctx.fillRect(x, y, 2, 16)
                    }
                }
                break
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        texture.colorSpace = THREE.SRGBColorSpace
        return texture
    }

    fillNoise(ctx, color1, color2, factor) {
        ctx.fillStyle = color1
        ctx.fillRect(0, 0, 64, 64)
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? color2 : color1
            ctx.globalAlpha = factor
            const x = Math.floor(Math.random() * 16) * 4
            const y = Math.floor(Math.random() * 16) * 4
            ctx.fillRect(x, y, 4, 4)
        }
        ctx.globalAlpha = 1.0
    }

    addNoise(ctx, x, y, w, h, color, factor) {
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = color
            ctx.globalAlpha = factor
            const rx = x + Math.floor(Math.random() * (w / 4)) * 4
            const ry = y + Math.floor(Math.random() * (h / 4)) * 4
            ctx.fillRect(rx, ry, 4, 4)
        }
        ctx.globalAlpha = 1.0
    }
}
