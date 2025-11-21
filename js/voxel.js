import * as THREE from 'three'
import { TextureFactory } from './textures.js'

export class VoxelBuilder {
    constructor() {
        this.geometry = new THREE.BoxGeometry(1, 1, 1)

        const factory = new TextureFactory()
        const textures = {
            grass_top: factory.createTexture('grass_top'),
            grass_side: factory.createTexture('grass_side'),
            dirt: factory.createTexture('dirt'),
            stone: factory.createTexture('stone'),
            wood_side: factory.createTexture('wood_side'),
            wood_top: factory.createTexture('wood_top'),
            leaves: factory.createTexture('leaves'),
            sand: factory.createTexture('sand'),
            water: factory.createTexture('water'),
            glass: factory.createTexture('glass'),
            roof: factory.createTexture('roof')
        }

        // Helper to create material
        const mat = (map, transparent = false, opacity = 1.0) => {
            return new THREE.MeshLambertMaterial({
                map: map,
                transparent: transparent,
                opacity: opacity
            })
        }

        this.materials = {
            grass: [
                mat(textures.grass_side), // px
                mat(textures.grass_side), // nx
                mat(textures.grass_top),  // py (top)
                mat(textures.dirt),       // ny (bottom)
                mat(textures.grass_side), // pz
                mat(textures.grass_side)  // nz
            ],
            dirt: mat(textures.dirt),
            stone: mat(textures.stone),
            wood: [
                mat(textures.wood_side),
                mat(textures.wood_side),
                mat(textures.wood_top),
                mat(textures.wood_top),
                mat(textures.wood_side),
                mat(textures.wood_side)
            ],
            leaves: mat(textures.leaves),
            glass: mat(textures.glass, true, 0.6),
            roof: mat(textures.roof),
            water: mat(textures.water, true, 0.7),
            sand: mat(textures.sand)
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
