import { fillNoise } from '../utils.js'

export function generateDefaultGrass(ctx, seed) {
    fillNoise(ctx, '#888888', '#777777', 0.1, seed)
}
