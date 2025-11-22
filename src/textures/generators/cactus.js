import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateCactus(ctx, seed) {
    fillNoise(ctx, '#3e9c3e', '#2e8c2e', 0.15, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = adjustColor('#3e9c3e', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    addDots(ctx, 0, 0, 64, 64, '#2a7a2a', 80, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#4eb24e', 70, 1, seed + 2)

    ctx.fillStyle = '#2f7d2f'
    const ribCount = 5 + Math.floor(rand() * 2)
    for (let i = 0; i < ribCount; i++) {
        const x = 8 + i * (48 / ribCount) + rand() * 4
        ctx.globalAlpha = 0.7
        const width = 2 + rand() * 2
        ctx.fillRect(x, 0, width, 64)
    }

    for (let i = 0; i < 15; i++) {
        const x = rand() * 64
        const y1 = rand() * 64
        const y2 = rand() * 64
        ctx.strokeStyle = '#1f5d1f'
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
    }

    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = '#dce8c8'
        ctx.globalAlpha = 0.5
        const x = rand() * 64
        const y = rand() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
