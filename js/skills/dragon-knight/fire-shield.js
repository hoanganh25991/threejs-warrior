import Skill from '../skill.js';
import * as THREE from 'three';

export default class FireShield extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Fire Shield";
        this.manaCost = 70;
        this.duration = 8.0;
        this.damageReduction = 0.5; // 50% damage reduction
        this.reflectDamage = 30; // Damage reflected to attackers
        this.particleCount = 40;
        this.shieldActive = false;
        this.shieldMesh = null;
    }

    getCooldownDuration() {
        return 15.0;
    }

    createEffect() {
        // Create a fire shield around the hero
        const origin = this.hero.group.position.clone();
        
        // Create shield geometry
        const shieldGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.copy(origin);
        shield.position.y += 1;
        this.scene.add(shield);
        
        // Store reference
        this.shieldMesh = shield;
        
        // Create shield particles
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
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                position,
                color,
                0.1 + Math.random() * 0.1,
                this.duration
            );
            
            // Set particle to orbit around hero
            particle.orbitRadius = 1.5;
            particle.orbitSpeed = 0.5 + Math.random() * 1;
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
        
        // Set shield active
        this.shieldActive = true;
        
        // Apply damage reduction to hero
        this.hero.damageReductionMultiplier = this.damageReduction;
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('fire-shield');
        }
        
        // Set a timeout to remove the shield
        setTimeout(() => {
            this.removeShield();
        }, this.duration * 1000);
    }
    
    removeShield() {
        if (!this.shieldActive) return;
        
        // Remove shield mesh
        if (this.shieldMesh) {
            this.scene.remove(this.shieldMesh);
            this.shieldMesh.geometry.dispose();
            this.shieldMesh.material.dispose();
            this.shieldMesh = null;
        }
        
        // Reset damage reduction
        this.hero.damageReductionMultiplier = 1.0;
        
        // Set shield inactive
        this.shieldActive = false;
    }

    updateEffect(delta) {
        if (!this.shieldActive) return;
        
        // Update shield position to follow hero
        if (this.shieldMesh) {
            this.shieldMesh.position.copy(this.hero.group.position);
            this.shieldMesh.position.y += 1;
            
            // Pulse effect
            const scale = 1 + 0.1 * Math.sin(Date.now() / 300);
            this.shieldMesh.scale.set(scale, scale, scale);
        }
        
        // Check for enemies in shield range and apply reflect damage
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= 2.0) { // Close enough to be hit by shield
                // Apply reflect damage
                enemy.takeDamage(this.reflectDamage * delta);
                
                // Create fire particles on enemy
                if (Math.random() < 0.1) {
                    const position = enemy.position.clone();
                    position.y += 1;
                    
                    const hue = 0.05 + Math.random() * 0.05;
                    const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                    
                    const particle = this.createParticle(
                        position,
                        color,
                        0.1 + Math.random() * 0.1,
                        0.3 + Math.random() * 0.5
                    );
                    
                    // Add random velocity
                    particle.velocity.set(
                        (Math.random() - 0.5) * 2,
                        1 + Math.random() * 2,
                        (Math.random() - 0.5) * 2
                    );
                }
            }
        });
    }
}