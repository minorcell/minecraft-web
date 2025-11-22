import { fillNoise, seededRandom, adjustColor } from '../utils.js'

export function generateWoodTop(ctx, seed) {
    fillNoise(ctx, '#a0662a', '#8b4513', 0.1, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = adjustColor('#a0662a', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    const centerX = 32 + (rand() - 0.5) * 6
    const centerY = 32 + (rand() - 0.5) * 6

    ctx.strokeStyle = '#6a2400'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 5; i++) {
        const radius = 4 + i * 4 + rand() * 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()
    }

    ctx.strokeStyle = '#8b4513'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 8; i++) {
        const radius = 2 + i * 3 + rand() * 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()
    }

    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = '#5a1f00'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        const angle1 = rand() * Math.PI * 2
        const angle2 = angle1 + (0.5 + rand() * 0.5)
        ctx.arc(centerX, centerY, 8 + rand() * 15, angle1, angle2)
        ctx.stroke()
    }

    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = adjustColor('#a0662a', rand() > 0.5 ? 30 : -40)
        ctx.globalAlpha = 0.5
        const x = rand() * 64
        const y = rand() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
