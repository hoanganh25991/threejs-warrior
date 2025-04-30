import * as THREE from 'three';

/**
 * Creates and adds trees to the scene
 * @param {THREE.Scene} scene - The scene to add trees to
 * @returns {Array} - Array of tree groups added to the scene
 */
export function addTrees(scene) {
    const trees = [];
    
    // Add trees around the scene
    for (let i = 0; i < 50; i++) {
        const treeGroup = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2.5;
        treeGroup.add(trunk);
        
        // Tree leaves
        const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2e8b57,
            roughness: 0.8,
            metalness: 0.1
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 7;
        treeGroup.add(leaves);
        
        // Position trees randomly
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 80;
        treeGroup.position.x = Math.cos(angle) * distance;
        treeGroup.position.z = Math.sin(angle) * distance;
        
        treeGroup.castShadow = true;
        treeGroup.receiveShadow = true;
        
        scene.add(treeGroup);
        trees.push(treeGroup);
    }
    
    return trees;
}