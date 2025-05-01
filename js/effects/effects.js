import * as THREE from 'three';
import ParticleSystem from './particle-system.js';

class Effects {
    constructor(scene) {
        this.scene = scene;
        this.effects = new Map();
        this.fallbackTextures = new Map(); // Cache for fallback textures
    }
    
    // Create a simple circular texture as a fallback
    createFallbackTexture(color = 0xffffff) {
        // Check if we already have a fallback texture for this color
        const colorKey = color.toString(16);
        if (this.fallbackTextures.has(colorKey)) {
            return this.fallbackTextures.get(colorKey);
        }
        
        // Create a canvas to draw the particle
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        
        // Convert hex color to RGB
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Draw a radial gradient
        const gradient = context.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, size, size);
        
        // Create a texture from the canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Cache the texture
        this.fallbackTextures.set(colorKey, texture);
        
        return texture;
    }

    createEffect(type, position, options = {}) {
        // Create a fallback texture in case the image file is missing
        const fallbackTexture = this.createFallbackTexture(options.color || 0xffffff);
        
        // Try to load the texture, but use fallback if it fails
        let texture;
        try {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.crossOrigin = '';
            
            // Set up error handling for texture loading
            texture = fallbackTexture;
            textureLoader.load(
                `./assets/textures/particles/${type}.png`,
                (loadedTexture) => {
                    // Success - update the texture if particles still exist
                    texture = loadedTexture;
                },
                undefined, // Progress callback
                (error) => {
                    console.warn(`Failed to load texture for ${type}, using fallback`, error);
                    // Keep using the fallback texture
                }
            );
        } catch (error) {
            console.warn(`Error creating texture for ${type}, using fallback`, error);
            texture = fallbackTexture;
        }
        
        const particles = new ParticleSystem(this.scene, {
            maxParticles: options.maxParticles || 100,
            particleSize: options.particleSize || 0.1,
            texture: texture,
            blending: THREE.AdditiveBlending
        });

        // Set initial positions and colors
        for (let i = 0; i < particles.options.maxParticles; i++) {
            const pos = position.clone();
            pos.x += (Math.random() - 0.5) * 0.5;
            pos.y += (Math.random() - 0.5) * 0.5;
            pos.z += (Math.random() - 0.5) * 0.5;
            particles.setParticlePosition(i, pos);

            const color = new THREE.Color();
            switch (type) {
                case 'fire':
                    color.setHSL(0.1, 1, 0.5 + Math.random() * 0.5);
                    break;
                case 'smoke':
                    const gray = 0.3 + Math.random() * 0.7;
                    color.setRGB(gray, gray, gray);
                    break;
                case 'explosion':
                    color.setHSL(0.1, 1, 0.9);
                    break;
                default:
                    color.setRGB(1, 1, 1);
            }
            particles.setParticleColor(i, color);
        }

        this.effects.set(particles, Date.now());
        return particles;
    }

    createFireEffect(position, options = {}) {
        return this.createEffect('fire', position, options);
    }

    createSmokeEffect(position, options = {}) {
        return this.createEffect('smoke', position, options);
    }

    createExplosionEffect(position, options = {}) {
        return this.createEffect('explosion', position, options);
    }

    update() {
        const now = Date.now();
        for (const [effect, startTime] of this.effects) {
            if (now - startTime > 2000) { // Remove effects after 2 seconds
                effect.dispose();
                this.effects.delete(effect);
            }
        }
    }

    dispose() {
        for (const [effect] of this.effects) {
            effect.dispose();
        }
        this.effects.clear();
    }
}

class FireEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('./assets/textures/particles/fire.png');
        
        super(scene, {
            maxParticles: options.maxParticles || 200,
            particleSize: options.particleSize || 0.3,
            spawnRate: options.spawnRate || 50,
            lifetime: options.lifetime || 1,
            gravity: new THREE.Vector3(0, 2, 0),
            startColor: new THREE.Color(1, 0.5, 0),
            endColor: new THREE.Color(0.5, 0, 0),
            startOpacity: 1,
            endOpacity: 0,
            startScale: 1,
            endScale: 0.1,
            blending: THREE.AdditiveBlending,
            texture: texture,
            emitterShape: 'sphere',
            emitterSize: new THREE.Vector3(0.5, 0, 0.5),
            velocityFunction: () => {
                return new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    2 + Math.random() * 2,
                    (Math.random() - 0.5) * 2
                );
            }
        });

        this.position = position;
    }

    update(delta) {
        super.update(delta);
        this.particlesMesh.position.copy(this.position);
    }
}

class SmokeEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('./assets/textures/particles/smoke.png');
        
        super(scene, {
            maxParticles: options.maxParticles || 100,
            particleSize: options.particleSize || 0.5,
            spawnRate: options.spawnRate || 20,
            lifetime: options.lifetime || 3,
            gravity: new THREE.Vector3(0, 0.5, 0),
            startColor: new THREE.Color(0.2, 0.2, 0.2),
            endColor: new THREE.Color(0.1, 0.1, 0.1),
            startOpacity: 0.5,
            endOpacity: 0,
            startScale: 1,
            endScale: 2,
            blending: THREE.NormalBlending,
            texture: texture,
            emitterShape: 'sphere',
            emitterSize: new THREE.Vector3(0.2, 0, 0.2),
            velocityFunction: () => {
                return new THREE.Vector3(
                    (Math.random() - 0.5),
                    1 + Math.random(),
                    (Math.random() - 0.5)
                );
            }
        });

        this.position = position;
    }

    update(delta) {
        super.update(delta);
        this.particlesMesh.position.copy(this.position);
    }
}

class BloodEffect extends ParticleSystem {
    constructor(scene, position, direction, options = {}) {
        const texture = new THREE.TextureLoader().load('./assets/textures/particles/blood.png');
        
        super(scene, {
            maxParticles: options.maxParticles || 50,
            particleSize: options.particleSize || 0.1,
            spawnRate: options.spawnRate || 100,
            lifetime: options.lifetime || 1,
            gravity: new THREE.Vector3(0, -9.8, 0),
            startColor: new THREE.Color(0.8, 0, 0),
            endColor: new THREE.Color(0.3, 0, 0),
            startOpacity: 1,
            endOpacity: 0,
            startScale: 1,
            endScale: 0.5,
            blending: THREE.NormalBlending,
            texture: texture,
            emitterShape: 'sphere',
            emitterSize: new THREE.Vector3(0.1, 0.1, 0.1),
            velocityFunction: () => {
                const spread = 0.5;
                return direction.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * spread,
                    (Math.random() - 0.5) * spread,
                    (Math.random() - 0.5) * spread
                )).multiplyScalar(5 + Math.random() * 5);
            }
        });

        this.particlesMesh.position.copy(position);
        this.spawnParticles(50);
        this.stop(); // Stop after initial burst
    }
}

class RainEffect extends ParticleSystem {
    constructor(scene, camera, options = {}) {
        const texture = new THREE.TextureLoader().load('./assets/textures/particles/raindrop.png');
        
        super(scene, {
            maxParticles: options.maxParticles || 1000,
            particleSize: options.particleSize || 0.1,
            spawnRate: options.spawnRate || 200,
            lifetime: options.lifetime || 2,
            gravity: new THREE.Vector3(0, -9.8, 0),
            startColor: new THREE.Color(0.7, 0.7, 1),
            endColor: new THREE.Color(0.7, 0.7, 1),
            startOpacity: 0.4,
            endOpacity: 0.2,
            startScale: 1,
            endScale: 0.8,
            blending: THREE.NormalBlending,
            texture: texture,
            emitterShape: 'box',
            emitterSize: new THREE.Vector3(100, 0, 100),
            velocityFunction: () => {
                return new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    -15,
                    (Math.random() - 0.5) * 2
                );
            }
        });

        this.camera = camera;
    }

    update(delta) {
        // Move emitter to follow camera
        this.particlesMesh.position.copy(this.camera.position);
        this.particlesMesh.position.y += 20; // Spawn above camera
        super.update(delta);
    }
}

class ExplosionEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('./assets/textures/particles/explosion.png');
        
        super(scene, {
            maxParticles: options.maxParticles || 100,
            particleSize: options.particleSize || 0.5,
            spawnRate: options.spawnRate || 200,
            lifetime: options.lifetime || 1,
            gravity: new THREE.Vector3(0, -1, 0),
            startColor: new THREE.Color(1, 0.7, 0),
            endColor: new THREE.Color(0.5, 0, 0),
            startOpacity: 1,
            endOpacity: 0,
            startScale: 1,
            endScale: 2,
            blending: THREE.AdditiveBlending,
            texture: texture,
            emitterShape: 'sphere',
            emitterSize: new THREE.Vector3(0.1, 0.1, 0.1),
            velocityFunction: () => {
                const direction = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize();
                return direction.multiplyScalar(5 + Math.random() * 5);
            }
        });

        this.particlesMesh.position.copy(position);
        this.spawnParticles(100);
        this.stop(); // Stop after initial burst

        // Create shockwave
        this.createShockwave(position);
    }

    createShockwave(position) {
        const geometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            emissive: 0xff4400,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        this.shockwave = new THREE.Mesh(geometry, material);
        this.shockwave.rotation.x = -Math.PI / 2;
        this.shockwave.position.copy(position);
        this.shockwave.position.y += 0.1;

        this.scene.add(this.shockwave);
        this.animate();
    }

    animate() {
        const duration = 0.5;
        const startScale = 0.1;
        const endScale = 5;
        const startOpacity = 1;
        const endOpacity = 0;

        const startTime = Date.now();

        const update = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            const scale = startScale + (endScale - startScale) * progress;
            const opacity = startOpacity + (endOpacity - startOpacity) * progress;

            this.shockwave.scale.set(scale, scale, 1);
            this.shockwave.material.opacity = opacity;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                this.scene.remove(this.shockwave);
                this.shockwave.geometry.dispose();
                this.shockwave.material.dispose();
            }
        };

        update();
    }
}

class WaterSplashEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('./assets/textures/particles/water.png');
        
        super(scene, {
            maxParticles: options.maxParticles || 50,
            particleSize: options.particleSize || 0.2,
            spawnRate: options.spawnRate || 100,
            lifetime: options.lifetime || 1,
            gravity: new THREE.Vector3(0, -9.8, 0),
            startColor: new THREE.Color(0.7, 0.8, 1),
            endColor: new THREE.Color(0.7, 0.8, 1),
            startOpacity: 0.8,
            endOpacity: 0,
            startScale: 1,
            endScale: 0.5,
            blending: THREE.NormalBlending,
            texture: texture,
            emitterShape: 'sphere',
            emitterSize: new THREE.Vector3(0.1, 0, 0.1),
            velocityFunction: () => {
                return new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    2 + Math.random() * 2,
                    (Math.random() - 0.5) * 4
                );
            }
        });

        this.particlesMesh.position.copy(position);
        this.spawnParticles(50);
        this.stop(); // Stop after initial burst

        // Create ripple effect
        this.createRipple(position);
    }

    createRipple(position) {
        // Create a circular mesh for the ripple
        const geometry = new THREE.CircleGeometry(0.5, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            emissive: 0x4488ff,
            emissiveIntensity: 0.3,
            shininess: 100
        });

        this.ripple = new THREE.Mesh(geometry, material);
        this.ripple.rotation.x = -Math.PI / 2;
        this.ripple.position.copy(position);
        this.ripple.position.y += 0.01; // Slightly above water surface

        this.scene.add(this.ripple);
        this.animate();
    }

    animate() {
        const duration = 1; // Duration in seconds
        const startScale = 0.5;
        const endScale = 3;
        const startOpacity = 0.5;
        const endOpacity = 0;

        const startTime = Date.now();

        const update = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            const scale = startScale + (endScale - startScale) * progress;
            const opacity = startOpacity + (endOpacity - startOpacity) * progress;

            this.ripple.scale.set(scale, scale, 1);
            this.ripple.material.opacity = opacity;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                this.scene.remove(this.ripple);
                this.ripple.geometry.dispose();
                this.ripple.material.dispose();
            }
        };

        update();
    }
}

export default Effects;
