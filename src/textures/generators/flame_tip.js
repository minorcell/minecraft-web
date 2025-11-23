import { seededRandom, adjustColor } from '../utils.js'

export function generateFlameTip(ctx, seed) {
    const rand = seededRandom(seed)

    // 清空画布
    ctx.clearRect(0, 0, 64, 64)

    const centerX = 32
    const centerY = 32

    // 创建不规则的炭化顶部形状
    ctx.fillStyle = '#2a0000'
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.moveTo(centerX, 15)
    ctx.bezierCurveTo(centerX + 6, 18, centerX + 8, 25, centerX + 7, 32)
    ctx.bezierCurveTo(centerX + 6, 38, centerX + 3, 42, centerX, 42)
    ctx.bezierCurveTo(centerX - 3, 42, centerX - 6, 38, centerX - 7, 32)
    ctx.bezierCurveTo(centerX - 8, 25, centerX - 6, 18, centerX, 15)
    ctx.closePath()
    ctx.fill()

    // 添加内部的暗红色
    ctx.fillStyle = '#3a0000'
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.moveTo(centerX, 20)
    ctx.bezierCurveTo(centerX + 4, 22, centerX + 5, 28, centerX + 4, 32)
    ctx.bezierCurveTo(centerX + 3, 35, centerX + 2, 38, centerX, 38)
    ctx.bezierCurveTo(centerX - 2, 38, centerX - 3, 35, centerX - 4, 32)
    ctx.bezierCurveTo(centerX - 5, 28, centerX - 4, 22, centerX, 20)
    ctx.closePath()
    ctx.fill()

    // 添加高温燃烧的核心点
    ctx.fillStyle = '#ff4400'
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.arc(centerX, 25, 3, 0, Math.PI * 2)
    ctx.fill()

    // 添加炭化表面的坑洼和纹理
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 15; i++) {
        const x = centerX + (rand() - 0.5) * 20
        const y = 20 + rand() * 20
        const size = 1 + rand() * 2
        ctx.fillStyle = adjustColor('#2a0000', rand() > 0.5 ? -20 : 20)
        ctx.fillRect(x, y, size, size)
    }

    // 添加微小的炭渣
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 20; i++) {
        const x = centerX + (rand() - 0.5) * 24
        const y = 18 + rand() * 24
        const size = 0.5 + rand() * 1
        ctx.fillStyle = '#1a0000'
        ctx.fillRect(x, y, size, size)
    }

    // 在中心添加一个发光的炭点
    ctx.globalAlpha = 0.8
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 2, 0, Math.PI * 2)
    ctx.fill()

    // 添加周围的光晕效果
    const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20)
    glowGrad.addColorStop(0, 'rgba(255, 100, 0, 0.4)')
    glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)')
    ctx.fillStyle = glowGrad
    ctx.globalAlpha = 1.0
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1.0
}
