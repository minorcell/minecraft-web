import { fillNoise, seededRandom } from '../utils.js'

export function generateCactus(ctx, seed) {
    fillNoise(ctx, '#3b8c3b', '#2f7a2f', 0.12, seed)
    const rand = seededRandom(seed)
    ctx.fillStyle = '#2a6a2a'
    for (let i = 0; i < 6; i++) {
        const x = 8 + i * 8 + rand() * 3
        ctx.globalAlpha = 0.6
        ctx.fillRect(x, 0, 2, 64)
    }
    ctx.fillStyle = '#d8e4c0'
    for (let i = 0; i < 80; i++) {
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        ctx.fillRect(x, y, 1, 1)
    }
    ctx.globalAlpha = 1.0
}
