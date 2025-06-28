import Skill from '../skill.js';
import * as THREE from 'three';

export default class FrozenOrb extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Frozen Orb";
        this.manaCost = 70;
        this.damage = 100;
        this.duration = 8.0;
        this.radius = 5;
        this.orbitSpeed = 2.0;
        this.damagePerSecond = 15;
        this.slowAmount = 0.4; // 40% slow
        this.orbGroup = null;
        this.orbActive = false;
        this.lastDamageTime = 0;
        this.orbCrystals = [];
    }

    getCooldownDuration() {
        return 1.0;
    }

    createEffect() {
        // Create a floating orb of ice that orbits the hero
        const origin = this.hero.group.position.clone();
        
        // Create orb group
        const orbGroup = new THREE.Group();
        orbGroup.position.copy(origin);
        orbGroup.position.y += 1.5; // Float above hero
        this.scene.add(orbGroup);
        
        // Create core sphere
        const coreGeometry = new THREE.IcosahedronGeometry(0.5, 1);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.7,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        orbGroup.add(core);
        
        // Create orbiting ice crystals
        const crystalCount = 12;
        for (let i = 0; i < crystalCount; i++) {
            this.createOrbCrystal(orbGroup, i, crystalCount);
        }
        
        // Create frost aura
        const auraGeometry = new THREE.SphereGeometry(this.radius, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        orbGroup.add(aura);
        
        // Store reference
        this.orbGroup = orbGroup;
        this.orbActive = true;
        this.lastDamageTime = Date.now();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('frozen-orb');
        }
        
        // Set a timeout to remove the orb
        setTimeout(() => {
            this.removeOrb();
        }, this.duration * 1000);
    }
    
    createOrbCrystal(parent, index, total) {
        // Create a tree-like crystal structure
        const crystalGroup = new THREE.Group();
        
        // Calculate position on sphere
        const phi = Math.acos(-1 + (2 * index) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        
        // Position on sphere
        const radius = 0.8;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        crystalGroup.position.set(x, y, z);
        
        // Point away from center
        crystalGroup.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));
        
        // Create main crystal (trunk)
        const trunkGeometry = new THREE.ConeGeometry(0.1, 0.4, 5);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.9,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.z = 0.2; // Move forward
        crystalGroup.add(trunk);
        
        // Create smaller crystals (branches)
        const branchCount = 3 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            
            // Create branch geometry
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
                    branchGeometry = new THREE.IcosahedronGeometry(0.05);
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
            
            // Position around trunk
            branch.position.set(
                Math.cos(angle) * 0.15,
                Math.sin(angle) * 0.15,
                0.2 + Math.random() * 0.1
            );
            
            // Random rotation
            branch.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            crystalGroup.add(branch);
        }
        
        parent.add(crystalGroup);
        this.orbCrystals.push(crystalGroup);
        
        return crystalGroup;
    }
    
    removeOrb() {
        if (!this.orbActive) return;
        
        // Create explosion effect
        if (this.orbGroup) {
            const position = this.orbGroup.position.clone();
            
            // Create explosion particles
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const height = Math.random() * Math.PI;
                const radius = Math.random() * 2;
                
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
                    0.1 + Math.random() * 0.1,
                    0.5 + Math.random() * 0.5
                );
                
                // Add outward velocity
                const direction = new THREE.Vector3(x, y, z).normalize();
                particle.velocity.copy(direction.multiplyScalar(3 + Math.random() * 5));
            }
            
            // Remove orb
            this.scene.remove(this.orbGroup);
            this.orbGroup.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.orbGroup = null;
        }
        
        // Set orb inactive
        this.orbActive = false;
        this.orbCrystals = [];
        
        // Play explosion sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-explosion');
        }
    }

    updateEffect(delta) {
        if (!this.orbActive || !this.orbGroup) return;
        
        // Update orb position to follow hero
        const heroPosition = this.hero.group.position.clone();
        heroPosition.y += 1.5; // Float above hero
        this.orbGroup.position.copy(heroPosition);
        
        // Rotate orb
        this.orbGroup.rotation.y += delta * this.orbitSpeed;
        this.orbGroup.rotation.x += delta * this.orbitSpeed * 0.5;
        
        // Animate crystals
        this.orbCrystals.forEach((crystal, index) => {
            // Pulse size
            const scale = 1 + 0.1 * Math.sin(Date.now() * 0.003 + index);
            crystal.scale.set(scale, scale, scale);
            
            // Rotate slightly
            crystal.rotation.z += delta * 0.5;
        });
        
        // Create occasional frost particles
        if (Math.random() < delta * 10) {
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = 0.8;
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const position = new THREE.Vector3(
                this.orbGroup.position.x + x,
                this.orbGroup.position.y + y,
                this.orbGroup.position.z + z
            );
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05,
                0.3 + Math.random() * 0.5
            );
            
            // Add slight outward velocity
            const direction = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(direction.multiplyScalar(0.5 + Math.random()));
        }
        
        // Apply damage to nearby enemies
        const now = Date.now();
        if (now - this.lastDamageTime > 500) { // Every 0.5 seconds
            this.lastDamageTime = now;
            
            const enemies = this.scene.getObjectsByProperty('type', 'enemy');
            
            enemies.forEach(enemy => {
                const distance = enemy.position.distanceTo(this.orbGroup.position);
                
                if (distance <= this.radius) {
                    // Apply damage with falloff based on distance
                    const damageMultiplier = 1 - (distance / this.radius) * 0.5;
                    enemy.takeDamage(this.damagePerSecond * damageMultiplier * 0.5); // 0.5 seconds worth
                    
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
                        
                        // Mark as from frozen orb
                        snowflake.userData.fromFrozenOrb = true;
                        
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
                    if (Math.random() < 0.2) {
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
                          enemy.slowIndicator.userData.fromFrozenOrb) {
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
}