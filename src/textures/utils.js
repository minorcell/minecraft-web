export function seededRandom(seed) {
    let value = seed * 1000 + 1
    return function() {
        value = (value * 9301 + 49297) % 233280
        return value / 233280
    }
}

export function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16)
    const r = Math.max(0, Math.min(255, (num >> 16) + amount))
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
}

export function fillNoise(ctx, color1, color2, factor, seed = 0) {
    ctx.fillStyle = color1
    ctx.fillRect(0, 0, 64, 64)

    const random = seededRandom(seed)
    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = random() > 0.5 ? color2 : color1
        ctx.globalAlpha = factor
        const x = Math.floor(random() * 16) * 4
        const y = Math.floor(random() * 16) * 4
        ctx.fillRect(x, y, 4, 4)
    }

    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = adjustColor(color1, random() > 0.5 ? -20 : 20)
        ctx.globalAlpha = factor * 0.5
        const x = Math.floor(random() * 32) * 2
        const y = Math.floor(random() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    ctx.globalAlpha = 1.0
}

export function addNoise(ctx, x, y, w, h, color, factor, seed = 0) {
    const random = seededRandom(seed)
    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = color
        ctx.globalAlpha = factor
        const rx = x + Math.floor(random() * (w / 4)) * 4
        const ry = y + Math.floor(random() * (h / 4)) * 4
        ctx.fillRect(rx, ry, 4, 4)
    }
    ctx.globalAlpha = 1.0
}
