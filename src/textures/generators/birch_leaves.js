import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateBirchLeaves(ctx, seed) {
    fillNoise(ctx, '#6ebf5f', '#5aa84e', 0.22, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = adjustColor('#6ebf5f', rand() > 0.5 ? 25 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 64, 64, '#5a944a', 100, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#88d477', 90, 1, seed + 2)
    addDots(ctx, 0, 0, 64, 64, '#4a7d3d', 80, 1, seed + 3)

    for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = adjustColor('#4a7d3d', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        const x = rand() * 64
        const y = rand() * 64
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 8)
        ctx.stroke()
    }

    for (let i = 0; i < 45; i++) {
        ctx.fillStyle = adjustColor('#3d6a33', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.35
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    for (let i = 0; i < 25; i++) {
        ctx.fillStyle = '#a4e090'
        ctx.globalAlpha = 0.3
        const x = rand() * 64
        const y = rand() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
