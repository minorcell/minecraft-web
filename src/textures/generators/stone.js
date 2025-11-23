import { fillNoise, seededRandom, adjustColor, addDots, addBlobs } from '../utils.js'

export function generateStone(ctx, seed) {
    const rand = seededRandom(seed)

    // Base dark gray
    ctx.fillStyle = '#5a5a5a'
    ctx.fillRect(0, 0, 64, 64)

    // Large dark patches
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor('#5a5a5a', rand() > 0.5 ? 25 : -35)
        ctx.globalAlpha = 0.6
        const x = Math.floor(rand() * 16) * 4
        const y = Math.floor(rand() * 16) * 4
        const size = 4 + Math.floor(rand() * 12)
        ctx.fillRect(x, y, size, size)
    }

    // Medium gray patches
    for (let i = 0; i < 80; i++) {
        ctx.fillStyle = adjustColor('#6d6d6d', rand() > 0.5 ? 30 : -25)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 32) * 2
        const y = Math.floor(rand() * 32) * 2
        const size = 2 + Math.floor(rand() * 8)
        ctx.fillRect(x, y, size, size)
    }

    // Light gray variation
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = adjustColor('#8e8e8e', rand() > 0.5 ? 20 : -30)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    // Blue-gray patches (mineral deposits)
    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = adjustColor('#7a8a9a', rand() > 0.5 ? 20 : -25)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    // Darker blue-gray areas
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = adjustColor('#5a6a7a', rand() > 0.5 ? 15 : -20)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 2 + Math.floor(rand() * 4)
        ctx.fillRect(x, y, size, size)
    }

    // Fine grain texture
    addDots(ctx, 0, 0, 64, 64, '#4a4a4a', 100, 1, seed + 1)
    addDots(ctx, 0, 0, 64, 64, '#9e9e9e', 80, 1, seed + 2)
    addDots(ctx, 0, 0, 64, 64, '#6a7a8a', 60, 1, seed + 3)

    // Deep dark patches for depth
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor('#3d3d3d', rand() > 0.5 ? 20 : -15)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 3)
        ctx.fillRect(x, y, size, size)
    }

    // Major cracks
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.8
    const crackCount = 4 + Math.floor(rand() * 2)
    for (let c = 0; c < crackCount; c++) {
        let x = rand() * 50 + 7
        let y = rand() * 50 + 7
        ctx.beginPath()
        ctx.moveTo(x, y)
        const segments = 10
        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 15
            y += (rand() - 0.5) * 15
            x = Math.max(2, Math.min(62, x))
            y = Math.max(2, Math.min(62, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()

        // Branch cracks
        const branchCount = 1 + Math.floor(rand() * 2)
        for (let b = 0; b < branchCount; b++) {
            const bx = x
            const by = y
            ctx.beginPath()
            ctx.moveTo(bx, by)
            const bsegments = 4 + Math.floor(rand() * 3)
            for (let bs = 0; bs < bsegments; bs++) {
                x += (rand() - 0.5) * 12
                y += (rand() - 0.5) * 12
                x = Math.max(2, Math.min(62, x))
                y = Math.max(2, Math.min(62, y))
                ctx.lineTo(x, y)
            }
            ctx.stroke()
        }
    }

    // Minor cracks
    ctx.strokeStyle = '#3d3d3d'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.6
    for (let c = 0; c < 6; c++) {
        let x = rand() * 60 + 2
        let y = rand() * 60 + 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        const segments = 6
        for (let s = 0; s < segments; s++) {
            x += (rand() - 0.5) * 10
            y += (rand() - 0.5) * 10
            x = Math.max(2, Math.min(62, x))
            y = Math.max(2, Math.min(62, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()
    }

    // Very dark patches near cracks
    for (let i = 0; i < 40; i++) {
        ctx.fillStyle = adjustColor('#1a1a1a', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.4
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Bright highlights
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#bebebe', rand() > 0.5 ? 15 : -10)
        ctx.globalAlpha = 0.5
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        const size = 1 + Math.floor(rand() * 2)
        ctx.fillRect(x, y, size, size)
    }

    // Large mineral blobs
    addBlobs(ctx, '#5a6a7a', 15, 3, 8, seed + 10)
    addBlobs(ctx, '#4a5a6a', 12, 2, 6, seed + 11)

    ctx.globalAlpha = 1.0
}
