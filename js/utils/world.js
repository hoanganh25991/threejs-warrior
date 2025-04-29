import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.water = null;
        this.sky = null;
        this.skybox = null;
        
        // Initialize the world
        this.init();
    }
    
    init() {
        // Initialize collections for interactive objects
        this.interactiveObjects = [];
        
        // Add skybox (this should be first to be in the background)
        this.addSkybox();
        
        // Add ground
        this.addGround();
        
        // Add water
        this.addWater();
        
        // Add sky (atmospheric sky)
        this.addSky();
        
        // Add mountains
        this.addMountains();
        
        // Add castle
        this.addCastle();
        
        // Add trees
        this.addTrees();
        
        // Add rocks
        this.addRocks();
        
        // Add interactive objects
        this.addInteractiveObjects();
        
        // Add stairs to castle
        this.addStairs();
        
        // Add bridge
        this.addBridge();
    }
    
    addGround() {
        // Create a more detailed ground with texture
        const groundSize = 1000;
        const groundSegments = 128;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, groundSegments, groundSegments);
        
        // Create a canvas for the ground texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const context = canvas.getContext('2d');
        
        // Fill with base color
        context.fillStyle = '#3a7e4f';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some texture variation
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 4 + 1;
            const alpha = Math.random() * 0.2 + 0.05;
            
            // Randomly choose between darker and lighter patches
            if (Math.random() > 0.5) {
                context.fillStyle = `rgba(30, 80, 30, ${alpha})`;  // Darker green
            } else {
                context.fillStyle = `rgba(100, 180, 100, ${alpha})`;  // Lighter green
            }
            
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }
        
        // Create texture from canvas
        const groundTexture = new THREE.CanvasTexture(canvas);
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(10, 10);
        
        // Create bump map for more detail
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = 1024;
        bumpCanvas.height = 1024;
        const bumpContext = bumpCanvas.getContext('2d');
        
        // Fill with neutral gray
        bumpContext.fillStyle = '#808080';
        bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
        
        // Add random bumps
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * bumpCanvas.width;
            const y = Math.random() * bumpCanvas.height;
            const size = Math.random() * 6 + 1;
            const value = Math.random() * 60 + 100;  // Values between 100-160
            
            bumpContext.fillStyle = `rgb(${value}, ${value}, ${value})`;
            bumpContext.beginPath();
            bumpContext.arc(x, y, size, 0, Math.PI * 2);
            bumpContext.fill();
        }
        
        const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
        bumpTexture.wrapS = THREE.RepeatWrapping;
        bumpTexture.wrapT = THREE.RepeatWrapping;
        bumpTexture.repeat.set(10, 10);
        
        // Create ground material with textures
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: groundTexture,
            bumpMap: bumpTexture,
            bumpScale: 0.2,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        
        // Rotate and position the ground
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        
        // Add collision detection for the ground
        this.ground = ground;
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
    
    addSkybox() {
        // Create a skybox using a cube texture
        const loader = new THREE.CubeTextureLoader();
        loader.setPath('/Users/anhle/work-station/game-v5/assets/images/skybox/');
        
        // Use placeholder colors for the skybox faces
        const materialArray = [];
        const faceColors = [0x0077ff, 0x00aaff, 0x55aaff, 0x55aaff, 0x0088ff, 0x0088ff]; // Different blue shades
        
        for (let i = 0; i < 6; i++) {
            // Create a canvas for each face
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            // Fill with color
            context.fillStyle = '#' + faceColors[i].toString(16).padStart(6, '0');
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add some simple clouds or stars to make it more interesting
            context.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let j = 0; j < 100; j++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = Math.random() * 3 + 1;
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();
            }
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            materialArray.push(new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide
            }));
        }
        
        // Create skybox mesh
        const skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);
        this.skybox = new THREE.Mesh(skyboxGeo, materialArray);
        this.scene.add(this.skybox);
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
    
    update(deltaTime, camera) {
        // Update water
        if (this.water) {
            this.water.material.uniforms['time'].value += deltaTime;
        }
        
        // Update skybox position to follow camera
        if (this.skybox && camera) {
            this.skybox.position.copy(camera.position);
        }
    }
}

export default World;