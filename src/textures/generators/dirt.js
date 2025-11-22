import { fillNoise, seededRandom } from '../utils.js'

export function generateDirt(ctx, seed) {
    fillNoise(ctx, '#885533', '#774422', 0.15, seed)
    const rand = seededRandom(seed)
    ctx.fillStyle = '#553322'
    for (let i = 0; i < 15; i++) {
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 16) * 4
        const y = Math.floor(rand() * 16) * 4
        ctx.fillRect(x, y, 3, 3)
    }
    ctx.globalAlpha = 1.0
}
