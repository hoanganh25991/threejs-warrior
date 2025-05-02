import * as THREE from 'three';

/**
 * Creates a training dummy object
 */
export default class TrainingDummy extends THREE.Object3D {
  constructor() {
    const dummyGroup = new THREE.Group();

    // Dummy body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d, // Sienna
      roughness: 0.9,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    dummyGroup.add(body);

    // Dummy head
    const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Burlywood
      roughness: 0.8,
      metalness: 0.1,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    head.castShadow = true;
    dummyGroup.add(head);

    // Dummy arms
    const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d, // Sienna
      roughness: 0.9,
      metalness: 0.1,
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
      color: 0x8b4513, // Saddle brown
      roughness: 0.8,
      metalness: 0.2,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1;
    base.castShadow = true;
    dummyGroup.add(base);

    // Set properties for interaction
    dummyGroup.userData = { type: "dummy" };

    // Set interaction properties
    dummyGroup.type = "dummy";
    dummyGroup.interactionRadius = 2;
    dummyGroup.health = 100;
    dummyGroup.onInteract = () => {
      // Dummy interaction (attack)
      console.log("Dummy attacked!");
      // Play sound
      if (window.soundManager) {
        window.soundManager.playSound("hit");
      }
    };

    // Method to position the dummy randomly
    dummyGroup.positionRandomly = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 25;
      dummyGroup.position.x = Math.cos(angle) * distance;
      dummyGroup.position.z = Math.sin(angle) * distance;
      dummyGroup.position.y = 0;

      // Random rotation
      dummyGroup.rotation.y = Math.random() * Math.PI * 2;

      return dummyGroup;
    };

    return dummyGroup;
  }
}
