import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateLeaves(ctx, seed) {
    fillNoise(ctx, '#3a8c3a', '#2f772f', 0.25, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = adjustColor('#3a8c3a', rand() > 0.5 ? 25 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 16) * 2
        const y = Math.floor(rand() * 16) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 32, 32, '#2a6c2a', 50, 1, seed + 1)
    addDots(ctx, 0, 0, 32, 32, '#4ea64e', 45, 1, seed + 2)
    addDots(ctx, 0, 0, 32, 32, '#1e5e1e', 40, 1, seed + 3)

    for (let i = 0; i < 15; i++) {
        ctx.strokeStyle = adjustColor('#1e5e1e', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        const x = rand() * 32
        const y = rand() * 32
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rand() - 0.5) * 4, y + (rand() - 0.5) * 4)
        ctx.stroke()
    }

    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#174a17'
        ctx.globalAlpha = 0.3
        const x = rand() * 32
        const y = rand() * 32
        const size = 1 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    ctx.globalAlpha = 1.0
}
