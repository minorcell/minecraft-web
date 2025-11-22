import { fillNoise, seededRandom } from '../utils.js'

export function generateFlower(ctx, seed) {
    fillNoise(ctx, '#5ea15e', '#4f8f4f', 0.15, seed)
    const rand = seededRandom(seed)
    const petals = ['#ff7eb6', '#ffd966', '#ffb347']
    for (let i = 0; i < 40; i++) {
        ctx.globalAlpha = 0.8
        ctx.fillStyle = petals[Math.floor(rand() * petals.length)]
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        ctx.fillRect(x, y, 2, 2)
    }
    ctx.globalAlpha = 1.0
}
