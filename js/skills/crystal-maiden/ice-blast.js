import Skill from '../skill.js';
import * as THREE from 'three';

export default class IceBlast extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Ice Blast";
        this.manaCost = 40;
        this.damage = 70;
        this.range = 15;
        this.projectileSpeed = 15;
        this.freezeDuration = 2.0;
        this.aoeRadius = 3;
        this.projectile = null;
        this.projectileStartPosition = null;
        this.projectileDirection = null;
        this.projectileDistance = 0;
    }

    getCooldownDuration() {
        return 5.0;
    }

    createEffect() {
        // Create an ice projectile that explodes on impact
        const origin = this.hero.group.position.clone();
        origin.y += 1.5; // Start at head level
        
        const direction = this.hero.direction.clone();
        
        // Create projectile geometry
        const projectileGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const projectileMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.8
        });
        
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.copy(origin);
        this.scene.add(projectile);
        
        // Store projectile data
        this.projectile = projectile;
        this.projectileStartPosition = origin.clone();
        this.projectileDirection = direction.clone();
        this.projectileDistance = 0;
        
        // Create ice crystal spikes on projectile
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const spikeGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
            const spikeMaterial = new THREE.MeshBasicMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.9
            });
            
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position spike on surface of projectile
            spike.position.set(
                Math.cos(angle) * 0.5,
                Math.sin(angle) * 0.5,
                0
            );
            
            // Rotate spike to point outward
            spike.rotation.z = angle + Math.PI / 2;
            
            projectile.add(spike);
        }
        
        // Create trail particles
        for (let i = 0; i < 20; i++) {
            const position = origin.clone();
            position.x += (Math.random() - 0.5) * 0.3;
            position.y += (Math.random() - 0.5) * 0.3;
            position.z += (Math.random() - 0.5) * 0.3;
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.5 + Math.random() * 0.5
            );
            
            // Add slight backward velocity
            particle.velocity.copy(direction.clone().multiplyScalar(-1 - Math.random()));
            particle.velocity.y += (Math.random() - 0.5) * 2;
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-blast');
        }
    }

    updateEffect(delta) {
        if (!this.projectile) return;
        
        // Move projectile
        const moveDistance = this.projectileSpeed * delta;
        this.projectile.position.add(this.projectileDirection.clone().multiplyScalar(moveDistance));
        this.projectileDistance += moveDistance;
        
        // Rotate projectile
        this.projectile.rotation.x += delta * 5;
        this.projectile.rotation.y += delta * 3;
        
        // Create trail particles
        if (Math.random() < 0.3) {
            const position = this.projectile.position.clone();
            position.x += (Math.random() - 0.5) * 0.3;
            position.y += (Math.random() - 0.5) * 0.3;
            position.z += (Math.random() - 0.5) * 0.3;
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.3 + Math.random() * 0.5
            );
            
            // Add slight backward velocity
            particle.velocity.copy(this.projectileDirection.clone().multiplyScalar(-1 - Math.random()));
            particle.velocity.y += (Math.random() - 0.5) * 2;
        }
        
        // Check for collision with enemies
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        let hitEnemy = false;
        
        enemies.forEach(enemy => {
            if (hitEnemy) return; // Only hit one enemy
            
            const distance = enemy.position.distanceTo(this.projectile.position);
            
            if (distance <= 1.0) { // Hit radius
                hitEnemy = true;
                
                // Create explosion effect
                this.createExplosion(this.projectile.position.clone());
                
                // Apply damage to all enemies in explosion radius
                enemies.forEach(aoeEnemy => {
                    const aoeDistance = aoeEnemy.position.distanceTo(this.projectile.position);
                    
                    if (aoeDistance <= this.aoeRadius) {
                        // Apply damage with falloff based on distance
                        const damageMultiplier = 1 - (aoeDistance / this.aoeRadius);
                        aoeEnemy.takeDamage(this.damage * damageMultiplier);
                        
                        // Apply freeze effect
                        if (!aoeEnemy.frozen) {
                            aoeEnemy.frozen = true;
                            aoeEnemy.originalSpeed = aoeEnemy.speed;
                            aoeEnemy.speed = 0;
                            
                            // Create ice crystal on enemy
                            const crystalGeometry = new THREE.IcosahedronGeometry(0.5, 0);
                            const crystalMaterial = new THREE.MeshBasicMaterial({
                                color: 0x88ccff,
                                transparent: true,
                                opacity: 0.7
                            });
                            
                            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                            crystal.position.copy(aoeEnemy.position);
                            crystal.position.y += 1;
                            this.scene.add(crystal);
                            
                            // Reset freeze after duration
                            setTimeout(() => {
                                if (aoeEnemy.frozen) {
                                    aoeEnemy.speed = aoeEnemy.originalSpeed;
                                    aoeEnemy.frozen = false;
                                }
                                this.scene.remove(crystal);
                                crystalGeometry.dispose();
                                crystalMaterial.dispose();
                            }, this.freezeDuration * 1000);
                        }
                    }
                });
            }
        });
        
        // Check for max range
        if (this.projectileDistance >= this.range || hitEnemy) {
            // If max range reached without hitting enemy, create explosion at end point
            if (!hitEnemy && this.projectileDistance >= this.range) {
                this.createExplosion(this.projectile.position.clone());
            }
            
            // Remove projectile
            this.scene.remove(this.projectile);
            this.projectile.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.projectile = null;
        }
    }
    
    createExplosion(position) {
        // Create explosion geometry
        const explosionGeometry = new THREE.SphereGeometry(this.aoeRadius, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Animate explosion
        const startTime = Date.now();
        const animateExplosion = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 1.0; // 1 second animation
            
            if (progress < 1) {
                const scale = progress * 1.5;
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = 0.5 * (1 - progress);
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
                explosion.geometry.dispose();
                explosion.material.dispose();
            }
        };
        
        animateExplosion();
        
        // Create ice shards
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = Math.random() * this.aoeRadius;
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const shardPosition = new THREE.Vector3(
                position.x + x,
                position.y + y,
                position.z + z
            );
            
            const particle = this.createParticle(
                shardPosition,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.2,
                0.5 + Math.random() * 1.0
            );
            
            // Add outward velocity
            const direction = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(direction.multiplyScalar(3 + Math.random() * 5));
        }
        
        // Play explosion sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-explosion');
        }
    }
}