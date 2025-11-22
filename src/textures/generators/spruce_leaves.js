import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateSpruceLeaves(ctx, seed) {
    fillNoise(ctx, '#2d5a3a', '#234a2e', 0.25, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = adjustColor('#2d5a3a', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 64, 64, '#1e3d27', 100, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#3a6b47', 90, 1, seed + 2)
    addDots(ctx, 0, 0, 64, 64, '#163320', 80, 1, seed + 3)

    for (let i = 0; i < 35; i++) {
        ctx.strokeStyle = adjustColor('#163320', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        const x = rand() * 64
        const y = rand() * 64
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 8)
        ctx.stroke()
    }

    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor('#1a3421', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.4
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = '#0f2416'
        ctx.globalAlpha = 0.3
        const x = rand() * 64
        const y = rand() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
