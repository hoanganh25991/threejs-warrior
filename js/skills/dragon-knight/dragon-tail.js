import Skill from '../skill.js';
import * as THREE from 'three';

export default class DragonTail extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Dragon Tail";
        this.manaCost = 60;
        this.damage = 120;
        this.range = 3;
        this.duration = 1.0;
        this.stunDuration = 2.0;
        this.particleCount = 30;
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Create a stunning tail swipe effect
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        
        // Create arc geometry for the tail swipe
        const arcGeometry = new THREE.TorusGeometry(this.range, 0.3, 8, 16, Math.PI);
        const arcMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const arc = new THREE.Mesh(arcGeometry, arcMaterial);
        arc.position.copy(origin);
        arc.position.y += 0.5;
        arc.rotation.x = Math.PI / 2;
        arc.rotation.y = Math.atan2(direction.x, direction.z);
        this.scene.add(arc);
        
        // Store reference to remove later
        this.arc = arc;
        
        // Create impact particles
        for (let i = 0; i < this.particleCount; i++) {
            const angle = (Math.random() - 0.5) * Math.PI + Math.atan2(direction.x, direction.z);
            const radius = Math.random() * this.range;
            
            const position = new THREE.Vector3(
                origin.x + Math.sin(angle) * radius,
                origin.y + 0.5,
                origin.z + Math.cos(angle) * radius
            );
            
            // Create particle with orange-yellow color
            const hue = 0.08 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                position,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.7
            );
            
            // Add outward velocity
            const outDirection = new THREE.Vector3(
                position.x - origin.x,
                0,
                position.z - origin.z
            ).normalize();
            
            particle.velocity.copy(outDirection.multiplyScalar(3 + Math.random() * 5));
            particle.velocity.y = 1 + Math.random() * 2;
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('dragon-tail');
        }
        
        // Set a timeout to remove the arc
        setTimeout(() => {
            if (this.arc) {
                this.scene.remove(this.arc);
                this.arc.geometry.dispose();
                this.arc.material.dispose();
                this.arc = null;
            }
        }, this.duration * 1000);
    }

    updateEffect(delta) {
        // Check for enemies in the arc area and apply damage and stun
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        const direction = this.hero.direction;
        
        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            if (distance <= this.range) {
                // Check if enemy is in the arc (in front of hero)
                const angle = Math.abs(toEnemy.angleTo(direction));
                
                if (angle <= Math.PI / 2) { // Within 90 degrees in front
                    // Apply damage
                    enemy.takeDamage(this.damage);
                    
                    // Apply stun effect
                    if (!enemy.stunned) {
                        enemy.stunned = true;
                        enemy.originalSpeed = enemy.speed;
                        enemy.speed = 0;
                        
                        // Create stun indicator
                        const stunGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                        const stunMaterial = new THREE.MeshBasicMaterial({
                            color: 0xffff00,
                            transparent: true,
                            opacity: 0.7
                        });
                        
                        const stunIndicator = new THREE.Mesh(stunGeometry, stunMaterial);
                        stunIndicator.position.copy(enemy.position);
                        stunIndicator.position.y += 2;
                        this.scene.add(stunIndicator);
                        
                        // Reset stun after duration
                        setTimeout(() => {
                            if (enemy.stunned) {
                                enemy.speed = enemy.originalSpeed;
                                enemy.stunned = false;
                            }
                            this.scene.remove(stunIndicator);
                            stunGeometry.dispose();
                            stunMaterial.dispose();
                        }, this.stunDuration * 1000);
                    }
                }
            }
        });
    }
}