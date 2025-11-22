import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateStone(ctx, seed) {
    fillNoise(ctx, '#7d7d7d', '#6d6d6d', 0.12, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = adjustColor('#7d7d7d', rand() > 0.5 ? 20 : -30)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 1 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 64, 64, '#5f5f5f', 70, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#8e8e8e', 60, 1, seed + 2)

    ctx.strokeStyle = '#4a4a4a'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.6
    const crackCount = 2 + Math.floor(rand() * 2)
    for (let c = 0; c < crackCount; c++) {
        let x = rand() * 60 + 2
        let y = rand() * 60 + 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        const segments = 8
        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 12
            y += (rand() - 0.5) * 12
            x = Math.max(2, Math.min(62, x))
            y = Math.max(2, Math.min(62, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()

        if (rand() > 0.5) {
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + (rand() - 0.5) * 10, y + (rand() - 0.5) * 10)
            ctx.stroke()
        }
    }

    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#3d3d3d'
        ctx.globalAlpha = 0.4
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    ctx.globalAlpha = 1.0
}
