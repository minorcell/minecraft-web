import { fillNoise, seededRandom, adjustColor } from '../utils.js'

export function generateStone(ctx, seed) {
    fillNoise(ctx, '#777777', '#666666', 0.1, seed)
    const rand = seededRandom(seed)
    ctx.strokeStyle = adjustColor('#555555', rand() > 0.5 ? 20 : -20)
    ctx.lineWidth = 2
    ctx.beginPath()
    const crackCount = 3 + Math.floor(rand() * 3)
    for (let c = 0; c < crackCount; c++) {
        let x = rand() * 60 + 2
        let y = rand() * 60 + 2
        ctx.moveTo(x, y)
        const segments = 5
        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 15
            y += (rand() - 0.5) * 15
            ctx.lineTo(x, y)
        }
    }
    ctx.stroke()
}
