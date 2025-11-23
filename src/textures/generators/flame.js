import { seededRandom, adjustColor } from '../utils.js'

export function generateFlame(ctx, seed) {
    const rand = seededRandom(seed)

    // 清空画布
    ctx.clearRect(0, 0, 64, 64)

    const left = 16
    const right = 48
    const top = 8
    const bottom = 48

    // 填充矩形背景为深红色
    ctx.fillStyle = '#ff3300'
    ctx.fillRect(left, top, right - left, bottom - top)

    // 在矩形内部添加火焰纹理
    // 1. 添加橙色条纹
    for (let i = 0; i < 5; i++) {
        const x = left + 4 + i * 6 + (rand() - 0.5) * 2
        const width = 2 + rand() * 2
        ctx.fillStyle = '#ff5500'
        ctx.globalAlpha = 0.8
        ctx.fillRect(x, top + 5, width, bottom - top - 10)
    }

    // 2. 添加黄色明亮的条纹
    for (let i = 0; i < 4; i++) {
        const x = left + 6 + i * 7 + (rand() - 0.5) * 3
        const width = 1 + rand() * 2
        ctx.fillStyle = '#ffaa00'
        ctx.globalAlpha = 0.9
        ctx.fillRect(x, top + 8, width, bottom - top - 16)
    }

    // 3. 添加白色最亮区域（几个方块）
    for (let i = 0; i < 6; i++) {
        const x = left + 8 + rand() * (right - left - 16)
        const y = top + 10 + rand() * (bottom - top - 20)
        const size = 2 + rand() * 2
        ctx.fillStyle = '#ffffcc'
        ctx.globalAlpha = 0.9
        ctx.fillRect(x, y, size, size)
    }

    // 4. 添加纯白色亮点
    ctx.globalAlpha = 1.0
    for (let i = 0; i < 10; i++) {
        const x = left + rand() * (right - left)
        const y = top + rand() * (bottom - top)
        const size = 1 + rand() * 1
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x, y, size, size)
    }

    // 5. 添加黄色/橙色的火焰粒子
    ctx.globalAlpha = 0.8
    for (let i = 0; i < 30; i++) {
        const x = left + rand() * (right - left)
        const y = top + rand() * (bottom - top)
        const size = 1 + rand() * 1.5
        ctx.fillStyle = rand() > 0.5 ? '#ffdd44' : '#ffaa22'
        ctx.fillRect(x, y, size, size)
    }

    // 6. 添加纵向的火焰流动纹理
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#ffee88'
    for (let i = 0; i < 6; i++) {
        const x = left + 4 + i * 6 + (rand() - 0.5) * 3
        const height = bottom - top - 5
        const width = 1 + rand() * 1
        ctx.fillRect(x, top + 2, width, height)
    }

    // 7. 添加更亮的中央区域
    ctx.globalAlpha = 0.7
    ctx.fillStyle = '#ffffff'
    const centerX = (left + right) / 2
    const centerY = (top + bottom) / 2
    ctx.fillRect(centerX - 3, centerY - 8, 6, 16)

    // 8. 添加边缘的深色部分（增强立体感）
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#cc2200'
    // 左侧边缘
    ctx.fillRect(left, top, 2, bottom - top)
    // 右侧边缘
    ctx.fillRect(right - 2, top, 2, bottom - top)
    // 顶部边缘
    ctx.fillRect(left, top, right - left, 2)
    // 底部边缘
    ctx.fillRect(left, bottom - 2, right - left, 2)

    // 9. 添加火星飞溅效果
    ctx.globalAlpha = 0.7
    for (let i = 0; i < 12; i++) {
        const angle = (rand() - 0.5) * Math.PI * 2
        const distance = rand() * 10
        const x = centerX + Math.cos(angle) * distance
        const y = centerY - 10 + Math.sin(angle) * distance
        const size = 1
        ctx.fillStyle = rand() > 0.5 ? '#ffaa22' : '#ffdd44'
        ctx.fillRect(x, y, size, size)
    }

    // 10. 在底部添加炭化区域
    ctx.globalAlpha = 0.8
    ctx.fillStyle = '#4a0000'
    ctx.fillRect(left, bottom - 6, right - left, 6)

    // 11. 添加炭化区域的高亮点
    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#ff4400'
    for (let i = 0; i < 5; i++) {
        const x = left + 4 + rand() * (right - left - 8)
        const y = bottom - 5 + rand() * 3
        ctx.fillRect(x, y, 1, 1)
    }

    // 添加整体光晕效果
    const glowGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 25)
    glowGrad.addColorStop(0, 'rgba(255, 200, 50, 0.3)')
    glowGrad.addColorStop(0.7, 'rgba(255, 150, 50, 0.1)')
    glowGrad.addColorStop(1, 'rgba(255, 100, 0, 0)')
    ctx.fillStyle = glowGrad
    ctx.globalAlpha = 1.0
    ctx.fillRect(left, top, right - left, bottom - top)

    ctx.globalAlpha = 1.0
}
