import * as THREE from 'three';

/**
 * Creates and adds a bridge to the scene
 * @param {THREE.Scene} scene - The scene to add the bridge to
 * @returns {Object} - The bridge object with its properties
 */
export function addBridge(scene) {
    // Add a bridge over the water
    const bridgeGroup = new THREE.Group();
    
    // Bridge base
    const baseGeometry = new THREE.BoxGeometry(8, 1, 30);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, // Saddle brown
        roughness: 0.8,
        metalness: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -4; // Just above water level
    base.castShadow = true;
    base.receiveShadow = true;
    bridgeGroup.add(base);
    
    // Bridge railings
    const railingMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513, // Saddle brown
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Left railing
    const leftRailingGeometry = new THREE.BoxGeometry(0.5, 1, 30);
    const leftRailing = new THREE.Mesh(leftRailingGeometry, railingMaterial);
    leftRailing.position.set(-3.75, -3, 0);
    leftRailing.castShadow = true;
    bridgeGroup.add(leftRailing);
    
    // Right railing
    const rightRailingGeometry = new THREE.BoxGeometry(0.5, 1, 30);
    const rightRailing = new THREE.Mesh(rightRailingGeometry, railingMaterial);
    rightRailing.position.set(3.75, -3, 0);
    rightRailing.castShadow = true;
    bridgeGroup.add(rightRailing);
    
    // Add posts
    for (let i = -14; i <= 14; i += 7) {
        const postGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
        
        // Left post
        const leftPost = new THREE.Mesh(postGeometry, railingMaterial);
        leftPost.position.set(-3.75, -2, i);
        leftPost.castShadow = true;
        bridgeGroup.add(leftPost);
        
        // Right post
        const rightPost = new THREE.Mesh(postGeometry, railingMaterial);
        rightPost.position.set(3.75, -2, i);
        rightPost.castShadow = true;
        bridgeGroup.add(rightPost);
    }
    
    // Position bridge
    bridgeGroup.position.set(30, 0, -30);
    bridgeGroup.rotation.y = Math.PI / 4;
    
    scene.add(bridgeGroup);
    
    // Return bridge with properties for collision detection
    return {
        mesh: bridgeGroup,
        type: 'bridge',
        isCollidable: true
    };
}