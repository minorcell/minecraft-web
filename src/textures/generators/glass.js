import { seededRandom } from '../utils.js'

export function generateGlass(ctx, seed) {
    ctx.fillStyle = '#add8e6'
    ctx.globalAlpha = 0.3
    ctx.fillRect(0, 0, 64, 64)
    ctx.globalAlpha = 1.0
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, 64, 64)

    const rand = seededRandom(seed)
    ctx.beginPath()
    const glintX = 10 + rand() * 20
    const glintY = 10 + rand() * 20
    ctx.moveTo(glintX, glintY)
    ctx.lineTo(glintX + 10, glintY + 10)
    ctx.stroke()
}
