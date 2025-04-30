import * as THREE from "three";

export class DefaultHero extends THREE.Object3D {
  constructor(scene) {
    // Create a simple default hero
    const bodyGroup = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    mesh.castShadow = true;

    bodyGroup.add(this.mesh);
    return bodyGroup;
  }
}
