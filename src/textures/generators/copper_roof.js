import { fillNoise, seededRandom, adjustColor, addDots, addStreaks } from '../utils.js'

export function generateCopperRoof(ctx, seed) {
    // 基础铜橙底色 + 噪声
    fillNoise(ctx, '#c46a3a', '#b55d32', 0.12, seed)

    const rand = seededRandom(seed * 11 + 7)
    const randDetail = seededRandom(seed * 13 + 3)

    // 横向板条阴影
    ctx.fillStyle = '#a9522b'
    for (let y = 0; y < 64; y += 12) {
        ctx.globalAlpha = 0.5
        ctx.fillRect(0, y, 64, 2)
        ctx.globalAlpha = 0.25
        ctx.fillRect(0, y + 2, 64, 1)
    }

    // 竖向拼缝，带随机偏移
    const offset = rand() > 0.5 ? 4 : 0
    ctx.fillStyle = '#d37a46'
    for (let x = offset; x < 64; x += 16) {
        ctx.globalAlpha = 0.55
        ctx.fillRect(x, 0, 2, 64)
        ctx.globalAlpha = 0.35
        ctx.fillRect(x + 8, 0, 1, 64)
    }

    // 高光/暗部块状变化
    for (let i = 0; i < 80; i++) {
        const color = adjustColor('#c46a3a', randDetail() > 0.5 ? 18 : -22)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.35
        const x = Math.floor(randDetail() * 32) * 2
        const y = Math.floor(randDetail() * 32) * 2
        ctx.fillRect(x, y, 2, 2)
    }

    // 铜锈点状细节
    addDots(ctx, 0, 0, 64, 64, '#9b3f26', 60, 1.6, seed + 17)

    // 轻微纵向拉丝感，增加金属质感
    addStreaks(ctx, '#e9a271', 4, false, seed + 23)

    ctx.globalAlpha = 1.0
}
