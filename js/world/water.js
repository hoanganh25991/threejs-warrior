import * as THREE from "three";
import { Water as ThreeWater } from "three/addons/objects/Water.js";

/**
 * Creates and adds water to the scene
 */
export default class Water extends THREE.Object3D {
  constructor() {
    super();
    // Create water
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

    // Create water material
    const water = new ThreeWater(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "assets/images/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(0, 1, 0),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    });

    // Rotate and position the water
    water.rotation.x = -Math.PI / 2;
    water.position.y = -5;

    return water;
  }
}
