/**
 * 轻量事件总线：支持 on/once/off/emit
 */
export class EventBus {
    constructor() {
        this.events = new Map()
    }

    on(event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, [])
        }
        this.events.get(event).push(handler)
        return () => this.off(event, handler)
    }

    once(event, handler) {
        const off = this.on(event, (...args) => {
            handler(...args)
            off()
        })
        return off
    }

    off(event, handler) {
        const list = this.events.get(event)
        if (!list) return
        const idx = list.indexOf(handler)
        if (idx !== -1) {
            list.splice(idx, 1)
        }
    }

    emit(event, ...args) {
        const list = this.events.get(event)
        if (!list || list.length === 0) return
        // 拷贝一份避免监听器内部修改列表
        const handlers = [...list]
        for (const fn of handlers) {
            try {
                fn(...args)
            } catch (err) {
                console.error(`EventBus handler error for ${event}:`, err)
            }
        }
    }
}
