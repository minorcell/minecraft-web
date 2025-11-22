import { fillNoise, seededRandom } from '../utils.js'

export function generateRoof(ctx, seed) {
    fillNoise(ctx, '#a52a2a', '#941919', 0.12, seed)
    const randRoof = seededRandom(seed * 2 + 1)
    const randDetail = seededRandom(seed * 3 + 2)
    ctx.fillStyle = '#730808'
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
            gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
            gradient.addColorStop(1, 'rgba(0,0,0,0.15)')
            ctx.globalAlpha = 0.8
            ctx.fillStyle = gradient
            ctx.fillRect(x, y, 16, 16)
        }
    }
    for (let i = 0; i < 8; i++) {
        const x = randDetail() * 64
        const y = randDetail() * 64
        const size = 1 + randDetail() * 3
        ctx.globalAlpha = 0.25
        ctx.fillStyle = randDetail() > 0.5 ? '#4a7c3a' : '#5a8c4a'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.globalAlpha = 1.0
}
