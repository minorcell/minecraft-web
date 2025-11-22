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

// ===== VILLAGE GENERATION SYSTEM =====

// Generate villages with various building types
function generateVillages() {
    const villageCount = 8 // Number of villages
    const villages = []

    // Generate village centers
    for (let i = 0; i < villageCount; i++) {
        const centerX = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.5)
        const centerZ = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 1.5)
        const centerY = getTerrainHeight(centerX, centerZ)

        if (centerY > WATER_LEVEL) {
            villages.push({
                x: centerX,
                y: centerY,
                z: centerZ,
                radius: 20 + Math.floor(Math.random() * 15) // Village size
            })
        }
    }

    // Generate buildings for each village
    for (const village of villages) {
        generateVillageBuildings(village)
    }

    console.log(`Generated ${villages.length} villages`)
}

function generateVillageBuildings(village) {
    const buildings = [
        { type: 'townhall', count: 1, priority: 1 },
        { type: 'tower', count: 1, priority: 2 },
        { type: 'blacksmith', count: 1, priority: 3 },
        { type: 'house', count: 3, priority: 4 },
        { type: 'barn', count: 2, priority: 5 },
        { type: 'farm', count: 3, priority: 6 },
        { type: 'storage', count: 2, priority: 7 },
    ]

    const occupiedPositions = new Set()

    for (const building of buildings) {
        for (let i = 0; i < building.count; i++) {
            const pos = findBuildingPosition(village, occupiedPositions)
            if (pos) {
                switch (building.type) {
                    case 'townhall':
                        createTownHall(pos.x, pos.y, pos.z)
                        break
                    case 'tower':
                        createTower(pos.x, pos.y, pos.z)
                        break
                    case 'blacksmith':
                        createBlacksmith(pos.x, pos.y, pos.z)
                        break
                    case 'house':
                        createHouse(pos.x, pos.y, pos.z)
                        break
                    case 'barn':
                        createBarn(pos.x, pos.y, pos.z)
                        break
                    case 'farm':
                        createFarm(pos.x, pos.y, pos.z)
                        break
                    case 'storage':
                        createStorage(pos.x, pos.y, pos.z)
                        break
                }

                // Mark occupied
                const key = `${pos.x},${pos.z}`
                occupiedPositions.add(key)

                // Add decorative elements
                if (Math.random() > 0.7) {
                    createFountain(pos.x, pos.y - 1, pos.z)
                }
            }
        }
    }

    // Add paths between buildings
    createVillagePaths(village, occupiedPositions)

    // Add decorative elements like fences and gardens around the village
    addVillageDecorations(village, occupiedPositions)
}

function findBuildingPosition(village, occupiedPositions) {
    const maxAttempts = 50
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = (attempt / maxAttempts) * Math.PI * 2 + Math.random() * 0.5
        const distance = 5 + Math.random() * (village.radius - 5)
        const x = Math.floor(village.x + Math.cos(angle) * distance)
        const z = Math.floor(village.z + Math.sin(angle) * distance)
        const y = getTerrainHeight(x, z)

        if (y > WATER_LEVEL) {
            const key = `${x},${z}`
            if (!occupiedPositions.has(key)) {
                return { x, y, z }
            }
        }
    }
    return null
}

function createVillagePaths(village, occupiedPositions) {
    // Simple path generation between random points
    const pathCount = 3
    for (let i = 0; i < pathCount; i++) {
        const angle = (i / pathCount) * Math.PI * 2
        const distance = village.radius * 0.5
        const x = Math.floor(village.x + Math.cos(angle) * distance)
        const z = Math.floor(village.z + Math.sin(angle) * distance)

        // Create a simple stone path
        for (let px = -1; px <= 1; px++) {
            for (let pz = -1; pz <= 1; pz++) {
                builder.addBlock('stone', x + px, getTerrainHeight(x + px, z + pz), z + pz)
            }
        }
    }
}

