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

    ctx.globalAlpha = 1.0
}

export function generateWaterStill(ctx, seed, variant = 0) {
    const baseColor = '#1a5fb4'
    const deepColor = '#0d4a8a'

    const grad = ctx.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, deepColor)
    grad.addColorStop(1, baseColor)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
}
