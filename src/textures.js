import * as THREE from 'three'

export class TextureFactory {
    constructor() {
        // Cache for textures by type and variant
        this.textureCache = {}
        this.canvasCache = {}
        this.variants = 4 // Number of texture variants per type
    }

    createTexture(type, variant = 0) {
        const key = `${type}_${variant}`
        if (this.textureCache[key]) {
            return this.textureCache[key]
        }

        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        const seed = variant / this.variants // Use variant as seed

        switch (type) {
            case 'grass_top':
                // 基础绿色（更自然的色调）
                this.fillNoise(ctx, '#5faa4a', '#4e8f3f', 0.2, seed)

                // 添加草丛纹理（模拟草叶）
                const randGrass = this.seededRandom(seed * 2 + 1)
                ctx.strokeStyle = '#2d5a2d'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.6
                for (let i = 0; i < 40; i++) {
                    const x = randGrass() * 64
                    const baseY = 60 - randGrass() * 10
                    const height = 5 + randGrass() * 8
                    const tilt = (randGrass() - 0.5) * 8

                    // 草叶（向上的三角形）
                    ctx.beginPath()
                    ctx.moveTo(x, baseY)
                    ctx.lineTo(x + tilt, baseY - height)
                    ctx.lineTo(x + tilt + 2, baseY)
                    ctx.closePath()
                    ctx.fillStyle = randGrass() > 0.5 ? '#6ec65a' : '#4a9e3a'
                    ctx.fill()
                }

                // 模拟踩踏痕迹（随机深色斑点）
                ctx.globalAlpha = 0.2
                ctx.fillStyle = '#2d4a2d'
                for (let i = 0; i < 20; i++) {
                    const x = Math.floor(randGrass() * 16) * 4
                    const y = Math.floor(randGrass() * 16) * 4
                    ctx.fillRect(x, y, 3, 3)
                }

                ctx.globalAlpha = 1.0
                break

            case 'grass_side':
                // 泥土底色（更深的棕色）
                this.fillNoise(ctx, '#7a4a2a', '#6a3d20', 0.15, seed)

                // 添加泥土颗粒
                const randSoil = this.seededRandom(seed * 4 + 3)
                ctx.fillStyle = '#5a3018'
                for (let i = 0; i < 30; i++) {
                    ctx.globalAlpha = 0.3
                    const x = Math.floor(randSoil() * 16) * 4
                    const y = Math.floor(randSoil() * 32) * 2
                    ctx.fillRect(x, y, 2, 2)
                }

                // 顶部草皮层
                const grassHeight = 18
                const grassGradient = ctx.createLinearGradient(0, 0, 0, grassHeight)
                grassGradient.addColorStop(0, '#6ec65a')
                grassGradient.addColorStop(1, '#4a9e3a')
                ctx.fillStyle = grassGradient
                ctx.fillRect(0, 0, 64, grassHeight)

                // 草根渗透效果（向下延伸的深绿色）
                ctx.strokeStyle = '#3a7a2a'
                ctx.globalAlpha = 0.5
                ctx.lineWidth = 1
                for (let i = 4; i < 64; i += 6) {
                    const depth = 3 + randSoil() * 4
                    ctx.beginPath()
                    ctx.moveTo(i, grassHeight)
                    ctx.lineTo(i + (randSoil() - 0.5) * 3, grassHeight + depth)
                    ctx.stroke()
                }

                // 草叶从侧面伸出
                ctx.strokeStyle = '#5faa4a'
                ctx.globalAlpha = 0.7
                for (let i = 0; i < 15; i++) {
                    const x = randSoil() * 64
                    const y = randSoil() * grassHeight
                    const length = 3 + randSoil() * 8
                    const angle = randSoil() * Math.PI / 2
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
                    ctx.stroke()
                }

                ctx.globalAlpha = 1.0
                break

            case 'dirt':
                // 更丰富的泥土颜色（深棕到浅褐）
                this.fillNoise(ctx, '#8b5a2b', '#70421a', 0.15, seed)

                // 添加不同大小的石头
                const randStone = this.seededRandom(seed * 5 + 4)
                for (let i = 0; i < 25; i++) {
                    const x = Math.floor(randStone() * 16) * 4
                    const y = Math.floor(randStone() * 16) * 4
                    const size = 1 + Math.floor(randStone() * 3)
                    ctx.globalAlpha = 0.3 + randStone() * 0.3
                    ctx.fillStyle = randStone() > 0.5 ? '#5a3a1a' : '#4a2a0a'
                    ctx.fillRect(x, y, size, size)

                    // 石头的高光边
                    if (size > 1) {
                        ctx.globalAlpha = 0.2
                        ctx.fillStyle = '#a07a50'
                        ctx.fillRect(x, y, size, 1)
                    }
                }

                // 添加泥土裂纹
                ctx.strokeStyle = '#3a2410'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.2
                for (let i = 0; i < 5; i++) {
                    const startX = randStone() * 60 + 2
                    const startY = randStone() * 60 + 2
                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    const segments = 3 + Math.floor(randStone() * 3)
                    for (let s = 0; s < segments; s++) {
                        const nx = startX + (randStone() - 0.5) * 20
                        const ny = startY + (randStone() - 0.5) * 20
                        ctx.lineTo(nx, ny)
                    }
                    ctx.stroke()
                }

                // 添加腐烂的植物根茎
                ctx.strokeStyle = '#2d1808'
                ctx.globalAlpha = 0.15
                for (let i = 0; i < 8; i++) {
                    const x = randStone() * 64
                    const y = randStone() * 64
                    const length = 8 + randStone() * 15
                    const angle = randStone() * Math.PI * 2
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length)
                    ctx.stroke()
                }

                ctx.globalAlpha = 1.0
                break

            case 'stone':
                // 基础石色（深灰到浅灰）
                this.fillNoise(ctx, '#7a7a7a', '#696969', 0.12, seed)

                // 初始化随机数生成器（避免重复声明）
                const randFine = this.seededRandom(seed * 2 + 1)
                const randMedium = this.seededRandom(seed * 3 + 2)
                const randLarge = this.seededRandom(seed * 4 + 3)

                // 添加细碎石（最细小颗粒）
                ctx.fillStyle = '#5a5a5a'
                for (let i = 0; i < 80; i++) {
                    ctx.globalAlpha = 0.25
                    const x = randFine() * 64
                    const y = randFine() * 64
                    ctx.fillRect(x, y, 1, 1)
                }

                // 添加中等石块
                for (let i = 0; i < 40; i++) {
                    ctx.globalAlpha = 0.3
                    const x = Math.floor(randMedium() * 32) * 2
                    const y = Math.floor(randMedium() * 32) * 2
                    const size = 1 + Math.floor(randMedium() * 2)
                    ctx.fillStyle = randMedium() > 0.5 ? '#808080' : '#707070'
                    ctx.fillRect(x, y, size, size)
                }

                // 添加大型石块
                for (let i = 0; i < 20; i++) {
                    ctx.globalAlpha = 0.4
                    const x = Math.floor(randLarge() * 16) * 4
                    const y = Math.floor(randLarge() * 16) * 4
                    const size = 2 + Math.floor(randLarge() * 4)
                    ctx.fillStyle = randLarge() > 0.5 ? '#909090' : '#5d5d5d'
                    ctx.fillRect(x, y, size, size)

                    // 添加石块高光边
                    if (size > 2) {
                        ctx.globalAlpha = 0.2
                        ctx.fillStyle = '#b0b0b0'
                        ctx.fillRect(x, y, size, 1)
                    }
                }

                // 添加主要裂纹（更粗更明显）
                ctx.strokeStyle = '#3a3a3a'
                ctx.lineWidth = 3
                ctx.globalAlpha = 0.7
                for (let i = 0; i < 4; i++) {
                    let x = randLarge() * 60 + 2
                    let y = randLarge() * 60 + 2
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    const segments = 6 + Math.floor(randLarge() * 3)
                    for (let s = 0; s < segments; s++) {
                        x += (randLarge() - 0.5) * 18
                        y += (randLarge() - 0.5) * 18
                        x = Math.max(2, Math.min(62, x))
                        y = Math.max(2, Math.min(62, y))
                        ctx.lineTo(x, y)
                    }
                    ctx.stroke()

                    // 在裂纹旁边添加阴影
                    ctx.globalAlpha = 0.2
                    ctx.strokeStyle = '#000000'
                    ctx.lineWidth = 5
                    ctx.beginPath()
                    for (let s = 0; s < segments; s++) {
                        x += (randLarge() - 0.5) * 18
                        y += (randLarge() - 0.5) * 18
                        ctx.lineTo(x, y)
                    }
                    ctx.stroke()
                }

                // 添加次要裂纹（更细更浅）
                ctx.strokeStyle = '#4a4a4a'
                ctx.lineWidth = 1.5
                ctx.globalAlpha = 0.4
                for (let i = 0; i < 8; i++) {
                    let x = randMedium() * 60 + 2
                    let y = randMedium() * 60 + 2
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    const segments = 4 + Math.floor(randMedium() * 3)
                    for (let s = 0; s < segments; s++) {
                        x += (randMedium() - 0.5) * 12
                        y += (randMedium() - 0.5) * 12
                        x = Math.max(2, Math.min(62, x))
                        y = Math.max(2, Math.min(62, y))
                        ctx.lineTo(x, y)
                    }
                    ctx.stroke()
                }

                // 添加风化痕迹（表面侵蚀）
                ctx.globalAlpha = 0.15
                ctx.fillStyle = '#2a2a2a'
                for (let i = 0; i < 35; i++) {
                    const x = Math.floor(randFine() * 16) * 4
                    const y = Math.floor(randFine() * 16) * 4
                    const size = 2 + Math.floor(randFine() * 3)
                    ctx.fillRect(x, y, size, size)
                }

                // 添加磨损高光（模拟光滑表面）
                ctx.globalAlpha = 0.2
                ctx.fillStyle = '#c0c0c0'
                for (let i = 0; i < 20; i++) {
                    const x = randMedium() * 64
                    const y = randMedium() * 64
                    const size = 1 + randMedium() * 3
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                }

                ctx.globalAlpha = 1.0
                break

            case 'wood_side':
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.1, seed)
                // Variable wood streaks
                const rand2 = this.seededRandom(seed)
                ctx.fillStyle = '#6a2400'
                const streakCount = 4 + Math.floor(rand2() * 4)
                for (let i = 0; i < streakCount; i++) {
                    const x = 5 + i * (50 / streakCount) + rand2() * 5
                    ctx.globalAlpha = 0.8
                    ctx.fillRect(x, 0, 2 + rand2() * 3, 64)
                }
                ctx.globalAlpha = 1.0
                break

