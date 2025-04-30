import * as THREE from 'three';
import { addGround } from './ground.js';
import { addWater } from './water.js';
import Skybox from './skybox.js';
import { addSky } from './sky.js';
import { addMountains } from './mountains.js';
import Castle from './castle.js';
import Trees from './trees.js';
import { addRocks } from './rock.js';
import { addInteractiveObjects } from './interactive-objects.js';
import { addStairs } from './stairs.js';
import { Bridge } from './bridge.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.water = null;
        this.sky = null;
        this.skybox = null;
        this.ground = null;
        this.interactiveObjects = [];
        
        // Initialize the world
        this.init();
    }
    
    init() {
        // Initialize collections for interactive objects
        this.interactiveObjects = [];
        
        // Add skybox (this should be first to be in the background)
        this.skybox = new Skybox();
        this.scene.add(this.skybox);
        
        // Add ground
        this.ground = addGround(this.scene);
        
        // Add water
        this.water = addWater(this.scene);
        
        // Add sky (atmospheric sky)
        this.sky = addSky(this.scene);
        
        // Add mountains
        this.mountains = addMountains(this.scene);
        
        // Add castle
        this.castle = new Castle();
        this.scene.add(this.castle);
        
        // Add trees
        this.trees = new Trees(this.scene);
        this.scene.add(this.trees);
        
        // Add rocks
        this.rocks = addRocks(this.scene);
        
        // Add interactive objects
        const interactiveObjects = addInteractiveObjects(this.scene);
        this.interactiveObjects.push(...interactiveObjects);
        
        // Add stairs to castle
        const stairs = addStairs(this.scene);
        this.interactiveObjects.push(stairs);
        
        // Add bridge
        const bridge = new Bridge();
        this.scene.add(bridge);
        this.interactiveObjects.push(bridge);
    }
    
    update(deltaTime, camera) {
        // Update water
        if (this.water) {
            this.water.material.uniforms['time'].value += deltaTime;
        }
        
        // Update skybox position to follow camera but keep it at a distance
        // This ensures the skybox is always far away and unreachable
        if (this.skybox && camera) {
            // Copy camera position but don't move skybox in Y direction
            // This prevents the player from "standing" on the skybox
            this.skybox.position.x = camera.position.x;
            this.skybox.position.z = camera.position.z;
            
            // Keep skybox Y position fixed at 0 to prevent flying above it
            this.skybox.position.y = 0;
        }
        
        // Update interactive objects
        for (const obj of this.interactiveObjects) {
            // Animate chests slightly
            if (obj.type === 'chest') {
                obj.mesh.rotation.y += deltaTime * 0.1;
            }
            
            // Animate crystals
            if (obj.type === 'crystal') {
                obj.mesh.rotation.y += deltaTime * 0.5;
                
                // Pulse the emissive intensity
                const material = obj.mesh.children[0].material;
                material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
                
                // Update the light intensity
                const light = obj.mesh.children[2];
                light.intensity = 1 + Math.sin(Date.now() * 0.003) * 0.5;
            }
        }
    }
}

export default World;