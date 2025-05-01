import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { config } from '../config/config.js';

export default class Enemy {
    constructor(scene, position, type = 'basic') {
        this.scene = scene;
        this.type = 'enemy';
        this.enemyType = type;
        this.health = config.enemies[type]?.health || 100;
        this.maxHealth = this.health;
        this.damage = config.enemies[type]?.damage || 20;
        this.speed = config.enemies[type]?.speed || 2;
        this.experience = config.enemies[type]?.experience || 50;
        this.attackRange = config.enemies[type]?.attackRange || 2;
        this.detectionRange = config.enemies[type]?.detectionRange || 10;
        this.attackCooldown = 0;
        this.attackSpeed = config.enemies[type]?.attackSpeed || 1;
        
        // Create group for enemy
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.group.userData.type = 'enemy'; // Set type in userData for raycasting
        this.group.userData.enemyRef = this; // Store reference to this enemy instance
        this.scene.add(this.group);

        // Initialize state
        this.state = 'idle'; // idle, chase, attack, dead
        this.target = null;
        this.path = [];
        this.currentPathIndex = 0;
        this.lastPathfindTime = 0;
        this.pathfindCooldown = 1; // Seconds between pathfinding updates

        // Load model
        this.loadModel();

        // Create health bar
        this.createHealthBar();
    }

    async loadModel() {
        // Skip trying to load GLB models and directly create Three.js models
        this.createEnemyModel();
    }

    createEnemyModel() {
        // Create different models based on enemy type
        switch(this.enemyType) {
            case 'basic':
                this.createBasicEnemy();
                break;
            case 'archer':
                this.createArcherEnemy();
                break;
            case 'mage':
                this.createMageEnemy();
                break;
            case 'tank':
                this.createTankEnemy();
                break;
            case 'boss':
                this.createBossEnemy();
                break;
            default:
                this.createBasicEnemy();
        }
    }

