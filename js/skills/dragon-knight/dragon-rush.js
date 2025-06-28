import Skill from '../skill.js';
import * as THREE from 'three';

export default class DragonRush extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Dragon Rush";
        this.manaCost = 50;
        this.damage = 80;
        this.range = 15;
        this.speed = 20; // Units per second
        this.duration = 0.75;
        this.particleCount = 60; // Increased particle count
        this.isRushing = false;
        this.startPosition = null;
        this.targetPosition = null;
        this.rushStartTime = 0;
        
        // Visual effect elements
        this.dragonAura = null;
        this.trailMeshes = [];
        this.energyRings = [];
        this.dashLines = [];
        this.impactWave = null;
        this.afterImages = [];
        
        // GPU optimization - Instanced meshes for particles
        this.particleInstances = null;
        this.particleInstanceCount = 200; // Maximum number of particles
        this.activeParticleCount = 0;
        this.particleInstanceMatrix = new THREE.Matrix4();
        this.particleInstanceColor = new THREE.Color();
        this.particleData = []; // Store particle data for instanced rendering
        
        // Object pools for reusing geometries and materials
        this.geometryPool = {};
        this.materialPool = {};
        
        // Performance settings - can be adjusted based on device capability
        this.qualityLevel = this._detectPerformanceLevel();
    }
    
    /**
     * Detect performance level based on device capabilities
     * Returns a value between 0 (low) and 1 (high)
     */
    _detectPerformanceLevel() {
        // For MacBook Pro with 10 GPU cores, we can use a higher quality level
        // but still optimize for performance
        return 1.0;
    }
    
    /**
     * Initialize instanced meshes for particles
     * This allows rendering many particles with a single draw call
     */
    initParticleInstances() {
        if (this.particleInstances) return; // Already initialized
        
        // Create base geometry for particles - use simpler geometry for better performance
        const particleGeometry = new THREE.SphereGeometry(1.0, 6, 4); // Reduced segments
        
        // Create instanced mesh
        const instancedMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        this.particleInstances = new THREE.InstancedMesh(
            particleGeometry,
            instancedMaterial,
            this.particleInstanceCount
        );
        
        // Set initial visibility to false for all instances
        this.particleInstances.count = 0;
        this.particleInstances.frustumCulled = false; // Disable frustum culling for particles
        
        // Add to scene
        this.scene.add(this.particleInstances);
        
        // Initialize particle data array
        for (let i = 0; i < this.particleInstanceCount; i++) {
            this.particleData.push({
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                rotation: new THREE.Vector3(),
                rotationSpeed: new THREE.Vector3(),
                scale: 1.0,
                initialScale: 1.0,
                color: new THREE.Color(0xff6600),
                life: 0,
                initialLife: 0
            });
        }
    }
    
    /**
     * Get or create a geometry from the pool
     * @param {string} type - Geometry type
     * @param {Object} params - Parameters for geometry creation
     * @returns {THREE.BufferGeometry}
     */
    getGeometry(type, params = {}) {
        const key = `${type}_${JSON.stringify(params)}`;
        
        if (!this.geometryPool[key]) {
            let geometry;
            
            // Create geometry based on type with reduced complexity
            switch (type) {
                case 'sphere':
                    const segments = Math.max(4, Math.floor(8 * this.qualityLevel));
                    geometry = new THREE.SphereGeometry(
                        params.radius || 1.0, 
                        segments, 
                        segments
                    );
                    break;
                case 'box':
                    geometry = new THREE.BoxGeometry(
                        params.width || 1.0,
                        params.height || 1.0,
                        params.depth || 1.0
                    );
                    break;
                case 'torus':
                    const torusSegments = Math.max(8, Math.floor(16 * this.qualityLevel));
                    geometry = new THREE.TorusGeometry(
                        params.radius || 1.0,
                        params.tube || 0.2,
                        torusSegments,
                        torusSegments * 2
                    );
                    break;
                case 'cone':
                    const coneSegments = Math.max(4, Math.floor(8 * this.qualityLevel));
                    geometry = new THREE.ConeGeometry(
                        params.radius || 1.0,
                        params.height || 2.0,
                        coneSegments
                    );
                    break;
                case 'cylinder':
                    const cylinderSegments = Math.max(6, Math.floor(8 * this.qualityLevel));
                    geometry = new THREE.CylinderGeometry(
                        params.radiusTop || 1.0,
                        params.radiusBottom || 1.0,
                        params.height || 1.0,
                        cylinderSegments
                    );
                    break;
                default:
                    geometry = new THREE.SphereGeometry(1.0, 6, 4);
            }
            
            this.geometryPool[key] = geometry;
        }
        
        return this.geometryPool[key];
    }
    
    /**
     * Get or create a material from the pool
     * @param {string} type - Material type
     * @param {Object} params - Parameters for material creation
     * @returns {THREE.Material}
     */
    getMaterial(type, params = {}) {
        const key = `${type}_${JSON.stringify(params)}`;
        
        if (!this.materialPool[key]) {
            let material;
            
            // Create material based on type
            switch (type) {
                case 'phong':
                    material = new THREE.MeshPhongMaterial({
                        color: params.color || 0xffffff,
                        emissive: params.emissive || params.color || 0xffffff,
                        emissiveIntensity: params.emissiveIntensity || 0.5,
                        transparent: params.transparent !== undefined ? params.transparent : true,
                        opacity: params.opacity || 1.0,
                        wireframe: params.wireframe || false,
                        side: params.side || THREE.FrontSide
                    });
                    break;
                case 'basic':
                    material = new THREE.MeshBasicMaterial({
                        color: params.color || 0xffffff,
                        transparent: params.transparent !== undefined ? params.transparent : true,
                        opacity: params.opacity || 1.0,
                        wireframe: params.wireframe || false,
                        side: params.side || THREE.FrontSide
                    });
                    break;
                case 'lambert':
                    material = new THREE.MeshLambertMaterial({
                        color: params.color || 0xffffff,
                        emissive: params.emissive || params.color || 0xffffff,
                        emissiveIntensity: params.emissiveIntensity || 0.5,
                        transparent: params.transparent !== undefined ? params.transparent : true,
                        opacity: params.opacity || 1.0,
                        wireframe: params.wireframe || false,
                        side: params.side || THREE.FrontSide
                    });
                    break;
                default:
                    material = new THREE.MeshBasicMaterial({
                        color: params.color || 0xffffff,
                        transparent: true,
                        opacity: params.opacity || 1.0
                    });
            }
            
            this.materialPool[key] = material;
        }
        
        return this.materialPool[key];
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Initialize instanced particles if not already done
        this.initParticleInstances();
        
        // Store current position
        this.startPosition = this.hero.group.position.clone();
        
        // Calculate target position
        const direction = this.hero.direction.clone();
        this.targetPosition = this.startPosition.clone().add(
            direction.multiplyScalar(this.range)
        );
        
        // Start rushing
        this.isRushing = true;
        this.rushStartTime = Date.now();
        
        // Create dragon aura around the hero - use optimized version
        this.createDragonAura();
        
        // Create energy buildup effect before dash - use optimized version
        this.createEnergyBuildup();
        
        // Create dash lines (direction indicators) - use optimized version
        this.createDashLines();
        
        // Create initial trail effect - use optimized version
        this.createTrailEffect(direction);
        
        // Create initial particles - use instanced version
        this.createInitialParticles();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('dragon-rush');
        }
        
        // Add an active effect for collision detection
        this.addActiveEffect({
            type: 'line',
            position: this.startPosition.clone(),
            direction: direction.clone(),
            range: this.range,
            width: 2,
            damage: this.damage,
            damageType: 'physical',
            lifetime: this.duration,
            canHitMultiple: true,
            onHit: (hitEnemies) => {
                hitEnemies.forEach(hit => {
                    // Apply knockback
                    if (hit.enemy && hit.enemy.applyKnockback) {
                        hit.enemy.applyKnockback(direction, 10);
                    }
                    
                    // Create impact effect - use optimized version
                    this.createEnemyImpact(hit.position);
                });
            }
        });
    }
    
    createDragonAura() {
        // Create a dragon-shaped aura that surrounds the hero during the rush
        
        // Create dragon head geometry
        const headGeometry = new THREE.ConeGeometry(0.8, 1.5, 5);
        headGeometry.rotateX(Math.PI / 2); // Rotate to point forward
        
        // Create dragon head material
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B0000, // Dark red
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        
        // Create dragon body (elongated shape)
        const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.5, 3, 8, 4, true);
        bodyGeometry.rotateX(Math.PI / 2); // Rotate to be horizontal
        
        // Create body material
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        
        // Create wings
        const wingGeometry = new THREE.PlaneGeometry(3, 1.5);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            wireframe: true
        });
        
        // Create the dragon aura group
        this.dragonAura = new THREE.Group();
        
        // Create and add head
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.z = 2; // Position at front
        this.dragonAura.add(head);
        
        // Create and add body
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = 0.5; // Position behind head
        this.dragonAura.add(body);
        
        // Create and add left wing
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(1.5, 0.5, 0);
        leftWing.rotation.y = Math.PI / 2;
        leftWing.rotation.x = -Math.PI / 6;
        this.dragonAura.add(leftWing);
        
        // Create and add right wing
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-1.5, 0.5, 0);
        rightWing.rotation.y = -Math.PI / 2;
        rightWing.rotation.x = Math.PI / 6;
        this.dragonAura.add(rightWing);
        
        // Add tail (tapered cylinder)
        const tailGeometry = new THREE.CylinderGeometry(0.4, 0.1, 2.5, 8, 4);
        tailGeometry.rotateX(Math.PI / 2); // Rotate to be horizontal
        
        const tailMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.z = -2; // Position at back
        this.dragonAura.add(tail);
        
        // Position the dragon aura at the hero's position
        this.dragonAura.position.copy(this.hero.group.position);
        this.dragonAura.position.y += 1; // Slightly above ground
        
        // Rotate to face the direction of travel
        this.dragonAura.rotation.y = Math.atan2(
            this.hero.direction.x,
            this.hero.direction.z
        );
        
        // Add to scene
        this.scene.add(this.dragonAura);
        
        // Add a point light inside the dragon
        const dragonLight = new THREE.PointLight(0xff6600, 2, 5);
        dragonLight.position.set(0, 0, 0);
        this.dragonAura.add(dragonLight);
        
        // Animate the dragon aura
        const startTime = Date.now();
        const animateDragonAura = () => {
            if (!this.dragonAura) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            
            // Make wings flap
            if (leftWing && rightWing) {
                const wingAngle = Math.sin(elapsed * 15) * 0.3;
                leftWing.rotation.x = -Math.PI / 6 + wingAngle;
                rightWing.rotation.x = Math.PI / 6 - wingAngle;
            }
            
            // Make tail wave
            if (tail) {
                tail.rotation.y = Math.sin(elapsed * 10) * 0.3;
            }
            
            if (elapsed < this.duration) {
                requestAnimationFrame(animateDragonAura);
            }
        };
        
        animateDragonAura();
    }
    
    createEnergyBuildup() {
        // Create energy rings that expand outward from the hero before the dash
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            setTimeout(() => {
                if (!this.isRushing) return;
                
                // Create ring geometry
                const ringGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
                ringGeometry.rotateX(Math.PI / 2); // Lay flat
                
                // Create ring material
                const ringMaterial = new THREE.MeshPhongMaterial({
                    color: 0xff9900,
                    emissive: 0xff6600,
                    emissiveIntensity: 1,
                    transparent: true,
                    opacity: 0.8
                });
                
                // Create ring mesh
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.copy(this.startPosition);
                ring.position.y += 0.1; // Slightly above ground
                
                // Add to scene and store reference
                this.scene.add(ring);
                this.energyRings.push(ring);
                
                // Animate the ring
                const startTime = Date.now();
                const animateRing = () => {
                    if (!ring || !this.energyRings.includes(ring)) return;
                    
                    const elapsed = (Date.now() - startTime) / 1000;
                    const duration = 0.3; // Short duration
                    const progress = elapsed / duration;
                    
                    if (progress < 1) {
                        // Scale up and fade out
                        const scale = 1 + progress * 4;
                        ring.scale.set(scale, scale, scale);
                        ring.material.opacity = 0.8 * (1 - progress);
                        
                        requestAnimationFrame(animateRing);
                    } else {
                        // Remove ring
                        this.scene.remove(ring);
                        ring.geometry.dispose();
                        ring.material.dispose();
                        const index = this.energyRings.indexOf(ring);
                        if (index > -1) {
                            this.energyRings.splice(index, 1);
                        }
                    }
                };
                
                animateRing();
                
            }, i * 100); // Stagger the rings
        }
    }
    
    createDashLines() {
        // Create dash lines that show the path of the rush
        const lineCount = 5;
        const lineLength = this.range / lineCount;
        
        for (let i = 0; i < lineCount; i++) {
            // Create line geometry
            const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, lineLength * 0.7);
            
            // Create line material
            const lineMaterial = new THREE.MeshPhongMaterial({
                color: 0xff9900,
                emissive: 0xff6600,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            
            // Create line mesh
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            
            // Position along the path
            const t = (i + 0.5) / lineCount;
            const position = new THREE.Vector3().lerpVectors(
                this.startPosition,
                this.targetPosition,
                t
            );
            line.position.copy(position);
            line.position.y += 0.5; // Slightly above ground
            
            // Rotate to align with direction
            line.rotation.y = Math.atan2(
                this.hero.direction.x,
                this.hero.direction.z
            );
            
            // Add to scene and store reference
            this.scene.add(line);
            this.dashLines.push(line);
            
            // Animate the line
            const startTime = Date.now();
            const animateLine = () => {
                if (!line || !this.dashLines.includes(line)) return;
                
                const elapsed = (Date.now() - startTime) / 1000;
                const duration = 0.3; // Short duration
                const progress = elapsed / duration;
                
                if (progress < 1) {
                    // Fade in then out
                    const opacity = progress < 0.5 
                        ? progress * 2 
                        : 2 * (1 - progress);
                    line.material.opacity = opacity * 0.7;
                    
                    requestAnimationFrame(animateLine);
                } else {
                    // Remove line
                    this.scene.remove(line);
                    line.geometry.dispose();
                    line.material.dispose();
                    const index = this.dashLines.indexOf(line);
                    if (index > -1) {
                        this.dashLines.splice(index, 1);
                    }
                }
            };
            
            animateLine();
        }
    }
    
    createTrailEffect(direction) {
        // Create a more complex trail effect with multiple elements
        
        // 1. Create main trail (elongated prism)
        const trailGeometry = new THREE.BoxGeometry(2, 1, this.range);
        const trailMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3
        });
        
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        
        // Position trail behind hero in the direction of travel
        trail.position.copy(this.startPosition);
        trail.position.y += 0.5;
        trail.position.add(direction.clone().multiplyScalar(this.range / 2));
        
        // Rotate to align with direction
        trail.rotation.y = Math.atan2(direction.x, direction.z);
        
        this.scene.add(trail);
        this.trailMeshes.push(trail);
        
        // 2. Create energy ribbons that spiral around the trail
        const ribbonCount = 3;
        
        for (let i = 0; i < ribbonCount; i++) {
            // Create a curved path for the ribbon
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0.5, 0.5, -this.range / 4),
                new THREE.Vector3(-0.5, 1, -this.range / 2),
                new THREE.Vector3(0.5, 0.5, -this.range * 3/4),
                new THREE.Vector3(0, 0, -this.range)
            ]);
            
            // Create ribbon geometry
            const ribbonGeometry = new THREE.TubeGeometry(
                curve,
                20,    // tubularSegments
                0.2,   // radius
                8,     // radialSegments
                false  // closed
            );
            
            // Create ribbon material
            const ribbonMaterial = new THREE.MeshPhongMaterial({
                color: 0xff9900,
                emissive: 0xff6600,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.5
            });
            
            // Create ribbon mesh
            const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
            
            // Position and rotate ribbon
            ribbon.position.copy(this.startPosition);
            ribbon.position.y += 0.5;
            ribbon.rotation.y = Math.atan2(direction.x, direction.z);
            ribbon.rotation.y += (i * Math.PI * 2) / ribbonCount; // Distribute around
            
            // Add to scene and store reference
            this.scene.add(ribbon);
            this.trailMeshes.push(ribbon);
        }
        
        // 3. Create a ground trail effect (series of rings)
        const ringCount = 10;
        
        for (let i = 0; i < ringCount; i++) {
            const t = i / (ringCount - 1);
            const position = new THREE.Vector3().lerpVectors(
                this.startPosition,
                this.targetPosition,
                t
            );
            position.y += 0.05; // Just above ground
            
            // Create ring geometry
            const ringGeometry = new THREE.TorusGeometry(0.8, 0.1, 16, 16);
            ringGeometry.rotateX(Math.PI / 2); // Lay flat
            
            // Create ring material
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0xff6600,
                emissive: 0xff4400,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.4
            });
            
            // Create ring mesh
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(position);
            
            // Add to scene and store reference
            this.scene.add(ring);
            this.trailMeshes.push(ring);
            
            // Animate the ring
            const startTime = Date.now();
            const delay = t * this.duration * 1000; // Stagger based on position
            
            setTimeout(() => {
                const animateRing = () => {
                    if (!ring || !this.trailMeshes.includes(ring)) return;
                    
                    const elapsed = (Date.now() - startTime) / 1000;
                    const duration = 0.5; // Half second animation
                    const progress = elapsed / duration;
                    
                    if (progress < 1) {
                        // Scale up and fade out
                        const scale = 1 + progress * 2;
                        ring.scale.set(scale, scale, scale);
                        ring.material.opacity = 0.4 * (1 - progress);
                        
                        requestAnimationFrame(animateRing);
                    } else {
                        // Remove ring
                        this.scene.remove(ring);
                        ring.geometry.dispose();
                        ring.material.dispose();
                        const index = this.trailMeshes.indexOf(ring);
                        if (index > -1) {
                            this.trailMeshes.splice(index, 1);
                        }
                    }
                };
                
                animateRing();
            }, delay);
        }
    }
    
    /**
     * Create an optimized particle using instanced rendering
     * @param {THREE.Vector3} position - Particle position
     * @param {THREE.Color|number} color - Particle color
     * @param {number} size - Particle size
     * @param {number} life - Particle lifetime
     * @param {Object} options - Additional options
     * @returns {Object} Particle data object
     */
    createOptimizedParticle(position, color, size, life, options = {}) {
        // Find an available particle slot
        let particleIndex = -1;
        for (let i = 0; i < this.particleData.length; i++) {
            if (!this.particleData[i].active) {
                particleIndex = i;
                break;
            }
        }
        
        // If no slot available, return null
        if (particleIndex === -1) return null;
        
        // Get particle data
        const particle = this.particleData[particleIndex];
        
        // Set particle properties
        particle.active = true;
        particle.position.copy(position);
        particle.velocity.set(
            options.velocity ? options.velocity.x : (Math.random() - 0.5) * 2,
            options.velocity ? options.velocity.y : Math.random() * 2,
            options.velocity ? options.velocity.z : (Math.random() - 0.5) * 2
        );
        particle.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        particle.rotationSpeed.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        
        // Apply options
        if (options.rotationSpeed) {
            particle.rotationSpeed.multiplyScalar(options.rotationSpeed);
        }
        
        // Set scale
        particle.scale = size;
        particle.initialScale = size;
        
        // Set color
        if (color instanceof THREE.Color) {
            particle.color.copy(color);
        } else {
            particle.color.set(color);
        }
        
        // Set life
        particle.life = life;
        particle.initialLife = life;
        
        // Update instance matrix and color
        this.updateParticleInstance(particleIndex);
        
        // Increase active particle count if needed
        if (particleIndex >= this.activeParticleCount) {
            this.activeParticleCount = particleIndex + 1;
            this.particleInstances.count = this.activeParticleCount;
        }
        
        return particle;
    }
    
    /**
     * Update a particle instance's matrix and color
     * @param {number} index - Particle index
     */
    updateParticleInstance(index) {
        const particle = this.particleData[index];
        
        // Skip inactive particles
        if (!particle.active) return;
        
        // Update matrix
        this.particleInstanceMatrix.makeRotationFromEuler(
            new THREE.Euler(particle.rotation.x, particle.rotation.y, particle.rotation.z)
        );
        this.particleInstanceMatrix.scale(
            new THREE.Vector3(particle.scale, particle.scale, particle.scale)
        );
        this.particleInstanceMatrix.setPosition(particle.position);
        
        // Set matrix and color
        this.particleInstances.setMatrixAt(index, this.particleInstanceMatrix);
        this.particleInstances.setColorAt(index, particle.color);
        
        // Mark instance attributes for update
        this.particleInstances.instanceMatrix.needsUpdate = true;
        if (this.particleInstances.instanceColor) {
            this.particleInstances.instanceColor.needsUpdate = true;
        }
    }
    
    /**
     * Update all particle instances
     * @param {number} delta - Time delta
     */
    updateParticleInstances(delta) {
        let activeCount = 0;
        
        // Update each particle
        for (let i = 0; i < this.particleData.length; i++) {
            const particle = this.particleData[i];
            
            // Skip inactive particles
            if (!particle.active) continue;
            
            // Update life
            particle.life -= delta;
            
            // Check if particle is dead
            if (particle.life <= 0) {
                particle.active = false;
                continue;
            }
            
            // Update position
            particle.position.add(particle.velocity.clone().multiplyScalar(delta));
            
            // Apply gravity
            particle.velocity.y -= 9.8 * delta;
            
            // Update rotation
            particle.rotation.x += particle.rotationSpeed.x * delta;
            particle.rotation.y += particle.rotationSpeed.y * delta;
            particle.rotation.z += particle.rotationSpeed.z * delta;
            
            // Calculate life percentage
            const lifePercent = particle.life / particle.initialLife;
            
            // Update scale - shrink as it gets older
            particle.scale = particle.initialScale * (0.5 + lifePercent * 0.5);
            
            // Update color - fade out
            particle.color.multiplyScalar(lifePercent);
            
            // Update instance
            this.updateParticleInstance(i);
            
            // Count active particles
            activeCount++;
        }
        
        // Update active particle count
        this.activeParticleCount = activeCount;
        this.particleInstances.count = activeCount;
    }
    
    createInitialParticles() {
        // Create initial particles along the path using instanced rendering
        const particleCount = Math.floor(this.particleCount * this.qualityLevel);
        
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const position = new THREE.Vector3().lerpVectors(
                this.startPosition,
                this.targetPosition,
                t
            );
            position.y += 0.5 + Math.random() * 1.5;
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Create optimized particle
            const particle = this.createOptimizedParticle(
                position,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.7,
                { 
                    rotationSpeed: 2,
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 3,
                        1 + Math.random() * 3,
                        (Math.random() - 0.5) * 3
                    )
                }
            );
        }
    }
    
    createAfterImage(position, direction) {
        // Create a ghostly after-image of the hero
        
        // Create a simplified hero shape
        const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        
        const afterImage = new THREE.Group();
        
        // Create body
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1; // Center at origin
        afterImage.add(body);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 2.2;
        afterImage.add(head);
        
        // Create limbs
        const limbGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        
        // Arms
        const leftArm = new THREE.Mesh(limbGeometry, bodyMaterial);
        leftArm.position.set(0.65, 1.5, 0);
        leftArm.rotation.z = -Math.PI / 6;
        afterImage.add(leftArm);
        
        const rightArm = new THREE.Mesh(limbGeometry, bodyMaterial);
        rightArm.position.set(-0.65, 1.5, 0);
        rightArm.rotation.z = Math.PI / 6;
        afterImage.add(rightArm);
        
        // Legs
        const leftLeg = new THREE.Mesh(limbGeometry, bodyMaterial);
        leftLeg.position.set(0.3, 0.5, 0);
        afterImage.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(limbGeometry, bodyMaterial);
        rightLeg.position.set(-0.3, 0.5, 0);
        afterImage.add(rightLeg);
        
        // Position and rotate the after-image
        afterImage.position.copy(position);
        afterImage.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Add to scene and store reference
        this.scene.add(afterImage);
        this.afterImages.push(afterImage);
        
        // Animate the after-image
        const startTime = Date.now();
        const animateAfterImage = () => {
            if (!afterImage || !this.afterImages.includes(afterImage)) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            const duration = 0.5; // Half second animation
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Fade out
                afterImage.children.forEach(child => {
                    if (child.material) {
                        child.material.opacity = 0.3 * (1 - progress);
                    }
                });
                
                requestAnimationFrame(animateAfterImage);
            } else {
                // Remove after-image
                this.scene.remove(afterImage);
                afterImage.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                const index = this.afterImages.indexOf(afterImage);
                if (index > -1) {
                    this.afterImages.splice(index, 1);
                }
            }
        };
        
        animateAfterImage();
    }
    
    createEnemyImpact(position) {
        // Create a more complex impact effect when hitting an enemy
        
        // Create impact particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            
            const particlePos = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 1,
                position.z + Math.sin(angle) * radius
            );
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Randomize particle type
            const particleType = Math.floor(Math.random() * 5);
            
            const particle = this.createParticle(
                particlePos,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.5,
                { 
                    type: particleType,
                    addLight: Math.random() < 0.2 // 20% chance to add light
                }
            );
            
            // Add outward velocity
            const outDirection = new THREE.Vector3(
                Math.cos(angle),
                0.5 + Math.random(),
                Math.sin(angle)
            );
            
            particle.velocity.copy(outDirection.multiplyScalar(3 + Math.random() * 5));
        }
        
        // Create impact wave (expanding ring)
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
        ringGeometry.rotateX(Math.PI / 2); // Lay flat
        
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        
        // Add to scene
        this.scene.add(ring);
        
        // Add a point light
        const light = new THREE.PointLight(0xff6600, 2, 3);
        light.position.copy(position);
        this.scene.add(light);
        
        // Animate the impact wave
        const startTime = Date.now();
        const animateImpact = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const duration = 0.5; // Half second animation
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Scale up and fade out
                const scale = 1 + progress * 4;
                ring.scale.set(scale, scale, scale);
                ring.material.opacity = 0.8 * (1 - progress);
                
                // Reduce light intensity
                light.intensity = 2 * (1 - progress);
                
                requestAnimationFrame(animateImpact);
            } else {
                // Remove impact wave
                this.scene.remove(ring);
                this.scene.remove(light);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        
        animateImpact();
    }
    
    createFinalImpact() {
        // Create a more complex final impact effect at the end of the rush
        const position = this.hero.group.position.clone();
        
        // 1. Create impact wave (expanding ring)
        const waveGeometry = new THREE.TorusGeometry(1, 0.3, 16, 32);
        waveGeometry.rotateX(Math.PI / 2); // Lay flat
        
        const waveMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        
        this.impactWave = new THREE.Mesh(waveGeometry, waveMaterial);
        this.impactWave.position.copy(position);
        this.impactWave.position.y += 0.1; // Slightly above ground
        
        // Add to scene
        this.scene.add(this.impactWave);
        
        // 2. Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(1, 16, 16);
        const explosionMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.7
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        explosion.position.y += 1;
        this.scene.add(explosion);
        
        // 3. Create shockwave effect (expanding cylinder)
        const shockwaveGeometry = new THREE.CylinderGeometry(0, 3, 0.1, 16, 1, true);
        const shockwaveMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(position);
        shockwave.position.y += 0.05; // Just above ground
        this.scene.add(shockwave);
        
        // 4. Add a point light
        const light = new THREE.PointLight(0xff6600, 3, 8);
        light.position.copy(position);
        light.position.y += 1;
        this.scene.add(light);
        
        // 5. Create debris particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            
            const particlePos = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 2,
                position.z + Math.sin(angle) * radius
            );
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Randomize particle type
            const particleType = Math.floor(Math.random() * 5);
            
            const particle = this.createParticle(
                particlePos,
                color,
                0.1 + Math.random() * 0.3,
                0.5 + Math.random() * 1.0,
                { 
                    type: particleType,
                    addLight: Math.random() < 0.1 // 10% chance to add light
                }
            );
            
            // Add outward and upward velocity
            const outDirection = new THREE.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            
            particle.velocity.copy(outDirection.multiplyScalar(3 + Math.random() * 5));
            particle.velocity.y = 2 + Math.random() * 4;
        }
        
        // 6. Create ground cracks (lines radiating outward)
        const crackCount = 8;
        for (let i = 0; i < crackCount; i++) {
            const angle = (i / crackCount) * Math.PI * 2;
            
            // Create a jagged line for the crack
            const points = [];
            const length = 2 + Math.random() * 2;
            const segments = 5;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const jitter = (j > 0 && j < segments) ? (Math.random() - 0.5) * 0.3 : 0;
                points.push(new THREE.Vector3(
                    Math.cos(angle + jitter) * length * t,
                    0.02, // Just above ground
                    Math.sin(angle + jitter) * length * t
                ));
            }
            
            const crackGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const crackMaterial = new THREE.LineBasicMaterial({
                color: 0xff4400,
                linewidth: 3
            });
            
            const crack = new THREE.Line(crackGeometry, crackMaterial);
            crack.position.copy(position);
            this.scene.add(crack);
            
            // Animate the crack
            const startTime = Date.now();
            const animateCrack = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const duration = 1.5; // Longer duration for cracks
                const progress = elapsed / duration;
                
                if (progress < 1) {
                    // Fade out slowly
                    crack.material.opacity = 1 - progress;
                    
                    requestAnimationFrame(animateCrack);
                } else {
                    // Remove crack
                    this.scene.remove(crack);
                    crack.geometry.dispose();
                    crack.material.dispose();
                }
            };
            
            animateCrack();
        }
        
        // Animate the impact effects
        const startTime = Date.now();
        const animateImpact = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const duration = 0.8; // Longer animation
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Animate wave
                if (this.impactWave) {
                    const waveScale = 1 + progress * 5;
                    this.impactWave.scale.set(waveScale, waveScale, waveScale);
                    this.impactWave.material.opacity = 0.8 * (1 - progress);
                }
                
                // Animate explosion
                if (explosion) {
                    const explosionScale = 1 + progress * 3;
                    explosion.scale.set(explosionScale, explosionScale, explosionScale);
                    explosion.material.opacity = 0.7 * (1 - progress);
                }
                
                // Animate shockwave
                if (shockwave) {
                    shockwave.scale.y = 1 + progress * 5;
                    shockwave.material.opacity = 0.5 * (1 - progress);
                }
                
                // Animate light
                if (light) {
                    light.intensity = 3 * (1 - progress);
                }
                
                requestAnimationFrame(animateImpact);
            } else {
                // Remove all impact elements
                if (this.impactWave) {
                    this.scene.remove(this.impactWave);
                    this.impactWave.geometry.dispose();
                    this.impactWave.material.dispose();
                    this.impactWave = null;
                }
                
                this.scene.remove(explosion);
                explosion.geometry.dispose();
                explosion.material.dispose();
                
                this.scene.remove(shockwave);
                shockwave.geometry.dispose();
                shockwave.material.dispose();
                
                this.scene.remove(light);
            }
        };
        
        animateImpact();
    }

    updateEffect(delta) {
        if (!this.isRushing) return;
        
        // Update instanced particles
        this.updateParticleInstances(delta);
        
        const now = Date.now();
        const elapsed = (now - this.rushStartTime) / 1000;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // Update hero position
        if (progress < 1) {
            // Calculate new position
            const newPosition = new THREE.Vector3().lerpVectors(
                this.startPosition,
                this.targetPosition,
                progress
            );
            
            // Set hero position
            this.hero.group.position.copy(newPosition);
            
            // Update dragon aura position and rotation
            if (this.dragonAura) {
                this.dragonAura.position.copy(newPosition);
                this.dragonAura.position.y += 1; // Slightly above ground
            }
            
            // Create after-image at intervals - reduce frequency based on quality level
            const afterImageChance = 0.1 * this.qualityLevel;
            if (Math.random() < afterImageChance) {
                this.createAfterImage(
                    newPosition.clone(),
                    this.hero.direction.clone()
                );
            }
            
            // Create trail particles - use optimized particles
            const trailParticleChance = 0.3 * this.qualityLevel;
            if (Math.random() < trailParticleChance) {
                const position = this.hero.group.position.clone();
                position.y += 0.5 + Math.random() * 1.5;
                
                // Create particle with fire color
                const hue = 0.05 + Math.random() * 0.05;
                const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
                
                // Create optimized particle
                this.createOptimizedParticle(
                    position,
                    color,
                    0.1 + Math.random() * 0.2,
                    0.3 + Math.random() * 0.7,
                    {
                        velocity: new THREE.Vector3(
                            (Math.random() - 0.5) * 3,
                            1 + Math.random() * 3,
                            (Math.random() - 0.5) * 3
                        )
                    }
                );
            }
            
            // Check for enemies in path and apply damage
            const enemies = this.scene.getObjectsByProperty('type', 'enemy');
            const heroRadius = 1.5;
            
            enemies.forEach(enemy => {
                const distance = enemy.position.distanceTo(this.hero.group.position);
                
                if (distance <= heroRadius) {
                    // Apply damage
                    enemy.takeDamage(this.damage * delta);
                    
                    // Apply knockback
                    if (enemy.applyKnockback) {
                        const knockbackDirection = this.hero.direction.clone();
                        enemy.applyKnockback(knockbackDirection, 10);
                    }
                    
                    // Create impact effect - use optimized version
                    this.createEnemyImpact(enemy.position.clone());
                }
            });
        } else {
            // End rush
            this.isRushing = false;
            
            // Remove dragon aura
            if (this.dragonAura) {
                this.scene.remove(this.dragonAura);
                this.dragonAura.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.dragonAura = null;
            }
            
            // Remove all trail meshes
            this.trailMeshes.forEach(mesh => {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
            this.trailMeshes = [];
            
            // Create final impact effect - use optimized version
            this.createFinalImpact();
        }
    }
    
    cleanup() {
        super.cleanup();
        
        // Clean up dragon aura
        if (this.dragonAura) {
            this.scene.remove(this.dragonAura);
            this.dragonAura.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.dragonAura = null;
        }
        
        // Clean up trail meshes
        this.trailMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.trailMeshes = [];
        
        // Clean up energy rings
        this.energyRings.forEach(ring => {
            this.scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        });
        this.energyRings = [];
        
        // Clean up dash lines
        this.dashLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.dashLines = [];
        
        // Clean up impact wave
        if (this.impactWave) {
            this.scene.remove(this.impactWave);
            this.impactWave.geometry.dispose();
            this.impactWave.material.dispose();
            this.impactWave = null;
        }
        
        // Clean up after images
        this.afterImages.forEach(image => {
            this.scene.remove(image);
            image.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.afterImages = [];
        
        // Clean up instanced particles
        if (this.particleInstances) {
            this.scene.remove(this.particleInstances);
            this.particleInstances.geometry.dispose();
            this.particleInstances.material.dispose();
            this.particleInstances = null;
            
            // Reset particle data
            for (let i = 0; i < this.particleData.length; i++) {
                this.particleData[i].active = false;
            }
            this.activeParticleCount = 0;
        }
        
        // Clean up geometry pool
        for (const key in this.geometryPool) {
            this.geometryPool[key].dispose();
        }
        this.geometryPool = {};
        
        // Clean up material pool
        for (const key in this.materialPool) {
            this.materialPool[key].dispose();
        }
        this.materialPool = {};
    }
    
    /**
     * Override the createEnemyImpact method to use optimized particles
     */
    createEnemyImpact(position) {
        // Create a more efficient impact effect when hitting an enemy
        
        // Create impact particles using instanced rendering
        const particleCount = Math.floor(20 * this.qualityLevel);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            
            const particlePos = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 1,
                position.z + Math.sin(angle) * radius
            );
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Create optimized particle
            const outDirection = new THREE.Vector3(
                Math.cos(angle),
                0.5 + Math.random(),
                Math.sin(angle)
            ).multiplyScalar(3 + Math.random() * 5);
            
            this.createOptimizedParticle(
                particlePos,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.5,
                { 
                    velocity: outDirection
                }
            );
        }
        
        // Create impact wave (expanding ring) - use object pooling
        const ringGeometry = this.getGeometry('torus', { radius: 0.5, tube: 0.2 });
        const ringMaterial = this.getMaterial('phong', {
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 0.1; // Slightly above ground
        ring.rotation.x = Math.PI / 2; // Lay flat
        
        // Add to scene
        this.scene.add(ring);
        
        // Add a point light with reduced intensity
        const light = new THREE.PointLight(0xff6600, 1.5, 3);
        light.position.copy(position);
        this.scene.add(light);
        
        // Animate the impact wave
        const startTime = Date.now();
        const animateImpact = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const duration = 0.5; // Half second animation
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Scale up and fade out
                const scale = 1 + progress * 4;
                ring.scale.set(scale, scale, scale);
                ring.material.opacity = 0.8 * (1 - progress);
                
                // Reduce light intensity
                light.intensity = 1.5 * (1 - progress);
                
                requestAnimationFrame(animateImpact);
            } else {
                // Remove impact wave
                this.scene.remove(ring);
                this.scene.remove(light);
                // Note: We don't dispose geometry/material as they're from the pool
            }
        };
        
        animateImpact();
    }
}