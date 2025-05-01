import * as THREE from 'three';

export default class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.raycaster = new THREE.Raycaster();
        this.tempVector = new THREE.Vector3();
        this.tempMatrix = new THREE.Matrix4();
    }

    /**
     * Check for collisions between a skill effect and enemies
     * @param {Object} skillEffect - The skill effect object
     * @param {THREE.Vector3} origin - Origin point of the skill
     * @param {THREE.Vector3} direction - Direction of the skill
     * @param {Number} range - Maximum range of the skill
     * @param {Number} radius - Radius of the skill effect (for area skills)
     * @param {Number} damage - Base damage of the skill
     * @param {String} damageType - Type of damage (physical, magic, fire, etc.)
     * @returns {Array} - Array of hit enemies
     */
    checkSkillCollision(skillEffect, origin, direction, range, radius = 1, damage = 10, damageType = 'physical') {
        const hitEnemies = [];
        const enemies = this.getEnemiesInScene();
        
        if (enemies.length === 0) return hitEnemies;
        
        // Different collision detection based on skill type
        if (skillEffect.type === 'cone') {
            // Cone-shaped skill (like dragon breath)
            return this.checkConeCollision(enemies, origin, direction, range, skillEffect.width || Math.PI/4, damage, damageType);
        } else if (skillEffect.type === 'projectile') {
            // Single projectile
            return this.checkProjectileCollision(enemies, skillEffect.position, radius, damage, damageType);
        } else if (skillEffect.type === 'aoe') {
            // Area of effect
            return this.checkAOECollision(enemies, origin, radius, damage, damageType);
        } else {
            // Default to ray cast in direction
            return this.checkRayCollision(enemies, origin, direction, range, damage, damageType);
        }
    }
    
    /**
     * Check for collisions in a cone shape
     */
    checkConeCollision(enemies, origin, direction, range, angle, damage, damageType) {
        const hitEnemies = [];
        
        enemies.forEach(enemy => {
            // Get enemy position (from group or mesh)
            const enemyPosition = this.getEnemyPosition(enemy);
            if (!enemyPosition) return;
            
            // Calculate vector to enemy
            const toEnemy = enemyPosition.clone().sub(origin);
            const distance = toEnemy.length();
            
            // Check if enemy is within range
            if (distance <= range) {
                // Check if enemy is within the cone angle
                const angleToEnemy = toEnemy.angleTo(direction);
                if (angleToEnemy <= angle / 2) {
                    // Apply damage based on distance (more damage closer)
                    const damageMultiplier = 1 - (distance / range) * 0.5; // At least 50% damage at max range
                    const actualDamage = Math.round(damage * damageMultiplier);
                    
                    // Apply damage to enemy
                    this.applyDamageToEnemy(enemy, actualDamage, damageType);
                    
                    hitEnemies.push({
                        enemy,
                        damage: actualDamage,
                        position: enemyPosition.clone()
                    });
                }
            }
        });
        
        return hitEnemies;
    }
    
    /**
     * Check for collisions with a projectile
     */
    checkProjectileCollision(enemies, projectilePosition, radius, damage, damageType) {
        const hitEnemies = [];
        
        enemies.forEach(enemy => {
            const enemyPosition = this.getEnemyPosition(enemy);
            if (!enemyPosition) return;
            
            const distance = enemyPosition.distanceTo(projectilePosition);
            if (distance <= radius) {
                this.applyDamageToEnemy(enemy, damage, damageType);
                
                hitEnemies.push({
                    enemy,
                    damage,
                    position: enemyPosition.clone()
                });
            }
        });
        
        return hitEnemies;
    }
    
    /**
     * Check for collisions in an area of effect
     */
    checkAOECollision(enemies, center, radius, damage, damageType) {
        const hitEnemies = [];
        
        enemies.forEach(enemy => {
            const enemyPosition = this.getEnemyPosition(enemy);
            if (!enemyPosition) return;
            
            const distance = enemyPosition.distanceTo(center);
            if (distance <= radius) {
                // Apply damage based on distance from center
                const damageMultiplier = 1 - (distance / radius) * 0.5; // At least 50% damage at edge
                const actualDamage = Math.round(damage * damageMultiplier);
                
                this.applyDamageToEnemy(enemy, actualDamage, damageType);
                
                hitEnemies.push({
                    enemy,
                    damage: actualDamage,
                    position: enemyPosition.clone()
                });
            }
        });
        
        return hitEnemies;
    }
    
    /**
     * Check for collisions with a ray
     */
    checkRayCollision(enemies, origin, direction, range, damage, damageType) {
        const hitEnemies = [];
        
        // Set up raycaster
        this.raycaster.set(origin, direction.normalize());
        this.raycaster.far = range;
        
        // Get all enemy meshes for raycasting
        const enemyMeshes = [];
        enemies.forEach(enemy => {
            if (enemy.model) {
                enemyMeshes.push(enemy.model);
            } else if (enemy.group) {
                enemy.group.traverse(child => {
                    if (child.isMesh) {
                        child.userData.enemyRef = enemy; // Store reference to enemy
                        enemyMeshes.push(child);
                    }
                });
            }
        });
        
        // Perform raycast
        const intersects = this.raycaster.intersectObjects(enemyMeshes, true);
        
        if (intersects.length > 0) {
            // Get the closest hit
            const hit = intersects[0];
            const hitEnemy = hit.object.userData.enemyRef || 
                            hit.object.parent.userData.enemyRef;
            
            if (hitEnemy) {
                this.applyDamageToEnemy(hitEnemy, damage, damageType);
                
                hitEnemies.push({
                    enemy: hitEnemy,
                    damage,
                    position: hit.point.clone()
                });
            }
        }
        
        return hitEnemies;
    }
    
    /**
     * Apply damage to an enemy
     */
    applyDamageToEnemy(enemy, damage, damageType) {
        // Check if enemy has takeDamage method
        if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(damage);
            
            // Create damage number effect
            this.createDamageNumber(this.getEnemyPosition(enemy), damage);
            
            // Create hit effect based on damage type
            this.createHitEffect(this.getEnemyPosition(enemy), damageType);
            
            console.log(`Applied ${damage} ${damageType} damage to enemy`);
            return true;
        } else if (enemy.health !== undefined) {
            // Direct manipulation if takeDamage not available
            enemy.health = Math.max(0, enemy.health - damage);
            
            // If the enemy has an updateUI method, call it
            if (typeof enemy.updateUI === 'function') {
                enemy.updateUI();
            }
            
            // Create damage number effect
            this.createDamageNumber(this.getEnemyPosition(enemy), damage);
            
            // Create hit effect based on damage type
            this.createHitEffect(this.getEnemyPosition(enemy), damageType);
            
            console.log(`Applied ${damage} ${damageType} damage to enemy`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Create a damage number effect
     */
    createDamageNumber(position, damage, damageType = 'physical') {
        // Check if we have access to the damage numbers system
        if (window.game && window.game.damageNumbers) {
            window.game.damageNumbers.createDamageNumber(position, damage, damageType);
        } else {
            // Fallback: log to console
            console.log(`Damage: ${damage} (${damageType}) at position ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`);
        }
    }
    
    /**
     * Create a hit effect based on damage type
     */
    createHitEffect(position, damageType) {
        // This would create a particle effect at the hit position
        // For now, we'll just log it
        console.log(`Hit effect (${damageType}) at position ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`);
    }
    
    /**
     * Get all enemies in the scene
     */
    getEnemiesInScene() {
        // Try to get enemies from enemy manager first
        if (window.game && window.game.enemyManager) {
            return window.game.enemyManager.getEnemies();
        }
        
        // Fallback: find objects with type 'enemy'
        const enemies = [];
        this.scene.traverse(object => {
            if (object.userData && object.userData.type === 'enemy') {
                if (object.userData.enemyRef) {
                    enemies.push(object.userData.enemyRef);
                } else {
                    enemies.push(object);
                }
            }
        });
        
        return enemies;
    }
    
    /**
     * Get the position of an enemy
     */
    getEnemyPosition(enemy) {
        if (!enemy) return null;
        
        if (enemy.group && enemy.group.position) {
            return enemy.group.position;
        } else if (enemy.position) {
            return enemy.position;
        } else if (enemy.model && enemy.model.position) {
            return enemy.model.position;
        }
        
        return null;
    }
}