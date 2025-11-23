import { fillNoise, seededRandom, adjustColor, addDots } from '../utils.js'

export function generateTorch(ctx, seed) {
    const rand = seededRandom(seed)

    // 基础木质纹理 - 使用温暖的棕色
    fillNoise(ctx, '#a0662a', '#8b4513', 0.15, seed)

    // 添加木纹纹理
    const woodStreakCount = 3 + Math.floor(rand() * 2)
    for (let i = 0; i < woodStreakCount; i++) {
        const x = 10 + i * (44 / woodStreakCount) + rand() * 8
        ctx.fillStyle = '#6a2400'
        ctx.globalAlpha = 0.7 + rand() * 0.3
        const width = 3 + rand() * 4
        ctx.fillRect(x, 0, width, 64)

        ctx.fillStyle = '#b07030'
        ctx.globalAlpha = 0.4
        ctx.fillRect(x + width, 0, 1, 64)
    }

    // 添加顶部燃烧区域的炭化效果
    const charHeight = 12
    const grad = ctx.createLinearGradient(0, 0, 0, charHeight)
    grad.addColorStop(0, '#4a0000')
    grad.addColorStop(0.3, '#5a0000')
    grad.addColorStop(0.7, '#6a0000')
    grad.addColorStop(1, '#7a0000')
    ctx.fillStyle = grad
    ctx.globalAlpha = 0.8
    ctx.fillRect(0, 0, 64, charHeight)

    // 添加炭化纹理
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = adjustColor('#4a0000', rand() > 0.5 ? -30 : 30)
        ctx.globalAlpha = 0.3 + rand() * 0.4
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * charHeight)
        ctx.fillRect(x, y, 1, 1)
    }

    // 在火把顶部添加焦黑的炭
    ctx.fillStyle = '#2a0000'
    ctx.globalAlpha = 0.5
    ctx.fillRect(0, charHeight - 2, 64, 2)

    // 添加木头的节点和瑕疵
    for (let i = 0; i < 8; i++) {
        const x = rand() * 64
        const y = charHeight + rand() * (64 - charHeight)
        const radius = 2 + rand() * 3
        ctx.fillStyle = adjustColor('#8b4513', rand() > 0.5 ? 20 : -40)
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
    }

    // 添加纵向裂纹
    const crackCount = 2 + Math.floor(rand() * 2)
    for (let i = 0; i < crackCount; i++) {
        const x = 8 + rand() * 48
        ctx.strokeStyle = '#4a1a00'
        ctx.globalAlpha = 0.5
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, charHeight)
        ctx.lineTo(x + (rand() - 0.5) * 10, 64)
        ctx.stroke()
    }

    // 添加烟熏痕迹（从上往下）
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(rand() * 64)
        const y1 = 0
        const y2 = charHeight + rand() * 20
        ctx.strokeStyle = adjustColor('#5a0000', rand() > 0.5 ? 20 : -20)
        ctx.globalAlpha = 0.2 + rand() * 0.3
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, y1)
        ctx.lineTo(x, y2)
        ctx.stroke()
    }

    // 在把手部分添加高光
    ctx.fillStyle = '#c08040'
    ctx.globalAlpha = 0.3
    ctx.fillRect(20, charHeight + 10, 24, 40)

    // 添加微小的木屑纹理
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(rand() * 64)
        const y = Math.floor(rand() * 64)
        ctx.fillStyle = adjustColor('#a0662a', rand() > 0.5 ? 25 : -35)
        ctx.globalAlpha = 0.3
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
