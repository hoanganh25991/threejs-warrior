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
        // Create beautiful angel wings for the hero
        const wingGroup = new THREE.Group();
        
        // Create a more beautiful wing shape with enhanced curves
        const createWingShape = () => {
            const shape = new THREE.Shape();
            
            // Starting point at the base
            shape.moveTo(0, 0);
            
            // Top curve - more elegant arc upward with sharper curve
            shape.bezierCurveTo(
                -0.2, 0.3,  // control point 1 - closer to base for sharper curve
                -0.5, 0.7,  // control point 2
                -0.7, 1.3   // end point - wing tip, slightly longer
            );
            
            // Middle feathers curve - more pronounced
            shape.bezierCurveTo(
                -0.65, 1.0,  // control point 1
                -0.8, 0.7,   // control point 2
                -0.9, 0.5    // end point - middle feather
            );
            
            // Lower middle feathers - adding more detail
            shape.bezierCurveTo(
                -0.85, 0.4,  // control point 1
                -0.8, 0.3,   // control point 2
                -0.7, 0.2    // end point
            );
            
            // Lower feathers curve - more detailed
            shape.bezierCurveTo(
                -0.6, 0.1,   // control point 1
                -0.5, 0.0,   // control point 2
                -0.3, -0.1   // end point - lower feather
            );
            
            // Return to base with a gentle curve
            shape.bezierCurveTo(
                -0.2, -0.05, // control point 1
                -0.1, 0.0,   // control point 2
                0, 0         // end point - back to base
            );
            
            return shape;
        };
        
        // Create wing geometry from the shape
        const wingShape = createWingShape();
        const wingGeometry = new THREE.ShapeGeometry(wingShape, 32); // Higher segment count for smoother curves
        
        // Create a beautiful pure white wing material with enhanced glow
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,          // Pure white
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.92,            // More opaque
            emissive: 0xffffff,       // Pure white glow
            emissiveIntensity: 0.5,   // Stronger glow
            metalness: 0.05,          // Less metallic
            roughness: 0.2            // Smoother
        });
        
        // Create left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.15, 0.3, 0); // Closer to body
        leftWing.scale.set(0.4, 0.4, 0.4);    // Smaller size (reduced from 0.6)
        
        // Create right wing (mirror of left wing)
        const rightWing = leftWing.clone();
        rightWing.position.set(0.15, 0.3, 0);  // Closer to body
        rightWing.scale.set(-0.4, 0.4, 0.4);   // Mirror by scaling X negatively, smaller size
        
        // Add feather details to make wings more beautiful
        this.addFeatherDetails(leftWing, -1);
        this.addFeatherDetails(rightWing, 1);
        
        // Add wings to group
        wingGroup.add(leftWing);
        wingGroup.add(rightWing);
        
        // Position wings on hero's back - higher up and further back
        wingGroup.position.set(0, 1.3, 0.35);
        
        // Add slight angle to wings
        wingGroup.rotation.x = 0.1;
        
        // Hide wings initially
        wingGroup.visible = false;
        
        // Store wings reference
        this.wings = wingGroup;
        
        // Add wings to hero group
        this.group.add(this.wings);
        
        // Add wing animation mixer for more complex animations
        this.setupWingAnimations();
    }
    
    addFeatherDetails(wing, side) {
        // Add beautiful feather details to the wings
        const featherCount = 7; // Increased feather count for more detail
        const featherGroup = new THREE.Group();
        
        // Create several individual feathers
        for (let i = 0; i < featherCount; i++) {
            // Create a curved feather shape
            const featherShape = new THREE.Shape();
            
            // Base of feather
            const baseX = 0;
            const baseY = i * 0.12; // Stagger feathers vertically, closer together
            
            featherShape.moveTo(baseX, baseY);
            
            // Feather curve - each one slightly different with more curve
            const length = 0.3 + i * 0.07; // Slightly shorter feathers (was 0.4)
            const width = 0.06 - i * 0.005; // Thinner feathers (was 0.08)
            
            // More curved feather shape
            featherShape.bezierCurveTo(
                baseX + (side * length * 0.2), baseY + width * 1.2,
                baseX + (side * length * 0.5), baseY + width * 2.5,
                baseX + (side * length), baseY + width * 1.5
            );
            
            // Return to base with a more elegant curve
            featherShape.bezierCurveTo(
                baseX + (side * length * 0.8), baseY - width * 0.5,
                baseX + (side * length * 0.4), baseY - width * 1.5,
                baseX, baseY
            );
            
            // Create geometry from shape
            const featherGeometry = new THREE.ShapeGeometry(featherShape, 16); // More segments
            
            // Create material with slight variation for each feather - pure white
            const whiteness = 0.98 + (i * 0.005); // Less variation, more consistently white
            const featherMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(whiteness, whiteness, whiteness),
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9 - (i * 0.03), // Less transparent overall
                emissive: 0xffffff, // Pure white glow
                emissiveIntensity: 0.4 - (i * 0.02) // Stronger glow
            });
            
            // Create feather mesh
            const feather = new THREE.Mesh(featherGeometry, featherMaterial);
            feather.renderOrder = 10 + i; // Ensure proper transparency rendering
            
            // Add to feather group
            featherGroup.add(feather);
        }
        
        // Position the feather group - closer to wing base
        featherGroup.position.set(side * -0.08, 0.08, 0.01);
        featherGroup.rotation.z = side * 0.15; // Slight angle to feathers
        
        // Add feathers to wing
        wing.add(featherGroup);
    }
    
    setupWingAnimations() {
        // Setup more complex wing animations
        if (!this.wings) return;
        
        // Store animation parameters
        this.wingAnimations = {
            flapSpeed: 0,
            flapDirection: 1,
            flapAmplitude: 0.15,
            shimmerIntensity: 0.4,
            shimmerSpeed: 2,
            featherPhase: 0,
            idleTime: 0
        };
        
        // Create animation clips for different wing states
        this.wingStates = {
            idle: {
                flapSpeed: 1.5,
                flapAmplitude: 0.08,
                shimmerIntensity: 0.3,
                shimmerSpeed: 1
            },
            flying: {
                flapSpeed: 4,
                flapAmplitude: 0.25,
                shimmerIntensity: 0.6,
                shimmerSpeed: 3
            },
            gliding: {
                flapSpeed: 0.8,
                flapAmplitude: 0.12,
                shimmerIntensity: 0.5,
                shimmerSpeed: 1.5
            },
            hovering: {
                flapSpeed: 6,
                flapAmplitude: 0.18,
                shimmerIntensity: 0.7,
                shimmerSpeed: 4
            }
        };
        
        // Set initial state
        this.setWingState('idle');
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
        
        // Update hero animations
        this.updateAnimations(deltaTime, keys);
        
        // Update debug display if debug mode is enabled
        if (this.debug) {
            this.updateDebugDisplay();
        }
    }
    
    updateAnimations(deltaTime, keys) {
        // Central method for all hero animations
        
        // 1. Animate wings if visible
        if (this.wings && this.wings.visible) {
            this.flapWings(deltaTime);
        }
        
        // 2. Animate body parts based on movement state
        this.animateBodyParts(deltaTime, keys);
        
        // 3. Add breathing animation
        this.animateBreathing(deltaTime);
        
        // 4. Add head tracking animation
        this.animateHeadTracking(deltaTime);
        
        // 5. Animate weapon if applicable
        this.animateWeapon(deltaTime, keys);
    }
    
    animateBodyParts(deltaTime, keys) {
        // Animate body parts based on movement state
        const isMoving = keys['w'] || keys['a'] || keys['s'] || keys['d'];
        const isJumping = this.isJumping;
        const isFlying = this.isFlying;
        
        // Find body parts to animate
        const bodyGroup = this.group.children[0]; // First child should be the body group
        if (!bodyGroup) return;
        
        // Find arms and legs
        let leftArm, rightArm, leftLeg, rightLeg, head;
        
        // Search for body parts by position
        bodyGroup.children.forEach(part => {
            // Check position to identify parts
            const pos = part.position;
            
            // Left arm is usually positioned to the left (negative X) and at mid-height
            if (pos.x < -0.5 && pos.y > 0.8 && pos.y < 1.6) leftArm = part;
            
            // Right arm is usually positioned to the right (positive X) and at mid-height
            if (pos.x > 0.5 && pos.y > 0.8 && pos.y < 1.6) rightArm = part;
            
            // Left leg is usually positioned to the left (negative X) and at low height
            if (pos.x < 0 && pos.y < 0.8) leftLeg = part;
            
            // Right leg is usually positioned to the right (positive X) and at low height
            if (pos.x > 0 && pos.y < 0.8) rightLeg = part;
            
            // Head is usually positioned at the top
            if (pos.y > 1.6) head = part;
        });
        
        // Animation parameters
        const walkSpeed = 5;
        const walkTime = (this.walkTime || 0) + (isMoving ? deltaTime : 0);
        this.walkTime = walkTime;
        
        // Animate legs when walking
        if (leftLeg && rightLeg && isMoving && !isFlying) {
            // Walking animation - alternating leg movement
            const legSwing = Math.sin(walkTime * walkSpeed) * 0.3;
            
            leftLeg.rotation.x = legSwing;
            rightLeg.rotation.x = -legSwing;
        } else if (leftLeg && rightLeg) {
            // Reset legs when not walking
            leftLeg.rotation.x = this.lerpValue(leftLeg.rotation.x, 0, deltaTime * 5);
            rightLeg.rotation.x = this.lerpValue(rightLeg.rotation.x, 0, deltaTime * 5);
        }
        
        // Animate arms
        if (leftArm && rightArm) {
            if (isMoving && !isFlying) {
                // Walking arm swing - opposite to legs
                const armSwing = Math.sin(walkTime * walkSpeed) * 0.2;
                
                leftArm.rotation.x = -armSwing;
                rightArm.rotation.x = armSwing;
            } else if (isFlying) {
                // Flying pose - arms slightly back
                leftArm.rotation.x = this.lerpValue(leftArm.rotation.x, -0.3, deltaTime * 3);
                rightArm.rotation.x = this.lerpValue(rightArm.rotation.x, -0.3, deltaTime * 3);
            } else {
                // Idle arm position
                leftArm.rotation.x = this.lerpValue(leftArm.rotation.x, 0, deltaTime * 5);
                rightArm.rotation.x = this.lerpValue(rightArm.rotation.x, 0, deltaTime * 5);
            }
        }
        
        // Animate head for looking around
        if (head) {
            // Head follows look direction slightly
            const lookX = this.rotation.y * 0.2;
            const lookY = this.rotation.x * 0.2;
            
            head.rotation.y = this.lerpValue(head.rotation.y, lookX, deltaTime * 3);
            head.rotation.x = this.lerpValue(head.rotation.x, lookY, deltaTime * 3);
        }
        
        // Animate body tilt based on movement
        if (isMoving && !isFlying) {
            // Slight forward tilt when walking
            bodyGroup.rotation.x = this.lerpValue(bodyGroup.rotation.x, 0.1, deltaTime * 2);
        } else if (isFlying) {
            // Forward tilt when flying
            bodyGroup.rotation.x = this.lerpValue(bodyGroup.rotation.x, 0.2, deltaTime * 2);
        } else {
            // Reset tilt when idle
            bodyGroup.rotation.x = this.lerpValue(bodyGroup.rotation.x, 0, deltaTime * 2);
        }
    }
    
    animateBreathing(deltaTime) {
        // Add subtle breathing animation to the hero's body
        const bodyGroup = this.group.children[0];
        if (!bodyGroup) return;
        
        // Find the body (usually the largest part)
        let body;
        let maxSize = 0;
        
        bodyGroup.children.forEach(part => {
            // Find the body by looking for the largest part at mid-height
            if (part.geometry && part.position.y > 0.5 && part.position.y < 1.5) {
                const size = part.geometry.parameters.width * part.geometry.parameters.height;
                if (size > maxSize) {
                    maxSize = size;
                    body = part;
                }
            }
        });
        
        if (body) {
            // Breathing animation - subtle scale changes
            const breathingTime = (this.breathingTime || 0) + deltaTime;
            this.breathingTime = breathingTime;
            
            const breathingSpeed = 0.5; // Slow breathing
            const breathingAmount = 0.02; // Subtle effect
            
            const breathScale = 1 + Math.sin(breathingTime * breathingSpeed) * breathingAmount;
            
            // Apply breathing to chest area only
            const originalScale = body.userData.originalScale || new THREE.Vector3(1, 1, 1);
            
            // Store original scale if not already stored
            if (!body.userData.originalScale) {
                body.userData.originalScale = body.scale.clone();
            }
            
            // Apply breathing scale
            body.scale.set(
                originalScale.x * breathScale,
                originalScale.y,
                originalScale.z * breathScale
            );
        }
    }
    
    animateHeadTracking(deltaTime) {
        // Add head tracking animation
        const bodyGroup = this.group.children[0];
        if (!bodyGroup) return;
        
        // Find the head
        let head;
        bodyGroup.children.forEach(part => {
            if (part.position.y > 1.6) {
                head = part;
            }
        });
        
        if (head) {
            // Occasional random head movements
            const randomMovementTime = (this.randomMovementTime || 0) + deltaTime;
            this.randomMovementTime = randomMovementTime;
            
            // Every few seconds, add a random head movement
            if (Math.sin(randomMovementTime * 0.2) > 0.95) {
                this.targetHeadRotation = {
                    x: (Math.random() - 0.5) * 0.2,
                    y: (Math.random() - 0.5) * 0.3
                };
            }
            
            // Smoothly move head to target rotation
            if (this.targetHeadRotation) {
                head.rotation.x = this.lerpValue(head.rotation.x, this.targetHeadRotation.x, deltaTime * 2);
                head.rotation.y = this.lerpValue(head.rotation.y, this.targetHeadRotation.y, deltaTime * 2);
            }
        }
    }
    
    animateWeapon(deltaTime, keys) {
        // Animate weapon if present
        const bodyGroup = this.group.children[0];
        if (!bodyGroup) return;
        
        // Find weapon (sword, axe, staff, etc.)
        let weapon;
        bodyGroup.children.forEach(part => {
            // Check if this part has children that might be a weapon
            if (part.children && part.children.length > 0) {
                part.children.forEach(child => {
                    // Weapons are usually longer in one dimension
                    if (child.geometry && 
                        (child.geometry.parameters.height > 1 || 
                         child.geometry.parameters.width > 1 ||
                         child.geometry.parameters.depth > 1)) {
                        weapon = child;
                    }
                });
            }
        });
        
        if (weapon) {
            // Idle weapon animation - subtle movement
            const idleTime = (this.weaponIdleTime || 0) + deltaTime;
            this.weaponIdleTime = idleTime;
            
            // Subtle weapon sway
            const swayAmount = 0.03;
            const swaySpeed = 0.7;
            
            // Apply sway
            weapon.rotation.z = Math.sin(idleTime * swaySpeed) * swayAmount;
            
            // Attack animation when mouse is clicked
            if (keys['attack'] || (this.inputHandler && this.inputHandler.isMouseButtonPressed(0))) {
                // Start attack animation
                this.startWeaponAttackAnimation(weapon);
            }
            
            // Update ongoing attack animation if active
            if (this.attackAnimationActive) {
                this.updateWeaponAttackAnimation(deltaTime, weapon);
            }
        }
    }
    
    startWeaponAttackAnimation(weapon) {
        // Only start if not already attacking
        if (this.attackAnimationActive) return;
        
        // Set attack animation state
        this.attackAnimationActive = true;
        this.attackAnimationTime = 0;
        this.attackAnimationDuration = 0.5; // Half second attack
        
        // Store original weapon rotation
        this.originalWeaponRotation = {
            x: weapon.rotation.x,
            y: weapon.rotation.y,
            z: weapon.rotation.z
        };
        
        // Play attack sound
        if (window.soundManager) {
            window.soundManager.playSound('attack');
        }
    }
    
    updateWeaponAttackAnimation(deltaTime, weapon) {
        // Update attack animation time
        this.attackAnimationTime += deltaTime;
        
        // Calculate animation progress (0 to 1)
        const progress = Math.min(this.attackAnimationTime / this.attackAnimationDuration, 1);
        
        // Attack animation phases
        if (progress < 0.3) {
            // Wind up phase - pull back
            const windupProgress = progress / 0.3;
            weapon.rotation.z = this.originalWeaponRotation.z - (windupProgress * Math.PI / 4);
        } else if (progress < 0.6) {
            // Strike phase - swing forward
            const strikeProgress = (progress - 0.3) / 0.3;
            weapon.rotation.z = this.originalWeaponRotation.z - (Math.PI / 4) + (strikeProgress * Math.PI / 2);
        } else {
            // Return phase - return to original position
            const returnProgress = (progress - 0.6) / 0.4;
            weapon.rotation.z = this.originalWeaponRotation.z + (Math.PI / 4) - (returnProgress * Math.PI / 4);
        }
        
        // End animation when complete
        if (progress >= 1) {
            this.attackAnimationActive = false;
            weapon.rotation.z = this.originalWeaponRotation.z;
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
    
    setWingState(state) {
        // Set wing animation state
        if (!this.wingAnimations || !this.wingStates || !this.wingStates[state]) return;
        
        // Get state parameters
        const stateParams = this.wingStates[state];
        
        // Smoothly transition to new state
        this.targetWingState = stateParams;
        
        // Log state change
        console.log(`Wing state changed to: ${state}`);
    }
    
    flapWings(deltaTime) {
        // Add elegant wing flapping animation with improved state-based system
        if (!this.wings || !this.wings.visible || !this.wingAnimations) return;
        
        // Update animation parameters
        const anim = this.wingAnimations;
        const target = this.targetWingState || this.wingStates.idle;
        
        // Smoothly transition between states
        anim.flapSpeed = this.lerpValue(anim.flapSpeed, target.flapSpeed, deltaTime * 2);
        anim.flapAmplitude = this.lerpValue(anim.flapAmplitude, target.flapAmplitude, deltaTime * 2);
        anim.shimmerIntensity = this.lerpValue(anim.shimmerIntensity, target.shimmerIntensity, deltaTime * 2);
        anim.shimmerSpeed = this.lerpValue(anim.shimmerSpeed, target.shimmerSpeed, deltaTime * 2);
        
        // Update animation timers
        anim.featherPhase += deltaTime * anim.flapSpeed * 0.5;
        anim.idleTime += deltaTime;
        
        // Calculate flap position with improved natural motion
        // Use combination of sine waves for more natural motion
        const flapTime = anim.idleTime * anim.flapSpeed;
        const flapPosition = Math.sin(flapTime) * anim.flapAmplitude;
        
        // Add slight asymmetry for more natural look
        const asymmetry = Math.sin(flapTime * 0.5) * 0.05;
        
        // Add slight randomness for natural variation
        const randomness = Math.sin(flapTime * 0.3) * 0.02;
        
        // Apply rotation to wings
        if (this.wings.children.length >= 2) {
            // Left wing - enhanced rotation with natural motion
            this.wings.children[0].rotation.z = flapPosition + 0.1 + asymmetry + randomness;
            this.wings.children[0].rotation.x = Math.sin(flapTime * 0.7) * (anim.flapAmplitude * 0.3);
            this.wings.children[0].rotation.y = Math.sin(flapTime * 0.4) * 0.05;
            
            // Right wing - enhanced rotation (mirrored)
            this.wings.children[1].rotation.z = -flapPosition - 0.1 - asymmetry - randomness;
            this.wings.children[1].rotation.x = Math.sin(flapTime * 0.7) * (anim.flapAmplitude * 0.3);
            this.wings.children[1].rotation.y = -Math.sin(flapTime * 0.4) * 0.05;
            
            // Add enhanced up/down movement to the entire wing group
            const baseY = 1.3; // Base Y position
            this.wings.position.y = baseY + (Math.sin(flapTime * 0.5) * 0.05);
            
            // Add enhanced forward/backward movement
            const baseZ = 0.35; // Base Z position
            this.wings.position.z = baseZ + (Math.sin(flapTime * 0.7) * 0.03);
            
            // Add subtle side-to-side movement
            this.wings.position.x = Math.sin(flapTime * 0.3) * 0.02;
            
            // Add subtle rotation to entire wing group
            this.wings.rotation.x = 0.1 + Math.sin(flapTime * 0.2) * 0.05;
            this.wings.rotation.y = Math.sin(flapTime * 0.15) * 0.03;
            
            // Add enhanced feather animation if feathers exist
            if (this.wings.children[0].children.length > 0) {
                const leftFeathers = this.wings.children[0].children[0];
                const rightFeathers = this.wings.children[1].children[0];
                
                // Animate each feather with improved ripple effect
                for (let i = 0; i < leftFeathers.children.length; i++) {
                    // Create a ripple effect with phase offset
                    const delay = i * 0.15;
                    const featherPhase = anim.featherPhase - delay;
                    
                    // More complex feather motion
                    const featherFlapPosition = Math.sin(featherPhase) * (0.08 - (i * 0.01));
                    const featherTwist = Math.cos(featherPhase * 0.7) * (0.03 - (i * 0.005));
                    
                    // Apply rotations
                    if (leftFeathers.children[i]) {
                        leftFeathers.children[i].rotation.z = featherFlapPosition;
                        leftFeathers.children[i].rotation.x = featherTwist;
                    }
                    
                    if (rightFeathers && rightFeathers.children[i]) {
                        rightFeathers.children[i].rotation.z = -featherFlapPosition;
                        rightFeathers.children[i].rotation.x = featherTwist;
                    }
                }
            }
        }
        
        // Add enhanced shimmer/glow effect by varying emissive intensity
        const shimmerTime = anim.idleTime * anim.shimmerSpeed;
        const baseShimmer = anim.shimmerIntensity;
        const shimmerVariation = 0.15;
        
        // Complex shimmer pattern using multiple sine waves
        const shimmerIntensity = baseShimmer + 
            (Math.sin(shimmerTime) * 0.7 + Math.sin(shimmerTime * 1.3) * 0.3) * shimmerVariation;
        
        // Apply shimmer to wing materials
        if (this.wings.children[0].material) {
            this.wings.children[0].material.emissiveIntensity = shimmerIntensity;
            this.wings.children[1].material.emissiveIntensity = shimmerIntensity;
        }
        
        // Determine wing state based on velocity and position
        if (this.velocity.y > 10) {
            this.setWingState('hovering');
        } else if (this.velocity.y > 5) {
            this.setWingState('flying');
        } else if (this.isFlying) {
            this.setWingState('gliding');
        } else {
            this.setWingState('idle');
        }
    }
    
    // Helper function for smooth transitions
    lerpValue(current, target, factor) {
        return current + (target - current) * Math.min(factor, 1);
    }
    animateWings() {
        // Create a beautiful wing appearance animation
        if (this.wings && this.wings.visible) {
            // Reset any previous animation state
            this.wings.scale.set(0.01, 0.01, 0.01);
            this.wings.rotation.y = -Math.PI / 2; // Start folded
            this.wings.rotation.z = 0;
            
            // Store original wing positions
            const leftWingOriginalPos = this.wings.children[0].position.clone();
            const rightWingOriginalPos = this.wings.children[1].position.clone();
            
            // Start with wings close together
            this.wings.children[0].position.x = -0.05;
            this.wings.children[1].position.x = 0.05;
            
            // Create a shimmer effect with particles
            this.createWingShimmerEffect();
            
            // Define the animation sequence
            const animateStep = (step = 0, maxSteps = 30) => {
                if (step <= maxSteps && this.wings && this.wings.visible) {
                    // Calculate progress (0 to 1)
                    const progress = step / maxSteps;
                    const easeInOut = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Smooth easing
                    
                    // Scale up gradually
                    const targetScale = 0.8; // Final scale
                    const currentScale = 0.01 + (targetScale - 0.01) * easeInOut;
                    this.wings.scale.set(currentScale, currentScale, currentScale);
                    
                    // Unfold wings
                    const startRotation = -Math.PI / 2;
                    const endRotation = 0;
                    this.wings.rotation.y = startRotation + (endRotation - startRotation) * easeInOut;
                    
                    // Spread wings apart
                    const leftWingX = -0.05 + (leftWingOriginalPos.x + 0.05) * easeInOut;
                    const rightWingX = 0.05 + (rightWingOriginalPos.x - 0.05) * easeInOut;
                    
                    this.wings.children[0].position.x = leftWingX;
                    this.wings.children[1].position.x = rightWingX;
                    
                    // Add a gentle flap during appearance
                    const flapAmount = Math.sin(progress * Math.PI * 2) * 0.2;
                    this.wings.children[0].rotation.z = flapAmount;
                    this.wings.children[1].rotation.z = -flapAmount;
                    
                    // Shimmer effect - vary opacity and emissive
                    const shimmerIntensity = 0.3 + Math.sin(progress * Math.PI * 6) * 0.2;
                    if (this.wings.children[0].material) {
                        this.wings.children[0].material.emissiveIntensity = shimmerIntensity;
                        this.wings.children[1].material.emissiveIntensity = shimmerIntensity;
                        
                        // Start more transparent and become more solid
                        const opacity = 0.5 + (0.9 - 0.5) * easeInOut;
                        this.wings.children[0].material.opacity = opacity;
                        this.wings.children[1].material.opacity = opacity;
                    }
                    
                    // Continue animation in next frame
                    setTimeout(() => animateStep(step + 1, maxSteps), 30);
                }
            };
            
            // Start the animation sequence
            animateStep();
        }
    }
    
    createWingShimmerEffect() {
        // Create a beautiful shimmer effect when wings appear
        if (!this.wings) return;
        
        // Create a particle group
        const particleGroup = new THREE.Group();
        
        // Create 20 shimmer particles
        for (let i = 0; i < 20; i++) {
            // Create a small glowing particle
            const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7,
                emissive: 0xffffff,
                emissiveIntensity: 1.0
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the wings
            particle.position.set(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 0.5
            );
            
            // Add to particle group
            particleGroup.add(particle);
            
            // Animate each particle
            const speed = 0.5 + Math.random() * 1.5;
            const delay = Math.random() * 1000;
            
            setTimeout(() => {
                const animateParticle = () => {
                    if (!this.wings || !this.wings.visible) return;
                    
                    // Move particle upward and outward
                    particle.position.y += 0.01 * speed;
                    particle.position.x += (particle.position.x > 0 ? 0.005 : -0.005) * speed;
                    
                    // Fade out
                    if (particle.material.opacity > 0) {
                        particle.material.opacity -= 0.01 * speed;
                    }
                    
                    // Continue animation until faded
                    if (particle.material.opacity > 0) {
                        requestAnimationFrame(animateParticle);
                    } else {
                        particleGroup.remove(particle);
                    }
                };
                
                animateParticle();
            }, delay);
        }
        
        // Add particles to wings
        this.wings.add(particleGroup);
        
        // Remove particles after animation completes
        setTimeout(() => {
            if (this.wings) {
                this.wings.remove(particleGroup);
            }
        }, 3000);
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
    
    getCameraPositionInfo() {
        // Return camera positioning information based on hero state
        let cameraDistance = 5;  // Default distance behind hero
        let cameraHeight = 3;    // Default height above hero
        let targetHeight = 1.5;  // Default target height (where camera looks)
        
        // Adjust camera based on hero state
        if (this.isFlying) {
            // When flying, position camera further back and higher
            cameraDistance = 7;
            cameraHeight = 4;
            targetHeight = 2;
        } else if (this.isJumping) {
            // When jumping, position camera slightly higher
            cameraDistance = 6;
            cameraHeight = 3.5;
            targetHeight = 1.8;
        }
        
        return {
            distance: cameraDistance,
            height: cameraHeight,
            targetHeight: targetHeight
        };
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