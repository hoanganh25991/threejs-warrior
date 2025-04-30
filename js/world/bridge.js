import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";

/**
 * Creates and adds a bridge to the scene
 */

export default class Bridge extends THREE.Object3D {
  constructor() {

    const bridgeGroup = new THREE.Group();
    
    // Add a type property to identify this as a bridge for collision detection
    bridgeGroup.userData = { type: 'bridge' };

    // Bridge base
    const baseGeometry = new THREE.BoxGeometry(8, 1, 30);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      roughness: 0.8,
      metalness: 0.2,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -4; // Just above water level
    base.castShadow = true;
    base.receiveShadow = true;
    bridgeGroup.add(base);

    // Bridge railings
    const railingMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      roughness: 0.9,
      metalness: 0.1,
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
    
    // Set properties for collision detection
    bridgeGroup.type = 'bridge';
    bridgeGroup.isCollidable = true;
    bridgeGroup.isWalkable = true;

    return bridgeGroup;
  }
}
