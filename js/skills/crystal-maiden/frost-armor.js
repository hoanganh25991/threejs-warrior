import Skill from '../skill.js';
import * as THREE from 'three';

export default class FrostArmor extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Frost Armor";
        this.manaCost = 30;
        this.duration = 15.0;
        this.damageReduction = 0.4; // 40% damage reduction
        this.reflectDamage = 10; // Damage reflected to attackers
        this.armorActive = false;
        this.armorMesh = null;
        this.armorCrystals = [];
        this.lastParticleTime = 0;
    }

    getCooldownDuration() {
        return 18.0;
    }

    createEffect() {
        // Create a frost armor that surrounds the hero
        const origin = this.hero.group.position.clone();
        
        // Create armor group
        const armorGroup = new THREE.Group();
        armorGroup.position.copy(origin);
        this.scene.add(armorGroup);
        
        // Create base armor layer
        const armorGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const armorMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.3,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.2,
            wireframe: true
        });
        
        const armor = new THREE.Mesh(armorGeometry, armorMaterial);
        armor.position.y = 1; // Center at hero's chest
        armorGroup.add(armor);
        
        // Create ice crystal formations on the armor
        const crystalCount = 8;
        for (let i = 0; i < crystalCount; i++) {
            this.createArmorCrystal(armorGroup, i, crystalCount);
        }
        
        // Store reference
        this.armorMesh = armorGroup;
        this.armorActive = true;
        this.lastParticleTime = Date.now();
        
        // Apply damage reduction to hero
        this.hero.damageReductionMultiplier = this.damageReduction;
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('frost-armor');
        }
        
        // Set a timeout to remove the armor
        setTimeout(() => {
            this.removeArmor();
        }, this.duration * 1000);
    }
    
    createArmorCrystal(parent, index, total) {
        // Create a tree-like crystal structure on the armor
        const crystalGroup = new THREE.Group();
        
        // Calculate position on sphere
        const phi = Math.acos(-1 + (2 * index) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        
        // Position on sphere
        const radius = 1.2;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta) + 1; // Adjust for hero height
        const z = radius * Math.cos(phi);
        
        crystalGroup.position.set(x, y, z);
        
        // Point away from center
        crystalGroup.lookAt(new THREE.Vector3(x * 2, y, z * 2));
        
        // Create main crystal (trunk)
        const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.4, 5);
        const trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0xadd8e6,
            transparent: true,
            opacity: 0.8,
            shininess: 90,
            emissive: 0x0088ff,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.z = 0.2; // Move outward
        crystalGroup.add(trunk);
        
        // Create branches
        const branchCount = 3 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            
            const branchGeometry = new THREE.CylinderGeometry(0.02, 0.04, 0.2, 4);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position on trunk
            branch.position.z = 0.2;
            
            // Rotate to point outward and in different directions
            branch.rotation.x = Math.PI / 4; // 45 degrees up
            branch.rotation.y = angle;
            
            // Move outward from trunk
            branch.position.x = Math.cos(angle) * 0.1;
            branch.position.y = Math.sin(angle) * 0.1;
            
            crystalGroup.add(branch);
        }
        
        // Create ice crystals (leaves)
        const crystalCount = 5 + Math.floor(Math.random() * 3);
        
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
            const distance = 0.1 + Math.random() * 0.2;
            
            crystal.position.set(
                Math.cos(angle) * distance,
                Math.sin(angle) * distance,
                0.2 + Math.random() * 0.2
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            crystalGroup.add(crystal);
        }
        
        parent.add(crystalGroup);
        this.armorCrystals.push(crystalGroup);
        
        return crystalGroup;
    }
    
    removeArmor() {
        if (!this.armorActive) return;
        
        // Create shattering effect
        if (this.armorMesh) {
            const position = this.armorMesh.position.clone();
            position.y += 1;
            
            // Create shattering particles
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const height = Math.random() * Math.PI;
                const radius = 1.2;
                
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
            
            // Remove armor
            this.scene.remove(this.armorMesh);
            this.armorMesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.armorMesh = null;
        }
        
        // Reset damage reduction
        this.hero.damageReductionMultiplier = 1.0;
        
        // Set armor inactive
        this.armorActive = false;
        this.armorCrystals = [];
        
        // Play shatter sound
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('ice-shatter');
        }
    }

    updateEffect(delta) {
        if (!this.armorActive || !this.armorMesh) return;
        
        // Update armor position to follow hero
        const heroPosition = this.hero.group.position.clone();
        this.armorMesh.position.copy(heroPosition);
        
        // Animate armor crystals
        this.armorCrystals.forEach((crystal, index) => {
            // Pulse size
            const scale = 1 + 0.1 * Math.sin(Date.now() * 0.003 + index);
            crystal.scale.set(scale, scale, scale);
            
            // Rotate slightly
            crystal.rotation.z += delta * 0.2;
        });
        
        // Create occasional frost particles
        const now = Date.now();
        if (now - this.lastParticleTime > 200) { // Every 0.2 seconds
            this.lastParticleTime = now;
            
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * Math.PI;
            const radius = 1.2;
            
            const x = radius * Math.sin(height) * Math.cos(angle);
            const y = radius * Math.cos(height);
            const z = radius * Math.sin(height) * Math.sin(angle);
            
            const position = new THREE.Vector3(
                this.armorMesh.position.x + x,
                this.armorMesh.position.y + y + 1, // Adjust for hero height
                this.armorMesh.position.z + z
            );
            
            const particle = this.createParticle(
                position,
                0x88ccff, // Light blue
                0.05 + Math.random() * 0.05,
                0.3 + Math.random() * 0.5
            );
            
            // Add slight outward velocity
            const direction = new THREE.Vector3(x, y, z).normalize();
            particle.velocity.copy(direction.multiplyScalar(0.2 + Math.random() * 0.3));
        }
        
        // Check for enemies hitting hero and apply reflect damage
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const heroPosition = this.hero.group.position;
        
        enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(heroPosition);
            
            if (distance <= 2.0) { // Close enough to hit hero
                // Apply reflect damage
                enemy.takeDamage(this.reflectDamage * delta);
                
                // Create impact particles
                if (Math.random() < 0.1) {
                    const toEnemy = new THREE.Vector3().subVectors(enemy.position, heroPosition).normalize();
                    const impactPosition = heroPosition.clone().add(toEnemy.multiplyScalar(1.5));
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