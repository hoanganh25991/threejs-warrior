import * as THREE from 'three';
import Enemy from './enemy.js';
import { config } from '../config/config.js';

export default class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = config.enemies?.spawnRate || 5;
        this.maxEnemies = config.enemies?.maxEnemies || 10;
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
            enemy.update(deltaTime);
            
            // Remove dead enemies
            if (enemy.health <= 0) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    spawnEnemy(playerPosition) {
        // Determine enemy type
        let enemyType = 'basic';
        const random = Math.random();
        
        if (random > 0.95) {
            enemyType = 'boss';
        } else if (random > 0.8) {
            enemyType = 'mage';
        } else if (random > 0.6) {
            enemyType = 'archer';
        } else if (random > 0.4) {
            enemyType = 'tank';
        }
        
        // Calculate spawn position (random position around player)
        const angle = Math.random() * Math.PI * 2;
        const radius = this.spawnRadius + Math.random() * 10; // Between spawnRadius and spawnRadius + 10
        
        // Always spawn enemies at ground level (y=0)
        const spawnPosition = new THREE.Vector3(
            playerPosition.x + Math.cos(angle) * radius,
            0, // Fixed at ground level
            playerPosition.z + Math.sin(angle) * radius
        );
        
        // Create new enemy
        const enemy = new Enemy(this.scene, spawnPosition, enemyType);
        this.enemies.push(enemy);
        
        // Ensure the enemy is properly positioned on the ground
        enemy.group.position.y = 0;
        
        return enemy;
    }
    
    checkCollisions(playerPosition, playerRadius = 1) {
        // Check for collisions between player and enemies
        const collisions = [];
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            const distance = enemy.group.position.distanceTo(playerPosition);
            
            // If enemy is within attack range and is attacking
            if (distance <= enemy.attackRange && enemy.state === 'attack') {
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
            const distance = enemy.group.position.distanceTo(position);
            
            if (distance <= radius) {
                // Enemy is hit
                enemy.takeDamage(damage);
                
                if (enemy.health <= 0) {
                    // Enemy died
                    hitEnemies.push({
                        enemy,
                        experience: enemy.experience
                    });
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
    
    // Get all enemies
    getEnemies() {
        return this.enemies;
    }
    
    // Clear all enemies
    clearEnemies() {
        for (const enemy of this.enemies) {
            enemy.remove();
        }
        this.enemies = [];
    }
}