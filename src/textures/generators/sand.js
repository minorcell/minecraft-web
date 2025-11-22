import { fillNoise, seededRandom } from '../utils.js'

export function generateSand(ctx, seed) {
    fillNoise(ctx, '#f0d890', '#e6c570', 0.12, seed)
    const randFine = seededRandom(seed * 2 + 1)
    ctx.fillStyle = '#d4ba65'
    for (let i = 0; i < 120; i++) {
        ctx.globalAlpha = 0.15
        const x = randFine() * 64
        const y = randFine() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    const randMedium = seededRandom(seed * 3 + 2)
    ctx.fillStyle = '#c9b05a'
    for (let i = 0; i < 50; i++) {
        ctx.globalAlpha = 0.25
        const x = Math.floor(randMedium() * 32) * 2
        const y = Math.floor(randMedium() * 32) * 2
        ctx.fillRect(x, y, 1, 1)
    }

    const randCoarse = seededRandom(seed * 4 + 3)
    for (let i = 0; i < 20; i++) {
        ctx.globalAlpha = 0.3
        const x = Math.floor(randCoarse() * 16) * 4
        const y = Math.floor(randCoarse() * 16) * 4
        const size = 1 + Math.floor(randCoarse() * 2)
        ctx.fillStyle = randCoarse() > 0.5 ? '#b8a04d' : '#aa9a45'
        ctx.fillRect(x, y, size, size)
    }

    ctx.globalAlpha = 1.0
}
