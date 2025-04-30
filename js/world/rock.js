import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";

/**
 * Creates and adds rocks to the scene
 */
export default class Rock extends THREE.Object3D {
  constructor() {
    super();

    const rockGroup = new THREE.Group();

    // Random size for the rock
    const baseSize = 1 + Math.random() * 2;
    const rockGeometry = new THREE.DodecahedronGeometry(baseSize, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
      metalness: 0.1,
    });
    const rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
    rockGroup.add(rockMesh);

    // Create a collision box that encompasses the rock
    const box = new THREE.Box3().setFromObject(rockMesh);
    const boxSize = box.getSize(new THREE.Vector3());
    const collisionGeometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false, // Invisible collision mesh
    });
    const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collisionMesh.position.copy(rockMesh.position);
    rockGroup.add(collisionMesh);

    // Position rocks randomly
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 90;
    rockGroup.position.x = Math.cos(angle) * distance;
    rockGroup.position.z = Math.sin(angle) * distance;
    rockGroup.position.y = 0.5;

    // Random rotation
    rockGroup.rotation.x = Math.random() * Math.PI;
    rockGroup.rotation.y = Math.random() * Math.PI;
    rockGroup.rotation.z = Math.random() * Math.PI;

    // Random scale
    const scale = 0.5 + Math.random() * 1.5;
    rockGroup.scale.set(scale, scale, scale);

    rockGroup.castShadow = true;
    rockGroup.receiveShadow = true;

    // Add collision properties
    rockGroup.type = "rock";
    rockGroup.isCollidable = true;
    rockGroup.isWalkable = false;
    rockGroup.userData = {
      type: "rock",
      collisionMesh: collisionMesh,
      collisionBox: new THREE.Box3().setFromObject(collisionMesh),
      collisionType: "box"
    };

    return rockGroup;
  }
}
