import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";
import { Sky as ThreeSky } from "https://unpkg.com/three@0.157.0/examples/jsm/objects/Sky.js";

/**
 * Creates and adds atmospheric sky to the scene
 */
export default class Sky extends THREE.Object3D {
  constructor() {

    // Create sky
    const sky = new ThreeSky();
    sky.scale.setScalar(10000);

    const skyUniforms = sky.material.uniforms;

    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const sun = new THREE.Vector3();

    const parameters = {
      elevation: 2,
      azimuth: 180,
    };

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    skyUniforms["sunPosition"].value.copy(sun);

    return sky;
  }
}
