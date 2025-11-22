import { fillNoise, adjustColor, seededRandom, addDots } from '../utils.js'

export function generateGrassTop(ctx, seed) {
    ctx.fillStyle = '#58a528'
    ctx.fillRect(0, 0, 64, 64)

    const rand = seededRandom(seed)

    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = adjustColor('#58a528', rand() > 0.5 ? 25 : -15)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    addDots(ctx, 0, 0, 64, 64, '#4a8c20', 80, 1, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#6fbc35', 60, 1, seed + 2)

    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = adjustColor('#8b6914', rand() > 0.5 ? 20 : -10)
        ctx.globalAlpha = 0.6
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
