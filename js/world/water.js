import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";
import { Water as ThreeWater } from "https://unpkg.com/three@0.157.0/examples/jsm/objects/Water.js";

/**
 * Creates and adds water to the scene
 */
export default class Water extends THREE.Object3D {
  constructor() {

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
