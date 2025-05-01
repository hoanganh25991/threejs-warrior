import Skill from '../skill.js';
import * as THREE from 'three';

export default class BattleHunger extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 40;
        this.damage = 20; // Damage per second
        this.range = 15;
        this.duration = 5.0; // Effect lasts for 5 seconds
        this.targetedEnemies = new Map(); // Track affected enemies and their effects
        this.projectile = null;
    }

    getCooldownDuration() {
        return 10.0;
    }

    createEffect() {
        // Get hero position and direction
        const origin = this.hero.group.position.clone();
        origin.y += 1; // Adjust to be at character height
        const direction = this.hero.direction.clone();
        
        // Find the closest enemy in front of the hero
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            // Check if enemy is within range and in front of hero
            if (distance <= this.range) {
                const angle = toEnemy.angleTo(direction);
                if (angle < Math.PI / 2) { // Within 90 degrees of forward direction
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
        });
        
        if (!closestEnemy) {
            // No valid target found
            this.isActive = false;
            return;
        }
        
        // Create a tree-shaped projectile that travels to the target
        this.createTreeProjectile(origin, closestEnemy);
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('battle-hunger');
        }
    }
    
    createTreeProjectile(origin, target) {
        // Create the base trunk of the tree
        const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.5, 6);
        const trunkMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8,
            emissive: 0xff4400,
            emissiveIntensity: 0.5
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.copy(origin);
        this.scene.add(trunk);
        
        // Create branches
        const branches = [];
        const branchCount = 5;
        const branchGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.3, 4);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position at the top of the trunk
            branch.position.copy(origin);
            branch.position.y += 0.2;
            
            // Rotate to point outward
            branch.rotation.z = Math.PI / 3; // Angle upward
            branch.rotation.y = angle; // Rotate around trunk
            
            this.scene.add(branch);
            branches.push(branch);
        }
        
        // Create leaves (particles)
        const leaves = [];
        for (let i = 0; i < 20; i++) {
            const leafGeometry = new THREE.SphereGeometry(0.03, 4, 4);
            const leafMaterial = new THREE.MeshBasicMaterial({
                color: 0xff9900,
                transparent: true,
                opacity: 0.7
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position randomly around the branches
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.1 + Math.random() * 0.2;
            leaf.position.copy(origin);
            leaf.position.x += Math.cos(angle) * radius;
            leaf.position.y += 0.1 + Math.random() * 0.3;
            leaf.position.z += Math.sin(angle) * radius;
            
            this.scene.add(leaf);
            leaves.push(leaf);
        }
        
        // Store projectile components
        this.projectile = {
            trunk,
            branches,
            leaves,
            target,
            startPosition: origin.clone(),
            targetPosition: target.position.clone(),
            startTime: Date.now(),
            duration: 1000, // 1 second to reach target
            hasHit: false
        };
    }
    
    updateEffect(delta) {
        // Update projectile if it exists
        if (this.projectile && !this.projectile.hasHit) {
            const elapsed = Date.now() - this.projectile.startTime;
            const progress = Math.min(elapsed / this.projectile.duration, 1);
            
            // Calculate current position
            const currentPos = new THREE.Vector3().lerpVectors(
                this.projectile.startPosition,
                this.projectile.targetPosition,
                progress
            );
            
            // Add slight arc
            currentPos.y += Math.sin(progress * Math.PI) * 2;
            
            // Update trunk position
            this.projectile.trunk.position.copy(currentPos);
            
            // Update branch positions
            this.projectile.branches.forEach((branch, i) => {
                const angle = (i / this.projectile.branches.length) * Math.PI * 2;
                branch.position.copy(currentPos);
                branch.rotation.y += delta * 5; // Spin as it travels
            });
            
            // Update leaf positions
            this.projectile.leaves.forEach(leaf => {
                leaf.position.copy(currentPos);
                
                // Add some random movement
                leaf.position.x += (Math.random() - 0.5) * 0.1;
                leaf.position.y += (Math.random() - 0.5) * 0.1;
                leaf.position.z += (Math.random() - 0.5) * 0.1;
                
                // Spin leaves
                leaf.rotation.x += delta * 10;
                leaf.rotation.y += delta * 10;
                leaf.rotation.z += delta * 10;
            });
            
            // Check if projectile has reached target
            if (progress >= 1) {
                this.projectile.hasHit = true;
                
                // Apply effect to target
                this.applyEffectToTarget(this.projectile.target);
                
                // Create impact effect
                this.createImpactEffect(this.projectile.targetPosition);
                
                // Clean up projectile
                this.cleanupProjectile();
            }
        }
        
        // Update all targeted enemies
        for (const [enemyId, effectData] of this.targetedEnemies.entries()) {
            effectData.elapsed += delta;
            
            // Apply damage over time
            if (effectData.enemy.takeDamage) {
                effectData.enemy.takeDamage(this.damage * delta);
            }
            
            // Update visual effect
            if (effectData.effect) {
                // Make the effect follow the enemy
                effectData.effect.position.copy(effectData.enemy.position);
                effectData.effect.position.y += 1.5; // Above enemy
                
                // Rotate the effect
                effectData.effect.rotation.y += delta * 2;
            }
            
            // Check if effect has expired
            if (effectData.elapsed >= this.duration) {
                // Remove effect
                if (effectData.effect) {
                    this.scene.remove(effectData.effect);
                    effectData.effect.geometry.dispose();
                    effectData.effect.material.dispose();
                }
                
                this.targetedEnemies.delete(enemyId);
            }
        }
        
        // Deactivate skill if no projectile and no targeted enemies
        if (!this.projectile && this.targetedEnemies.size === 0) {
            this.isActive = false;
        }
    }
    
    applyEffectToTarget(enemy) {
        if (!enemy) return;
        
        // Create visual effect to show enemy is affected
        const geometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
            emissive: 0xff4400,
            emissiveIntensity: 0.5
        });
        
        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(enemy.position);
        effect.position.y += 1.5; // Above enemy
        this.scene.add(effect);
        
        // Store enemy and effect data
        const enemyId = enemy.id || Math.random().toString(36).substr(2, 9);
        this.targetedEnemies.set(enemyId, {
            enemy,
            effect,
            elapsed: 0
        });
    }
    
    createImpactEffect(position) {
        // Create explosion particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            
            const pos = position.clone();
            pos.x += Math.cos(angle) * radius;
            pos.y += 1 + Math.random() * 0.5;
            pos.z += Math.sin(angle) * radius;
            
            const particle = this.createParticle(
                pos,
                0xff6600, // Orange color
                0.1 + Math.random() * 0.1, // Size
                0.5 + Math.random() * 0.5 // Life
            );
            
            // Add outward velocity
            particle.velocity.x = Math.cos(angle) * (1 + Math.random() * 2);
            particle.velocity.y = 1 + Math.random() * 2;
            particle.velocity.z = Math.sin(angle) * (1 + Math.random() * 2);
        }
    }
    
    cleanupProjectile() {
        if (!this.projectile) return;
        
        // Remove trunk
        this.scene.remove(this.projectile.trunk);
        this.projectile.trunk.geometry.dispose();
        this.projectile.trunk.material.dispose();
        
        // Remove branches
        this.projectile.branches.forEach(branch => {
            this.scene.remove(branch);
            branch.geometry.dispose();
            branch.material.dispose();
        });
        
        // Remove leaves
        this.projectile.leaves.forEach(leaf => {
            this.scene.remove(leaf);
            leaf.geometry.dispose();
            leaf.material.dispose();
        });
        
        this.projectile = null;
    }
    
    cleanup() {
        super.cleanup();
        
        // Clean up projectile
        this.cleanupProjectile();
        
        // Clean up targeted enemy effects
        for (const [_, effectData] of this.targetedEnemies.entries()) {
            if (effectData.effect) {
                this.scene.remove(effectData.effect);
                effectData.effect.geometry.dispose();
                effectData.effect.material.dispose();
            }
        }
        
        this.targetedEnemies.clear();
    }
}