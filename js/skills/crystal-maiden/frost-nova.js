import Skill from '../skill.js';
import * as THREE from 'three';

export default class FrostNova extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 40;
        this.damage = 60;
        this.range = 8;
        this.duration = 1.5;
        this.slowDuration = 3.0;
        this.slowAmount = 0.5; // 50% slow
    }

    getCooldownDuration() {
        return 6.0;
    }

    createEffect() {
        const origin = this.hero.group.position.clone();
        
        // Create expanding frost ring
        const segments = 32;
        const geometry = new THREE.RingGeometry(0.1, this.range, segments);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2; // Lay flat on the ground
        ring.position.copy(origin);
        
        this.scene.add(ring);
        
        // Animate ring expansion and fade
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / this.duration;
            
            if (progress < 1) {
                ring.scale.setScalar(progress);
                material.opacity = 0.5 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
            }
        };
        
        animate();

        // Create ice particles
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 * i) / 100;
            const radius = Math.random() * this.range;
            
            const position = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y,
                origin.z + Math.sin(angle) * radius
            );

            const particle = this.createParticle(
                position,
                0x00ffff, // Cyan color
                0.1,      // Size
                1.0       // Life
            );

            // Add upward velocity
            particle.velocity.y = 2 + Math.random() * 2;
        }

        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('frost-nova');
        }
    }

    updateEffect(delta) {
        // Find all enemies in range
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;

        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= this.range) {
                // Apply damage
                enemy.takeDamage(this.damage * delta);
                
                // Apply slow effect
                if (!enemy.slowed) {
                    enemy.slowed = true;
                    enemy.originalSpeed = enemy.speed;
                    enemy.speed *= (1 - this.slowAmount);
                    
                    // Reset speed after slow duration
                    setTimeout(() => {
                        if (enemy.slowed) {
                            enemy.speed = enemy.originalSpeed;
                            enemy.slowed = false;
                        }
                    }, this.slowDuration * 1000);
                }

                // Create frost particles on enemy
                this.createParticle(
                    enemy.position.clone(),
                    0x00ffff, // Cyan color
                    0.2,      // Size
                    0.5       // Life
                );
            }
        });
    }
}
