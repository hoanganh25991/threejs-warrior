import Skill from '../skill.js';
import * as THREE from 'three';

export default class Inferno extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Inferno";
        this.manaCost = 90;
        this.damage = 150;
        this.range = 12;
        this.radius = 6;
        this.duration = 5.0;
        this.particleCount = 200;
        this.infernoPools = [];
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Create a massive fire storm in target area
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        const targetPosition = origin.clone().add(direction.clone().multiplyScalar(this.range));
        
        // Create main inferno pool
        this.createInfernoPool(targetPosition, this.radius, this.duration);
        
        // Create smaller satellite pools
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.radius * 0.7;
            
            const satellitePosition = new THREE.Vector3(
                targetPosition.x + Math.cos(angle) * distance,
                targetPosition.y,
                targetPosition.z + Math.sin(angle) * distance
            );
            
            this.createInfernoPool(satellitePosition, this.radius * 0.5, this.duration * 0.8);
        }
        
        // Create initial explosion effect
        const explosionGeometry = new THREE.SphereGeometry(this.radius * 0.5, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.7
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(targetPosition);
        explosion.position.y += this.radius * 0.5;
        this.scene.add(explosion);
        
        // Animate explosion
        const startTime = Date.now();
        const animateExplosion = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 1.0; // 1 second animation
            
            if (progress < 1) {
                const scale = 1 + progress * 3;
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = 0.7 * (1 - progress);
                requestAnimationFrame(animateExplosion);
            } else {
                this.scene.remove(explosion);
                explosion.geometry.dispose();
                explosion.material.dispose();
            }
        };
        
        animateExplosion();
        
        // Create explosion particles
        for (let i = 0; i < this.particleCount / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius;
            const height = Math.random() * (this.radius * 2);
            
            const position = new THREE.Vector3(
                targetPosition.x + Math.cos(angle) * radius,
                targetPosition.y + height,
                targetPosition.z + Math.sin(angle) * radius
            );
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                position,
                color,
                0.2 + Math.random() * 0.3,
                1.0 + Math.random() * 2.0
            );
            
            // Add outward and upward velocity
            const outDirection = new THREE.Vector3(
                position.x - targetPosition.x,
                0,
                position.z - targetPosition.z
            ).normalize();
            
            particle.velocity.copy(outDirection.multiplyScalar(2 + Math.random() * 5));
            particle.velocity.y = 3 + Math.random() * 5;
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('inferno');
        }
    }
    
    createInfernoPool(position, radius, duration) {
        // Create pool geometry
        const poolGeometry = new THREE.CircleGeometry(radius, 32);
        const poolMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.rotation.x = -Math.PI / 2; // Lay flat
        pool.position.copy(position);
        pool.position.y += 0.1; // Slightly above ground
        this.scene.add(pool);
        
        // Store pool data
        this.infernoPools.push({
            mesh: pool,
            position: position.clone(),
            radius: radius,
            startTime: Date.now(),
            duration: duration * 1000, // Convert to ms
            lastParticleTime: 0
        });
        
        // Set a timeout to remove the pool
        setTimeout(() => {
            this.scene.remove(pool);
            pool.geometry.dispose();
            pool.material.dispose();
            
            // Remove from pools array
            const index = this.infernoPools.findIndex(p => p.mesh === pool);
            if (index !== -1) {
                this.infernoPools.splice(index, 1);
            }
        }, duration * 1000);
    }

    updateEffect(delta) {
        // Update each inferno pool
        this.infernoPools.forEach(pool => {
            const now = Date.now();
            const elapsed = now - pool.startTime;
            const progress = elapsed / pool.duration;
            
            // Update pool appearance
            if (pool.mesh) {
                // Pulse effect
                const pulseScale = 1 + 0.1 * Math.sin(elapsed / 200);
                pool.mesh.scale.set(pulseScale, 1, pulseScale);
                
                // Fade out near end
                if (progress > 0.7) {
                    pool.mesh.material.opacity = 0.5 * (1 - ((progress - 0.7) / 0.3));
                }
            }
            
            // Create fire particles
            if (now - pool.lastParticleTime > 50) { // Every 50ms
                pool.lastParticleTime = now;
                
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * pool.radius;
                    
                    const position = new THREE.Vector3(
                        pool.position.x + Math.cos(angle) * radius,
                        pool.position.y,
                        pool.position.z + Math.sin(angle) * radius
                    );
                    
                    // Create particle with fire color
                    const hue = 0.05 + Math.random() * 0.05;
                    const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                    
                    const particle = this.createParticle(
                        position,
                        color,
                        0.1 + Math.random() * 0.2,
                        0.5 + Math.random() * 1.0
                    );
                    
                    // Add upward velocity
                    particle.velocity.y = 1 + Math.random() * 3;
                    particle.velocity.x = (Math.random() - 0.5) * 2;
                    particle.velocity.z = (Math.random() - 0.5) * 2;
                }
            }
            
            // Check for enemies in pool area and apply damage
            const enemies = this.scene.getObjectsByProperty('type', 'enemy');
            
            enemies.forEach(enemy => {
                const horizontalDistance = new THREE.Vector2(
                    enemy.position.x - pool.position.x,
                    enemy.position.z - pool.position.z
                ).length();
                
                if (horizontalDistance <= pool.radius) {
                    // Apply damage
                    enemy.takeDamage(this.damage * delta / this.infernoPools.length);
                    
                    // Apply burning effect
                    if (!enemy.burning) {
                        enemy.burning = true;
                        enemy.burnDamage = this.damage * 0.1; // 10% of original damage per second
                        enemy.burnDuration = 3.0; // 3 seconds
                        
                        // Reset burn after duration
                        setTimeout(() => {
                            if (enemy.burning) {
                                enemy.burning = false;
                            }
                        }, enemy.burnDuration * 1000);
                    }
                    
                    // Create fire particles on enemy
                    if (Math.random() < 0.1) {
                        const position = enemy.position.clone();
                        position.y += 1;
                        
                        const hue = 0.05 + Math.random() * 0.05;
                        const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                        
                        this.createParticle(
                            position,
                            color,
                            0.1 + Math.random() * 0.1,
                            0.3 + Math.random() * 0.5
                        );
                    }
                }
            });
        });
    }
}