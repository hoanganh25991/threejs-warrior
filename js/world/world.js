import * as THREE from "three";
import Groud from "./ground.js";
import Water from "./water.js";
import Skybox from "./skybox.js";
import Sky from "./sky.js";
import Moutain from "./mountain.js";
import Castle from "./castle.js";
import Tree from "./tree.js";
import Rock from "./rock.js";
import { addInteractiveObjects } from "./interactive-objects/interactive-objects.js";
import Stairs from "./stairs.js";
import Bridge from "./bridge.js";

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.init(scene);
  }

  init(scene) {
    // Initialize collections for interactive objects
    this.interactiveObjects = [];

    // Add skybox (this should be first to be in the background)
    this.skybox = new Skybox();
    scene.add(this.skybox);

    // Add ground
    this.ground = new Groud();
    scene.add(this.ground);

    // Add water
    this.water = new Water();
    scene.add(this.water);

    // Add sky (atmospheric sky)
    this.sky = new Sky();
    scene.add(this.sky);

    // Add mountains
    for (let i = 0; i < 5; i++) {
      const mountain = new Moutain();
      scene.add(mountain);
    }

    // Add castle
    this.castle = new Castle();
    scene.add(this.castle);

    // Add trees
    for (let i = 0; i < 40; ++i) {
      const tree = new Tree();
      scene.add(tree);
    }
    // Trees are already added to the scene in the Trees constructor

    // Add rocks
    for (let i = 0; i < 30; ++i) {
      const rock = new Rock();
      scene.add(rock);
    }

    // Add stairs to castle
    const stairs = new Stairs();
    this.interactiveObjects.push(stairs);

    // Add bridge
    const bridge = new Bridge();
    scene.add(bridge);

    // Add interactive objects
    this.interactiveObjects = addInteractiveObjects(scene);
  }

  update(deltaTime, camera) {
    // Update water
    if (this.water) {
      this.water.material.uniforms["time"].value += deltaTime;
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
      if (obj.type === "chest") {
        obj.mesh.rotation.y += deltaTime * 0.1;
      }

      // Animate crystals
      if (obj.type === "crystal") {
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
