import * as THREE from 'three';
import ParticleSystem from './particle-system.js';

export class FireEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('/assets/textures/particles/fire.png');
        
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

export class SmokeEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('/assets/textures/particles/smoke.png');
        
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

export class BloodEffect extends ParticleSystem {
    constructor(scene, position, direction, options = {}) {
        const texture = new THREE.TextureLoader().load('/assets/textures/particles/blood.png');
        
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

export class RainEffect extends ParticleSystem {
    constructor(scene, camera, options = {}) {
        const texture = new THREE.TextureLoader().load('/assets/textures/particles/raindrop.png');
        
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

export class ExplosionEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('/assets/textures/particles/explosion.png');
        
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
        const material = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        // Animate shockwave
        const startTime = Date.now();
        const duration = 500;
        const maxScale = 10;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = maxScale * progress;
                ring.scale.set(scale, scale, scale);
                material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        animate();
    }
}

export class WaterSplashEffect extends ParticleSystem {
    constructor(scene, position, options = {}) {
        const texture = new THREE.TextureLoader().load('/assets/textures/particles/water.png');
        
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
        const geometry = new THREE.RingGeometry(0.1, 0.2, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        // Animate ripple
        const startTime = Date.now();
        const duration = 1000;
        const maxScale = 5;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = maxScale * progress;
                ring.scale.set(scale, scale, scale);
                material.opacity = 0.5 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        animate();
    }
}
