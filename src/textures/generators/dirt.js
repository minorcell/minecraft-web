import { fillNoise, seededRandom, addDots } from '../utils.js'

export function generateDirt(ctx, seed) {
    fillNoise(ctx, '#8a5a34', '#7a4a2c', 0.15, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = adjustColor('#8a5a34', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 16) * 4
        const y = Math.floor(rand() * 16) * 4
        const size = 2 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 64, 64, '#5c3a20', 100, 1.5, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#9a6a44', 80, 1, seed + 2)

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = '#4a2e18'
        ctx.globalAlpha = 0.3
        const x = rand() * 64
        const y = rand() * 64
        const size = 2 + rand() * 3
        ctx.fillRect(x, y, size, size)
    }

    ctx.globalAlpha = 1.0
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
}
