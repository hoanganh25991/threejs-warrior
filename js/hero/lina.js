import * as THREE from "three";

export class Lina extends THREE.Object3D {
  constructor() {
    // Create a more complex Lina model
    const modelGroup = new THREE.Group();

    // Body - slender and feminine
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500, // Orange red
      metalness: 0.3,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    modelGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe4c4, // Bisque
      metalness: 0.1,
      roughness: 0.9,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    modelGroup.add(head);

    // Hair
    const hairGeometry = new THREE.ConeGeometry(0.4, 0.8, 16, 1, true);
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500, // Orange red
      metalness: 0.4,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.y = 2.0;
    hair.rotation.x = Math.PI;
    hair.castShadow = true;
    modelGroup.add(hair);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500, // Orange red
      metalness: 0.3,
      roughness: 0.7,
    });

    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 1.2, 0);
    leftArm.castShadow = true;
    modelGroup.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 1.2, 0);
    rightArm.castShadow = true;
    modelGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500, // Orange red
      metalness: 0.3,
      roughness: 0.7,
    });

    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.25, 0.4, 0);
    leftLeg.castShadow = true;
    modelGroup.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.25, 0.4, 0);
    rightLeg.castShadow = true;
    modelGroup.add(rightLeg);

    // Fire staff
    const staffGroup = new THREE.Group();

    // Staff rod
    const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
    const rodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Saddle brown
      metalness: 0.2,
      roughness: 0.8,
    });
    const rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.castShadow = true;
    staffGroup.add(rod);

    // Fire orb
    const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500, // Orange red
      metalness: 0.5,
      roughness: 0.5,
      emissive: 0xff0000,
      emissiveIntensity: 0.8,
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.y = 1.0;
    orb.castShadow = true;
    staffGroup.add(orb);

    // Position staff in right hand
    staffGroup.position.set(0.7, 0.9, 0.2);
    staffGroup.rotation.z = Math.PI / 12;
    modelGroup.add(staffGroup);

    // Fire particles
    const fireGroup = new THREE.Group();
    for (let i = 0; i < 15; i++) {
      const flameGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
      const flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4500, // Orange red
        emissive: 0xff0000,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7,
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);

      // Random position around the orb
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.2;
      flame.position.set(
        Math.cos(angle) * radius,
        1.0 + Math.random() * 0.3,
        Math.sin(angle) * radius
      );

      // Random rotation
      flame.rotation.x = Math.random() * Math.PI;
      flame.rotation.y = Math.random() * Math.PI;
      flame.rotation.z = Math.random() * Math.PI;

      fireGroup.add(flame);
    }
    staffGroup.add(fireGroup);

    return modelGroup;
  }
}
