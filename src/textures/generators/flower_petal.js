import { seededRandom, adjustColor } from '../utils.js'

export function generateFlowerPetal(ctx, seed) {
    const rand = seededRandom(seed)

    // 清空画布
    ctx.clearRect(0, 0, 64, 64)

    // 随机选择花瓣颜色
    const colors = [
        '#ff69b4', // 粉红色
        '#ff1493', // 深粉色
        '#ff6347', // 番茄红
        '#ff4500', // 橙红色
        '#ffff00', // 黄色
        '#9370db', // 紫色
        '#ba55d3', // 中紫色
        '#ff69b4'  // 热粉色
    ]
    const mainColor = colors[Math.floor(rand() * colors.length)]
    const darkColor = adjustColor(mainColor, -30)
    const lightColor = adjustColor(mainColor, 30)

    // 创建渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, lightColor)
    grad.addColorStop(0.5, mainColor)
    grad.addColorStop(1, darkColor)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    // 添加花瓣纹理细节
    // 1. 添加纵向条纹
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = lightColor
    ctx.lineWidth = 2
    for (let i = 0; i < 3; i++) {
        const x = 16 + i * 16 + (rand() - 0.5) * 4
        ctx.beginPath()
        ctx.moveTo(x, 8)
        ctx.lineTo(x, 56)
        ctx.stroke()
    }

    // 2. 添加细小斑点
    ctx.globalAlpha = 0.4
    for (let i = 0; i < 30; i++) {
        const x = rand() * 64
        const y = rand() * 64
        const size = 1 + rand() * 1.5
        ctx.fillStyle = rand() > 0.5 ? lightColor : darkColor
        ctx.fillRect(x, y, size, size)
    }

    // 3. 添加花瓣边缘的深色
    ctx.globalAlpha = 0.6
    ctx.strokeStyle = darkColor
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, 61, 61)

    // 4. 添加高光效果
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 5; i++) {
        const x = rand() * 30 + 10
        const y = rand() * 20 + 5
        const size = 2 + rand() * 2
        ctx.fillRect(x, y, size, size)
    }

    // 5. 添加花瓣中心的颜色变化
    ctx.globalAlpha = 0.5
    const centerGrad = ctx.createRadialGradient(32, 32, 5, 32, 32, 20)
    centerGrad.addColorStop(0, '#ffff88')
    centerGrad.addColorStop(1, mainColor)
    ctx.fillStyle = centerGrad
    ctx.fillRect(20, 20, 24, 24)

    // 6. 添加微妙的噪声纹理
    ctx.globalAlpha = 0.2
    for (let i = 0; i < 50; i++) {
        const x = rand() * 64
        const y = rand() * 64
        const alpha = 0.1 + rand() * 0.2
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fillRect(x, y, 1, 1)
    }

    ctx.globalAlpha = 1.0
}
