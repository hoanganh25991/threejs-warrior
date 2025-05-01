import Skill from '../skill.js';
import * as THREE from 'three';

export default class DragonRush extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Dragon Rush";
        this.manaCost = 50;
        this.damage = 80;
        this.range = 15;
        this.speed = 20; // Units per second
        this.duration = 0.75;
        this.particleCount = 30;
        this.isRushing = false;
        this.startPosition = null;
        this.targetPosition = null;
        this.rushStartTime = 0;
    }

    getCooldownDuration() {
        return 8.0;
    }

    createEffect() {
        // Store current position
        this.startPosition = this.hero.group.position.clone();
        
        // Calculate target position
        const direction = this.hero.direction.clone();
        this.targetPosition = this.startPosition.clone().add(
            direction.multiplyScalar(this.range)
        );
        
        // Start rushing
        this.isRushing = true;
        this.rushStartTime = Date.now();
        
        // Create initial rush effect
        const trailGeometry = new THREE.BoxGeometry(0.5, 1, this.range);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.3
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        
        // Position trail behind hero in the direction of travel
        trail.position.copy(this.startPosition);
        trail.position.y += 1;
        trail.position.add(direction.clone().multiplyScalar(this.range / 2));
        
        // Rotate to align with direction
        trail.rotation.y = Math.atan2(direction.x, direction.z);
        
        this.scene.add(trail);
        this.trail = trail;
        
        // Create initial particles
        for (let i = 0; i < this.particleCount; i++) {
            const t = i / this.particleCount;
            const position = new THREE.Vector3().lerpVectors(
                this.startPosition,
                this.targetPosition,
                t
            );
            position.y += 0.5 + Math.random() * 1.5;
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                position,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.7
            );
            
            // Add random velocity
            particle.velocity.set(
                (Math.random() - 0.5) * 2,
                1 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            );
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('dragon-rush');
        }
    }

    updateEffect(delta) {
        if (!this.isRushing) return;
        
        const now = Date.now();
        const elapsed = (now - this.rushStartTime) / 1000;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // Update hero position
        if (progress < 1) {
            // Calculate new position
            const newPosition = new THREE.Vector3().lerpVectors(
                this.startPosition,
                this.targetPosition,
                progress
            );
            
            // Set hero position
            this.hero.group.position.copy(newPosition);
            
            // Create trail particles
            if (Math.random() < 0.3) {
                const position = this.hero.group.position.clone();
                position.y += 0.5 + Math.random() * 1.5;
                
                // Create particle with fire color
                const hue = 0.05 + Math.random() * 0.05;
                const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                
                const particle = this.createParticle(
                    position,
                    color,
                    0.1 + Math.random() * 0.2,
                    0.3 + Math.random() * 0.7
                );
                
                // Add random velocity
                particle.velocity.set(
                    (Math.random() - 0.5) * 2,
                    1 + Math.random() * 2,
                    (Math.random() - 0.5) * 2
                );
            }
            
            // Check for enemies in path and apply damage
            const enemies = this.scene.getObjectsByProperty('type', 'enemy');
            const heroRadius = 1.5;
            
            enemies.forEach(enemy => {
                const distance = enemy.position.distanceTo(this.hero.group.position);
                
                if (distance <= heroRadius) {
                    // Apply damage
                    enemy.takeDamage(this.damage * delta);
                    
                    // Apply knockback
                    if (enemy.applyKnockback) {
                        const knockbackDirection = this.hero.direction.clone();
                        enemy.applyKnockback(knockbackDirection, 10);
                    }
                    
                    // Create impact particles
                    const position = enemy.position.clone();
                    position.y += 1;
                    
                    for (let i = 0; i < 10; i++) {
                        const hue = 0.05 + Math.random() * 0.05;
                        const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                        
                        const particle = this.createParticle(
                            position,
                            color,
                            0.1 + Math.random() * 0.1,
                            0.3 + Math.random() * 0.5
                        );
                        
                        // Add outward velocity
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 3 + Math.random() * 5;
                        
                        particle.velocity.set(
                            Math.cos(angle) * speed,
                            1 + Math.random() * 3,
                            Math.sin(angle) * speed
                        );
                    }
                }
            });
        } else {
            // End rush
            this.isRushing = false;
            
            // Remove trail
            if (this.trail) {
                this.scene.remove(this.trail);
                this.trail.geometry.dispose();
                this.trail.material.dispose();
                this.trail = null;
            }
            
            // Create final impact effect
            const impactGeometry = new THREE.SphereGeometry(2, 16, 16);
            const impactMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.5
            });
            
            const impact = new THREE.Mesh(impactGeometry, impactMaterial);
            impact.position.copy(this.hero.group.position);
            impact.position.y += 1;
            this.scene.add(impact);
            
            // Animate impact
            const startTime = Date.now();
            const animateImpact = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = elapsed / 0.5; // 0.5 second animation
                
                if (progress < 1) {
                    const scale = 1 + progress * 2;
                    impact.scale.set(scale, scale, scale);
                    impact.material.opacity = 0.5 * (1 - progress);
                    requestAnimationFrame(animateImpact);
                } else {
                    this.scene.remove(impact);
                    impact.geometry.dispose();
                    impact.material.dispose();
                }
            };
            
            animateImpact();
            
            // Create impact particles
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 2;
                
                const position = new THREE.Vector3(
                    this.hero.group.position.x + Math.cos(angle) * radius,
                    this.hero.group.position.y + Math.random() * 2,
                    this.hero.group.position.z + Math.sin(angle) * radius
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
                
                // Add outward and upward velocity
                const outDirection = new THREE.Vector3(
                    Math.cos(angle),
                    0,
                    Math.sin(angle)
                );
                
                particle.velocity.copy(outDirection.multiplyScalar(3 + Math.random() * 5));
                particle.velocity.y = 2 + Math.random() * 4;
            }
        }
    }
}