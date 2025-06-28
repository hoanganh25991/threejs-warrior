import Skill from '../skill.js';
import * as THREE from 'three';

export default class IceShards extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Ice Shards";
        this.manaCost = 35;
        this.damage = 50;
        this.range = 12;
        this.projectileSpeed = 18;
        this.projectileCount = 5;
        this.spreadAngle = Math.PI / 6; // 30 degrees
        this.projectiles = [];
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Create multiple ice shard projectiles that spread out
        const origin = this.hero.group.position.clone();
        origin.y += 1.5; // Start at head level
        
        const baseDirection = this.hero.direction.clone();
        
        // Create projectiles
        for (let i = 0; i < this.projectileCount; i++) {
            // Calculate spread angle
            const angleOffset = this.spreadAngle * (i / (this.projectileCount - 1) - 0.5);
            
            // Create rotated direction
            const direction = baseDirection.clone();
            const rotationAxis = new THREE.Vector3(0, 1, 0);
            direction.applyAxisAngle(rotationAxis, angleOffset);
            
            // Create projectile
            this.createIceShard(origin, direction, i);
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-shards');
        }
    }
    
    createIceShard(origin, direction, index) {
        // Create a tree-like ice shard projectile
        const projectileGroup = new THREE.Group();
        projectileGroup.position.copy(origin);
        this.scene.add(projectileGroup);
        
        // Create the core ice crystal (trunk)
        const coreGeometry = new THREE.ConeGeometry(0.1, 0.5, 5);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.9,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        
        // Rotate to point in direction of travel
        core.rotation.x = Math.PI / 2;
        projectileGroup.add(core);
        
        // Create ice crystal branches
        const branchCount = 3 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            
            // Create branch geometry - smaller crystal
            let branchGeometry;
            const branchType = Math.floor(Math.random() * 3);
            
            switch (branchType) {
                case 0:
                    branchGeometry = new THREE.TetrahedronGeometry(0.08);
                    break;
                case 1:
                    branchGeometry = new THREE.OctahedronGeometry(0.06);
                    break;
                default:
                    branchGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
            }
            
            const branchMaterial = new THREE.MeshPhongMaterial({
                color: 0xd6f1ff,
                transparent: true,
                opacity: 0.8,
                shininess: 100,
                emissive: 0x0088ff,
                emissiveIntensity: 0.2
            });
            
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            
            // Position around core
            branch.position.set(
                Math.cos(angle) * 0.1,
                Math.sin(angle) * 0.1,
                -0.1 - Math.random() * 0.1
            );
            
            // Random rotation
            branch.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            core.add(branch);
        }
        
        // Add some smaller crystals (leaves)
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.05 + Math.random() * 0.1;
            
            // Randomly choose crystal shape
            let crystalGeometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            switch (crystalType) {
                case 0:
                    crystalGeometry = new THREE.TetrahedronGeometry(0.04);
                    break;
                case 1:
                    crystalGeometry = new THREE.OctahedronGeometry(0.03);
                    break;
                default:
                    crystalGeometry = new THREE.IcosahedronGeometry(0.025);
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
                -0.2 - Math.random() * 0.2
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            core.add(crystal);
        }
        
        // Orient projectile in direction of travel
        projectileGroup.lookAt(origin.clone().add(direction));
        
        // Store projectile data
        this.projectiles.push({
            mesh: projectileGroup,
            direction: direction,
            distance: 0,
            hit: false,
            index: index
        });
        
        // Create initial trail particles
        for (let i = 0; i < 5; i++) {
            const position = origin.clone();
            position.x += (Math.random() - 0.5) * 0.1;
            position.y += (Math.random() - 0.5) * 0.1;
            position.z += (Math.random() - 0.5) * 0.1;
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05,
                0.3 + Math.random() * 0.3
            );
            
            // Add slight backward velocity
            particle.velocity.copy(direction.clone().multiplyScalar(-1 - Math.random()));
            particle.velocity.y += (Math.random() - 0.5);
        }
    }

    updateEffect(delta) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (projectile.hit) continue;
            
            // Move projectile
            const moveDistance = this.projectileSpeed * delta;
            projectile.mesh.position.add(projectile.direction.clone().multiplyScalar(moveDistance));
            projectile.distance += moveDistance;
            
            // Rotate projectile
            projectile.mesh.rotation.z += delta * 10;
            
            // Create trail particles
            if (Math.random() < 0.3) {
                const position = projectile.mesh.position.clone();
                position.x += (Math.random() - 0.5) * 0.1;
                position.y += (Math.random() - 0.5) * 0.1;
                position.z += (Math.random() - 0.5) * 0.1;
                
                const particle = this.createParticle(
                    position,
                    0x88ccff, // Light blue
                    0.05 + Math.random() * 0.05,
                    0.2 + Math.random() * 0.3
                );
                
                // Add slight backward velocity
                particle.velocity.copy(projectile.direction.clone().multiplyScalar(-1 - Math.random()));
                particle.velocity.y += (Math.random() - 0.5);
            }
            
            // Check for collision with enemies
            const enemies = this.scene.getObjectsByProperty('type', 'enemy');
            
            for (let j = 0; j < enemies.length; j++) {
                const enemy = enemies[j];
                const distance = enemy.position.distanceTo(projectile.mesh.position);
                
                if (distance <= 1.0) { // Hit radius
                    // Apply damage
                    enemy.takeDamage(this.damage);
                    
                    // Create impact effect
                    this.createImpactEffect(projectile.mesh.position.clone(), projectile.direction);
                    
                    // Remove projectile
                    this.scene.remove(projectile.mesh);
                    projectile.mesh.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(material => material.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                    
                    projectile.hit = true;
                    break;
                }
            }
            
            // Check for max range
            if (projectile.distance >= this.range) {
                // Create impact effect at end point
                this.createImpactEffect(projectile.mesh.position.clone(), projectile.direction);
                
                // Remove projectile
                this.scene.remove(projectile.mesh);
                projectile.mesh.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                
                projectile.hit = true;
            }
        }
        
        // Clean up hit projectiles
        this.projectiles = this.projectiles.filter(p => !p.hit);
    }
    
    createImpactEffect(position, direction) {
        // Create a small ice tree formation at impact point
        const impactGroup = new THREE.Group();
        impactGroup.position.copy(position);
        this.scene.add(impactGroup);
        
        // Create main trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.6, 5);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.8,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 0.3; // Half height
        
        // Orient trunk in direction of impact
        trunk.lookAt(position.clone().add(direction));
        trunk.rotateX(Math.PI / 2); // Adjust to point upward
        
        impactGroup.add(trunk);
        
        // Create branches
        const branchCount = 4 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const branchHeight = 0.1 + (i / branchCount) * 0.4;
            
            const branchGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.3, 4);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position on trunk
            branch.position.y = branchHeight;
            
            // Rotate to point outward and upward
            branch.rotation.z = Math.PI / 4; // 45 degrees up
            branch.rotation.y = angle;
            
            // Move outward from trunk
            branch.position.x = Math.cos(angle) * 0.1;
            branch.position.z = Math.sin(angle) * 0.1;
            
            trunk.add(branch);
        }
        
        // Create ice crystals
        const crystalCount = 8 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < crystalCount; i++) {
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
            
            // Position randomly
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.1 + Math.random() * 0.2;
            const height = Math.random() * 0.5;
            
            if (Math.random() > 0.5) {
                // Position on trunk
                crystal.position.set(
                    Math.cos(angle) * 0.05,
                    height,
                    Math.sin(angle) * 0.05
                );
                trunk.add(crystal);
            } else {
                // Position around impact
                crystal.position.set(
                    Math.cos(angle) * radius,
                    0.1 + Math.random() * 0.2,
                    Math.sin(angle) * radius
                );
                impactGroup.add(crystal);
            }
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
        }
        
        // Create impact particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = 0.2 + Math.random() * 0.3;
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const particlePos = new THREE.Vector3(
                position.x + x,
                position.y + y,
                position.z + z
            );
            
            const particle = this.createParticle(
                particlePos,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05,
                0.3 + Math.random() * 0.5
            );
            
            // Add outward velocity
            const particleDir = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(particleDir.multiplyScalar(1 + Math.random() * 2));
        }
        
        // Play impact sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-impact');
        }
        
        // Animate impact formation fade out
        const startTime = Date.now();
        const duration = 1.0; // 1 second
        
        const animateImpact = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                // Fade out
                impactGroup.traverse(child => {
                    if (child.material && child.material.opacity) {
                        child.material.opacity = 0.8 * (1 - progress);
                    }
                });
                
                requestAnimationFrame(animateImpact);
            } else {
                // Remove impact
                this.scene.remove(impactGroup);
                impactGroup.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        };
        
        animateImpact();
    }
}