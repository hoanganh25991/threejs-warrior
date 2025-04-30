import * as THREE from 'three';
import { config } from './config/config.js';

export class CollisionDetector {
    constructor(world) {
        this.world = world;
        this.collisionObjects = [];
        this.raycaster = new THREE.Raycaster();
        this.tempVector = new THREE.Vector3();
        this.debug = config.game.debug;
        this.debugHelpers = [];
        
        // Initialize collision objects from world
        this.initCollisionObjects();
        
        // Initialize debug visualization if debug is enabled
        if (this.debug) {
            this.initDebugVisualization();
        }
    }
    
    initDebugVisualization() {
        // Create debug helpers for collision objects
        for (const obj of this.collisionObjects) {
            if (!obj.mesh) continue;
            
            // Create a bounding box helper
            const boxHelper = new THREE.BoxHelper(obj.mesh, 0xff0000);
            this.world.scene.add(boxHelper);
            this.debugHelpers.push(boxHelper);
            
            // Create a text label for the object type
            const typeLabel = document.createElement('div');
            typeLabel.className = 'debug-label';
            typeLabel.style.position = 'absolute';
            typeLabel.style.color = 'white';
            typeLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            typeLabel.style.padding = '2px 5px';
            typeLabel.style.borderRadius = '3px';
            typeLabel.style.fontSize = '10px';
            typeLabel.style.fontFamily = 'Arial, sans-serif';
            typeLabel.style.pointerEvents = 'none';
            typeLabel.textContent = obj.type;
            document.body.appendChild(typeLabel);
            
            // Store the label with the object for updating
            obj.debugLabel = typeLabel;
        }
    }
    
    initCollisionObjects() {
        // Add all interactive objects from the world
        if (this.world && this.world.interactiveObjects) {
            this.collisionObjects.push(...this.world.interactiveObjects);
        }
        
        // Add rocks
        if (this.world && this.world.rocks) {
            this.world.rocks.forEach(rock => {
                this.collisionObjects.push({
                    mesh: rock,
                    type: 'rock',
                    isCollidable: true,
                    isWalkable: false  // Rocks are not walkable, hero should collide with them
                });
            });
        }
        
        // Add castle
        if (this.world && this.world.castle) {
            this.collisionObjects.push({
                mesh: this.world.castle,
                type: 'castle',
                isCollidable: true,
                isWalkable: true  // Make castle walkable
            });
        }
        
        // Add bridge
        if (this.world && this.world.bridge) {
            this.collisionObjects.push({
                mesh: this.world.bridge,
                type: 'bridge',
                isCollidable: true,
                isWalkable: true  // Make bridge walkable
            });
        }
        
        // Add trees
        if (this.world && this.world.trees && this.world.trees.trees) {
            this.world.trees.trees.forEach(tree => {
                this.collisionObjects.push({
                    mesh: tree,
                    type: 'tree',
                    isCollidable: true,
                    isWalkable: false  // Trees are not walkable
                });
            });
        }
        
        // Log the number of collision objects if debug is enabled
        if (this.debug) {
            console.log(`Initialized ${this.collisionObjects.length} collision objects`);
        }
    }
    
    // Check if the hero can move to the new position
    checkCollision(position, direction, moveDistance) {
        // Calculate the new position
        this.tempVector.copy(direction).multiplyScalar(moveDistance);
        const newPosition = new THREE.Vector3().copy(position).add(this.tempVector);
        
        // Check ground level first (Y position)
        const groundHeight = this.getHeightAtPosition(newPosition);
        
        // Variables to track the highest walkable surface
        let highestWalkableSurface = groundHeight;
        let walkableObjectFound = false;
        let collidingObject = null;
        let isOnSlope = false;
        
        // Create a sphere around the hero for collision detection
        const heroRadius = 0.5; // Adjust based on hero size
        const heroHeight = 2.0; // Height of hero
        const heroSphere = new THREE.Sphere(newPosition, heroRadius);
        
        // Check for collisions with objects
        for (const obj of this.collisionObjects) {
            if (!obj.mesh) continue;
            
            let collision = false;
            const collisionData = obj.mesh.userData;
            
            // Handle different collision types
            if (collisionData.collisionType === "cylinder") {
                // For trees
                const radius = collisionData.collisionRadius;
                const height = collisionData.collisionHeight;
                const center = new THREE.Vector3();
                collisionData.collisionMesh.getWorldPosition(center);
                
                // Check cylinder collision
                const dx = newPosition.x - center.x;
                const dz = newPosition.z - center.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < (radius + heroRadius) && 
                    newPosition.y < (center.y + height) && 
                    newPosition.y > center.y) {
                    collision = true;
                }
            } 
            else if (collisionData.collisionType === "box") {
                // For rocks and walls
                if (collisionData.collisionBox) {
                    const box = collisionData.collisionBox.clone();
                    box.applyMatrix4(obj.mesh.matrixWorld);
                    if (box.intersectsSphere(heroSphere)) {
                        collision = true;
                    }
                }
            }
            else {
                // Fallback to simple bounding box check
                const boundingBox = new THREE.Box3().setFromObject(obj.mesh);
                if (boundingBox.intersectsSphere(heroSphere)) {
                    collision = true;
                }
            }
            
            if (collision) {
                // For solid objects (trees, rocks, castle walls)
                if (obj.mesh.isCollidable && !obj.mesh.isWalkable) {
                    collidingObject = obj;
                    break;
                }
                
                // For walkable objects (stairs, bridges)
                if (obj.mesh.isWalkable) {
                    const height = this.getObjectHeightAtPosition(obj, newPosition);
                    if (height > highestWalkableSurface) {
                        highestWalkableSurface = height;
                        walkableObjectFound = true;
                    }
                }
                
                if (this.debug) {
                    console.log(`Collision detected with ${obj.type}`);
                }
            }
        }
        
