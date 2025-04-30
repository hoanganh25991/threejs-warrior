import * as THREE from 'three';

export default class ParticleSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            maxParticles: options.maxParticles || 1000,
            particleSize: options.particleSize || 0.1,
            spawnRate: options.spawnRate || 10, // particles per second
            lifetime: options.lifetime || 2, // seconds
            gravity: options.gravity || new THREE.Vector3(0, -9.8, 0),
            startColor: options.startColor || new THREE.Color(1, 1, 1),
            endColor: options.endColor || new THREE.Color(1, 1, 1),
            startOpacity: options.startOpacity || 1,
            endOpacity: options.endOpacity || 0,
            startScale: options.startScale || 1,
            endScale: options.endScale || 0.5,
            blending: options.blending || THREE.AdditiveBlending,
            texture: options.texture || null,
            emitterShape: options.emitterShape || 'point', // point, sphere, box
            emitterSize: options.emitterSize || new THREE.Vector3(0, 0, 0),
            velocityFunction: options.velocityFunction || (() => new THREE.Vector3()),
            updateFunction: options.updateFunction || null
        };

        this.particles = [];
        this.time = 0;
        this.active = true;

        this.initializeParticleSystem();
    }

    initializeParticleSystem() {
        // Create geometry for all possible particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.options.maxParticles * 3);
        const colors = new Float32Array(this.options.maxParticles * 3);
        const sizes = new Float32Array(this.options.maxParticles);
        const opacities = new Float32Array(this.options.maxParticles);
        const lifetimes = new Float32Array(this.options.maxParticles);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

        // Create material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                texture: { value: this.options.texture },
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute float opacity;
                attribute float lifetime;
                attribute vec3 color;
                varying float vOpacity;
                varying vec3 vColor;
                uniform float time;

                void main() {
                    vOpacity = opacity;
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform sampler2D texture;
                varying float vOpacity;
                varying vec3 vColor;

                void main() {
                    vec4 texColor = texture2D(texture, gl_PointCoord);
                    gl_FragColor = vec4(vColor, vOpacity) * texColor;
                }
            `,
            blending: this.options.blending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        // Create particle system mesh
        this.particlesMesh = new THREE.Points(geometry, material);
        this.scene.add(this.particlesMesh);
    }

    spawnParticle(position = new THREE.Vector3()) {
        if (this.particles.length >= this.options.maxParticles) return;

        const particle = {
            position: this.getEmitterPosition(position),
            velocity: this.options.velocityFunction(),
            age: 0,
            lifetime: this.options.lifetime * (0.8 + Math.random() * 0.4),
            size: this.options.particleSize,
            color: this.options.startColor.clone(),
            opacity: this.options.startOpacity
        };

        this.particles.push(particle);
        this.updateGeometryAttributes();
    }

    getEmitterPosition(basePosition) {
        const position = basePosition.clone();

        switch (this.options.emitterShape) {
            case 'sphere':
                const radius = this.options.emitterSize.x;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                position.x += radius * Math.sin(phi) * Math.cos(theta);
                position.y += radius * Math.sin(phi) * Math.sin(theta);
                position.z += radius * Math.cos(phi);
                break;

            case 'box':
                position.x += (Math.random() - 0.5) * this.options.emitterSize.x;
                position.y += (Math.random() - 0.5) * this.options.emitterSize.y;
                position.z += (Math.random() - 0.5) * this.options.emitterSize.z;
                break;
        }

        return position;
    }

    update(delta) {
        if (!this.active) return;

        this.time += delta;
        this.particlesMesh.material.uniforms.time.value = this.time;

        // Spawn new particles
        const particlesToSpawn = Math.floor(this.options.spawnRate * delta);
        for (let i = 0; i < particlesToSpawn; i++) {
            this.spawnParticle();
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.age += delta;

            if (particle.age >= particle.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }

            // Update particle physics
            particle.velocity.add(this.options.gravity.clone().multiplyScalar(delta));
            particle.position.add(particle.velocity.clone().multiplyScalar(delta));

            // Update particle appearance
            const lifeProgress = particle.age / particle.lifetime;
            particle.color.lerpColors(
                this.options.startColor,
                this.options.endColor,
                lifeProgress
            );
            particle.opacity = THREE.MathUtils.lerp(
                this.options.startOpacity,
                this.options.endOpacity,
                lifeProgress
            );
            particle.size = THREE.MathUtils.lerp(
                this.options.startScale,
                this.options.endScale,
                lifeProgress
            ) * this.options.particleSize;

            // Custom update function if provided
            if (this.options.updateFunction) {
                this.options.updateFunction(particle, delta, lifeProgress);
            }
        }

        this.updateGeometryAttributes();
    }

    updateGeometryAttributes() {
        const positions = this.particlesMesh.geometry.attributes.position.array;
        const colors = this.particlesMesh.geometry.attributes.color.array;
        const sizes = this.particlesMesh.geometry.attributes.size.array;
        const opacities = this.particlesMesh.geometry.attributes.opacity.array;
        const lifetimes = this.particlesMesh.geometry.attributes.lifetime.array;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const i3 = i * 3;

            positions[i3] = particle.position.x;
            positions[i3 + 1] = particle.position.y;
            positions[i3 + 2] = particle.position.z;

            colors[i3] = particle.color.r;
            colors[i3 + 1] = particle.color.g;
            colors[i3 + 2] = particle.color.b;

            sizes[i] = particle.size;
            opacities[i] = particle.opacity;
            lifetimes[i] = particle.age / particle.lifetime;
        }

        this.particlesMesh.geometry.attributes.position.needsUpdate = true;
        this.particlesMesh.geometry.attributes.color.needsUpdate = true;
        this.particlesMesh.geometry.attributes.size.needsUpdate = true;
        this.particlesMesh.geometry.attributes.opacity.needsUpdate = true;
        this.particlesMesh.geometry.attributes.lifetime.needsUpdate = true;

        // Update draw range
        this.particlesMesh.geometry.setDrawRange(0, this.particles.length);
    }

    start() {
        this.active = true;
    }

    stop() {
        this.active = false;
    }

    reset() {
        this.particles = [];
        this.time = 0;
        this.updateGeometryAttributes();
    }

    dispose() {
        this.scene.remove(this.particlesMesh);
        this.particlesMesh.geometry.dispose();
        this.particlesMesh.material.dispose();
        if (this.options.texture) {
            this.options.texture.dispose();
        }
    }
}
