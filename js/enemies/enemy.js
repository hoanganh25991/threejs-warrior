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
        const loader = new GLTFLoader();
        const modelPath = this.getModelPath();

        try {
            const gltf = await loader.loadAsync(modelPath);
            this.model = gltf.scene;
            this.animations = gltf.animations;

            // Scale and position the model
            this.model.scale.set(0.5, 0.5, 0.5);
            this.group.add(this.model);

            // Setup animations
            if (this.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                this.animationActions = {};

                // Load all animations
                this.animations.forEach(animation => {
                    const action = this.mixer.clipAction(animation);
                    this.animationActions[animation.name] = action;
                });

                // Play idle animation by default
                if (this.animationActions['idle']) {
                    this.animationActions['idle'].play();
                }
            }

            console.log(`Loaded enemy model: ${this.enemyType}`);
        } catch (error) {
            console.error(`Error loading enemy model: ${this.enemyType}`, error);
            // Create fallback geometry
            this.createFallbackModel();
        }
    }

    createFallbackModel() {
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        this.model = new THREE.Mesh(geometry, material);
        this.group.add(this.model);
    }

    getModelPath() {
        const modelPaths = {
            'basic': '/assets/models/enemies/basic_enemy.glb',
            'archer': '/assets/models/enemies/archer.glb',
            'mage': '/assets/models/enemies/mage.glb',
            'tank': '/assets/models/enemies/tank.glb',
            'boss': '/assets/models/enemies/boss.glb'
        };
        return modelPaths[this.enemyType] || modelPaths['basic'];
    }

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
        }
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
