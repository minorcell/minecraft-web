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

export function hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16)
    return {
        r: (num >> 16) & 0xFF,
        g: (num >> 8) & 0xFF,
        b: num & 0xFF
    }
}

export function rgbToHex(r, g, b) {
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
}

export function fillNoise(ctx, color1, color2, factor, seed = 0) {
    ctx.fillStyle = color1
    ctx.fillRect(0, 0, 32, 32)

    const random = seededRandom(seed)
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = random() > 0.5 ? color2 : color1
        ctx.globalAlpha = factor
        const x = Math.floor(random() * 8) * 4
        const y = Math.floor(random() * 8) * 4
        ctx.fillRect(x, y, 4, 4)
    }

    for (let i = 0; i < 25; i++) {
        ctx.fillStyle = adjustColor(color1, random() > 0.5 ? -20 : 20)
        ctx.globalAlpha = factor * 0.5
        const x = Math.floor(random() * 16) * 2
        const y = Math.floor(random() * 16) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    ctx.globalAlpha = 1.0
}

export function addNoise(ctx, x, y, w, h, color, factor, seed = 0) {
    const random = seededRandom(seed)
    for (let i = 0; i < 25; i++) {
        ctx.fillStyle = color
        ctx.globalAlpha = factor
        const rx = x + Math.floor(random() * (w / 4)) * 4
        const ry = y + Math.floor(random() * (h / 4)) * 4
        ctx.fillRect(rx, ry, 4, 4)
    }
    ctx.globalAlpha = 1.0
}

export function addDots(ctx, x, y, w, h, color, count, size = 1, seed = 0) {
    const random = seededRandom(seed)
    for (let i = 0; i < count; i++) {
        ctx.fillStyle = color
        ctx.globalAlpha = 0.4 + random() * 0.4
        const rx = x + Math.floor(random() * w)
        const ry = y + Math.floor(random() * h)
        ctx.beginPath()
        ctx.arc(rx, ry, size * (0.5 + random()), 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.globalAlpha = 1.0
}

export function addStreaks(ctx, color, count, vertical = true, seed = 0) {
    const random = seededRandom(seed)
    for (let i = 0; i < count; i++) {
        ctx.strokeStyle = color
        ctx.globalAlpha = 0.3 + random() * 0.4
        ctx.lineWidth = 1 + random() * 2
        ctx.beginPath()
        if (vertical) {
            const x = random() * 64
            ctx.moveTo(x, 0)
            ctx.lineTo(x, 64)
        } else {
            const y = random() * 64
            ctx.moveTo(0, y)
            ctx.lineTo(64, y)
        }
        ctx.stroke()
    }
    ctx.globalAlpha = 1.0
}

export function addBlobs(ctx, color, count, minSize, maxSize, seed = 0) {
    const random = seededRandom(seed)
    for (let i = 0; i < count; i++) {
        ctx.fillStyle = color
        ctx.globalAlpha = 0.2 + random() * 0.4
        const x = random() * 32
        const y = random() * 32
        const size = minSize + random() * (maxSize - minSize)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.globalAlpha = 1.0
}
