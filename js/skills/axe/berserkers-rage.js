import Skill from '../skill.js';
import * as THREE from 'three';

export default class BerserkersRage extends Skill {
    constructor(hero) {
        super(hero);
        this.manaCost = 80;
        this.duration = 6.0; // Buff lasts for 6 seconds
        this.damageBonus = 2.0; // 100% damage increase
        this.attackSpeedBonus = 0.5; // 50% attack speed increase
        this.healthDrain = 10; // Health drained per second
        this.aura = null;
        this.originalHeroStats = null;
    }

    getCooldownDuration() {
        return 1.0;
    }

    canUse() {
        return super.canUse() && !this.hero.berserkerRageActive;
    }

    createEffect() {
        // Store original hero stats
        this.originalHeroStats = {
            damage: this.hero.damage || 1,
            attackSpeed: this.hero.attackSpeed || 1
        };
        
        // Apply buffs to hero
        this.hero.damage = (this.hero.damage || 1) * this.damageBonus;
        this.hero.attackSpeed = (this.hero.attackSpeed || 1) * (1 + this.attackSpeedBonus);
        
        // Set flag to prevent multiple activations
        this.hero.berserkerRageActive = true;
        
        // Create visual aura effect around hero
        this.createAuraEffect();
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('berserker-rage');
        }
    }
    
    createAuraEffect() {
        const origin = this.hero.group.position.clone();
        
        // Create tree-shaped aura around hero with blood-red theme
        const auraGroup = new THREE.Group();
        auraGroup.position.copy(origin);
        this.scene.add(auraGroup);
        
        // Create the main trunk (twisted and gnarled)
        const trunkCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.2, 0.5, 0.2),
            new THREE.Vector3(-0.2, 1.0, -0.2),
            new THREE.Vector3(0.1, 1.5, 0.1),
            new THREE.Vector3(0, 2.0, 0)
        ]);
        
        const trunkGeometry = new THREE.TubeGeometry(trunkCurve, 20, 0.1, 8, false);
        const trunkMaterial = new THREE.MeshBasicMaterial({
            color: 0x8B0000, // Dark red
            transparent: true,
            opacity: 0.7,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        auraGroup.add(trunk);
        
        // Create twisted branches
        const branches = [];
        const branchCount = 8;
        
        for (let i = 0; i < branchCount; i++) {
            const angle = (i / branchCount) * Math.PI * 2;
            const height = 0.5 + (i % 3) * 0.5; // Vary height
            
            // Create curved branch
            const branchCurve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, height, 0),
                new THREE.Vector3(
                    Math.cos(angle) * 0.3,
                    height + 0.3,
                    Math.sin(angle) * 0.3
                ),
                new THREE.Vector3(
                    Math.cos(angle) * 0.6,
                    height + 0.4,
                    Math.sin(angle) * 0.6
                ),
                new THREE.Vector3(
                    Math.cos(angle) * 0.9,
                    height + 0.2,
                    Math.sin(angle) * 0.9
                )
            ]);
            
            const branchGeometry = new THREE.TubeGeometry(branchCurve, 10, 0.05, 6, false);
            const branch = new THREE.Mesh(branchGeometry, trunkMaterial);
            
            auraGroup.add(branch);
            branches.push(branch);
        }
        
        // Create thorns (spikes)
        const thorns = [];
        const thornCount = 20;
        const thornGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
        const thornMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < thornCount; i++) {
            const thorn = new THREE.Mesh(thornGeometry, thornMaterial);
            
            // Position randomly on trunk and branches
            const onBranch = Math.random() > 0.5;
            
            if (onBranch && branches.length > 0) {
                // Place on a random branch
                const branch = branches[Math.floor(Math.random() * branches.length)];
                const t = Math.random(); // Position along branch
                const point = branch.geometry.parameters.path.getPoint(t);
                thorn.position.copy(point);
                
                // Orient outward from branch
                const tangent = branch.geometry.parameters.path.getTangent(t);
                const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
                thorn.lookAt(point.clone().add(normal));
            } else {
                // Place on trunk
                const height = Math.random() * 2;
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.1;
                
                thorn.position.set(
                    Math.cos(angle) * radius,
                    height,
                    Math.sin(angle) * radius
                );
                
                // Orient outward from trunk
                thorn.lookAt(new THREE.Vector3(
                    Math.cos(angle) * (radius + 1),
                    height,
                    Math.sin(angle) * (radius + 1)
                ));
            }
            
            auraGroup.add(thorn);
            thorns.push(thorn);
        }
        
        // Create blood droplets (particles)
        const droplets = [];
        const dropletCount = 15;
        const dropletGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const dropletMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9
        });
        
        for (let i = 0; i < dropletCount; i++) {
            const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
            
            // Position randomly around the tree
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 2;
            const radius = 0.2 + Math.random() * 0.8;
            
            droplet.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
            );
            
            // Stretch to look like a droplet
            droplet.scale.y = 1.5;
            
            auraGroup.add(droplet);
            droplets.push(droplet);
        }
        
        // Create pulsing aura at base
        const auraRingGeometry = new THREE.RingGeometry(0.5, 0.6, 32);
        const auraRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const auraRing = new THREE.Mesh(auraRingGeometry, auraRingMaterial);
        auraRing.rotation.x = -Math.PI / 2; // Lay flat
        auraRing.position.y = 0.1; // Just above ground
        auraGroup.add(auraRing);
        
        // Store aura components
        this.aura = {
            group: auraGroup,
            trunk,
            branches,
            thorns,
            droplets,
            auraRing,
            startTime: Date.now()
        };
    }
    
    updateEffect(delta) {
        if (!this.aura) return;
        
        // Make aura follow hero
        this.aura.group.position.copy(this.hero.group.position);
        
        // Animate aura
        const elapsed = (Date.now() - this.aura.startTime) / 1000;
        
        // Pulse trunk and branches with heartbeat effect
        const heartbeat = Math.pow(Math.sin(elapsed * 5), 2) * 0.2 + 0.9;
        this.aura.trunk.scale.set(heartbeat, 1, heartbeat);
        
        // Rotate thorns
        this.aura.thorns.forEach((thorn, i) => {
            thorn.rotation.y += delta * (1 + (i % 3));
        });
        
        // Animate blood droplets
        this.aura.droplets.forEach((droplet, i) => {
            // Fall downward
            droplet.position.y -= delta * (0.5 + Math.random() * 0.5);
            
            // If reached ground, reset to top
            if (droplet.position.y < 0.1) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.2 + Math.random() * 0.8;
                
                droplet.position.set(
                    Math.cos(angle) * radius,
                    1.5 + Math.random() * 0.5,
                    Math.sin(angle) * radius
                );
            }
        });
        
        // Animate aura ring
        this.aura.auraRing.rotation.z += delta * 3;
        const ringPulse = 1 + heartbeat * 0.5;
        this.aura.auraRing.scale.set(ringPulse, ringPulse, 1);
        
        // Create blood particles occasionally
        if (Math.random() < delta * 8) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.2;
            const height = Math.random() * 2;
            
            const position = new THREE.Vector3(
                this.hero.group.position.x + Math.cos(angle) * radius,
                this.hero.group.position.y + height,
                this.hero.group.position.z + Math.sin(angle) * radius
            );
            
            const particle = this.createParticle(
                position,
                0xff0000, // Red color
                0.05 + Math.random() * 0.05, // Size
                0.5 + Math.random() * 0.5 // Life
            );
            
            // Add downward velocity
            particle.velocity.y = -1 - Math.random();
        }
        
        // Drain health over time
        if (this.hero.health) {
            this.hero.health = Math.max(1, this.hero.health - this.healthDrain * delta);
            
            // Update UI if available
            if (this.hero.updateUI) {
                this.hero.updateUI();
            }
        }
        
        // Check if buff duration is over
        if (elapsed >= this.duration) {
            this.endEffect();
        }
    }
    
    endEffect() {
        // Restore original hero stats
        if (this.originalHeroStats) {
            this.hero.damage = this.originalHeroStats.damage;
            this.hero.attackSpeed = this.originalHeroStats.attackSpeed;
            this.originalHeroStats = null;
        }
        
        // Clear berserker rage flag
        this.hero.berserkerRageActive = false;
        
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
        
        // Remove thorns
        this.aura.thorns.forEach(thorn => {
            this.scene.remove(thorn);
            thorn.geometry.dispose();
            thorn.material.dispose();
        });
        
        // Remove droplets
        this.aura.droplets.forEach(droplet => {
            this.scene.remove(droplet);
            droplet.geometry.dispose();
            droplet.material.dispose();
        });
        
        // Remove aura ring
        this.scene.remove(this.aura.auraRing);
        this.aura.auraRing.geometry.dispose();
        this.aura.auraRing.material.dispose();
        
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