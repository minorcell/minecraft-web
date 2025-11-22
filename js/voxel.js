import * as THREE from 'three'
import { TextureFactory } from './textures.js'

export class VoxelBuilder {
    constructor() {
        this.geometry = new THREE.BoxGeometry(1, 1, 1)
        this.factory = new TextureFactory()
        this.variants = 4

        // Helper to create material
        const mat = (map, transparent = false, opacity = 1.0) => {
            return new THREE.MeshLambertMaterial({
                map: map,
                transparent: transparent,
                opacity: opacity
            })
        }

        // Create multiple variants for each material type
        this.materials = {
            grass: [],
            dirt: [],
            stone: [],
            wood: [],
            leaves: [],
            glass: [],
            roof: [],
            water: [],
            sand: []
        }

        // Generate variants for each material
        for (let v = 0; v < this.variants; v++) {
            // Grass: 6 faces (sides, top, bottom)
            this.materials.grass.push([
                mat(this.factory.createTexture('grass_side', v)), // px
                mat(this.factory.createTexture('grass_side', v)), // nx
                mat(this.factory.createTexture('grass_top', v)),  // py (top)
                mat(this.factory.createTexture('dirt', v)),       // ny (bottom)
                mat(this.factory.createTexture('grass_side', v)), // pz
                mat(this.factory.createTexture('grass_side', v))  // nz
            ])

            // Dirt
            this.materials.dirt.push(mat(this.factory.createTexture('dirt', v)))

            // Stone
            this.materials.stone.push(mat(this.factory.createTexture('stone', v)))

            // Wood: 6 faces
            this.materials.wood.push([
                mat(this.factory.createTexture('wood_side', v)),
                mat(this.factory.createTexture('wood_side', v)),
                mat(this.factory.createTexture('wood_top', v)),
                mat(this.factory.createTexture('wood_top', v)),
                mat(this.factory.createTexture('wood_side', v)),
                mat(this.factory.createTexture('wood_side', v))
            ])

            // Leaves
            this.materials.leaves.push(mat(this.factory.createTexture('leaves', v)))

            // Glass
            this.materials.glass.push(mat(this.factory.createTexture('glass', v), true, 0.6))

            // Roof
            this.materials.roof.push(mat(this.factory.createTexture('roof', v)))

            // Water - more transparent
            this.materials.water.push(mat(this.factory.createTexture('water', v), true, 0.4))

            // Sand
            this.materials.sand.push(mat(this.factory.createTexture('sand', v)))
        }

        // Store matrices and variant info for each material type
        this.instances = {}
        for (const key in this.materials) {
            this.instances[key] = []
        }

        this.dummy = new THREE.Object3D()
    }

    // Get a random variant for a material type
    getRandomVariant(type) {
        return Math.floor(Math.random() * this.variants)
    }

    addBlock(type, x, y, z, variant = null) {
        if (!this.instances[type]) {
            console.warn(`Unknown material type: ${type}`)
            return
        }

        // Use provided variant or random
        const v = variant !== null ? variant : this.getRandomVariant(type)

        this.dummy.position.set(x, y, z)
        this.dummy.updateMatrix()
        this.instances[type].push({
            matrix: this.dummy.matrix.clone(),
            variant: v
        })
    }

    render(scene) {
        // Remove old meshes if any (not implemented for simplicity, assuming single render)

        // Group instances by type and variant
        for (const [type, instances] of Object.entries(this.instances)) {
            if (instances.length === 0) continue

            // Group by variant
            const groups = {}
            for (const instance of instances) {
                const v = instance.variant
                if (!groups[v]) groups[v] = []
                groups[v].push(instance)
            }

            // Create a mesh for each variant group
            for (const [variant, variantInstances] of Object.entries(groups)) {
                const material = this.materials[type][variant]
                const mesh = new THREE.InstancedMesh(this.geometry, material, variantInstances.length)

                for (let i = 0; i < variantInstances.length; i++) {
                    mesh.setMatrixAt(i, variantInstances[i].matrix)
                }

                mesh.castShadow = true
                mesh.receiveShadow = true
                mesh.instanceMatrix.needsUpdate = true
                scene.add(mesh)
            }
        }
    }

    clear() {
        for (const key in this.instances) {
            this.instances[key] = []
        }
    }
}
