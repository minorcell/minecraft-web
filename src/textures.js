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
                // 基础木色（棕色渐变）
                this.fillNoise(ctx, '#8b4513', '#7a3402', 0.12, seed)

                // 初始化随机数生成器（避免重复声明）
                const randWood = this.seededRandom(seed * 2 + 1)
                const randDetail = this.seededRandom(seed * 3 + 2)

                // 添加木结（仅亮斑，去掉深色边缘）
                for (let i = 0; i < 3; i++) {
                    const x = randWood() * 64
                    const y = randWood() * 64
                    const radius = 4 + randWood() * 8
                    // 只保留木结中心的亮斑，去掉深色边缘
                    ctx.fillStyle = '#c9a070'
                    ctx.globalAlpha = 0.4
                    ctx.beginPath()
                    ctx.arc(x + radius * 0.2, y - radius * 0.2, radius * 0.5, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 木纹方向的高光（用亮色替代深色藤条）
                ctx.fillStyle = '#d4a070'
                ctx.globalAlpha = 0.15
                for (let i = 0; i < 8; i++) {
                    const baseX = randWood() * 64
                    const width = 1 + randDetail() * 2

                    // 绘制S形高光线
                    ctx.beginPath()
                    for (let y = 0; y <= 64; y += 2) {
                        const offset = Math.sin((y + i * 8) * 0.15) * 3 +
                                     Math.sin((y + i * 5) * 0.08) * 2
                        const x = baseX + offset + (randDetail() - 0.5) * 2
                        if (y === 0) ctx.moveTo(x, y)
                        else ctx.lineTo(x, y)
                    }
                    ctx.lineWidth = width
                    ctx.stroke()
                }

                // 细木纹（用很淡的线条替代深色线条）
                ctx.fillStyle = '#b88a60'
                ctx.globalAlpha = 0.08  // 大幅降低透明度
                for (let i = 0; i < 8; i++) {  // 减少数量从15到8
                    const x = randDetail() * 64
                    const height = 15 + randDetail() * 30
                    const y = randDetail() * 49
                    ctx.fillRect(x, y, 1, height)
                }

                // 木纹方向的明暗变化（用很淡的亮色）
                ctx.globalAlpha = 0.02
                for (let i = 0; i < 4; i++) {  // 减少数量从6到4
                    const x = randWood() * 64
                    const gradient = ctx.createLinearGradient(x, 0, x + 8, 64)
                    gradient.addColorStop(0, 'rgba(180, 140, 100, 0.3)')  // 使用很淡的浅棕色
                    gradient.addColorStop(1, 'transparent')
                    ctx.fillStyle = gradient
                    ctx.fillRect(x, 0, 8, 64)
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

            case 'spruce_leaves':
                // 深绿色云杉叶（更暗，更密实）
                this.fillNoise(ctx, '#1a5f2a', '#0d4a1a', 0.2, seed)

                // 添加透明区域（模拟针叶间隙）
                ctx.globalCompositeOperation = 'destination-out'
                const randHoleSpruce = this.seededRandom(seed * 2 + 1)
                for (let i = 0; i < 12; i++) {
                    const x = randHoleSpruce() * 64
                    const y = randHoleSpruce() * 64
                    const radius = 1 + randHoleSpruce() * 3
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.globalCompositeOperation = 'source-over'

                // 细叶脉（更细更密）
                const randVeinSpruce = this.seededRandom(seed * 3 + 2)
                ctx.strokeStyle = '#082a0a'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.5
                for (let i = 0; i < 10; i++) {
                    const startX = randVeinSpruce() * 64
                    const startY = randVeinSpruce() * 64
                    const angle = randVeinSpruce() * Math.PI * 2
                    const length = 10 + randVeinSpruce() * 15
                    const endX = startX + Math.cos(angle) * length
                    const endY = startY + Math.sin(angle) * length

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()
                }

                // 添加暗部（云杉较暗）
                ctx.globalAlpha = 0.2
                ctx.fillStyle = '#000000'
                for (let i = 0; i < 50; i++) {
                    const x = Math.floor(randVeinSpruce() * 16) * 4
                    const y = Math.floor(randVeinSpruce() * 16) * 4
                    ctx.fillRect(x, y, 3, 3)
                }

                ctx.globalAlpha = 1.0
                break

            case 'birch_leaves':
                // 浅绿色桦树叶（更亮，更淡）
                this.fillNoise(ctx, '#7fb84a', '#6aa03a', 0.18, seed)

                // 添加透明区域
                ctx.globalCompositeOperation = 'destination-out'
                const randHoleBirch = this.seededRandom(seed * 2 + 1)
                for (let i = 0; i < 10; i++) {
                    const x = randHoleBirch() * 64
                    const y = randHoleBirch() * 64
                    const radius = 2 + randHoleBirch() * 4
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.globalCompositeOperation = 'source-over'

                // 叶脉（较细，颜色较浅）
                const randVeinBirch = this.seededRandom(seed * 3 + 2)
                ctx.strokeStyle = '#4a7a2a'
                ctx.lineWidth = 1.5
                ctx.globalAlpha = 0.6
                for (let i = 0; i < 8; i++) {
                    const startX = randVeinBirch() * 64
                    const startY = randVeinBirch() * 64
                    const angle = randVeinBirch() * Math.PI * 2
                    const length = 12 + randVeinBirch() * 18
                    const endX = startX + Math.cos(angle) * length
                    const endY = startY + Math.sin(angle) * length

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()
                }

                // 高光点（桦树叶较亮）
                const randHighlightBirch = this.seededRandom(seed * 5 + 3)
                for (let i = 0; i < 20; i++) {
                    const x = randHighlightBirch() * 64
                    const y = randHighlightBirch() * 64
                    const size = 1 + randHighlightBirch() * 3
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
                    gradient.addColorStop(0, '#c8ff80')
                    gradient.addColorStop(0.5, '#a0e050')
                    gradient.addColorStop(1, 'transparent')
                    ctx.fillStyle = gradient
                    ctx.globalAlpha = 0.5
                    ctx.beginPath()
                    ctx.arc(x, y, size * 2, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加浅暗部
                ctx.globalAlpha = 0.1
                ctx.fillStyle = '#000000'
                for (let i = 0; i < 25; i++) {
                    const x = Math.floor(randVeinBirch() * 16) * 4
                    const y = Math.floor(randVeinBirch() * 16) * 4
                    ctx.fillRect(x, y, 2, 2)
                }

                ctx.globalAlpha = 1.0
                break

            case 'jungle_leaves':
                // 深绿密集丛林叶（最暗，最密实）
                this.fillNoise(ctx, '#2d7a3d', '#1a5a2a', 0.22, seed)

                // 添加透明区域（密集但有间隙）
                ctx.globalCompositeOperation = 'destination-out'
                const randHoleJungle = this.seededRandom(seed * 2 + 1)
                for (let i = 0; i < 6; i++) {
                    const x = randHoleJungle() * 64
                    const y = randHoleJungle() * 64
                    const radius = 3 + randHoleJungle() * 5
                    ctx.beginPath()
                    ctx.arc(x, y, radius, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.globalCompositeOperation = 'source-over'

                // 主叶脉（更密集的脉络）
                const randVeinJungle = this.seededRandom(seed * 3 + 2)
                ctx.strokeStyle = '#0d3a0d'
                ctx.lineWidth = 2
                ctx.globalAlpha = 0.8
                for (let i = 0; i < 12; i++) {
                    const startX = randVeinJungle() * 64
                    const startY = randVeinJungle() * 64
                    const angle = randVeinJungle() * Math.PI * 2
                    const length = 18 + randVeinJungle() * 25
                    const endX = startX + Math.cos(angle) * length
                    const endY = startY + Math.sin(angle) * length

                    ctx.beginPath()
                    ctx.moveTo(startX, startY)
                    ctx.lineTo(endX, endY)
                    ctx.stroke()

                    // 更多分支
                    const branches = 3 + Math.floor(randVeinJungle() * 3)
                    for (let b = 0; b < branches; b++) {
                        const branchPoint = 0.2 + randVeinJungle() * 0.6
                        const bx = startX + (endX - startX) * branchPoint
                        const by = startY + (endY - startY) * branchPoint
                        const branchAngle = angle + (randVeinJungle() - 0.5) * Math.PI / 2
                        const branchLength = length * 0.4

                        ctx.beginPath()
                        ctx.moveTo(bx, by)
                        ctx.lineTo(
                            bx + Math.cos(branchAngle) * branchLength,
                            by + Math.sin(branchAngle) * branchLength
                        )
                        ctx.stroke()
                    }
                }

                // 添加深暗部（丛林较暗）
                ctx.globalAlpha = 0.25
                ctx.fillStyle = '#000000'
                for (let i = 0; i < 60; i++) {
                    const x = Math.floor(randVeinJungle() * 16) * 4
                    const y = Math.floor(randVeinJungle() * 16) * 4
                    ctx.fillRect(x, y, 4, 4)
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
                // 基础玻璃色（淡蓝色半透明）
                const glassGradient = ctx.createLinearGradient(0, 0, 64, 64)
                glassGradient.addColorStop(0, '#add8e6')
                glassGradient.addColorStop(0.5, '#b8e0f0')
                glassGradient.addColorStop(1, '#a0d0e8')
                ctx.fillStyle = glassGradient
                ctx.globalAlpha = 0.25
                ctx.fillRect(0, 0, 64, 64)

                // 添加边框
                ctx.globalAlpha = 0.4
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 2
                ctx.strokeRect(0, 0, 64, 64)

                // 初始化随机数生成器
                const randGlass = this.seededRandom(seed * 2 + 1)

                // 添加水平反射条纹
                ctx.strokeStyle = 'rgba(255,255,255,0.4)'
                ctx.lineWidth = 1
                for (let i = 0; i < 6; i++) {
                    const y = randGlass() * 64
                    ctx.globalAlpha = 0.15 + randGlass() * 0.25
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(64, y + randGlass() * 6 - 3)
                    ctx.stroke()
                }

                // 添加垂直反射条纹
                for (let i = 0; i < 5; i++) {
                    const x = randGlass() * 64
                    ctx.globalAlpha = 0.1 + randGlass() * 0.2
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x + randGlass() * 6 - 3, 64)
                    ctx.stroke()
                }

                // 添加折射扭曲效果（波状线条）
                ctx.strokeStyle = 'rgba(173, 216, 230, 0.3)'
                ctx.lineWidth = 1.5
                for (let i = 0; i < 4; i++) {
                    const startX = randGlass() * 64
                    const startY = randGlass() * 64
                    ctx.globalAlpha = 0.2
                    ctx.beginPath()
                    for (let j = 0; j < 5; j++) {
                        const px = startX + (randGlass() - 0.5) * 20
                        const py = startY + (randGlass() - 0.5) * 20
                        if (j === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    }
                    ctx.stroke()
                }

                // 添加高光点（模拟阳光照射）
                for (let i = 0; i < 8; i++) {
                    const x = randGlass() * 64
                    const y = randGlass() * 64
                    const size = 2 + randGlass() * 4
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
                    gradient.addColorStop(0, 'rgba(255,255,255,0.8)')
                    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)')
                    gradient.addColorStop(1, 'transparent')
                    ctx.fillStyle = gradient
                    ctx.globalAlpha = 0.6
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加深度感的阴影渐变
                const shadowGradient = ctx.createRadialGradient(32, 32, 10, 32, 32, 50)
                shadowGradient.addColorStop(0, 'transparent')
                shadowGradient.addColorStop(1, 'rgba(0,0,0,0.2)')
                ctx.globalAlpha = 0.5
                ctx.fillStyle = shadowGradient
                ctx.fillRect(0, 0, 64, 64)

                ctx.globalAlpha = 1.0
                break

            case 'roof': {
                // 基础瓦片色（深红到浅红渐变）
                this.fillNoise(ctx, '#a52a2a', '#941919', 0.12, seed)

                // 初始化随机数生成器
                const randRoof = this.seededRandom(seed * 2 + 1)
                const randDetail = this.seededRandom(seed * 3 + 2)

                // 绘制瓦片网格
                ctx.fillStyle = '#730808'
                const brickOffset = randRoof() > 0.5 ? 0 : 16

                // 水平分割线
                for (let y = 0; y < 64; y += 16) {
                    ctx.globalAlpha = 0.8
                    ctx.fillRect(0, y, 64, 2)
                }

                // 垂直分割线
                for (let x = brickOffset; x < 64; x += 32) {
                    ctx.globalAlpha = 0.7
                    ctx.fillRect(x, 0, 2, 64)
                }

                // 添加每片瓦的凹凸感（明暗变化）
                for (let y = 0; y < 64; y += 16) {
                    for (let x = brickOffset; x < 64; x += 32) {
                        const centerX = x + 8
                        const centerY = y + 8
                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, 2,
                            centerX, centerY, 10
                        )
                        gradient.addColorStop(0, 'rgba(255,255,255,0.2)')
                        gradient.addColorStop(0.5, 'rgba(180,40,40,0.1)')
                        gradient.addColorStop(1, 'rgba(0,0,0,0.3)')
                        ctx.globalAlpha = 0.6
                        ctx.fillStyle = gradient
                        ctx.fillRect(x, y, 16, 16)
                    }
                }

                // 添加瓦片破损（缺角和裂纹）
                for (let i = 0; i < 8; i++) {
                    const x = randRoof() * 64
                    const y = randRoof() * 64
                    const size = 2 + randRoof() * 4
                    ctx.globalAlpha = 0.4
                    ctx.fillStyle = '#450505'

                    // 绘制不规则缺口
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + size, y + randRoof() * size)
                    ctx.lineTo(x + randRoof() * size, y + size)
                    ctx.closePath()
                    ctx.fill()

                    // 裂纹
                    ctx.strokeStyle = '#5a0a0a'
                    ctx.lineWidth = 1
                    ctx.globalAlpha = 0.3
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x + randRoof() * size, y + randRoof() * size)
                    ctx.stroke()
                }

                // 添加苔藓和老化痕迹（绿色斑点）
                for (let i = 0; i < 12; i++) {
                    const x = randDetail() * 64
                    const y = randDetail() * 64
                    const size = 1 + randDetail() * 3
                    ctx.globalAlpha = 0.25
                    ctx.fillStyle = randDetail() > 0.5 ? '#4a7c3a' : '#5a8c4a'
                    ctx.beginPath()
                    ctx.arc(x, y, size, 0, Math.PI * 2)
                    ctx.fill()

                    // 苔藓边缘更深
                    ctx.globalAlpha = 0.15
                    ctx.fillStyle = '#3a6c2a'
                    ctx.beginPath()
                    ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.5, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加高光（阳光照射）
                for (let i = 0; i < 6; i++) {
                    const x = randRoof() * 64
                    const y = randRoof() * 64
                    const size = 2 + randRoof() * 3
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
                    gradient.addColorStop(0, 'rgba(255,255,255,0.6)')
                    gradient.addColorStop(0.3, 'rgba(255,200,200,0.3)')
                    gradient.addColorStop(1, 'transparent')
                    ctx.globalAlpha = 0.7
                    ctx.fillStyle = gradient
                    ctx.beginPath()
                    ctx.arc(x, y, size * 2, 0, Math.PI * 2)
                    ctx.fill()
                }

                // 添加阴影细节（瓦片间的缝隙）
                ctx.globalAlpha = 0.2
                ctx.fillStyle = '#000000'
                for (let y = 0; y < 64; y += 16) {
                    for (let x = brickOffset; x < 64; x += 32) {
                        // 底部阴影
                        ctx.fillRect(x + 2, y + 14, 12, 1)
                        // 右侧阴影
                        ctx.fillRect(x + 14, y + 2, 1, 12)
                    }
                }

                ctx.globalAlpha = 1.0
                break
            }

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
