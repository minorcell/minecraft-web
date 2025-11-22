import { seededRandom } from '../utils.js'

export function generateCrack(ctx, seed) {
    ctx.clearRect(0, 0, 64, 64)
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.9
    const rand = seededRandom(seed)
    ctx.beginPath()
    let x = rand() * 30 + 17
    let y = rand() * 30 + 17
    ctx.moveTo(x, y)
    const segments = 8
    for (let s = 0; s < segments; s++) {
        x += (rand() - 0.5) * 20
        y += (rand() - 0.5) * 20
        x = Math.max(5, Math.min(59, x))
        y = Math.max(5, Math.min(59, y))
        ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.strokeStyle = '#444444'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.7
    for (let c = 0; c < 3; c++) {
        const branchX = rand() * 40 + 12
        const branchY = rand() * 40 + 12
        ctx.beginPath()
        ctx.moveTo(branchX, branchY)
        ctx.lineTo(branchX + (rand() - 0.5) * 15, branchY + (rand() - 0.5) * 15)
        ctx.stroke()
    }
    ctx.globalAlpha = 1.0
}
