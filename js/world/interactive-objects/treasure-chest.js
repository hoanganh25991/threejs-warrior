import * as THREE from 'three';

/**
 * Creates a treasure chest object
 */
export default class TreasureChest extends THREE.Object3D {
  constructor() {
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
    
    // Set properties for interaction
    chestGroup.userData = { type: 'chest' };
    
    // Set interaction properties
    chestGroup.type = 'chest';
    chestGroup.interactionRadius = 2;
    chestGroup.onInteract = () => {
      // Open chest animation would go here
      console.log('Chest opened!');
      // Play sound
      if (window.soundManager) {
        window.soundManager.playSound('chest');
      }
    };

    chestGroup.positionRandomly = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 60;
      chestGroup.position.x = Math.cos(angle) * distance;
      chestGroup.position.z = Math.sin(angle) * distance;
      chestGroup.position.y = 0;
      
      // Random rotation
      chestGroup.rotation.y = Math.random() * Math.PI * 2;
      
      return chestGroup;
    }

    return chestGroup;
  }
}