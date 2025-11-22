import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateLeaves(ctx, seed) {
    fillNoise(ctx, '#3a8c3a', '#2f772f', 0.25, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = adjustColor('#3a8c3a', rand() > 0.5 ? 25 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 64, 64, '#2a6c2a', 100, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#4ea64e', 90, 1, seed + 2)
    addDots(ctx, 0, 0, 64, 64, '#1e5e1e', 80, 1, seed + 3)

    for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = adjustColor('#1e5e1e', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        const x = rand() * 64
        const y = rand() * 64
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 8)
        ctx.stroke()
    }

    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = '#174a17'
        ctx.globalAlpha = 0.3
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    ctx.globalAlpha = 1.0
}
