import * as THREE from "three";

/**
 * Creates and adds a castle to the scene
 */

export default class Castle extends THREE.Object3D {
  constructor() {
    super();

    // Create a simple castle in the distance
    const castleGroup = new THREE.Group();
    
    const castleMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Main castle body with separate collision walls
    const createWall = (width, height, depth, x, y, z) => {
      const wallGeometry = new THREE.BoxGeometry(width, height, depth);
      const wall = new THREE.Mesh(wallGeometry, castleMaterial);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      
      // Add collision box
      wall.userData = {
        type: 'wall',
        isCollidable: true,
        isWalkable: false,
        collisionBox: new THREE.Box3().setFromObject(wall)
      };
      
      return wall;
    };

    // Main castle walls
    const wallThickness = 2;
    const wallHeight = 40;
    const castleWidth = 30;
    const castleDepth = 30;

    // Front wall
    const frontWall = createWall(castleWidth, wallHeight, wallThickness, 0, wallHeight/2, castleDepth/2);
    castleGroup.add(frontWall);

    // Back wall
    const backWall = createWall(castleWidth, wallHeight, wallThickness, 0, wallHeight/2, -castleDepth/2);
    castleGroup.add(backWall);

    // Left wall
    const leftWall = createWall(wallThickness, wallHeight, castleDepth, -castleWidth/2, wallHeight/2, 0);
    castleGroup.add(leftWall);

    // Right wall
    const rightWall = createWall(wallThickness, wallHeight, castleDepth, castleWidth/2, wallHeight/2, 0);
    castleGroup.add(rightWall);

    // Floor (walkable)
    const floor = createWall(castleWidth, wallThickness, castleDepth, 0, 0, 0);
    floor.userData.isWalkable = true;
    floor.userData.isCollidable = false;
    castleGroup.add(floor);

    // Add towers at corners
    for (let i = 0; i < 4; i++) {
      // Tower body
      const towerGeometry = new THREE.CylinderGeometry(5, 5, 50, 8);
      const tower = new THREE.Mesh(towerGeometry, castleMaterial);

      // Position at corners
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const cornerX = Math.cos(angle) * 20;
      const cornerZ = Math.sin(angle) * 20;
      tower.position.set(cornerX, 25, cornerZ);

      // Add collision cylinder for tower
      tower.userData = {
        type: 'tower',
        isCollidable: true,
        isWalkable: false,
        collisionRadius: 5
      };

      castleGroup.add(tower);

      // Tower tops
      const towerTopGeometry = new THREE.ConeGeometry(6, 10, 8);
      const towerTop = new THREE.Mesh(towerTopGeometry, castleMaterial);
      towerTop.position.y = 30;
      tower.add(towerTop);
    }

    // Position castle in the distance
    castleGroup.position.set(0, 0, -200);
    castleGroup.castShadow = true;
    castleGroup.receiveShadow = true;

    // Set castle group properties
    castleGroup.userData = { 
      type: 'castle',
      isStructure: true
    };
    castleGroup.type = 'castle';

    return castleGroup;
  }
}
