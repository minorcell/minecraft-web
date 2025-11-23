import { fillNoise, seededRandom, adjustColor, addDots, addBlobs } from '../utils.js'

export function generateStone(ctx, seed) {
    const rand = seededRandom(seed)

    // Base dark gray
    ctx.fillStyle = '#5a5a5a'
    ctx.fillRect(0, 0, 32, 32)

    // Large dark patches
    for (let i = 0; i < 25; i++) {
        ctx.fillStyle = adjustColor('#5a5a5a', rand() > 0.5 ? 25 : -35)
        ctx.globalAlpha = 0.6
        const x = Math.floor(rand() * 8) * 4
        const y = Math.floor(rand() * 8) * 4
        const size = 2 + Math.floor(rand() * 6)
        ctx.fillRect(x, y, size, size)
    }

    // Medium gray patches
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = adjustColor('#6d6d6d', rand() > 0.5 ? 30 : -25)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 16) * 2
        const y = Math.floor(rand() * 16) * 2
        const size = 1 + Math.floor(rand() * 4)
        ctx.fillRect(x, y, size, size)
    }

    // Light gray variation
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor('#8e8e8e', rand() > 0.5 ? 20 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Blue-gray patches (mineral deposits)
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#7a8a9a', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Darker blue-gray areas
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = adjustColor('#5a6a7a', rand() > 0.5 ? 15 : -20)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Fine grain texture
    addDots(ctx, 0, 0, 32, 32, '#4a4a4a', 50, 1, seed + 1)
    addDots(ctx, 0, 0, 32, 32, '#9e9e9e', 40, 1, seed + 2)
    addDots(ctx, 0, 0, 32, 32, '#6a7a8a', 30, 1, seed + 3)

    // Deep dark patches for depth
    for (let i = 0; i < 25; i++) {
        ctx.fillStyle = adjustColor('#3d3d3d', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Major cracks
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    const crackCount = 3 + Math.floor(rand() * 1)
    for (let c = 0; c < crackCount; c++) {
        let x = rand() * 25 + 3
        let y = rand() * 25 + 3
        ctx.beginPath()
        ctx.moveTo(x, y)
        const segments = 6
        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 8
            y += (rand() - 0.5) * 8
            x = Math.max(2, Math.min(30, x))
            y = Math.max(2, Math.min(30, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Branch cracks
        const branchCount = 1 + Math.floor(rand() * 1)
        for (let b = 0; b < branchCount; b++) {
            const bx = x
            const by = y
            ctx.beginPath()
            ctx.moveTo(bx, by)
            const bsegments = 3 + Math.floor(rand() * 2)
            for (let bs = 0; bs < bsegments; bs++) {
                x += (rand() - 0.5) * 6
                y += (rand() - 0.5) * 6
                x = Math.max(2, Math.min(30, x))
                y = Math.max(2, Math.min(30, y))
                ctx.lineTo(x, y)
            }
            ctx.stroke()
        }
    }

    // Minor cracks
    ctx.strokeStyle = '#3d3d3d'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.6
    for (let c = 0; c < 4; c++) {
        let x = rand() * 30 + 1
        let y = rand() * 30 + 1
        ctx.beginPath()
        ctx.moveTo(x, y)
        const segments = 4
        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 6
            y += (rand() - 0.5) * 6
            x = Math.max(2, Math.min(30, x))
            y = Math.max(2, Math.min(30, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()
    }

    // Very dark patches near cracks
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = adjustColor('#1a1a1a', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Bright highlights
    for (let i = 0; i < 15; i++) {
        ctx.fillStyle = adjustColor('#bebebe', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 32)
        const y = Math.floor(rand() * 32)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Large mineral blobs
    addBlobs(ctx, '#5a6a7a', 8, 2, 4, seed + 10)
    addBlobs(ctx, '#4a5a6a', 6, 1, 3, seed + 11)

    ctx.globalAlpha = 1.0
}