            case 'wood_top':
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.1, seed)
                // Variant-based rings
                const rand3 = this.seededRandom(seed)
                ctx.strokeStyle = '#6a2400'
                ctx.lineWidth = 2
                const ringCount = 3 + Math.floor(rand3() * 3)
                for (let i = 0; i < ringCount; i++) {
                    const radius = 15 + i * 5 + rand3() * 5
                    ctx.beginPath()
                    ctx.arc(32 + (rand3() - 0.5) * 10, 32 + (rand3() - 0.5) * 10, radius, 0, Math.PI * 2)
                    ctx.stroke()
                }
                break

            case 'leaves':
                // 基础绿色噪声
                this.fillNoise(ctx, '#228b22', '#1a6b1a', 0.25, seed)

                // 添加透明区域（模拟树叶间空隙）
                ctx.globalCompositeOperation = 'destination-out'
                const randHole = this.seededRandom(seed * 2 + 1)
                for (let i = 0; i < 8; i++) {
                    const x = randHole() * 64
                    const y = randHole() * 64
                    const radius = 2 + randHole() * 4
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.globalCompositeOperation = 'source-over'

                // 主叶脉（更粗，更明显）
                const randVein = this.seededRandom(seed * 3 + 2)
                ctx.strokeStyle = '#0d4d0d'
                ctx.lineWidth = 2
                ctx.globalAlpha = 0.7
                for (let i = 0; i < 6; i++) {
                    const startX = randVein() * 64
                    const startY = randVein() * 64
                    const angle = randVein() * Math.PI * 2
                    const length = 15 + randVein() * 20
                    const endX = startX + Math.cos(angle) * length
                    const endY = startY + Math.sin(angle) * length

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()

                    // 支叶脉
                    const branches = 2 + Math.floor(randVein() * 3)
                    for (let b = 0; b < branches; b++) {
                        const branchPoint = 0.3 + randVein() * 0.5
                        const bx = startX + (endX - startX) * branchPoint
                        const by = startY + (endY - startY) * branchPoint
                        const branchAngle = angle + (randVein() - 0.5) * Math.PI / 2
                        const branchLength = length * 0.3

                        ctx.beginPath()
                        ctx.moveTo(bx, by)
                        ctx.lineTo(
                            bx + Math.cos(branchAngle) * branchLength,
                            by + Math.sin(branchAngle) * branchLength
                        )
                        ctx.stroke()
                    }
                }

                // 添加阳光照射效果（高光）
                const randHighlight = this.seededRandom(seed * 5 + 3)
                for (let i = 0; i < 15; i++) {
                    const x = randHighlight() * 64
                    const y = randHighlight() * 64
                    const size = 1 + randHighlight() * 3
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
                    gradient.addColorStop(0, '#a8ff60')
                    gradient.addColorStop(0.5, '#6bd030')
                    gradient.addColorStop(1, 'transparent')
                    ctx.fillStyle = gradient
                    ctx.globalAlpha = 0.4
                    ctx.beginPath()
                    ctx.arc(x, y, size * 2, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加明暗变化（模拟树叶厚度）
                ctx.globalAlpha = 0.15
                ctx.fillStyle = '#000000'
                for (let i = 0; i < 30; i++) {
                    const x = Math.floor(randVein() * 16) * 4
                    const y = Math.floor(randVein() * 16) * 4
                    ctx.fillRect(x, y, 3, 3)
                }

                ctx.globalAlpha = 1.0
                break

            case 'sand': {
                // 基础沙色（更温暖的金黄色）
                this.fillNoise(ctx, '#f0d890', '#e6c570', 0.12, seed)

                // 添加细沙粒（最细的一层）
                const randFine = this.seededRandom(seed * 2 + 1)
                ctx.fillStyle = '#d4ba65'
                for (let i = 0; i < 120; i++) {
                    ctx.globalAlpha = 0.15
                    const x = randFine() * 64
                    const y = randFine() * 64
                    ctx.fillRect(x, y, 1, 1)
                }

                // 添加中等沙粒
                const randMedium = this.seededRandom(seed * 3 + 2)
                ctx.fillStyle = '#c9b05a'
                for (let i = 0; i < 50; i++) {
                    ctx.globalAlpha = 0.25
                    const x = Math.floor(randMedium() * 32) * 2
                    const y = Math.floor(randMedium() * 32) * 2
                    ctx.fillRect(x, y, 1, 1)
                }

                // 添加较粗的沙粒/小石子
                const randCoarse = this.seededRandom(seed * 4 + 3)
                for (let i = 0; i < 20; i++) {
                    ctx.globalAlpha = 0.3
                    const x = Math.floor(randCoarse() * 16) * 4
                    const y = Math.floor(randCoarse() * 16) * 4
                    const size = 1 + Math.floor(randCoarse() * 2)
                    ctx.fillStyle = randCoarse() > 0.5 ? '#b8a04d' : '#aa9a45'
                    ctx.fillRect(x, y, size, size)
                }

                // 添加风化波纹（模拟风吹或水流痕迹）
                ctx.strokeStyle = '#bfa65a'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.2
                for (let i = 0; i < 4; i++) {
                    const startY = randCoarse() * 64
                    const waveHeight = 2 + randCoarse() * 3
                    ctx.beginPath()
                    for (let x = 0; x < 64; x++) {
                        const y = startY + Math.sin((x / 64) * Math.PI * 2 + i) * waveHeight
                        if (x === 0) ctx.moveTo(x, y)
                        else ctx.lineTo(x, y)
                    }
                    ctx.stroke()
                }

                // 添加明暗斑点（模拟沙丘的起伏）
                ctx.globalAlpha = 0.1
                ctx.fillStyle = '#000000'
                for (let i = 0; i < 40; i++) {
                    const x = Math.floor(randFine() * 16) * 4
                    const y = Math.floor(randFine() * 16) * 4
                    ctx.fillRect(x, y, 2, 2)
                }

                // 添加高光点（模拟阳光照射）
                ctx.globalAlpha = 0.15
                ctx.fillStyle = '#fff4b0'
                for (let i = 0; i < 25; i++) {
                    const x = randMedium() * 64
                    const y = randMedium() * 64
                    const size = 1 + randMedium() * 2
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加贝壳或化石碎片（稀有）
                const randShell = this.seededRandom(seed * 5 + 4)
                if (randShell() > 0.7) { // 30% 概率出现
                    ctx.globalAlpha = 0.4
                    ctx.fillStyle = '#f5f0e0'
                    const x = randShell() * 64
                    const y = randShell() * 64
                    const size = 2 + randShell() * 3
                    ctx.beginPath()
                    // 简单的贝壳形状（弧形）
                    ctx.moveTo(x, y)
                    ctx.quadraticCurveTo(x + size, y - size, x + size * 2, y)
                    ctx.quadraticCurveTo(x + size, y + size, x, y)
                    ctx.closePath()
                    ctx.fill()
                }

                ctx.globalAlpha = 1.0
                break
            }

            case 'water':
                // 改进的水面：多层波纹 + 高光 + 深度感
                this.generateWaterTexture(ctx, variant, seed)
                break

            case 'snow': {
                // 基础雪色（纯白到淡蓝灰）
                this.fillNoise(ctx, '#f8fbfe', '#e8eff7', 0.08, seed)

                // 初始化随机数生成器（每个使用不同的seed避免重复）
                const randFine = this.seededRandom(seed * 2 + 1)
                const randMedium = this.seededRandom(seed * 3 + 2)
                const randCluster = this.seededRandom(seed * 4 + 3)

                // 添加细雪花结晶（最小的冰晶）
                ctx.fillStyle = '#e2eaf5'
                for (let i = 0; i < 80; i++) {
                    ctx.globalAlpha = 0.2
                    const x = randFine() * 64
                    const y = randFine() * 64
                    ctx.fillRect(x, y, 1, 1)
                }

                // 添加中等雪花（6瓣或8瓣结晶）
                ctx.strokeStyle = '#cfd9e8'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.4
                for (let i = 0; i < 25; i++) {
                    const x = randMedium() * 64
                    const y = randMedium() * 64
                    const size = 2 + randMedium() * 3
                    const arms = randMedium() > 0.5 ? 6 : 8

                    // 绘制雪花（十字形 + 对角线）
                    for (let a = 0; a < arms; a++) {
                        const angle = (Math.PI * 2 / arms) * a
                        const armLength = size / 2
                        ctx.beginPath()
                        ctx.moveTo(x, y)
                        ctx.lineTo(
                            x + Math.cos(angle) * armLength,
                            y + Math.sin(angle) * armLength
                        )
                        ctx.stroke()

                        // 在末端添加小分叉
                        if (randMedium() > 0.6) {
                            const branchAngle = angle + Math.PI / 6
                            ctx.beginPath()
                            ctx.moveTo(
                                x + Math.cos(angle) * armLength * 0.6,
                                y + Math.sin(angle) * armLength * 0.6
                            )
                            ctx.lineTo(
                                x + Math.cos(branchAngle) * armLength * 0.3,
                                y + Math.sin(branchAngle) * armLength * 0.3
                            )
                            ctx.stroke()
                        }
                    }
                }

                // 添加大型雪花团（聚集的雪花）
                for (let i = 0; i < 15; i++) {
                    ctx.globalAlpha = 0.3
                    const x = randCluster() * 64
                    const y = randCluster() * 64
                    const size = 3 + randCluster() * 5
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
                    gradient.addColorStop(0, '#ffffff')
                    gradient.addColorStop(1, '#dfe7f3')
                    ctx.fillStyle = gradient
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加霜冻纹理（微妙的冰霜线条）
                ctx.strokeStyle = '#c5d4e8'
                ctx.globalAlpha = 0.25
                ctx.lineWidth = 1
                for (let i = 0; i < 6; i++) {
                    const startX = randCluster() * 60 + 2
                    const startY = randCluster() * 60 + 2
                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    const segments = 4 + Math.floor(randCluster() * 3)
                    for (let s = 0; s < segments; s++) {
                        const nx = startX + (randCluster() - 0.5) * 15
                        const ny = startY + (randCluster() - 0.5) * 15
                        ctx.lineTo(nx, ny)
                    }
                    ctx.stroke()
                }

                // 添加踩踏/压实痕迹（深色区域）
                ctx.globalAlpha = 0.15
                ctx.fillStyle = '#b8c7da'
                for (let i = 0; i < 25; i++) {
                    const x = Math.floor(randFine() * 16) * 4
                    const y = Math.floor(randFine() * 16) * 4
                    const size = 2 + Math.floor(randFine() * 3)
                    ctx.fillRect(x, y, size, size)
                }

                // 添加冰晶反光（亮点）
                ctx.globalAlpha = 0.6
                ctx.fillStyle = '#ffffff'
                for (let i = 0; i < 30; i++) {
                    const x = randMedium() * 64
                    const y = randMedium() * 64
                    const size = 1 + randMedium() * 2
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加雪堆边缘（模拟雪从高处落下的堆积感）
                ctx.globalAlpha = 0.1
                ctx.fillStyle = '#a8b8cd'
                for (let i = 0; i < 3; i++) {
                    const y = 60 - randMedium() * 15
                    const startX = randMedium() * 32
                    const width = 8 + randMedium() * 24
                    ctx.beginPath()
                    ctx.ellipse(startX, y, width, 4, 0, 0, Math.PI)
                    ctx.fill()
                }

                ctx.globalAlpha = 1.0
                break
            }

            case 'cactus':
                this.fillNoise(ctx, '#3b8c3b', '#2f7a2f', 0.12, seed)
                // 竖向纹理
                const randCac = this.seededRandom(seed)
                ctx.fillStyle = '#2a6a2a'
                for (let i = 0; i < 6; i++) {
                    const x = 8 + i * 8 + randCac() * 3
                    ctx.globalAlpha = 0.6
                    ctx.fillRect(x, 0, 2, 64)
                }
                // 刺点
                ctx.fillStyle = '#d8e4c0'
                for (let i = 0; i < 80; i++) {
                    ctx.globalAlpha = 0.4
                    const x = Math.floor(randCac() * 64)
                    const y = Math.floor(randCac() * 64)
                    ctx.fillRect(x, y, 1, 1)
                }
                ctx.globalAlpha = 1.0
                break

            case 'flower':
                this.fillNoise(ctx, '#5ea15e', '#4f8f4f', 0.15, seed)
                // 花点
                const randFl = this.seededRandom(seed)
                const petals = ['#ff7eb6', '#ffd966', '#ffb347']
                for (let i = 0; i < 40; i++) {
                    ctx.globalAlpha = 0.8
                    ctx.fillStyle = petals[Math.floor(randFl() * petals.length)]
                    const x = Math.floor(randFl() * 64)
                    const y = Math.floor(randFl() * 64)
                    ctx.fillRect(x, y, 2, 2)
                }
                ctx.globalAlpha = 1.0
                break

            case 'glass':
                ctx.fillStyle = '#add8e6'
                ctx.globalAlpha = 0.3
                ctx.fillRect(0, 0, 64, 64)
                ctx.globalAlpha = 1.0
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 2
                ctx.strokeRect(0, 0, 64, 64)
                // Variant glint
                const rand7 = this.seededRandom(seed)
                ctx.beginPath()
                const glintX = 10 + rand7() * 20
                const glintY = 10 + rand7() * 20
                ctx.moveTo(glintX, glintY)
                ctx.lineTo(glintX + 10, glintY + 10)
                ctx.stroke()
                break

            case 'roof':
                this.fillNoise(ctx, '#a52a2a', '#941919', 0.1, seed)
                // Enhanced bricks
                const rand8 = this.seededRandom(seed)
                ctx.fillStyle = '#730808'
                const brickOffset = rand8() > 0.5 ? 0 : 16
                for (let y = 0; y < 64; y += 16) {
                    ctx.fillRect(0, y, 64, 2)
                    for (let x = brickOffset; x < 64; x += 32) {
                        ctx.fillRect(x, y, 2, 16)
                    }
                }
                break

            case 'crack':
                // 裂纹纹理，透明背景用于覆盖
                ctx.clearRect(0, 0, 64, 64)
                // 深色裂纹线
                ctx.strokeStyle = '#333333'
                ctx.lineWidth = 3
                ctx.globalAlpha = 0.9
                const rand9 = this.seededRandom(seed)
                ctx.beginPath()
                // 主裂纹
                let x = rand9() * 30 + 17
                let y = rand9() * 30 + 17
                ctx.moveTo(x, y)
                const segments = 8
                for (let s = 0; s < segments; s++) {
                    x += (rand9() - 0.5) * 20
                    y += (rand9() - 0.5) * 20
                    x = Math.max(5, Math.min(59, x))
                    y = Math.max(5, Math.min(59, y))
                    ctx.lineTo(x, y)
                }
                ctx.stroke()
                // 次要裂纹分支
                ctx.strokeStyle = '#444444'
                ctx.lineWidth = 2
                ctx.globalAlpha = 0.7
                for (let c = 0; c < 3; c++) {
                    const branchX = rand9() * 40 + 12
                    const branchY = rand9() * 40 + 12
                    ctx.beginPath()
                    ctx.moveTo(branchX, branchY)
                    ctx.lineTo(branchX + (rand9() - 0.5) * 15, branchY + (rand9() - 0.5) * 15)
                    ctx.stroke()
                }
                ctx.globalAlpha = 1.0
                break
        }

        this.canvasCache[key] = canvas

        const texture = new THREE.CanvasTexture(canvas)
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        texture.colorSpace = THREE.SRGBColorSpace

        // Cache the texture
        this.textureCache[key] = texture

        return texture
    }

    /**
     * 获取已生成的原始 Canvas（如果不存在则生成）
     */
    getCanvas(type, variant = 0) {
        const key = `${type}_${variant}`
        if (this.canvasCache[key]) return this.canvasCache[key]
        this.createTexture(type, variant)
        // 强制确保 canvas 被缓存
        const canvas = this.canvasCache[key]
        return canvas || null
    }

    /**
     * 生成破坏进度纹理（阶段 0-5）
     * 视觉：裂纹 + 不规则挖空，阶段越高挖空越多
     */
    createDestructionTexture(stage = 0, totalStages = 5) {
        const s = Math.max(0, Math.min(totalStages, stage | 0))
        const key = `destruction_${s}_${totalStages}`
        if (this.textureCache[key]) return this.textureCache[key]

        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, 64, 64)

        // 基础裂纹
        ctx.strokeStyle = '#111'
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.9
        const rand = this.seededRandom(s * 17 + 3)
        ctx.beginPath()
        let x = rand() * 30 + 17
        let y = rand() * 30 + 17
        ctx.moveTo(x, y)
        const segments = 7
        for (let i = 0; i < segments; i++) {
            x += (rand() - 0.5) * 18
            y += (rand() - 0.5) * 18
            x = Math.max(4, Math.min(60, x))
            y = Math.max(4, Math.min(60, y))
            ctx.lineTo(x, y)
        }
        ctx.stroke()

        // 次要裂纹
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.7
        for (let i = 0; i < 4; i++) {
            ctx.beginPath()
            const bx = rand() * 50 + 7
            const by = rand() * 50 + 7
            ctx.moveTo(bx, by)
            ctx.lineTo(bx + (rand() - 0.5) * 22, by + (rand() - 0.5) * 22)
            ctx.stroke()
        }

        // 挖空破碎效果：阶段越高，挖空面积越大
        ctx.globalCompositeOperation = 'destination-out'
        const holes = 6 + s * 4
        const maxSize = 10 + s * 2
        for (let i = 0; i < holes; i++) {
            const w = 4 + rand() * maxSize
            const h = 4 + rand() * maxSize
            const hx = rand() * (64 - w)
            const hy = rand() * (64 - h)
            ctx.fillRect(hx, hy, w, h)
        }

        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0

        const tex = new THREE.CanvasTexture(canvas)
        tex.magFilter = THREE.NearestFilter
        tex.minFilter = THREE.NearestFilter
        tex.colorSpace = THREE.SRGBColorSpace

        this.textureCache[key] = tex
        this.canvasCache[key] = canvas
        return tex
    }

    fillNoise(ctx, color1, color2, factor, seed = 0) {
        // Base fill
        ctx.fillStyle = color1
        ctx.fillRect(0, 0, 64, 64)

        // Use seed-based randomness for consistent variants
        let random = this.seededRandom(seed)
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = random() > 0.5 ? color2 : color1
            ctx.globalAlpha = factor
            const x = Math.floor(random() * 16) * 4
            const y = Math.floor(random() * 16) * 4
            ctx.fillRect(x, y, 4, 4)
        }

        // Add extra details based on color intensity
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = this.adjustColor(color1, random() > 0.5 ? -20 : 20)
            ctx.globalAlpha = factor * 0.5
            const x = Math.floor(random() * 32) * 2
            const y = Math.floor(random() * 32) * 2
            ctx.fillRect(x, y, 2, 2)
        }

        ctx.globalAlpha = 1.0
    }

    addNoise(ctx, x, y, w, h, color, factor, seed = 0) {
        let random = this.seededRandom(seed)
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = color
            ctx.globalAlpha = factor
            const rx = x + Math.floor(random() * (w / 4)) * 4
            const ry = y + Math.floor(random() * (h / 4)) * 4
            ctx.fillRect(rx, ry, 4, 4)
        }
        ctx.globalAlpha = 1.0
    }

    seededRandom(seed) {
        // Simple seeded random number generator
        let value = seed * 1000 + 1
        return function() {
            value = (value * 9301 + 49297) % 233280
            return value / 233280
        }
    }

    adjustColor(color, amount) {
        // Adjust hex color brightness
        const num = parseInt(color.replace('#', ''), 16)
        const r = Math.max(0, Math.min(255, (num >> 16) + amount))
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
        return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
    }

    /**
     * 生成改进的水面纹理
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} variant - 纹理变体 (0-3)
     * @param {number} seed - 随机种子
     */
    generateWaterTexture(ctx, variant, seed) {
        const baseColor = '#1a5fb4'
        const highlightColor = '#3399ff'
        const deepColor = '#0d4a8a'

        // 基础水色渐变（深度感）
        const grad = ctx.createLinearGradient(0, 0, 0, 64)
        grad.addColorStop(0, deepColor)
        grad.addColorStop(0.3, baseColor)
        grad.addColorStop(1, highlightColor)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 64, 64)

        // 生成多层波纹
        const rand = this.seededRandom(seed)

        // 第一层：水平波纹（主要波纹）
        ctx.strokeStyle = '#4da6ff'
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.4
        for (let y = 8; y < 64; y += 8) {
            ctx.beginPath()
            for (let x = 0; x <= 64; x++) {
                const wave = Math.sin((x + variant * 10) * 0.15 + rand() * 2) * 1.5
                const yy = y + wave
                if (x === 0) ctx.moveTo(x, yy)
                else ctx.lineTo(x, yy)
            }
            ctx.stroke()
        }

        // 第二层：对角线波纹
        ctx.strokeStyle = '#80bfff'
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 1
        for (let offset = -32; offset < 64; offset += 12) {
            ctx.beginPath()
            for (let x = 0; x <= 64; x++) {
                const y = offset + x + Math.sin(x * 0.1 + variant * 5) * 2
                if (y >= 0 && y <= 64) {
                    if (x === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
            }
            ctx.stroke()
        }

        // 第三层：垂直方向的细微波纹
        ctx.strokeStyle = '#b3d9ff'
        ctx.globalAlpha = 0.25
        ctx.lineWidth = 0.5
        for (let x = 8; x < 64; x += 10) {
            ctx.beginPath()
            for (let y = 0; y <= 64; y++) {
                const wave = Math.sin((y + variant * 15) * 0.12) * 1.2
                const xx = x + wave
                if (y === 0) ctx.moveTo(xx, y)
                else ctx.lineTo(xx, y)
            }
            ctx.stroke()
        }

        // 添加高光点（模拟阳光反射）
        ctx.fillStyle = '#cce6ff'
        ctx.globalAlpha = 0.6
        const sparkleCount = 3 + Math.floor(rand() * 3)
        for (let i = 0; i < sparkleCount; i++) {
            const x = rand() * 64
            const y = rand() * 64
            const size = 2 + rand() * 3
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
        }

        // 添加水泡效果（随机分布的小圆圈）
        ctx.strokeStyle = '#e6f2ff'
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 1
        const bubbleCount = 5 + Math.floor(rand() * 5)
        for (let i = 0; i < bubbleCount; i++) {
            const x = rand() * 64
            const y = rand() * 64
            const r = 1 + rand() * 2
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2)
            ctx.stroke()
        }

        ctx.globalAlpha = 1.0
    }
}
