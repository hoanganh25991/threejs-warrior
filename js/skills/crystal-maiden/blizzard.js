import Skill from '../skill.js';
import * as THREE from 'three';

export default class Blizzard extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Blizzard";
        this.manaCost = 90;
        this.damage = 120;
        this.range = 10;
        this.radius = 8;
        this.duration = 6.0;
        this.slowAmount = 0.7; // 70% slow
        this.particleCount = 200;
        this.blizzardActive = false;
        this.blizzardCenter = null;
        this.blizzardMesh = null;
        this.lastParticleTime = 0;
    }

    getCooldownDuration() {
        return 20.0;
    }

    createEffect() {
        // Create a massive blizzard in target area
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        const targetPosition = origin.clone().add(direction.clone().multiplyScalar(this.range));
        
        // Store blizzard center
        this.blizzardCenter = targetPosition.clone();
        
        // Create blizzard area indicator
        const areaGeometry = new THREE.CircleGeometry(this.radius, 32);
        const areaMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const area = new THREE.Mesh(areaGeometry, areaMaterial);
        area.rotation.x = -Math.PI / 2; // Lay flat
        area.position.copy(targetPosition);
        area.position.y += 0.1; // Slightly above ground
        this.scene.add(area);
        
        // Store reference
        this.blizzardMesh = area;
        
        // Create initial snow burst
        for (let i = 0; i < this.particleCount / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius;
            
            const position = new THREE.Vector3(
                targetPosition.x + Math.cos(angle) * radius,
                targetPosition.y + 5 + Math.random() * 5, // Start high
                targetPosition.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xffffff, // White
                0.05 + Math.random() * 0.1,
                1.0 + Math.random() * 2.0
            );
            
            // Add downward velocity
            particle.velocity.y = -2 - Math.random() * 3;
            particle.velocity.x = (Math.random() - 0.5) * 2;
            particle.velocity.z = (Math.random() - 0.5) * 2;
        }
        
        // Create ice crystals on ground
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius * 0.8;
            
            const position = new THREE.Vector3(
                targetPosition.x + Math.cos(angle) * radius,
                targetPosition.y + 0.1, // Just above ground
                targetPosition.z + Math.sin(angle) * radius
            );
            
            const crystalGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
            const crystalMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.copy(position);
            crystal.rotation.x = Math.PI / 2; // Point upward
            this.scene.add(crystal);
            
            // Store in particles array to be cleaned up
            this.particles.push({
                mesh: crystal,
                life: this.duration,
                update: (delta) => {
                    // Fade out near end of duration
                    if (crystal.material.opacity > 0.1 && this.particles[0].life < 1.0) {
                        crystal.material.opacity -= delta * 0.5;
                    }
                }
            });
        }
        
        // Set blizzard active
        this.blizzardActive = true;
        this.lastParticleTime = Date.now();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('blizzard');
        }
        
        // Set a timeout to end the blizzard
        setTimeout(() => {
            this.endBlizzard();
        }, this.duration * 1000);
    }
    
    endBlizzard() {
        if (!this.blizzardActive) return;
        
        // Remove blizzard mesh
        if (this.blizzardMesh) {
            this.scene.remove(this.blizzardMesh);
            this.blizzardMesh.geometry.dispose();
            this.blizzardMesh.material.dispose();
            this.blizzardMesh = null;
        }
        
        // Set blizzard inactive
        this.blizzardActive = false;
        this.blizzardCenter = null;
    }

    updateEffect(delta) {
        if (!this.blizzardActive || !this.blizzardCenter) return;
        
        // Update blizzard area appearance
        if (this.blizzardMesh) {
            // Pulse effect
            const pulseScale = 1 + 0.05 * Math.sin(Date.now() / 300);
            this.blizzardMesh.scale.set(pulseScale, 1, pulseScale);
        }
        
        // Create continuous snow particles
        const now = Date.now();
        if (now - this.lastParticleTime > 50) { // Every 50ms
            this.lastParticleTime = now;
            
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.radius;
                
                const position = new THREE.Vector3(
                    this.blizzardCenter.x + Math.cos(angle) * radius,
                    this.blizzardCenter.y + 10 + Math.random() * 5, // Start high
                    this.blizzardCenter.z + Math.sin(angle) * radius
                );
                
                const particle = this.createParticle(
                    position,
                    0xffffff, // White
                    0.05 + Math.random() * 0.1,
                    1.0 + Math.random() * 2.0
                );
                
                // Add downward velocity with some randomness
                particle.velocity.y = -2 - Math.random() * 3;
                particle.velocity.x = (Math.random() - 0.5) * 2;
                particle.velocity.z = (Math.random() - 0.5) * 2;
                
                // Override update to add swirling motion
                const originalUpdate = particle.update;
                particle.update = (delta) => {
                    // Add swirling motion
                    const swirl = 0.5 * delta;
                    const angle = Math.atan2(
                        particle.mesh.position.z - this.blizzardCenter.z,
                        particle.mesh.position.x - this.blizzardCenter.x
                    );
                    
                    particle.mesh.position.x += Math.cos(angle + Math.PI/2) * swirl;
                    particle.mesh.position.z += Math.sin(angle + Math.PI/2) * swirl;
                    
                    // Call original update
                    originalUpdate(delta);
                };
            }
        }
        
        // Create occasional ice crystals
        if (Math.random() < 0.05) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius * 0.8;
            
            const position = new THREE.Vector3(
                this.blizzardCenter.x + Math.cos(angle) * radius,
                this.blizzardCenter.y + 0.1, // Just above ground
                this.blizzardCenter.z + Math.sin(angle) * radius
            );
            
            const crystalGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
            const crystalMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.copy(position);
            crystal.rotation.x = Math.PI / 2; // Point upward
            this.scene.add(crystal);
            
            // Store in particles array to be cleaned up
            this.particles.push({
                mesh: crystal,
                life: 1.0 + Math.random() * 2.0,
                update: (delta) => {
                    // Grow slightly
                    crystal.scale.x += delta * 0.2;
                    crystal.scale.y += delta * 0.2;
                    crystal.scale.z += delta * 0.2;
                    
                    // Fade out near end of life
                    if (crystal.material.opacity > 0.1) {
                        crystal.material.opacity -= delta * 0.2;
                    }
                }
            });
        }
        
        // Check for enemies in blizzard area and apply damage and slow
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        
        enemies.forEach(enemy => {
            const horizontalDistance = new THREE.Vector2(
                enemy.position.x - this.blizzardCenter.x,
                enemy.position.z - this.blizzardCenter.z
            ).length();
            
            if (horizontalDistance <= this.radius) {
                // Apply damage
                enemy.takeDamage(this.damage * delta / 2); // Divide by 2 for balanced DPS
                
                // Apply slow effect
                if (!enemy.slowed) {
                    enemy.slowed = true;
                    enemy.originalSpeed = enemy.speed;
                    enemy.speed *= (1 - this.slowAmount);
                    
                    // Create slow indicator
                    const snowflakeGeometry = new THREE.CircleGeometry(0.2, 6);
                    const snowflakeMaterial = new THREE.MeshBasicMaterial({
                        color: 0x88ccff,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    const snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
                    snowflake.position.copy(enemy.position);
                    snowflake.position.y += 2;
                    snowflake.rotation.x = -Math.PI / 2;
                    this.scene.add(snowflake);
                    
                    // Store reference on enemy
                    enemy.slowIndicator = snowflake;
                }
                
                // Update slow indicator position
                if (enemy.slowIndicator) {
                    enemy.slowIndicator.position.copy(enemy.position);
                    enemy.slowIndicator.position.y += 2;
                    enemy.slowIndicator.rotation.z += delta * 2;
                }
                
                // Create frost particles on enemy
                if (Math.random() < 0.1) {
                    const position = enemy.position.clone();
                    position.y += 1;
                    
                    const particle = this.createParticle(
                        position,
                        0x88ccff, // Light blue
                        0.05 + Math.random() * 0.05,
                        0.3 + Math.random() * 0.5
                    );
                    
                    // Add slight upward velocity
                    particle.velocity.y = 0.5 + Math.random() * 1;
                    particle.velocity.x = (Math.random() - 0.5) * 0.5;
                    particle.velocity.z = (Math.random() - 0.5) * 0.5;
                }
            } else if (enemy.slowed && enemy.slowIndicator && 
                      enemy.slowIndicator.userData.fromBlizzard) {
                // Remove slow effect when enemy leaves radius
                enemy.speed = enemy.originalSpeed;
                enemy.slowed = false;
                
                // Remove slow indicator
                this.scene.remove(enemy.slowIndicator);
                enemy.slowIndicator.geometry.dispose();
                enemy.slowIndicator.material.dispose();
                enemy.slowIndicator = null;
            }
        });
    }
}