function addVillageDecorations(village, occupiedPositions) {
    // Add fences around the village perimeter
    const fenceCount = 8
    for (let i = 0; i < fenceCount; i++) {
        const angle = (i / fenceCount) * Math.PI * 2
        const distance = village.radius + 2
        const x = Math.floor(village.x + Math.cos(angle) * distance)
        const z = Math.floor(village.z + Math.sin(angle) * distance)
        const y = getTerrainHeight(x, z)

        if (y > WATER_LEVEL) {
            // Create fence post
            for (let h = 0; h < 2; h++) {
                builder.addBlock('wood', x, y + h, z)
            }

            // Connect to next post with fence segments
            const nextAngle = ((i + 1) / fenceCount) * Math.PI * 2
            const nextX = Math.floor(village.x + Math.cos(nextAngle) * distance)
            const nextZ = Math.floor(village.z + Math.sin(nextAngle) * distance)

            // Simple fence between posts (just a few wood blocks)
            const midX = Math.floor((x + nextX) / 2)
            const midZ = Math.floor((z + nextZ) / 2)
            const midY = getTerrainHeight(midX, midZ)

            if (midY > WATER_LEVEL) {
                builder.addBlock('wood', midX, midY + 1, midZ)
            }
        }
    }

    // Add small gardens near houses
    const gardenCount = 5
    for (let i = 0; i < gardenCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const distance = village.radius * 0.7
        const x = Math.floor(village.x + Math.cos(angle) * distance)
        const z = Math.floor(village.z + Math.sin(angle) * distance)
        const y = getTerrainHeight(x, z)

        if (y > WATER_LEVEL) {
            // Small garden plot
            for (let gx = -1; gx <= 1; gx++) {
                for (let gz = -1; gz <= 1; gz++) {
                    if (Math.random() > 0.4) {
                        builder.addBlock('dirt', x + gx, y, z + gz)
                        if (Math.random() > 0.5) {
                            builder.addBlock('leaves', x + gx, y + 1, z + gz) // Small plants
                        }
                    }
                }
            }
        }
    }
}

// ===== BUILDING TYPES =====

function createTownHall(x, y, z) {
    const width = 10
    const depth = 10
    const height = 8

    if (isOccupied(x, z, width, depth)) return false
    markOccupied(x, z, width, depth)

    // Foundation
    for (let i = -width / 2; i < width / 2; i++) {
        for (let j = -depth / 2; j < depth / 2; j++) {
            builder.addBlock('stone', x + i, y, z + j)
        }
    }

    // Main building - wood with stone base
    for (let h = 1; h <= height; h++) {
        for (let i = -width / 2 + 1; i < width / 2 - 1; i++) {
            for (let j = -depth / 2 + 1; j < depth / 2 - 1; j++) {
                if (h <= 2) {
                    builder.addBlock('stone', x + i, y + h, z + j)
                } else {
                    builder.addBlock('wood', x + i, y + h, z + j)
                }
            }
        }
    }

    // Roof - pyramid style
    for (let level = 0; level < 4; level++) {
        const levelSize = width - level * 2
        for (let i = -levelSize / 2; i < levelSize / 2; i++) {
            for (let j = -levelSize / 2; j < levelSize / 2; j++) {
                builder.addBlock('roof', x + i, y + height + level + 1, z + j)
            }
        }
    }

    return true
}

function createTower(x, y, z) {
    const size = 6
    const height = 12

    if (isOccupied(x, z, size, size)) return false
    markOccupied(x, z, size, size)

    // Stone base
    for (let h = 0; h <= 3; h++) {
        for (let i = -size / 2; i < size / 2; i++) {
            for (let j = -size / 2; j < size / 2; j++) {
                builder.addBlock('stone', x + i, y + h, z + j)
            }
        }
    }

    // Upper levels - wood
    for (let h = 4; h <= height; h++) {
        for (let i = -size / 2 + 1; i < size / 2 - 1; i++) {
            for (let j = -size / 2 + 1; j < size / 2 - 1; j++) {
                // Windows on some levels
                if (h % 2 === 0 && (i === 0 || j === 0)) {
                    builder.addBlock('glass', x + i, y + h, z + j)
                } else {
                    builder.addBlock('wood', x + i, y + h, z + j)
                }
            }
        }
    }

    // Cone roof
    for (let level = 0; level < 5; level++) {
        const levelSize = size - level * 2
        for (let i = -levelSize / 2; i < levelSize / 2; i++) {
            for (let j = -levelSize / 2; j < levelSize / 2; j++) {
                if (levelSize > 0) {
                    builder.addBlock('roof', x + i, y + height + level + 1, z + j)
                }
            }
        }
    }

    return true
}

function createBlacksmith(x, y, z) {
    const width = 8
    const depth = 8
    const height = 5

    if (isOccupied(x, z, width, depth)) return false
    markOccupied(x, z, width, depth)

    // Stone building
    for (let h = 0; h <= height; h++) {
        for (let i = -width / 2; i < width / 2; i++) {
            for (let j = -depth / 2; j < depth / 2; j++) {
                if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1 || h === 0) {
                    builder.addBlock('stone', x + i, y + h, z + j)
                } else if (h === 3 && (i === 0 || j === 0)) {
                    builder.addBlock('glass', x + i, y + h, z + j) // Windows
                }
            }
        }
    }

    // Iron roof
    for (let i = -width / 2 - 1; i <= width / 2; i++) {
        for (let j = -depth / 2 - 1; j <= depth / 2; j++) {
            builder.addBlock('roof', x + i, y + height + 1, z + j)
        }
    }

    // Forge (decoration)
    for (let i = -1; i <= 1; i++) {
        builder.addBlock('stone', x + i, y + 1, z + depth / 2)
    }

    return true
}

