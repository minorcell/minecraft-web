import { fillNoise, seededRandom } from '../utils.js'

export function generateSnow(ctx, seed) {
    fillNoise(ctx, '#f8fbfe', '#e8eff7', 0.08, seed)
    const randFine = seededRandom(seed * 2 + 1)
    const randMedium = seededRandom(seed * 3 + 2)
    const randCluster = seededRandom(seed * 4 + 3)

    ctx.fillStyle = '#e2eaf5'
    for (let i = 0; i < 80; i++) {
        ctx.globalAlpha = 0.2
        const x = randFine() * 64
        const y = randFine() * 64
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.strokeStyle = '#cfd9e8'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.4
    for (let i = 0; i < 25; i++) {
        const x = randMedium() * 64
        const y = randMedium() * 64
        const size = 2 + randMedium() * 3
        const arms = randMedium() > 0.5 ? 6 : 8
        for (let a = 0; a < arms; a++) {
            const angle = (Math.PI * 2 / arms) * a
            const armLength = size / 2
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + Math.cos(angle) * armLength, y + Math.sin(angle) * armLength)
            ctx.stroke()
        }
    }

    for (let i = 0; i < 15; i++) {
        ctx.globalAlpha = 0.3
        const x = randCluster() * 64
        const y = randCluster() * 64
        const size = 3 + randCluster() * 4
        ctx.fillStyle = '#e9f1fb'
        ctx.fillRect(x, y, size, size)
    }
    ctx.globalAlpha = 1.0
}
