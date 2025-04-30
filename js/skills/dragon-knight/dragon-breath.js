import Skill from '../skill.js';
import * as THREE from 'three';

export default class DragonBreath extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 50;
        this.damage = 100;
        this.range = 10;
        this.duration = 2.0;
        this.width = 3;
        this.particleCount = 50;
        this.particleSystem = null;
    }

    getCooldownDuration() {
        return 8.0;
    }

    createEffect() {
        // Create cone of fire particles
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        
        // Create particle system
        for (let i = 0; i < this.particleCount; i++) {
            const angle = (Math.random() - 0.5) * this.width;
            const particleDir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            const position = origin.clone().add(
                particleDir.clone().multiplyScalar(Math.random() * 2)
            );

            const particle = this.createParticle(
                position,
                0xff4400,  // Orange-red color
                0.2,       // Size
                Math.random() * this.duration
            );

            // Add forward velocity in cone shape
            particle.velocity.copy(particleDir)
                .multiplyScalar(10 + Math.random() * 5);
        }

        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('dragon-breath');
        }
    }

    updateEffect(delta) {
        // Check for enemies in the cone and apply damage
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        const direction = this.hero.direction;

        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            if (distance <= this.range) {
                const angle = toEnemy.angleTo(direction);
                if (angle <= this.width / 2) {
                    // Apply damage based on distance (more damage closer)
                    const damageMultiplier = 1 - (distance / this.range);
                    const damage = this.damage * damageMultiplier * delta;
                    enemy.takeDamage(damage);

                    // Create hit effect on enemy
                    this.createParticle(
                        enemy.position.clone(),
                        0xff0000,  // Red color
                        0.3,       // Size
                        0.5        // Life
                    );
                }
            }
        });
    }
}
