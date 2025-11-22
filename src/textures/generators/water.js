import { seededRandom } from '../utils.js'

export function generateWater(ctx, seed, variant = 0) {
    const baseColor = '#1a5fb4'
    const highlightColor = '#3399ff'
    const deepColor = '#0d4a8a'

    const grad = ctx.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, deepColor)
    grad.addColorStop(0.3, baseColor)
    grad.addColorStop(1, highlightColor)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    const rand = seededRandom(seed)

    ctx.strokeStyle = '#4da6ff'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.4
    for (let y = 8; y < 64; y += 8) {
        ctx.beginPath()
        for (let x = 0; x <= 64; x++) {
            const wave = Math.sin((x + variant * 10) * 0.15 + rand() * 2) * 1.5
            const yy = y + wave
            if (x === 0) ctx.moveTo(x, yy)
            else ctx.lineTo(x, yy)
        }
        ctx.stroke()
    }

    ctx.strokeStyle = '#80bfff'
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    for (let offset = -32; offset < 64; offset += 12) {
        ctx.beginPath()
        for (let x = 0; x <= 64; x++) {
            const y = offset + x + Math.sin(x * 0.1 + variant * 5) * 2
            if (y >= 0 && y <= 64) {
                if (x === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
        }
        ctx.stroke()
    }

    ctx.strokeStyle = '#b3d9ff'
    ctx.globalAlpha = 0.25
    ctx.lineWidth = 0.5
    for (let x = 8; x < 64; x += 10) {
        ctx.beginPath()
        for (let y = 0; y <= 64; y++) {
            const wave = Math.sin((y + variant * 15) * 0.12) * 1.2
            const xx = x + wave
            if (y === 0) ctx.moveTo(xx, y)
            else ctx.lineTo(xx, y)
        }
        ctx.stroke()
    }

    ctx.fillStyle = '#cce6ff'
    ctx.globalAlpha = 0.6
    const sparkleCount = 3 + Math.floor(rand() * 3)
    for (let i = 0; i < sparkleCount; i++) {
        const x = rand() * 64
        const y = rand() * 64
        const size = 2 + rand() * 3
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.strokeStyle = '#e6f2ff'
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    const bubbleCount = 5 + Math.floor(rand() * 5)
    for (let i = 0; i < bubbleCount; i++) {
        const x = rand() * 64
        const y = rand() * 64
        const r = 1 + rand() * 2
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.stroke()
    }

    ctx.globalAlpha = 1.0
}
