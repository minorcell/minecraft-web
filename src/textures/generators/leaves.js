import { fillNoise, seededRandom } from '../utils.js'

export function generateLeaves(ctx, seed) {
    fillNoise(ctx, '#228b22', '#117a11', 0.3, seed)
    const rand = seededRandom(seed)
    ctx.strokeStyle = '#0f5e0f'
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 20; i++) {
        const x = rand() * 64
        const y = rand() * 64
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rand() - 0.5) * 10, y + (rand() - 0.5) * 10)
        ctx.stroke()
    }
    ctx.globalAlpha = 1.0
}
