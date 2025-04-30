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
        this.points.castShadow = false;
        this.points.receiveShadow = false;
        this.scene.add(this.points);
    }

    setParticlePosition(index, position) {
        this.points.geometry.attributes.position.array[index * 3] = position.x;
        this.points.geometry.attributes.position.array[index * 3 + 1] = position.y;
        this.points.geometry.attributes.position.array[index * 3 + 2] = position.z;
        this.points.geometry.attributes.position.needsUpdate = true;
    }

    setParticleColor(index, color) {
        this.points.geometry.attributes.color.array[index * 3] = color.r;
        this.points.geometry.attributes.color.array[index * 3 + 1] = color.g;
        this.points.geometry.attributes.color.array[index * 3 + 2] = color.b;
        this.points.geometry.attributes.color.needsUpdate = true;
    }

    dispose() {
        if (this.points) {
            this.scene.remove(this.points);
            this.points.geometry.dispose();
            this.points.material.dispose();
        }
        if (this.options.texture) {
            this.options.texture.dispose();
        }
    }
}
