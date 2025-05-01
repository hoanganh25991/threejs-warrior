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

    createParticle(position, color = 0xffffff, size = 0.1, life = 1.0, options = {}) {
        // Choose a more complex geometry for particles
        let geometry;
        const particleType = options.type || Math.floor(Math.random() * 5);
        
        switch (particleType) {
            case 0: // Sphere (default)
                geometry = new THREE.SphereGeometry(size, 8, 8);
                break;
            case 1: // Tetrahedron
                geometry = new THREE.TetrahedronGeometry(size * 1.2);
                break;
            case 2: // Octahedron
                geometry = new THREE.OctahedronGeometry(size);
                break;
            case 3: // Icosahedron
                geometry = new THREE.IcosahedronGeometry(size * 0.8);
                break;
            case 4: // Custom shape (flattened sphere)
                geometry = new THREE.SphereGeometry(size * 1.5, 8, 4);
                geometry.scale(1, 0.4, 1);
                break;
            default:
                geometry = new THREE.SphereGeometry(size, 8, 8);
        }
        
        // Create a more advanced material
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            shininess: 80,
            transparent: true,
            opacity: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Add random rotation
        mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        // Add a point light for glowing effect if specified
        if (options.addLight) {
            const light = new THREE.PointLight(color, 0.5, 2);
            light.position.copy(position);
            mesh.add(light);
            mesh.light = light;
        }

        this.scene.add(mesh);
        
        const particle = {
            mesh,
            life,
            initialLife: life,
            velocity: options.velocity || new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            ),
            size: size,
            initialSize: size,
            color: new THREE.Color(color)
        };

        this.particles.push(particle);
        return particle;
    }

    updateParticle(particle, delta) {
        // Update position
        particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));
        
        // Apply gravity if not specified otherwise
        if (!particle.noGravity) {
            particle.velocity.y -= 9.8 * delta;
        }
        
        // Update rotation for more dynamic movement
        if (particle.rotationSpeed) {
            particle.mesh.rotation.x += particle.rotationSpeed.x * delta;
            particle.mesh.rotation.y += particle.rotationSpeed.y * delta;
            particle.mesh.rotation.z += particle.rotationSpeed.z * delta;
        }
        
        // Calculate life percentage
        const lifePercent = particle.life / particle.initialLife;
        
        // Update opacity based on life
        particle.mesh.material.opacity = lifePercent * 0.9;
        
        // Update size - shrink as it gets older
        if (particle.initialSize) {
            const newSize = particle.initialSize * (0.5 + lifePercent * 0.5);
            particle.mesh.scale.set(newSize, newSize, newSize);
        }
        
        // Update emissive intensity
        if (particle.mesh.material.emissiveIntensity !== undefined) {
            particle.mesh.material.emissiveIntensity = lifePercent * 0.5;
            particle.mesh.material.needsUpdate = true;
        }
        
        // Update light intensity if present
        if (particle.mesh.light) {
            particle.mesh.light.intensity = lifePercent * 0.5;
        }
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
