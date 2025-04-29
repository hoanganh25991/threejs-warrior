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
        
        // Initialize the hero
        this.init();
    }
    
    init() {
        // Create a group to hold the hero and allow for rotation
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Create a simple placeholder mesh for now
        // In a full implementation, we would load a GLTF model
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        
        // Different colors for different hero types
        let color;
        switch(this.heroType) {
            case 'dragon-knight':
                color = 0xff0000; // Red
                break;
            case 'axe':
                color = 0x8b0000; // Dark red
                break;
            case 'crystal-maiden':
                color = 0x00ffff; // Cyan
                break;
            case 'lina':
                color = 0xff4500; // Orange red
                break;
            default:
                color = 0xffffff; // White
        }
        
        const material = new THREE.MeshStandardMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 1; // Set height
        this.mesh.castShadow = true;
        
        // Add a direction indicator (arrow) to show which way the hero is facing
        const arrowGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        this.arrow.position.set(0, 1.5, -0.8); // Position above and in front of hero
        this.arrow.rotation.x = Math.PI / 2; // Rotate to point forward
        
        // Add mesh and arrow to group
        this.group.add(this.mesh);
        this.group.add(this.arrow);
        
        // Initialize skills based on hero type
        this.initSkills();
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
        
        // Handle skill activation
        this.handleSkills(keys);
        
        // Update direction vector based on current rotation
        this.updateDirection();
    }
    
    handleRotation(inputHandler) {
        // Get look direction from input handler
        const lookDir = inputHandler.getLookDirection();
        
        // Apply rotation
        // Horizontal rotation (around Y axis)
        this.rotation.y -= lookDir.x * 0.01;
        
        // Vertical rotation (around X axis) - limit to avoid flipping
        this.rotation.x -= lookDir.y * 0.01;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        // Apply rotation to the group
        this.group.rotation.y = this.rotation.y;
        
        // Reset input handler movement to avoid continuous rotation
        inputHandler.resetMovement();
    }
    
    updateDirection() {
        // Update direction vector based on current rotation
        this.direction.set(0, 0, -1).applyEuler(this.rotation);
    }
    
    handleMovement(deltaTime, keys) {
        const moveSpeed = config.player.moveSpeed * deltaTime;
        
        // Calculate movement direction relative to facing direction
        let moveX = 0;
        let moveZ = 0;
        
        if (keys.w) {
            moveZ -= 1; // Forward
        }
        if (keys.s) {
            moveZ += 1; // Backward
        }
        if (keys.a) {
            moveX -= 1; // Left
        }
        if (keys.d) {
            moveX += 1; // Right
        }
        
        // Normalize if moving diagonally
        if (moveX !== 0 && moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
        }
        
        // Apply movement relative to facing direction
        if (moveX !== 0 || moveZ !== 0) {
            // Create movement vector
            const movement = new THREE.Vector3(moveX, 0, moveZ);
            
            // Rotate movement vector by hero's Y rotation
            movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            
            // Apply movement
            this.group.position.x += movement.x * moveSpeed;
            this.group.position.z += movement.z * moveSpeed;
        }
    }
    
    handleJumpAndFly(deltaTime, keys) {
        // Handle jumping
        if (keys.space && !this.isJumping && !this.isFlying) {
            this.isJumping = true;
            this.jumpTime = 0;
        }
        
        if (this.isJumping) {
            this.jumpTime += deltaTime;
            
            // Jump animation using a simple sine curve
            const jumpHeight = config.player.jumpHeight;
            const jumpDuration = config.player.jumpDuration;
            
            // Calculate jump height based on time
            const jumpProgress = this.jumpTime / jumpDuration;
            
            if (jumpProgress < 1) {
                // Rising and falling
                this.group.position.y = jumpHeight * Math.sin(jumpProgress * Math.PI);
            } else {
                // Jump completed
                this.group.position.y = 0;
                this.isJumping = false;
                
                // Check if we should enter flying mode
                // In a full implementation, we would have a more sophisticated system
                if (keys.space && this.jumpTime < jumpDuration * 1.2) {
                    this.isFlying = true;
                }
            }
        }
        
        // Handle flying
        if (this.isFlying) {
            if (keys.space) {
                // Ascend
                this.group.position.y += config.player.moveSpeed * 0.5 * deltaTime;
            } else {
                // Descend
                this.group.position.y -= config.player.moveSpeed * 0.3 * deltaTime;
                
                // Check if we've landed
                if (this.group.position.y <= 0) {
                    this.group.position.y = 0;
                    this.isFlying = false;
                }
            }
        }
    }
    
    updateCooldowns(deltaTime) {
        // Update all skill cooldowns
        for (const key in this.cooldowns) {
            if (this.cooldowns[key] > 0) {
                this.cooldowns[key] -= deltaTime;
                
                // Update UI to show cooldown
                const abilityElement = document.getElementById(`ability-${key}`);
                if (abilityElement) {
                    abilityElement.style.opacity = 0.5;
                    abilityElement.textContent = `${key.toUpperCase()} (${Math.ceil(this.cooldowns[key])}s)`;
                }
            } else if (this.cooldowns[key] <= 0) {
                this.cooldowns[key] = 0;
                
                // Update UI to show skill is ready
                const abilityElement = document.getElementById(`ability-${key}`);
                if (abilityElement) {
                    abilityElement.style.opacity = 1;
                    abilityElement.textContent = key.toUpperCase();
                }
            }
        }
    }
    
    handleSkills(keys) {
        // Check for skill activation
        for (const key in this.skills) {
            if (keys[key] && this.cooldowns[key] <= 0 && this.mana >= this.skills[key].manaCost) {
                this.useSkill(key);
            }
        }
    }
    
    useSkill(key) {
        const skill = this.skills[key];
        
        // Set cooldown
        this.cooldowns[key] = skill.cooldown;
        
        // Consume mana
        this.mana -= skill.manaCost;
        this.updateUI();
        
        // Create a visual effect for the skill
        this.createSkillEffect(skill);
        
        // In a full implementation, we would handle damage, healing, etc.
        console.log(`Used skill: ${skill.name}`);
    }
    
    createSkillEffect(skill) {
        // Create a simple visual effect for the skill
        // In a full implementation, we would have more sophisticated effects
        let geometry, material;
        
        switch(skill.name) {
            case 'Fireball':
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xff4500 });
                break;
            case 'Ice Spike':
                geometry = new THREE.ConeGeometry(0.5, 2, 16);
                material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
                break;
            case 'Thunder Strike':
                geometry = new THREE.CylinderGeometry(0, 0.5, 3, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                break;
            case 'Heal':
                geometry = new THREE.TorusGeometry(1, 0.2, 16, 32);
                material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                break;
            case 'Shield':
                geometry = new THREE.SphereGeometry(1.2, 16, 16);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x4169e1,
                    transparent: true,
                    opacity: 0.5
                });
                break;
            case 'Dash':
                geometry = new THREE.BoxGeometry(0.5, 0.5, 3);
                material = new THREE.MeshBasicMaterial({ color: 0x808080 });
                break;
            default:
                geometry = new THREE.SphereGeometry(0.5, 16, 16);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }
        
        const effect = new THREE.Mesh(geometry, material);
        
        // Position effect in front of the hero based on direction
        const spawnPosition = this.getPosition().clone();
        spawnPosition.y += 1; // Adjust height to be at center of hero
        
        // For directional skills, position in front of hero based on facing direction
        if (['Fireball', 'Ice Spike', 'Thunder Strike'].includes(skill.name)) {
            const offset = this.direction.clone().multiplyScalar(2);
            spawnPosition.add(offset);
        }
        
        effect.position.copy(spawnPosition);
        
        // For directional skills, orient them in the direction the hero is facing
        if (['Fireball', 'Ice Spike', 'Thunder Strike'].includes(skill.name)) {
            effect.lookAt(spawnPosition.clone().add(this.direction));
        }
        
        this.scene.add(effect);
        
        // Remove the effect after a short time
        setTimeout(() => {
            this.scene.remove(effect);
        }, 1000);
    }
    
    getPosition() {
        return this.group.position.clone();
    }
    
    getDirection() {
        return this.direction.clone();
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateUI();
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateUI();
    }
    
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        if (this.experience >= this.nextLevelExp) {
            this.levelUp();
        }
        
        this.updateUI();
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.nextLevelExp;
        this.nextLevelExp *= config.player.experience.levelUpMultiplier;
        
        // Increase stats
        this.maxHealth *= 1.2;
        this.health = this.maxHealth;
        this.maxMana *= 1.2;
        this.mana = this.maxMana;
        
        // Show level up message
        this.showMessage(`Level Up! You are now level ${this.level}`);
        
        this.updateUI();
    }
    
    die() {
        // Handle player death
        this.showMessage('You have died!');
        
        // In a full implementation, we would handle respawning, game over, etc.
    }
    
    updateUI() {
        // Update health bar
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        if (healthBar && healthText) {
            const healthPercent = (this.health / this.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            healthText.textContent = `${Math.floor(this.health)}/${Math.floor(this.maxHealth)}`;
        }
        
        // Update mana bar
        const manaBar = document.getElementById('mana-bar');
        const manaText = document.getElementById('mana-text');
        if (manaBar && manaText) {
            const manaPercent = (this.mana / this.maxMana) * 100;
            manaBar.style.width = `${manaPercent}%`;
            manaText.textContent = `${Math.floor(this.mana)}/${Math.floor(this.maxMana)}`;
        }
        
        // Update level and XP
        const levelText = document.getElementById('level-text');
        const xpBar = document.getElementById('xp-bar');
        if (levelText && xpBar) {
            levelText.textContent = `Level ${this.level}`;
            const xpPercent = (this.experience / this.nextLevelExp) * 100;
            xpBar.style.width = `${xpPercent}%`;
        }
    }
    
    showMessage(text) {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            const message = document.createElement('div');
            message.className = 'game-message';
            message.textContent = text;
            messageContainer.appendChild(message);
            
            // Remove the message after a few seconds
            setTimeout(() => {
                message.classList.add('fade-out');
                setTimeout(() => {
                    messageContainer.removeChild(message);
                }, 1000);
            }, 3000);
        }
    }
}

export default Hero;