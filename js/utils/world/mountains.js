import * as THREE from 'three';

/**
 * Creates and adds mountains to the scene
 * @param {THREE.Scene} scene - The scene to add mountains to
 * @returns {Array} - Array of mountain objects added to the scene
 */
export function addMountains(scene) {
    const mountains = [];
    
    // Create mountains using simple geometry
    for (let i = 0; i < 5; i++) {
        const mountainGeometry = new THREE.ConeGeometry(20 + Math.random() * 30, 50 + Math.random() * 50, 4);
        const mountainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Position mountains randomly in the distance
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 100;
        mountain.position.x = Math.cos(angle) * distance;
        mountain.position.z = Math.sin(angle) * distance;
        mountain.position.y = 0;
        
        // Rotate randomly
        mountain.rotation.y = Math.random() * Math.PI * 2;
        
        mountain.castShadow = true;
        mountain.receiveShadow = true;
        
        scene.add(mountain);
        mountains.push(mountain);
    }
    
    return mountains;
}