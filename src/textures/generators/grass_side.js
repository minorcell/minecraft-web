import { fillNoise, addNoise, adjustColor, seededRandom } from '../utils.js'

export function generateGrassSide(ctx, seed) {
    const rand = seededRandom(seed)

    // Base dirt color
    fillNoise(ctx, '#6d4a2c', '#5a3d23', 0.1, seed)

    // Dirt variation patches
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor('#6d4a2c', rand() > 0.5 ? 15 : -20)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 8) * 4
        const y = Math.floor(rand() * 8) * 4
        ctx.fillRect(x, y, 2, 2)
    }

    // Grass overlay at the top
    ctx.fillStyle = '#3d8525'
    ctx.fillRect(0, 0, 32, 14)

    // Large green patches - reduced
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 8) * 4
        const y = Math.floor(rand() * 4) * 4
        const size = 1 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    // Medium green variation - reduced
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = adjustColor('#3d8525', rand() > 0.5 ? 12 : -8)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 16) * 2
        const y = Math.floor(rand() * 7) * 2
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Yellow/brown speckles - reduced
    for (let i = 0; i < 12; i++) {
        ctx.fillStyle = adjustColor('#d4a017', rand() > 0.5 ? 10 : -5)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 14)
        const size = rand() > 0.6 ? 2 : 1
        ctx.fillRect(x, y, size, size)
    }

    // Grass blades - fewer
    for (let i = 0; i < 12; i++) {
        const x = rand() * 32
        const bladeHeight = 1 + rand() * 3
        ctx.strokeStyle = adjustColor('#3d8525', rand() > 0.5 ? 15 : -8)
        ctx.globalAlpha = 0.6
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, 14)
        ctx.lineTo(x + (rand() - 0.5) * 2, 14 - bladeHeight)
        ctx.stroke()
    }

    // Dark patches for depth - reduced
    for (let i = 0; i < 8; i++) {
        ctx.fillStyle = adjustColor('#2d6520', rand() > 0.5 ? 8 : -6)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 14)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Dirt edge at bottom
    ctx.fillStyle = '#5a3d23'
    ctx.fillRect(0, 26, 32, 6)

    // Transition zone mixing
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = adjustColor('#6d4a2c', rand() > 0.5 ? 10 : -15)
        ctx.globalAlpha = 0.3
        const x = Math.floor(rand() * 32)
        const y = 20 + Math.floor(rand() * 12)
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
