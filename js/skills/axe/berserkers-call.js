import Skill from '../skill.js';
import * as THREE from 'three';

export default class BerserkersCall extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 60;
        this.damage = 50;
        this.range = 5;
        this.duration = 1.5;
        this.tauntDuration = 3.0; // Duration enemies are taunted
        this.mesh = null;
    }

    getCooldownDuration() {
        return 12.0;
    }

    createEffect() {
        // Create a tree-shaped red energy wave that expands outward
        const origin = this.hero.group.position.clone();
        origin.y += 1; // Adjust to be at character height
        
        // Create the base trunk of the tree
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1, 8);
        const trunkMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.copy(origin);
        trunk.position.y -= 0.5; // Adjust to ground level
        this.scene.add(trunk);
        
        // Create branches that extend outward
        const branches = [];
        const branchCount = 8;
        const branchGeometry = new THREE.CylinderGeometry(0.05, 0.1, 0.8, 6);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position at the top of the trunk
            branch.position.copy(origin);
            branch.position.y += 0.3;
            
            // Rotate to point outward
            branch.rotation.z = Math.PI / 2; // Make horizontal
            branch.rotation.y = angle; // Rotate around trunk
            
            // Move outward from trunk
            branch.position.x += Math.cos(angle) * 0.5;
            branch.position.z += Math.sin(angle) * 0.5;
            
            this.scene.add(branch);
            branches.push(branch);
        }
        
        // Create smaller branches (twigs) at the end of each branch
        const twigs = [];
        const twigGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.4, 4);
        
        for (let i = 0; i < branches.length; i++) {
            const branch = branches[i];
            const angle = (i / branchCount) * Math.PI * 2;
            
            // Create 2 twigs per branch
            for (let j = 0; j < 2; j++) {
                const twig = new THREE.Mesh(twigGeometry, trunkMaterial);
                
                // Position at the end of the branch
                twig.position.copy(branch.position);
                twig.position.x += Math.cos(angle) * 0.4;
                twig.position.z += Math.sin(angle) * 0.4;
                
                // Rotate to point outward and up
                twig.rotation.z = Math.PI / 4 + (j * Math.PI / 2); // Angle upward
                twig.rotation.y = angle + (j * Math.PI / 4 - Math.PI / 8); // Rotate around branch
                
                this.scene.add(twig);
                twigs.push(twig);
            }
        }
        
        // Create a shockwave ring
        const ringGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.copy(origin);
        ring.position.y = 0.1; // Just above ground
        this.scene.add(ring);
        
        // Store all meshes for animation and cleanup
        this.mesh = {
            trunk,
            branches,
            twigs,
            ring
        };
        
        // Create particles for added effect
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.range;
            
            const position = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y + Math.random() * 2,
                origin.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xff0000, // Red color
                0.1 + Math.random() * 0.1, // Size
                this.duration * Math.random() // Life
            );
            
            // Add upward velocity
            particle.velocity.y = 1 + Math.random() * 2;
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('battle-cry');
        }
        
        // Start animation
        this.animateEffect();
    }
    
    animateEffect() {
        const startTime = Date.now();
        const duration = this.duration * 1000; // Convert to milliseconds
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress < 1) {
                // Animate trunk growing
                this.mesh.trunk.scale.y = 1 + progress * 0.5;
                this.mesh.trunk.position.y -= progress * 0.25;
                
                // Animate branches extending
                this.mesh.branches.forEach((branch, i) => {
                    const angle = (i / this.mesh.branches.length) * Math.PI * 2;
                    branch.scale.y = 1 + progress;
                    branch.position.x = this.hero.group.position.x + Math.cos(angle) * (0.5 + progress * 0.5);
                    branch.position.z = this.hero.group.position.z + Math.sin(angle) * (0.5 + progress * 0.5);
                });
                
                // Animate twigs growing
                this.mesh.twigs.forEach((twig, i) => {
                    twig.scale.y = 0.5 + progress * 1.5;
                });
                
                // Animate ring expanding
                this.mesh.ring.scale.set(1 + progress * 4, 1 + progress * 4, 1);
                this.mesh.ring.material.opacity = 0.7 * (1 - progress);
                
                requestAnimationFrame(animate);
            } else {
                // Clean up meshes
                this.scene.remove(this.mesh.trunk);
                this.mesh.branches.forEach(branch => this.scene.remove(branch));
                this.mesh.twigs.forEach(twig => this.scene.remove(twig));
                this.scene.remove(this.mesh.ring);
                
                this.mesh.trunk.geometry.dispose();
                this.mesh.trunk.material.dispose();
                
                this.mesh.branches.forEach(branch => {
                    branch.geometry.dispose();
                    branch.material.dispose();
                });
                
                this.mesh.twigs.forEach(twig => {
                    twig.geometry.dispose();
                    twig.material.dispose();
                });
                
                this.mesh.ring.geometry.dispose();
                this.mesh.ring.material.dispose();
                
                this.mesh = null;
                this.isActive = false;
            }
        };
        
        animate();
    }
    
    updateEffect(delta) {
        // Check for enemies in range and apply taunt effect
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        
        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            if (distance <= this.range) {
                // Apply damage
                if (enemy.takeDamage) {
                    enemy.takeDamage(this.damage * delta);
                }
                
                // Apply taunt effect - force enemy to target hero
                if (enemy.setTarget) {
                    enemy.setTarget(this.hero);
                    
                    // Create visual indicator for taunted enemy
                    const indicator = this.createParticle(
                        enemy.position.clone().add(new THREE.Vector3(0, 2, 0)),
                        0xff0000, // Red color
                        0.2, // Size
                        0.5 // Life
                    );
                    
                    // Add upward velocity
                    indicator.velocity.y = 1;
                }
            }
        });
    }
}