import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateRoof(ctx, seed) {
    fillNoise(ctx, '#b2352d', '#a12b25', 0.12, seed)

    const randRoof = seededRandom(seed * 2 + 1)
    const randDetail = seededRandom(seed * 3 + 2)

    ctx.fillStyle = '#8c1e1a'
    const brickOffset = randRoof() > 0.5 ? 0 : 16
    for (let y = 0; y < 64; y += 16) {
        ctx.globalAlpha = 0.8
        ctx.fillRect(0, y, 64, 2)
    }
    for (let x = brickOffset; x < 64; x += 32) {
        ctx.globalAlpha = 0.7
        ctx.fillRect(x, 0, 2, 64)
    }

    for (let y = 0; y < 64; y += 16) {
        for (let x = brickOffset; x < 64; x += 32) {
            const centerX = x + 8
            const centerY = y + 8
            const gradient = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 10)
            gradient.addColorStop(0, 'rgba(255,255,255,0.2)')
            gradient.addColorStop(1, 'rgba(0,0,0,0.2)')
            ctx.globalAlpha = 0.9
            ctx.fillStyle = gradient
            ctx.fillRect(x, y, 16, 16)
        }
    }

    addDots(ctx, 0, 0, 64, 64, '#7a1714', 80, 1.5, seed + 4)

    for (let i = 0; i < 80; i++) {
        ctx.fillStyle = adjustColor('#b2352d', randDetail() > 0.5 ? 20 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(randDetail() * 32) * 2
        const y = Math.floor(randDetail() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    for (let i = 0; i < 15; i++) {
        const x = randDetail() * 64
        const y = randDetail() * 64
        const size = 1 + randDetail() * 3
        ctx.globalAlpha = 0.3
        ctx.fillStyle = randDetail() > 0.5 ? '#5a3a2a' : '#6a4a3a'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }

    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = '#660e0b'
        ctx.globalAlpha = 0.5
        const x = randDetail() * 64
        const y = randDetail() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
