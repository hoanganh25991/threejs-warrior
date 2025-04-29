import * as THREE from 'three';
import { config } from '../config/config.js';

export class Hero {
    constructor(scene, heroType) {
        this.scene = scene;
        this.heroType = heroType;
        this.mesh = null;
        this.health = config.player.health;
        this.maxHealth = config.player.health;
        this.mana = config.player.mana;
        this.maxMana = config.player.mana;
        this.experience = config.player.experience.initial;
        this.level = 1;
        this.nextLevelExp = config.player.experience.levelUpThreshold;
        this.isJumping = false;
        this.isFlying = false;
        this.jumpTime = 0;
        this.skills = {};
        this.cooldowns = {};
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ'); // YXZ order for FPS-style rotation
        this.direction = new THREE.Vector3(0, 0, -1); // Forward direction
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true; // Start on the ground
        this.wings = null;
        this.wingsVisible = false;
        
        // Debug flag
        this.debug = config.game.debug;
        
        // Initialize the hero
        this.init();
        
        // Ensure we're on the ground at start
        this.group.position.y = 0;
        
        console.log('Hero initialized, onGround:', this.onGround);
    }
    
    init() {
        // Create a group to hold the hero and allow for rotation
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create a complex hero model based on hero type
        switch(this.heroType) {
            case 'dragon-knight':
                this.createDragonKnight();
                break;
            case 'axe':
                this.createAxe();
                break;
            case 'crystal-maiden':
                this.createCrystalMaiden();
                break;
            case 'lina':
                this.createLina();
                break;
            default:
                this.createDefaultHero();
        }
        
        // Add a direction indicator (arrow) to show which way the hero is facing
        const arrowGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        this.arrow.position.set(0, 1.5, -0.8); // Position above and in front of hero
        this.arrow.rotation.x = Math.PI / 2; // Rotate to point forward
        
        // Create wings (initially hidden)
        this.createWings();
        
        // Add arrow to group
        this.group.add(this.arrow);
        
        // Initialize skills based on hero type
        this.initSkills();
    }
    
    createDragonKnight() {
        // Create a more complex Dragon Knight model
        const bodyGroup = new THREE.Group();
        
        // Body - slightly larger and more armored
        const bodyGeometry = new THREE.BoxGeometry(1.2, 1.4, 0.8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        bodyGroup.add(body);
        
        // Head with dragon-like features
        const headGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA52A2A, // Brown
            metalness: 0.5,
            roughness: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.75;
        head.castShadow = true;
        bodyGroup.add(head);
        
        // Dragon horns
        const hornGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
        const hornMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969, // Dark gray
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Left horn
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.25, 2.1, 0);
        leftHorn.rotation.z = Math.PI / 6;
        leftHorn.castShadow = true;
        bodyGroup.add(leftHorn);
        
        // Right horn
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.25, 2.1, 0);
        rightHorn.rotation.z = -Math.PI / 6;
        rightHorn.castShadow = true;
        bodyGroup.add(rightHorn);
        
