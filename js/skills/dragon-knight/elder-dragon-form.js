import Skill from '../skill.js';
import * as THREE from 'three';

export default class ElderDragonForm extends Skill {
    constructor(hero) {
        super(hero);
        this.name = "Elder Dragon Form";
        this.manaCost = 100;
        this.duration = 15.0;
        this.damageBonus = 1.5; // 50% damage increase
        this.rangeBonus = 1.5; // 50% range increase
        this.particleCount = 50;
        this.transformationActive = false;
        this.originalScale = null;
        this.originalColor = null;
        this.wings = null;
    }

    getCooldownDuration() {
        return 30.0;
    }

    createEffect() {
        // Transform the hero into a dragon form
        const heroMesh = this.hero.group.children[0]; // Assuming the first child is the hero mesh
        
        // Store original scale and color
        this.originalScale = heroMesh.scale.clone();
        
        // Find body mesh to change color
        let bodyMesh = null;
        heroMesh.traverse(child => {
            if (child.isMesh && child.material && child.material.color) {
                if (child.geometry.type === "BoxGeometry" && 
                    child.geometry.parameters.width > 1.0) {
                    bodyMesh = child;
                }
            }
        });
        
        if (bodyMesh) {
            this.originalColor = bodyMesh.material.color.clone();
            bodyMesh.material.color.set(0xff3300); // Bright red for dragon form
        }
        
        // Scale up the hero
        heroMesh.scale.multiplyScalar(1.3);
        
        // Create dragon wings
        this.createWings();
        
        // Create transformation particles
        const origin = this.hero.group.position.clone();
        
        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            const height = Math.random() * 3;
            
            const position = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y + height,
                origin.z + Math.sin(angle) * radius
            );
            
            // Create particle with fire color
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                position,
                color,
                0.1 + Math.random() * 0.2,
                0.5 + Math.random() * 1.0
            );
            
            // Add outward and upward velocity
            const outDirection = new THREE.Vector3(
                position.x - origin.x,
                0,
                position.z - origin.z
            ).normalize();
            
            particle.velocity.copy(outDirection.multiplyScalar(1 + Math.random() * 3));
            particle.velocity.y = 2 + Math.random() * 3;
        }
        
        // Apply bonuses
        this.hero.attackSystem.damageMultiplier = this.damageBonus;
        this.hero.attackSystem.rangeMultiplier = this.rangeBonus;
        
        // Set transformation active
        this.transformationActive = true;
        
        // Play sound effect
        if (this.hero.soundManager) {
            this.hero.soundManager.playSound('dragon-transform');
        }
        
        // Set a timeout to revert the transformation
        setTimeout(() => {
            this.revertTransformation();
        }, this.duration * 1000);
    }
    
    createWings() {
        // Create dragon wings
        const wingGroup = new THREE.Group();
        
        // Left wing
        const leftWingGeometry = new THREE.BufferGeometry();
        const leftWingShape = new THREE.Shape();
        
        // Create wing shape
        leftWingShape.moveTo(0, 0);
        leftWingShape.bezierCurveTo(0, 1, -1, 1.5, -2, 2);
        leftWingShape.bezierCurveTo(-1.8, 1, -1.5, 0.5, -1, 0);
        
        // Create geometry from shape
        const leftWingPoints = leftWingShape.getPoints(20);
        const leftWingVertices = [];
        const leftWingUVs = [];
        
        leftWingPoints.forEach((point, i) => {
            leftWingVertices.push(point.x, point.y, 0);
            leftWingUVs.push(i / leftWingPoints.length, 0);
        });
        
        leftWingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leftWingVertices, 3));
        leftWingGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(leftWingUVs, 2));
        leftWingGeometry.computeVertexNormals();
        
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xff3300,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            metalness: 0.2,
            roughness: 0.8
        });
        
        const leftWing = new THREE.Mesh(leftWingGeometry, wingMaterial);
        leftWing.position.set(-0.5, 1.5, -0.2);
        leftWing.rotation.y = Math.PI / 4;
        wingGroup.add(leftWing);
        
        // Right wing (mirror of left)
        const rightWing = leftWing.clone();
        rightWing.position.set(0.5, 1.5, -0.2);
        rightWing.rotation.y = -Math.PI / 4;
        rightWing.scale.x = -1; // Mirror
        wingGroup.add(rightWing);
        
        // Add wings to hero
        this.hero.group.add(wingGroup);
        this.wings = wingGroup;
    }
    
    revertTransformation() {
        if (!this.transformationActive) return;
        
        const heroMesh = this.hero.group.children[0];
        
        // Restore original scale
        if (this.originalScale) {
            heroMesh.scale.copy(this.originalScale);
        }
        
        // Restore original color
        if (this.originalColor) {
            heroMesh.traverse(child => {
                if (child.isMesh && child.material && child.material.color) {
                    if (child.geometry.type === "BoxGeometry" && 
                        child.geometry.parameters.width > 1.0) {
                        child.material.color.copy(this.originalColor);
                    }
                }
            });
        }
        
        // Remove wings
        if (this.wings) {
            this.hero.group.remove(this.wings);
            this.wings = null;
        }
        
        // Reset bonuses
        this.hero.attackSystem.damageMultiplier = 1.0;
        this.hero.attackSystem.rangeMultiplier = 1.0;
        
        // Set transformation inactive
        this.transformationActive = false;
        
        // Create reversion particles
        const origin = this.hero.group.position.clone();
        
        for (let i = 0; i < this.particleCount / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 2;
            const height = Math.random() * 3;
            
            const position = new THREE.Vector3(
                origin.x + Math.cos(angle) * radius,
                origin.y + height,
                origin.z + Math.sin(angle) * radius
            );
            
            // Create particle with blue color (cooling down)
            const color = new THREE.Color(0x3399ff);
            
            const particle = this.createParticle(
                position,
                color,
                0.1 + Math.random() * 0.2,
                0.5 + Math.random() * 1.0
            );
            
            // Add inward and upward velocity
            const inDirection = new THREE.Vector3(
                origin.x - position.x,
                0,
                origin.z - position.z
            ).normalize();
            
            particle.velocity.copy(inDirection.multiplyScalar(1 + Math.random() * 3));
            particle.velocity.y = 1 + Math.random() * 2;
        }
    }

    updateEffect(delta) {
        if (!this.transformationActive) return;
        
        // Create occasional fire particles while in dragon form
        if (Math.random() < 0.1) {
            const origin = this.hero.group.position.clone();
            origin.y += 1.5; // At head level
            
            // Create in front of hero
            const direction = this.hero.direction.clone();
            origin.add(direction.multiplyScalar(0.5));
            
            // Create fire particle
            const hue = 0.05 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
            
            const particle = this.createParticle(
                origin,
                color,
                0.1 + Math.random() * 0.1,
                0.3 + Math.random() * 0.5
            );
            
            // Add forward velocity
            particle.velocity.copy(direction.multiplyScalar(2 + Math.random() * 3));
            particle.velocity.y = 0.5 + Math.random() * 1;
        }
        
        // Animate wings if they exist
        if (this.wings) {
            this.wings.children.forEach(wing => {
                wing.rotation.z = Math.sin(Date.now() / 300) * 0.2;
            });
        }
    }
}