import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.water = null;
        this.sky = null;
        
        // Initialize the world
        this.init();
    }
    
    init() {
        // Add ground
        this.addGround();
        
        // Add water
        this.addWater();
        
        // Add sky
        this.addSky();
        
        // Add mountains
        this.addMountains();
        
        // Add castle
        this.addCastle();
        
        // Add trees
        this.addTrees();
        
        // Add rocks
        this.addRocks();
    }
    
    addGround() {
        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3a7e4f,  // Green color for grass
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Rotate and position the ground
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
    }
    
    addWater() {
        // Create water
        const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
        
        // Create water material
        this.water = new Water(
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
        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = -5;
        
        this.scene.add(this.water);
    }
    
    addSky() {
        // Create sky
        this.sky = new Sky();
        this.sky.scale.setScalar(10000);
        
        const skyUniforms = this.sky.material.uniforms;
        
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
        
        this.scene.add(this.sky);
    }
    
    addMountains() {
        // Create mountains using simple geometry
        for (let i = 0; i < 5; i++) {
            const mountainGeometry = new THREE.ConeGeometry(20 + Math.random() * 30, 50 + Math.random() * 50, 4);
            const mountainMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x808080,
                roughness: 0.9,
                metalness: 0.1
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            // Position mountains randomly in the distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 100;
            mountain.position.x = Math.cos(angle) * distance;
            mountain.position.z = Math.sin(angle) * distance;
            mountain.position.y = 0;
            
            // Rotate randomly
            mountain.rotation.y = Math.random() * Math.PI * 2;
            
            mountain.castShadow = true;
            mountain.receiveShadow = true;
            
            this.scene.add(mountain);
        }
    }
    
    addCastle() {
        // Create a simple castle in the distance
        const castleGroup = new THREE.Group();
        
        // Main castle body
        const castleBodyGeometry = new THREE.BoxGeometry(30, 40, 30);
        const castleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });
        const castleBody = new THREE.Mesh(castleBodyGeometry, castleMaterial);
        castleBody.position.y = 20;
        castleGroup.add(castleBody);
        
        // Castle towers
        for (let i = 0; i < 4; i++) {
            const towerGeometry = new THREE.CylinderGeometry(5, 5, 50, 8);
            const tower = new THREE.Mesh(towerGeometry, castleMaterial);
            
            // Position at corners
            const angle = (i * Math.PI / 2) + (Math.PI / 4);
            tower.position.x = Math.cos(angle) * 20;
            tower.position.z = Math.sin(angle) * 20;
            tower.position.y = 25;
            
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
        
        this.scene.add(castleGroup);
    }
    
    addTrees() {
        // Add trees around the scene
        for (let i = 0; i < 50; i++) {
            const treeGroup = new THREE.Group();
            
            // Tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8b4513,
                roughness: 0.9,
                metalness: 0.1
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 2.5;
            treeGroup.add(trunk);
            
            // Tree leaves
            const leavesGeometry = new THREE.ConeGeometry(3, 7, 8);
            const leavesMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2e8b57,
                roughness: 0.8,
                metalness: 0.1
            });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 7;
            treeGroup.add(leaves);
            
            // Position trees randomly
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 80;
            treeGroup.position.x = Math.cos(angle) * distance;
            treeGroup.position.z = Math.sin(angle) * distance;
            
            treeGroup.castShadow = true;
            treeGroup.receiveShadow = true;
            
            this.scene.add(treeGroup);
        }
    }
    
    addRocks() {
        // Add rocks around the scene
        for (let i = 0; i < 30; i++) {
            const rockGeometry = new THREE.DodecahedronGeometry(1 + Math.random() * 2, 0);
            const rockMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x808080,
                roughness: 0.9,
                metalness: 0.1
            });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Position rocks randomly
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 90;
            rock.position.x = Math.cos(angle) * distance;
            rock.position.z = Math.sin(angle) * distance;
            rock.position.y = 0.5;
            
            // Random rotation
            rock.rotation.x = Math.random() * Math.PI;
            rock.rotation.y = Math.random() * Math.PI;
            rock.rotation.z = Math.random() * Math.PI;
            
            // Random scale
            const scale = 0.5 + Math.random() * 1.5;
            rock.scale.set(scale, scale, scale);
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.scene.add(rock);
        }
    }
    
    update(deltaTime) {
        // Update water
        if (this.water) {
            this.water.material.uniforms['time'].value += deltaTime;
        }
    }
}

export default World;