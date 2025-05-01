import Skill from '../skill.js';
import * as THREE from 'three';

export default class GlacialBarrier extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Glacial Barrier";
        this.manaCost = 60;
        this.duration = 10.0;
        this.damageReduction = 0.6; // 60% damage reduction
        this.reflectDamage = 20; // Damage reflected to attackers
        this.slowRadius = 5; // Radius of slow effect around hero
        this.slowAmount = 0.5; // 50% slow
        this.particleCount = 40;
        this.barrierActive = false;
        this.barrierMesh = null;
        this.iceShards = [];
    }

    getCooldownDuration() {
        return 15.0;
    }

    createEffect() {
        // Create an ice barrier around the hero
        const origin = this.hero.group.position.clone();
        
        // Create barrier geometry
        const barrierGeometry = new THREE.IcosahedronGeometry(1.5, 1);
        const barrierMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.4,
            wireframe: true
        });
        
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.copy(origin);
        barrier.position.y += 1;
        this.scene.add(barrier);
        
        // Store reference
        this.barrierMesh = barrier;
        
        // Create ice shards around barrier
        for (let i = 0; i < 12; i++) {
            const phi = Math.acos(-1 + (2 * i) / 12);
            const theta = Math.sqrt(12 * Math.PI) * phi;
            
            const x = 1.5 * Math.sin(phi) * Math.cos(theta);
            const y = 1.5 * Math.sin(phi) * Math.sin(theta);
            const z = 1.5 * Math.cos(phi);
            
            const shardGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
            const shardMaterial = new THREE.MeshBasicMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.9
            });
            
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            shard.position.set(
                origin.x + x,
                origin.y + y + 1,
                origin.z + z
            );
            
            // Point shard outward
            shard.lookAt(new THREE.Vector3(
                origin.x + x * 2,
                origin.y + y * 2 + 1,
                origin.z + z * 2
            ));
            
            this.scene.add(shard);
            this.iceShards.push(shard);
        }
        
        // Create barrier particles
        for (let i = 0; i < this.particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.particleCount);
            const theta = Math.sqrt(this.particleCount * Math.PI) * phi;
            
            const x = 1.5 * Math.sin(phi) * Math.cos(theta);
            const y = 1.5 * Math.sin(phi) * Math.sin(theta);
            const z = 1.5 * Math.cos(phi);
            
            const position = new THREE.Vector3(
                origin.x + x,
                origin.y + y + 1,
                origin.z + z
            );
            
            // Create particle with ice color
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05,
                this.duration
            );
            
            // Set particle to orbit around hero
            particle.orbitRadius = 1.5;
            particle.orbitSpeed = 0.3 + Math.random() * 0.5;
            particle.orbitOffset = Math.random() * Math.PI * 2;
            particle.orbitAxis = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            // Override default particle update
            particle.update = (delta) => {
                const time = Date.now() / 1000;
                const angle = time * particle.orbitSpeed + particle.orbitOffset;
                
                // Create rotation matrix around orbit axis
                const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                    particle.orbitAxis,
                    angle
                );
                
                // Calculate new position
                const basePosition = new THREE.Vector3(
                    particle.orbitRadius, 0, 0
                );
                basePosition.applyMatrix4(rotationMatrix);
                
                // Set position relative to hero
                particle.mesh.position.copy(this.hero.group.position);
                particle.mesh.position.y += 1;
                particle.mesh.position.add(basePosition);
                
                // Fade out near end of duration
                const remainingLife = particle.life;
                if (remainingLife < 1.0) {
                    particle.mesh.material.opacity = remainingLife;
                }
            };
        }
        
        // Set barrier active
        this.barrierActive = true;
        
        // Apply damage reduction to hero
        this.hero.damageReductionMultiplier = this.damageReduction;
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-barrier');
        }
        
        // Set a timeout to remove the barrier
        setTimeout(() => {
            this.removeBarrier();
        }, this.duration * 1000);
    }
    
    removeBarrier() {
        if (!this.barrierActive) return;
        
        // Remove barrier mesh
        if (this.barrierMesh) {
            this.scene.remove(this.barrierMesh);
            this.barrierMesh.geometry.dispose();
            this.barrierMesh.material.dispose();
            this.barrierMesh = null;
        }
        
        // Remove ice shards
        this.iceShards.forEach(shard => {
            this.scene.remove(shard);
            shard.geometry.dispose();
            shard.material.dispose();
        });
        this.iceShards = [];
        
        // Reset damage reduction
        this.hero.damageReductionMultiplier = 1.0;
        
        // Set barrier inactive
        this.barrierActive = false;
        
        // Create shattering effect
        const origin = this.hero.group.position.clone();
        origin.y += 1;
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = 1.5;
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const position = new THREE.Vector3(
                origin.x + x,
                origin.y + y,
                origin.z + z
            );
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.5 + Math.random() * 0.5
            );
            
            // Add outward velocity
            const direction = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(direction.multiplyScalar(3 + Math.random() * 5));
        }
        
        // Play shatter sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-shatter');
        }
    }

    updateEffect(delta) {
        if (!this.barrierActive) return;
        
        // Update barrier position to follow hero
        if (this.barrierMesh) {
            this.barrierMesh.position.copy(this.hero.group.position);
            this.barrierMesh.position.y += 1;
            
            // Rotate barrier
            this.barrierMesh.rotation.y += delta * 0.5;
            this.barrierMesh.rotation.x += delta * 0.2;
        }
        
        // Update ice shards position
        this.iceShards.forEach((shard, index) => {
            const time = Date.now() / 1000;
            const angle = time * 0.5 + (index / this.iceShards.length) * Math.PI * 2;
            
            const phi = Math.acos(-1 + (2 * index) / this.iceShards.length);
            const theta = Math.sqrt(this.iceShards.length * Math.PI) * phi + angle;
            
            const x = 1.5 * Math.sin(phi) * Math.cos(theta);
            const y = 1.5 * Math.sin(phi) * Math.sin(theta);
            const z = 1.5 * Math.cos(phi);
            
            shard.position.set(
                this.hero.group.position.x + x,
                this.hero.group.position.y + y + 1,
                this.hero.group.position.z + z
            );
            
            // Point shard outward
            shard.lookAt(new THREE.Vector3(
                this.hero.group.position.x + x * 2,
                this.hero.group.position.y + y * 2 + 1,
                this.hero.group.position.z + z * 2
            ));
        });
        
        // Check for enemies in slow radius and apply slow effect
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= this.slowRadius) {
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
                
                // Create occasional frost particles around slowed enemy
                if (Math.random() < 0.05) {
                    const position = enemy.position.clone();
                    position.y += Math.random() * 2;
                    
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
            } else if (enemy.slowed) {
                // Remove slow effect when enemy leaves radius
                enemy.speed = enemy.originalSpeed;
                enemy.slowed = false;
                
                // Remove slow indicator
                if (enemy.slowIndicator) {
                    this.scene.remove(enemy.slowIndicator);
                    enemy.slowIndicator.geometry.dispose();
                    enemy.slowIndicator.material.dispose();
                    enemy.slowIndicator = null;
                }
            }
        });
        
        // Check for enemies hitting barrier and apply reflect damage
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= 2.0) { // Close enough to hit barrier
                // Apply reflect damage
                enemy.takeDamage(this.reflectDamage * delta);
                
                // Create impact particles
                if (Math.random() < 0.1) {
                    const toEnemy = new THREE.Vector3().subVectors(enemy.position, origin).normalize();
                    const impactPosition = origin.clone().add(toEnemy.multiplyScalar(1.5));
                    impactPosition.y += 1;
                    
                    for (let i = 0; i < 5; i++) {
                        const particle = this.createParticle(
                            impactPosition,
                            0x88ccff, // Light blue
                            0.05 + Math.random() * 0.05,
                            0.2 + Math.random() * 0.3
                        );
                        
                        // Add outward velocity
                        particle.velocity.copy(toEnemy.clone().multiplyScalar(2 + Math.random() * 3));
                    }
                }
            }
        });
    }
}