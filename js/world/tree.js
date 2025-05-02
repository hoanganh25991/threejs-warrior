import * as THREE from 'three';

/**
 * Creates and adds trees to the scene
 */
export default class Tree extends THREE.Object3D {
  constructor() {
    // Call the parent constructor
    super();

    // Add trees around the scene
    const treeGroup = new THREE.Group();

    // Add a type property to identify this as a tree for collision detection
    treeGroup.userData = { type: "tree" };

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
      metalness: 0.1,
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    treeGroup.add(trunk);

    // Tree leaves (cone)
    const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e8b57,
      roughness: 0.8,
      metalness: 0.1,
    });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 7;
    treeGroup.add(leaves);

    // Create a collision cylinder that encompasses both trunk and leaves
    const collisionRadius = 2; // Large enough to cover trunk and most of leaves
    const collisionHeight = 10; // Tall enough for whole tree
    const collisionGeometry = new THREE.CylinderGeometry(collisionRadius, collisionRadius, collisionHeight, 8);
    const collisionMaterial = new THREE.MeshBasicMaterial({
      visible: false, // Invisible collision mesh
    });
    const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    collisionMesh.position.y = collisionHeight / 2;
    treeGroup.add(collisionMesh);

    // Position trees randomly
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 80;
    treeGroup.position.x = Math.cos(angle) * distance;
    treeGroup.position.z = Math.sin(angle) * distance;

    treeGroup.castShadow = true;
    treeGroup.receiveShadow = true;

    // Add collision properties
    treeGroup.type = "tree";
    treeGroup.isCollidable = true;
    treeGroup.isWalkable = false;
    treeGroup.userData = {
      type: "tree",
      collisionMesh: collisionMesh,
      collisionRadius: collisionRadius,
      collisionHeight: collisionHeight,
      collisionType: "cylinder"
    };

    return treeGroup;
  }
}
