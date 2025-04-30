import * as THREE from 'three';
import { config } from '../config/config.js';

export class SkillManager {
    constructor(scene) {
        this.scene = scene;
        this.activeSkills = [];
        this.skillEffects = [];
    }
    
    useSkill(skillName, position, direction) {
        // Get skill configuration
        let skill;
        
        for (const key in config.skills) {
            if (config.skills[key].name === skillName) {
                skill = config.skills[key];
                break;
            }
        }
        
        if (!skill) {
            console.error(`Skill ${skillName} not found`);
            return null;
        }
        
        // Create skill effect
        const effect = this.createSkillEffect(skill, position, direction);
        
        // Add to active skills
        this.activeSkills.push({
            skill,
            effect,
            position: new THREE.Vector3().copy(position),
            direction: new THREE.Vector3().copy(direction),
            distance: 0,
            maxDistance: skill.range || 10,
            damage: skill.damage || 0,
            areaOfEffect: skill.areaOfEffect || 0,
            duration: 0,
            maxDuration: 2 // seconds
        });
        
        return effect;
    }
    
    createSkillEffect(skill, position, direction) {
        let geometry, material;
        
        // Create geometry and material based on skill type
        switch(skill.name) {
            case 'Fireball':
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xff4500,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5,
                    shininess: 100
                });
                break;
            case 'Ice Spike':
                geometry = new THREE.ConeGeometry(0.5, 2, 16);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x00ffff,
                    emissive: 0x0000ff,
                    emissiveIntensity: 0.5,
                    shininess: 100
                });
                break;
            case 'Thunder Strike':
                geometry = new THREE.CylinderGeometry(0, 0.5, 3, 16);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xffff00,
                    emissive: 0xffff00,
                    emissiveIntensity: 0.5,
                    shininess: 100
                });
                break;
            case 'Heal':
                geometry = new THREE.TorusGeometry(1, 0.2, 16, 32);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.7,
                    shininess: 100
                });
                break;
            case 'Shield':
                geometry = new THREE.SphereGeometry(1.2, 16, 16);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x4169e1,
                    emissive: 0x0000ff,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.5,
                    shininess: 100
                });
                break;
            case 'Dash':
                geometry = new THREE.BoxGeometry(0.5, 0.5, 3);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x808080,
                    transparent: true,
                    opacity: 0.7
                });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }
        
        // Create mesh
        const effect = new THREE.Mesh(geometry, material);
        
        // Position and orient the effect
        effect.position.copy(position);
        
        // For projectile skills, orient them in the direction of travel
        if (['Fireball', 'Ice Spike'].includes(skill.name)) {
            effect.lookAt(position.clone().add(direction));
        }
        
        // Add to scene
        this.scene.add(effect);
        
        // Add to skill effects array
        this.skillEffects.push(effect);
        
        return effect;
    }
    
    update(deltaTime, enemyManager) {
        // Update all active skills
        for (let i = this.activeSkills.length - 1; i >= 0; i--) {
            const activeSkill = this.activeSkills[i];
            
            // Update duration
            activeSkill.duration += deltaTime;
            
            // Handle different skill behaviors
            switch(activeSkill.skill.name) {
                case 'Fireball':
                case 'Ice Spike':
                    // Move projectile
                    this.updateProjectile(activeSkill, deltaTime, enemyManager);
                    break;
                case 'Thunder Strike':
                    // Area effect at target location
                    this.updateAreaEffect(activeSkill, deltaTime, enemyManager);
                    break;
                case 'Heal':
                    // Healing effect (handled by hero class)
                    this.updateSelfEffect(activeSkill, deltaTime);
                    break;
                case 'Shield':
                    // Shield effect (handled by hero class)
                    this.updateSelfEffect(activeSkill, deltaTime);
                    break;
                case 'Dash':
                    // Dash effect (handled by hero class)
                    this.updateSelfEffect(activeSkill, deltaTime);
                    break;
            }
            
            // Remove skill if duration exceeded
            if (activeSkill.duration >= activeSkill.maxDuration) {
                // Remove effect from scene
                this.scene.remove(activeSkill.effect);
                
                // Remove from arrays
                const effectIndex = this.skillEffects.indexOf(activeSkill.effect);
                if (effectIndex !== -1) {
                    this.skillEffects.splice(effectIndex, 1);
                }
                
                this.activeSkills.splice(i, 1);
            }
        }
    }
    
    updateProjectile(activeSkill, deltaTime, enemyManager) {
        // Move projectile in direction
        const moveSpeed = 10 * deltaTime;
        activeSkill.position.add(activeSkill.direction.clone().multiplyScalar(moveSpeed));
        activeSkill.effect.position.copy(activeSkill.position);
        
        // Update distance traveled
        activeSkill.distance += moveSpeed;
        
        // Check for collisions with enemies
        if (enemyManager) {
            const hitEnemies = enemyManager.handlePlayerAttack(
                activeSkill.position,
                activeSkill.areaOfEffect || 1,
                activeSkill.damage
            );
            
            // If hit any enemies, remove projectile
            if (hitEnemies.length > 0) {
                activeSkill.duration = activeSkill.maxDuration; // This will remove the skill on next update
            }
        }
        
        // Remove if max distance reached
        if (activeSkill.distance >= activeSkill.maxDistance) {
            activeSkill.duration = activeSkill.maxDuration;
        }
    }
    
    updateAreaEffect(activeSkill, deltaTime, enemyManager) {
        // For area effects, damage is applied once at the beginning
        if (activeSkill.duration < deltaTime && enemyManager) {
            enemyManager.handlePlayerAttack(
                activeSkill.position,
                activeSkill.areaOfEffect,
                activeSkill.damage
            );
        }
        
        // Scale effect up and down for visual appeal
        const scale = Math.sin(Math.PI * (activeSkill.duration / activeSkill.maxDuration));
        activeSkill.effect.scale.set(scale, scale, scale);
    }
    
    updateSelfEffect(activeSkill, deltaTime) {
        // For self effects (heal, shield, dash), just update visual effect
        // The actual effect is handled by the hero class
        
        // Fade out effect over time
        const opacity = 1 - (activeSkill.duration / activeSkill.maxDuration);
        if (activeSkill.effect.material.opacity !== undefined) {
            activeSkill.effect.material.opacity = opacity;
        }
    }
    
    clearAllSkills() {
        // Remove all skill effects from scene
        for (const effect of this.skillEffects) {
            this.scene.remove(effect);
        }
        
        // Clear arrays
        this.skillEffects = [];
        this.activeSkills = [];
    }
}

export default SkillManager;