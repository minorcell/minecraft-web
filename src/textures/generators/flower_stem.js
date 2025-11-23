import { seededRandom, adjustColor } from '../utils.js'

export function generateFlowerStem(ctx, seed) {
    const rand = seededRandom(seed)

    // 清空画布
    ctx.clearRect(0, 0, 64, 64)

    // 绿色渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, '#4a7c2c')  // 顶部稍亮
    grad.addColorStop(0.5, '#3a6c1c') // 中间主要颜色
    grad.addColorStop(1, '#2a5c0c')  // 底部稍暗
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    // 添加纵向纹理（模拟茎的纤维）
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = '#5a8c3c'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
        const x = 10 + i * 12 + (rand() - 0.5) * 4
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + (rand() - 0.5) * 6, 64)
        ctx.stroke()
    }

    // 添加细小的斑点（模拟茎表面的细节）
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 40; i++) {
        const x = rand() * 64
        const y = rand() * 64
        const size = 1
        ctx.fillStyle = rand() > 0.5 ? '#6a9c4c' : '#2a5c0c'
        ctx.fillRect(x, y, size, size)
    }

    // 添加茎的高光（左侧的亮边）
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#7aac5c'
    ctx.fillRect(0, 0, 8, 64)

    // 添加茎的阴影（右侧的暗边）
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#1a4c0c'
    ctx.fillRect(56, 0, 8, 64)

    // 添加小叶片纹理（茎上的小凸起）
    ctx.globalAlpha = 0.5
    for (let i = 0; i < 8; i++) {
        const x = 16 + rand() * 32
        const y = 8 + rand() * 48
        const width = 3 + rand() * 4
        const height = 1 + rand() * 2
        ctx.fillStyle = adjustColor('#4a7c2c', rand() > 0.5 ? 20 : -20)
        ctx.fillRect(x, y, width, height)
    }

    // 添加微妙的渐变光晕
    const glowGrad = ctx.createLinearGradient(0, 0, 64, 0)
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
    glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)')
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)')
    ctx.fillStyle = glowGrad
    ctx.globalAlpha = 1.0
    ctx.fillRect(0, 0, 64, 64)

    ctx.globalAlpha = 1.0
}
