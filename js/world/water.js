import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

/**
 * Creates and adds water to the scene
 * @param {THREE.Scene} scene - The scene to add water to
 * @returns {Water} - The water object
 */
export function addWater(scene) {
    // Create water
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
    
    // Create water material
    const water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('assets/images/waternormals.jpg', function(texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(0, 1, 0),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: false
        }
    );
    
    // Rotate and position the water
    water.rotation.x = -Math.PI / 2;
    water.position.y = -5;
    
    scene.add(water);
    
    return water;
}