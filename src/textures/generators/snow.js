import { fillNoise, seededRandom, addDots } from '../utils.js'

export function generateSnow(ctx, seed) {
    fillNoise(ctx, '#fcfdff', '#eef2f8', 0.08, seed)

    const randFine = seededRandom(seed * 2 + 1)
    addDots(ctx, 0, 0, 64, 64, '#e8eef5', 120, 1, seed + 1)

    const randMedium = seededRandom(seed * 3 + 2)
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = '#e2eaf5'
        ctx.globalAlpha = 0.3
        const x = randFine() * 64
        const y = randFine() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    const randCrystal = seededRandom(seed * 4 + 3)
    ctx.strokeStyle = '#d4dde9'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 30; i++) {
        const x = randCrystal() * 64
        const y = randCrystal() * 64
        const size = 2 + randCrystal() * 3
        const arms = 6
        for (let a = 0; a < arms; a++) {
            const angle = (Math.PI * 2 / arms) * a
            const armLength = size / 2
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + Math.cos(angle) * armLength, y + Math.sin(angle) * armLength)
            ctx.stroke()
        }
    }

    addDots(ctx, 0, 0, 64, 64, '#dde4ef', 100, 1.5, seed + 4)

    const randCluster = seededRandom(seed * 5 + 4)
    for (let i = 0; i < 20; i++) {
        ctx.globalAlpha = 0.4
        const x = randCluster() * 64
        const y = randCluster() * 64
        const size = 2 + randCluster() * 3
        ctx.fillStyle = '#f0f4fa'
        ctx.fillRect(x, y, size, size)
    }

    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.6 + randFine() * 0.3
        const x = randFine() * 64
        const y = randFine() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
