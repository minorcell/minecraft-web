import { fillNoise, addNoise, adjustColor } from '../utils.js'

export function generateGrassSide(ctx, seed) {
    fillNoise(ctx, '#885533', '#774422', 0.1, seed)
    ctx.fillStyle = adjustColor('#55aa55', 10)
    ctx.fillRect(0, 0, 64, 20)
    addNoise(ctx, 0, 0, 64, 20, '#449944', 0.2, seed)
}
