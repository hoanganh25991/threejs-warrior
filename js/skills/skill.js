import * as THREE from 'three';
import { config } from '../config/config.js';
import RealCollisionSystem from '../combat/collision.js';
import MockCollisionSystem from '../mock/mock-collision.js';

// Determine which collision system to use
// We'll use a simple check based on the URL to determine if we're in the model viewer
let CollisionSystem;
const isModelViewer = window.location.pathname.includes('model-viewer.html');
if (isModelViewer) {
    CollisionSystem = MockCollisionSystem;
    console.log('Using mock collision system for model viewer');
} else {
    CollisionSystem = RealCollisionSystem;
    console.log('Using real collision system for game');
}

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
        this.activeEffects = [];
        this.collisionSystem = new CollisionSystem(this.scene);
        this.damageType = 'physical'; // Default damage type
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
            
            // Check for collisions with active effects
            this.checkCollisions(delta);
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
        
        // Update active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.lifetime -= delta;
            
            if (effect.lifetime <= 0) {
                this.activeEffects.splice(i, 1);
            }
        }
    }

    createEffect() {
        // Override in subclass
    }

    updateEffect(delta) {
        // Override in subclass
    }
    
    /**
     * Check for collisions between skill effects and enemies
     */
    checkCollisions(delta) {
        // Process each active effect
        for (const effect of this.activeEffects) {
            // Skip effects that have already hit their target
            if (effect.hasHit && !effect.canHitMultiple) continue;
            
            // Get effect properties
            const origin = effect.position || this.hero.group.position.clone();
            const direction = effect.direction || this.hero.direction.clone();
            
            // Check for collisions
            const hitEnemies = this.collisionSystem.checkSkillCollision(
                effect,
                origin,
                direction,
                effect.range || this.range,
                effect.radius || 1,
                effect.damage || this.damage,
                effect.damageType || this.damageType
            );
            
            // Process hits
            if (hitEnemies.length > 0) {
                effect.hasHit = true;
                
                // Call onHit handler if defined
                if (typeof effect.onHit === 'function') {
                    effect.onHit(hitEnemies);
                }
                
                // Create hit effects
                for (const hit of hitEnemies) {
                    this.createHitEffect(hit.position, hit.damage, effect.damageType || this.damageType);
                }
            }
        }
    }
    
    /**
     * Add an active effect for collision detection
     */
    addActiveEffect(effect) {
        // Set default properties if not provided
        effect.type = effect.type || 'projectile';
        effect.lifetime = effect.lifetime || this.duration || 2.0;
        effect.hasHit = false;
        effect.canHitMultiple = effect.canHitMultiple || false;
        effect.damageType = effect.damageType || this.damageType;
        
        this.activeEffects.push(effect);
        return effect;
    }
    
    /**
     * Create a hit effect at the target position
     */
    createHitEffect(position, damage, damageType) {
        // Create particles for hit effect
        const color = this.getDamageTypeColor(damageType);
        
        // Create 5-10 particles for the hit effect
        const particleCount = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createParticle(
                position.clone(),
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.3,
                {
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 5,
                        Math.random() * 5,
                        (Math.random() - 0.5) * 5
                    )
                }
            );
        }
        
        // Play hit sound if available
        if (this.hero.soundManager) {
            const soundType = damageType === 'physical' ? 'hit' : 
                             damageType === 'fire' ? 'fire-hit' : 
                             damageType === 'ice' ? 'ice-hit' : 'hit';
            this.hero.soundManager.playSound(soundType);
        }
    }
    
    /**
     * Get color based on damage type
     */
    getDamageTypeColor(damageType) {
        switch (damageType) {
            case 'fire': return 0xff4400;
            case 'ice': return 0x00ffff;
            case 'lightning': return 0xffff00;
            case 'poison': return 0x00ff00;
            case 'magic': return 0xff00ff;
            case 'physical': return 0xff0000;
            default: return 0xffffff;
        }
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
