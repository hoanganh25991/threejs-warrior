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
        if (!this.hero.model || !this.hero.model.animations) return;

        // Find attack animation
        const attackAnim = this.hero.model.animations.find(a => a.name === 'attack');
        if (!attackAnim) return;

        // Play animation
        if (this.hero.mixer) {
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
        }
    }

    createAttackEffect() {
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();

        if (this.attackType === 'melee') {
            // Create sword slash effect
            const geometry = new THREE.BufferGeometry();
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-1, 0, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(1, 0, 0)
            ]);

            const points = curve.getPoints(50);
            geometry.setFromPoints(points);

            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            });

            const slash = new THREE.Line(geometry, material);
            slash.position.copy(origin.clone().add(direction.multiplyScalar(1.5)));
            slash.lookAt(this.hero.group.position);

            this.scene.add(slash);

            // Animate and remove
            let opacity = 1;
            const animate = () => {
                opacity -= 0.1;
                material.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    this.scene.remove(slash);
                }
            };
            animate();
        } else {
            // Create projectile effect
            const geometry = new THREE.SphereGeometry(0.2, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: this.hero.projectileColor || 0xffff00
            });
            const projectile = new THREE.Mesh(geometry, material);
            
            projectile.position.copy(origin.clone().add(direction.multiplyScalar(1)));
            this.scene.add(projectile);

            // Animate projectile
            const speed = 20;
            const maxDistance = this.attackRange;
            const startPos = projectile.position.clone();
            
            const animate = () => {
                projectile.position.add(direction.multiplyScalar(speed * 0.016));
                
                if (projectile.position.distanceTo(startPos) > maxDistance) {
                    this.scene.remove(projectile);
                } else {
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }

    handleMeleeAttack() {
        const origin = this.hero.group.position;
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');

        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            if (distance <= this.attackRange) {
                // Check if enemy is in front of hero
                const toEnemy = enemy.position.clone().sub(origin).normalize();
                const dot = toEnemy.dot(this.hero.direction);
                
                if (dot > 0.5) { // Within ~60 degree cone
                    enemy.takeDamage(this.baseDamage);
                }
            }
        });
    }

    handleRangedAttack() {
        const origin = this.hero.group.position;
        const direction = this.hero.direction.clone();
        const raycaster = new THREE.Raycaster(origin, direction);
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');

        // Convert enemies to their meshes for raycaster
        const enemyMeshes = enemies.map(enemy => enemy.mesh || enemy);
        const intersects = raycaster.intersectObjects(enemyMeshes);

        if (intersects.length > 0 && intersects[0].distance <= this.attackRange) {
            const hitEnemy = enemies.find(enemy => 
                enemy.mesh === intersects[0].object || enemy === intersects[0].object
            );
            if (hitEnemy) {
                hitEnemy.takeDamage(this.baseDamage);
            }
        }
    }

    update(delta) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }
}
