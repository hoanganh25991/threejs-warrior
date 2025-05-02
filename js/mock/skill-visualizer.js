import * as THREE from 'three';
import MockHero from './mock-hero.js';

/**
 * A class to visualize and test skills in the model viewer
 */
export default class SkillVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.hero = new MockHero(scene);
        this.currentSkill = null;
        this.isActive = false;
        this.elapsedTime = 0;
        
        // Create a group to hold all skill-related objects
        this.group = new THREE.Group();
        scene.add(this.group);
        
        // Create a simple enemy for collision testing
        this.createTestEnemy();
    }
    
    createTestEnemy() {
        // Create a simple enemy representation for testing collisions
        const enemyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff3333 });
        this.enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        this.enemy.position.set(5, 1, 0); // Place to the right of the hero
        
        // Add to scene
        this.scene.add(this.enemy);
        
        // Add to collision system
        if (this.currentSkill && this.currentSkill.collisionSystem) {
            this.currentSkill.collisionSystem.addEnemy({
                mesh: this.enemy,
                position: this.enemy.position,
                health: 100,
                takeDamage: (damage) => {
                    console.log(`Enemy took ${damage} damage!`);
                    // Visual feedback for hit
                    this.enemy.material.color.set(0xffff00);
                    setTimeout(() => {
                        this.enemy.material.color.set(0xff3333);
                    }, 200);
                }
            });
        }
    }
    
    setSkill(SkillClass) {
        // Clean up previous skill if exists
        if (this.currentSkill) {
            this.currentSkill.cleanup();
        }
        
        // Create new skill instance
        this.currentSkill = new SkillClass(this.hero);
        
        // Reset hero mana
        this.hero.restoreMana();
        
        // Reset state
        this.isActive = false;
        this.elapsedTime = 0;
        
        // Add enemy to collision system
        if (this.currentSkill.collisionSystem) {
            this.currentSkill.collisionSystem.clearEnemies();
            this.currentSkill.collisionSystem.addEnemy({
                mesh: this.enemy,
                position: this.enemy.position,
                health: 100,
                takeDamage: (damage, damageType) => {
                    console.log(`Enemy took ${damage} ${damageType} damage!`);
                    // Visual feedback for hit
                    this.enemy.material.color.set(0xffff00);
                    setTimeout(() => {
                        this.enemy.material.color.set(0xff3333);
                    }, 200);
                }
            });
        }
        
        return this.currentSkill;
    }
    
    activateSkill() {
        if (!this.currentSkill) return false;
        
        // Reset hero mana if needed
        if (this.hero.mana < this.currentSkill.manaCost) {
            this.hero.restoreMana();
        }
        
        // Activate the skill
        const activated = this.currentSkill.activate();
        this.isActive = activated;
        
        return activated;
    }
    
    update(delta) {
        // Update hero
        this.hero.update(delta);
        
        // Update current skill
        if (this.currentSkill) {
            this.currentSkill.update(delta);
            
            // Track elapsed time for auto-reactivation
            if (this.isActive) {
                this.elapsedTime += delta;
                
                // If skill duration has passed, mark as inactive
                if (this.elapsedTime > this.currentSkill.duration) {
                    this.isActive = false;
                }
            }
        }
        
        // Move enemy in a circle around the hero for better testing
        if (this.enemy) {
            const radius = 8;
            const speed = 0.2;
            this.enemy.position.x = Math.sin(delta * speed) * radius;
            this.enemy.position.z = Math.cos(delta * speed) * radius;
        }
    }
    
    getSkillInfo() {
        if (!this.currentSkill) return "No skill selected";
        
        const skill = this.currentSkill;
        return {
            name: skill.constructor.name,
            manaCost: skill.manaCost,
            damage: skill.damage,
            range: skill.range,
            duration: skill.duration,
            cooldown: skill.cooldown,
            damageType: skill.damageType,
            isActive: this.isActive,
            canUse: skill.canUse()
        };
    }
    
    cleanup() {
        // Clean up skill
        if (this.currentSkill) {
            this.currentSkill.cleanup();
        }
        
        // Remove hero and enemy
        this.scene.remove(this.hero.group);
        this.scene.remove(this.enemy);
        this.scene.remove(this.group);
    }
}