/**
 * 简易说明书（MC风格书本）：按 B 键打开/关闭
 */
export class GuideBook {
    constructor() {
        this.container = this.createUI()
        this.isOpen = false
    }

    createUI() {
        const wrap = document.createElement('div')
        wrap.style.position = 'absolute'
        wrap.style.left = '50%'
        wrap.style.top = '50%'
        wrap.style.transform = 'translate(-50%, -50%)'
        wrap.style.width = '520px'
        wrap.style.maxWidth = '90vw'
        wrap.style.background = 'linear-gradient(135deg, #f4e1c1, #e0c79f)'
        wrap.style.border = '3px solid #c5a16a'
        wrap.style.borderRadius = '10px'
        wrap.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)'
        wrap.style.padding = '18px 20px'
        wrap.style.display = 'none'
        wrap.style.color = '#3b2a1b'
        wrap.style.fontFamily = '"Courier New", monospace'
        wrap.style.lineHeight = '1.4'
        wrap.style.zIndex = '2000'

        const title = document.createElement('div')
        title.textContent = '生存手册'
        title.style.fontSize = '20px'
        title.style.fontWeight = 'bold'
        title.style.marginBottom = '10px'
        wrap.appendChild(title)

        const tips = [
            '移动: W A S D，跳跃: 空格，奔跑: Shift，视角: 鼠标，视角切换: V',
            '交互: 左键破坏，右键放置，滚轮/数字键切换热键栏，背包: E',
            '设置: 按 Esc 打开菜单，可调视距/像素比/阴影/天气，低配建议关阴影关天气',
            '地图: 按 M 打开/关闭小地图，滚轮缩放，点击可在附近安全传送；暂停时自动关闭',
            '建造: 先清理地面再放置方块，火把可以照明；村庄周围预留空间以免树木挡路',
            '天气: 默认关闭，可在菜单或地址栏 ?weather=on 开启；雨雪会影响能见度和气氛',
            '指针: 点击游戏窗口锁定鼠标，Esc/背包/本手册会释放指针'
        ]
        tips.forEach(line => {
            const p = document.createElement('div')
            p.textContent = `• ${line}`
            p.style.marginBottom = '6px'
            wrap.appendChild(p)
        })

        document.body.appendChild(wrap)
        return wrap
    }

    toggle() {
        this.isOpen = !this.isOpen
        this.container.style.display = this.isOpen ? 'block' : 'none'
        if (this.isOpen && document.pointerLockElement) {
            document.exitPointerLock()
        }
    }
}
