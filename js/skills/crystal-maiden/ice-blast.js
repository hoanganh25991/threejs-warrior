import Skill from '../skill.js';
import * as THREE from 'three';

export default class IceBlast extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Ice Blast";
        this.manaCost = 40;
        this.damage = 70;
        this.range = 25;
        this.projectileSpeed = 20;
        this.freezeDuration = 2.5;
        this.aoeRadius = 4;
        this.projectile = null;
        this.projectileStartPosition = null;
        this.projectileDirection = null;
        this.projectileDistance = 0;
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Create a simple ice projectile
        const origin = this.hero.group.position.clone();
        origin.y += 1.5;
        
        const direction = this.hero.direction.clone();
        
        // Simple ice crystal projectile
        const projectileGroup = new THREE.Group();
        projectileGroup.position.copy(origin);
        this.scene.add(projectileGroup);
        
        // Core ice crystal - simple geometry
        const coreGeometry = new THREE.OctahedronGeometry(0.3);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.8,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectileGroup.add(core);
        
        // Simple particle trail (fewer particles)
        for (let i = 0; i < 5; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.6
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4
            );
            
            projectileGroup.add(particle);
        }
        
        // Orient projectile
        projectileGroup.lookAt(origin.clone().add(direction));
        
        // Store projectile data
        this.projectile = projectileGroup;
        this.projectileStartPosition = origin.clone();
        this.projectileDirection = direction.clone();
        this.projectileDistance = 0;
        
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
        
        // Simple rotation
        this.projectile.rotation.y += delta * 3;
        
        // Check for collision with enemies
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        let hitEnemy = false;
        
        enemies.forEach(enemy => {
            if (hitEnemy) return;
            
            const distance = enemy.position.distanceTo(this.projectile.position);
            
            if (distance <= 1.5) {
                hitEnemy = true;
                
                // Simple explosion effect
                this.createSimpleExplosion(this.projectile.position.clone());
                
                // Apply damage to all enemies in AOE radius
                enemies.forEach(aoeEnemy => {
                    const aoeDistance = aoeEnemy.position.distanceTo(this.projectile.position);
                    
                    if (aoeDistance <= this.aoeRadius) {
                        // Apply damage with falloff
                        const damageMultiplier = 1 - (aoeDistance / this.aoeRadius);
                        aoeEnemy.takeDamage(this.damage * damageMultiplier);
                        
                        // Simple freeze effect
                        if (!aoeEnemy.frozen) {
                            aoeEnemy.frozen = true;
                            aoeEnemy.originalSpeed = aoeEnemy.speed;
                            aoeEnemy.speed = 0;
                            
                            // Simple ice visual effect
                            this.createSimpleIceEffect(aoeEnemy);
                            
                            // Unfreeze after duration
                            setTimeout(() => {
                                if (aoeEnemy.frozen) {
                                    aoeEnemy.speed = aoeEnemy.originalSpeed;
                                    aoeEnemy.frozen = false;
                                    this.removeIceEffect(aoeEnemy);
                                }
                            }, this.freezeDuration * 1000);
                        }
                    }
                });
            }
        });
        
        // Check for max range
        if (this.projectileDistance >= this.range || hitEnemy) {
            if (!hitEnemy && this.projectileDistance >= this.range) {
                this.createSimpleExplosion(this.projectile.position.clone());
            }
            
            // Clean up projectile
            this.scene.remove(this.projectile);
            this.projectile.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.projectile = null;
        }
    }
    
    createSimpleIceEffect(enemy) {
        // Simple ice crystal around enemy
        const iceGeometry = new THREE.IcosahedronGeometry(1.2);
        const iceMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        
        const ice = new THREE.Mesh(iceGeometry, iceMaterial);
        ice.position.copy(enemy.position);
        ice.position.y += 1;
        this.scene.add(ice);
        
        enemy.iceEffect = ice;
    }
    
    removeIceEffect(enemy) {
        if (enemy.iceEffect) {
            this.scene.remove(enemy.iceEffect);
            enemy.iceEffect.geometry.dispose();
            enemy.iceEffect.material.dispose();
            enemy.iceEffect = null;
        }
    }
    
    createSimpleExplosion(position) {
        // Simple explosion with fewer particles
        const explosionGroup = new THREE.Group();
        explosionGroup.position.copy(position);
        this.scene.add(explosionGroup);
        
        // Central flash
        const flashGeometry = new THREE.SphereGeometry(0.5);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        explosionGroup.add(flash);
        
        // Simple particles (reduced from 100 to 20)
        for (let i = 0; i < 20; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random direction
            const direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize();
            
            particle.position.copy(direction.multiplyScalar(Math.random() * 2));
            explosionGroup.add(particle);
        }
        
        // Simple shockwave
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.3, 16);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.rotation.x = -Math.PI / 2;
        shockwave.position.copy(position);
        this.scene.add(shockwave);
        
        // Simple animation
        let scale = 0.1;
        let opacity = 0.8;
        
        const animate = () => {
            scale += 0.2;
            opacity -= 0.05;
            
            // Update flash
            flash.material.opacity = Math.max(0, opacity * 2);
            
            // Update shockwave
            shockwave.scale.set(scale, scale, 1);
            shockwave.material.opacity = Math.max(0, opacity);
            
            // Update particles
            explosionGroup.children.forEach((child, index) => {
                if (index > 0) { // Skip flash
                    child.material.opacity = Math.max(0, opacity);
                }
            });
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                // Clean up
                this.scene.remove(explosionGroup);
                this.scene.remove(shockwave);
                
                explosionGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                
                shockwaveGeometry.dispose();
                shockwaveMaterial.dispose();
            }
        };
        
        animate();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-explosion');
        }
    }
}