import Skill from '../skill.js';
import * as THREE from 'three';

export default class IceBlast extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Ice Blast";
        this.manaCost = 40;
        this.damage = 70;
        this.range = 25; // Increased range from 15 to 25
        this.projectileSpeed = 20; // Increased speed from 15 to 20
        this.freezeDuration = 2.5; // Slightly increased freeze duration
        this.aoeRadius = 4; // Increased AOE radius from 3 to 4
        this.projectile = null;
        this.projectileStartPosition = null;
        this.projectileDirection = null;
        this.projectileDistance = 0;
        this.trailParticleRate = 0.05; // Controls how often trail particles spawn
        this.trailParticleTimer = 0;
    }

    getCooldownDuration() {
        // DEBOUNCE: 1 second cooldown to prevent spam
        return 1.0;
    }

    createEffect() {
        // Create an enhanced ice crystal projectile that explodes on impact
        const origin = this.hero.group.position.clone();
        origin.y += 1.5; // Start at head level
        
        const direction = this.hero.direction.clone();
        
        // Create projectile group
        const projectileGroup = new THREE.Group();
        projectileGroup.position.copy(origin);
        this.scene.add(projectileGroup);
        
        // Create the core ice crystal (trunk) - more complex geometry
        const coreGeometry = new THREE.DodecahedronGeometry(0.35, 1);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.9,
            shininess: 100,
            emissive: 0x0088ff,
            emissiveIntensity: 0.5,
            envMap: null, // Would use environment map if available
            refractionRatio: 0.98,
            reflectivity: 0.9
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectileGroup.add(core);
        
        // Add a point light inside the core for glow effect
        const coreLight = new THREE.PointLight(0x00ccff, 1, 3);
        coreLight.position.set(0, 0, 0);
        core.add(coreLight);
        
        // Create outer ice shell
        const shellGeometry = new THREE.IcosahedronGeometry(0.5, 1);
        const shellMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.4,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2,
            wireframe: true
        });
        
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        projectileGroup.add(shell);
        
        // Create ice crystal branches - more of them and more varied
        const branchCount = 8;
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const heightOffset = (i % 2) * 0.2; // Alternate heights
            
            // Create branch geometry - elongated crystal
            const branchGeometry = new THREE.ConeGeometry(0.1, 0.6, 4);
            const branchMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.8,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.3
            });
            
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            
            // Position branch on core
            branch.position.set(
                Math.cos(angle) * 0.4,
                Math.sin(angle) * 0.4,
                heightOffset
            );
            
            // Rotate branch to point outward
            branch.rotation.z = angle + Math.PI / 2;
            branch.rotation.x = Math.PI / 6; // Tilt slightly
            
            projectileGroup.add(branch);
            
            // Add smaller crystal at end of branch (leaf)
            const leafGeometry = new THREE.TetrahedronGeometry(0.12);
            const leafMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.4
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position at end of branch
            leaf.position.set(
                Math.cos(angle) * 0.7,
                Math.sin(angle) * 0.7,
                heightOffset
            );
            
            // Random rotation
            leaf.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            projectileGroup.add(leaf);
            
            // Add a tiny light at the tip of each branch
            const tipLight = new THREE.PointLight(0x00ccff, 0.5, 1);
            tipLight.position.copy(leaf.position);
            projectileGroup.add(tipLight);
        }
        
        // Add some smaller crystals (leaves) randomly distributed - more of them
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.4;
            const zOffset = (Math.random() - 0.5) * 0.6;
            
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 4);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.08);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.06);
                    break;
                case 2:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.05);
                    break;
                default:
                    crystalGeometry = new THREE.DodecahedronGeometry(0.07);
            }
            
            const crystalMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.3
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position randomly around core
            crystal.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                zOffset
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            projectileGroup.add(crystal);
        }
        
        // Add frost particles orbiting the projectile
        const particleCount = 30;
        const particleOrbit = new THREE.Object3D();
        projectileGroup.add(particleOrbit);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 0.6 + Math.random() * 0.2;
            
            const particle = this.createParticle(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    (Math.random() - 0.5) * 0.4
                ),
                0xaaddff, // Light blue
                0.05 + Math.random() * 0.05,
                2.0, // Longer life
                { 
                    addLight: i % 5 === 0, // Add light to some particles
                    noGravity: true // No gravity for orbiting particles
                }
            );
            
            // Store the original position for orbit calculation
            particle.orbitRadius = radius;
            particle.orbitAngle = angle;
            particle.orbitSpeed = 1 + Math.random() * 2;
            
            // Add to orbit container instead of scene
            this.scene.remove(particle.mesh);
            particleOrbit.add(particle.mesh);
        }
        
        // Orient projectile in direction of travel
        projectileGroup.lookAt(origin.clone().add(direction));
        
        // Store projectile data
        this.projectile = projectileGroup;
        this.projectileStartPosition = origin.clone();
        this.projectileDirection = direction.clone();
        this.projectileDistance = 0;
        this.particleOrbit = particleOrbit;
        
        // Create initial trail particles
        for (let i = 0; i < 30; i++) {
            const position = origin.clone();
            position.x += (Math.random() - 0.5) * 0.4;
            position.y += (Math.random() - 0.5) * 0.4;
            position.z += (Math.random() - 0.5) * 0.4;
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.5 + Math.random() * 0.5,
                { addLight: i % 10 === 0 } // Add light to some particles
            );
            
            // Add slight backward velocity
            particle.velocity.copy(direction.clone().multiplyScalar(-1 - Math.random()));
            particle.velocity.y += (Math.random() - 0.5) * 2;
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-blast');
        }
    }

    updateEffect(delta) {
        if (!this.projectile) return;
        
        // Move projectile
        const moveDistance = this.projectileSpeed * delta;
        this.projectile.position.add(this.projectileDirection.clone().multiplyScalar(moveDistance));
        this.projectileDistance += moveDistance;
        
        // Rotate projectile for dynamic effect
        this.projectile.rotation.x += delta * 3;
        this.projectile.rotation.y += delta * 2;
        this.projectile.rotation.z += delta * 1;
        
        // Rotate the particle orbit in the opposite direction for interesting effect
        if (this.particleOrbit) {
            this.particleOrbit.rotation.x -= delta * 2;
            this.particleOrbit.rotation.y -= delta * 3;
            this.particleOrbit.rotation.z -= delta * 1.5;
        }
        
        // Create trail particles at regular intervals
        this.trailParticleTimer -= delta;
        if (this.trailParticleTimer <= 0) {
            this.trailParticleTimer = this.trailParticleRate;
            
            // Create multiple trail particles for a more substantial trail
            for (let i = 0; i < 3; i++) {
                const position = this.projectile.position.clone();
                position.x += (Math.random() - 0.5) * 0.4;
                position.y += (Math.random() - 0.5) * 0.4;
                position.z += (Math.random() - 0.5) * 0.4;
                
                // Randomize particle appearance
                const particleType = Math.floor(Math.random() * 5);
                const particleSize = 0.08 + Math.random() * 0.12;
                const particleLife = 0.3 + Math.random() * 0.7;
                
                // Create a more advanced particle
                const particle = this.createParticle(
                    position,
                    0x88ccff, // Light blue
                    particleSize,
                    particleLife,
                    { 
                        type: particleType,
                        addLight: Math.random() < 0.1, // 10% chance to add light
                        noGravity: Math.random() < 0.3 // 30% chance to have no gravity
                    }
                );
                
                // Add slight backward velocity with some randomness
                particle.velocity.copy(this.projectileDirection.clone().multiplyScalar(-1 - Math.random() * 2));
                particle.velocity.x += (Math.random() - 0.5) * 2;
                particle.velocity.y += (Math.random() - 0.5) * 2;
                particle.velocity.z += (Math.random() - 0.5) * 2;
            }
        }
        
        // Check for collision with enemies
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        let hitEnemy = false;
        
        enemies.forEach(enemy => {
            if (hitEnemy) return; // Only hit one enemy
            
            const distance = enemy.position.distanceTo(this.projectile.position);
            
            if (distance <= 1.5) { // Increased hit radius for better gameplay
                hitEnemy = true;
                
                // Create explosion effect
                this.createExplosion(this.projectile.position.clone());
                
                // Apply damage to all enemies in explosion radius
                enemies.forEach(aoeEnemy => {
                    const aoeDistance = aoeEnemy.position.distanceTo(this.projectile.position);
                    
                    if (aoeDistance <= this.aoeRadius) {
                        // Apply damage with falloff based on distance
                        const damageMultiplier = 1 - (aoeDistance / this.aoeRadius);
                        aoeEnemy.takeDamage(this.damage * damageMultiplier);
                        
                        // Apply freeze effect
                        if (!aoeEnemy.frozen) {
                            aoeEnemy.frozen = true;
                            aoeEnemy.originalSpeed = aoeEnemy.speed;
                            aoeEnemy.speed = 0;
                            
                            // Create enhanced ice crystal prison on enemy
                            this.createIcePrison(aoeEnemy);
                            
                            // Reset freeze after duration
                            setTimeout(() => {
                                if (aoeEnemy.frozen) {
                                    aoeEnemy.speed = aoeEnemy.originalSpeed;
                                    aoeEnemy.frozen = false;
                                    
                                    // Create shatter effect when ice breaks
                                    if (aoeEnemy.icePrison) {
                                        this.createShatterEffect(aoeEnemy.icePrison.position.clone());
                                        this.scene.remove(aoeEnemy.icePrison);
                                        aoeEnemy.icePrison.traverse(child => {
                                            if (child.geometry) child.geometry.dispose();
                                            if (child.material) child.material.dispose();
                                        });
                                        aoeEnemy.icePrison = null;
                                    }
                                }
                            }, this.freezeDuration * 1000);
                        }
                    }
                });
            }
        });
        
        // Check for max range
        if (this.projectileDistance >= this.range || hitEnemy) {
            // If max range reached without hitting enemy, create explosion at end point
            if (!hitEnemy && this.projectileDistance >= this.range) {
                this.createExplosion(this.projectile.position.clone());
            }
            
            // Remove projectile
            this.scene.remove(this.projectile);
            this.projectile.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.projectile = null;
            this.particleOrbit = null;
        }
    }
    
    // Create an enhanced ice prison around the frozen enemy
    createIcePrison(enemy) {
        // Create a group for the ice prison
        const prisonGroup = new THREE.Group();
        prisonGroup.position.copy(enemy.position);
        prisonGroup.position.y += 1; // Center at enemy's middle
        this.scene.add(prisonGroup);
        
        // Store reference to the prison on the enemy
        enemy.icePrison = prisonGroup;
        
        // Create main ice crystal encasing
        const mainGeometry = new THREE.IcosahedronGeometry(1.2, 1);
        const mainMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.6,
            shininess: 100,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2,
            wireframe: false,
            flatShading: true
        });
        
        const mainCrystal = new THREE.Mesh(mainGeometry, mainMaterial);
        prisonGroup.add(mainCrystal);
        
        // Add inner glow
        const glowGeometry = new THREE.IcosahedronGeometry(1.0, 1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ccff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        prisonGroup.add(glow);
        
        // Add a point light for the ice prison glow
        const prisonLight = new THREE.PointLight(0x00ccff, 1, 3);
        prisonLight.position.set(0, 0, 0);
        prisonGroup.add(prisonLight);
        
        // Add ice spikes protruding from the main crystal
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const radius = 1.0;
            
            const spikeGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
            const spikeMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.8,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.3
            });
            
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            
            // Position spike on the surface of the main crystal
            spike.position.set(
                Math.cos(angle) * radius,
                0.3 * (i % 3 - 1), // Vary height
                Math.sin(angle) * radius
            );
            
            // Rotate spike to point outward
            spike.lookAt(new THREE.Vector3(0, 0, 0));
            spike.rotateX(Math.PI / 2);
            
            prisonGroup.add(spike);
        }
        
        // Add frost particles around the prison
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 2;
            const radius = 1.3 + Math.random() * 0.3;
            
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xaaddff, // Light blue
                0.05 + Math.random() * 0.05,
                this.freezeDuration, // Match freeze duration
                { 
                    noGravity: true,
                    addLight: i % 10 === 0
                }
            );
            
            // Slow orbit around the prison
            particle.velocity.set(
                Math.sin(angle) * 0.2,
                (Math.random() - 0.5) * 0.1,
                -Math.cos(angle) * 0.2
            );
            
            // Add to prison group
            this.scene.remove(particle.mesh);
            prisonGroup.add(particle.mesh);
        }
        
        // Animate the prison appearing
        prisonGroup.scale.set(0.1, 0.1, 0.1);
        
        // Animation function
        const animateScale = () => {
            prisonGroup.scale.x += 0.15;
            prisonGroup.scale.y += 0.15;
            prisonGroup.scale.z += 0.15;
            
            if (prisonGroup.scale.x < 1) {
                requestAnimationFrame(animateScale);
            } else {
                prisonGroup.scale.set(1, 1, 1);
            }
        };
        
        // Start animation
        animateScale();
    }
    
    // Create shatter effect when ice prison breaks
    createShatterEffect(position) {
        // Create multiple ice shards flying outward
        for (let i = 0; i < 30; i++) {
            const direction = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize();
            
            const speed = 3 + Math.random() * 5;
            const size = 0.05 + Math.random() * 0.15;
            
            // Create a shard particle
            const particle = this.createParticle(
                position.clone().add(direction.clone().multiplyScalar(0.2)),
                0xaaddff, // Light blue
                size,
                1.0 + Math.random() * 0.5,
                { 
                    type: Math.floor(Math.random() * 3) + 1, // Use crystal-like geometries
                    addLight: i % 15 === 0
                }
            );
            
            // Set velocity based on direction
            particle.velocity.copy(direction.multiplyScalar(speed));
            
            // Add rotation
            particle.rotationSpeed.x = (Math.random() - 0.5) * 10;
            particle.rotationSpeed.y = (Math.random() - 0.5) * 10;
            particle.rotationSpeed.z = (Math.random() - 0.5) * 10;
        }
        
        // Add a flash of light
        const flashLight = new THREE.PointLight(0x00ccff, 3, 10);
        flashLight.position.copy(position);
        this.scene.add(flashLight);
        
        // Fade out and remove the light
        let intensity = 3;
        const fadeLight = () => {
            intensity -= 0.2;
            if (intensity > 0) {
                flashLight.intensity = intensity;
                requestAnimationFrame(fadeLight);
            } else {
                this.scene.remove(flashLight);
            }
        };
        
        fadeLight();
    }
    
    createExplosion(position) {
        // Create explosion group
        const explosionGroup = new THREE.Group();
        explosionGroup.position.copy(position);
        this.scene.add(explosionGroup);
        
        // Add a bright flash at the center
        const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        explosionGroup.add(flash);
        
        // Add a point light for the explosion
        const explosionLight = new THREE.PointLight(0x00ccff, 3, 10);
        explosionLight.position.set(0, 0, 0);
        explosionGroup.add(explosionLight);
        
        // Create ice crystal explosion - multiple ice formations bursting outward
        const formationCount = 12; // Increased from 8
        const formations = [];
        
        for (let i = 0; i < formationCount; i++) {
            const angle = (i / formationCount) * Math.PI * 2;
            const formationGroup = new THREE.Group();
            
            // Position formation at explosion center
            formationGroup.position.set(0, 0, 0);
            
            // Choose a random formation type
            const formationType = Math.floor(Math.random() * 3);
            
            switch (formationType) {
                case 0: // Ice spike
                    this.createIceSpike(formationGroup);
                    break;
                case 1: // Ice crystal cluster
                    this.createIceCrystalCluster(formationGroup);
                    break;
                case 2: // Ice shard spray
                    this.createIceShardSpray(formationGroup);
                    break;
            }
            
            // Rotate to point in random direction
            formationGroup.rotation.x = Math.random() * Math.PI / 4; // Slight upward tilt
            formationGroup.rotation.y = angle; // Point outward
            
            explosionGroup.add(formationGroup);
            
            // Calculate direction based on rotation
            const direction = new THREE.Vector3(0, 0, 1);
            direction.applyEuler(formationGroup.rotation);
            
            formations.push({
                group: formationGroup,
                speed: 3 + Math.random() * 5, // Faster movement
                direction: direction,
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                )
            });
        }
        
        // Create frost particles - more of them
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            
            const direction = new THREE.Vector3(
                Math.sin(height) * Math.cos(angle),
                Math.cos(height),
                Math.sin(height) * Math.sin(angle)
            );
            
            const speed = 3 + Math.random() * 7; // Faster particles
            const size = 0.05 + Math.random() * 0.15;
            const particleType = Math.floor(Math.random() * 5);
            
            // Create a more advanced particle
            const particle = this.createParticle(
                position.clone(),
                0x88ccff, // Light blue
                size,
                0.5 + Math.random() * 1.0, // Longer life
                { 
                    type: particleType,
                    addLight: i % 20 === 0 // Add light to some particles
                }
            );
            
            particle.velocity.copy(direction.multiplyScalar(speed));
            
            // Add rotation
            particle.rotationSpeed.x = (Math.random() - 0.5) * 10;
            particle.rotationSpeed.y = (Math.random() - 0.5) * 10;
            particle.rotationSpeed.z = (Math.random() - 0.5) * 10;
        }
        
        // Create multiple shockwave rings
        const shockwaves = [];
        const shockwaveCount = 3;
        
        for (let i = 0; i < shockwaveCount; i++) {
            const shockwaveGeometry = new THREE.RingGeometry(0.1, 0.3, 32);
            const shockwaveMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xffffff : 0x88ccff, // First one is white, others blue
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
            shockwave.rotation.x = -Math.PI / 2; // Flat on ground
            shockwave.position.copy(position);
            shockwave.position.y += 0.05 + i * 0.1; // Stack them slightly
            this.scene.add(shockwave);
            
            shockwaves.push({
                mesh: shockwave,
                geometry: shockwaveGeometry,
                material: shockwaveMaterial,
                delay: i * 0.1, // Stagger the start times
                speed: 5 + i * 2 // Each one expands at different rate
            });
        }
        
        // Create ice mist effect
        const mistGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const mistMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const mist = new THREE.Mesh(mistGeometry, mistMaterial);
        mist.position.copy(position);
        this.scene.add(mist);
        
        // Create frost ground effect - enhanced version
        const frostGroundGeometry = new THREE.CircleGeometry(this.aoeRadius, 32);
        const frostGroundMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        
        const frostGround = new THREE.Mesh(frostGroundGeometry, frostGroundMaterial);
        frostGround.rotation.x = -Math.PI / 2; // Lay flat
        frostGround.position.copy(position);
        frostGround.position.y = 0.02; // Just above ground
        this.scene.add(frostGround);
        
        // Animate everything
        const startTime = Date.now();
        const duration = 1.5; // 1.5 seconds
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Flash fade out quickly
            if (flash) {
                flash.material.opacity = 0.9 * (1 - progress * 3);
                if (progress > 0.33) {
                    flash.material.opacity = 0;
                }
            }
            
            // Fade out explosion light
            if (explosionLight) {
                explosionLight.intensity = 3 * (1 - progress);
            }
            
            // Move formations outward with rotation
            formations.forEach(formation => {
                formation.group.position.add(
                    formation.direction.clone().multiplyScalar(formation.speed * 0.016)
                );
                
                formation.group.rotation.x += formation.rotationSpeed.x * 0.016;
                formation.group.rotation.y += formation.rotationSpeed.y * 0.016;
                formation.group.rotation.z += formation.rotationSpeed.z * 0.016;
                
                // Fade out as they move away
                formation.group.traverse(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity = Math.max(0, 0.8 * (1 - progress * 1.5));
                    }
                });
            });
            
            // Expand and fade shockwaves
            shockwaves.forEach(shockwave => {
                // Only start after delay
                if (elapsed > shockwave.delay) {
                    const shockwaveProgress = Math.min((elapsed - shockwave.delay) / (duration - shockwave.delay), 1);
                    const scale = 0.1 + shockwaveProgress * shockwave.speed;
                    shockwave.mesh.scale.set(scale, scale, 1);
                    shockwave.material.opacity = 0.8 * (1 - shockwaveProgress);
                }
            });
            
            // Expand and fade mist
            if (mist) {
                const mistScale = 0.5 + progress * 4;
                mist.scale.set(mistScale, mistScale, mistScale);
                mist.material.opacity = 0.3 * (1 - progress);
            }
            
            // Expand and fade frost ground
            if (frostGround) {
                const groundScale = 0.1 + progress * 1.5;
                frostGround.scale.set(groundScale, groundScale, 1);
                frostGround.material.opacity = 0.4 * (1 - progress * 0.7); // Fade out more slowly
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove all explosion elements
                this.scene.remove(explosionGroup);
                shockwaves.forEach(shockwave => {
                    this.scene.remove(shockwave.mesh);
                    shockwave.geometry.dispose();
                    shockwave.material.dispose();
                });
                this.scene.remove(mist);
                this.scene.remove(frostGround);
                
                // Dispose geometries and materials
                explosionGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                
                mistGeometry.dispose();
                mistMaterial.dispose();
                frostGroundGeometry.dispose();
                frostGroundMaterial.dispose();
            }
        };
        
        animate();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-explosion');
        }
    }
    
    // Helper method to create an ice spike formation
    createIceSpike(parent) {
        // Create main spike
        const spikeGeometry = new THREE.ConeGeometry(0.15, 1.2, 6);
        const spikeMaterial = new THREE.MeshPhongMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.8,
            shininess: 100,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3,
            flatShading: true
        });
        
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.rotation.x = -Math.PI / 2; // Point forward
        spike.position.z = 0.6; // Move forward
        parent.add(spike);
        
        // Add smaller spikes around the main one
        const smallSpikeCount = 4;
        for (let i = 0; i < smallSpikeCount; i++) {
            const angle = (i / smallSpikeCount) * Math.PI * 2;
            
            const smallSpikeGeometry = new THREE.ConeGeometry(0.05, 0.4, 4);
            const smallSpike = new THREE.Mesh(smallSpikeGeometry, spikeMaterial);
            
            smallSpike.position.set(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.2,
                0.3
            );
            
            smallSpike.rotation.x = -Math.PI / 2; // Point forward
            smallSpike.rotation.z = angle; // Rotate around main spike
            
            parent.add(smallSpike);
        }
        
        // Add a point light
        const spikeLight = new THREE.PointLight(0x00ccff, 0.5, 2);
        spikeLight.position.set(0, 0, 0.6);
        parent.add(spikeLight);
    }
    
    // Helper method to create an ice crystal cluster
    createIceCrystalCluster(parent) {
        // Create a cluster of crystals
        const crystalCount = 7;
        
        for (let i = 0; i < crystalCount; i++) {
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 4);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.15 + Math.random() * 0.1);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.12 + Math.random() * 0.08);
                    break;
                case 2:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.1 + Math.random() * 0.07);
                    break;
                default:
                    crystalGeometry = new THREE.DodecahedronGeometry(0.13 + Math.random() * 0.09);
            }
            
            // Vary the crystal color slightly
            const hue = 0.55 + (Math.random() - 0.5) * 0.1; // Blue range
            const saturation = 0.6 + Math.random() * 0.4;
            const lightness = 0.7 + Math.random() * 0.3;
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            
            const crystalMaterial = new THREE.MeshPhongMaterial({
                color: color,
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3,
                shininess: 90 + Math.random() * 30,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2 + Math.random() * 0.2,
                flatShading: Math.random() > 0.5 // 50% chance of flat shading
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position randomly in a cluster
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3;
            const height = (Math.random() - 0.5) * 0.3;
            
            crystal.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0.3 + height
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            parent.add(crystal);
            
            // Add a tiny light to some crystals
            if (i === 0 || Math.random() < 0.3) {
                const crystalLight = new THREE.PointLight(0x00ccff, 0.3, 1);
                crystalLight.position.copy(crystal.position);
                parent.add(crystalLight);
            }
        }
    }
    
    // Helper method to create an ice shard spray
    createIceShardSpray(parent) {
        // Create a spray of small ice shards
        const shardCount = 15;
        
        for (let i = 0; i < shardCount; i++) {
            // Create a thin, sharp shard
            const shardGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.2 + Math.random() * 0.3);
            
            // Taper the shard by scaling one end
            shardGeometry.scale(1, 1, 1);
            for (let v = 0; v < shardGeometry.attributes.position.count; v++) {
                const z = shardGeometry.attributes.position.getZ(v);
                if (z > 0) {
                    // Scale down the vertices at the back
                    const scale = 1 - (z / 0.5) * 0.8;
                    shardGeometry.attributes.position.setX(v, shardGeometry.attributes.position.getX(v) * scale);
                    shardGeometry.attributes.position.setY(v, shardGeometry.attributes.position.getY(v) * scale);
                }
            }
            shardGeometry.computeVertexNormals();
            
            const shardMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2,
                flatShading: true
            });
            
            const shard = new THREE.Mesh(shardGeometry, shardMaterial);
            
            // Position in a cone shape
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.2;
            const forwardOffset = 0.2 + Math.random() * 0.4;
            
            shard.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                forwardOffset
            );
            
            // Random rotation, but generally pointing forward
            shard.rotation.set(
                (Math.random() - 0.5) * Math.PI / 2,
                (Math.random() - 0.5) * Math.PI / 2,
                Math.random() * Math.PI * 2
            );
            
            parent.add(shard);
        }
        
        // Add a central flash
        const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.z = 0.2;
        parent.add(flash);
        
        // Add a point light
        const sprayLight = new THREE.PointLight(0x00ccff, 0.7, 2);
        sprayLight.position.set(0, 0, 0.2);
        parent.add(sprayLight);
    }
}