        // If we found a solid colliding object, handle collision response
        if (collidingObject) {
            // Try to slide along the collision surface
            const slidePosition = position.clone();
            const collisionNormal = new THREE.Vector3();
            
            // Get collision normal based on collision type
            if (collidingObject.mesh.userData.collisionType === "cylinder") {
                // For trees - calculate normal from center to collision point
                const center = new THREE.Vector3();
                collidingObject.mesh.userData.collisionMesh.getWorldPosition(center);
                collisionNormal.subVectors(newPosition, center).normalize();
                collisionNormal.y = 0; // Keep sliding horizontal for cylinders
            } 
            else if (collidingObject.mesh.userData.collisionType === "box") {
                // For rocks and walls - use box face normal
                const box = collidingObject.mesh.userData.collisionBox.clone();
                box.applyMatrix4(collidingObject.mesh.matrixWorld);
                
                // Find closest point on box to determine which face we hit
                const closestPoint = new THREE.Vector3();
                box.clampPoint(newPosition, closestPoint);
                collisionNormal.subVectors(newPosition, closestPoint).normalize();
            }
            else {
                // Fallback - use simple push-back from object center
                collisionNormal.subVectors(newPosition, collidingObject.mesh.position).normalize();
            }
            
            // Calculate slide direction
            const movement = new THREE.Vector3().subVectors(newPosition, position);
            const slide = new THREE.Vector3()
                .copy(movement)
                .projectOnPlane(collisionNormal)
                .multiplyScalar(0.8); // Reduce sliding speed slightly
            
            // Try sliding
            slidePosition.add(slide);
            
            // Check if sliding position is valid
            const slideHeroSphere = new THREE.Sphere(slidePosition, heroRadius);
            let canSlide = true;
            
            for (const obj of this.collisionObjects) {
                if (!obj.mesh || !obj.mesh.isCollidable || obj.mesh.isWalkable) continue;
                
                const collisionData = obj.mesh.userData;
                if (collisionData.collisionType === "cylinder") {
                    const radius = collisionData.collisionRadius;
                    const height = collisionData.collisionHeight;
                    const center = new THREE.Vector3();
                    collisionData.collisionMesh.getWorldPosition(center);
                    
                    const dx = slidePosition.x - center.x;
                    const dz = slidePosition.z - center.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance < (radius + heroRadius) && 
                        slidePosition.y < (center.y + height) && 
                        slidePosition.y > center.y) {
                        canSlide = false;
                        break;
                    }
                }
                else if (collisionData.collisionType === "box" && collisionData.collisionBox) {
                    const box = collisionData.collisionBox.clone();
                    box.applyMatrix4(obj.mesh.matrixWorld);
                    if (box.intersectsSphere(slideHeroSphere)) {
                        canSlide = false;
                        break;
                    }
                }
            }
            
