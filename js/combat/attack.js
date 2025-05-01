import * as THREE from 'three';
import { config } from '../config/config.js';

export default class Attack {
    constructor(hero) {
        this.hero = hero;
        this.scene = hero.scene;
        this.isActive = false;
        this.attackRange = config.combat.attackRange || 2;
        this.attackCooldown = 0;
        this.attackSpeed = config.combat.attackSpeed || 1.0;
        this.baseDamage = config.combat.baseDamage || 20;
        this.attackType = hero.attackType || 'melee'; // 'melee' or 'ranged'
        this.attackAnimation = null;
        this.attackSound = null;
        this.attackEffect = null;
    }

    canAttack() {
        return this.attackCooldown <= 0;
    }

    startAttack() {
        if (!this.canAttack()) return false;

        this.isActive = true;
        this.attackCooldown = 1 / this.attackSpeed;

        // Play attack animation
        this.playAttackAnimation();

        // Play attack sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('attack', { volume: 0.8 });
        }

        // Create attack effect
        this.createAttackEffect();

        // Handle damage
        if (this.attackType === 'melee') {
            this.handleMeleeAttack();
        } else {
            this.handleRangedAttack();
        }

        return true;
    }

    playAttackAnimation() {
        // If we have a model with animations, use those
        if (this.hero.model && this.hero.model.animations) {
            // Find attack animation
            const attackAnim = this.hero.model.animations.find(a => a.name === 'attack');
            if (attackAnim && this.hero.mixer) {
                const action = this.hero.mixer.clipAction(attackAnim);
                action.setLoop(THREE.LoopOnce);
                action.reset().play();

                // Reset to idle animation when done
                action.addEventListener('finished', () => {
                    const idleAnim = this.hero.model.animations.find(a => a.name === 'idle');
                    if (idleAnim) {
                        const idleAction = this.hero.mixer.clipAction(idleAnim);
                        idleAction.reset().play();
                    }
                });
                return;
            }
        }
        
        // Fallback: Create a more dynamic visual attack animation using the hero's model
        if (this.hero.group) {
            // Create a temporary animation for the attack
            const heroBody = this.hero.group.children[0];
            if (heroBody) {
                // Find arms and weapon to animate
                let rightArm, weapon;
                
                // Search for arm and weapon parts
                heroBody.traverse(part => {
                    // Right arm is usually positioned to the right (positive X) and at mid-height
                    if (part.position.x > 0.3 && part.position.y > 0.8 && part.position.y < 1.6) {
                        rightArm = part;
                    }
                    // Weapon is often positioned in front (negative Z) or to the side
                    else if ((part.position.z < -0.2 || part.position.x > 0.5) && part.position.y > 0.5) {
                        weapon = part;
                    }
                });
                
                // If we found an arm, animate it with a more complex motion
                if (rightArm) {
                    // Save original rotation
                    const originalRotation = {
                        x: rightArm.rotation.x || 0,
                        y: rightArm.rotation.y || 0,
                        z: rightArm.rotation.z || 0
                    };
                    
                    // Animation sequence
                    const animateSwing = () => {
                        // Wind up (pull back)
                        rightArm.rotation.x = originalRotation.x + 0.4;
                        rightArm.rotation.z = originalRotation.z - 0.2;
                        
                        setTimeout(() => {
                            // Swing forward (attack)
                            rightArm.rotation.x = originalRotation.x - 0.8;
                            rightArm.rotation.z = originalRotation.z + 0.3;
                            
                            // If we have a weapon, animate it too
                            if (weapon) {
                                const weaponOriginal = {
                                    x: weapon.rotation.x || 0,
                                    y: weapon.rotation.y || 0,
                                    z: weapon.rotation.z || 0
                                };
                                weapon.rotation.x = weaponOriginal.x - 0.5;
                                weapon.rotation.z = weaponOriginal.z + 0.4;
                                
                                setTimeout(() => {
                                    weapon.rotation.x = weaponOriginal.x;
                                    weapon.rotation.y = weaponOriginal.y;
                                    weapon.rotation.z = weaponOriginal.z;
                                }, 150);
                            }
                            
                            setTimeout(() => {
                                // Return to original position
                                rightArm.rotation.x = originalRotation.x;
                                rightArm.rotation.y = originalRotation.y;
                                rightArm.rotation.z = originalRotation.z;
                            }, 200);
                        }, 100);
                    };
                    
                    animateSwing();
                } else {
                    // If no arm found, animate the whole hero with a more dynamic motion
                    const originalRotation = {
                        x: heroBody.rotation.x || 0,
                        y: heroBody.rotation.y || 0,
                        z: heroBody.rotation.z || 0
                    };
                    
                    // Animation sequence
                    const animateBody = () => {
                        // Lean back slightly
                        heroBody.rotation.x = originalRotation.x + 0.2;
                        
                        setTimeout(() => {
                            // Lean forward for attack
                            heroBody.rotation.x = originalRotation.x - 0.3;
                            
                            // Add a slight twist for more dynamic feel
                            heroBody.rotation.z = originalRotation.z + 0.1;
                            
                            setTimeout(() => {
                                // Return to original position
                                heroBody.rotation.x = originalRotation.x;
                                heroBody.rotation.y = originalRotation.y;
                                heroBody.rotation.z = originalRotation.z;
                            }, 200);
                        }, 100);
                    };
                    
                    animateBody();
                }
                
                // Add a slight movement to the hero's position for more impact
                const originalPosition = this.hero.group.position.clone();
                
                // Move slightly forward in the direction the hero is facing
                const forwardDirection = this.hero.direction.clone().normalize().multiplyScalar(0.2);
                this.hero.group.position.add(forwardDirection);
                
                // Return to original position
                setTimeout(() => {
                    this.hero.group.position.copy(originalPosition);
                }, 250);
            }
        }
    }

    createAttackEffect() {
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();

        if (this.attackType === 'melee') {
            // Create sword slash effect - more visible and colorful
            const slashGroup = new THREE.Group();
            
            // Create multiple arcs for a more dramatic effect
            for (let i = 0; i < 3; i++) {
                const geometry = new THREE.BufferGeometry();
                const curve = new THREE.CatmullRomCurve3([
                    new THREE.Vector3(-1, -0.2 + i * 0.2, 0),
                    new THREE.Vector3(-0.5, 0.5 + i * 0.2, 0),
                    new THREE.Vector3(0, 0.8 + i * 0.2, 0),
                    new THREE.Vector3(0.5, 0.5 + i * 0.2, 0),
                    new THREE.Vector3(1, -0.2 + i * 0.2, 0)
                ]);

                const points = curve.getPoints(50);
                geometry.setFromPoints(points);

                // Different colors for each arc
                let color;
                switch(i) {
                    case 0: color = 0xffffff; break; // White
                    case 1: color = 0xffff00; break; // Yellow
                    case 2: color = 0xff8800; break; // Orange
                }

                const material = new THREE.LineBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8,
                    linewidth: 3
                });

                const slash = new THREE.Line(geometry, material);
                slashGroup.add(slash);
            }
            
            // Position the slash effect in front of the hero
            slashGroup.position.copy(origin.clone().add(direction.multiplyScalar(1.5)));
            slashGroup.position.y += 1; // Raise to weapon height
            slashGroup.lookAt(this.hero.group.position);
            slashGroup.rotateY(Math.PI / 2); // Adjust orientation
            
            this.scene.add(slashGroup);

            // Animate and remove with scaling and fading
            let opacity = 1;
            let scale = 1;
            const animate = () => {
                opacity -= 0.05;
                scale += 0.1;
                
                slashGroup.scale.set(scale, scale, scale);
                
                slashGroup.children.forEach((slash, index) => {
                    slash.material.opacity = opacity - (index * 0.1);
                });

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(slashGroup);
                    slashGroup.children.forEach(slash => {
                        slash.geometry.dispose();
                        slash.material.dispose();
                    });
                }
            };
            animate();
            
            // Add impact effect at the end of the slash
            this.createImpactEffect(origin.clone().add(direction.multiplyScalar(this.attackRange)));
            
        } else {
            // Create projectile effect with trail
            const projectileGroup = new THREE.Group();
            
            // Main projectile
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: this.hero.projectileColor || 0xffff00,
                transparent: true,
                opacity: 0.9
            });
            const projectile = new THREE.Mesh(geometry, material);
            projectileGroup.add(projectile);
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: this.hero.projectileColor || 0xffff00,
                transparent: true,
                opacity: 0.5
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            projectileGroup.add(glow);
            
            // Position the projectile
            projectileGroup.position.copy(origin.clone().add(direction.multiplyScalar(1)));
            projectileGroup.position.y += 1; // Adjust to be at weapon height
            this.scene.add(projectileGroup);

            // Animate projectile
            const speed = 20;
            const maxDistance = this.attackRange;
            const startPos = projectileGroup.position.clone();
            const trailParticles = [];
            
            const animate = () => {
                // Move projectile
                projectileGroup.position.add(direction.clone().multiplyScalar(speed * 0.016));
                
                // Create trail effect
                if (Math.random() > 0.5) {
                    const trailGeometry = new THREE.SphereGeometry(0.1, 6, 6);
                    const trailMaterial = new THREE.MeshBasicMaterial({
                        color: this.hero.projectileColor || 0xffff00,
                        transparent: true,
                        opacity: 0.7
                    });
                    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
                    trail.position.copy(projectileGroup.position);
                    this.scene.add(trail);
                    trailParticles.push({
                        mesh: trail,
                        opacity: 0.7,
                        scale: 1
                    });
                }
                
                // Fade out trail particles
                for (let i = trailParticles.length - 1; i >= 0; i--) {
                    const particle = trailParticles[i];
                    particle.opacity -= 0.05;
                    particle.scale -= 0.05;
                    
                    if (particle.opacity <= 0) {
                        this.scene.remove(particle.mesh);
                        particle.mesh.geometry.dispose();
                        particle.mesh.material.dispose();
                        trailParticles.splice(i, 1);
                    } else {
                        particle.mesh.material.opacity = particle.opacity;
                        particle.mesh.scale.set(particle.scale, particle.scale, particle.scale);
                    }
                }
                
                // Check if projectile has reached max distance
                if (projectileGroup.position.distanceTo(startPos) > maxDistance) {
                    // Create impact effect at the end point
                    this.createImpactEffect(projectileGroup.position.clone());
                    
                    // Remove projectile
                    this.scene.remove(projectileGroup);
                    projectile.geometry.dispose();
                    projectile.material.dispose();
                    glow.geometry.dispose();
                    glow.material.dispose();
                    
                    // Clean up remaining trail particles
                    trailParticles.forEach(particle => {
                        this.scene.remove(particle.mesh);
                        particle.mesh.geometry.dispose();
                        particle.mesh.material.dispose();
                    });
                } else {
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }
    
    createImpactEffect(position) {
        // Create an impact effect at the given position
        const impactGroup = new THREE.Group();
        
        // Create particles for the impact
        const particleCount = 20;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const size = 0.05 + Math.random() * 0.1;
            const geometry = new THREE.SphereGeometry(size, 6, 6);
            
            // Use different colors based on attack type
            let color;
            if (this.attackType === 'melee') {
                // White to yellow for melee
                color = new THREE.Color(1, 0.9 + Math.random() * 0.1, 0.7 + Math.random() * 0.3);
            } else {
                // Use projectile color for ranged
                color = new THREE.Color(this.hero.projectileColor || 0xffff00);
            }
            
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Random position within a small radius
            const radius = 0.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
            particle.position.z = radius * Math.cos(phi);
            
            // Random velocity
            const speed = 0.05 + Math.random() * 0.1;
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            );
            
            particles.push({
                mesh: particle,
                velocity: velocity,
                opacity: 0.8
            });
            
            impactGroup.add(particle);
        }
        
        // Position the impact effect
        impactGroup.position.copy(position);
        this.scene.add(impactGroup);
        
        // Animate particles
        const animate = () => {
            let allFaded = true;
            
            particles.forEach(particle => {
                // Move particle
                particle.mesh.position.add(particle.velocity);
                
                // Fade out
                particle.opacity -= 0.03;
                particle.mesh.material.opacity = particle.opacity;
                
                if (particle.opacity > 0) {
                    allFaded = false;
                }
            });
            
            if (allFaded) {
                // Remove all particles
                this.scene.remove(impactGroup);
                particles.forEach(particle => {
                    particle.mesh.geometry.dispose();
                    particle.mesh.material.dispose();
                });
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    handleMeleeAttack() {
        const origin = this.hero.group.position;
        
        // Find all enemy groups in the scene
        const enemyGroups = [];
        this.scene.traverse(object => {
            if (object.userData && object.userData.type === 'enemy') {
                enemyGroups.push(object);
            }
        });
        
        console.log(`Found ${enemyGroups.length} enemies for melee attack check`);
        
        enemyGroups.forEach(enemyGroup => {
            const distance = enemyGroup.position.distanceTo(origin);
            if (distance <= this.attackRange) {
                // Check if enemy is in front of hero
                const toEnemy = enemyGroup.position.clone().sub(origin).normalize();
                const dot = toEnemy.dot(this.hero.direction);
                
                if (dot > 0.5) { // Within ~60 degree cone
                    // Get the enemy instance from userData
                    const enemy = enemyGroup.userData.enemyRef;
                    if (enemy) {
                        console.log(`Dealing ${this.baseDamage} damage to enemy`);
                        enemy.takeDamage(this.baseDamage);
                    }
                }
            }
        });
    }

    handleRangedAttack() {
        const origin = this.hero.group.position.clone();
        origin.y += 1; // Adjust to be at weapon height
        const direction = this.hero.direction.clone();
        
        // Create a raycaster for detecting hits
        const raycaster = new THREE.Raycaster(origin, direction);
        
        // Find all enemy groups and their children for raycasting
        const enemyObjects = [];
        const enemyMap = new Map(); // Map objects to their enemy instances
        
        this.scene.traverse(object => {
            if (object.userData && object.userData.type === 'enemy') {
                // Store the group itself
                enemyObjects.push(object);
                enemyMap.set(object, object.userData.enemyRef);
                
                // Also include all children of the enemy group
                object.traverse(child => {
                    if (child.isMesh) {
                        enemyObjects.push(child);
                        enemyMap.set(child, object.userData.enemyRef);
                    }
                });
            }
        });
        
        console.log(`Found ${enemyObjects.length} enemy objects for ranged attack check`);
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(enemyObjects);
        
        if (intersects.length > 0 && intersects[0].distance <= this.attackRange) {
            const hitObject = intersects[0].object;
            const enemy = enemyMap.get(hitObject);
            
            if (enemy) {
                console.log(`Ranged attack hit enemy at distance ${intersects[0].distance}`);
                enemy.takeDamage(this.baseDamage);
            }
        }
    }

    update(delta) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
        
        // Auto-attack functionality
        if (this.hero.autoAttackEnabled && this.canAttack()) {
            this.tryAutoAttack();
        }
    }
    
    tryAutoAttack() {
        // Find the nearest enemy within attack range
        const origin = this.hero.group.position;
        const enemiesInRange = [];
        
        // Find all enemy groups in the scene
        this.scene.traverse(object => {
            if (object.userData && object.userData.type === 'enemy') {
                const distance = object.position.distanceTo(origin);
                if (distance <= this.attackRange * 1.5) { // Slightly larger range for auto-attack
                    enemiesInRange.push({
                        enemy: object.userData.enemyRef,
                        distance: distance
                    });
                }
            }
        });
        
        // Sort by distance
        enemiesInRange.sort((a, b) => a.distance - b.distance);
        
        // Attack the closest enemy if any are in range
        if (enemiesInRange.length > 0) {
            // Check if enemy is in front of hero (within a wider cone for auto-attack)
            const closestEnemy = enemiesInRange[0].enemy;
            const enemyPos = closestEnemy.group.position;
            const toEnemy = new THREE.Vector3().subVectors(enemyPos, origin).normalize();
            const dot = toEnemy.dot(this.hero.direction);
            
            // More forgiving angle for auto-attack (wider cone, about 90 degrees)
            if (dot > 0.1) {
                this.startAttack();
                return true;
            }
        }
        
        return false;
    }
}
