import * as THREE from 'three';

/**
 * Creates and adds interactive objects to the scene
 */
export function addInteractiveObjects(scene) {
    const interactiveObjects = [];
    
    // 1. Add treasure chests
    for (let i = 0; i < 10; i++) {
        const chestGroup = new THREE.Group();
        
        // Chest base
        const baseGeometry = new THREE.BoxGeometry(1, 0.7, 0.7);
        const chestMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown
            roughness: 0.7,
            metalness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, chestMaterial);
        base.position.y = 0.35;
        base.castShadow = true;
        chestGroup.add(base);
        
        // Chest lid
        const lidGeometry = new THREE.BoxGeometry(1.1, 0.3, 0.8);
        const lidMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown
            roughness: 0.7,
            metalness: 0.3
        });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 0.85;
        lid.castShadow = true;
        chestGroup.add(lid);
        
        // Metal details
        const metalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xB87333, // Copper
            roughness: 0.3,
            metalness: 0.8
        });
        
        // Lock
        const lockGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const lock = new THREE.Mesh(lockGeometry, metalMaterial);
        lock.position.set(0, 0.7, 0.4);
        lock.castShadow = true;
        chestGroup.add(lock);
        
        // Position chest randomly
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 60;
        chestGroup.position.x = Math.cos(angle) * distance;
        chestGroup.position.z = Math.sin(angle) * distance;
        chestGroup.position.y = 0;
        
        // Random rotation
        chestGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Add to scene and interactive objects
        scene.add(chestGroup);
        interactiveObjects.push({
            mesh: chestGroup,
            type: 'chest',
            interactionRadius: 2,
            onInteract: () => {
                // Open chest animation would go here
                console.log('Chest opened!');
                // Play sound
                if (window.soundManager) {
                    window.soundManager.playSound('chest');
                }
            }
        });
    }
    
    // 2. Add glowing crystals
    for (let i = 0; i < 15; i++) {
        const crystalGroup = new THREE.Group();
        
        // Crystal
        const crystalGeometry = new THREE.ConeGeometry(0.5, 2, 5);
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00FFFF, // Cyan
            roughness: 0.2,
            metalness: 0.8,
            emissive: 0x00FFFF,
            emissiveIntensity: 0.5
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.y = 1;
        crystal.castShadow = true;
        crystalGroup.add(crystal);
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 5);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080, // Gray
            roughness: 0.8,
            metalness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        base.castShadow = true;
        crystalGroup.add(base);
        
        // Add light
        const light = new THREE.PointLight(0x00FFFF, 1, 5);
        light.position.y = 1.5;
        crystalGroup.add(light);
        
        // Position crystal randomly
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 70;
        crystalGroup.position.x = Math.cos(angle) * distance;
        crystalGroup.position.z = Math.sin(angle) * distance;
        crystalGroup.position.y = 0;
        
        // Add to scene and interactive objects
        scene.add(crystalGroup);
        interactiveObjects.push({
            mesh: crystalGroup,
            type: 'crystal',
            interactionRadius: 3,
            onInteract: () => {
                // Crystal interaction
                console.log('Crystal activated!');
                // Play sound
                if (window.soundManager) {
                    window.soundManager.playSound('crystal');
                }
            }
        });
    }
    
    // 3. Add training dummies
    for (let i = 0; i < 5; i++) {
        const dummyGroup = new THREE.Group();
        
        // Dummy body
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA0522D, // Sienna
            roughness: 0.9,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        dummyGroup.add(body);
        
        // Dummy head
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, // Burlywood
            roughness: 0.8,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;
        dummyGroup.add(head);
        
        // Dummy arms
        const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA0522D, // Sienna
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.7, 1.5, 0);
        leftArm.rotation.z = Math.PI / 6;
        leftArm.castShadow = true;
        dummyGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.7, 1.5, 0);
        rightArm.rotation.z = -Math.PI / 6;
        rightArm.castShadow = true;
        dummyGroup.add(rightArm);
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(0.7, 0.9, 0.2, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            roughness: 0.8,
            metalness: 0.2
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.1;
        base.castShadow = true;
        dummyGroup.add(base);
        
        // Position dummy randomly
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 25;
        dummyGroup.position.x = Math.cos(angle) * distance;
        dummyGroup.position.z = Math.sin(angle) * distance;
        dummyGroup.position.y = 0;
        
        // Random rotation
        dummyGroup.rotation.y = Math.random() * Math.PI * 2;
        
        // Add to scene and interactive objects
        scene.add(dummyGroup);
        interactiveObjects.push({
            mesh: dummyGroup,
            type: 'dummy',
            interactionRadius: 2,
            health: 100,
            onInteract: () => {
                // Dummy interaction (attack)
                console.log('Dummy attacked!');
                // Play sound
                if (window.soundManager) {
                    window.soundManager.playSound('hit');
                }
            }
        });
    }
    
    return interactiveObjects;
}