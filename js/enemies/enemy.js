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
        
        // Body (robe)
        const torsoGeometry = new THREE.ConeGeometry(0.6, 1.8, 8);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 0.9;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFE4B5 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        body.add(head);
        
        // Hat
        const hatGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
        const hatMaterial = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 2.2;
        body.add(hat);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x4B0082 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.4, 1.2, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.4, 1.2, 0);
        body.add(rightArm);
        
        // Staff
        const staffGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
        const staffMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const staff = new THREE.Mesh(staffGeometry, staffMaterial);
        staff.position.set(0.6, 1, 0);
        staff.rotation.z = Math.PI / 6;
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
        
        // Body
        const torsoGeometry = new THREE.BoxGeometry(1.5, 1.8, 1);
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1.2;
        body.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 12, 12);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        body.add(head);
        
        // Horns
        const hornGeometry = new THREE.ConeGeometry(0.15, 0.6, 8);
        const hornMaterial = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.3, 2.8, 0);
        leftHorn.rotation.z = -Math.PI / 6;
        body.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.3, 2.8, 0);
        rightHorn.rotation.z = Math.PI / 6;
        body.add(rightHorn);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.95, 1.2, 0);
        body.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.95, 1.2, 0);
        body.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x800000 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.5, 0.5, 0);
        body.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.5, 0.5, 0);
        body.add(rightLeg);
        
        // Weapon - Giant Axe
        const axeHandleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const axeHeadGeometry = new THREE.ConeGeometry(0.5, 1, 4);
        const axeMaterial = new THREE.MeshPhongMaterial({ color: 0x1A1A1A });
        
        const axeHandle = new THREE.Mesh(axeHandleGeometry, axeMaterial);
        axeHandle.position.set(1.2, 1.5, 0);
        axeHandle.rotation.z = Math.PI / 6;
        body.add(axeHandle);
        
        const axeHead = new THREE.Mesh(axeHeadGeometry, axeMaterial);
        axeHead.position.set(1.5, 2.3, 0);
        axeHead.rotation.z = Math.PI / 2;
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
        body.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 2.5, 0.4);
        body.add(rightEye);
        
        this.model = body;
        this.group.add(this.model);
        
        // Make boss larger
        this.model.scale.set(1.5, 1.5, 1.5);
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
        this.healthBarFill.scale.x = Math.max(0, healthPercent);
        this.healthBarFill.position.x = (healthPercent - 1) / 2;
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

        // Update health bar
        this.updateHealthBar();
    }

    updateIdle() {
        // Look for targets in detection range
        const heroes = this.scene.getObjectsByProperty('type', 'hero');
        for (const hero of heroes) {
            const distance = this.group.position.distanceTo(hero.group.position);
            if (distance <= this.detectionRange) {
                this.target = hero;
                this.setState('chase');
                break;
            }
        }
    }

    updateChase(delta) {
        if (!this.target || this.target.health <= 0) {
            this.setState('idle');
            return;
        }

        const distance = this.group.position.distanceTo(this.target.group.position);

        if (distance <= this.attackRange) {
            this.setState('attack');
        } else {
            // Move towards target
            const direction = new THREE.Vector3()
                .subVectors(this.target.group.position, this.group.position)
                .normalize();
            
            this.group.position.add(direction.multiplyScalar(this.speed * delta));
            this.group.lookAt(this.target.group.position);
        }
    }

    updateAttack() {
        if (!this.target || this.target.health <= 0) {
            this.setState('idle');
            return;
        }

        const distance = this.group.position.distanceTo(this.target.group.position);

        if (distance > this.attackRange) {
            this.setState('chase');
        } else if (this.attackCooldown <= 0) {
            this.attack();
        }
    }

    attack() {
        if (!this.target) return;

        // Deal damage to target
        this.target.takeDamage(this.damage);

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

        // Create damage number
        this.showDamageNumber(amount);
    }

    showDamageNumber(amount) {
        // Create damage number sprite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = 'Bold 32px Arial';
        context.fillStyle = 'red';
        context.fillText(Math.round(amount).toString(), 0, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);

        // Position above enemy
        sprite.position.copy(this.group.position);
        sprite.position.y += 2;
        this.scene.add(sprite);

        // Animate and remove
        const startY = sprite.position.y;
        const startTime = Date.now();
        const duration = 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                sprite.position.y = startY + progress;
                sprite.material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(sprite);
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
