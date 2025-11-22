import { seededRandom } from '../utils.js'

export function generateCrack(ctx, seed) {
    ctx.clearRect(0, 0, 64, 64)
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.95
    const rand = seededRandom(seed)

    ctx.beginPath()
    let x = rand() * 30 + 17
    let y = rand() * 30 + 17
    ctx.moveTo(x, y)
    const segments = 10
    for (let s = 0; s < segments; s++) {
        x += (rand() - 0.5) * 18
        y += (rand() - 0.5) * 18
        x = Math.max(3, Math.min(61, x))
        y = Math.max(3, Math.min(61, y))
        ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.strokeStyle = '#3a3a3a'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    for (let c = 0; c < 4; c++) {
        const branchX = rand() * 45 + 10
        const branchY = rand() * 45 + 10
        ctx.beginPath()
        ctx.moveTo(branchX, branchY)
        ctx.lineTo(branchX + (rand() - 0.5) * 12, branchY + (rand() - 0.5) * 12)
        ctx.stroke()

        if (rand() > 0.6) {
            ctx.beginPath()
            ctx.moveTo(branchX, branchY)
            ctx.lineTo(branchX + (rand() - 0.5) * 10, branchY + (rand() - 0.5) * 10)
            ctx.stroke()
        }
    }

    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.6
    for (let i = 0; i < 5; i++) {
        const crackX = rand() * 50 + 7
        const crackY = rand() * 50 + 7
        ctx.beginPath()
        ctx.moveTo(crackX, crackY)
        ctx.lineTo(crackX + (rand() - 0.5) * 8, crackY + (rand() - 0.5) * 8)
        ctx.stroke()
    }

    ctx.globalAlpha = 1.0
}
