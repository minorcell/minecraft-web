import * as THREE from 'three'

export class VoxelBuilder {
    constructor() {
        this.geometry = new THREE.BoxGeometry(1, 1, 1)
        this.materials = {
            grass: new THREE.MeshLambertMaterial({ color: 0x55aa55 }),
            dirt: new THREE.MeshLambertMaterial({ color: 0x885533 }),
            stone: new THREE.MeshLambertMaterial({ color: 0x777777 }),
            wood: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
            leaves: new THREE.MeshLambertMaterial({ color: 0x228b22 }),
            glass: new THREE.MeshLambertMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.6 }),
            roof: new THREE.MeshLambertMaterial({ color: 0xa52a2a }),
            water: new THREE.MeshLambertMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 }),
            sand: new THREE.MeshLambertMaterial({ color: 0xeedd82 })
        }

        // Store matrices for each material type
        this.instances = {}
        for (const key in this.materials) {
            this.instances[key] = []
        }

        this.dummy = new THREE.Object3D()
    }

    addBlock(type, x, y, z) {
        if (!this.instances[type]) {
            console.warn(`Unknown material type: ${type}`)
            return
        }
        this.dummy.position.set(x, y, z)
        this.dummy.updateMatrix()
        this.instances[type].push(this.dummy.matrix.clone())
    }

    render(scene) {
        // Remove old meshes if any (not implemented for simplicity, assuming single render)

        for (const [type, matrices] of Object.entries(this.instances)) {
            if (matrices.length === 0) continue

            const material = this.materials[type]
            const mesh = new THREE.InstancedMesh(this.geometry, material, matrices.length)

            for (let i = 0; i < matrices.length; i++) {
                mesh.setMatrixAt(i, matrices[i])
            }

            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.instanceMatrix.needsUpdate = true
            scene.add(mesh)
        }
    }

    clear() {
        for (const key in this.instances) {
            this.instances[key] = []
        }
    }
}
