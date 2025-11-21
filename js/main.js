import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { VoxelBuilder } from './voxel.js'

// Scene Setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x87CEEB) // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 50, 300)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(50, 50, 50)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.maxDistance = 300

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
dirLight.position.set(100, 100, 50)
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 4096
dirLight.shadow.mapSize.height = 4096
dirLight.shadow.camera.near = 0.5
dirLight.shadow.camera.far = 500
dirLight.shadow.camera.left = -250
dirLight.shadow.camera.right = 250
dirLight.shadow.camera.top = 250
dirLight.shadow.camera.bottom = -250
scene.add(dirLight)

// Voxel Builder
const builder = new VoxelBuilder()

// Collision Map
const occupied = new Set()

function isOccupied(x, z, width, depth) {
    for (let i = x - Math.floor(width / 2); i <= x + Math.floor(width / 2); i++) {
        for (let j = z - Math.floor(depth / 2); j <= z + Math.floor(depth / 2); j++) {
            if (occupied.has(`${i},${j}`)) return true
        }
    }
    return false
}

function markOccupied(x, z, width, depth) {
    for (let i = x - Math.floor(width / 2); i <= x + Math.floor(width / 2); i++) {
        for (let j = z - Math.floor(depth / 2); j <= z + Math.floor(depth / 2); j++) {
            occupied.add(`${i},${j}`)
        }
    }
}

// Generators
function createHouse(x, z, type) {
    const width = type === 'large' ? 6 : 4
    const depth = type === 'large' ? 6 : 4
    const height = type === 'large' ? 6 : 4

    if (isOccupied(x, z, width + 2, depth + 2)) return false // +2 for spacing
    markOccupied(x, z, width, depth)

    const wallMat = Math.random() > 0.5 ? 'wood' : 'stone'
    const roofMat = Math.random() > 0.5 ? 'roof' : 'wood'

    // Floor
    for (let i = -width / 2; i < width / 2; i++) {
        for (let j = -depth / 2; j < depth / 2; j++) {
            builder.addBlock(wallMat, x + i, 1, z + j)
        }
    }

    // Walls
    for (let y = 2; y < 2 + height; y++) {
        for (let i = -width / 2; i < width / 2; i++) {
            for (let j = -depth / 2; j < depth / 2; j++) {
                if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1) {
                    // Windows
                    if (y === 3 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', x + i, y, z + j)
                    } else {
                        builder.addBlock(wallMat, x + i, y, z + j)
                    }
                }
            }
        }
    }

    // Roof
    for (let i = -width / 2 - 1; i <= width / 2; i++) {
        for (let j = -depth / 2 - 1; j <= depth / 2; j++) {
            builder.addBlock(roofMat, x + i, 2 + height, z + j)
        }
    }
    // Pyramid top
    for (let k = 1; k < 3; k++) {
        for (let i = -width / 2 + k; i < width / 2 - k; i++) {
            for (let j = -depth / 2 + k; j < depth / 2 - k; j++) {
                builder.addBlock(roofMat, x + i, 2 + height + k, z + j)
            }
        }
    }

    return true
}

function createTree(x, z) {
    if (isOccupied(x, z, 3, 3)) return false
    markOccupied(x, z, 1, 1)

    const height = 3 + Math.floor(Math.random() * 3)

    // Trunk
    for (let y = 1; y <= height; y++) {
        builder.addBlock('wood', x, y, z)
    }

    // Leaves
    for (let y = height - 1; y <= height + 2; y++) {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                if (Math.abs(i) + Math.abs(j) < 3) {
                    if (i === 0 && j === 0 && y < height + 1) continue
                    builder.addBlock('leaves', x + i, y, z + j)
                }
            }
        }
    }
    return true
}

// Generate World
console.time('World Generation')

// Ground (512x512) - Optimized: Only generate visible top layer
// Actually, 512x512 is 260k blocks. InstancedMesh can handle it, but let's be safe.
// Let's do 256x256 for now to ensure performance, or sparse generation.
// User asked for 512x512.
const WORLD_SIZE = 256 // Radius (Total 512)

for (let x = -WORLD_SIZE; x < WORLD_SIZE; x++) {
    for (let z = -WORLD_SIZE; z < WORLD_SIZE; z++) {
        // Simple noise for terrain variation could go here
        builder.addBlock('grass', x, 0, z)
    }
}

// Buildings
let houseCount = 0
for (let i = 0; i < 200; i++) {
    const x = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.8)
    const z = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.8)
    const type = Math.random() > 0.7 ? 'large' : 'small'
    if (createHouse(x, z, type)) houseCount++
}

// Trees
let treeCount = 0
for (let i = 0; i < 400; i++) {
    const x = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.9)
    const z = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.9)
    if (createTree(x, z)) treeCount++
}

console.log(`Generated ${houseCount} houses and ${treeCount} trees.`)
console.timeEnd('World Generation')

builder.render(scene)

// Animation Loop
function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

animate()

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})
