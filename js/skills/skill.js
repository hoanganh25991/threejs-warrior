import * as THREE from 'three';
import { config } from '../config/config.js';

export default class Skill {
    constructor(hero) {
        this.hero = hero;
        this.scene = hero.scene;
        this.cooldown = 0;
        this.isActive = false;
        this.manaCost = 0;
        this.damage = 0;
        this.range = 0;
        this.duration = 0;
        this.particles = [];
    }

    canUse() {
        return this.cooldown <= 0 && this.hero.mana >= this.manaCost;
    }

    activate() {
        if (!this.canUse()) return false;

        this.isActive = true;
        this.cooldown = this.getCooldownDuration();
        this.hero.mana -= this.manaCost;
        this.createEffect();
        
        return true;
    }

    update(delta) {
        if (this.cooldown > 0) {
            this.cooldown -= delta;
        }

        if (this.isActive) {
            this.updateEffect(delta);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= delta;
            
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
            } else {
                this.updateParticle(particle, delta);
            }
        }
    }

    createEffect() {
        // Override in subclass
    }

    updateEffect(delta) {
        // Override in subclass
    }

    createParticle(position, color = 0xffffff, size = 0.1, life = 1.0) {
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);

        this.scene.add(mesh);
        
        const particle = {
            mesh,
            life,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            )
        };

        this.particles.push(particle);
        return particle;
    }

    updateParticle(particle, delta) {
        particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));
        particle.velocity.y -= 9.8 * delta; // Apply gravity
        particle.mesh.material.opacity = particle.life;
    }

    getCooldownDuration() {
        // Override in subclass
        return 1.0;
    }

    cleanup() {
        // Remove all particles
        this.particles.forEach(particle => {
            this.scene.remove(particle.mesh);
        });
        this.particles = [];
    }
}
