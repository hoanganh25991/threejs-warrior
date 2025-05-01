import Skill from '../skill.js';
import * as THREE from 'three';

export default class CounterHelix extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 30;
        this.damage = 80;
        this.range = 3;
        this.duration = 1.0;
        this.spinMesh = null;
    }

    getCooldownDuration() {
        return 6.0;
    }

    createEffect() {
        // Create a spinning tree-shaped helix around the hero
        const origin = this.hero.group.position.clone();
        origin.y += 1; // Adjust to be at character height
        
        // Create the group to hold all helix elements
        const helixGroup = new THREE.Group();
        helixGroup.position.copy(origin);
        this.scene.add(helixGroup);
        
        // Create the main spiral trunk
        const spiralPoints = [];
        const spiralSegments = 36;
        const spiralRadius = 2;
        const spiralHeight = 2;
        
        for (let i = 0; i <= spiralSegments; i++) {
            const angle = (i / spiralSegments) * Math.PI * 4; // Two full rotations
            const x = Math.cos(angle) * spiralRadius * (i / spiralSegments);
            const y = (i / spiralSegments) * spiralHeight - spiralHeight / 2;
            const z = Math.sin(angle) * spiralRadius * (i / spiralSegments);
            
            spiralPoints.push(new THREE.Vector3(x, y, z));
        }
        
        const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints);
        const spiralGeometry = new THREE.TubeGeometry(spiralCurve, 64, 0.1, 8, false);
        const spiralMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const spiralMesh = new THREE.Mesh(spiralGeometry, spiralMaterial);
        helixGroup.add(spiralMesh);
        
        // Create branches along the spiral
        const branches = [];
        const branchCount = 12;
        const branchGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.4, 4);
        const branchMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < branchCount; i++) {
            const t = i / branchCount;
            const point = spiralCurve.getPoint(t);
            const tangent = spiralCurve.getTangent(t);
            
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.copy(point);
            
            // Orient branch perpendicular to spiral
            const up = new THREE.Vector3(0, 1, 0);
            const axis = new THREE.Vector3().crossVectors(up, tangent).normalize();
            const angle = Math.acos(up.dot(tangent));
            branch.quaternion.setFromAxisAngle(axis, angle);
            
            // Rotate branch randomly around spiral
            branch.rotateOnAxis(tangent, Math.random() * Math.PI * 2);
            
            helixGroup.add(branch);
            branches.push(branch);
        }
        
        // Create leaves (small spheres) at the end of branches
        const leaves = [];
        const leafGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const leafMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7
        });
        
        branches.forEach(branch => {
            // Get branch direction
            const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(branch.quaternion);
            
            // Create 2 leaves per branch
            for (let i = 0; i < 2; i++) {
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                
                // Position at the end of the branch
                leaf.position.copy(branch.position);
                leaf.position.add(direction.clone().multiplyScalar(0.2));
                
                // Add some random offset
                leaf.position.x += (Math.random() - 0.5) * 0.1;
                leaf.position.y += (Math.random() - 0.5) * 0.1;
                leaf.position.z += (Math.random() - 0.5) * 0.1;
                
                helixGroup.add(leaf);
                leaves.push(leaf);
            }
        });
        
        // Store the helix group for animation
        this.spinMesh = {
            group: helixGroup,
            spiral: spiralMesh,
            branches,
            leaves
        };
        
        // Create particles for added effect
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.range;
            const height = Math.random() * 2 - 1;
            
            const position = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y + height,
                origin.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xff3300, // Red-orange color
                0.05 + Math.random() * 0.05, // Size
                this.duration * Math.random() // Life
            );
            
            // Add outward velocity
            particle.velocity.x = Math.cos(angle) * (1 + Math.random());
            particle.velocity.z = Math.sin(angle) * (1 + Math.random());
        }
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('counter-helix');
        }
    }
    
    updateEffect(delta) {
        if (!this.spinMesh) return;
        
        // Spin the helix
        this.spinMesh.group.rotation.y += delta * 10; // Fast rotation
        
        // Scale effect over time
        const elapsed = this.duration - this.cooldown;
        const progress = elapsed / this.duration;
        
        // Start big and shrink
        const scale = 1 - progress * 0.5;
        this.spinMesh.group.scale.set(scale, scale, scale);
        
        // Fade out
        this.spinMesh.spiral.material.opacity = 0.7 * (1 - progress);
        this.spinMesh.branches.forEach(branch => {
            branch.material.opacity = 0.8 * (1 - progress);
        });
        this.spinMesh.leaves.forEach(leaf => {
            leaf.material.opacity = 0.7 * (1 - progress);
        });
        
        // Check for enemies in range and apply damage
        const enemies = this.scene.getObjectsByProperty('type', 'enemy');
        const origin = this.hero.group.position;
        
        enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(origin);
            const distance = toEnemy.length();
            
            if (distance <= this.range) {
                // Apply damage
                if (enemy.takeDamage) {
                    // More damage to closer enemies
                    const damageMultiplier = 1 - (distance / this.range);
                    const damage = this.damage * damageMultiplier * delta;
                    enemy.takeDamage(damage);
                    
                    // Create hit effect on enemy
                    const hitPosition = enemy.position.clone();
                    hitPosition.y += 1; // Adjust to hit body
                    
                    for (let i = 0; i < 3; i++) {
                        const particle = this.createParticle(
                            hitPosition,
                            0xff0000, // Red color
                            0.1, // Size
                            0.3 // Life
                        );
                        
                        // Add random velocity
                        particle.velocity.x = (Math.random() - 0.5) * 3;
                        particle.velocity.y = Math.random() * 2;
                        particle.velocity.z = (Math.random() - 0.5) * 3;
                    }
                }
            }
        });
        
        // Check if effect is done
        if (progress >= 1) {
            this.cleanupSpinMesh();
            this.isActive = false;
        }
    }
    
    cleanupSpinMesh() {
        if (!this.spinMesh) return;
        
        // Remove spiral
        this.scene.remove(this.spinMesh.spiral);
        this.spinMesh.spiral.geometry.dispose();
        this.spinMesh.spiral.material.dispose();
        
        // Remove branches
        this.spinMesh.branches.forEach(branch => {
            this.scene.remove(branch);
            branch.geometry.dispose();
            branch.material.dispose();
        });
        
        // Remove leaves
        this.spinMesh.leaves.forEach(leaf => {
            this.scene.remove(leaf);
            leaf.geometry.dispose();
            leaf.material.dispose();
        });
        
        // Remove group
        this.scene.remove(this.spinMesh.group);
        
        this.spinMesh = null;
    }
    
    cleanup() {
        super.cleanup();
        this.cleanupSpinMesh();
    }
}