import * as THREE from 'three';
import { Enemy } from './enemy.js';
import { config } from './config/config.js';

export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = config.enemies.spawnRate;
        this.maxEnemies = config.enemies.maxEnemies;
        this.spawnRadius = 20;
    }
    
    update(deltaTime, playerPosition) {
        // Skip update if no player position
        if (!playerPosition) return;
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn new enemies if needed
        if (this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy(playerPosition);
            this.spawnTimer = 0;
        }
        
        // Update all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, playerPosition);
        }
    }
    
    spawnEnemy(playerPosition) {
        // Determine enemy type
        let enemyType = 'basic';
        const random = Math.random();
        
        if (random > 0.95) {
            enemyType = 'boss';
        } else if (random > 0.8) {
            enemyType = 'elite';
        }
        
        // Calculate spawn position (random position around player)
        const angle = Math.random() * Math.PI * 2;
        const radius = this.spawnRadius + Math.random() * 10; // Between spawnRadius and spawnRadius + 10
        
        const spawnPosition = new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * radius,
            0,
            playerPosition.z + Math.sin(angle) * radius
        );
        
        // Create new enemy
        const enemy = new Enemy(this.scene, enemyType, spawnPosition);
        
        // Ensure enemy has proper collision data
        if (enemy.mesh) {
            // Add collision data to the mesh's userData if not already present
            if (!enemy.mesh.userData.collisionType) {
                enemy.mesh.userData.collisionType = "box";
                enemy.mesh.userData.collisionRadius = 1.0;
                enemy.mesh.userData.collisionHeight = 1.5;
                enemy.mesh.userData.isEnemy = true;
            }
            
            // Create a collision box for the enemy if not already present
            if (!enemy.mesh.userData.collisionBox) {
                const boundingBox = new THREE.Box3().setFromObject(enemy.mesh);
                enemy.mesh.userData.collisionBox = boundingBox;
            }
        }
        
        this.enemies.push(enemy);
        
        return enemy;
    }
    
    checkCollisions(playerPosition, playerRadius = 1) {
        // Check for collisions between player and enemies
        const collisions = [];
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            const distance = enemy.mesh.position.distanceTo(playerPosition);
            
            // If enemy is within attack range and is attacking
            if (distance <= enemy.attackRange && enemy.isAttacking) {
                collisions.push({
                    enemy,
                    damage: enemy.damage
                });
            }
        }
        
        return collisions;
    }
    
    handlePlayerAttack(position, radius, damage) {
        // Check for enemies within attack radius
        const hitEnemies = [];
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = enemy.mesh.position.distanceTo(position);
            
            if (distance <= radius) {
                // Enemy is hit
                const isDead = enemy.takeDamage(damage);
                
                if (isDead) {
                    // Enemy died, remove from array
                    hitEnemies.push({
                        enemy,
                        experience: enemy.experienceValue
                    });
                    
                    this.enemies.splice(i, 1);
                } else {
                    // Enemy was hit but not killed
                    hitEnemies.push({
                        enemy,
                        experience: 0
                    });
                }
            }
        }
        
        return hitEnemies;
    }
}

export default EnemyManager;