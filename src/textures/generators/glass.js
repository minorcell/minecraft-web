import { seededRandom, addStreaks } from '../utils.js'

export function generateGlass(ctx, seed) {
    const rand = seededRandom(seed)

    const grad = ctx.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, '#b8e0f0')
    grad.addColorStop(0.5, '#a8d8e8')
    grad.addColorStop(1, '#98d0e0')
    ctx.fillStyle = grad
    ctx.globalAlpha = 0.35
    ctx.fillRect(0, 0, 64, 64)

    ctx.globalAlpha = 1.0

    addStreaks(ctx, '#ffffff', 3, true, seed)
    addStreaks(ctx, '#e0f0f8', 5, false, seed + 1)

    ctx.strokeStyle = '#c0d8e8'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5
    ctx.strokeRect(0, 0, 64, 64)

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.8
    for (let i = 0; i < 3; i++) {
        const startX = rand() * 30 + 10
        const startY = rand() * 30 + 10
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(startX + 8 + rand() * 6, startY + 8 + rand() * 6)
        ctx.stroke()
    }

    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.2 + rand() * 0.3
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 1.5
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }

    ctx.globalAlpha = 1.0
}
