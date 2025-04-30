import * as THREE from "three";

/**
 * Creates and adds a castle to the scene
 */

export default class Castle extends THREE.Object3D {
  constructor() {

    // Create a simple castle in the distance
    const castleGroup = new THREE.Group();
    
    // Add a type property to identify this as a castle for collision detection
    castleGroup.userData = { type: 'castle' };
    
    // Set properties for collision detection
    castleGroup.type = 'castle';
    castleGroup.isCollidable = true;
    castleGroup.isWalkable = true;

    // Main castle body
    const castleBodyGeometry = new THREE.BoxGeometry(30, 40, 30);
    const castleMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2,
    });
    const castleBody = new THREE.Mesh(castleBodyGeometry, castleMaterial);
    castleBody.position.y = 20;
    castleGroup.add(castleBody);

    // Castle towers
    for (let i = 0; i < 4; i++) {
      const towerGeometry = new THREE.CylinderGeometry(5, 5, 50, 8);
      const tower = new THREE.Mesh(towerGeometry, castleMaterial);

      // Position at corners
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      tower.position.x = Math.cos(angle) * 20;
      tower.position.z = Math.sin(angle) * 20;
      tower.position.y = 25;

      castleGroup.add(tower);

      // Tower tops
      const towerTopGeometry = new THREE.ConeGeometry(6, 10, 8);
      const towerTop = new THREE.Mesh(towerTopGeometry, castleMaterial);
      towerTop.position.y = 30;
      tower.add(towerTop);
    }

    // Position castle in the distance
    castleGroup.position.set(0, 0, -200);
    castleGroup.castShadow = true;
    castleGroup.receiveShadow = true;

    return castleGroup;
  }
}
