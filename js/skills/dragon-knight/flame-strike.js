import Skill from '../skill.js';
import * as THREE from 'three';

export default class FlameStrike extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Flame Strike";
        this.manaCost = 40;
        this.damage = 80;
        this.range = 8;
        this.duration = 2.0;
        this.width = 4;
        this.height = 6;
        this.particleCount = 100;
        this.particleSystem = null;
    }

    getCooldownDuration() {
        return 6.0;
    }

    createEffect() {
        // Create a flame pillar at target location
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        const targetPosition = origin.clone().add(direction.clone().multiplyScalar(this.range));
        
        // Create flame pillar geometry
        const pillarGeometry = new THREE.CylinderGeometry(this.width/2, this.width/2, this.height, 16);
        const pillarMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.copy(targetPosition);
        pillar.position.y += this.height / 2;
        this.scene.add(pillar);
        
        // Store reference to remove later
        this.pillar = pillar;
        
        // Create flame particles
        for (let i = 0; i < this.particleCount; i++) {
            const height = Math.random() * this.height;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (this.width/2);
            
            const position = new THREE.Vector3(
                targetPosition.x + Math.cos(angle) * radius,
                height,
                targetPosition.z + Math.sin(angle) * radius
            );
            
            // Create particle with flame color (random between yellow and red)
            const hue = 0.05 + Math.random() * 0.05; // Between orange-red and yellow
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                position,
                color,
                0.2 + Math.random() * 0.3,
                0.5 + Math.random() * 1.5
            );
            
            // Add upward velocity
            particle.velocity.y = 2 + Math.random() * 4;
            particle.velocity.x = (Math.random() - 0.5) * 2;
            particle.velocity.z = (Math.random() - 0.5) * 2;
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('flame-strike');
        }
        
        // Set a timeout to remove the pillar
        setTimeout(() => {
            if (this.pillar) {
                this.scene.remove(this.pillar);
                this.pillar.geometry.dispose();
                this.pillar.material.dispose();
                this.pillar = null;
            }
        }, this.duration * 1000);
    }

    updateEffect(delta) {
        // Check for enemies in the pillar area and apply damage
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        const direction = this.hero.direction;
        const targetPosition = origin.clone().add(direction.clone().multiplyScalar(this.range));
        
        enemies.forEach(enemy => {
            const horizontalDistance = new THREE.Vector2(
                enemy.position.x - targetPosition.x,
                enemy.position.z - targetPosition.z
            ).length();
            
            if (horizontalDistance <= this.width/2 && enemy.position.y <= this.height) {
                // Apply damage
                enemy.takeDamage(this.damage * delta);
                
                // Apply burning effect
                if (!enemy.burning) {
                    enemy.burning = true;
                    enemy.burnDamage = this.damage * 0.2; // 20% of original damage per second
                    enemy.burnDuration = 3.0; // 3 seconds
                    
                    // Reset burn after duration
                    setTimeout(() => {
                        if (enemy.burning) {
                            enemy.burning = false;
                        }
                    }, enemy.burnDuration * 1000);
                }
                
                // Create fire particles on enemy
                const position = enemy.position.clone();
                position.y += 1; // Adjust to be at character height
                
                const hue = 0.05 + Math.random() * 0.05;
                const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                
                this.createParticle(
                    position,
                    color,
                    0.2,
                    0.5
                );
            }
        });
    }
}