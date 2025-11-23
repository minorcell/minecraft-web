import { fillNoise, adjustColor, seededRandom } from '../utils.js'

export function generateDefaultGrass(ctx, seed) {
    const rand = seededRandom(seed)

    // Base darker green
    ctx.fillStyle = '#3d8525'
    ctx.fillRect(0, 0, 32, 32)

    // Large patches - fewer
    for (let i = 0; i < 18; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 8) * 4
        const y = Math.floor(rand() * 8) * 4
        const size = 2 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    // Medium patches - fewer
    for (let i = 0; i < 22; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 10 : -8)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 16) * 2
        const y = Math.floor(rand() * 16) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Fine variation - fewer
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 8 : -8)
        ctx.globalAlpha = 0.2
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        ctx.fillRect(x, y, 1, 1)
    }

    // Yellow speckles - reduced
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = adjustColor('#d4a017', rand() > 0.5 ? 10 : -5)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = rand() > 0.7 ? 2 : 1
        ctx.fillRect(x, y, size, size)
    }

    ctx.globalAlpha = 1.0
}
