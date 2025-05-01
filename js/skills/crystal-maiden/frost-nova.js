import Skill from '../skill.js';
import * as THREE from 'three';

export default class FrostNova extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 40;
        this.damage = 60;
        this.range = 8;
        this.duration = 1.5;
        this.slowDuration = 3.0;
        this.slowAmount = 0.5; // 50% slow
        this.iceTrees = [];
    }

    getCooldownDuration() {
        return 6.0;
    }

    createEffect() {
        const origin = this.hero.group.position.clone();
        
        // Create frost ground effect
        const groundGeometry = new THREE.CircleGeometry(this.range, 32);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Lay flat
        ground.position.copy(origin);
        ground.position.y += 0.05; // Slightly above ground
        this.scene.add(ground);
        
        // Create multiple expanding frost rings
        const ringCount = 3;
        const rings = [];
        
        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 32);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0xadd8e6,
                transparent: true,
                opacity: 0.8,
                emissive: 0x0088ff,
                emissiveIntensity: 0.3,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2; // Lay flat on the ground
            ring.position.copy(origin);
            ring.position.y += 0.1; // Slightly above ground
            
            this.scene.add(ring);
            rings.push(ring);
        }
        
        // Create frost patterns on ground (tree root patterns)
        const patternCount = 6;
        for (let i = 0; i < patternCount; i++) {
            const angle = (i / patternCount) * Math.PI * 2;
            const startRadius = 0.5;
            const endRadius = this.range * 0.9;
            
            // Create branching frost pattern
            this.createFrostPattern(
                origin,
                angle,
                startRadius,
                endRadius
            );
        }
        
        // Create ice trees around the perimeter
        const treeCount = 8;
        for (let i = 0; i < treeCount; i++) {
            const angle = (i / treeCount) * Math.PI * 2;
            const radius = this.range * 0.8;
            
            const treePosition = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y,
                origin.z + Math.sin(angle) * radius
            );
            
            this.createIceTree(treePosition, 1 + Math.random() * 0.5);
        }
        
        // Create smaller ice trees randomly within the area
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.range * 0.7;
            
            const treePosition = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y,
                origin.z + Math.sin(angle) * radius
            );
            
            this.createIceTree(treePosition, 0.5 + Math.random() * 0.5);
        }
        
        // Animate rings expansion and fade
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            
            rings.forEach((ring, index) => {
                // Stagger the start of each ring
                const delay = index * 0.3;
                const adjustedElapsed = elapsed - delay;
                
                if (adjustedElapsed <= 0) return;
                
                const progress = Math.min(adjustedElapsed / this.duration, 1);
                
                // Expand ring
                const scale = progress * (this.range / 0.2); // 0.2 is average of inner and outer radius
                ring.scale.setScalar(scale);
                
                // Fade out near end
                if (progress > 0.7) {
                    ring.material.opacity = 0.8 * (1 - (progress - 0.7) / 0.3);
                }
                
                // Remove when done
                if (progress >= 1) {
                    this.scene.remove(ring);
                    ring.geometry.dispose();
                    ring.material.dispose();
                    rings[index] = null;
                }
            });
            
            // Continue animation if any rings remain
            if (rings.some(ring => ring !== null)) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        
        // Animate ground fade
        const animateGround = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const duration = this.slowDuration;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Keep full opacity for first half, then fade
                if (progress > 0.5) {
                    ground.material.opacity = 0.3 * (1 - (progress - 0.5) / 0.5);
                }
                requestAnimationFrame(animateGround);
            } else {
                this.scene.remove(ground);
                ground.geometry.dispose();
                ground.material.dispose();
            }
        };
        
        animateGround();

        // Create ice particles
        for (let i = 0; i < 100; i++) {
            const angle = (Math.PI * 2 * i) / 100;
            const radius = Math.random() * this.range;
            
            const position = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y,
                origin.z + Math.sin(angle) * radius
            );

            const particle = this.createParticle(
                position,
                0x00ffff, // Cyan color
                0.1,      // Size
                1.0       // Life
            );

            // Add upward velocity
            particle.velocity.y = 2 + Math.random() * 2;
        }

        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('frost-nova');
        }
        
        // Set a timer to remove the ice trees
        setTimeout(() => this.cleanupIceTrees(), this.slowDuration * 1000);
    }
    
    createIceTree(position, scale) {
        const treeGroup = new THREE.Group();
        treeGroup.position.copy(position);
        treeGroup.scale.set(scale, scale, scale);
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 6);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6, // Light blue
            transparent: true,
            opacity: 0.8,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.6; // Half height
        treeGroup.add(trunk);
        
        // Create branches
        const branchCount = 4 + Math.floor(Math.random() * 3);
        const branches = [];
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const height = 0.3 + (i / branchCount) * 0.8;
            
            const branchGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.4, 4);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position on trunk
            branch.position.y = height;
            
            // Rotate to point outward and upward
            branch.rotation.z = Math.PI / 4; // 45 degrees up
            branch.rotation.y = angle;
            
            // Move outward from trunk
            branch.position.x = Math.cos(angle) * 0.1;
            branch.position.z = Math.sin(angle) * 0.1;
            
            treeGroup.add(branch);
            branches.push(branch);
        }
        
        // Create ice crystals (leaves)
        const crystalCount = 12 + Math.floor(Math.random() * 8);
        const crystals = [];
        
        for (let i = 0; i < crystalCount; i++) {
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.1);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.08);
                    break;
                default:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.06);
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
                const branchPos = branch.position.clone();
                const branchDir = new THREE.Vector3(branch.position.x, 0, branch.position.z).normalize();
                
                crystal.position.copy(branchPos);
                crystal.position.x += branchDir.x * (0.1 + Math.random() * 0.2);
                crystal.position.z += branchDir.z * (0.1 + Math.random() * 0.2);
                crystal.position.y += Math.random() * 0.1;
            } else {
                // Place on trunk
                const angle = Math.random() * Math.PI * 2;
                const height = 0.2 + Math.random() * 1.0;
                
                crystal.position.set(
                    Math.cos(angle) * 0.08,
                    height,
                    Math.sin(angle) * 0.08
                );
            }
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            treeGroup.add(crystal);
            crystals.push(crystal);
        }
        
        // Add frost particles
        const particleCount = 5 + Math.floor(Math.random() * 5);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = 0.2 + Math.random() * 1.0;
            const radius = 0.1 + Math.random() * 0.2;
            
            const particlePos = new THREE.Vector3(
                position.x + Math.cos(angle) * radius,
                position.y + height,
                position.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                particlePos,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05, // Size
                2.0 + Math.random() * 2.0 // Life
            );
            
            // Slow upward drift
            particle.velocity.y = 0.2 + Math.random() * 0.3;
        }
        
        this.scene.add(treeGroup);
        
        // Store tree components for later cleanup
        this.iceTrees.push({
            group: treeGroup,
            trunk,
            branches,
            crystals
        });
        
        return treeGroup;
    }

    updateEffect(delta) {
        // Find all enemies in range
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;

        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= this.range) {
                // Apply damage
                if (enemy.takeDamage) {
                    enemy.takeDamage(this.damage * delta);
                }
                
                // Apply slow effect
                if (!enemy.slowed) {
                    enemy.slowed = true;
                    enemy.originalSpeed = enemy.speed;
                    enemy.speed *= (1 - this.slowAmount);
                    
                    // Create ice crystals on the enemy
                    this.createEnemyFrostEffect(enemy);
                    
                    // Reset speed after slow duration
                    setTimeout(() => {
                        if (enemy.slowed) {
                            enemy.speed = enemy.originalSpeed;
                            enemy.slowed = false;
                            
                            // Remove ice crystals
                            if (enemy.frostEffect) {
                                this.scene.remove(enemy.frostEffect);
                                enemy.frostEffect = null;
                            }
                        }
                    }, this.slowDuration * 1000);
                }

                // Create frost particles on enemy
                if (Math.random() < delta * 5) {
                    const pos = enemy.position.clone();
                    pos.y += 1; // Adjust to hit body
                    
                    this.createParticle(
                        pos,
                        0x00ffff, // Cyan color
                        0.1,      // Size
                        0.5       // Life
                    );
                }
            }
        });
        
        // Animate ice trees
        this.iceTrees.forEach(tree => {
            // Subtle shimmer effect on crystals
            tree.crystals.forEach(crystal => {
                crystal.rotation.x += delta * 0.2;
                crystal.rotation.y += delta * 0.1;
                
                // Pulse opacity
                const opacity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
                crystal.material.opacity = opacity;
            });
        });
    }
    
    createFrostPattern(origin, angle, startRadius, endRadius) {
        // Create a branching frost pattern on the ground
        const startPoint = new THREE.Vector3(
            origin.x + Math.cos(angle) * startRadius,
            origin.y + 0.06, // Slightly above ground
            origin.z + Math.sin(angle) * startRadius
        );
        
        const endPoint = new THREE.Vector3(
            origin.x + Math.cos(angle) * endRadius,
            origin.y + 0.06,
            origin.z + Math.sin(angle) * endRadius
        );
        
        this.createFrostBranch(startPoint, endPoint, 3, 0.8);
    }
    
    createFrostBranch(start, end, depth, width) {
        if (depth <= 0) return;
        
        // Create main branch
        const points = [start, end];
        const curve = new THREE.CatmullRomCurve3(points);
        
        const tubeGeometry = new THREE.TubeGeometry(curve, 8, width * 0.05, 8, false);
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.7,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2
        });
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.scene.add(tube);
        
        // Store for cleanup
        this.iceTrees.push({
            group: tube,
            trunk: tube,
            branches: [],
            crystals: []
        });
        
        // Create sub-branches
        const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Create 2 branches at midpoint
        for (let i = -1; i <= 1; i += 2) {
            if (i === 0) continue; // Skip middle
            
            const branchLength = width * 0.8;
            const branchEnd = new THREE.Vector3().copy(midPoint).add(
                perpendicular.clone().multiplyScalar(i * branchLength)
            );
            
            // Add some randomness
            branchEnd.x += (Math.random() - 0.5) * width * 0.4;
            branchEnd.z += (Math.random() - 0.5) * width * 0.4;
            
            this.createFrostBranch(midPoint, branchEnd, depth - 1, width * 0.6);
        }
        
        // Add some ice crystals along the branch
        if (depth === 1) {
            const crystalCount = 2 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < crystalCount; i++) {
                const t = Math.random();
                const point = curve.getPoint(t);
                
                // Randomly choose crystal shape
                let crystalGeometry;
                const crystalType = Math.floor(Math.random() * 3);
                
                switch (crystalType) {
                    case 0:
                        crystalGeometry = new THREE.TetrahedronGeometry(0.06);
                        break;
                    case 1:
                        crystalGeometry = new THREE.OctahedronGeometry(0.05);
                        break;
                    default:
                        crystalGeometry = new THREE.IcosahedronGeometry(0.04);
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
                crystal.position.copy(point);
                crystal.position.y += 0.05; // Slightly above the branch
                
                // Random rotation
                crystal.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                this.scene.add(crystal);
                
                // Store for cleanup
                this.iceTrees.push({
                    group: crystal,
                    trunk: crystal,
                    branches: [],
                    crystals: [crystal]
                });
            }
        }
    }
    
    createEnemyFrostEffect(enemy) {
        // Create a small ice tree formation on the enemy
        const frostGroup = new THREE.Group();
        
        // Create main trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 5);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6, // Light blue
            transparent: true,
            opacity: 0.8,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.3; // Half height
        frostGroup.add(trunk);
        
        // Create branches
        const branchCount = 3 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const branchHeight = 0.1 + (i / branchCount) * 0.4;
            
            const branchGeometry = new THREE.CylinderGeometry(0.01, 0.03, 0.2, 4);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position on trunk
            branch.position.y = branchHeight;
            
            // Rotate to point outward and upward
            branch.rotation.z = Math.PI / 4; // 45 degrees up
            branch.rotation.y = angle;
            
            // Move outward from trunk
            branch.position.x = Math.cos(angle) * 0.05;
            branch.position.z = Math.sin(angle) * 0.05;
            
            frostGroup.add(branch);
        }
        
        // Create ice crystals
        for (let i = 0; i < 5; i++) {
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.1);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.08);
                    break;
                default:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.06);
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
            
            // Position randomly on enemy
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.2;
            const height = Math.random() * 1.5;
            
            crystal.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            frostGroup.add(crystal);
        }
        
        // Attach to enemy
        enemy.add(frostGroup);
        enemy.frostEffect = frostGroup;
    }
    
    cleanupIceTrees() {
        this.iceTrees.forEach(tree => {
            // Remove trunk
            this.scene.remove(tree.trunk);
            tree.trunk.geometry.dispose();
            tree.trunk.material.dispose();
            
            // Remove branches
            tree.branches.forEach(branch => {
                this.scene.remove(branch);
                branch.geometry.dispose();
                branch.material.dispose();
            });
            
            // Remove crystals
            tree.crystals.forEach(crystal => {
                this.scene.remove(crystal);
                crystal.geometry.dispose();
                crystal.material.dispose();
            });
            
            // Remove group
            this.scene.remove(tree.group);
        });
        
        this.iceTrees = [];
    }
    
    cleanup() {
        super.cleanup();
        this.cleanupIceTrees();
    }
}
