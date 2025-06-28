import Skill from '../skill.js';
import * as THREE from 'three';

export default class CullingBlade extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 70;
        this.damage = 250; // High damage for execution
        this.range = 3;
        this.duration = 1.5;
        this.executionThreshold = 100; // Health threshold for instant kill
        this.bladeMesh = null;
        this.targetEnemy = null;
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Find the closest enemy in front of the hero
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            // Check if enemy is within range and in front of hero
            if (distance <= this.range) {
                const angle = toEnemy.angleTo(direction);
                if (angle < Math.PI / 2) { // Within 90 degrees of forward direction
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestEnemy = enemy;
                    }
                }
            }
        });
        
        if (!closestEnemy) {
            // No valid target found
            this.isActive = false;
            return;
        }
        
        // Store target enemy
        this.targetEnemy = closestEnemy;
        
        // Create a giant tree-shaped axe blade that slams down
        this.createAxeBlade(origin, closestEnemy.position.clone());
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('culling-blade');
        }
    }
    
    createAxeBlade(origin, targetPosition) {
        // Create a group for the axe blade
        const bladeGroup = new THREE.Group();
        
        // Position halfway between hero and target, but higher up
        const midpoint = new THREE.Vector3().lerpVectors(origin, targetPosition, 0.5);
        midpoint.y += 5; // Start high above
        
        bladeGroup.position.copy(midpoint);
        
        // Make blade face the target
        bladeGroup.lookAt(targetPosition);
        bladeGroup.rotateX(Math.PI / 2); // Adjust to point downward
        
        // Create the handle (trunk)
        const handleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 4, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, // Brown
            roughness: 0.7,
            metalness: 0.2
        });
        
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 2; // Position at top of group
        bladeGroup.add(handle);
        
        // Create the blade head (main part)
        const bladeHeadGroup = new THREE.Group();
        bladeHeadGroup.position.y = 0; // At the bottom of the handle
        
        // Main blade shape
        const bladeGeometry = new THREE.ConeGeometry(1.5, 2, 4);
        bladeGeometry.rotateX(Math.PI / 2);
        
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0, // Silver
            roughness: 0.3,
            metalness: 0.8,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.z = -1; // Offset from handle
        bladeHeadGroup.add(blade);
        
        // Add blade details (branches)
        const detailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.8);
        
        // Add spikes to the blade
        for (let i = 0; i < 4; i++) {
            const spike = new THREE.Mesh(detailGeometry, bladeMaterial);
            const angle = (i / 4) * Math.PI * 2;
            spike.position.set(
                Math.cos(angle) * 0.7,
                Math.sin(angle) * 0.7,
                -1.2
            );
            spike.rotation.x = Math.PI / 4;
            spike.rotation.y = angle;
            bladeHeadGroup.add(spike);
        }
        
        // Add the blade head to the group
        bladeGroup.add(bladeHeadGroup);
        
        // Add glowing effect (leaves)
        const glowGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7
        });
        
        const glowPoints = [];
        
        // Add glow points around the blade
        for (let i = 0; i < 20; i++) {
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            
            // Position randomly around the blade
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 1;
            glow.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                -1 - Math.random() * 0.5
            );
            
            bladeHeadGroup.add(glow);
            glowPoints.push(glow);
        }
        
        // Add the blade group to the scene
        this.scene.add(bladeGroup);
        
        // Store the blade mesh for animation
        this.bladeMesh = {
            group: bladeGroup,
            handle,
            blade,
            bladeHead: bladeHeadGroup,
            glowPoints,
            targetPosition,
            startPosition: midpoint.clone(),
            startTime: Date.now(),
            slashDuration: 0.5 * 1000, // 0.5 seconds for slash
            hasHit: false
        };
    }
    
    updateEffect(delta) {
        if (!this.bladeMesh) return;
        
        const elapsed = Date.now() - this.bladeMesh.startTime;
        const slashProgress = Math.min(elapsed / this.bladeMesh.slashDuration, 1);
        
        if (slashProgress < 1) {
            // Move blade down toward target
            const newPosition = new THREE.Vector3().lerpVectors(
                this.bladeMesh.startPosition,
                this.bladeMesh.targetPosition,
                slashProgress
            );
            
            this.bladeMesh.group.position.copy(newPosition);
            
            // Rotate blade as it falls
            this.bladeMesh.group.rotation.z += delta * 5;
            
            // Animate glow points
            this.bladeMesh.glowPoints.forEach(glow => {
                // Pulse size
                const scale = 1 + Math.sin(elapsed * 0.01) * 0.3;
                glow.scale.set(scale, scale, scale);
                
                // Random movement
                glow.position.x += (Math.random() - 0.5) * 0.05;
                glow.position.y += (Math.random() - 0.5) * 0.05;
                glow.position.z += (Math.random() - 0.5) * 0.05;
            });
        } else if (!this.bladeMesh.hasHit) {
            // Blade has hit the target
            this.bladeMesh.hasHit = true;
            
            // Apply damage to target
            if (this.targetEnemy && this.targetEnemy.takeDamage) {
                // Check if enemy is below execution threshold
                if (this.targetEnemy.health && this.targetEnemy.health <= this.executionThreshold) {
                    // Execute - instant kill
                    this.targetEnemy.takeDamage(9999);
                    this.createExecutionEffect(this.targetEnemy.position.clone());
                } else {
                    // Normal damage
                    this.targetEnemy.takeDamage(this.damage);
                    this.createHitEffect(this.targetEnemy.position.clone());
                }
            }
            
            // Start fade out animation
            this.bladeMesh.fadeStartTime = Date.now();
            this.bladeMesh.fadeDuration = 0.5 * 1000; // 0.5 seconds to fade
        } else {
            // Fade out the blade
            const fadeElapsed = Date.now() - this.bladeMesh.fadeStartTime;
            const fadeProgress = Math.min(fadeElapsed / this.bladeMesh.fadeDuration, 1);
            
            // Fade out materials
            const opacity = 1 - fadeProgress;
            this.bladeMesh.blade.material.opacity = opacity;
            this.bladeMesh.handle.material.opacity = opacity;
            
            this.bladeMesh.glowPoints.forEach(glow => {
                glow.material.opacity = opacity * 0.7;
            });
            
            // Rise up and fade
            this.bladeMesh.group.position.y += delta * 2;
            
            // Check if fade is complete
            if (fadeProgress >= 1) {
                this.cleanupBladeMesh();
                this.isActive = false;
            }
        }
    }
    
    createHitEffect(position) {
        // Create impact particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1;
            
            const pos = position.clone();
            pos.x += Math.cos(angle) * radius;
            pos.y += Math.random() * 1;
            pos.z += Math.sin(angle) * radius;
            
            const particle = this.createParticle(
                pos,
                0xff0000, // Red color
                0.1 + Math.random() * 0.1, // Size
                0.5 + Math.random() * 0.5 // Life
            );
            
            // Add outward velocity
            particle.velocity.x = Math.cos(angle) * (2 + Math.random() * 3);
            particle.velocity.y = 1 + Math.random() * 3;
            particle.velocity.z = Math.sin(angle) * (2 + Math.random() * 3);
        }
        
        // Create ground crack effect
        const crackGeometry = new THREE.PlaneGeometry(3, 3);
        const crackMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const crack = new THREE.Mesh(crackGeometry, crackMaterial);
        crack.rotation.x = -Math.PI / 2; // Lay flat
        crack.position.copy(position);
        crack.position.y = 0.01; // Just above ground
        this.scene.add(crack);
        
        // Animate crack
        const startTime = Date.now();
        const duration = 1000; // 1 second
        
        const animateCrack = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Grow and fade
            const scale = progress * 2;
            crack.scale.set(scale, scale, 1);
            crack.material.opacity = 0.7 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animateCrack);
            } else {
                this.scene.remove(crack);
                crack.geometry.dispose();
                crack.material.dispose();
            }
        };
        
        animateCrack();
    }
    
    createExecutionEffect(position) {
        // Create more dramatic execution effect
        
        // Explosion particles
        for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            const height = Math.random() * 3;
            
            const pos = position.clone();
            pos.x += Math.cos(angle) * radius;
            pos.y += height;
            pos.z += Math.sin(angle) * radius;
            
            const particle = this.createParticle(
                pos,
                0xff0000, // Red color
                0.15 + Math.random() * 0.15, // Larger size
                0.8 + Math.random() * 0.8 // Longer life
            );
            
            // Add outward velocity
            particle.velocity.x = Math.cos(angle) * (3 + Math.random() * 5);
            particle.velocity.y = 2 + Math.random() * 5;
            particle.velocity.z = Math.sin(angle) * (3 + Math.random() * 5);
        }
        
        // Create shockwave ring
        const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.copy(position);
        ring.position.y = 0.1; // Just above ground
        this.scene.add(ring);
        
        // Animate ring
        const startTime = Date.now();
        const duration = 1500; // 1.5 seconds
        
        const animateRing = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Expand and fade
            const scale = 1 + progress * 10;
            ring.scale.set(scale, scale, 1);
            ring.material.opacity = 0.9 * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animateRing);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        
        animateRing();
        
        // Create vertical light beam
        const beamGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 16, 1, true);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.copy(position);
        beam.position.y += 5; // Center vertically
        this.scene.add(beam);
        
        // Animate beam
        const animateBeam = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Expand and fade
            beam.scale.x = beam.scale.z = 1 + progress * 2;
            beam.material.opacity = 0.7 * (1 - progress);
            
            // Rotate
            beam.rotation.y += 0.05;
            
            if (progress < 1) {
                requestAnimationFrame(animateBeam);
            } else {
                this.scene.remove(beam);
                beam.geometry.dispose();
                beam.material.dispose();
            }
        };
        
        animateBeam();
    }
    
    cleanupBladeMesh() {
        if (!this.bladeMesh) return;
        
        // Remove handle
        this.scene.remove(this.bladeMesh.handle);
        this.bladeMesh.handle.geometry.dispose();
        this.bladeMesh.handle.material.dispose();
        
        // Remove blade
        this.scene.remove(this.bladeMesh.blade);
        this.bladeMesh.blade.geometry.dispose();
        this.bladeMesh.blade.material.dispose();
        
        // Remove glow points
        this.bladeMesh.glowPoints.forEach(glow => {
            this.scene.remove(glow);
            glow.geometry.dispose();
            glow.material.dispose();
        });
        
        // Remove groups
        this.scene.remove(this.bladeMesh.bladeHead);
        this.scene.remove(this.bladeMesh.group);
        
        this.bladeMesh = null;
        this.targetEnemy = null;
    }
    
    cleanup() {
        super.cleanup();
        this.cleanupBladeMesh();
    }
}