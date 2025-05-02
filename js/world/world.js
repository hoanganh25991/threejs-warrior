import * as THREE from 'three';
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
    // Initialize collections
    this.interactiveObjects = [];
    this.trees = [];
    this.rocks = [];

    // Add skybox (this should be first to be in the background)
    const skyboxObj = new Skybox();
    this.skybox = skyboxObj;
    scene.add(this.skybox);

    // Add ground
    const groundObj = new Groud();
    this.ground = groundObj;
    scene.add(this.ground);

    // Add water
    const waterObj = new Water();
    this.water = waterObj;
    // Water position is already set in the Water class
    scene.add(this.water);

    // Add sky (atmospheric sky)
    const skyObj = new Sky();
    this.sky = skyObj;
    scene.add(this.sky);

    // Add mountains
    this.mountains = [];
    for (let i = 0; i < 5; i++) {
      const mountainObj = new Moutain();
      const mountain = mountainObj;
      this.mountains.push(mountain);
      scene.add(mountain);
    }

    // Add castle
    const castleObj = new Castle();
    this.castle = castleObj;
    scene.add(this.castle);

    // Add trees
    for (let i = 0; i < 40; ++i) {
      const treeObj = new Tree();
      const tree = treeObj;
      scene.add(tree);
      this.interactiveObjects.push({
        mesh: tree,
        type: 'tree',
        isCollidable: true,
        isWalkable: false
      });
    }

    // Add rocks
    for (let i = 0; i < 30; ++i) {
      const rockObj = new Rock();
      const rock = rockObj;
      scene.add(rock);
      this.interactiveObjects.push({
        mesh: rock,
        type: 'rock',
        isCollidable: true,
        isWalkable: false
      });
    }

    // Add stairs to castle
    const stairsObj = new Stairs();
    this.stairs = stairsObj;
    this.stairs.position.z = -120;
    this.stairs.position.y = 0;
    scene.add(this.stairs);
    this.interactiveObjects.push({
      mesh: this.stairs,
      type: 'stairs',
      isCollidable: true,
      isWalkable: true
    });

    // Add bridge
    const bridgeObj = new Bridge();
    this.bridge = bridgeObj;
    this.bridge.position.z = -150;
    this.bridge.position.y = 5;
    scene.add(this.bridge);
    this.interactiveObjects.push({
      mesh: this.bridge,
      type: 'bridge',
      isCollidable: true,
      isWalkable: true
    });

    // Add water collision
    this.interactiveObjects.push({
      mesh: this.water,
      type: 'water',
      isCollidable: true,
      isWalkable: false
    });

    // Add ground collision
    this.interactiveObjects.push({
      mesh: this.ground,
      type: 'ground',
      isCollidable: true,
      isWalkable: true
    });

    // Add castle collision
    this.interactiveObjects.push({
      mesh: this.castle,
      type: 'castle',
      isCollidable: true,
      isWalkable: true
    });

    // Add other interactive objects (chests, crystals, etc)
    const otherObjects = addInteractiveObjects(scene).map(obj => ({
      ...obj,
      isCollidable: true,
      isWalkable: false
    }));
    this.interactiveObjects.push(...otherObjects);
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
