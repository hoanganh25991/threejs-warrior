import * as THREE from 'three';

/**
 * Creates and adds rocks to the scene
 * @param {THREE.Scene} scene - The scene to add rocks to
 * @returns {Array} - Array of rock objects added to the scene
 */
export function addRocks(scene) {
    const rocks = [];
    
    // Add rocks around the scene
    for (let i = 0; i < 30; i++) {
        const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.9,
            metalness: 0.1
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Add a type property to identify this as a rock for collision detection
        rock.userData = { type: 'rock' };
        
        // Set properties for collision detection
        rock.type = 'rock';
        rock.isCollidable = true;
        rock.isWalkable = true;
        
        // Position rocks randomly
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * 90;
        rock.position.x = Math.cos(angle) * distance;
        rock.position.z = Math.sin(angle) * distance;
        rock.position.y = 0.5;
        
        // Random rotation
        rock.rotation.x = Math.random() * Math.PI;
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.z = Math.random() * Math.PI;
        
        // Random scale
        const scale = 0.5 + Math.random() * 1.5;
        rock.scale.set(scale, scale, scale);
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        scene.add(rock);
        rocks.push(rock);
    }
    
    return rocks;
}