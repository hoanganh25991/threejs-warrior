import * as THREE from 'three';

/**
 * Creates and adds stairs to the scene
 * @param {THREE.Scene} scene - The scene to add stairs to
 * @returns {Object} - The stairs object with its properties
 */
export function addStairs(scene) {
    // Add stairs to the castle
    const stairsGroup = new THREE.Group();
    
    // Create stairs
    const stairWidth = 10;
    const stairDepth = 1;
    const stairHeight = 0.5;
    const numStairs = 20;
    
    const stairMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080, // Gray
        roughness: 0.8,
        metalness: 0.2
    });
    
    for (let i = 0; i < numStairs; i++) {
        const stairGeometry = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
        const stair = new THREE.Mesh(stairGeometry, stairMaterial);
        
        // Position each stair
        stair.position.y = i * stairHeight;
        stair.position.z = -i * stairDepth;
        
        stair.castShadow = true;
        stair.receiveShadow = true;
        
        stairsGroup.add(stair);
    }
    
    // Position stairs leading to castle
    stairsGroup.position.set(0, 0, -180);
    
    scene.add(stairsGroup);
    
    // Return stairs with properties for collision detection
    return {
        mesh: stairsGroup,
        type: 'stairs',
        isCollidable: true
    };
}