    createBasicEnemy() {
        // Create a simple humanoid enemy
        const body = new THREE.Group();
        
        // Body
        const torsoGeometry = new THREE.BoxGeometry(0.8, 1, 0.5);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xA52A2A });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        body.add(head);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1, 0);
        body.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        body.add(rightLeg);
        
        // Add sword
        const swordGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const swordMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
        const sword = new THREE.Mesh(swordGeometry, swordMaterial);
        sword.position.set(0.5, 1.2, 0.4);
        sword.rotation.x = Math.PI / 4;
        body.add(sword);
        
        this.model = body;
        this.group.add(this.model);
    }
    
    createArcherEnemy() {
        // Create an archer enemy
        const body = new THREE.Group();
        
        // Body
        const torsoGeometry = new THREE.BoxGeometry(0.7, 1, 0.4);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        body.add(head);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1, 0);
        body.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x006400 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        body.add(rightLeg);
        
        // Add bow
        const bowGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI);
        const bowMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const bow = new THREE.Mesh(bowGeometry, bowMaterial);
        bow.position.set(0.6, 1, 0.2);
        bow.rotation.y = Math.PI / 2;
        body.add(bow);
        
        this.model = body;
        this.group.add(this.model);
    }
    
    createMageEnemy() {
        // Create a mage enemy
        const body = new THREE.Group();
        
        // Set userData for all parts to ensure detection
        body.userData.type = 'enemy';
        body.userData.enemyRef = this;
        body.userData.enemyType = 'mage';
        
        // Body (robe)
        const torsoGeometry = new THREE.ConeGeometry(0.6, 1.8, 8);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 0.9;
        // Tag for detection
        torso.userData.type = 'enemy';
        torso.userData.enemyRef = this;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFE4B5 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        // Tag for detection
        head.userData.type = 'enemy';
        head.userData.enemyRef = this;
        body.add(head);
        
        // Hat
        const hatGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
        const hatMaterial = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 2.2;
        // Tag for detection
        hat.userData.type = 'enemy';
        hat.userData.enemyRef = this;
        body.add(hat);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 1.2, 0);
        // Tag for detection
        leftArm.userData.type = 'enemy';
        leftArm.userData.enemyRef = this;
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 1.2, 0);
        // Tag for detection
        rightArm.userData.type = 'enemy';
        rightArm.userData.enemyRef = this;
        body.add(rightArm);
        
        // Staff
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const staffMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(0.6, 1, 0);
        staff.rotation.z = Math.PI / 6;
        // Tag for detection
        staff.userData.type = 'enemy';
        staff.userData.enemyRef = this;
        body.add(staff);
        
        // Staff orb
        const orbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const orbMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00FFFF,
            emissive: 0x00FFFF,
            emissiveIntensity: 0.5
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(0.85, 1.7, 0);
        // Tag for detection
        orb.userData.type = 'enemy';
        orb.userData.enemyRef = this;
        body.add(orb);
        
        this.model = body;
        this.group.add(this.model);
    }
    
    createTankEnemy() {
        // Create a tank enemy
        const body = new THREE.Group();
        
        // Body
        const torsoGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.8);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.9;
        body.add(head);
        
        // Helmet
        const helmetGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
        const helmetMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 2;
        body.add(helmet);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.3, 0.9, 0.3);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.75, 1, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.75, 1, 0);
        body.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.35, 0.8, 0.35);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.4, 0.4, 0);
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.4, 0.4, 0);
        body.add(rightLeg);
        
        // Shield
        const shieldGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.1);
        const shieldMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(-0.8, 1, 0.4);
        body.add(shield);
        
        // Mace
        const maceHandleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const maceHeadGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const maceMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        
        const maceHandle = new THREE.Mesh(maceHandleGeometry, maceMaterial);
        maceHandle.position.set(0.9, 1.2, 0.4);
        maceHandle.rotation.x = Math.PI / 2;
        body.add(maceHandle);
        
        const maceHead = new THREE.Mesh(maceHeadGeometry, maceMaterial);
        maceHead.position.set(0.9, 1.2, 0.8);
        body.add(maceHead);
        
        this.model = body;
        this.group.add(this.model);
    }
    
    createBossEnemy() {
        // Create a boss enemy
        const body = new THREE.Group();
        
        // Set userData for all parts to ensure detection
        body.userData.type = 'enemy';
        body.userData.enemyRef = this;
        body.userData.enemyType = 'boss';
        
        // Body
        const torsoGeometry = new THREE.BoxGeometry(1.5, 1.8, 1);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1.2;
        // Tag for detection
        torso.userData.type = 'enemy';
        torso.userData.enemyRef = this;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 12, 12);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        // Tag for detection
        head.userData.type = 'enemy';
        head.userData.enemyRef = this;
        body.add(head);
        
        // Horns
        const hornGeometry = new THREE.ConeGeometry(0.15, 0.6, 8);
        const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.3, 2.8, 0);
        leftHorn.rotation.z = -Math.PI / 6;
        // Tag for detection
        leftHorn.userData.type = 'enemy';
        leftHorn.userData.enemyRef = this;
        body.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.3, 2.8, 0);
        rightHorn.rotation.z = Math.PI / 6;
        // Tag for detection
        rightHorn.userData.type = 'enemy';
        rightHorn.userData.enemyRef = this;
        body.add(rightHorn);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.95, 1.2, 0);
        // Tag for detection
        leftArm.userData.type = 'enemy';
        leftArm.userData.enemyRef = this;
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.95, 1.2, 0);
        // Tag for detection
        rightArm.userData.type = 'enemy';
        rightArm.userData.enemyRef = this;
        body.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.5, 0.5, 0);
        // Tag for detection
        leftLeg.userData.type = 'enemy';
        leftLeg.userData.enemyRef = this;
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.5, 0.5, 0);
        // Tag for detection
        rightLeg.userData.type = 'enemy';
        rightLeg.userData.enemyRef = this;
        body.add(rightLeg);
        
        // Weapon - Giant Axe
        const axeHandleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const axeHeadGeometry = new THREE.ConeGeometry(0.5, 1, 4);
        const axeMaterial = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
        
        const axeHandle = new THREE.Mesh(axeHandleGeometry, axeMaterial);
        axeHandle.position.set(1.2, 1.5, 0);
        axeHandle.rotation.z = Math.PI / 6;
        // Tag for detection
        axeHandle.userData.type = 'enemy';
        axeHandle.userData.enemyRef = this;
        body.add(axeHandle);
        
        const axeHead = new THREE.Mesh(axeHeadGeometry, axeMaterial);
        axeHead.position.set(1.5, 2.3, 0);
        axeHead.rotation.z = Math.PI / 2;
        // Tag for detection
        axeHead.userData.type = 'enemy';
        axeHead.userData.enemyRef = this;
        body.add(axeHead);
        
        // Eyes (glowing)
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.8
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 2.5, 0.4);
        // Tag for detection
        leftEye.userData.type = 'enemy';
        leftEye.userData.enemyRef = this;
        body.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 2.5, 0.4);
        // Tag for detection
        rightEye.userData.type = 'enemy';
        rightEye.userData.enemyRef = this;
        body.add(rightEye);
        
        this.model = body;
        this.group.add(this.model);
        
        // Make boss larger
        this.model.scale.set(1.5, 1.5, 1.5);
        
        // Create a special health bar for the boss
        this.createBossHealthBar();
    }
    
    createBossHealthBar() {
        // Create a larger, more visible health bar for the boss
        const healthBarWidth = 2.5;
        const healthBarHeight = 0.2;
        
        // Background bar (black)
        const bgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.y = 4.5; // Position above the boss
        this.group.add(this.healthBarBg);
        
        // Health bar (red)
        const healthGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.y = 4.5; // Same position as background
        this.group.add(this.healthBar);
        
        // Make the health bar always face the camera
        this.healthBarBg.lookAt(0, 0, 0);
        this.healthBar.lookAt(0, 0, 0);
        
        // Update the health bar initially
        this.updateHealthBar();
    }

    // Model paths are no longer needed as we're creating models with Three.js

    createHealthBar() {
        // Create health bar container
        const healthBarGeometry = new THREE.PlaneGeometry(1, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBarBg.position.y = 2.5;

        // Create health bar fill
        const fillGeometry = new THREE.PlaneGeometry(1, 0.1);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide
        });
        this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
        this.healthBarFill.position.z = 0.01;

        this.healthBarBg.add(this.healthBarFill);
        this.group.add(this.healthBarBg);

        // Make health bar always face camera
        this.scene.onBeforeRender = () => {
            if (this.scene.camera) {
                this.healthBarBg.lookAt(this.scene.camera.position);
            }
        };
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        
        // Update regular health bar if it exists
        if (this.healthBarFill) {
            this.healthBarFill.scale.x = Math.max(0, healthPercent);
            this.healthBarFill.position.x = (healthPercent - 1) / 2;
        }
        
        // Update boss health bar if it exists
        if (this.healthBar && this.enemyType === 'boss') {
            // Scale the health bar based on current health
            this.healthBar.scale.x = Math.max(0, healthPercent);
            
            // Adjust position to keep the bar aligned to the left
            const originalWidth = 2.5; // Width from createBossHealthBar
            const offset = (originalWidth * (1 - healthPercent)) / 2;
            this.healthBar.position.x = -offset;
            
            // Make health bar always face the camera if there is one
            if (this.scene.camera) {
                this.healthBarBg.lookAt(this.scene.camera.position);
                this.healthBar.lookAt(this.scene.camera.position);
            }
            
            // Update color based on health percentage
            if (healthPercent < 0.3) {
                // Low health - bright red and pulsing
                this.healthBar.material.color.setHex(0xFF0000);
                
                // Add pulsing effect for low health
                const pulseIntensity = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
                this.healthBar.material.opacity = pulseIntensity;
            } else if (healthPercent < 0.6) {
                // Medium health - orange
                this.healthBar.material.color.setHex(0xFF6600);
                this.healthBar.material.opacity = 0.9;
            } else {
                // High health - bright red
                this.healthBar.material.color.setHex(0xFF0000);
                this.healthBar.material.opacity = 0.9;
            }
        }
    }

    update(delta) {
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // State machine
        switch (this.state) {
            case 'idle':
                this.updateIdle();
                break;
            case 'chase':
                this.updateChase(delta);
                break;
            case 'attack':
                this.updateAttack();
                break;
            case 'dead':
                // Do nothing when dead
                break;
        }
        
        // Ensure enemy always stays on the ground
        this.group.position.y = 0;
        
        // Ensure enemy always remains upright (no tilting)
        this.group.rotation.x = 0;
        this.group.rotation.z = 0;

        // Update health bar
        this.updateHealthBar();
    }

    updateIdle() {
        // Look for hero in detection range
        let hero = null;
        
        // Find the hero in the scene
        this.scene.traverse(object => {
            if (object.userData && object.userData.type === 'hero') {
                hero = object.userData.heroRef;
            }
        });
        
        // If no hero found, try to find the hero object directly
        if (!hero) {
            this.scene.traverse(object => {
                if (object.type === 'hero' || 
                    (object.userData && object.userData.isHero)) {
                    hero = object;
                }
            });
        }
        
        if (hero) {
            const heroPosition = hero.group ? hero.group.position : hero.position;
            const distance = this.group.position.distanceTo(heroPosition);
            
            if (distance <= this.detectionRange) {
                console.log(`Enemy detected hero at distance ${distance}`);
                this.target = hero;
                this.setState('chase');
            }
        }
    }

    updateChase(delta) {
        if (!this.target) {
            this.setState('idle');
            return;
        }
        
        // Check if target is still valid
        if (typeof this.target.health !== 'undefined' && this.target.health <= 0) {
            this.setState('idle');
            return;
        }
        
        // Get target position based on what's available
        const targetPosition = this.getTargetPosition();
        if (!targetPosition) {
            this.setState('idle');
            return;
        }
        
        // Create a horizontal-only target position (ignore height differences)
        const horizontalTargetPosition = new THREE.Vector3(
            targetPosition.x,
            this.group.position.y, // Keep enemy's current height
            targetPosition.z
        );
        
        // Calculate horizontal distance to target (ignoring height)
        const horizontalDistance = new THREE.Vector2(
            this.group.position.x - targetPosition.x,
            this.group.position.z - targetPosition.z
        ).length();
        
        if (horizontalDistance <= this.attackRange) {
            this.setState('attack');
        } else {
            // Move towards target (only in horizontal plane)
            const direction = new THREE.Vector3()
                .subVectors(horizontalTargetPosition, this.group.position)
                .normalize();
            
            // Apply movement only in X and Z directions (no vertical movement)
            this.group.position.x += direction.x * this.speed * delta;
            this.group.position.z += direction.z * this.speed * delta;
            
            // Always look at the horizontal target position (don't tilt up/down)
            this.group.lookAt(horizontalTargetPosition);
        }
    }

    updateAttack() {
        if (!this.target) {
            this.setState('idle');
            return;
        }
        
        // Check if target is still valid
        if (typeof this.target.health !== 'undefined' && this.target.health <= 0) {
            this.setState('idle');
            return;
        }
        
        // Get target position based on what's available
        const targetPosition = this.getTargetPosition();
        if (!targetPosition) {
            this.setState('idle');
            return;
        }
        
        // Calculate horizontal distance to target (ignoring height)
        const horizontalDistance = new THREE.Vector2(
            this.group.position.x - targetPosition.x,
            this.group.position.z - targetPosition.z
        ).length();
        
        // Check if target is flying (above a certain height threshold)
        const flyingThreshold = 3.0; // Consider target flying if above this height
        const isTargetFlying = targetPosition.y > flyingThreshold;
        
        // Determine if this enemy can attack based on type and target position
        let canAttack = false;
        
        // Check if this is a ranged enemy (archer or mage)
        const isRanged = this.enemyType === 'archer' || this.enemyType === 'mage';
        
        if (isRanged) {
            // Ranged enemies can attack flying targets
            // Use horizontal distance for range check
            canAttack = horizontalDistance <= this.attackRange;
        } else {
            // Melee enemies can only attack grounded targets
            canAttack = horizontalDistance <= this.attackRange && !isTargetFlying;
        }
        
        if (horizontalDistance > this.attackRange) {
            this.setState('chase');
        } else if (canAttack && this.attackCooldown <= 0) {
            this.attack(isTargetFlying);
        } else if (!canAttack) {
            // If we can't attack (e.g., melee enemy with flying target),
            // just stay in position and wait
            
            // Create a horizontal-only target position (for looking at target)
            const horizontalTargetPosition = new THREE.Vector3(
                targetPosition.x,
                this.group.position.y, // Keep enemy's current height
                targetPosition.z
            );
            
            // Always look at the horizontal target position (don't tilt up/down)
            this.group.lookAt(horizontalTargetPosition);
        }
    }
    
    getTargetPosition() {
        // Try different ways to get the target position
        if (this.target.group && this.target.group.position) {
            return this.target.group.position;
        } else if (this.target.position) {
            return this.target.position;
        } else if (this.target.getPosition) {
            return this.target.getPosition();
        }
        
        // If we can't find a position, return null
        return null;
    }

    attack(isTargetFlying = false) {
        if (!this.target) return;

        console.log(`Enemy attacking target with ${this.damage} damage`);
        
        // Check if this is a ranged enemy (archer or mage)
        const isRanged = this.enemyType === 'archer' || this.enemyType === 'mage';
        
        if (isRanged && isTargetFlying) {
            // For ranged enemies attacking flying targets, create a projectile
            this.createRangedProjectile();
        } else {
            // For melee attacks or ranged attacks on ground targets
            // Deal damage to target - handle different ways the target might take damage
            if (typeof this.target.takeDamage === 'function') {
                this.target.takeDamage(this.damage);
            } else if (this.target.health !== undefined) {
                // Direct manipulation if takeDamage not available
                this.target.health = Math.max(0, this.target.health - this.damage);
                
                // If the target has an updateUI method, call it
                if (typeof this.target.updateUI === 'function') {
                    this.target.updateUI();
                }
            }
        }

        // Reset attack cooldown
        this.attackCooldown = 1 / this.attackSpeed;

        // Play attack animation
        if (this.animationActions?.['attack']) {
            const attackAction = this.animationActions['attack'];
            attackAction.reset().play();
            attackAction.clampWhenFinished = true;
            attackAction.loop = THREE.LoopOnce;
        } else {
            // Fallback animation if no animation clips are available
            this.playAttackAnimation();
        }
    }
    
    createRangedProjectile() {
        // Get target position
        const targetPosition = this.getTargetPosition();
        if (!targetPosition) return;
        
        // Create a projectile
        const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        
        // Different colors for different enemy types
        let projectileColor;
        switch(this.enemyType) {
            case 'archer':
                projectileColor = 0x8B4513; // Brown for arrows
                break;
            case 'mage':
                projectileColor = 0x00FFFF; // Cyan for magic
                break;
            default:
                projectileColor = 0xFF0000; // Red for default
        }
        
        const projectileMaterial = new THREE.MeshBasicMaterial({ 
            color: projectileColor,
            emissive: projectileColor,
            emissiveIntensity: 0.5
        });
        
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        
        // Position the projectile at the enemy's eye level (approximately 1.5 units above ground)
        const eyeLevel = 1.5;
        projectile.position.set(
            this.group.position.x,
            eyeLevel, // Fixed eye level height
            this.group.position.z
        );
        
        // Add to scene
        this.scene.add(projectile);
        
        // Create a direction vector from enemy to target (including vertical component)
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, projectile.position)
            .normalize();
        
        // Animate the projectile
        const projectileSpeed = 15; // Units per second
        const maxDistance = this.attackRange * 1.5; // Maximum travel distance
        const startPosition = projectile.position.clone();
        
        // Store reference to this enemy for damage application
        const enemyRef = this;
        
        const animateProjectile = function(time) {
            // Move the projectile
            projectile.position.add(direction.clone().multiplyScalar(projectileSpeed * 0.016)); // Assuming ~60fps
            
            // Check if we've reached the target or gone too far
            const distanceToTarget = projectile.position.distanceTo(targetPosition);
            const distanceFromStart = projectile.position.distanceTo(startPosition);
            
            if (distanceToTarget < 0.5) {
                // Hit the target - apply damage
                if (typeof enemyRef.target.takeDamage === 'function') {
                    enemyRef.target.takeDamage(enemyRef.damage);
                } else if (enemyRef.target.health !== undefined) {
                    // Direct manipulation if takeDamage not available
                    enemyRef.target.health = Math.max(0, enemyRef.target.health - enemyRef.damage);
                    
                    // If the target has an updateUI method, call it
                    if (typeof enemyRef.target.updateUI === 'function') {
                        enemyRef.target.updateUI();
                    }
                }
                
                // Remove projectile
                enemyRef.scene.remove(projectile);
                return;
            } else if (distanceFromStart > maxDistance) {
                // Reached max range without hitting target
                enemyRef.scene.remove(projectile);
                return;
            }
            
            // Continue animation
            requestAnimationFrame(animateProjectile);
        };
        
        // Start animation
        requestAnimationFrame(animateProjectile);
    }
    
    playAttackAnimation() {
        // Find the right arm to animate
        if (this.model) {
            let rightArm;
            
            // Find the right arm based on position
            this.model.children.forEach(part => {
                // Right arm is usually positioned to the right (positive X) and at mid-height
                if (part.position.x > 0.3 && part.position.y > 0.8 && part.position.y < 1.6) {
                    rightArm = part;
                }
            });
            
            if (rightArm) {
                // Save original rotation
                const originalRotation = {
                    x: rightArm.rotation.x,
                    y: rightArm.rotation.y,
                    z: rightArm.rotation.z
                };
                
                // Swing arm forward
                rightArm.rotation.x = -0.8;
                
                // Reset after a short delay
                setTimeout(() => {
                    rightArm.rotation.x = originalRotation.x;
                    rightArm.rotation.y = originalRotation.y;
                    rightArm.rotation.z = originalRotation.z;
                }, 300);
            } else {
                // If no arm found, animate the whole model (slight forward tilt)
                const originalRotation = this.model.rotation.x || 0;
                this.model.rotation.x = 0.3;
                
                // Reset after a short delay
                setTimeout(() => {
                    this.model.rotation.x = originalRotation;
                }, 300);
            }
            
            // Create attack effect
            this.createAttackEffect();
        }
    }
    
    createAttackEffect() {
        // Create a simple attack effect based on enemy type
        const position = this.group.position.clone();
        position.y += 1; // Adjust to be at weapon height
        
        let color, size;
        
        switch(this.enemyType) {
            case 'mage':
                color = 0x9932CC; // Purple
                size = 0.3;
                break;
            case 'archer':
                color = 0x32CD32; // Green
                size = 0.2;
                break;
            case 'boss':
                color = 0xFF0000; // Red
                size = 0.5;
                break;
            default:
                color = 0xFFFFFF; // White
                size = 0.25;
        }
        
        // Create effect geometry
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        });
        
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        
        // Add to scene
        this.scene.add(effect);
        
        // Animate and remove
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            effect.scale.set(scale, scale, scale);
            effect.material.opacity -= 0.05;
            
            if (effect.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(effect);
                effect.geometry.dispose();
                effect.material.dispose();
            }
        };
        
        animate();
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }

        // Show blood effect instead of damage numbers
        this.showBloodEffect();
    }

    showBloodEffect() {
        // Create blood particle system
        const particleCount = 15; // Slightly fewer particles for enemies
        const particles = [];
        const bloodGroup = new THREE.Group();
        
        // Create blood particles
        for (let i = 0; i < particleCount; i++) {
            // Random size for particles
            const size = 0.02 + Math.random() * 0.04;
            const geometry = new THREE.SphereGeometry(size, 6, 6);
            
            // Dark red color with slight variation
            const hue = 0.98 + Math.random() * 0.04; // Red with slight variation
            const saturation = 0.8 + Math.random() * 0.2;
            const lightness = 0.2 + Math.random() * 0.2; // Darker red for blood
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position around the enemy
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 0.2 + Math.random() * 0.3;
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = 1 + radius * Math.sin(phi) * Math.sin(theta); // Position at mid-height
            particle.position.z = radius * Math.cos(phi);
            
            // Random velocity
            const speed = 0.01 + Math.random() * 0.03;
            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                -0.5 - Math.random(), // Mostly downward
                (Math.random() - 0.5) * 2
            ).normalize();
            
            particles.push({
                mesh: particle,
                velocity: direction.multiplyScalar(speed),
                gravity: 0.001 + Math.random() * 0.002,
                life: 1.0
            });
            
            bloodGroup.add(particle);
        }
        
        // Position the blood effect at the enemy
        bloodGroup.position.copy(this.group.position);
        this.scene.add(bloodGroup);
        
        // Animate blood particles
        const animate = () => {
            let allDead = true;
            
            particles.forEach(particle => {
                // Apply gravity
                particle.velocity.y -= particle.gravity;
                
                // Move particle
                particle.mesh.position.add(particle.velocity);
                
                // Reduce life
                particle.life -= 0.02;
                particle.mesh.material.opacity = particle.life;
                
                if (particle.life > 0) {
                    allDead = false;
                }
            });
            
            if (allDead) {
                // Clean up
                this.scene.remove(bloodGroup);
                particles.forEach(particle => {
                    particle.mesh.geometry.dispose();
                    particle.mesh.material.dispose();
                });
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    die() {
        this.state = 'dead';

        // Play death animation
        if (this.animationActions?.['death']) {
            const deathAction = this.animationActions['death'];
            deathAction.reset().play();
            deathAction.clampWhenFinished = true;
            deathAction.loop = THREE.LoopOnce;

            // Remove enemy after animation
            deathAction.addEventListener('finished', () => {
                this.remove();
            });
        } else {
            // No death animation, remove immediately
            this.remove();
        }

        // Drop experience
        if (this.target) {
            this.target.gainExperience(this.experience);
        }
    }

    remove() {
        this.scene.remove(this.group);
        this.group.traverse(child => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }

    setState(newState) {
        if (this.state === newState) return;

        this.state = newState;

        // Update animations
        if (this.animationActions) {
            Object.values(this.animationActions).forEach(action => action.stop());
            
            const action = this.animationActions[newState];
            if (action) {
                action.reset().play();
            }
        }
    }
}
