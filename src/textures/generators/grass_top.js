import { fillNoise, adjustColor, seededRandom } from '../utils.js'

export function generateGrassTop(ctx, seed) {
    fillNoise(ctx, '#55aa55', '#449944', 0.2, seed)
    const rand = seededRandom(seed)
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#55aa55', rand() > 0.5 ? 30 : -10)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }
    ctx.globalAlpha = 1.0
}
