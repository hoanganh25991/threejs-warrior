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
        
        // Determine if this is a melee or ranged enemy based on type
        this.isRanged = type === 'archer' || type === 'mage';
        
        // Set properties based on enemy type
        const enemyConfig = config.enemies.types[type] || config.enemies[type];
        this.health = enemyConfig.health;
        this.maxHealth = enemyConfig.health;
        this.damage = enemyConfig.damage;
        this.moveSpeed = enemyConfig.moveSpeed || enemyConfig.speed;
        this.experienceValue = enemyConfig.experienceValue || enemyConfig.experience;
        
        // Set attack range from config if available
        if (enemyConfig.attackRange) {
            this.attackRange = enemyConfig.attackRange;
        }
        
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
        
        // Add collision data to the mesh's userData
        this.mesh.userData.collisionType = "box";
        this.mesh.userData.collisionRadius = 1.2; // Increased collision radius
        this.mesh.userData.collisionHeight = 1.5;
        this.mesh.userData.isEnemy = true; // Flag to identify as enemy
        
        // Create a collision box for the enemy
        const boundingBox = new THREE.Box3().setFromObject(this.mesh);
        // Expand the box significantly to ensure no walking through
        boundingBox.expandByScalar(0.5); // Increased from 0.1 to 0.5 for more robust collision
        this.mesh.userData.collisionBox = boundingBox;
        
        // Add a custom property to mark this as an enemy for collision detection
        this.mesh.isEnemy = true;
        
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
        
        // Calculate horizontal distance to player (ignoring height)
        const horizontalDistance = new THREE.Vector2(
            this.mesh.position.x - playerPosition.x,
            this.mesh.position.z - playerPosition.z
        ).length();
        
        // Check if player is flying
        const flyingThreshold = 3.0; // Consider player flying if above this height
        const isPlayerFlying = playerPosition.y > flyingThreshold;
        
        // Determine if this enemy can attack based on type and player position
        let canAttack = false;
        let isInRange = false;
        
        if (this.isRanged) {
            // Ranged enemies can attack flying players
            // Use 3D distance for range check
            const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
            isInRange = distanceToPlayer <= this.attackRange;
            canAttack = isInRange;
        } else {
            // Melee enemies can only attack grounded players
            isInRange = horizontalDistance <= this.attackRange;
            canAttack = isInRange && !isPlayerFlying;
        }
        
        if (canAttack) {
            // Player is in range and we can attack
            if (this.attackTimer >= this.attackInterval) {
                this.attack(playerPosition);
                this.attackTimer = 0;
            }
        }
        
        // Always move towards player's horizontal position (but stay on ground)
        // This ensures enemies always try to get under flying players
        if (horizontalDistance <= this.attackRange * 2) {
            this.moveTowards(new THREE.Vector3(playerPosition.x, this.mesh.position.y, playerPosition.z), deltaTime);
        } else {
            // Player is too far away, wander around
            this.wander(deltaTime);
        }
        
        // Update health bar
        this.updateHealthBar();
        
        // Update collision box to match current position
        if (this.mesh && this.mesh.userData.collisionBox) {
            const boundingBox = new THREE.Box3().setFromObject(this.mesh);
            // Expand the box significantly to ensure no walking through
            boundingBox.expandByScalar(0.5); // Keep consistent with initialization
            this.mesh.userData.collisionBox = boundingBox;
        }
    }
    
    moveTowards(targetPosition, deltaTime) {
        // Calculate direction to target (only in x and z directions)
        this.moveDirection.subVectors(targetPosition, this.mesh.position).normalize();
        
        // Move towards target (only in x and z directions)
        this.mesh.position.x += this.moveDirection.x * this.moveSpeed * deltaTime;
        this.mesh.position.z += this.moveDirection.z * this.moveSpeed * deltaTime;
        
        // Keep y position constant (enemies stay on ground)
        this.mesh.position.y = 0.75;
        
        // Create a target position at the same height as the enemy
        // This ensures the enemy only rotates in the horizontal plane and stays upright
        const horizontalTarget = new THREE.Vector3(
            targetPosition.x,
            this.mesh.position.y,
            targetPosition.z
        );
        
        // Rotate to face target horizontally only (no looking up)
        this.mesh.lookAt(horizontalTarget);
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
        
        // Different colors for ranged vs melee attacks
        const color = this.isRanged ? 0x00ffff : 0xff0000;
        const material = new THREE.MeshBasicMaterial({ color });
        const attackEffect = new THREE.Mesh(geometry, material);
        
        // Position the attack effect at the enemy's position
        attackEffect.position.copy(this.mesh.position);
        attackEffect.position.y = 1; // Slightly above the enemy's center
        
        // Add to scene
        this.scene.add(attackEffect);
        
        // For ranged enemies, create a projectile that moves toward the player
        if (this.isRanged) {
            // Create a starting position for the projectile (at enemy's eye level)
            const startPosition = new THREE.Vector3(
                this.mesh.position.x,
                1.0, // Fixed height for projectile start (eye level)
                this.mesh.position.z
            );
            
            // Reset the attack effect position
            attackEffect.position.copy(startPosition);
            
            // Create a direction vector from enemy to player (including vertical component)
            const direction = new THREE.Vector3().subVectors(playerPosition, startPosition).normalize();
            
            // Animate the projectile
            const animateProjectile = () => {
                // Move the projectile
                attackEffect.position.add(direction.clone().multiplyScalar(0.2));
                
                // Check if we've reached the player or gone too far
                const distanceToPlayer = attackEffect.position.distanceTo(playerPosition);
                const distanceToStart = attackEffect.position.distanceTo(startPosition);
                
                if (distanceToPlayer < 0.5 || distanceToStart > this.attackRange) {
                    // Hit the player or reached max range
                    this.scene.remove(attackEffect);
                    this.isAttacking = false;
                    return;
                }
                
                // Continue animation
                requestAnimationFrame(animateProjectile);
            };
            
            // Start animation
            animateProjectile();
        } else {
            // For melee enemies, just show the attack effect in front of them
            // Create a direction vector from enemy to player (only in x and z)
            const horizontalDirection = new THREE.Vector3(
                playerPosition.x - this.mesh.position.x,
                0,
                playerPosition.z - this.mesh.position.z
            ).normalize();
            
            // Position the attack effect in front of the enemy (maintaining the same height)
            attackEffect.position.x += horizontalDirection.x * 0.5;
            attackEffect.position.z += horizontalDirection.z * 0.5;
            // Keep y position fixed at 1 (slightly above enemy center)
            
            // For melee enemies, just show the effect briefly
            setTimeout(() => {
                this.scene.remove(attackEffect);
                this.isAttacking = false;
            }, 500);
        }
        
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