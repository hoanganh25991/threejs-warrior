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
        this.damageType = 'fire';
        this.damageInterval = 0.2; // Apply damage every 0.2 seconds
        this.damageTimer = 0;
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
        
        // Add an active effect for collision detection
        this.addActiveEffect({
            type: 'cone',
            position: this.hero.group.position.clone(),
            direction: this.hero.direction.clone(),
            range: this.range,
            width: this.width,
            damage: this.damage,
            damageType: this.damageType,
            lifetime: this.duration,
            canHitMultiple: true, // Can hit multiple enemies
            onHit: (hitEnemies) => {
                // Additional effects on hit (if needed)
                console.log(`Dragon Breath hit ${hitEnemies.length} enemies`);
            }
        });
        
        // Reset damage timer
        this.damageTimer = 0;
    }

    updateEffect(delta) {
        // Update the active effect position and direction to follow the player
        if (this.activeEffects.length > 0) {
            const effect = this.activeEffects[0];
            effect.position = this.hero.group.position.clone();
            effect.direction = this.hero.direction.clone();
        }
        
        // Update damage timer
        this.damageTimer += delta;
        
        // Apply damage at intervals
        if (this.damageTimer >= this.damageInterval) {
            this.damageTimer = 0;
            
            // Create additional fire particles in the cone
            this.createAdditionalParticles();
        }
    }
    
    createAdditionalParticles() {
        // Create additional particles for continuous effect
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        
        // Create fewer particles for the continuous effect
        const particleCount = Math.floor(this.particleCount / 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.random() - 0.5) * this.width;
            const particleDir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            // Calculate distance along the cone
            const distance = Math.random() * this.range;
            
            // Calculate position
            const position = origin.clone().add(
                particleDir.clone().multiplyScalar(distance)
            );
            
            // Create particle
            const particle = this.createParticle(
                position,
                0xff4400,  // Orange-red color
                0.2,       // Size
                0.5 + Math.random() * 0.5 // Shorter life for continuous particles
            );
            
            // Add some velocity
            particle.velocity.copy(particleDir)
                .multiplyScalar(5 + Math.random() * 3);
        }
    }
}
