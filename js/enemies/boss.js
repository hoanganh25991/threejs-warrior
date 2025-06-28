import Enemy from './enemy.js';
import * as THREE from 'three';

export default class Boss extends Enemy {
    constructor(scene, position) {
        super(scene, position, 'boss');
        
        // Override base stats with boss stats
        this.health = 1000;
        this.maxHealth = 1000;
        this.damage = 50;
        this.speed = 3;
        this.experience = 500;
        this.attackRange = 4;
        this.detectionRange = 20;
        
        // Boss-specific properties
        this.phase = 1; // Boss has multiple phases
        this.specialAttackCooldown = 0;
        this.enraged = false;
        this.minions = [];
        
        // Special attack patterns
        this.attackPatterns = {
            groundSlam: {
                damage: 80,
                radius: 5,
                cooldown: 10
            },
            fireBreath: {
                damage: 30,
                range: 8,
                width: Math.PI / 4,
                duration: 3,
                cooldown: 15
            },
            summonMinions: {
                count: 3,
                cooldown: 20
            }
        };

        // Initialize boss room effects
        this.initializeBossRoom();
    }

    initializeBossRoom() {
        // Boss room boundary removed to avoid dark atmosphere
        // const roomGeometry = new THREE.BoxGeometry(50, 20, 50);
        // const roomMaterial = new THREE.MeshPhongMaterial({
        //     color: 0x333333,
        //     transparent: true,
        //     opacity: 0.2,
        //     side: THREE.BackSide
        // });
        // this.roomBoundary = new THREE.Mesh(roomGeometry, roomMaterial);
        // this.roomBoundary.position.y = 10;
        // this.scene.add(this.roomBoundary);

        // Add atmospheric particles
        this.createAtmosphericEffects();

        // Start boss music
        if (this.scene.soundManager) {
            this.bgMusic = this.scene.soundManager.playSound('boss-theme', {
                loop: true,
                volume: 0.7
            });
        }
    }

