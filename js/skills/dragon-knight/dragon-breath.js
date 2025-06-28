import Skill from '../skill.js';
import * as THREE from 'three';

export default class DragonBreath extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Dragon Breath";
        this.manaCost = 50;
        this.damage = 100;
        this.range = 10;
        this.duration = 2.0;
        this.width = 3;
        this.particleCount = 40; // Reduced particle count for better performance
        this.damageType = 'fire';
        this.damageInterval = 0.2; // Apply damage every 0.2 seconds
        this.damageTimer = 0;
        
        // Performance settings
        this.useGPUInstancing = true; // Enable GPU instancing for particles
        this.useSimplifiedShaders = true; // Use simplified shaders for better performance
        this.maxLights = 3; // Limit the number of dynamic lights
        this.lightCount = 0; // Track current light count
        
        // Visual effect elements
        this.dragonHeadMesh = null;
        this.flameCone = null;
        this.fireRing = null;
        this.fireEmbers = [];
        this.flameWaves = [];
        this.heatDistortion = null;
        
        // Instanced meshes for particles
        this.particleInstances = null;
        this.particleInstanceCount = 0;
        this.particleInstanceData = [];
    }

    getCooldownDuration() {
        // DEBOUNCE: 1 second cooldown to prevent spam
        return 1.0;
    }

    createEffect() {
        // Create origin and direction
        const origin = this.hero.group.position.clone();
        origin.y += 1.2; // Position slightly above the hero
        const direction = this.hero.direction.clone();
        
        // Initialize instanced particles if using GPU instancing
        if (this.useGPUInstancing) {
            this.initInstancedParticles();
        }
        
        // Create dragon head effect
        this.createDragonHead(origin, direction);
        
        // Create flame cone with optimized shader
        this.createFlameCone(origin, direction);
        
        // Create heat distortion effect (simplified if needed)
        if (!this.useSimplifiedShaders) {
            this.createHeatDistortion(origin, direction);
        }
        
        // Create fire ring at the hero's feet
        this.createFireRing(this.hero.group.position.clone());
        
        // Create flame wave that travels forward
        this.createFlameWave(origin, direction);
        
        // Create particle system for the main breath effect
        this.createBreathParticles(origin, direction);

        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('dragon-breath');
        }
        
        // Add an active effect for collision detection
        this.addActiveEffect({
            type: 'cone',
            position: origin.clone(),
            direction: direction.clone(),
            range: this.range,
            width: this.width,
            damage: this.damage,
            damageType: this.damageType,
            lifetime: this.duration,
            canHitMultiple: true, // Can hit multiple enemies
            onHit: (hitEnemies) => {
                // Create additional effects on hit (limit for performance)
                const maxHitEffects = 3;
                hitEnemies.slice(0, maxHitEffects).forEach(hit => {
                    this.createImpactEffect(hit.position);
                });
            }
        });
        
        // Reset damage timer
        this.damageTimer = 0;
    }
    
    // Initialize instanced particles for better GPU performance
    initInstancedParticles() {
        // Clean up any existing instances
        if (this.particleInstances) {
            this.scene.remove(this.particleInstances);
            this.particleInstances.geometry.dispose();
            this.particleInstances.material.dispose();
        }
        
        // Create a simple geometry for particles
        const geometry = new THREE.SphereGeometry(0.15, 6, 4);
        
        // Create instanced material
        const material = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.8,
            flatShading: true
        });
        
        // Create instanced mesh
        this.particleInstances = new THREE.InstancedMesh(
            geometry, 
            material, 
            this.particleCount * 2 // Allocate enough instances
        );
        
        // Hide all instances initially
        const matrix = new THREE.Matrix4();
        matrix.makeScale(0, 0, 0);
        
        for (let i = 0; i < this.particleCount * 2; i++) {
            this.particleInstances.setMatrixAt(i, matrix);
            this.particleInstanceData[i] = {
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                scale: 0,
                life: 0,
                maxLife: 0
            };
        }
        
        this.particleInstances.instanceMatrix.needsUpdate = true;
        this.particleInstanceCount = 0;
        
        // Add to scene
        this.scene.add(this.particleInstances);
    }

    createDragonHead(origin, direction) {
        // Create dragon head geometry
        const headGeometry = new THREE.ConeGeometry(0.8, 2, 5);
        headGeometry.rotateX(Math.PI / 2); // Rotate to point forward
        
        // Create dragon head material with scales texture
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B0000, // Dark red
            emissive: 0x330000,
            shininess: 30,
            flatShading: true
        });
        
        // Create mesh and position it
        this.dragonHeadMesh = new THREE.Mesh(headGeometry, headMaterial);
        this.dragonHeadMesh.position.copy(origin);
        
        // Rotate to face direction
        this.dragonHeadMesh.lookAt(origin.clone().add(direction));
        
        // Add to scene
        this.scene.add(this.dragonHeadMesh);
        
        // Add jaw (lower part of the head)
        const jawGeometry = new THREE.ConeGeometry(0.6, 1.5, 5);
        jawGeometry.rotateX(Math.PI / 2);
        jawGeometry.translate(0, -0.2, 0.5);
        
        const jawMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B0000,
            emissive: 0x330000,
            shininess: 30,
            flatShading: true
        });
        
        const jaw = new THREE.Mesh(jawGeometry, jawMaterial);
        this.dragonHeadMesh.add(jaw);
        
        // Add eyes
        const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xff9900,
            emissiveIntensity: 1,
            shininess: 100
        });
        
        // Left eye
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.3, 0.5, -0.5);
        this.dragonHeadMesh.add(leftEye);
        
        // Right eye
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.3, 0.5, -0.5);
        this.dragonHeadMesh.add(rightEye);
        
        // Add horns
        const hornGeometry = new THREE.ConeGeometry(0.1, 0.8, 5);
        const hornMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 50
        });
        
        // Left horn
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(0.4, 0.6, -0.7);
        leftHorn.rotation.set(Math.PI / 4, 0, Math.PI / 6);
        this.dragonHeadMesh.add(leftHorn);
        
        // Right horn
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(-0.4, 0.6, -0.7);
        rightHorn.rotation.set(Math.PI / 4, 0, -Math.PI / 6);
        this.dragonHeadMesh.add(rightHorn);
        
        // Animate the dragon head
        const startTime = Date.now();
        const animateHead = () => {
            if (!this.dragonHeadMesh) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            
            // Make the jaw open and close
            if (jaw) {
                jaw.rotation.x = Math.sin(elapsed * 10) * 0.2 - 0.3;
            }
            
            if (elapsed < this.duration) {
                requestAnimationFrame(animateHead);
            }
        };
        
        animateHead();
    }
    
    createFlameCone(origin, direction) {
        // Create a cone geometry for the flame (reduced segments for better performance)
        const coneGeometry = new THREE.ConeGeometry(this.width / 2, this.range, 12, 6);
        coneGeometry.rotateX(Math.PI / 2); // Rotate to point forward
        
        // Choose between optimized or full-quality shader
        let flameMaterial;
        
        if (this.useSimplifiedShaders) {
            // Simplified shader for better performance
            flameMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0xff4400) }, // Orange-red
                    color2: { value: new THREE.Color(0xff9900) }  // Yellow-orange
                },
                vertexShader: `
                    varying vec2 vUv;
                    
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    
                    // Fast pseudo-random function
                    float rand(vec2 co) {
                        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
                    }
                    
                    void main() {
                        // Simple noise based on UV and time
                        float noise = rand(vUv + time * 0.1) * 0.5 + 0.5;
                        
                        // Mix colors based on noise and position
                        vec3 color = mix(color1, color2, noise);
                        
                        // Fade out at the edges and tip
                        float edge = 1.0 - length(vUv - vec2(0.5, 0.5)) * 1.5;
                        float tip = 1.0 - vUv.y;
                        
                        // Combine for final opacity
                        float opacity = edge * tip * 0.8;
                        
                        // Add simple flickering
                        opacity *= 0.7 + 0.3 * sin(time * 10.0);
                        
                        gl_FragColor = vec4(color, opacity);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });
        } else {
            // Full quality shader with optimized simplex noise
            flameMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color1: { value: new THREE.Color(0xff4400) }, // Orange-red
                    color2: { value: new THREE.Color(0xff9900) }  // Yellow-orange
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    void main() {
                        vUv = uv;
                        vPosition = position;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color1;
                    uniform vec3 color2;
                    varying vec2 vUv;
                    varying vec3 vPosition;
                    
                    // Optimized noise function (faster than full simplex)
                    float noise(vec3 p) {
                        vec3 i = floor(p);
                        vec3 f = fract(p);
                        f = f*f*(3.0-2.0*f);
                        
                        vec2 uv = (i.xy+vec2(37.0,17.0)*i.z) + f.xy;
                        vec2 rg = vec2(
                            sin(uv.x * 0.1 + time),
                            sin(uv.y * 0.1 - time)
                        ) * 0.5 + 0.5;
                        return mix(rg.x, rg.y, f.z);
                    }
                    
                    void main() {
                        // Create noise based on position and time (simplified)
                        float noise = noise(vec3(vPosition.x * 1.5, vPosition.y * 1.5, vPosition.z * 1.5 + time * 2.0));
                        
                        // Mix colors based on noise and position
                        vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
                        
                        // Fade out at the edges and tip
                        float edge = 1.0 - length(vUv - vec2(0.5, 0.5)) * 1.5;
                        float tip = 1.0 - vUv.y;
                        
                        // Combine for final opacity
                        float opacity = edge * tip * (0.8 + noise * 0.2);
                        
                        // Add flickering (simplified)
                        opacity *= 0.7 + 0.3 * sin(time * 10.0);
                        
                        gl_FragColor = vec4(color, opacity);
                    }
                `,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });
        }
        
        // Create the flame cone mesh
        this.flameCone = new THREE.Mesh(coneGeometry, flameMaterial);
        this.flameCone.position.copy(origin);
        
        // Rotate to face direction
        this.flameCone.lookAt(origin.clone().add(direction));
        
        // Add to scene
        this.scene.add(this.flameCone);
        
        // Use a more efficient animation approach with RAF management
        const startTime = Date.now();
        let animationFrameId = null;
        
        const animateFlame = () => {
            if (!this.flameCone) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            this.flameCone.material.uniforms.time.value = elapsed;
            
            if (elapsed < this.duration) {
                animationFrameId = requestAnimationFrame(animateFlame);
            } else {
                // Remove the flame cone after duration
                this.scene.remove(this.flameCone);
                this.flameCone.geometry.dispose();
                this.flameCone.material.dispose();
                this.flameCone = null;
                animationFrameId = null;
            }
        };
        
        animationFrameId = requestAnimationFrame(animateFlame);
        
        // Store the animation frame ID for proper cleanup
        this.flameCone.userData.animationFrameId = animationFrameId;
    }
    
    createHeatDistortion(origin, direction) {
        // Create a plane for the heat distortion effect (reduced segments)
        const planeGeometry = new THREE.PlaneGeometry(this.width * 1.5, this.range * 1.2, 10, 10);
        planeGeometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
        
        // Create a simplified shader material for heat distortion
        const heatMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                
                void main() {
                    // Create simplified heat distortion pattern
                    float distortion = sin(vUv.x * 10.0 + time * 3.0) * sin(vUv.y * 10.0 + time * 2.0) * 0.1;
                    
                    // Fade out at edges
                    float edge = 1.0 - length(vUv - vec2(0.5, 0.5)) * 2.0;
                    edge = max(0.0, edge);
                    
                    // Fade out based on y position (distance from origin)
                    float fadeY = 1.0 - vUv.y;
                    
                    float opacity = edge * fadeY * 0.2 * (0.5 + distortion);
                    
                    gl_FragColor = vec4(1.0, 0.6, 0.2, opacity);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending // Use additive blending for better performance
        });
        
        // Create the heat distortion mesh
        this.heatDistortion = new THREE.Mesh(planeGeometry, heatMaterial);
        
        // Position at origin and rotate to face direction
        this.heatDistortion.position.copy(origin);
        this.heatDistortion.position.y += 0.1; // Slightly above ground
        
        // Rotate to align with direction
        this.heatDistortion.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Add to scene
        this.scene.add(this.heatDistortion);
        
        // Animate the heat distortion with better RAF management
        const startTime = Date.now();
        let animationFrameId = null;
        
        const animateHeat = () => {
            if (!this.heatDistortion) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            this.heatDistortion.material.uniforms.time.value = elapsed;
            
            if (elapsed < this.duration) {
                animationFrameId = requestAnimationFrame(animateHeat);
            } else {
                // Remove after duration
                this.scene.remove(this.heatDistortion);
                this.heatDistortion.geometry.dispose();
                this.heatDistortion.material.dispose();
                this.heatDistortion = null;
                animationFrameId = null;
            }
        };
        
        animationFrameId = requestAnimationFrame(animateHeat);
        
        // Store the animation frame ID for proper cleanup
        if (this.heatDistortion) {
            this.heatDistortion.userData.animationFrameId = animationFrameId;
        }
    }
    
    createFireRing(position) {
        // Create a ring geometry with reduced segments
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.3, 12, 24);
        ringGeometry.rotateX(Math.PI / 2); // Lay flat on the ground
        
        // Create a material with fire texture
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        // Create the ring mesh
        this.fireRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.fireRing.position.copy(position);
        this.fireRing.position.y += 0.1; // Slightly above ground
        
        // Add to scene
        this.scene.add(this.fireRing);
        
        // Add a point light in the center of the ring (only if we haven't reached max lights)
        if (this.lightCount < this.maxLights) {
            const ringLight = new THREE.PointLight(0xff6600, 1, 3);
            ringLight.position.copy(position);
            ringLight.position.y += 0.5;
            this.scene.add(ringLight);
            this.fireRing.userData.light = ringLight;
            this.lightCount++;
        }
        
        // Animate the fire ring with better RAF management
        const startTime = Date.now();
        let animationFrameId = null;
        
        const animateRing = () => {
            if (!this.fireRing) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / this.duration;
            
            // Scale up and fade out
            const scale = 1 + progress * 1.5;
            this.fireRing.scale.set(scale, scale, scale);
            
            // Fade out
            this.fireRing.material.opacity = 0.7 * (1 - progress);
            
            // Rotate (reduced rotation speed)
            this.fireRing.rotation.z += 0.03;
            
            // Update light intensity
            if (this.fireRing.userData.light) {
                this.fireRing.userData.light.intensity = 1 * (1 - progress);
            }
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateRing);
            } else {
                // Remove after duration
                this.scene.remove(this.fireRing);
                if (this.fireRing.userData.light) {
                    this.scene.remove(this.fireRing.userData.light);
                    this.lightCount--;
                }
                this.fireRing.geometry.dispose();
                this.fireRing.material.dispose();
                this.fireRing = null;
                animationFrameId = null;
            }
        };
        
        animationFrameId = requestAnimationFrame(animateRing);
        
        // Store the animation frame ID for proper cleanup
        if (this.fireRing) {
            this.fireRing.userData.animationFrameId = animationFrameId;
        }
    }
    
    createFlameWave(origin, direction) {
        // Limit the number of flame waves for performance
        if (this.flameWaves.length >= 2) {
            return; // Don't create more than 2 waves at a time
        }
        
        // Create a wave that travels along the ground (simplified geometry)
        const waveGeometry = new THREE.PlaneGeometry(this.width, 1, 4, 1);
        waveGeometry.rotateX(-Math.PI / 2); // Lay flat
        
        // Create a material for the flame wave (using BasicMaterial for better performance)
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Create the wave mesh
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(origin);
        wave.position.y = 0.1; // Just above ground
        
        // Rotate to align with direction
        wave.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Add to scene
        this.scene.add(wave);
        this.flameWaves.push(wave);
        
        // Animate the wave with better RAF management
        const startTime = Date.now();
        let animationFrameId = null;
        
        const animateWave = () => {
            if (!wave || !this.flameWaves.includes(wave)) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / (this.duration * 0.8); // Slightly faster than duration
            
            if (progress < 1) {
                // Move forward
                const newPos = origin.clone().add(
                    direction.clone().multiplyScalar(progress * this.range)
                );
                wave.position.copy(newPos);
                
                // Simplified bobbing motion (less frequent calculations)
                if (elapsed % 0.1 < 0.05) {
                    wave.position.y = 0.1 + Math.sin(elapsed * 5) * 0.1;
                }
                
                // Scale based on distance
                const scaleX = 1 + progress * 2;
                const scaleZ = 1 + progress * 0.5;
                wave.scale.set(scaleX, 1, scaleZ);
                
                animationFrameId = requestAnimationFrame(animateWave);
            } else {
                // Remove wave
                this.scene.remove(wave);
                wave.geometry.dispose();
                wave.material.dispose();
                const index = this.flameWaves.indexOf(wave);
                if (index > -1) {
                    this.flameWaves.splice(index, 1);
                }
                animationFrameId = null;
            }
        };
        
        animationFrameId = requestAnimationFrame(animateWave);
        
        // Store the animation frame ID for proper cleanup
        wave.userData.animationFrameId = animationFrameId;
        
        // Create additional waves at intervals (only if we don't have too many already)
        if (this.duration > 0.5 && this.flameWaves.length < 2) {
            setTimeout(() => {
                if (this.isActive && this.flameWaves.length < 2) {
                    this.createFlameWave(
                        this.hero.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
                        this.hero.direction.clone()
                    );
                }
            }, 500); // Create a new wave every 0.5 seconds
        }
    }
    
    createBreathParticles(origin, direction) {
        // Use GPU instancing if enabled
        if (this.useGPUInstancing && this.particleInstances) {
            this.createInstancedBreathParticles(origin, direction);
            return;
        }
        
        // Create main breath particles (traditional method as fallback)
        const particleCount = Math.floor(this.particleCount * 0.7); // Reduce count for better performance
        
        for (let i = 0; i < particleCount; i++) {
            // Calculate random angle within cone
            const angle = (Math.random() - 0.5) * this.width;
            const particleDir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            // Calculate random distance from origin
            const distance = Math.random() * 2;
            
            // Calculate position
            const position = origin.clone().add(
                particleDir.clone().multiplyScalar(distance)
            );
            
            // Simplify particle types for better performance
            const particleType = Math.floor(Math.random() * 3); // Reduced variety
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05; // Orange-red hue
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Create particle with different sizes
            const size = 0.1 + Math.random() * 0.2;
            
            // Create particle with random lifetime
            const life = 0.5 + Math.random() * 1.0;
            
            // Create particle with light for some particles (limit lights)
            const addLight = this.lightCount < this.maxLights && Math.random() < 0.05; // 5% chance to add light
            
            const particle = this.createParticle(
                position,
                color,
                size,
                life,
                {
                    type: particleType,
                    addLight: addLight,
                    noGravity: Math.random() < 0.7 // 70% chance to have no gravity
                }
            );
            
            if (addLight) {
                this.lightCount++;
            }
            
            // Add forward velocity in cone shape with some variation
            particle.velocity.copy(particleDir)
                .multiplyScalar(8 + Math.random() * 7);
            
            // Add some random velocity
            particle.velocity.x += (Math.random() - 0.5) * 3;
            particle.velocity.y += (Math.random() - 0.5) * 3;
            particle.velocity.z += (Math.random() - 0.5) * 3;
            
            // Add faster rotation for fire effect
            particle.rotationSpeed.multiplyScalar(3);
        }
    }
    
    // Create breath particles using GPU instancing for better performance
    createInstancedBreathParticles(origin, direction) {
        // Reset instance matrix if needed
        if (!this.particleInstances) return;
        
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const color = new THREE.Color();
        
        // Create particles
        for (let i = 0; i < this.particleCount; i++) {
            // Find an available instance slot
            let instanceIndex = -1;
            for (let j = 0; j < this.particleInstanceData.length; j++) {
                if (!this.particleInstanceData[j].active) {
                    instanceIndex = j;
                    break;
                }
            }
            
            // Skip if no slots available
            if (instanceIndex === -1) continue;
            
            // Calculate random angle within cone
            const angle = (Math.random() - 0.5) * this.width;
            const particleDir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            // Calculate random distance from origin
            const distance = Math.random() * 2;
            
            // Calculate position
            const position = origin.clone().add(
                particleDir.clone().multiplyScalar(distance)
            );
            
            // Set random size
            const size = 0.1 + Math.random() * 0.2;
            
            // Set random lifetime
            const life = 0.5 + Math.random() * 1.0;
            
            // Set random rotation
            quaternion.setFromAxisAngle(
                new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                Math.random() * Math.PI * 2
            );
            
            // Set velocity
            const velocity = particleDir.clone().multiplyScalar(8 + Math.random() * 7);
            velocity.x += (Math.random() - 0.5) * 3;
            velocity.y += (Math.random() - 0.5) * 3;
            velocity.z += (Math.random() - 0.5) * 3;
            
            // Update instance data
            this.particleInstanceData[instanceIndex] = {
                active: true,
                position: position.clone(),
                velocity: velocity,
                scale: size,
                rotation: quaternion.clone(),
                life: life,
                maxLife: life,
                noGravity: Math.random() < 0.7
            };
            
            // Set matrix
            matrix.compose(
                position,
                quaternion,
                new THREE.Vector3(size, size, size)
            );
            
            // Apply to instance
            this.particleInstances.setMatrixAt(instanceIndex, matrix);
            
            // Set color (orange-red variations)
            const hue = 0.05 + Math.random() * 0.05;
            color.setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            this.particleInstances.setColorAt(instanceIndex, color);
        }
        
        // Update instance matrices
        this.particleInstances.instanceMatrix.needsUpdate = true;
        
        // Update instance colors if available
        if (this.particleInstances.instanceColor) {
            this.particleInstances.instanceColor.needsUpdate = true;
        }
    }
    
    createImpactEffect(position) {
        // Create a burst of particles at impact point (reduced count)
        const particleCount = 8; // Reduced from 15
        
        // Use instanced particles if available
        if (this.useGPUInstancing && this.particleInstances) {
            this.createInstancedImpactEffect(position);
            return;
        }
        
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
            
            // Only add light if we haven't reached the limit
            const addLight = this.lightCount < this.maxLights && Math.random() < 0.1;
            
            const particle = this.createParticle(
                particlePos,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.5,
                { addLight: addLight }
            );
            
            if (addLight) {
                this.lightCount++;
            }
            
            // Add outward velocity
            const outDirection = new THREE.Vector3(
                Math.cos(angle),
                0.5 + Math.random(),
                Math.sin(angle)
            );
            
            particle.velocity.copy(outDirection.multiplyScalar(2 + Math.random() * 3));
        }
        
        // Create a small explosion effect (simplified geometry)
        const explosionGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Add a point light (only if we haven't reached the limit)
        let light = null;
        if (this.lightCount < this.maxLights) {
            light = new THREE.PointLight(0xff6600, 2, 3);
            light.position.copy(position);
            this.scene.add(light);
            this.lightCount++;
        }
        
        // Animate explosion with better RAF management
        const startTime = Date.now();
        let animationFrameId = null;
        
        const animateExplosion = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 0.3; // 0.3 second animation
            
            if (progress < 1) {
                // Scale up and fade out
                const scale = 1 + progress * 2;
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = 0.8 * (1 - progress);
                
                // Reduce light intensity
                if (light) {
                    light.intensity = 2 * (1 - progress);
                }
                
                animationFrameId = requestAnimationFrame(animateExplosion);
            } else {
                // Remove explosion
                this.scene.remove(explosion);
                if (light) {
                    this.scene.remove(light);
                    this.lightCount--;
                }
                explosion.geometry.dispose();
                explosion.material.dispose();
                animationFrameId = null;
            }
        };
        
        animationFrameId = requestAnimationFrame(animateExplosion);
    }
    
    // Create impact effect using instanced particles
    createInstancedImpactEffect(position) {
        if (!this.particleInstances) return;
        
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const color = new THREE.Color();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            // Find an available instance slot
            let instanceIndex = -1;
            for (let j = 0; j < this.particleInstanceData.length; j++) {
                if (!this.particleInstanceData[j].active) {
                    instanceIndex = j;
                    break;
                }
            }
            
            // Skip if no slots available
            if (instanceIndex === -1) continue;
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.5;
            
            const particlePos = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + Math.random() * 1,
                position.z + Math.sin(angle) * radius
            );
            
            // Set random size
            const size = 0.1 + Math.random() * 0.2;
            
            // Set random lifetime
            const life = 0.3 + Math.random() * 0.5;
            
            // Set random rotation
            quaternion.setFromAxisAngle(
                new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                Math.random() * Math.PI * 2
            );
            
            // Set outward velocity
            const outDirection = new THREE.Vector3(
                Math.cos(angle),
                0.5 + Math.random(),
                Math.sin(angle)
            );
            const velocity = outDirection.multiplyScalar(2 + Math.random() * 3);
            
            // Update instance data
            this.particleInstanceData[instanceIndex] = {
                active: true,
                position: particlePos.clone(),
                velocity: velocity,
                scale: size,
                rotation: quaternion.clone(),
                life: life,
                maxLife: life,
                noGravity: false
            };
            
            // Set matrix
            matrix.compose(
                particlePos,
                quaternion,
                new THREE.Vector3(size, size, size)
            );
            
            // Apply to instance
            this.particleInstances.setMatrixAt(instanceIndex, matrix);
            
            // Set color (orange-red variations)
            const hue = 0.05 + Math.random() * 0.05;
            color.setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            this.particleInstances.setColorAt(instanceIndex, color);
        }
        
        // Update instance matrices
        this.particleInstances.instanceMatrix.needsUpdate = true;
        
        // Update instance colors if available
        if (this.particleInstances.instanceColor) {
            this.particleInstances.instanceColor.needsUpdate = true;
        }
        
        // Create a small explosion effect
        const explosionGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Add a point light (only if we haven't reached the limit)
        let light = null;
        if (this.lightCount < this.maxLights) {
            light = new THREE.PointLight(0xff6600, 2, 3);
            light.position.copy(position);
            this.scene.add(light);
            this.lightCount++;
        }
        
        // Animate explosion
        const startTime = Date.now();
        let animationFrameId = null;
        
        const animateExplosion = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 0.3; // 0.3 second animation
            
            if (progress < 1) {
                // Scale up and fade out
                const scale = 1 + progress * 2;
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = 0.8 * (1 - progress);
                
                // Reduce light intensity
                if (light) {
                    light.intensity = 2 * (1 - progress);
                }
                
                animationFrameId = requestAnimationFrame(animateExplosion);
            } else {
                // Remove explosion
                this.scene.remove(explosion);
                if (light) {
                    this.scene.remove(light);
                    this.lightCount--;
                }
                explosion.geometry.dispose();
                explosion.material.dispose();
                animationFrameId = null;
            }
        };
        
        animationFrameId = requestAnimationFrame(animateExplosion);
    }

    updateEffect(delta) {
        // Update the active effect position and direction to follow the player
        if (this.activeEffects.length > 0) {
            const effect = this.activeEffects[0];
            const origin = this.hero.group.position.clone();
            origin.y += 1.2;
            
            effect.position = origin;
            effect.direction = this.hero.direction.clone();
            
            // Update dragon head position and rotation if it exists
            if (this.dragonHeadMesh) {
                this.dragonHeadMesh.position.copy(origin);
                this.dragonHeadMesh.lookAt(origin.clone().add(this.hero.direction));
            }
            
            // Update flame cone position and rotation if it exists
            if (this.flameCone) {
                this.flameCone.position.copy(origin);
                this.flameCone.lookAt(origin.clone().add(this.hero.direction));
            }
            
            // Update heat distortion position and rotation if it exists
            if (this.heatDistortion) {
                this.heatDistortion.position.copy(this.hero.group.position.clone());
                this.heatDistortion.position.y += 0.1;
                this.heatDistortion.rotation.y = Math.atan2(
                    this.hero.direction.x,
                    this.hero.direction.z
                );
            }
        }
        
        // Update instanced particles if using GPU instancing
        if (this.useGPUInstancing && this.particleInstances) {
            this.updateInstancedParticles(delta);
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
    
    // Update instanced particles for better GPU performance
    updateInstancedParticles(delta) {
        if (!this.particleInstances) return;
        
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        // Update each active particle
        for (let i = 0; i < this.particleInstanceData.length; i++) {
            const particle = this.particleInstanceData[i];
            if (!particle || !particle.active) continue;
            
            // Update life
            particle.life -= delta;
            
            // If particle is dead, deactivate it
            if (particle.life <= 0) {
                particle.active = false;
                
                // Hide the particle by scaling to 0
                matrix.makeScale(0, 0, 0);
                this.particleInstances.setMatrixAt(i, matrix);
                continue;
            }
            
            // Update position based on velocity
            particle.position.addScaledVector(particle.velocity, delta);
            
            // Apply gravity if not specified otherwise
            if (!particle.noGravity) {
                particle.velocity.y -= 9.8 * delta;
            }
            
            // Calculate life percentage
            const lifePercent = particle.life / particle.maxLife;
            
            // Update scale - shrink as it gets older
            const newScale = particle.scale * (0.5 + lifePercent * 0.5);
            
            // Update matrix
            matrix.compose(
                particle.position,
                particle.rotation,
                new THREE.Vector3(newScale, newScale, newScale)
            );
            
            // Apply to instance
            this.particleInstances.setMatrixAt(i, matrix);
        }
        
        // Update instance matrices
        this.particleInstances.instanceMatrix.needsUpdate = true;
    }
    
    createAdditionalParticles() {
        // Create additional particles for continuous effect
        const origin = this.hero.group.position.clone();
        origin.y += 1.2;
        const direction = this.hero.direction.clone();
        
        // Use GPU instancing if enabled
        if (this.useGPUInstancing && this.particleInstances) {
            this.createInstancedAdditionalParticles(origin, direction);
            return;
        }
        
        // Create fewer particles for the continuous effect
        const particleCount = Math.floor(this.particleCount / 6); // Further reduced for better performance
        
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
            
            // Simplify particle types
            const particleType = Math.floor(Math.random() * 3);
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Create particle
            const particle = this.createParticle(
                position,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.5,
                { 
                    type: particleType,
                    noGravity: true
                }
            );
            
            // Add some velocity
            particle.velocity.copy(particleDir)
                .multiplyScalar(3 + Math.random() * 3);
            
            // Add some random velocity
            particle.velocity.x += (Math.random() - 0.5) * 2;
            particle.velocity.y += (Math.random() - 0.5) * 2;
            particle.velocity.z += (Math.random() - 0.5) * 2;
        }
        
        // Create ember particles that float upward (reduced count)
        const emberCount = this.lightCount < this.maxLights ? 2 : 0; // Only create embers if we have light capacity
        
        for (let i = 0; i < emberCount; i++) {
            const angle = (Math.random() - 0.5) * this.width;
            const particleDir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            // Calculate distance along the cone
            const distance = Math.random() * this.range * 0.7;
            
            // Calculate position
            const position = origin.clone().add(
                particleDir.clone().multiplyScalar(distance)
            );
            
            // Create ember particle
            const ember = this.createParticle(
                position,
                0xff9900, // Bright orange
                0.05 + Math.random() * 0.1, // Small size
                1.0 + Math.random() * 1.0, // Longer life
                { 
                    type: 1, // Tetrahedron
                    addLight: true, // Add light
                    noGravity: true // No gravity
                }
            );
            
            this.lightCount++;
            
            // Add upward velocity
            ember.velocity.set(
                (Math.random() - 0.5) * 2,
                2 + Math.random() * 3,
                (Math.random() - 0.5) * 2
            );
            
            // Store for tracking
            this.fireEmbers.push(ember);
        }
    }
    
    // Create additional particles using GPU instancing
    createInstancedAdditionalParticles(origin, direction) {
        if (!this.particleInstances) return;
        
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const color = new THREE.Color();
        
        // Create fewer particles for the continuous effect
        const particleCount = Math.floor(this.particleCount / 6);
        
        for (let i = 0; i < particleCount; i++) {
            // Find an available instance slot
            let instanceIndex = -1;
            for (let j = 0; j < this.particleInstanceData.length; j++) {
                if (!this.particleInstanceData[j].active) {
                    instanceIndex = j;
                    break;
                }
            }
            
            // Skip if no slots available
            if (instanceIndex === -1) continue;
            
            const angle = (Math.random() - 0.5) * this.width;
            const particleDir = direction.clone()
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            // Calculate distance along the cone
            const distance = Math.random() * this.range;
            
            // Calculate position
            const position = origin.clone().add(
                particleDir.clone().multiplyScalar(distance)
            );
            
            // Set random size
            const size = 0.1 + Math.random() * 0.2;
            
            // Set random lifetime
            const life = 0.3 + Math.random() * 0.5;
            
            // Set random rotation
            quaternion.setFromAxisAngle(
                new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
                Math.random() * Math.PI * 2
            );
            
            // Set velocity
            const velocity = particleDir.clone().multiplyScalar(3 + Math.random() * 3);
            velocity.x += (Math.random() - 0.5) * 2;
            velocity.y += (Math.random() - 0.5) * 2;
            velocity.z += (Math.random() - 0.5) * 2;
            
            // Update instance data
            this.particleInstanceData[instanceIndex] = {
                active: true,
                position: position.clone(),
                velocity: velocity,
                scale: size,
                rotation: quaternion.clone(),
                life: life,
                maxLife: life,
                noGravity: true
            };
            
            // Set matrix
            matrix.compose(
                position,
                quaternion,
                new THREE.Vector3(size, size, size)
            );
            
            // Apply to instance
            this.particleInstances.setMatrixAt(instanceIndex, matrix);
            
            // Set color (orange-red variations)
            const hue = 0.05 + Math.random() * 0.05;
            color.setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            this.particleInstances.setColorAt(instanceIndex, color);
        }
        
        // Update instance matrices
        this.particleInstances.instanceMatrix.needsUpdate = true;
        
        // Update instance colors if available
        if (this.particleInstances.instanceColor) {
            this.particleInstances.instanceColor.needsUpdate = true;
        }
    }
    
    cleanup() {
        // Cancel any animation frames first
        this.cancelAllAnimations();
        
        // Clean up instanced particles
        if (this.particleInstances) {
            this.scene.remove(this.particleInstances);
            this.particleInstances.geometry.dispose();
            this.particleInstances.material.dispose();
            this.particleInstances = null;
            this.particleInstanceData = [];
            this.particleInstanceCount = 0;
        }
        
        // Clean up dragon head
        if (this.dragonHeadMesh) {
            this.scene.remove(this.dragonHeadMesh);
            this.dragonHeadMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.dragonHeadMesh = null;
        }
        
        // Clean up flame cone
        if (this.flameCone) {
            this.scene.remove(this.flameCone);
            this.flameCone.geometry.dispose();
            this.flameCone.material.dispose();
            this.flameCone = null;
        }
        
        // Clean up heat distortion
        if (this.heatDistortion) {
            this.scene.remove(this.heatDistortion);
            this.heatDistortion.geometry.dispose();
            this.heatDistortion.material.dispose();
            this.heatDistortion = null;
        }
        
        // Clean up fire ring
        if (this.fireRing) {
            this.scene.remove(this.fireRing);
            if (this.fireRing.userData.light) {
                this.scene.remove(this.fireRing.userData.light);
                this.lightCount--;
            }
            this.fireRing.geometry.dispose();
            this.fireRing.material.dispose();
            this.fireRing = null;
        }
        
        // Clean up flame waves
        this.flameWaves.forEach(wave => {
            this.scene.remove(wave);
            wave.geometry.dispose();
            wave.material.dispose();
        });
        this.flameWaves = [];
        
        // Reset light count
        this.lightCount = 0;
        
        // Call parent cleanup to handle regular particles
        super.cleanup();
        
        // Fire embers are cleaned up by the parent class's cleanup method
        this.fireEmbers = [];
    }
    
    // Cancel all animation frames to prevent memory leaks
    cancelAllAnimations() {
        // Cancel flame cone animation
        if (this.flameCone && this.flameCone.userData.animationFrameId) {
            cancelAnimationFrame(this.flameCone.userData.animationFrameId);
            this.flameCone.userData.animationFrameId = null;
        }
        
        // Cancel heat distortion animation
        if (this.heatDistortion && this.heatDistortion.userData.animationFrameId) {
            cancelAnimationFrame(this.heatDistortion.userData.animationFrameId);
            this.heatDistortion.userData.animationFrameId = null;
        }
        
        // Cancel fire ring animation
        if (this.fireRing && this.fireRing.userData.animationFrameId) {
            cancelAnimationFrame(this.fireRing.userData.animationFrameId);
            this.fireRing.userData.animationFrameId = null;
        }
        
        // Cancel flame wave animations
        this.flameWaves.forEach(wave => {
            if (wave.userData.animationFrameId) {
                cancelAnimationFrame(wave.userData.animationFrameId);
                wave.userData.animationFrameId = null;
            }
        });
    }
}