        // Armor plates
        const plateGeometry = new THREE.BoxGeometry(1.4, 0.3, 1);
        const plateMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xCD5C5C, // Indian red
            metalness: 0.9,
            roughness: 0.1
        });
        
        // Shoulder plates
        const shoulderPlate = new THREE.Mesh(plateGeometry, plateMaterial);
        shoulderPlate.position.y = 1.5;
        shoulderPlate.castShadow = true;
        bodyGroup.add(shoulderPlate);
        
        // Arms - more muscular
        const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            metalness: 0.6,
            roughness: 0.4
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.75, 1.2, 0);
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.75, 1.2, 0);
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            metalness: 0.6,
            roughness: 0.4
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, 0.45, 0);
        leftLeg.castShadow = true;
        bodyGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, 0.45, 0);
        rightLeg.castShadow = true;
        bodyGroup.add(rightLeg);
        
        // Sword
        const swordGroup = new THREE.Group();
        
        // Sword blade
        const bladeGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.05);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0, // Silver
            metalness: 1.0,
            roughness: 0.0
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.6;
        blade.castShadow = true;
        swordGroup.add(blade);
        
        // Sword handle
        const handleGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.15);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            metalness: 0.2,
            roughness: 0.8
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        handle.castShadow = true;
        swordGroup.add(handle);
        
        // Position sword in right hand
        swordGroup.position.set(1.1, 1.2, 0.2);
        swordGroup.rotation.z = Math.PI / 4;
        bodyGroup.add(swordGroup);
        
        // Shield
        const shieldGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.6);
        const shieldMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xB22222, // Firebrick
            metalness: 0.7,
            roughness: 0.3
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(-1.0, 1.2, 0);
        shield.castShadow = true;
        bodyGroup.add(shield);
        
        // Add the complete body to the group
        this.group.add(bodyGroup);
        this.mesh = body; // Set the main body as the reference mesh
    }
    
    createAxe() {
        // Create a more complex Axe model
        const bodyGroup = new THREE.Group();
        
        // Body - bulky and muscular
        const bodyGeometry = new THREE.BoxGeometry(1.5, 1.3, 0.9);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        bodyGroup.add(body);
        
        // Head - smaller relative to body
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA0522D, // Sienna
            metalness: 0.3,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.85;
        head.castShadow = true;
        bodyGroup.add(head);
        
        // Helmet
        const helmetGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.4, 8);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969, // Dark gray
            metalness: 0.8,
            roughness: 0.2
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 2.0;
        helmet.castShadow = true;
        bodyGroup.add(helmet);
        
        // Shoulder armor - massive
        const shoulderGeometry = new THREE.SphereGeometry(0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const shoulderMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000, // Dark red
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Left shoulder
        const leftShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        leftShoulder.position.set(-0.75, 1.5, 0);
        leftShoulder.rotation.z = -Math.PI / 2;
        leftShoulder.castShadow = true;
        bodyGroup.add(leftShoulder);
        
        // Right shoulder
        const rightShoulder = new THREE.Mesh(shoulderGeometry, shoulderMaterial);
        rightShoulder.position.set(0.75, 1.5, 0);
        rightShoulder.rotation.z = Math.PI / 2;
        rightShoulder.castShadow = true;
        bodyGroup.add(rightShoulder);
        
        // Arms - very muscular
        const armGeometry = new THREE.BoxGeometry(0.4, 0.9, 0.4);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xA0522D, // Sienna
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.95, 1.1, 0);
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.95, 1.1, 0);
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);
        
        // Legs - thick and powerful
        const legGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, 0.4, 0);
        leftLeg.castShadow = true;
        bodyGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.4, 0.4, 0);
        rightLeg.castShadow = true;
        bodyGroup.add(rightLeg);
        
        // Battle Axe
        const axeGroup = new THREE.Group();
        
        // Axe handle
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            metalness: 0.2,
            roughness: 0.8
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.castShadow = true;
        axeGroup.add(handle);
        
        // Axe blade
        const bladeGeometry = new THREE.ConeGeometry(0.4, 0.8, 4);
        const bladeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xC0C0C0, // Silver
            metalness: 0.9,
            roughness: 0.1
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.8;
        blade.rotation.z = Math.PI / 2;
        blade.castShadow = true;
        axeGroup.add(blade);
        
        // Position axe in hands
        axeGroup.position.set(0.8, 1.2, 0.5);
        axeGroup.rotation.x = Math.PI / 4;
        bodyGroup.add(axeGroup);
        
        // Add the complete body to the group
        this.group.add(bodyGroup);
        this.mesh = body; // Set the main body as the reference mesh
    }
    
    createCrystalMaiden() {
        // Create a more complex Crystal Maiden model
        const bodyGroup = new THREE.Group();
        
        // Body - slender and feminine
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, // Light sky blue
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        bodyGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFE4E1, // Misty rose
            metalness: 0.1,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        bodyGroup.add(head);
        
        // Hair/Hood
        const hoodGeometry = new THREE.ConeGeometry(0.4, 0.8, 16, 1, true);
        const hoodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00BFFF, // Deep sky blue
            metalness: 0.2,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.y = 2.0;
        hood.rotation.x = Math.PI;
        hood.castShadow = true;
        bodyGroup.add(hood);
        
        // Cape
        const capeGeometry = new THREE.PlaneGeometry(1.2, 1.8);
        const capeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00BFFF, // Deep sky blue
            metalness: 0.2,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const cape = new THREE.Mesh(capeGeometry, capeMaterial);
        cape.position.set(0, 1.2, -0.4);
        cape.castShadow = true;
        bodyGroup.add(cape);
        
        // Arms - slender
        const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, // Light sky blue
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1.2, 0);
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1.2, 0);
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, // Light sky blue
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        leftLeg.castShadow = true;
        bodyGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        rightLeg.castShadow = true;
        bodyGroup.add(rightLeg);
        
        // Staff
        const staffGroup = new THREE.Group();
        
        // Staff rod
        const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
        const rodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, // Burlywood
            metalness: 0.2,
            roughness: 0.8
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.castShadow = true;
        staffGroup.add(rod);
        
        // Crystal top
        const crystalGeometry = new THREE.OctahedronGeometry(0.2);
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xADD8E6, // Light blue
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8,
            emissive: 0x00BFFF,
            emissiveIntensity: 0.5
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.y = 1.0;
        crystal.castShadow = true;
        staffGroup.add(crystal);
        
        // Position staff in right hand
        staffGroup.position.set(0.7, 0.9, 0.2);
        staffGroup.rotation.z = Math.PI / 12;
        bodyGroup.add(staffGroup);
        
        // Ice particles
        const particlesGroup = new THREE.Group();
        for (let i = 0; i < 10; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xADD8E6, // Light blue
                emissive: 0x00BFFF,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the crystal
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.2;
            particle.position.set(
                Math.cos(angle) * radius,
                1.0 + Math.random() * 0.4,
                Math.sin(angle) * radius
            );
            
            particlesGroup.add(particle);
        }
        staffGroup.add(particlesGroup);
        
        // Add the complete body to the group
        this.group.add(bodyGroup);
        this.mesh = body; // Set the main body as the reference mesh
    }
    
    createLina() {
        // Create a more complex Lina model
        const bodyGroup = new THREE.Group();
        
        // Body - slender and feminine
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500, // Orange red
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        bodyGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFE4C4, // Bisque
            metalness: 0.1,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        bodyGroup.add(head);
        
        // Hair
        const hairGeometry = new THREE.ConeGeometry(0.4, 0.8, 16, 1, true);
        const hairMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500, // Orange red
            metalness: 0.4,
            roughness: 0.6,
            side: THREE.DoubleSide
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 2.0;
        hair.rotation.x = Math.PI;
        hair.castShadow = true;
        bodyGroup.add(hair);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500, // Orange red
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1.2, 0);
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1.2, 0);
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500, // Orange red
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        leftLeg.castShadow = true;
        bodyGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        rightLeg.castShadow = true;
        bodyGroup.add(rightLeg);
        
        // Fire staff
        const staffGroup = new THREE.Group();
        
        // Staff rod
        const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
        const rodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Saddle brown
            metalness: 0.2,
            roughness: 0.8
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.castShadow = true;
        staffGroup.add(rod);
        
        // Fire orb
        const orbGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF4500, // Orange red
            metalness: 0.5,
            roughness: 0.5,
            emissive: 0xFF0000,
            emissiveIntensity: 0.8
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.y = 1.0;
        orb.castShadow = true;
        staffGroup.add(orb);
        
        // Position staff in right hand
        staffGroup.position.set(0.7, 0.9, 0.2);
        staffGroup.rotation.z = Math.PI / 12;
        bodyGroup.add(staffGroup);
        
        // Fire particles
        const fireGroup = new THREE.Group();
        for (let i = 0; i < 15; i++) {
            const flameGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
            const flameMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xFF4500, // Orange red
                emissive: 0xFF0000,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            
            // Random position around the orb
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.2;
            flame.position.set(
                Math.cos(angle) * radius,
                1.0 + Math.random() * 0.3,
                Math.sin(angle) * radius
            );
            
            // Random rotation
            flame.rotation.x = Math.random() * Math.PI;
            flame.rotation.y = Math.random() * Math.PI;
            flame.rotation.z = Math.random() * Math.PI;
            
            fireGroup.add(flame);
        }
        staffGroup.add(fireGroup);
        
        // Add the complete body to the group
        this.group.add(bodyGroup);
        this.mesh = body; // Set the main body as the reference mesh
    }
    
    createDefaultHero() {
        // Create a simple default hero
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 1;
        this.mesh.castShadow = true;
        this.group.add(this.mesh);
    }
    
    createWings() {
        // Create wings for the hero
        const wingGroup = new THREE.Group();
        
        // Left wing
        const leftWingGeometry = new THREE.BufferGeometry();
        const leftWingShape = new THREE.Shape();
        
        // Create wing shape
        leftWingShape.moveTo(0, 0);
        leftWingShape.quadraticCurveTo(-1, 1, -2, 0.5);
        leftWingShape.quadraticCurveTo(-1.5, 0, -2, -0.5);
        leftWingShape.quadraticCurveTo(-1, -0.5, 0, 0);
        
        // Create wing geometry
        const leftWingPoints = leftWingShape.getPoints();
        const leftWingVertices = [];
        
        // Create 3D wing by extruding points slightly
        for (let i = 0; i < leftWingPoints.length; i++) {
            leftWingVertices.push(
                leftWingPoints[i].x, leftWingPoints[i].y, 0,
                leftWingPoints[i].x, leftWingPoints[i].y, 0.1
            );
        }
        
        // Create faces
        const leftWingIndices = [];
        for (let i = 0; i < leftWingPoints.length - 1; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = (i + 1) * 2;
            const d = (i + 1) * 2 + 1;
            
            leftWingIndices.push(a, b, c);
            leftWingIndices.push(c, b, d);
        }
        
        // Set geometry attributes
        leftWingGeometry.setIndex(leftWingIndices);
        leftWingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leftWingVertices, 3));
        leftWingGeometry.computeVertexNormals();
        
        // Create wing material
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            emissive: 0x3399ff,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.2
        });
        
        // Create left wing mesh
        const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
        leftWing.position.set(-0.5, 0.5, 0);
        leftWing.scale.set(1, 1, 1);
        
        // Create right wing (mirror of left wing)
        const rightWing = leftWing.clone();
        rightWing.position.set(0.5, 0.5, 0);
        rightWing.scale.set(-1, 1, 1); // Mirror by scaling X negatively
        
        // Add wings to group
        wingGroup.add(leftWing);
        wingGroup.add(rightWing);
        
        // Position wings on hero's back
        wingGroup.position.set(0, 1.2, 0.5);
        
        // Hide wings initially
        wingGroup.visible = false;
        
        // Store wings reference
        this.wings = wingGroup;
        
        // Add wings to hero group
        this.group.add(this.wings);
    }
    
    initSkills() {
        // Assign skills based on hero type
        // In a full implementation, each hero would have unique skills
        this.skills = {
            y: config.skills.fireball,
            u: config.skills.iceSpike,
            i: config.skills.thunderStrike,
            h: config.skills.heal,
            j: config.skills.shield,
            k: config.skills.dash
        };
        
        // Initialize cooldowns
        for (const key in this.skills) {
            this.cooldowns[key] = 0;
        }
    }
    
    update(deltaTime, keys, inputHandler) {
        // Handle rotation from mouse and Q/E keys
        if (inputHandler) {
            this.handleRotation(inputHandler);
        }
        
        // Handle movement
        this.handleMovement(deltaTime, keys);
        
        // Handle jumping and flying
        this.handleJumpAndFly(deltaTime, keys);
        
        // Update cooldowns
        this.updateCooldowns(deltaTime);
        
        // Handle skill activation
        this.handleSkills(keys);
        
        // Update direction vector based on current rotation
        this.updateDirection();
        
        // Animate wings if visible
        if (this.wings && this.wings.visible) {
            // Make wings flap gently
            const wingFlapSpeed = 5;
            const wingFlapAmount = 0.1;
            this.wings.rotation.z = Math.sin(Date.now() * 0.005 * wingFlapSpeed) * wingFlapAmount;
        }
        
        // Update debug display if debug mode is enabled
        if (this.debug) {
            this.updateDebugDisplay();
        }
    }
    
    updateDebugDisplay() {
        // Create or update debug display
        let debugDisplay = document.getElementById('debug-display');
        
        if (!debugDisplay) {
            debugDisplay = document.createElement('div');
            debugDisplay.id = 'debug-display';
            debugDisplay.style.position = 'absolute';
            debugDisplay.style.top = '100px';
            debugDisplay.style.left = '10px';
            debugDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            debugDisplay.style.color = 'white';
            debugDisplay.style.padding = '10px';
            debugDisplay.style.fontFamily = 'monospace';
            debugDisplay.style.fontSize = '12px';
            debugDisplay.style.zIndex = '1000';
            debugDisplay.style.pointerEvents = 'none'; // Don't block mouse events
            document.body.appendChild(debugDisplay);
        }
        
        // Update debug info
        debugDisplay.innerHTML = `
            <h3>Hero Debug Info</h3>
            <p>Position: x=${this.group.position.x.toFixed(2)}, y=${this.group.position.y.toFixed(2)}, z=${this.group.position.z.toFixed(2)}</p>
            <p>Velocity: x=${this.velocity.x.toFixed(2)}, y=${this.velocity.y.toFixed(2)}, z=${this.velocity.z.toFixed(2)}</p>
            <p>onGround: ${this.onGround}</p>
            <p>isJumping: ${this.isJumping}</p>
            <p>isFlying: ${this.isFlying}</p>
            <p>wingsVisible: ${this.wingsVisible}</p>
            <p>Space key pressed: ${window.inputHandler ? window.inputHandler.isKeyPressed(' ') : 'N/A'}</p>
        `;
    }
    
    handleRotation(inputHandler) {
        // Get look direction from input handler
        const lookDir = inputHandler.getLookDirection();
        
        // Apply rotation
        // Horizontal rotation (around Y axis)
        this.rotation.y -= lookDir.x * 0.01;
        
        // Vertical rotation (around X axis) - limit to avoid flipping
        this.rotation.x -= lookDir.y * 0.01;
        // Clamp vertical rotation to prevent flipping over
        this.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.rotation.x));
        
        // Apply rotation to the group - only Y rotation affects the character model
        this.group.rotation.y = this.rotation.y;
        
        // Reset input handler movement to avoid continuous rotation
        inputHandler.resetMovement();
    }
    
    updateDirection() {
        // Update direction vector based on current rotation (both horizontal and vertical)
        this.direction.set(0, 0, -1).applyEuler(this.rotation);
    }
    
    handleMovement(deltaTime, keys) {
        const moveSpeed = config.player.moveSpeed * deltaTime;
        
        // Calculate movement direction relative to facing direction
        let moveX = 0;
        let moveZ = 0;
        
        if (keys.w) {
            moveZ -= 1; // Forward
        }
        if (keys.s) {
            moveZ += 1; // Backward
        }
        if (keys.a) {
            moveX -= 1; // Left
        }
        if (keys.d) {
            moveX += 1; // Right
        }
        
        // Normalize if moving diagonally
        if (moveX !== 0 && moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
        }
        
        // Apply movement relative to facing direction
        if (moveX !== 0 || moveZ !== 0) {
            // Create movement vector
            const movement = new THREE.Vector3(moveX, 0, moveZ);
            
            // Rotate movement vector by hero's Y rotation
            movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            
            // Apply movement
            this.group.position.x += movement.x * moveSpeed;
            this.group.position.z += movement.z * moveSpeed;
        }
    }
    
    handleJumpAndFly(deltaTime, keys) {
        // Apply gravity if not on ground
        if (!this.onGround || this.isJumping) {
            // Apply gravity to velocity
            this.velocity.y -= config.player.gravity * deltaTime;
            
            // Update position based on velocity
            this.group.position.y += this.velocity.y * deltaTime;
            
            // Check if we've landed
            if (this.group.position.y <= 0) {
                // Only play landing sound if we were falling with significant velocity
                if (this.velocity.y < -5 && window.soundManager) {
                    window.soundManager.playSound('land');
                }
                
                this.group.position.y = 0;
                this.velocity.y = 0;
                this.onGround = true;
                this.isJumping = false;
                this.isFlying = false;
                
                // Hide wings when landing
                if (this.wings && this.wingsVisible) {
                    this.wings.visible = false;
                    this.wingsVisible = false;
                }
            }
        }
        
        // Handle continuous jumping with space key
        if (keys[' ']) {
            // If on ground, initiate jump
            if (this.onGround) {
                console.log('Jump initiated from ground!');
                this.velocity.y = config.player.jumpForce;
                this.isJumping = true;
                this.onGround = false;
                
                // Play jump sound
                if (window.soundManager) {
                    window.soundManager.playSound('jump');
                }
            }
            // If already in the air, add continuous upward force
            else if (this.isJumping || this.isFlying) {
                // Add continuous boost while space is held
                this.velocity.y += config.player.jumpForce * 0.05; // Small continuous boost
                
                // Cap upward velocity to prevent going too fast
                if (this.velocity.y > config.player.jumpForce * 0.8) {
                    this.velocity.y = config.player.jumpForce * 0.8;
                }
                
                // Enter flying mode if not already
                if (!this.isFlying && this.group.position.y > 2) {
                    this.isFlying = true;
                    
                    // Play a whoosh sound for flying
                    if (window.soundManager) {
                        window.soundManager.playSound('dash');
                    }
                }
            }
            
            // Debug logging
            console.log('Space pressed, y-pos:', this.group.position.y.toFixed(2), 
                        'velocity:', this.velocity.y.toFixed(2), 
                        'flying:', this.isFlying);
        }
        
        // Show/hide wings based on height - FIXED to ensure wings show up
        if (this.wings) {
            // Debug logging for wings
            console.log('Wings check - Height:', this.group.position.y, 
                        'Flying height threshold:', config.player.flyingHeight,
                        'Wings visible:', this.wingsVisible,
                        'Wings object:', this.wings);
            
            // Force wings to be visible when above flying height
            if (this.group.position.y > 3) { // Lower threshold to make wings appear sooner
                if (!this.wingsVisible) {
                    console.log('SHOWING WINGS!');
                    this.wings.visible = true;
                    this.wingsVisible = true;
                    
                    // Animate wings appearing
                    this.wings.scale.set(0.5, 0.5, 0.5); // Larger initial scale
                    this.animateWings();
                }
                
                // Flap wings while flying
                this.flapWings(deltaTime);
            } else if (this.group.position.y <= 3 && this.wingsVisible) {
                // Hide wings when below threshold
                console.log('HIDING WINGS!');
                this.wings.visible = false;
                this.wingsVisible = false;
            }
        }
    }
    
    flapWings(deltaTime) {
        // Add wing flapping animation
        if (this.wings && this.wings.visible) {
            // Simple flapping motion
            const flapSpeed = 5;
            const flapAmount = 0.2;
            this.wingFlapTime = (this.wingFlapTime || 0) + deltaTime * flapSpeed;
            
            // Sine wave for smooth flapping
            const flapPosition = Math.sin(this.wingFlapTime) * flapAmount;
            
            // Apply rotation to wings
            if (this.wings.children.length >= 2) {
                // Left wing
                this.wings.children[0].rotation.z = flapPosition + 0.2;
                // Right wing
                this.wings.children[1].rotation.z = -flapPosition - 0.2;
            }
        }
    }
    animateWings() {
        // Animate wings growing
        if (this.wings && this.wings.visible) {
            // Get current scale
            const currentScale = this.wings.scale.x;
            
            if (currentScale < 1) {
                // Increase scale
                const newScale = Math.min(currentScale + 0.05, 1);
                this.wings.scale.set(newScale, newScale, newScale);
                
                // Continue animation in next frame
                requestAnimationFrame(() => this.animateWings());
            }
        }
    }
    
    updateCooldowns(deltaTime) {
        // Update all skill cooldowns
        for (const key in this.cooldowns) {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= deltaTime;
                
                // Update UI to show cooldown
                const abilityElement = document.getElementById(`ability-${key}`);
                if (abilityElement) {
                    abilityElement.style.opacity = 0.5;
                    abilityElement.textContent = `${key.toUpperCase()} (${Math.ceil(this.cooldowns[key])}s)`;
                }
            } else if (this.cooldowns[key] <= 0) {
                this.cooldowns[key] = 0;
                
                // Update UI to show skill is ready
                const abilityElement = document.getElementById(`ability-${key}`);
                if (abilityElement) {
                    abilityElement.style.opacity = 1;
                    abilityElement.textContent = key.toUpperCase();
                }
            }
        }
    }
    
    handleSkills(keys) {
        // Check for skill activation
        for (const key in this.skills) {
            if (keys[key] && this.cooldowns[key] <= 0 && this.mana >= this.skills[key].manaCost) {
                this.useSkill(key);
            }
        }
    }
    
    useSkill(key) {
        const skill = this.skills[key];
        
        // Set cooldown
        this.cooldowns[key] = skill.cooldown;
        
        // Consume mana
        this.mana -= skill.manaCost;
        this.updateUI();
        
        // Create a visual effect for the skill
        this.createSkillEffect(skill);
        
        // In a full implementation, we would handle damage, healing, etc.
        console.log(`Used skill: ${skill.name}`);
    }
    
    createSkillEffect(skill) {
        // Create a simple visual effect for the skill
        // In a full implementation, we would have more sophisticated effects
        let geometry, material;
        
        switch(skill.name) {
            case 'Fireball':
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xff4500 });
                break;
            case 'Ice Spike':
                geometry = new THREE.ConeGeometry(0.5, 2, 16);
                material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
                break;
            case 'Thunder Strike':
                geometry = new THREE.CylinderGeometry(0, 0.5, 3, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                break;
            case 'Heal':
                geometry = new THREE.TorusGeometry(1, 0.2, 16, 32);
                material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                break;
            case 'Shield':
                geometry = new THREE.SphereGeometry(1.2, 16, 16);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x4169e1,
                    transparent: true,
                    opacity: 0.5
                });
                break;
            case 'Dash':
                geometry = new THREE.BoxGeometry(0.5, 0.5, 3);
                material = new THREE.MeshBasicMaterial({ color: 0x808080 });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }
        
        const effect = new THREE.Mesh(geometry, material);
        
        // Position effect in front of the hero based on direction
        const spawnPosition = this.getPosition().clone();
        spawnPosition.y += 1; // Adjust height to be at center of hero
        
        // For directional skills, position in front of hero based on facing direction
        if (['Fireball', 'Ice Spike', 'Thunder Strike'].includes(skill.name)) {
            const offset = this.direction.clone().multiplyScalar(2);
            spawnPosition.add(offset);
        }
        
        effect.position.copy(spawnPosition);
        
        // For directional skills, orient them in the direction the hero is facing
        if (['Fireball', 'Ice Spike', 'Thunder Strike'].includes(skill.name)) {
            effect.lookAt(spawnPosition.clone().add(this.direction));
        }
        
        this.scene.add(effect);
        
        // Remove the effect after a short time
        setTimeout(() => {
            this.scene.remove(effect);
        }, 1000);
    }
    
    getPosition() {
        return this.group.position.clone();
    }
    
    getDirection() {
        return this.direction.clone();
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateUI();
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateUI();
    }
    
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        if (this.experience >= this.nextLevelExp) {
            this.levelUp();
        }
        
        this.updateUI();
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.nextLevelExp;
        this.nextLevelExp *= config.player.experience.levelUpMultiplier;
        
        // Increase stats
        this.maxHealth *= 1.2;
        this.health = this.maxHealth;
        this.maxMana *= 1.2;
        this.mana = this.maxMana;
        
        // Show level up message
        this.showMessage(`Level Up! You are now level ${this.level}`);
        
        this.updateUI();
    }
    
    die() {
        // Handle player death
        this.showMessage('You have died!');
        
        // In a full implementation, we would handle respawning, game over, etc.
    }
    
    updateUI() {
        // Update health bar
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        if (healthBar && healthText) {
            const healthPercent = (this.health / this.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            healthText.textContent = `${Math.floor(this.health)}/${Math.floor(this.maxHealth)}`;
        }
        
        // Update mana bar
        const manaBar = document.getElementById('mana-bar');
        const manaText = document.getElementById('mana-text');
        if (manaBar && manaText) {
            const manaPercent = (this.mana / this.maxMana) * 100;
            manaBar.style.width = `${manaPercent}%`;
            manaText.textContent = `${Math.floor(this.mana)}/${Math.floor(this.maxMana)}`;
        }
        
        // Update level and XP
        const levelText = document.getElementById('level-text');
        const xpBar = document.getElementById('xp-bar');
        if (levelText && xpBar) {
            levelText.textContent = `Level ${this.level}`;
            const xpPercent = (this.experience / this.nextLevelExp) * 100;
            xpBar.style.width = `${xpPercent}%`;
        }
    }
    
    showMessage(text) {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            const message = document.createElement('div');
            message.className = 'game-message';
            message.textContent = text;
            messageContainer.appendChild(message);
            
            // Remove the message after a few seconds
            setTimeout(() => {
                message.classList.add('fade-out');
                setTimeout(() => {
                    messageContainer.removeChild(message);
                }, 1000);
            }, 3000);
        }
    }
}

export default Hero;