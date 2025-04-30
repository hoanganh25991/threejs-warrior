import { DragonKnight } from './dragon-knight.js';
import { Axe } from './axe.js';
import { CrystalMaiden } from './crystal-maiden.js';
import { Lina } from './lina.js';
import { DefaultHero } from './default-hero.js';
import { Wings } from './wings.js';
import * as THREE from 'three';
import { config } from '../config/config.js';

export class Hero {
    constructor(scene, heroType) {
        this.scene = scene;
        this.heroType = heroType;
        this.mesh = null;
        this.health = config.player.health;
        this.maxHealth = config.player.health;
        this.mana = config.player.mana;
        this.maxMana = config.player.mana;
        this.experience = config.player.experience.initial;
        this.level = 1;
        this.nextLevelExp = config.player.experience.levelUpThreshold;
        this.isJumping = false;
        this.isFlying = false;
        this.jumpTime = 0;
        this.skills = {};
        this.cooldowns = {};
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ'); // YXZ order for FPS-style rotation
        this.direction = new THREE.Vector3(0, 0, -1); // Forward direction
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true; // Start on the ground
        this.wings = null;
        this.wingsVisible = false;
        
        // Debug flag
        this.debug = config.game.debug;
        
        // Initialize the hero
        this.init();
        
        // Ensure we're on the ground at start
        this.group.position.y = 0;
        
        console.log('Hero initialized, onGround:', this.onGround);
    }
    
    init() {
        // Create a group to hold the hero and allow for rotation
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create a hero model based on hero type
        switch(this.heroType) {
            case 'dragon-knight':
                this.createHeroModel(DragonKnight);
                break;
            case 'axe':
                this.createHeroModel(Axe);
                break;
            case 'crystal-maiden':
                this.createHeroModel(CrystalMaiden);
                break;
            case 'lina':
                this.createHeroModel(Lina);
                break;
            default:
                this.createHeroModel(DefaultHero);
        }
        
        // Add a direction indicator (arrow) to show which way the hero is facing
        const arrowGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        this.arrow.position.set(0, 1.5, -0.8); // Position above and in front of hero
        this.arrow.rotation.x = Math.PI / 2; // Rotate to point forward
        
        // Create wings (initially hidden)
        this.createWings();
        
        // Add arrow to group
        this.group.add(this.arrow);
        
        // Initialize skills based on hero type
        this.initSkills();
    }
    
    createHeroModel(HeroClass) {
        // Create the hero model using the appropriate class
        const heroModel = new HeroClass(this.scene);
        this.group.add(heroModel.getGroup());
        this.mesh = heroModel.getMesh();
    }
    
    createWings() {
        // Create wings using the Wings class
        const wings = new Wings(this.scene);
        this.wings = wings.getGroup();
        this.group.add(this.wings);
    }
    
    initSkills() {
        // Assign skills based on hero type
        // In a full implementation, each hero would have unique skills
        this.skills = {
            y: config.skills.fireball,
            u: config.skills.iceSpike,
            i: config.skills.thunderStrike,
            h: config.skills.heal,
            j: config.skills.shield,
            k: config.skills.dash
        };
        
        // Initialize cooldowns
        for (const key in this.skills) {
            this.cooldowns[key] = 0;
        }
    }
    
    update(deltaTime, keys, inputHandler) {
        // Handle rotation from mouse and Q/E keys
        if (inputHandler) {
            this.handleRotation(inputHandler);
        }
        
        // Handle movement
        this.handleMovement(deltaTime, keys);
        
        // Handle jumping and flying
        this.handleJumpAndFly(deltaTime, keys);
        
        // Update cooldowns
        this.updateCooldowns(deltaTime);
    }
    
    // Add other required methods from the original hero.js
    // These would include handleRotation, handleMovement, handleJumpAndFly, updateCooldowns, etc.
    
    // Placeholder for required methods - in a real implementation, you would copy all the
    // necessary methods from the original hero.js file
    
    handleRotation(inputHandler) {
        // Placeholder - implement the actual method from hero.js
        console.log("handleRotation called - implement this method");
    }
    
    handleMovement(deltaTime, keys) {
        // Placeholder - implement the actual method from hero.js
        console.log("handleMovement called - implement this method");
    }
    
    handleJumpAndFly(deltaTime, keys) {
        // Placeholder - implement the actual method from hero.js
        console.log("handleJumpAndFly called - implement this method");
    }
    
    updateCooldowns(deltaTime) {
        // Placeholder - implement the actual method from hero.js
        console.log("updateCooldowns called - implement this method");
    }
    
    getPosition() {
        // Return the hero's position
        return this.group.position;
    }
    
    getDirection() {
        // Return the hero's direction
        return this.direction;
    }
    
    getCameraPositionInfo() {
        // Return camera positioning information
        return {
            distance: 5,
            height: 2,
            targetHeight: 1
        };
    }
    
    takeDamage(amount) {
        // Handle taking damage
        this.health = Math.max(0, this.health - amount);
        console.log(`Hero took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);
    }
}

// Export individual hero models for direct use if needed
export { DragonKnight, Axe, CrystalMaiden, Lina, DefaultHero, Wings };