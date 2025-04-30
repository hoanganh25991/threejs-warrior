import * as THREE from 'three';
import { config } from './config/config.js';

export class Enemy {
    constructor(scene, type, position) {
        this.scene = scene;
        this.type = type;
        this.mesh = null;
        this.targetPosition = new THREE.Vector3();
        this.moveDirection = new THREE.Vector3();
        this.wanderRadius = 10;
        this.wanderTimer = 0;
        this.wanderInterval = 3; // seconds
        this.attackTimer = 0;
        this.attackInterval = 2; // seconds
        this.attackRange = 3;
        this.isAttacking = false;
        
        // Set properties based on enemy type
        const enemyConfig = config.enemies.types[type];
        this.health = enemyConfig.health;
        this.maxHealth = enemyConfig.health;
        this.damage = enemyConfig.damage;
        this.moveSpeed = enemyConfig.moveSpeed;
        this.experienceValue = enemyConfig.experienceValue;
        
        // Initialize the enemy
        this.init(position);
    }
    
    init(position) {
        // Create a simple placeholder mesh for now
        // In a full implementation, we would load a GLTF model
        const geometry = new THREE.BoxGeometry(1, 1.5, 1);
        
        // Different colors for different enemy types
        let color;
        switch(this.type) {
            case 'basic':
                color = 0x008000; // Green
                break;
            case 'elite':
                color = 0x800080; // Purple
                break;
            case 'boss':
                color = 0x8b0000; // Dark red
                break;
            default:
                color = 0x808080; // Gray
        }
        
        const material = new THREE.MeshStandardMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.75; // Half height
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Create health bar
        this.createHealthBar();
        
        // Set initial wander target
        this.setNewWanderTarget();
    }
    
    createHealthBar() {
        // Create a simple health bar above the enemy
        const geometry = new THREE.PlaneGeometry(1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.healthBar = new THREE.Mesh(geometry, material);
        this.healthBar.position.y = 2; // Position above enemy
        this.mesh.add(this.healthBar);
        
        // Create health bar background
        const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.z = -0.01; // Slightly behind the health bar
        this.healthBar.add(this.healthBarBg);
    }
    
    update(deltaTime, playerPosition) {
        // Update timers
        this.wanderTimer += deltaTime;
        this.attackTimer += deltaTime;
        
        // Check if player is in attack range
        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        
        if (distanceToPlayer <= this.attackRange) {
            // Player is in range, attack if possible
            if (this.attackTimer >= this.attackInterval) {
                this.attack(playerPosition);
                this.attackTimer = 0;
            }
            
            // Move towards player
            this.moveTowards(playerPosition, deltaTime);
        } else {
            // Player is out of range, wander around
            this.wander(deltaTime);
        }
        
        // Update health bar
        this.updateHealthBar();
    }
    
    moveTowards(targetPosition, deltaTime) {
        // Calculate direction to target
        this.moveDirection.subVectors(targetPosition, this.mesh.position).normalize();
        
        // Move towards target
        this.mesh.position.x += this.moveDirection.x * this.moveSpeed * deltaTime;
        this.mesh.position.z += this.moveDirection.z * this.moveSpeed * deltaTime;
        
        // Keep y position constant (no flying enemies for now)
        this.mesh.position.y = 0.75;
        
        // Rotate to face target
        this.mesh.lookAt(new THREE.Vector3(targetPosition.x, this.mesh.position.y, targetPosition.z));
    }
    
    wander(deltaTime) {
        // Check if it's time to set a new wander target
        if (this.wanderTimer >= this.wanderInterval) {
            this.setNewWanderTarget();
            this.wanderTimer = 0;
        }
        
        // Move towards wander target
        this.moveTowards(this.targetPosition, deltaTime);
    }
    
    setNewWanderTarget() {
        // Set a random position within wander radius
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.wanderRadius;
        
        // Calculate new target position
        this.targetPosition.x = this.mesh.position.x + Math.cos(angle) * radius;
        this.targetPosition.z = this.mesh.position.z + Math.sin(angle) * radius;
        this.targetPosition.y = this.mesh.position.y;
    }
    
    attack(playerPosition) {
        // In a full implementation, we would have attack animations and effects
        this.isAttacking = true;
        
        // Create a simple attack effect
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const attackEffect = new THREE.Mesh(geometry, material);
        
        // Position the attack effect
        attackEffect.position.copy(this.mesh.position);
        attackEffect.position.y = 1;
        
        // Add to scene
        this.scene.add(attackEffect);
        
        // Remove after a short time
        setTimeout(() => {
            this.scene.remove(attackEffect);
            this.isAttacking = false;
        }, 500);
        
        // Return damage amount (to be applied to player)
        return this.damage;
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
            return true;
        }
        
        return false;
    }
    
    updateHealthBar() {
        // Update health bar scale based on current health
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = (healthPercent - 1) / 2;
    }
    
    die() {
        // In a full implementation, we would have death animations
        
        // Remove from scene
        this.scene.remove(this.mesh);
        
        // Return experience value (to be given to player)
        return this.experienceValue;
    }
}

export default Enemy;