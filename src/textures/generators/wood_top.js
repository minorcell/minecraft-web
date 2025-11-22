import { fillNoise, seededRandom } from '../utils.js'

export function generateWoodTop(ctx, seed) {
    fillNoise(ctx, '#8b4513', '#7a3402', 0.1, seed)
    const rand = seededRandom(seed)
    ctx.strokeStyle = '#6a2400'
    ctx.lineWidth = 2
    const ringCount = 3 + Math.floor(rand() * 3)
    for (let i = 0; i < ringCount; i++) {
        const radius = 15 + i * 5 + rand() * 5
        ctx.beginPath()
        ctx.arc(32 + (rand() - 0.5) * 10, 32 + (rand() - 0.5) * 10, radius, 0, Math.PI * 2)
        ctx.stroke()
    }
}
