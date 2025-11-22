import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateJungleLeaves(ctx, seed) {
    fillNoise(ctx, '#3f9c4a', '#33873d', 0.23, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 130; i++) {
        ctx.fillStyle = adjustColor('#3f9c4a', rand() > 0.5 ? 25 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 64, 64, '#2d7035', 110, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#57b965', 100, 1, seed + 2)
    addDots(ctx, 0, 0, 64, 64, '#22552a', 90, 1, seed + 3)

    for (let i = 0; i < 35; i++) {
        ctx.strokeStyle = adjustColor('#22552a', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        const x = rand() * 64
        const y = rand() * 64
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rand() - 0.5) * 10, y + (rand() - 0.5) * 10)
        ctx.stroke()
    }

    for (let i = 0; i < 55; i++) {
        ctx.fillStyle = adjustColor('#1e4723', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.4
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = '#2a8a3a'
        ctx.globalAlpha = 0.35
        const x = rand() * 64
        const y = rand() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
