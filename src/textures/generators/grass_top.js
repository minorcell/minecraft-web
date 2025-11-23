import { fillNoise, adjustColor, seededRandom, addDots } from '../utils.js'

export function generateGrassTop(ctx, seed) {
    // Base darker green
    ctx.fillStyle = '#3d8525'
    ctx.fillRect(0, 0, 64, 64)

    const rand = seededRandom(seed)

    // Large patches - fewer and less variation
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 16) * 4
        const y = Math.floor(rand() * 16) * 4
        const size = 4 + Math.floor(rand() * 8)
        ctx.fillRect(x, y, size, size)
    }

    // Medium patches - fewer
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 10 : -8)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 2 + Math.floor(rand() * 4)
        ctx.fillRect(x, y, size, size)
    }

    // Small fine-grained variation - fewer
    for (let i = 0; i < 80; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 8 : -8)
        ctx.globalAlpha = 0.2
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        ctx.fillRect(x, y, 1, 1)
    }

    // Yellow/brown speckles - reduced
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = adjustColor('#d4a017', rand() > 0.5 ? 10 : -5)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = rand() > 0.7 ? 2 : 1
        ctx.fillRect(x, y, size, size)
    }

    // Extra yellow patches - removed

    // Dark patches for depth - reduced
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#2d6520', rand() > 0.5 ? 10 : -8)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Light green speckles - reduced
    addDots(ctx, 0, 0, 64, 64, '#4a8c20', 40, 1, seed + 1)

    ctx.globalAlpha = 1.0
}