            if (canSlide) {
                // Allow sliding
                return {
                    canMove: true,
                    newPosition: slidePosition,
                    isSliding: true
                };
            } else {
                // Can't slide, push back slightly
                return {
                    canMove: false,
                    newPosition: position.clone().add(collisionNormal.multiplyScalar(0.1)),
                    isSliding: false
                };
            }
        }
        
        // Determine final height based on walkable surfaces and slopes
        let finalHeight;
        if (position.y > highestWalkableSurface && !isOnSlope) {
            // If we're in the air (jumping/flying), maintain current height
            finalHeight = position.y;
        } else {
            // Otherwise use the highest walkable surface (including slopes)
            finalHeight = highestWalkableSurface;
        }
        
        return {
            canMove: true,
            newPosition: new THREE.Vector3(newPosition.x, finalHeight, newPosition.z),
            isOnSlope: isOnSlope
        };
    }
    
    // Get the height of the terrain at a given position
    getHeightAtPosition(position) {
        // Default ground height is 0
        let groundHeight = 0;
        
        // Cast a ray downward from the position
        this.raycaster.set(
            new THREE.Vector3(position.x, 100, position.z), // Start from high above
            new THREE.Vector3(0, -1, 0) // Cast downward
        );
        
        // Check for intersections with the ground
        const intersects = this.raycaster.intersectObjects(
            [this.world.ground], // Only check ground for now
            true // Check descendants
        );
        
        // If there's an intersection, use its height
        if (intersects.length > 0) {
            groundHeight = intersects[0].point.y;
        }
        
        return groundHeight;
    }
    
    // Get the height of an object at a given position
    getObjectHeightAtPosition(obj, position) {
        // Default to current position's y value
        let objectHeight = position.y;
        
        // Cast a ray downward from above the position
        this.raycaster.set(
            new THREE.Vector3(position.x, 100, position.z), // Start from high above
            new THREE.Vector3(0, -1, 0) // Cast downward
        );
        
        // Check for intersections with the object
        const intersects = this.raycaster.intersectObject(obj.mesh, true);
        
        // If there's an intersection, use its height
        if (intersects.length > 0) {
            objectHeight = intersects[0].point.y;
            
            // Special handling for different object types
            if (obj.type === 'stairs') {
                // For stairs, add a small offset to ensure the hero stands on top
                objectHeight += 0.1;
                
                // Calculate which stair the hero is on based on position
                // This is specific to the stairs implementation in stairs.js
                const stairsPosition = obj.mesh.position.clone();
                const relativeZ = position.z - stairsPosition.z;
                
                // Each stair is 1 unit deep, and the stairs go in negative Z direction
                // Calculate which stair we're on (0 is the bottom stair)
                const stairIndex = Math.floor(Math.abs(relativeZ));
                
                // Each stair is 0.5 units high
                const calculatedHeight = stairIndex * 0.5 + stairsPosition.y + 0.1;
                
                // Use the calculated height if it's reasonable
                if (calculatedHeight >= 0 && calculatedHeight <= 20) {
                    objectHeight = calculatedHeight;
                    
                    // If we're close to the edge of a stair, adjust the height to make it smoother
                    const stairFraction = Math.abs(relativeZ) - stairIndex;
                    if (stairFraction > 0.8) {
                        // We're close to the next stair, start blending heights
                        const nextStairHeight = (stairIndex + 1) * 0.5 + stairsPosition.y + 0.1;
                        const blend = (stairFraction - 0.8) * 5; // 0 to 1 over the last 20% of the stair
                        objectHeight = objectHeight * (1 - blend) + nextStairHeight * blend;
                    }
                }
                
                if (this.debug) {
                    console.log(`Stairs: stair index ${stairIndex}, height ${objectHeight.toFixed(2)}`);
                }
            } else if (obj.type === 'bridge') {
                // For bridge, add a small offset to ensure the hero stands on top
                objectHeight += 0.1;
                
                if (this.debug) {
                    console.log(`Bridge: height ${objectHeight.toFixed(2)}`);
                }
            } else if (obj.type === 'rock') {
                // For rocks, we want to prevent the hero from walking through them
                // So we set the height very high to ensure collision
                objectHeight = position.y + 100; // Set height much higher than hero can reach
                
                if (this.debug) {
                    console.log(`Rock: collision height ${objectHeight.toFixed(2)}`);
                }
            } else if (obj.type === 'castle') {
                // For castle, add a small offset
                objectHeight += 0.1;
                
                // If we're on the castle roof, make sure we can walk on it
                if (objectHeight > 10) {
                    // Set to a consistent height for the castle roof
                    objectHeight = 40.1; // Castle height is 40 units
                }
                
                // If we're at the castle entrance, make it walkable
                if (Math.abs(position.z + 180) < 10 && Math.abs(position.x) < 10) {
                    // This is the entrance area near the stairs
                    objectHeight = 0.1; // Ground level with small offset
                }
                
                if (this.debug) {
                    console.log(`Castle: height ${objectHeight.toFixed(2)}`);
                }
            } else if (obj.type === 'tree') {
                // Trees are not walkable, we want to prevent the hero from walking through them
                // So we set the height very high to ensure collision
                objectHeight = position.y + 100; // Set height much higher than hero can reach
                
                if (this.debug) {
                    console.log(`Tree: collision height ${objectHeight.toFixed(2)}`);
                }
            }
        }
        
        return objectHeight;
    }
    
    // Check if the hero can jump onto an object
    checkJumpCollision(position, jumpHeight) {
        // Cast rays in different directions to check for jumpable objects
        const directions = [
            new THREE.Vector3(1, 0, 0),   // Right
            new THREE.Vector3(-1, 0, 0),  // Left
            new THREE.Vector3(0, 0, 1),   // Forward
            new THREE.Vector3(0, 0, -1),  // Backward
            new THREE.Vector3(1, 0, 1).normalize(),   // Forward-Right
            new THREE.Vector3(-1, 0, 1).normalize(),  // Forward-Left
            new THREE.Vector3(1, 0, -1).normalize(),  // Backward-Right
            new THREE.Vector3(-1, 0, -1).normalize()  // Backward-Left
        ];
        
        // Check each direction
        for (const direction of directions) {
            // Set up the raycaster
            this.raycaster.set(position, direction);
            this.raycaster.far = 2; // Check within 2 units
            
            // Check for intersections with collidable objects
            const intersects = this.raycaster.intersectObjects(
                this.collisionObjects.map(obj => obj.mesh).filter(Boolean),
                true
            );
            
            // If there's an intersection and it's within jumpable height
            if (intersects.length > 0) {
                const hitPoint = intersects[0].point;
                const heightDifference = hitPoint.y - position.y;
                
                // If the object is within jumpable height
                if (heightDifference > 0 && heightDifference <= jumpHeight) {
                    // If debug is enabled, visualize the jump target
                    if (this.debug) {
                        this.visualizeJumpTarget(hitPoint);
                    }
                    
                    return {
                        canJump: true,
                        jumpTarget: hitPoint.clone()
                    };
                }
            }
        }
        
        // No jumpable object found
        return {
            canJump: false,
            jumpTarget: null
        };
    }
    
    // Visualize the jump target for debugging
    visualizeJumpTarget(position) {
        // Remove any existing jump target visualization
        const existingTarget = document.getElementById('jump-target-indicator');
        if (existingTarget) {
            document.body.removeChild(existingTarget);
        }
        
        // Create a new jump target indicator
        const jumpTarget = document.createElement('div');
        jumpTarget.id = 'jump-target-indicator';
        jumpTarget.style.position = 'absolute';
        jumpTarget.style.width = '10px';
        jumpTarget.style.height = '10px';
        jumpTarget.style.borderRadius = '50%';
        jumpTarget.style.backgroundColor = 'green';
        jumpTarget.style.zIndex = '1000';
        jumpTarget.style.pointerEvents = 'none';
        document.body.appendChild(jumpTarget);
        
        // Position will be updated in the update method
        this.jumpTargetPosition = position.clone();
    }
    
    // Update method to be called each frame
    update(camera) {
        if (!this.debug) return;
        
        // Update debug helpers
        for (const helper of this.debugHelpers) {
            helper.update();
        }
        
        // Update debug labels
        for (const obj of this.collisionObjects) {
            if (!obj.mesh || !obj.debugLabel) continue;
            
            // Get the screen position of the object
            const position = new THREE.Vector3();
            position.setFromMatrixPosition(obj.mesh.matrixWorld);
            position.project(camera);
            
            // Convert to screen coordinates
            const x = (position.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
            
            // Update label position
            obj.debugLabel.style.left = `${x}px`;
            obj.debugLabel.style.top = `${y}px`;
            
            // Hide if behind camera
            obj.debugLabel.style.display = position.z > 1 ? 'none' : 'block';
        }
        
        // Update jump target indicator if it exists
        const jumpTarget = document.getElementById('jump-target-indicator');
        if (jumpTarget && this.jumpTargetPosition) {
            const position = this.jumpTargetPosition.clone();
            position.project(camera);
            
            // Convert to screen coordinates
            const x = (position.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
            
            // Update position
            jumpTarget.style.left = `${x - 5}px`; // Center the indicator
            jumpTarget.style.top = `${y - 5}px`;
            
            // Hide if behind camera
            jumpTarget.style.display = position.z > 1 ? 'none' : 'block';
        }
    }
}

export default CollisionDetector;