function createBarn(x, y, z) {
    const width = 12
    const depth = 8
    const height = 6

    if (isOccupied(x, z, width, depth)) return false
    markOccupied(x, z, width, depth)

    // Large wooden barn
    for (let h = 0; h <= height; h++) {
        for (let i = -width / 2; i < width / 2; i++) {
            for (let j = -depth / 2; j < depth / 2; j++) {
                if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1 || h === 0) {
                    builder.addBlock('wood', x + i, y + h, z + j)
                }
            }
        }
    }

    // Door opening
    for (let h = 1; h <= 3; h++) {
        builder.addBlock('wood', x, y + h, z + depth / 2 - 1)
    }

    // Roof
    for (let i = -width / 2 - 1; i <= width / 2; i++) {
        for (let j = -depth / 2 - 1; j <= depth / 2; j++) {
            builder.addBlock('roof', x + i, y + height + 1, z + j)
        }
    }

    return true
}

function createFarm(x, y, z) {
    const width = 8
    const depth = 8

    if (isOccupied(x, z, width, depth)) return false
    markOccupied(x, z, width, depth)

    // Fenced area
    for (let i = -width / 2; i < width / 2; i++) {
        for (let j = -depth / 2; j < depth / 2; j++) {
            // Border fence
            if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1) {
                builder.addBlock('wood', x + i, y + 1, z + j)
                if (Math.random() > 0.5) {
                    builder.addBlock('wood', x + i, y + 2, z + j)
                }
            } else {
                // Farmland
                if (Math.random() > 0.3) {
                    builder.addBlock('dirt', x + i, y, z + j)
                    if (Math.random() > 0.5) {
                        builder.addBlock('grass', x + i, y + 1, z + j) // Crops
                    }
                } else {
                    builder.addBlock('grass', x + i, y, z + j)
                }
            }
        }
    }

    return true
}

function createStorage(x, y, z) {
    const width = 6
    const depth = 6
    const height = 4

    if (isOccupied(x, z, width, depth)) return false
    markOccupied(x, z, width, depth)

    for (let h = 0; h <= height; h++) {
        for (let i = -width / 2; i < width / 2; i++) {
            for (let j = -depth / 2; j < depth / 2; j++) {
                if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1 || h === 0 || h === height) {
                    builder.addBlock('wood', x + i, y + h, z + j)
                }
            }
        }
    }

    // Roof
    for (let i = -width / 2 - 1; i <= width / 2; i++) {
        for (let j = -depth / 2 - 1; j <= depth / 2; j++) {
            builder.addBlock('roof', x + i, y + height + 1, z + j)
        }
    }

    return true
}

function createFountain(x, y, z) {
    // Water basin with stone border
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
            if (Math.abs(i) === 2 || Math.abs(j) === 2) {
                builder.addBlock('stone', x + i, y, z + j)
                builder.addBlock('stone', x + i, y + 1, z + j)
            } else {
                builder.addBlock('water', x + i, y + 1, z + j)
            }
        }
    }

    return true
}

// Enhanced house
function createHouse(x, y, z) {
    const width = 6
    const depth = 6
    const height = 5

    if (isOccupied(x, z, width, depth)) return false
    markOccupied(x, z, width, depth)

    const wallMat = 'wood'
    const roofMat = 'roof'

    // Foundation
    for (let i = -width / 2; i < width / 2; i++) {
        for (let j = -depth / 2; j < depth / 2; j++) {
            builder.addBlock('stone', x + i, y, z + j)
        }
    }

    // Walls
    for (let h = 1; h <= height; h++) {
        for (let i = -width / 2; i < width / 2; i++) {
            for (let j = -depth / 2; j < depth / 2; j++) {
                if (i === -width / 2 || i === width / 2 - 1 || j === -depth / 2 || j === depth / 2 - 1) {
                    if (h === 2 && i === 0) {
                        builder.addBlock('glass', x + i, y + h, z + j) // Door
                    } else if (h >= 2 && h <= 3 && (i === -2 || i === 2 || j === -2 || j === 2)) {
                        builder.addBlock('glass', x + i, y + h, z + j) // Windows
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
            builder.addBlock(roofMat, x + i, y + height + 1, z + j)
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
const WATER_LEVEL = -4 // Lower water level to reduce water coverage
const SAND_LEVEL = -3 // Higher sand level to reduce beach area
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

// ===== Villages =====
generateVillages()

// Trees (reduced to make villages more prominent)
let treeCount = 0
for (let i = 0; i < 150; i++) {
    const x = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 2)
    const z = Math.floor((Math.random() - 0.5) * WORLD_SIZE * 2)
    const y = getTerrainHeight(x, z)

    if (y > WATER_LEVEL) {
        if (createTree(x, y, z)) treeCount++
    }
}

console.log(`Generated ${treeCount} trees across 8 villages.`)
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
