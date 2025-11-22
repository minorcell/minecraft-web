import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createNoise2D } from 'simplex-noise'
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
function createHouse(x, y, z, type) {
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
            builder.addBlock(wallMat, x + i, y + 1, z + j)
        }
    }

    // Walls
    for (let h = 2; h < 2 + height; h++) {
        for (let i = -width / 2; i < width / 2; i++) {
            for (let j = -depth / 2; j < depth / 2; j++) {
                if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1) {
                    // Windows
                    if (h === 3 && (i === 0 || j === 0)) {
                        builder.addBlock('glass', x + i, y + h, z + j)
                    } else {
                        builder.addBlock(wallMat, x + i, y + h, z + j)
                    }
                }
            }
        }
    }

    // Roof
    for (let i = -width / 2 - 1; i <= width / 2; i++) {
        for (let j = -depth / 2 - 1; j <= depth / 2; j++) {
            builder.addBlock(roofMat, x + i, y + 2 + height, z + j)
        }
    }
    // Pyramid top
    for (let k = 1; k < 3; k++) {
        for (let i = -width / 2 + k; i < width / 2 - k; i++) {
            for (let j = -depth / 2 + k; j < depth / 2 - k; j++) {
                builder.addBlock(roofMat, x + i, y + 2 + height + k, z + j)
            }
        }
    }

    return true
}

function createTree(x, y, z) {
    if (isOccupied(x, z, 3, 3)) return false
    markOccupied(x, z, 1, 1)

    const height = 3 + Math.floor(Math.random() * 3)

    // Trunk
    for (let h = 1; h <= height; h++) {
        builder.addBlock('wood', x, y + h, z)
    }

    // Leaves
    for (let h = height - 1; h <= height + 2; h++) {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                if (Math.abs(i) + Math.abs(j) < 3) {
                    if (i === 0 && j === 0 && h < height + 1) continue
                    builder.addBlock('leaves', x + i, y + h, z + j)
                }
            }
        }
    }
    return true
}

// Terrain Setup
const noise2D = createNoise2D()
const WATER_LEVEL = -2
const SAND_LEVEL = 0
const SNOW_LEVEL = 12

function getTerrainHeight(x, z) {
    // Multiple octaves for detail
    const scale1 = 0.01
    const scale2 = 0.05
    const h1 = noise2D(x * scale1, z * scale1) * 10
    const h2 = noise2D(x * scale2, z * scale2) * 2
    return Math.floor(h1 + h2)
}

// Generate World
console.time('World Generation')

// Generate Ground
const WORLD_SIZE = 128 // Reduced for performance with full volume terrain
const BOTTOM_LEVEL = -10 // Fixed bottom level (flat bedrock)
const GROUND_DEPTH = 10 // 10 underground layers

for (let x = -WORLD_SIZE; x < WORLD_SIZE; x++) {
    for (let z = -WORLD_SIZE; z < WORLD_SIZE; z++) {
        const surfaceY = getTerrainHeight(x, z)

        // Generate from fixed bottom level up to surface
        // Like Minecraft, the bottom is a flat plane, not based on surface

        if (surfaceY < WATER_LEVEL) {
            // Water from surface to water level
            for (let w = surfaceY; w <= WATER_LEVEL; w++) {
                builder.addBlock('water', x, w, z)
            }

            // Underground layers from bottom to surface
            for (let y = BOTTOM_LEVEL; y < surfaceY; y++) {
                let type = 'stone'

                // Layered terrain with 10 layers: stone at bottom, sand near surface
                const depthFromSurface = surfaceY - y

                if (depthFromSurface > 7) {
                    type = 'stone' // Bottom 3 layers: stone
                } else {
                    type = 'sand' // Top 7 layers: sand
                }

                builder.addBlock(type, x, y, z)
            }
        } else {
            // Surface block
            let surfaceType = 'grass'
            if (surfaceY <= SAND_LEVEL) surfaceType = 'sand'
            else if (surfaceY >= SNOW_LEVEL) surfaceType = 'stone' // Snow/Stone peaks

            builder.addBlock(surfaceType, x, surfaceY, z)

            // Underground layers from bottom up to just below surface
            for (let y = BOTTOM_LEVEL; y < surfaceY; y++) {
                let type = 'stone'

                // Layered terrain with 10 layers: stone at bottom, dirt near surface
                const depthFromSurface = surfaceY - y

                if (depthFromSurface > 7) {
                    type = 'stone' // Bottom 3 layers: stone
                } else {
                    type = 'dirt' // Top 7 layers: dirt
                }

                builder.addBlock(type, x, y, z)
            }
        }
    }
}

// Buildings
let houseCount = 0
for (let i = 0; i < 100; i++) { // Reduced count further for performance
    const x = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.8)
    const z = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.8)
    const y = getTerrainHeight(x, z)

    if (y > WATER_LEVEL) { // Don't build underwater
        const type = Math.random() > 0.7 ? 'large' : 'small'
        // Adjust createHouse to take y
        if (createHouse(x, y, z, type)) houseCount++
    }
}

// Trees
let treeCount = 0
for (let i = 0; i < 300; i++) {
    const x = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.9)
    const z = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.9)
    const y = getTerrainHeight(x, z)

    if (y > WATER_LEVEL) {
        if (createTree(x, y, z)) treeCount++
    }
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
