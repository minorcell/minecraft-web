import { fillNoise } from '../utils.js'

export function generateDefault(ctx, seed) {
    fillNoise(ctx, '#888888', '#777777', 0.1, seed)
}
