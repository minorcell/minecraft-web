import { fillNoise, seededRandom, adjustColor } from '../utils.js'

export function generateWoodSide(ctx, seed) {
    fillNoise(ctx, '#8b4513', '#7a3402', 0.12, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 80; i++) {
        ctx.fillStyle = adjustColor('#8b4513', rand() > 0.5 ? 15 : -20)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        ctx.fillRect(x, y, 1, 1)
    }

    const streakCount = 5 + Math.floor(rand() * 3)
    for (let i = 0; i < streakCount; i++) {
        const x = 5 + i * (54 / streakCount) + rand() * 6
        ctx.fillStyle = '#6a2400'
        ctx.globalAlpha = 0.6 + rand() * 0.3
        const width = 2 + rand() * 3
        ctx.fillRect(x, 0, width, 64)

        ctx.fillStyle = '#a0602a'
        ctx.globalAlpha = 0.3
        ctx.fillRect(x + width, 0, 1, 64)
    }

    for (let i = 0; i < 15; i++) {
        const x = rand() * 64
        const y1 = rand() * 64
        const y2 = rand() * 64
        ctx.strokeStyle = '#5a1f00'
        ctx.globalAlpha = 0.4
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
    }

    ctx.globalAlpha = 1.0
}
