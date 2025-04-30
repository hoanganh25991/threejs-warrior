import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";

/**
 * Creates and adds mountains to the scene
 */
export default class Moutain extends THREE.Object3D {
  constructor() {

    const mountainGeometry = new THREE.ConeGeometry(
      20 + Math.random() * 30,
      50 + Math.random() * 50,
      4
    );
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1,
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
    return mountain;
  }
}
