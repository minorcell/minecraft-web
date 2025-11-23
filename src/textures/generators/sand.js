import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateSand(ctx, seed) {
    fillNoise(ctx, '#e8d6a8', '#dcc896', 0.12, seed)

    const randFine = seededRandom(seed * 2 + 1)
    addDots(ctx, 0, 0, 32, 32, '#d4c28e', 75, 1, seed + 1)

    const randMedium = seededRandom(seed * 3 + 2)
    ctx.fillStyle = '#c9b178'
    for (let i = 0; i < 40; i++) {
        ctx.globalAlpha = 0.3
        const x = Math.floor(randMedium() * 16) * 2
        const y = Math.floor(randMedium() * 16) * 2
        const size = 1 + Math.floor(randMedium() * 2)
        ctx.fillRect(x, y, size, size)
    }

    const randCoarse = seededRandom(seed * 4 + 3)
    ctx.fillStyle = '#bda066'
    for (let i = 0; i < 20; i++) {
        ctx.globalAlpha = 0.35
        const x = Math.floor(randCoarse() * 8) * 4
        const y = Math.floor(randCoarse() * 8) * 4
        const size = 1 + Math.floor(randCoarse() * 2)
        ctx.fillRect(x, y, size, size)
    }

    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = adjustColor('#bda066', randCoarse() > 0.5 ? 15 : -20)
        ctx.globalAlpha = 0.4
        const x = randCoarse() * 32
        const y = randCoarse() * 32
        const size = 1 + randCoarse() * 2
        ctx.fillRect(x, y, size, size)
    }

    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = adjustColor('#e8d6a8', randFine() > 0.5 ? 20 : -30)
        ctx.globalAlpha = 0.25
        const x = randFine() * 32
        const y = randFine() * 32
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
