import { fillNoise, addNoise, adjustColor, seededRandom } from '../utils.js'

export function generateGrassSide(ctx, seed) {
    fillNoise(ctx, '#6d4a2c', '#5a3d23', 0.1, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 80; i++) {
        ctx.fillStyle = adjustColor('#6d4a2c', rand() > 0.5 ? 15 : -20)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 16) * 4
        const y = Math.floor(rand() * 16) * 4
        ctx.fillRect(x, y, 3, 3)
    }

    ctx.fillStyle = '#4f8c1f'
    ctx.fillRect(0, 0, 64, 24)

    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = adjustColor('#4f8c1f', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 24)
        if (rand() > 0.3) {
            ctx.fillRect(x, y, 1, 1)
        } else {
            ctx.beginPath()
            ctx.arc(x, y, 1, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    for (let i = 0; i < 15; i++) {
        const x = rand() * 64
        const bladeHeight = 2 + rand() * 4
        ctx.strokeStyle = adjustColor('#4f8c1f', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.7
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, 24)
        ctx.lineTo(x + (rand() - 0.5) * 2, 24 - bladeHeight)
        ctx.stroke()
    }

    ctx.globalAlpha = 1.0
}
