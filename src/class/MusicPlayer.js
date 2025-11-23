/**
 * 简易循环背景音乐播放器：依次播放播放列表，结束后循环
 */
export class MusicPlayer {
    constructor(options = {}) {
        this.playlist = options.playlist || []
        this.volume = options.volume ?? 0.4
        this.current = 0
        this.audio = null
        this.waitingUserGesture = false
        this.boundOnEnded = () => this.next()
        this.boundResume = () => this.resumeAfterGesture()
    }

    start() {
        if (!this.playlist.length) return
        if (!this.audio) {
            this.audio = new Audio()
            this.audio.preload = 'auto'
            this.audio.volume = this.volume
            this.audio.addEventListener('ended', this.boundOnEnded)
        }
        this.playCurrent()
    }

    playCurrent() {
        if (!this.audio || !this.playlist.length) return
        const src = this.playlist[this.current % this.playlist.length]
        this.audio.src = src
        this.audio.currentTime = 0
        const playPromise = this.audio.play()
        if (playPromise && playPromise.catch) {
            playPromise.catch(() => {
                this.waitForGesture()
            })
        }
    }

    next() {
        if (!this.playlist.length) return
        this.current = (this.current + 1) % this.playlist.length
        this.playCurrent()
    }

    waitForGesture() {
        if (this.waitingUserGesture) return
        this.waitingUserGesture = true
        document.addEventListener('click', this.boundResume, { once: true })
        document.addEventListener('keydown', this.boundResume, { once: true })
    }

    resumeAfterGesture() {
        this.waitingUserGesture = false
        this.playCurrent()
    }
}