    createAtmosphericEffects() {
        // Create particle system for atmosphere
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;     // x
            positions[i + 1] = Math.random() * 20;         // y
            positions[i + 2] = (Math.random() - 0.5) * 50; // z
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff0000,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });

        this.atmosphericParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.atmosphericParticles);
    }

    update(delta) {
        super.update(delta);

        // Update special attack cooldown
        if (this.specialAttackCooldown > 0) {
            this.specialAttackCooldown -= delta;
        }

        // Update atmospheric effects
        if (this.atmosphericParticles) {
            this.atmosphericParticles.rotation.y += delta * 0.1;
        }

        // Phase transition check
        this.checkPhaseTransition();

        // Special attack selection
        if (this.state === 'attack' && this.specialAttackCooldown <= 0) {
            this.selectSpecialAttack();
        }

        // Update minions
        this.minions = this.minions.filter(minion => minion.health > 0);
    }

    checkPhaseTransition() {
        const healthPercent = this.health / this.maxHealth;

        if (healthPercent <= 0.3 && this.phase < 3) {
            this.enterPhase(3);
        } else if (healthPercent <= 0.6 && this.phase < 2) {
            this.enterPhase(2);
        }
    }

    enterPhase(phase) {
        this.phase = phase;
        this.enraged = true;
        
        // Increase stats for each phase
        this.damage *= 1.5;
        this.speed *= 1.2;
        this.attackSpeed *= 1.3;

        // Visual effect for phase transition
        this.createPhaseTransitionEffect();

        // Play phase transition sound
        if (this.scene.soundManager) {
            this.scene.soundManager.playSound('boss-phase-change', {
                volume: 1.0
            });
        }
    }

    createPhaseTransitionEffect() {
        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 1
        });

        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(this.group.position);
        this.scene.add(sphere);

        // Expand and fade out
        const startTime = Date.now();
        const duration = 1000;
        const maxScale = 10;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = maxScale * progress;
                sphere.scale.set(scale, scale, scale);
                material.opacity = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(sphere);
            }
        };
        animate();
    }

    selectSpecialAttack() {
        if (Math.random() < 0.3) { // 30% chance to use special attack
            const attacks = ['groundSlam', 'fireBreath', 'summonMinions'];
            const attack = attacks[Math.floor(Math.random() * attacks.length)];
            
            switch (attack) {
                case 'groundSlam':
                    this.groundSlam();
                    break;
                case 'fireBreath':
                    this.fireBreath();
                    break;
                case 'summonMinions':
                    this.summonMinions();
                    break;
            }
        }
    }

    groundSlam() {
        const pattern = this.attackPatterns.groundSlam;
        this.specialAttackCooldown = pattern.cooldown;

        // Create ground slam effect
        const geometry = new THREE.RingGeometry(0.1, pattern.radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(this.group.position);
        this.scene.add(ring);

        // Expand and fade out
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                material.opacity = 0.5 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                
                // Deal damage to heroes in range
                const heroes = this.scene.getObjectsByProperty('type', 'hero');
                heroes.forEach(hero => {
                    const distance = hero.group.position.distanceTo(this.group.position);
                    if (distance <= pattern.radius) {
                        hero.takeDamage(pattern.damage);
                    }
                });
            }
        };
        animate();
    }

    fireBreath() {
        const pattern = this.attackPatterns.fireBreath;
        this.specialAttackCooldown = pattern.cooldown;

        const startTime = Date.now();
        const endTime = startTime + (pattern.duration * 1000);

        const createFireParticle = () => {
            const angle = (Math.random() - 0.5) * pattern.width;
            const direction = this.group.getWorldDirection(new THREE.Vector3())
                .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            const particle = {
                position: this.group.position.clone(),
                velocity: direction.multiplyScalar(10 + Math.random() * 5),
                life: 1.0
            };

            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                transparent: true
            });
            particle.mesh = new THREE.Mesh(geometry, material);
            particle.mesh.position.copy(particle.position);
            this.scene.add(particle.mesh);

            return particle;
        };

        const particles = [];
        const updateParticles = () => {
            const now = Date.now();

            // Create new particles
            if (now < endTime) {
                for (let i = 0; i < 5; i++) {
                    particles.push(createFireParticle());
                }
            }

            // Update existing particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                particle.life -= 0.016;

                if (particle.life <= 0) {
                    this.scene.remove(particle.mesh);
                    particles.splice(i, 1);
                } else {
                    particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                    particle.mesh.position.copy(particle.position);
                    particle.mesh.material.opacity = particle.life;

                    // Check for hero collision
                    const heroes = this.scene.getObjectsByProperty('type', 'hero');
                    heroes.forEach(hero => {
                        const distance = hero.group.position.distanceTo(particle.position);
                        if (distance < 1) {
                            hero.takeDamage(pattern.damage * 0.016);
                        }
                    });
                }
            }

            if (particles.length > 0 || now < endTime) {
                requestAnimationFrame(updateParticles);
            }
        };

        updateParticles();
    }

    summonMinions() {
        const pattern = this.attackPatterns.summonMinions;
        this.specialAttackCooldown = pattern.cooldown;

        for (let i = 0; i < pattern.count; i++) {
            const angle = (Math.PI * 2 * i) / pattern.count;
            const position = new THREE.Vector3(
                this.group.position.x + Math.cos(angle) * 3,
                this.group.position.y,
                this.group.position.z + Math.sin(angle) * 3
            );

            const minion = new Enemy(this.scene, position, 'basic');
            this.minions.push(minion);
        }
    }

    die() {
        // Stop boss music
        if (this.bgMusic) {
            this.bgMusic.stop();
        }

        // Play victory music
        if (this.scene.soundManager) {
            this.scene.soundManager.playSound('victory-theme', {
                volume: 1.0
            });
        }

        // Remove boss room effects
        // Room boundary no longer exists (commented out to remove dark atmosphere)
        // if (this.roomBoundary) {
        //     this.scene.remove(this.roomBoundary);
        // }
        if (this.atmosphericParticles) {
            this.scene.remove(this.atmosphericParticles);
        }

        // Kill all remaining minions
        this.minions.forEach(minion => minion.die());

        // Call parent die method
        super.die();
    }
}
