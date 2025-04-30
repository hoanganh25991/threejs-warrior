import * as THREE from 'three';

/**
 * Creates a glowing crystal object
 */
export default class GlowingCrystal extends THREE.Object3D {
  constructor() {
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
    
    // Set properties for interaction
    crystalGroup.userData = { type: 'crystal' };
    crystalGroup.type = 'crystal';
    crystalGroup.interactionRadius = 3;

    crystalGroup.onInteract = () => {
      // Crystal interaction
      console.log('Crystal activated!');
      // Play sound
      if (window.soundManager) {
        window.soundManager.playSound('crystal');
      }
    };

    crystalGroup.positionRandomly = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 70;
      crystalGroup.position.x = Math.cos(angle) * distance;
      crystalGroup.position.z = Math.sin(angle) * distance;
      crystalGroup.position.y = 0;
      
      return crystalGroup;
    }

    return crystalGroup;
  }
}