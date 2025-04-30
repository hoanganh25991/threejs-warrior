import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

/**
 * Creates and adds atmospheric sky to the scene
 * @param {THREE.Scene} scene - The scene to add the sky to
 * @returns {Sky} - The sky object
 */
export function addSky(scene) {
    // Create sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    
    const skyUniforms = sky.material.uniforms;
    
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    const sun = new THREE.Vector3();
    
    const parameters = {
        elevation: 2,
        azimuth: 180
    };
    
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    
    sun.setFromSphericalCoords(1, phi, theta);
    
    skyUniforms['sunPosition'].value.copy(sun);
    
    scene.add(sky);
    
    return sky;
}