import Skill from '../skill.js';
import * as THREE from 'three';

export default class GlacialBarrier extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Glacial Barrier";
        this.manaCost = 60;
        this.duration = 10.0;
        this.damageReduction = 0.6; // 60% damage reduction
        this.reflectDamage = 20; // Damage reflected to attackers
        this.slowRadius = 5; // Radius of slow effect around hero
        this.slowAmount = 0.5; // 50% slow
        this.particleCount = 40;
        this.barrierActive = false;
        this.barrierMesh = null;
        this.iceShards = [];
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Create an ice tree barrier around the hero
        const origin = this.hero.group.position.clone();
        
        // Create barrier group
        const barrierGroup = new THREE.Group();
        barrierGroup.position.copy(origin);
        barrierGroup.position.y += 1;
        this.scene.add(barrierGroup);
        
        // Create base dome structure
        const domeGeometry = new THREE.SphereGeometry(1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6, // Light blue
            transparent: true,
            opacity: 0.3,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2,
            side: THREE.DoubleSide
        });
        
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.rotation.x = Math.PI; // Flip dome to cover hero
        barrierGroup.add(dome);
        
        // Create ice tree trunks around the perimeter
        const treeCount = 8;
        const trees = [];
        
        for (let i = 0; i < treeCount; i++) {
            const angle = (i / treeCount) * Math.PI * 2;
            const treeGroup = new THREE.Group();
            
            // Position tree on perimeter
            const x = Math.cos(angle) * 1.5;
            const z = Math.sin(angle) * 1.5;
            treeGroup.position.set(x, 0, z);
            
            // Create trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 5);
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
            
            // Angle trunk slightly outward
            trunk.rotation.x = Math.PI * 0.1;
            trunk.rotation.y = -angle;
            
            treeGroup.add(trunk);
            
            // Create branches
            const branchCount = 3 + Math.floor(Math.random() * 3);
            const branches = [];
            
            for (let j = 0; j < branchCount; j++) {
                const branchAngle = (j / branchCount) * Math.PI * 2;
                const branchHeight = 0.2 + (j / branchCount) * 0.8;
                
                const branchGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.4, 4);
                const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
                
                // Position on trunk
                branch.position.y = branchHeight;
                
                // Rotate to point outward and upward
                branch.rotation.z = Math.PI / 4; // 45 degrees up
                branch.rotation.y = branchAngle;
                
                // Move outward from trunk
                branch.position.x = Math.cos(branchAngle) * 0.1;
                branch.position.z = Math.sin(branchAngle) * 0.1;
                
                treeGroup.add(branch);
                branches.push(branch);
            }
            
            // Create ice crystals (leaves)
            const crystalCount = 8 + Math.floor(Math.random() * 5);
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
            
            barrierGroup.add(treeGroup);
            trees.push({
                group: treeGroup,
                trunk,
                branches,
                crystals,
                angle
            });
        }
        
        // Create ice arches connecting the trees
        for (let i = 0; i < treeCount; i++) {
            const startAngle = (i / treeCount) * Math.PI * 2;
            const endAngle = ((i + 1) % treeCount / treeCount) * Math.PI * 2;
            
            const startX = Math.cos(startAngle) * 1.5;
            const startZ = Math.sin(startAngle) * 1.5;
            
            const endX = Math.cos(endAngle) * 1.5;
            const endZ = Math.sin(endAngle) * 1.5;
            
            // Create arch curve
            const archPoints = [];
            const segments = 8;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const x = startX + (endX - startX) * t;
                const z = startZ + (endZ - startZ) * t;
                
                // Add height to create arch
                const y = Math.sin(t * Math.PI) * 0.8;
                
                archPoints.push(new THREE.Vector3(x, y, z));
            }
            
            const archCurve = new THREE.CatmullRomCurve3(archPoints);
            const archGeometry = new THREE.TubeGeometry(archCurve, 8, 0.05, 6, false);
            const archMaterial = new THREE.MeshPhongMaterial({
                color: 0xadd8e6, // Light blue
                transparent: true,
                opacity: 0.7,
                shininess: 90,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2
            });
            
            const arch = new THREE.Mesh(archGeometry, archMaterial);
            barrierGroup.add(arch);
            
            // Add ice crystals along the arch
            for (let j = 0; j < 5; j++) {
                const t = (j + 0.5) / 5;
                const point = archCurve.getPoint(t);
                
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
                
                // Random rotation
                crystal.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                barrierGroup.add(crystal);
            }
        }
        
        // Store reference to barrier group
        this.barrierMesh = barrierGroup;
        
        // Store trees for animation
        this.iceShards = trees;
        
        // Create barrier particles
        for (let i = 0; i < this.particleCount; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.particleCount);
            const theta = Math.sqrt(this.particleCount * Math.PI) * phi;
            
            const x = 1.5 * Math.sin(phi) * Math.cos(theta);
            const y = 1.5 * Math.sin(phi) * Math.sin(theta);
            const z = 1.5 * Math.cos(phi);
            
            const position = new THREE.Vector3(
                origin.x + x,
                origin.y + y + 1,
                origin.z + z
            );
            
            // Create particle with ice color
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05,
                this.duration
            );
            
            // Set particle to orbit around hero
            particle.orbitRadius = 1.5;
            particle.orbitSpeed = 0.3 + Math.random() * 0.5;
            particle.orbitOffset = Math.random() * Math.PI * 2;
            particle.orbitAxis = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            
            // Override default particle update
            particle.update = (delta) => {
                const time = Date.now() / 1000;
                const angle = time * particle.orbitSpeed + particle.orbitOffset;
                
                // Create rotation matrix around orbit axis
                const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                    particle.orbitAxis,
                    angle
                );
                
                // Calculate new position
                const basePosition = new THREE.Vector3(
                    particle.orbitRadius, 0, 0
                );
                basePosition.applyMatrix4(rotationMatrix);
                
                // Set position relative to hero
                particle.mesh.position.copy(this.hero.group.position);
                particle.mesh.position.y += 1;
                particle.mesh.position.add(basePosition);
                
                // Fade out near end of duration
                const remainingLife = particle.life;
                if (remainingLife < 1.0) {
                    particle.mesh.material.opacity = remainingLife;
                }
            };
        }
        
        // Set barrier active
        this.barrierActive = true;
        
        // Apply damage reduction to hero
        this.hero.damageReductionMultiplier = this.damageReduction;
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-barrier');
        }
        
        // Set a timeout to remove the barrier
        setTimeout(() => {
            this.removeBarrier();
        }, this.duration * 1000);
    }
    
    removeBarrier() {
        if (!this.barrierActive) return;
        
        // Remove barrier mesh
        if (this.barrierMesh) {
            this.scene.remove(this.barrierMesh);
            this.barrierMesh.geometry.dispose();
            this.barrierMesh.material.dispose();
            this.barrierMesh = null;
        }
        
        // Remove ice shards
        this.iceShards.forEach(shard => {
            this.scene.remove(shard);
            shard.geometry.dispose();
            shard.material.dispose();
        });
        this.iceShards = [];
        
        // Reset damage reduction
        this.hero.damageReductionMultiplier = 1.0;
        
        // Set barrier inactive
        this.barrierActive = false;
        
        // Create shattering effect
        const origin = this.hero.group.position.clone();
        origin.y += 1;
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = 1.5;
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const position = new THREE.Vector3(
                origin.x + x,
                origin.y + y,
                origin.z + z
            );
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.1 + Math.random() * 0.1,
                0.5 + Math.random() * 0.5
            );
            
            // Add outward velocity
            const direction = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(direction.multiplyScalar(3 + Math.random() * 5));
        }
        
        // Play shatter sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-shatter');
        }
    }

    updateEffect(delta) {
        if (!this.barrierActive) return;
        
        // Update barrier position to follow hero
        if (this.barrierMesh) {
            this.barrierMesh.position.copy(this.hero.group.position);
            this.barrierMesh.position.y += 1;
            
            // Rotate barrier
            this.barrierMesh.rotation.y += delta * 0.5;
            this.barrierMesh.rotation.x += delta * 0.2;
        }
        
        // Update ice shards position
        this.iceShards.forEach((shard, index) => {
            const time = Date.now() / 1000;
            const angle = time * 0.5 + (index / this.iceShards.length) * Math.PI * 2;
            
            const phi = Math.acos(-1 + (2 * index) / this.iceShards.length);
            const theta = Math.sqrt(this.iceShards.length * Math.PI) * phi + angle;
            
            const x = 1.5 * Math.sin(phi) * Math.cos(theta);
            const y = 1.5 * Math.sin(phi) * Math.sin(theta);
            const z = 1.5 * Math.cos(phi);
            
            shard.position.set(
                this.hero.group.position.x + x,
                this.hero.group.position.y + y + 1,
                this.hero.group.position.z + z
            );
            
            // Point shard outward
            shard.lookAt(new THREE.Vector3(
                this.hero.group.position.x + x * 2,
                this.hero.group.position.y + y * 2 + 1,
                this.hero.group.position.z + z * 2
            ));
        });
        
        // Check for enemies in slow radius and apply slow effect
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= this.slowRadius) {
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
                
                // Create occasional frost particles around slowed enemy
                if (Math.random() < 0.05) {
                    const position = enemy.position.clone();
                    position.y += Math.random() * 2;
                    
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
            } else if (enemy.slowed) {
                // Remove slow effect when enemy leaves radius
                enemy.speed = enemy.originalSpeed;
                enemy.slowed = false;
                
                // Remove slow indicator
                if (enemy.slowIndicator) {
                    this.scene.remove(enemy.slowIndicator);
                    enemy.slowIndicator.geometry.dispose();
                    enemy.slowIndicator.material.dispose();
                    enemy.slowIndicator = null;
                }
            }
        });
        
        // Check for enemies hitting barrier and apply reflect damage
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(origin);
            
            if (distance <= 2.0) { // Close enough to hit barrier
                // Apply reflect damage
                enemy.takeDamage(this.reflectDamage * delta);
                
                // Create impact particles
                if (Math.random() < 0.1) {
                    const toEnemy = new THREE.Vector3().subVectors(enemy.position, origin).normalize();
                    const impactPosition = origin.clone().add(toEnemy.multiplyScalar(1.5));
                    impactPosition.y += 1;
                    
                    for (let i = 0; i < 5; i++) {
                        const particle = this.createParticle(
                            impactPosition,
                            0x88ccff, // Light blue
                            0.05 + Math.random() * 0.05,
                            0.2 + Math.random() * 0.3
                        );
                        
                        // Add outward velocity
                        particle.velocity.copy(toEnemy.clone().multiplyScalar(2 + Math.random() * 3));
                    }
                }
            }
        });
    }
}