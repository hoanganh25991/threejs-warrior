import * as THREE from 'three';

export default class ParticleSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            maxParticles: options.maxParticles || 1000,
            particleSize: options.particleSize || 0.1,
            texture: options.texture || null,
            blending: options.blending || THREE.AdditiveBlending
        };

        this.initializeParticleSystem();
    }

    initializeParticleSystem() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.options.maxParticles * 3);
        const colors = new Float32Array(this.options.maxParticles * 3);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: this.options.particleSize,
            map: this.options.texture,
            blending: this.options.blending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this.points = new THREE.Points(geometry, material);
        this.points.frustumCulled = false;
        this.points.onBeforeShadow = () => {};
        this.scene.add(this.points);
    }

    setParticlePosition(index, position) {
        this.particleSystem.geometry.attributes.position.array[index * 3] = position.x;
        this.particleSystem.geometry.attributes.position.array[index * 3 + 1] = position.y;
        this.particleSystem.geometry.attributes.position.array[index * 3 + 2] = position.z;
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    setParticleColor(index, color) {
        this.particleSystem.geometry.attributes.color.array[index * 3] = color.r;
        this.particleSystem.geometry.attributes.color.array[index * 3 + 1] = color.g;
        this.particleSystem.geometry.attributes.color.array[index * 3 + 2] = color.b;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
    }

    setParticleSize(index, size) {
        this.particleSystem.geometry.attributes.size.array[index] = size;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
    }

    setParticleOpacity(index, opacity) {
        this.particleSystem.geometry.attributes.opacity.array[index] = opacity;
        this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.time += deltaTime;

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.lifetime += deltaTime;

            if (particle.lifetime >= this.options.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }

            // Update position
            particle.velocity.add(this.options.gravity.clone().multiplyScalar(deltaTime));
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            this.setParticlePosition(i, particle.position);

            // Update appearance
            const progress = particle.lifetime / this.options.lifetime;
            const color = this.options.startColor.clone().lerp(this.options.endColor, progress);
            const opacity = THREE.MathUtils.lerp(this.options.startOpacity, this.options.endOpacity, progress);
            const size = THREE.MathUtils.lerp(this.options.startScale, this.options.endScale, progress) * this.options.particleSize;

            this.setParticleColor(i, color);
            this.setParticleOpacity(i, opacity);
            this.setParticleSize(i, size);
        }

        // Spawn new particles
        const particlesToSpawn = Math.floor(this.options.spawnRate * deltaTime);
        for (let i = 0; i < particlesToSpawn && this.particles.length < this.options.maxParticles; i++) {
            this.spawnParticle();
        }
    }

    spawnParticle() {
        const position = new THREE.Vector3();
        if (this.options.emitterShape === 'box') {
            position.x = (Math.random() - 0.5) * this.options.emitterSize.x;
            position.y = (Math.random() - 0.5) * this.options.emitterSize.y;
            position.z = (Math.random() - 0.5) * this.options.emitterSize.z;
        }

        const velocity = this.options.velocityFunction();
        const index = this.particles.length;

        this.particles.push({
            position: position,
            velocity: velocity,
            lifetime: 0
        });

        this.setParticlePosition(index, position);
        this.setParticleColor(index, this.options.startColor);
        this.setParticleOpacity(index, this.options.startOpacity);
        this.setParticleSize(index, this.options.startScale * this.options.particleSize);
    }

    dispose() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        this.particles = [];
        this.active = false;
        if (this.options.texture) {
            this.options.texture.dispose();
        }
    }
}
