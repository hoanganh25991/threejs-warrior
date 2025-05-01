import Skill from '../skill.js';
import * as THREE from 'three';

export default class Blizzard extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Blizzard";
        this.manaCost = 90;
        this.damage = 120;
        this.range = 10;
        this.radius = 8;
        this.duration = 6.0;
        this.slowAmount = 0.7; // 70% slow
        this.particleCount = 200;
        this.blizzardActive = false;
        this.blizzardCenter = null;
        this.blizzardMesh = null;
        this.lastParticleTime = 0;
    }

    getCooldownDuration() {
        return 20.0;
    }

    createEffect() {
        // Create a massive blizzard with ice trees in target area
        const origin = this.hero.group.position.clone();
        const direction = this.hero.direction.clone();
        const targetPosition = origin.clone().add(direction.clone().multiplyScalar(this.range));
        
        // Store blizzard center
        this.blizzardCenter = targetPosition.clone();
        
        // Create blizzard area group
        const blizzardGroup = new THREE.Group();
        blizzardGroup.position.copy(targetPosition);
        this.scene.add(blizzardGroup);
        
        // Create base frost ground
        const areaGeometry = new THREE.CircleGeometry(this.radius, 32);
        const areaMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2
        });
        
        const area = new THREE.Mesh(areaGeometry, areaMaterial);
        area.rotation.x = -Math.PI / 2; // Lay flat
        area.position.y = 0.05; // Slightly above ground
        blizzardGroup.add(area);
        
        // Create frost patterns on ground (tree root patterns)
        const patternCount = 8;
        for (let i = 0; i < patternCount; i++) {
            const angle = (i / patternCount) * Math.PI * 2;
            const startRadius = 1;
            const endRadius = this.radius * 0.9;
            
            // Create branching frost pattern
            this.createFrostPattern(
                blizzardGroup,
                new THREE.Vector3(Math.cos(angle) * startRadius, 0.06, Math.sin(angle) * startRadius),
                new THREE.Vector3(Math.cos(angle) * endRadius, 0.06, Math.sin(angle) * endRadius),
                3, // Depth
                0.8 // Width
            );
        }
        
        // Create central ice tree (largest)
        this.createIceTree(
            blizzardGroup,
            new THREE.Vector3(0, 0, 0),
            2.5, // Height
            1.0 // Scale
        );
        
        // Create smaller ice trees around the perimeter
        const treeCount = 6;
        for (let i = 0; i < treeCount; i++) {
            const angle = (i / treeCount) * Math.PI * 2;
            const radius = this.radius * 0.6;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            this.createIceTree(
                blizzardGroup,
                position,
                1.5 + Math.random() * 1.0, // Height
                0.6 + Math.random() * 0.4 // Scale
            );
        }
        
        // Create even smaller ice formations randomly
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius * 0.8;
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            // Randomly choose between small tree or crystal formation
            if (Math.random() > 0.5) {
                this.createIceTree(
                    blizzardGroup,
                    position,
                    0.5 + Math.random() * 0.5, // Height
                    0.3 + Math.random() * 0.2 // Scale
                );
            } else {
                this.createIceCrystalFormation(
                    blizzardGroup,
                    position,
                    0.3 + Math.random() * 0.3 // Scale
                );
            }
        }
        
        // Create swirling snow effect
        const snowCloudGeometry = new THREE.SphereGeometry(this.radius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const snowCloudMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const snowCloud = new THREE.Mesh(snowCloudGeometry, snowCloudMaterial);
        snowCloud.rotation.x = Math.PI; // Flip dome
        snowCloud.position.y = this.radius * 0.8;
        snowCloud.scale.y = 0.5; // Flatten
        blizzardGroup.add(snowCloud);
        
        // Store reference
        this.blizzardMesh = blizzardGroup;
        
        // Create initial snow burst
        for (let i = 0; i < this.particleCount / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius;
            
            const position = new THREE.Vector3(
                targetPosition.x + Math.cos(angle) * radius,
                targetPosition.y + 5 + Math.random() * 5, // Start high
                targetPosition.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xffffff, // White
                0.05 + Math.random() * 0.1,
                1.0 + Math.random() * 2.0
            );
            
            // Add downward velocity
            particle.velocity.y = -2 - Math.random() * 3;
            particle.velocity.x = (Math.random() - 0.5) * 2;
            particle.velocity.z = (Math.random() - 0.5) * 2;
        }
    }
    
    createFrostPattern(parent, start, end, depth, width) {
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
        parent.add(tube);
        
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
            
            this.createFrostPattern(parent, midPoint, branchEnd, depth - 1, width * 0.6);
        }
    }
    
    createIceTree(parent, position, height, scale) {
        const treeGroup = new THREE.Group();
        treeGroup.position.copy(position);
        treeGroup.scale.set(scale, scale, scale);
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, height, 6);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6, // Light blue
            transparent: true,
            opacity: 0.8,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = height / 2; // Half height
        treeGroup.add(trunk);
        
        // Create branches
        const branchCount = 4 + Math.floor(Math.random() * 3);
        const branches = [];
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const branchHeight = 0.3 + (i / branchCount) * (height - 0.5);
            
            const branchGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.4, 4);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position on trunk
            branch.position.y = branchHeight;
            
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
                const trunkHeight = Math.random() * height;
                
                crystal.position.set(
                    Math.cos(angle) * 0.08,
                    trunkHeight,
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
        }
        
        parent.add(treeGroup);
        return treeGroup;
    }
    
    createIceCrystalFormation(parent, position, scale) {
        const formationGroup = new THREE.Group();
        formationGroup.position.copy(position);
        formationGroup.scale.set(scale, scale, scale);
        
        // Create base crystal
        const baseGeometry = new THREE.OctahedronGeometry(0.3, 0);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.8,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.15;
        formationGroup.add(base);
        
        // Create additional crystals
        const crystalCount = 5 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < crystalCount; i++) {
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.15);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.12);
                    break;
                default:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.1);
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
            
            // Position around base
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.1 + Math.random() * 0.2;
            const height = 0.1 + Math.random() * 0.3;
            
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
            
            formationGroup.add(crystal);
        }
        
        parent.add(formationGroup);
        return formationGroup;
    }
        
        // Set blizzard active
        this.blizzardActive = true;
        this.lastParticleTime = Date.now();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('blizzard');
        }
        
        // Set a timeout to end the blizzard
        setTimeout(() => {
            this.endBlizzard();
        }, this.duration * 1000);
    }
    
    endBlizzard() {
        if (!this.blizzardActive) return;
        
        // Remove blizzard mesh
        if (this.blizzardMesh) {
            this.scene.remove(this.blizzardMesh);
            this.blizzardMesh.geometry.dispose();
            this.blizzardMesh.material.dispose();
            this.blizzardMesh = null;
        }
        
        // Set blizzard inactive
        this.blizzardActive = false;
        this.blizzardCenter = null;
    }

    updateEffect(delta) {
        if (!this.blizzardActive || !this.blizzardCenter) return;
        
        // Update blizzard area appearance
        if (this.blizzardMesh) {
            // Pulse effect
            const pulseScale = 1 + 0.05 * Math.sin(Date.now() / 300);
            this.blizzardMesh.scale.set(pulseScale, 1, pulseScale);
        }
        
        // Create continuous snow particles
        const now = Date.now();
        if (now - this.lastParticleTime > 50) { // Every 50ms
            this.lastParticleTime = now;
            
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.radius;
                
                const position = new THREE.Vector3(
                    this.blizzardCenter.x + Math.cos(angle) * radius,
                    this.blizzardCenter.y + 10 + Math.random() * 5, // Start high
                    this.blizzardCenter.z + Math.sin(angle) * radius
                );
                
                const particle = this.createParticle(
                    position,
                    0xffffff, // White
                    0.05 + Math.random() * 0.1,
                    1.0 + Math.random() * 2.0
                );
                
                // Add downward velocity with some randomness
                particle.velocity.y = -2 - Math.random() * 3;
                particle.velocity.x = (Math.random() - 0.5) * 2;
                particle.velocity.z = (Math.random() - 0.5) * 2;
                
                // Override update to add swirling motion
                const originalUpdate = particle.update;
                particle.update = (delta) => {
                    // Add swirling motion
                    const swirl = 0.5 * delta;
                    const angle = Math.atan2(
                        particle.mesh.position.z - this.blizzardCenter.z,
                        particle.mesh.position.x - this.blizzardCenter.x
                    );
                    
                    particle.mesh.position.x += Math.cos(angle + Math.PI/2) * swirl;
                    particle.mesh.position.z += Math.sin(angle + Math.PI/2) * swirl;
                    
                    // Call original update
                    originalUpdate(delta);
                };
            }
        }
        
        // Create occasional ice crystals
        if (Math.random() < 0.05) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.radius * 0.8;
            
            const position = new THREE.Vector3(
                this.blizzardCenter.x + Math.cos(angle) * radius,
                this.blizzardCenter.y + 0.1, // Just above ground
                this.blizzardCenter.z + Math.sin(angle) * radius
            );
            
            const crystalGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
            const crystalMaterial = new THREE.MeshBasicMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7
            });
            
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.copy(position);
            crystal.rotation.x = Math.PI / 2; // Point upward
            this.scene.add(crystal);
            
            // Store in particles array to be cleaned up
            this.particles.push({
                mesh: crystal,
                life: 1.0 + Math.random() * 2.0,
                update: (delta) => {
                    // Grow slightly
                    crystal.scale.x += delta * 0.2;
                    crystal.scale.y += delta * 0.2;
                    crystal.scale.z += delta * 0.2;
                    
                    // Fade out near end of life
                    if (crystal.material.opacity > 0.1) {
                        crystal.material.opacity -= delta * 0.2;
                    }
                }
            });
        }
        
        // Check for enemies in blizzard area and apply damage and slow
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        
        enemies.forEach(enemy => {
            const horizontalDistance = new THREE.Vector2(
                enemy.position.x - this.blizzardCenter.x,
                enemy.position.z - this.blizzardCenter.z
            ).length();
            
            if (horizontalDistance <= this.radius) {
                // Apply damage
                enemy.takeDamage(this.damage * delta / 2); // Divide by 2 for balanced DPS
                
                // Apply slow effect
                if (!enemy.slowed) {
                    enemy.slowed = true;
                    enemy.originalSpeed = enemy.speed;
                    enemy.speed *= (1 - this.slowAmount);
                    
                    // Create slow indicator
                    const snowflakeGeometry = new THREE.CircleGeometry(0.2, 6);
                    const snowflakeMaterial = new THREE.MeshBasicMaterial({
                        color: 0x88ccff,
                        transparent: true,
                        opacity: 0.7
                    });
                    
                    const snowflake = new THREE.Mesh(snowflakeGeometry, snowflakeMaterial);
                    snowflake.position.copy(enemy.position);
                    snowflake.position.y += 2;
                    snowflake.rotation.x = -Math.PI / 2;
                    this.scene.add(snowflake);
                    
                    // Store reference on enemy
                    enemy.slowIndicator = snowflake;
                }
                
                // Update slow indicator position
                if (enemy.slowIndicator) {
                    enemy.slowIndicator.position.copy(enemy.position);
                    enemy.slowIndicator.position.y += 2;
                    enemy.slowIndicator.rotation.z += delta * 2;
                }
                
                // Create frost particles on enemy
                if (Math.random() < 0.1) {
                    const position = enemy.position.clone();
                    position.y += 1;
                    
                    const particle = this.createParticle(
                        position,
                        0x88ccff, // Light blue
                        0.05 + Math.random() * 0.05,
                        0.3 + Math.random() * 0.5
                    );
                    
                    // Add slight upward velocity
                    particle.velocity.y = 0.5 + Math.random() * 1;
                    particle.velocity.x = (Math.random() - 0.5) * 0.5;
                    particle.velocity.z = (Math.random() - 0.5) * 0.5;
                }
            } else if (enemy.slowed && enemy.slowIndicator && 
                      enemy.slowIndicator.userData.fromBlizzard) {
                // Remove slow effect when enemy leaves radius
                enemy.speed = enemy.originalSpeed;
                enemy.slowed = false;
                
                // Remove slow indicator
                this.scene.remove(enemy.slowIndicator);
                enemy.slowIndicator.geometry.dispose();
                enemy.slowIndicator.material.dispose();
                enemy.slowIndicator = null;
            }
        });
    }
}