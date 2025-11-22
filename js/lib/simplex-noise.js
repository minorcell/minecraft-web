/**
 * Minimal 2D simplex noise (public domain, based on Stefan Gustavson's implementation)
 * Provides createNoise2D(randomFn?:()=>number) => (x:number, y:number)=>number
 */

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

const grad3 = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
    1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
    0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
])

function dot2(gIndex, x, y) {
    const gi = gIndex * 3
    return grad3[gi] * x + grad3[gi + 1] * y
}

function buildPermutationTable(random = Math.random) {
    const perm = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
        perm[i] = i
    }
    for (let i = 255; i > 0; i--) {
        const r = Math.floor(random() * (i + 1))
        const swap = perm[i]
        perm[i] = perm[r]
        perm[r] = swap
    }
    const permTable = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
        permTable[i] = perm[i & 255]
    }
    return permTable
}

export function createNoise2D(random = Math.random) {
    const perm = buildPermutationTable(random)

    return (x, y) => {
        let n0 = 0, n1 = 0, n2 = 0

        const s = (x + y) * F2
        const i = Math.floor(x + s)
        const j = Math.floor(y + s)
        const t = (i + j) * G2
        const X0 = i - t
        const Y0 = j - t
        const x0 = x - X0
        const y0 = y - Y0

        const i1 = x0 > y0 ? 1 : 0
        const j1 = x0 > y0 ? 0 : 1

        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1 + 2 * G2
        const y2 = y0 - 1 + 2 * G2

        const ii = i & 255
        const jj = j & 255
        const gi0 = perm[ii + perm[jj]] % 12
        const gi1 = perm[ii + i1 + perm[jj + j1]] % 12
        const gi2 = perm[ii + 1 + perm[jj + 1]] % 12

        let t0 = 0.5 - x0 * x0 - y0 * y0
        if (t0 > 0) {
            t0 *= t0
            n0 = t0 * t0 * dot2(gi0, x0, y0)
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1
        if (t1 > 0) {
            t1 *= t1
            n1 = t1 * t1 * dot2(gi1, x1, y1)
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2
        if (t2 > 0) {
            t2 *= t2
            n2 = t2 * t2 * dot2(gi2, x2, y2)
        }

        return 70 * (n0 + n1 + n2)
    }
}
