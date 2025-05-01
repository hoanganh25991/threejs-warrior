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
        
        // Create expanding frost ring
        const segments = 32;
        const geometry = new THREE.RingGeometry(0.1, this.range, segments);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2; // Lay flat on the ground
        ring.position.copy(origin);
        
        this.scene.add(ring);
        
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
        
        // Animate ring expansion and fade
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / this.duration;
            
            if (progress < 1) {
                ring.scale.setScalar(progress);
                material.opacity = 0.5 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        
        animate();

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
    
    createEnemyFrostEffect(enemy) {
        // Create a small ice formation on the enemy
        const frostGroup = new THREE.Group();
        
        // Create several ice crystals
        for (let i = 0; i < 5; i++) {
            const crystalGeometry = new THREE.TetrahedronGeometry(0.1);
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
