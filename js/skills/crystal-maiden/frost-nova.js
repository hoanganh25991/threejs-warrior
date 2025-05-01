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
        this.damageType = 'ice';
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
        
        // Add an active effect for collision detection
        this.addActiveEffect({
            type: 'aoe',
            position: origin,
            radius: this.range,
            damage: this.damage,
            damageType: this.damageType,
            lifetime: this.duration,
            canHitMultiple: true,
            onHit: (hitEnemies) => {
                // Apply slow effect to hit enemies
                hitEnemies.forEach(hit => {
                    this.applySlowEffect(hit.enemy);
                });
            }
        });
    }
    
    updateEffect(delta) {
        // The collision system will handle damage application
        // We just need to update visual effects here
        
        // Create occasional frost particles
        if (Math.random() < 0.2) {
            const origin = this.hero.group.position.clone();
            const angle = Math.random() * Math.PI * 2;
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
                0.5       // Life
            );
            
            // Add upward velocity
            particle.velocity.y = 1 + Math.random();
        }
    }
    
    /**
     * Apply slow effect to an enemy
     */
    applySlowEffect(enemy) {
        // Skip if already slowed
        if (enemy.slowed) return;
        
        // Apply slow effect
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
                if (enemy.frostEffects) {
                    enemy.frostEffects.forEach(effect => {
                        this.scene.remove(effect);
                    });
                    enemy.frostEffects = null;
                }
            }
        }, this.slowDuration * 1000);
    }
    
    createFrostPattern(origin, angle, startRadius, endRadius) {
        // Create a branching frost pattern on the ground
        const branchCount = 3 + Math.floor(Math.random() * 3);
        const mainDirection = new THREE.Vector3(
            Math.cos(angle),
            0,
            Math.sin(angle)
        );
        
        // Create main branch
        this.createFrostBranch(
            origin,
            mainDirection,
            startRadius,
            endRadius,
            0.1, // Width
            0
        );
        
        // Create sub-branches
        for (let i = 0; i < branchCount; i++) {
            // Calculate branch start position along main branch
            const branchStartDistance = startRadius + (endRadius - startRadius) * (0.3 + Math.random() * 0.5);
            const branchStartPos = new THREE.Vector3(
                origin.x + mainDirection.x * branchStartDistance,
                origin.y,
                origin.z + mainDirection.z * branchStartDistance
            );
            
            // Calculate branch angle (off to the side from main branch)
            const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + Math.random() * Math.PI / 6);
            const branchDirection = new THREE.Vector3(
                Math.cos(branchAngle),
                0,
                Math.sin(branchAngle)
            );
            
            // Create sub-branch
            this.createFrostBranch(
                branchStartPos,
                branchDirection,
                0,
                endRadius * 0.3,
                0.05, // Width
                1
            );
        }
    }
    
    createFrostBranch(origin, direction, startDistance, endDistance, width, depth) {
        // Maximum recursion depth
        if (depth > 2) return;
        
        // Create frost line on ground
        const points = [];
        const segmentCount = 10;
        const totalDistance = endDistance - startDistance;
        
        // Create a slightly curved path
        const controlPoint = new THREE.Vector3(
            origin.x + direction.x * (startDistance + totalDistance * 0.5) + (Math.random() - 0.5) * totalDistance * 0.3,
            origin.y,
            origin.z + direction.z * (startDistance + totalDistance * 0.5) + (Math.random() - 0.5) * totalDistance * 0.3
        );
        
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            const segmentDistance = startDistance + totalDistance * t;
            
            // Quadratic bezier curve
            const p0 = new THREE.Vector3(
                origin.x + direction.x * startDistance,
                origin.y,
                origin.z + direction.z * startDistance
            );
            
            const p2 = new THREE.Vector3(
                origin.x + direction.x * endDistance,
                origin.y,
                origin.z + direction.z * endDistance
            );
            
            // Interpolate between points
            const point = new THREE.Vector3();
            point.x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * controlPoint.x + t * t * p2.x;
            point.y = origin.y + 0.01; // Slightly above ground
            point.z = (1 - t) * (1 - t) * p0.z + 2 * (1 - t) * t * controlPoint.z + t * t * p2.z;
            
            points.push(point);
        }
        
        // Create frost line segments
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            
            // Calculate segment direction
            const segmentDir = new THREE.Vector3().subVectors(end, start).normalize();
            
            // Create perpendicular vector for width
            const perpendicular = new THREE.Vector3(-segmentDir.z, 0, segmentDir.x);
            
            // Create quad geometry for segment
            const segmentWidth = width * (1 - i / points.length * 0.5); // Taper width
            
            const v1 = new THREE.Vector3().copy(start).add(perpendicular.clone().multiplyScalar(segmentWidth));
            const v2 = new THREE.Vector3().copy(start).add(perpendicular.clone().multiplyScalar(-segmentWidth));
            const v3 = new THREE.Vector3().copy(end).add(perpendicular.clone().multiplyScalar(-segmentWidth));
            const v4 = new THREE.Vector3().copy(end).add(perpendicular.clone().multiplyScalar(segmentWidth));
            
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                v1.x, v1.y, v1.z,
                v2.x, v2.y, v2.z,
                v3.x, v3.y, v3.z,
                
                v1.x, v1.y, v1.z,
                v3.x, v3.y, v3.z,
                v4.x, v4.y, v4.z
            ]);
            
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            const material = new THREE.MeshPhongMaterial({
                color: 0xadd8e6,
                transparent: true,
                opacity: 0.5,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2
            });
            
            const segment = new THREE.Mesh(geometry, material);
            this.scene.add(segment);
            
            // Add to ice trees for cleanup
            this.iceTrees.push({
                group: segment,
                isSegment: true
            });
        }
        
        // Recursively create smaller branches
        if (depth < 2 && Math.random() < 0.7) {
            const branchCount = 1 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < branchCount; i++) {
                // Calculate branch start position along this branch
                const branchIndex = Math.floor(points.length * (0.5 + Math.random() * 0.3));
                const branchStartPos = points[branchIndex];
                
                // Calculate branch angle (off to the side from this branch)
                const currentDir = new THREE.Vector3().subVectors(
                    points[branchIndex + 1] || points[branchIndex],
                    points[branchIndex - 1] || points[branchIndex]
                ).normalize();
                
                const branchAngle = Math.atan2(currentDir.z, currentDir.x) + 
                                   (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4 + Math.random() * Math.PI / 4);
                
                const branchDirection = new THREE.Vector3(
                    Math.cos(branchAngle),
                    0,
                    Math.sin(branchAngle)
                );
                
                // Create sub-branch
                this.createFrostBranch(
                    branchStartPos,
                    branchDirection,
                    0,
                    totalDistance * 0.4,
                    width * 0.6,
                    depth + 1
                );
            }
        }
    }
    
    createEnemyFrostEffect(enemy) {
        // Create ice crystals on the enemy
        if (!enemy.frostEffects) {
            enemy.frostEffects = [];
        }
        
        // Get enemy position and size
        const position = enemy.group ? enemy.group.position : enemy.position;
        const size = enemy.size || 1;
        
        // Create 3-5 ice crystals
        const crystalCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < crystalCount; i++) {
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.1 * size);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.08 * size);
                    break;
                default:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.06 * size);
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
            const height = 0.2 + Math.random() * 0.8;
            const radius = 0.3 * size;
            
            crystal.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + height,
                position.z + Math.sin(angle) * radius
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            this.scene.add(crystal);
            enemy.frostEffects.push(crystal);
        }
    }
    
    cleanupIceTrees() {
        // Remove all ice trees
        for (const tree of this.iceTrees) {
            if (tree.isSegment) {
                // Simple segment
                this.scene.remove(tree.group);
                if (tree.group.geometry) tree.group.geometry.dispose();
                if (tree.group.material) tree.group.material.dispose();
            } else {
                // Full tree
                this.scene.remove(tree.group);
                
                // Dispose of geometries and materials
                if (tree.trunk) {
                    tree.trunk.geometry.dispose();
                    tree.trunk.material.dispose();
                }
                
                if (tree.branches) {
                    tree.branches.forEach(branch => {
                        branch.geometry.dispose();
                        branch.material.dispose();
                    });
                }
                
                if (tree.crystals) {
                    tree.crystals.forEach(crystal => {
                        crystal.geometry.dispose();
                        crystal.material.dispose();
                    });
                }
            }
        }
        
        this.iceTrees = [];
    }
}