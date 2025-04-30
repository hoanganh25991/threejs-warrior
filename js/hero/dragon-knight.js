import * as THREE from "three";

export default class DragonKnight extends THREE.Object3D {
  constructor() {
    // Create a more complex Dragon Knight model
    const modelGroup = new THREE.Group();

    // Body - slightly larger and more armored
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.4, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000, // Dark red
      metalness: 0.7,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    modelGroup.add(body);

    // Head with dragon-like features
    const headGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xa52a2a, // Brown
      metalness: 0.5,
      roughness: 0.5,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.75;
    head.castShadow = true;
    modelGroup.add(head);

    // Dragon horns
    const hornGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
    const hornMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969, // Dark gray
      metalness: 0.8,
      roughness: 0.2,
    });

    // Left horn
    const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    leftHorn.position.set(-0.25, 2.1, 0);
    leftHorn.rotation.z = Math.PI / 6;
    leftHorn.castShadow = true;
    modelGroup.add(leftHorn);

    // Right horn
    const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
    rightHorn.position.set(0.25, 2.1, 0);
    rightHorn.rotation.z = -Math.PI / 6;
    rightHorn.castShadow = true;
    modelGroup.add(rightHorn);

    // Armor plates
    const plateGeometry = new THREE.BoxGeometry(1.4, 0.3, 1);
    const plateMaterial = new THREE.MeshStandardMaterial({
      color: 0xcd5c5c, // Indian red
      metalness: 0.9,
      roughness: 0.1,
    });

    // Shoulder plates
    const shoulderPlate = new THREE.Mesh(plateGeometry, plateMaterial);
    shoulderPlate.position.y = 1.5;
    shoulderPlate.castShadow = true;
    modelGroup.add(shoulderPlate);

    // Arms - more muscular
    const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000, // Dark red
      metalness: 0.6,
      roughness: 0.4,
    });

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.75, 1.2, 0);
    leftArm.castShadow = true;
    modelGroup.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.75, 1.2, 0);
    rightArm.castShadow = true;
    modelGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000, // Dark red
      metalness: 0.6,
      roughness: 0.4,
    });

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0.45, 0);
    leftLeg.castShadow = true;
    modelGroup.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0.45, 0);
    rightLeg.castShadow = true;
    modelGroup.add(rightLeg);

    // Sword
    const swordGroup = new THREE.Group();

    // Sword blade
    const bladeGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.05);
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0, // Silver
      metalness: 1.0,
      roughness: 0.0,
    });
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.position.y = 0.6;
    blade.castShadow = true;
    swordGroup.add(blade);

    // Sword handle
    const handleGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.15);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      metalness: 0.2,
      roughness: 0.8,
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = -0.15;
    handle.castShadow = true;
    swordGroup.add(handle);

    // Position sword in right hand
    swordGroup.position.set(1.1, 1.2, 0.2);
    swordGroup.rotation.z = Math.PI / 4;
    modelGroup.add(swordGroup);

    // Shield
    const shieldGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0xb22222, // Firebrick
      metalness: 0.7,
      roughness: 0.3,
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.set(-1.0, 1.2, 0);
    shield.castShadow = true;
    modelGroup.add(shield);

    return modelGroup;
  }
}
