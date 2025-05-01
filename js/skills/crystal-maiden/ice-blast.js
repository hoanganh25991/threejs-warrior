import Skill from '../skill.js';
import * as THREE from 'three';

export default class IceBlast extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Ice Blast";
        this.manaCost = 40;
        this.damage = 70;
        this.range = 15;
        this.projectileSpeed = 15;
        this.freezeDuration = 2.0;
        this.aoeRadius = 3;
        this.projectile = null;
        this.projectileStartPosition = null;
        this.projectileDirection = null;
        this.projectileDistance = 0;
    }

    getCooldownDuration() {
        return 5.0;
    }

    createEffect() {
        // Create an ice tree-shaped projectile that explodes on impact
        const origin = this.hero.group.position.clone();
        origin.y += 1.5; // Start at head level
        
        const direction = this.hero.direction.clone();
        
        // Create projectile group
        const projectileGroup = new THREE.Group();
        projectileGroup.position.copy(origin);
        this.scene.add(projectileGroup);
        
        // Create the core ice crystal (trunk)
        const coreGeometry = new THREE.OctahedronGeometry(0.3, 1);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.9,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        projectileGroup.add(core);
        
        // Create ice crystal branches
        const branchCount = 6;
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            
            // Create branch geometry - elongated crystal
            const branchGeometry = new THREE.ConeGeometry(0.1, 0.5, 4);
            const branchMaterial = new THREE.MeshPhongMaterial({
                color: 0xaaddff,
                transparent: true,
                opacity: 0.8,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2
            });
            
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            
            // Position branch on core
            branch.position.set(
                Math.cos(angle) * 0.3,
                Math.sin(angle) * 0.3,
                0
            );
            
            // Rotate branch to point outward
            branch.rotation.z = angle + Math.PI / 2;
            
            projectileGroup.add(branch);
            
            // Add smaller crystal at end of branch (leaf)
            const leafGeometry = new THREE.TetrahedronGeometry(0.1);
            const leafMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2
            });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position at end of branch
            leaf.position.set(
                Math.cos(angle) * 0.6,
                Math.sin(angle) * 0.6,
                0
            );
            
            // Random rotation
            leaf.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            projectileGroup.add(leaf);
        }
        
        // Add some smaller crystals (leaves) randomly distributed
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 0.3;
            
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.08);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.06);
                    break;
                default:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.05);
            }
            
            const crystalMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            
            // Position randomly around core
            crystal.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                (Math.random() - 0.5) * 0.4
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            projectileGroup.add(crystal);
        }
        
        // Orient projectile in direction of travel
        projectileGroup.lookAt(origin.clone().add(direction));
        
        // Store projectile data
        this.projectile = projectileGroup;
        this.projectileStartPosition = origin.clone();
        this.projectileDirection = direction.clone();
        this.projectileDistance = 0;
        
        // Create trail particles
        for (let i = 0; i < 20; i++) {
            const position = origin.clone();
            position.x += (Math.random() - 0.5) * 0.3;
            position.y += (Math.random() - 0.5) * 0.3;
            position.z += (Math.random() - 0.5) * 0.3;
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.5 + Math.random() * 0.5
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
        
        // Rotate projectile
        this.projectile.rotation.x += delta * 5;
        this.projectile.rotation.y += delta * 3;
        
        // Create trail particles
        if (Math.random() < 0.3) {
            const position = this.projectile.position.clone();
            position.x += (Math.random() - 0.5) * 0.3;
            position.y += (Math.random() - 0.5) * 0.3;
            position.z += (Math.random() - 0.5) * 0.3;
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.3 + Math.random() * 0.5
            );
            
            // Add slight backward velocity
            particle.velocity.copy(this.projectileDirection.clone().multiplyScalar(-1 - Math.random()));
            particle.velocity.y += (Math.random() - 0.5) * 2;
        }
        
        // Check for collision with enemies
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        let hitEnemy = false;
        
        enemies.forEach(enemy => {
            if (hitEnemy) return; // Only hit one enemy
            
            const distance = enemy.position.distanceTo(this.projectile.position);
            
            if (distance <= 1.0) { // Hit radius
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
                            
                            // Create ice crystal on enemy
                            const crystalGeometry = new THREE.IcosahedronGeometry(0.5, 0);
                            const crystalMaterial = new THREE.MeshBasicMaterial({
                                color: 0x88ccff,
                                transparent: true,
                                opacity: 0.7
                            });
                            
                            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                            crystal.position.copy(aoeEnemy.position);
                            crystal.position.y += 1;
                            this.scene.add(crystal);
                            
                            // Reset freeze after duration
                            setTimeout(() => {
                                if (aoeEnemy.frozen) {
                                    aoeEnemy.speed = aoeEnemy.originalSpeed;
                                    aoeEnemy.frozen = false;
                                }
                                this.scene.remove(crystal);
                                crystalGeometry.dispose();
                                crystalMaterial.dispose();
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
        }
    }
    
    createExplosion(position) {
        // Create explosion group
        const explosionGroup = new THREE.Group();
        explosionGroup.position.copy(position);
        this.scene.add(explosionGroup);
        
        // Create ice tree explosion - multiple ice trees bursting outward
        const treeCount = 8;
        const trees = [];
        
        for (let i = 0; i < treeCount; i++) {
            const angle = (i / treeCount) * Math.PI * 2;
            const treeGroup = new THREE.Group();
            
            // Position tree at explosion center
            treeGroup.position.set(0, 0, 0);
            
            // Create trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.8, 4);
            const trunkMaterial = new THREE.MeshPhongMaterial({
                color: 0xadd8e6, // Light blue
                transparent: true,
                opacity: 0.8,
                shininess: 90,
                emissive: 0x0088ff,
                emissiveIntensity: 0.3
            });
            
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 0.4; // Half height
            
            // Rotate trunk to point outward
            trunk.rotation.x = Math.PI / 2; // Make horizontal
            trunk.rotation.y = angle; // Point outward
            
            treeGroup.add(trunk);
            
            // Create branches
            const branchCount = 3 + Math.floor(Math.random() * 2);
            const branches = [];
            
            for (let j = 0; j < branchCount; j++) {
                const branchAngle = (j / branchCount) * Math.PI * 2;
                const branchHeight = 0.2 + (j / branchCount) * 0.5;
                
                const branchGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.3, 3);
                const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
                
                // Position on trunk
                branch.position.set(
                    0,
                    0,
                    branchHeight
                );
                
                // Rotate to point outward from trunk
                branch.rotation.x = Math.PI / 4; // 45 degrees up
                branch.rotation.y = branchAngle;
                
                trunk.add(branch);
                branches.push(branch);
            }
            
            // Create ice crystals (leaves)
            const crystalCount = 5 + Math.floor(Math.random() * 3);
            const crystals = [];
            
            for (let j = 0; j < crystalCount; j++) {
                // Randomly choose crystal shape
                let crystalGeometry;
                const crystalType = Math.floor(Math.random() * 3);
                
                switch (crystalType) {
                    case 0:
                        crystalGeometry = new THREE.TetrahedronGeometry(0.08);
                        break;
                    case 1:
                        crystalGeometry = new THREE.OctahedronGeometry(0.06);
                        break;
                    default:
                        crystalGeometry = new THREE.IcosahedronGeometry(0.05);
                }
                
                const crystalMaterial = new THREE.MeshPhongMaterial({
                    color: 0xd6f1ff,
                    transparent: true,
                    opacity: 0.7,
                    shininess: 100,
                    emissive: 0x0088ff,
                    emissiveIntensity: 0.2
                });
                
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                
                // Position randomly on branches or trunk
                const onBranch = Math.random() > 0.3 && branches.length > 0;
                
                if (onBranch) {
                    // Place on a random branch
                    const branch = branches[Math.floor(Math.random() * branches.length)];
                    
                    // Position at end of branch
                    crystal.position.set(0, 0, 0.15);
                    branch.add(crystal);
                } else {
                    // Place on trunk
                    const trunkPos = Math.random() * 0.7;
                    const trunkAngle = Math.random() * Math.PI * 2;
                    
                    crystal.position.set(
                        Math.cos(trunkAngle) * 0.05,
                        Math.sin(trunkAngle) * 0.05,
                        trunkPos
                    );
                    
                    trunk.add(crystal);
                }
                
                // Random rotation
                crystal.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                crystals.push(crystal);
            }
            
            explosionGroup.add(treeGroup);
            trees.push({
                group: treeGroup,
                trunk,
                branches,
                crystals,
                angle,
                distance: 0
            });
        }
        
        // Create frost ring at base
        const ringGeometry = new THREE.RingGeometry(0.2, 0.3, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.y = 0.05; // Just above ground
        explosionGroup.add(ring);
        
        // Animate explosion
        const startTime = Date.now();
        const duration = 1.5; // 1.5 seconds
        
        const animateExplosion = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Expand ring
                const ringScale = progress * this.aoeRadius * 3;
                ring.scale.set(ringScale, ringScale, 1);
                ring.material.opacity = 0.8 * (1 - progress);
                
                // Move trees outward
                trees.forEach(tree => {
                    // Calculate new position
                    const distance = progress * this.aoeRadius;
                    tree.distance = distance;
                    
                    tree.group.position.set(
                        Math.cos(tree.angle) * distance,
                        Math.sin(tree.angle * 0.5) * distance * 0.5, // Add some height variation
                        Math.sin(tree.angle) * distance
                    );
                    
                    // Scale down as they move outward
                    const scale = 1 - progress * 0.5;
                    tree.group.scale.set(scale, scale, scale);
                    
                    // Fade out
                    tree.trunk.material.opacity = 0.8 * (1 - progress);
                    tree.crystals.forEach(crystal => {
                        crystal.material.opacity = 0.7 * (1 - progress);
                    });
                });
                
                requestAnimationFrame(animateExplosion);
            } else {
                // Clean up
                trees.forEach(tree => {
                    tree.trunk.geometry.dispose();
                    tree.trunk.material.dispose();
                    
                    tree.branches.forEach(branch => {
                        branch.geometry.dispose();
                        branch.material.dispose();
                    });
                    
                    tree.crystals.forEach(crystal => {
                        crystal.geometry.dispose();
                        crystal.material.dispose();
                    });
                });
                
                ring.geometry.dispose();
                ring.material.dispose();
                
                this.scene.remove(explosionGroup);
            }
        };
        
        animateExplosion();
        
        // Create ice shards (particles)
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = Math.random() * (this.aoeRadius * 0.2);
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const shardPosition = new THREE.Vector3(
                position.x + x,
                position.y + y,
                position.z + z
            );
            
            const particle = this.createParticle(
                shardPosition,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.2,
                0.5 + Math.random() * 1.0
            );
            
            // Add outward velocity
            const direction = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(direction.multiplyScalar(3 + Math.random() * 5));
        }
        
        // Create frost ground effect
        const frostGroundGeometry = new THREE.CircleGeometry(this.aoeRadius, 32);
        const frostGroundMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaddff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const frostGround = new THREE.Mesh(frostGroundGeometry, frostGroundMaterial);
        frostGround.rotation.x = -Math.PI / 2; // Lay flat
        frostGround.position.copy(position);
        frostGround.position.y = 0.02; // Just above ground
        this.scene.add(frostGround);
        
        // Animate frost ground
        const animateFrostGround = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / (duration * 1.5), 1); // Last longer than trees
            
            if (progress < 1) {
                frostGround.material.opacity = 0.3 * (1 - progress);
                requestAnimationFrame(animateFrostGround);
            } else {
                this.scene.remove(frostGround);
                frostGround.geometry.dispose();
                frostGround.material.dispose();
            }
        };
        
        animateFrostGround();
        
        // Play explosion sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-explosion');
        }
    }
}