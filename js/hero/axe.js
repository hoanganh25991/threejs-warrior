import * as THREE from "three";

export default class Axe extends THREE.Object3D {
  constructor() {
    // Create a more complex Axe model
    const bodyGroup = new THREE.Group();

    // Body - bulky and muscular
    const bodyGeometry = new THREE.BoxGeometry(1.5, 1.3, 0.9);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000, // Dark red
      metalness: 0.3,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    bodyGroup.add(body);

    // Head - smaller relative to body
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d, // Sienna
      metalness: 0.3,
      roughness: 0.7,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.85;
    head.castShadow = true;
    bodyGroup.add(head);

    // Helmet
    const helmetGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.4, 8);
    const helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969, // Dark gray
      metalness: 0.8,
      roughness: 0.2,
    });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.y = 2.0;
    helmet.castShadow = true;
    bodyGroup.add(helmet);

    // Shoulder armor - massive
    const shoulderGeometry = new THREE.SphereGeometry(
      0.4,
      8,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    const shoulderMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000, // Dark red
      metalness: 0.7,
      roughness: 0.3,
    });

    // Left shoulder
    const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    leftShoulder.position.set(-0.75, 1.5, 0);
    leftShoulder.rotation.z = -Math.PI / 2;
    leftShoulder.castShadow = true;
    bodyGroup.add(leftShoulder);

    // Right shoulder
    const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
    rightShoulder.position.set(0.75, 1.5, 0);
    rightShoulder.rotation.z = Math.PI / 2;
    rightShoulder.castShadow = true;
    bodyGroup.add(rightShoulder);

    // Arms - very muscular
    const armGeometry = new THREE.BoxGeometry(0.4, 0.9, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d, // Sienna
      metalness: 0.3,
      roughness: 0.7,
    });

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.95, 1.1, 0);
    leftArm.castShadow = true;
    bodyGroup.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.95, 1.1, 0);
    rightArm.castShadow = true;
    bodyGroup.add(rightArm);

    // Legs - thick and powerful
    const legGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      metalness: 0.3,
      roughness: 0.7,
    });

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.4, 0.4, 0);
    leftLeg.castShadow = true;
    bodyGroup.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.4, 0.4, 0);
    rightLeg.castShadow = true;
    bodyGroup.add(rightLeg);

    // Battle Axe
    const axeGroup = new THREE.Group();

    // Axe handle
    const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      metalness: 0.2,
      roughness: 0.8,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.castShadow = true;
    axeGroup.add(handle);

    // Axe blade
    const bladeGeometry = new THREE.ConeGeometry(0.4, 0.8, 4);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0, // Silver
      metalness: 0.9,
      roughness: 0.1,
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 0.8;
    blade.rotation.z = Math.PI / 2;
    blade.castShadow = true;
    axeGroup.add(blade);

    // Position axe in hands
    axeGroup.position.set(0.8, 1.2, 0.5);
    axeGroup.rotation.x = Math.PI / 4;
    bodyGroup.add(axeGroup);

    return bodyGroup;
  }
}
