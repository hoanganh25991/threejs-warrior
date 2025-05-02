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
        this.particleCount = 80; // Increased particle count
        this.damageType = 'fire';
        this.damageInterval = 0.2; // Apply damage every 0.2 seconds
        this.damageTimer = 0;
        
        // Visual effect elements
        this.dragonHeadMesh = null;
        this.flameCone = null;
        this.fireRing = null;
        this.fireEmbers = [];
        this.flameWaves = [];
        this.heatDistortion = null;
    }

    getCooldownDuration() {
        return 8.0;
    }

    createEffect() {
        // Create origin and direction
        const origin = this.hero.group.position.clone();
        origin.y += 1.2; // Position slightly above the hero
        const direction = this.hero.direction.clone();
        
        // Create dragon head effect
        this.createDragonHead(origin, direction);
        
        // Create flame cone
        this.createFlameCone(origin, direction);
        
        // Create heat distortion effect
        this.createHeatDistortion(origin, direction);
        
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
                // Create additional effects on hit
                hitEnemies.forEach(hit => {
                    this.createImpactEffect(hit.position);
                });
            }
        });
        
        // Reset damage timer
        this.damageTimer = 0;
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
        // Create a cone geometry for the flame
        const coneGeometry = new THREE.ConeGeometry(this.width / 2, this.range, 16, 8);
        coneGeometry.rotateX(Math.PI / 2); // Rotate to point forward
        
        // Create a custom shader material for the flame effect
        const flameMaterial = new THREE.ShaderMaterial({
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
                
                // Simplex noise function
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    
                    // First corner
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
                    
                    // Other corners
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min(g.xyz, l.zxy);
                    vec3 i2 = max(g.xyz, l.zxy);
                    
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    
                    // Permutations
                    i = mod289(i);
                    vec4 p = permute(permute(permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                        
                    // Gradients
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
                    
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    
                    vec4 b0 = vec4(x.xy, y.xy);
                    vec4 b1 = vec4(x.zw, y.zw);
                    
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                    
                    vec3 p0 = vec3(a0.xy, h.x);
                    vec3 p1 = vec3(a0.zw, h.y);
                    vec3 p2 = vec3(a1.xy, h.z);
                    vec3 p3 = vec3(a1.zw, h.w);
                    
                    // Normalise gradients
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    
                    // Mix final noise value
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
                }
                
                void main() {
                    // Create noise based on position and time
                    float noise = snoise(vec3(vPosition.x * 2.0, vPosition.y * 2.0, vPosition.z * 2.0 + time * 3.0));
                    
                    // Mix colors based on noise and position
                    vec3 color = mix(color1, color2, noise * 0.5 + 0.5);
                    
                    // Fade out at the edges and tip
                    float edge = 1.0 - length(vUv - vec2(0.5, 0.5)) * 1.5;
                    float tip = 1.0 - vUv.y;
                    
                    // Combine for final opacity
                    float opacity = edge * tip * (0.8 + noise * 0.2);
                    
                    // Add flickering
                    opacity *= 0.7 + 0.3 * sin(time * 20.0 + vPosition.x * 10.0);
                    
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create the flame cone mesh
        this.flameCone = new THREE.Mesh(coneGeometry, flameMaterial);
        this.flameCone.position.copy(origin);
        
        // Rotate to face direction
        this.flameCone.lookAt(origin.clone().add(direction));
        
        // Add to scene
        this.scene.add(this.flameCone);
        
        // Animate the flame
        const startTime = Date.now();
        const animateFlame = () => {
            if (!this.flameCone) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            this.flameCone.material.uniforms.time.value = elapsed;
            
            if (elapsed < this.duration) {
                requestAnimationFrame(animateFlame);
            } else {
                // Remove the flame cone after duration
                this.scene.remove(this.flameCone);
                this.flameCone.geometry.dispose();
                this.flameCone.material.dispose();
                this.flameCone = null;
            }
        };
        
        animateFlame();
    }
    
    createHeatDistortion(origin, direction) {
        // Create a plane for the heat distortion effect
        const planeGeometry = new THREE.PlaneGeometry(this.width * 1.5, this.range * 1.2, 20, 20);
        planeGeometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
        
        // Create a custom shader material for heat distortion
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
                    // Create heat distortion pattern
                    float distortion = sin(vUv.x * 20.0 + time * 5.0) * sin(vUv.y * 20.0 + time * 3.0) * 0.1;
                    
                    // Fade out at edges
                    float edge = 1.0 - length(vUv - vec2(0.5, 0.5)) * 2.0;
                    edge = max(0.0, edge);
                    
                    // Fade out based on y position (distance from origin)
                    float fadeY = 1.0 - vUv.y;
                    
                    float opacity = edge * fadeY * 0.3 * (0.5 + distortion);
                    
                    gl_FragColor = vec4(1.0, 0.6, 0.2, opacity);
                }
            `,
            transparent: true,
            depthWrite: false
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
        
        // Animate the heat distortion
        const startTime = Date.now();
        const animateHeat = () => {
            if (!this.heatDistortion) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            this.heatDistortion.material.uniforms.time.value = elapsed;
            
            if (elapsed < this.duration) {
                requestAnimationFrame(animateHeat);
            } else {
                // Remove after duration
                this.scene.remove(this.heatDistortion);
                this.heatDistortion.geometry.dispose();
                this.heatDistortion.material.dispose();
                this.heatDistortion = null;
            }
        };
        
        animateHeat();
    }
    
    createFireRing(position) {
        // Create a ring geometry
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.3, 16, 32);
        ringGeometry.rotateX(Math.PI / 2); // Lay flat on the ground
        
        // Create a material with fire texture
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7
        });
        
        // Create the ring mesh
        this.fireRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this.fireRing.position.copy(position);
        this.fireRing.position.y += 0.1; // Slightly above ground
        
        // Add to scene
        this.scene.add(this.fireRing);
        
        // Add a point light in the center of the ring
        const ringLight = new THREE.PointLight(0xff6600, 1, 3);
        ringLight.position.copy(position);
        ringLight.position.y += 0.5;
        this.scene.add(ringLight);
        this.fireRing.userData.light = ringLight;
        
        // Animate the fire ring
        const startTime = Date.now();
        const animateRing = () => {
            if (!this.fireRing) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / this.duration;
            
            // Scale up and fade out
            const scale = 1 + progress * 1.5;
            this.fireRing.scale.set(scale, scale, scale);
            
            // Fade out
            this.fireRing.material.opacity = 0.7 * (1 - progress);
            
            // Rotate
            this.fireRing.rotation.z += 0.05;
            
            // Update light intensity
            if (this.fireRing.userData.light) {
                this.fireRing.userData.light.intensity = 1 * (1 - progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateRing);
            } else {
                // Remove after duration
                this.scene.remove(this.fireRing);
                if (this.fireRing.userData.light) {
                    this.scene.remove(this.fireRing.userData.light);
                }
                this.fireRing.geometry.dispose();
                this.fireRing.material.dispose();
                this.fireRing = null;
            }
        };
        
        animateRing();
    }
    
    createFlameWave(origin, direction) {
        // Create a wave that travels along the ground
        const waveGeometry = new THREE.PlaneGeometry(this.width, 1, 10, 1);
        waveGeometry.rotateX(-Math.PI / 2); // Lay flat
        
        // Create a material for the flame wave
        const waveMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 1,
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
        
        // Animate the wave
        const startTime = Date.now();
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
                wave.position.y = 0.1 + Math.sin(elapsed * 10) * 0.1; // Add bobbing motion
                
                // Scale based on distance
                const scaleX = 1 + progress * 2;
                const scaleZ = 1 + progress * 0.5;
                wave.scale.set(scaleX, 1, scaleZ);
                
                requestAnimationFrame(animateWave);
            } else {
                // Remove wave
                this.scene.remove(wave);
                wave.geometry.dispose();
                wave.material.dispose();
                const index = this.flameWaves.indexOf(wave);
                if (index > -1) {
                    this.flameWaves.splice(index, 1);
                }
            }
        };
        
        animateWave();
        
        // Create additional waves at intervals
        if (this.duration > 0.5) {
            setTimeout(() => {
                if (this.isActive) {
                    this.createFlameWave(
                        this.hero.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
                        this.hero.direction.clone()
                    );
                }
            }, 500); // Create a new wave every 0.5 seconds
        }
    }
    
    createBreathParticles(origin, direction) {
        // Create main breath particles
        for (let i = 0; i < this.particleCount; i++) {
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
            
            // Randomize particle type
            const particleType = Math.floor(Math.random() * 5);
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05; // Orange-red hue
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            // Create particle with different sizes
            const size = 0.1 + Math.random() * 0.3;
            
            // Create particle with random lifetime
            const life = 0.5 + Math.random() * 1.5;
            
            // Create particle with light for some particles
            const addLight = Math.random() < 0.1; // 10% chance to add light
            
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
    
    createImpactEffect(position) {
        // Create a burst of particles at impact point
        for (let i = 0; i < 15; i++) {
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
            
            const particle = this.createParticle(
                particlePos,
                color,
                0.1 + Math.random() * 0.2,
                0.3 + Math.random() * 0.5,
                { addLight: Math.random() < 0.2 }
            );
            
            // Add outward velocity
            const outDirection = new THREE.Vector3(
                Math.cos(angle),
                0.5 + Math.random(),
                Math.sin(angle)
            );
            
            particle.velocity.copy(outDirection.multiplyScalar(2 + Math.random() * 3));
        }
        
        // Create a small explosion effect
        const explosionGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const explosionMaterial = new THREE.MeshPhongMaterial({
            color: 0xff9900,
            emissive: 0xff6600,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);
        
        // Add a point light
        const light = new THREE.PointLight(0xff6600, 2, 3);
        light.position.copy(position);
        this.scene.add(light);
        
        // Animate explosion
        const startTime = Date.now();
        const animateExplosion = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / 0.3; // 0.3 second animation
            
            if (progress < 1) {
                // Scale up and fade out
                const scale = 1 + progress * 2;
                explosion.scale.set(scale, scale, scale);
                explosion.material.opacity = 0.8 * (1 - progress);
                
                // Reduce light intensity
                light.intensity = 2 * (1 - progress);
                
                requestAnimationFrame(animateExplosion);
            } else {
                // Remove explosion
                this.scene.remove(explosion);
                this.scene.remove(light);
                explosion.geometry.dispose();
                explosion.material.dispose();
            }
        };
        
        animateExplosion();
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
        
        // Update damage timer
        this.damageTimer += delta;
        
        // Apply damage at intervals
        if (this.damageTimer >= this.damageInterval) {
            this.damageTimer = 0;
            
            // Create additional fire particles in the cone
            this.createAdditionalParticles();
        }
    }
    
    createAdditionalParticles() {
        // Create additional particles for continuous effect
        const origin = this.hero.group.position.clone();
        origin.y += 1.2;
        const direction = this.hero.direction.clone();
        
        // Create fewer particles for the continuous effect
        const particleCount = Math.floor(this.particleCount / 4);
        
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
            
            // Randomize particle type
            const particleType = Math.floor(Math.random() * 5);
            
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
        
        // Create ember particles that float upward
        for (let i = 0; i < 5; i++) {
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
    
    cleanup() {
        super.cleanup();
        
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
        
        // Fire embers are cleaned up by the parent class's cleanup method
        this.fireEmbers = [];
    }
}
