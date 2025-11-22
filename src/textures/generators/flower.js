import { fillNoise, seededRandom, addDots } from '../utils.js'

export function generateFlower(ctx, seed) {
    fillNoise(ctx, '#5faa5f', '#4f944f', 0.15, seed)

    const rand = seededRandom(seed)

    addDots(ctx, 0, 0, 64, 64, '#4f944f', 60, 1, seed + 1)

    const petals = ['#ff79b0', '#ffdd66', '#ffa347', '#ff6b9c', '#fff07a']
    for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = 0.8
        ctx.fillStyle = petals[Math.floor(rand() * petals.length)]
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    const yellowPollen = ['#fff799', '#fff955', '#ffee33']
    for (let i = 0; i < 40; i++) {
        ctx.globalAlpha = 0.9
        ctx.fillStyle = yellowPollen[Math.floor(rand() * yellowPollen.length)]
        const x = rand() * 64
        const y = rand() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = '#3a7a3a'
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
