import { fillNoise, seededRandom, addDots } from '../utils.js'

export function generateDirt(ctx, seed) {
    fillNoise(ctx, '#8a5a34', '#7a4a2c', 0.15, seed)

    const rand = seededRandom(seed)

    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#8a5a34', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 8) * 4
        const y = Math.floor(rand() * 8) * 4
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    addDots(ctx, 0, 0, 32, 32, '#5c3a20', 50, 1, seed + 1)
    addDots(ctx, 0, 0, 32, 32, '#9a6a44', 40, 1, seed + 2)

    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = '#4a2e18'
        ctx.globalAlpha = 0.3
        const x = rand() * 32
        const y = rand() * 32
        const size = 1 + rand() * 2
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
