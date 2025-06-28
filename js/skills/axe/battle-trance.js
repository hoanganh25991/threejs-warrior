import Skill from '../skill.js';
import * as THREE from 'three';

export default class BattleTrance extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 50;
        this.duration = 8.0; // Buff lasts for 8 seconds
        this.damageReduction = 0.5; // 50% damage reduction
        this.attackSpeedBonus = 0.3; // 30% attack speed bonus
        this.moveSpeedBonus = 0.2; // 20% movement speed bonus
        this.aura = null;
        this.originalHeroStats = null;
    }

    getCooldownDuration() {
        return 1.0;
    }

    canUse() {
        return super.canUse() && !this.hero.battleTranceActive;
    }

    createEffect() {
        // Store original hero stats
        this.originalHeroStats = {
            damageReduction: this.hero.damageReduction || 0,
            attackSpeed: this.hero.attackSpeed || 1,
            moveSpeed: this.hero.moveSpeed || 1
        };
        
        // Apply buffs to hero
        this.hero.damageReduction = (this.hero.damageReduction || 0) + this.damageReduction;
        this.hero.attackSpeed = (this.hero.attackSpeed || 1) * (1 + this.attackSpeedBonus);
        this.hero.moveSpeed = (this.hero.moveSpeed || 1) * (1 + this.moveSpeedBonus);
        
        // Set flag to prevent multiple activations
        this.hero.battleTranceActive = true;
        
        // Create visual aura effect around hero
        this.createAuraEffect();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('battle-trance');
        }
    }
    
    createAuraEffect() {
        const origin = this.hero.group.position.clone();
        
        // Create tree-shaped aura around hero
        const auraGroup = new THREE.Group();
        auraGroup.position.copy(origin);
        this.scene.add(auraGroup);
        
        // Create the main trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.5,
            emissive: 0xff4400,
            emissiveIntensity: 0.3
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1; // Center on hero
        auraGroup.add(trunk);
        
        // Create branches
        const branches = [];
        const branchCount = 6;
        const branchGeometry = new THREE.CylinderGeometry(0.05, 0.1, 1, 6);
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            // Position at the top of the trunk
            branch.position.y = 2;
            
            // Rotate to point outward and upward
            branch.rotation.z = Math.PI / 4; // 45 degrees up
            branch.rotation.y = angle;
            
            // Move outward from trunk
            branch.position.x = Math.cos(angle) * 0.3;
            branch.position.z = Math.sin(angle) * 0.3;
            
            auraGroup.add(branch);
            branches.push(branch);
        }
        
        // Create smaller branches (twigs)
        const twigs = [];
        const twigGeometry = new THREE.CylinderGeometry(0.02, 0.05, 0.5, 4);
        
        branches.forEach((branch, i) => {
            const angle = (i / branchCount) * Math.PI * 2;
            
            // Create 2 twigs per branch
            for (let j = 0; j < 2; j++) {
                const twig = new THREE.Mesh(twigGeometry, trunkMaterial);
                
                // Position at the end of the branch
                twig.position.copy(branch.position);
                twig.position.y += 0.5;
                twig.position.x += Math.cos(angle) * 0.5;
                twig.position.z += Math.sin(angle) * 0.5;
                
                // Rotate to point outward and up
                twig.rotation.z = Math.PI / 6; // 30 degrees up
                twig.rotation.y = angle + (j * Math.PI / 2 - Math.PI / 4); // Spread twigs
                
                auraGroup.add(twig);
                twigs.push(twig);
            }
        });
        
        // Create leaves (particles)
        const leaves = [];
        const leafCount = 30;
        const leafGeometry = new THREE.SphereGeometry(0.1, 6, 6);
        const leafMaterial = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            transparent: true,
            opacity: 0.6
        });
        
        for (let i = 0; i < leafCount; i++) {
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Position randomly around the branches and twigs
            const angle = Math.random() * Math.PI * 2;
            const height = 1 + Math.random() * 2;
            const radius = 0.5 + Math.random() * 0.5;
            
            leaf.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            auraGroup.add(leaf);
            leaves.push(leaf);
        }
        
        // Create energy ring at base
        const ringGeometry = new THREE.RingGeometry(0.8, 1, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Lay flat
        ring.position.y = 0.1; // Just above ground
        auraGroup.add(ring);
        
        // Store aura components
        this.aura = {
            group: auraGroup,
            trunk,
            branches,
            twigs,
            leaves,
            ring,
            startTime: Date.now()
        };
    }
    
    updateEffect(delta) {
        if (!this.aura) return;
        
        // Make aura follow hero
        this.aura.group.position.copy(this.hero.group.position);
        
        // Animate aura
        const elapsed = (Date.now() - this.aura.startTime) / 1000;
        
        // Rotate aura slowly
        this.aura.group.rotation.y += delta * 0.5;
        
        // Pulse trunk and branches
        const pulse = Math.sin(elapsed * 2) * 0.1 + 0.9;
        this.aura.trunk.scale.set(pulse, 1, pulse);
        
        // Animate leaves
        this.aura.leaves.forEach((leaf, i) => {
            // Orbit around trunk
            const angle = elapsed * 0.5 + (i * Math.PI * 2 / this.aura.leaves.length);
            const radius = 0.5 + Math.sin(elapsed + i) * 0.2;
            const height = leaf.position.y + Math.sin(elapsed * 2 + i) * 0.02;
            
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = height;
            
            // Pulse size
            const leafPulse = 0.8 + Math.sin(elapsed * 3 + i) * 0.2;
            leaf.scale.set(leafPulse, leafPulse, leafPulse);
        });
        
        // Animate ring
        this.aura.ring.rotation.z += delta * 2;
        const ringPulse = 1 + Math.sin(elapsed * 3) * 0.2;
        this.aura.ring.scale.set(ringPulse, ringPulse, 1);
        
        // Create occasional particles
        if (Math.random() < delta * 5) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1;
            const height = Math.random() * 2;
            
            const position = new THREE.Vector3(
                this.hero.group.position.x + Math.cos(angle) * radius,
                this.hero.group.position.y + height,
                this.hero.group.position.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xff9900, // Orange color
                0.1, // Size
                1.0 // Life
            );
            
            // Add upward velocity
            particle.velocity.y = 1 + Math.random();
        }
        
        // Check if buff duration is over
        if (elapsed >= this.duration) {
            this.endEffect();
        }
    }
    
    endEffect() {
        // Restore original hero stats
        if (this.originalHeroStats) {
            this.hero.damageReduction = this.originalHeroStats.damageReduction;
            this.hero.attackSpeed = this.originalHeroStats.attackSpeed;
            this.hero.moveSpeed = this.originalHeroStats.moveSpeed;
            this.originalHeroStats = null;
        }
        
        // Clear battle trance flag
        this.hero.battleTranceActive = false;
        
        // Clean up aura
        this.cleanupAura();
        
        // Deactivate skill
        this.isActive = false;
    }
    
    cleanupAura() {
        if (!this.aura) return;
        
        // Remove trunk
        this.scene.remove(this.aura.trunk);
        this.aura.trunk.geometry.dispose();
        this.aura.trunk.material.dispose();
        
        // Remove branches
        this.aura.branches.forEach(branch => {
            this.scene.remove(branch);
            branch.geometry.dispose();
            branch.material.dispose();
        });
        
        // Remove twigs
        this.aura.twigs.forEach(twig => {
            this.scene.remove(twig);
            twig.geometry.dispose();
            twig.material.dispose();
        });
        
        // Remove leaves
        this.aura.leaves.forEach(leaf => {
            this.scene.remove(leaf);
            leaf.geometry.dispose();
            leaf.material.dispose();
        });
        
        // Remove ring
        this.scene.remove(this.aura.ring);
        this.aura.ring.geometry.dispose();
        this.aura.ring.material.dispose();
        
        // Remove group
        this.scene.remove(this.aura.group);
        
        this.aura = null;
    }
    
    cleanup() {
        super.cleanup();
        
        // End effect if active
        if (this.isActive) {
            this.endEffect();
        }
    }
}