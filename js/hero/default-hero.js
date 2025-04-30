import * as THREE from "three";

export default class DefaultHero extends THREE.Object3D {
  constructor() {
    super();
    // Create a simple default hero
    const modelGroup = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    mesh.castShadow = true;

    modelGroup.add(mesh);
    return modelGroup;
  }
}
