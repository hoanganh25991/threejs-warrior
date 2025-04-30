import * as THREE from "https://unpkg.com/three@0.157.0/build/three.module.js";

/**
 * Creates and adds stairs to the scene
 */
export default class Stairs extends THREE.Object3D {
  constructor() {
    super();

    // Add stairs to the castle
    const stairsGroup = new THREE.Group();

    // Create stairs with improved dimensions
    const stairWidth = 10;
    const stairDepth = 1.5; // Increased depth for better walkability
    const stairHeight = 0.4; // Slightly lower height for smoother climbing
    const numStairs = 20;

    const stairMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080, // Gray
      roughness: 0.8,
      metalness: 0.2,
    });

    // Create a single geometry for all stairs for better performance
    const stairsGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    for (let i = 0; i < numStairs; i++) {
      // Create vertices for each stair
      const x1 = -stairWidth/2, x2 = stairWidth/2;
      const y1 = i * stairHeight;
      const z1 = -i * stairDepth, z2 = (-i * stairDepth) - stairDepth;

      // Add vertices for the stair (6 vertices per stair - 2 triangles)
      const vBase = i * 6;
      vertices.push(
        // Front face
        x1, y1, z1,
        x2, y1, z1,
        x1, y1, z2,
        x2, y1, z2,
        // Top face
        x1, y1 + stairHeight, z2,
        x2, y1 + stairHeight, z2
      );

      // Add indices for the stair
      indices.push(
        vBase, vBase + 1, vBase + 2,
        vBase + 1, vBase + 3, vBase + 2,
        vBase + 2, vBase + 3, vBase + 4,
        vBase + 3, vBase + 5, vBase + 4
      );
    }

    // Create the buffer geometry
    stairsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    stairsGeometry.setIndex(indices);
    stairsGeometry.computeVertexNormals();

    // Create the mesh
    const stairsMesh = new THREE.Mesh(stairsGeometry, stairMaterial);
    stairsMesh.castShadow = true;
    stairsMesh.receiveShadow = true;

    // Add collision boxes for each stair section
    for (let i = 0; i < numStairs; i++) {
      const collisionBox = new THREE.Box3();
      const min = new THREE.Vector3(-stairWidth/2, i * stairHeight, -i * stairDepth - stairDepth);
      const max = new THREE.Vector3(stairWidth/2, (i + 1) * stairHeight, -i * stairDepth);
      collisionBox.set(min, max);
      
      // Store collision box in userData
      if (!stairsMesh.userData.collisionBoxes) {
        stairsMesh.userData.collisionBoxes = [];
      }
      stairsMesh.userData.collisionBoxes.push(collisionBox);
    }

    stairsGroup.add(stairsMesh);

    // Position stairs leading to castle
    stairsGroup.position.set(0, 0, -180);

    // Set properties for collision detection
    stairsGroup.type = "stairs";
    stairsGroup.isWalkable = true;
    stairsGroup.isCollidable = true; // Make sure it's collidable
    stairsGroup.userData = {
      type: "stairs",
      isSlope: true // Mark as a slope for proper collision handling
    };

    return stairsGroup;
  }
}
