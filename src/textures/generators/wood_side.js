import { fillNoise, seededRandom } from '../utils.js'

export function generateWoodSide(ctx, seed) {
    fillNoise(ctx, '#8b4513', '#7a3402', 0.1, seed)
    const rand = seededRandom(seed)
    ctx.fillStyle = '#6a2400'
    const streakCount = 4 + Math.floor(rand() * 4)
    for (let i = 0; i < streakCount; i++) {
        const x = 5 + i * (50 / streakCount) + rand() * 5
        ctx.globalAlpha = 0.8
        ctx.fillRect(x, 0, 2 + rand() * 3, 64)
    }
    ctx.globalAlpha = 1.0
}
