import DragonKnight from "./dragon-knight.js";
import Axe from "./axe.js";
import CrystalMaiden from "./crystal-maiden.js";
import Lina from "./lina.js";
import DefaultHero from "./default-hero.js";
import Wings from "./wings.js";
// Dragon Knight skills
import DragonBreath from "../skills/dragon-knight/dragon-breath.js";
import FlameStrike from "../skills/dragon-knight/flame-strike.js";
import DragonTail from "../skills/dragon-knight/dragon-tail.js";
import ElderDragonForm from "../skills/dragon-knight/elder-dragon-form.js";
import FireShield from "../skills/dragon-knight/fire-shield.js";
import Inferno from "../skills/dragon-knight/inferno.js";
import DragonRush from "../skills/dragon-knight/dragon-rush.js";

// Crystal Maiden skills
import FrostNova from "../skills/crystal-maiden/frost-nova.js";
import IceBlast from "../skills/crystal-maiden/ice-blast.js";
import GlacialBarrier from "../skills/crystal-maiden/glacial-barrier.js";
import Blizzard from "../skills/crystal-maiden/blizzard.js";
import FrozenOrb from "../skills/crystal-maiden/frozen-orb.js";
import IceShards from "../skills/crystal-maiden/ice-shards.js";

// Axe skills
import BerserkersCall from "../skills/axe/berserkers-call.js";
import BattleHunger from "../skills/axe/battle-hunger.js";
import CounterHelix from "../skills/axe/counter-helix.js";
import CullingBlade from "../skills/axe/culling-blade.js";
import BattleTrance from "../skills/axe/battle-trance.js";
import BerserkersRage from "../skills/axe/berserkers-rage.js";

import SoundManager from "../audio/sound-manager.js";
import Attack from "../combat/attack.js";
import * as THREE from 'https://unpkg.com/three@0.157.0/build/three.module.js';
import { config } from "../config/config.js";

export default class Hero {
  constructor(scene, heroType, options = {}) {
    this.scene = scene;
    this.heroType = heroType;
    
    // Extract RPG components from options
    this.skillManager = options.skillManager || null;
    this.effects = options.effects || null;
    this.characterClass = options.characterClass || null;
    this.skillTree = options.skillTree || null;
    this.shop = options.shop || null;
    this.crafting = options.crafting || null;
    
    // Initialize health and mana from character class if available
    if (this.characterClass && this.characterClass.stats) {
      this.health = this.characterClass.stats.health || config.player.health;
      this.maxHealth = this.characterClass.stats.health || config.player.health;
      this.mana = this.characterClass.stats.mana || config.player.mana;
      this.maxMana = this.characterClass.stats.mana || config.player.mana;
    } else {
      this.health = config.player.health;
      this.maxHealth = config.player.health;
      this.mana = config.player.mana;
      this.maxMana = config.player.mana;
    }
    
    this.experience = config.player.experience.initial;
    this.level = 1;
    this.nextLevelExp = config.player.experience.levelUpThreshold;
    this.isJumping = false;
    this.isFlying = false;
    this.jumpTime = 0;
    this.skills = new Map();
    this.cooldowns = new Map();
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ"); // YXZ order for FPS-style rotation
    this.direction = new THREE.Vector3(0, 0, -1); // Forward direction
    
    // Inventory and economy
    this.inventory = new Map();
    this.gold = 500; // Starting gold
    this.stats = {}; // Will be populated from character class

    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.onGround = true; // Start on the ground
    this.wings = null;
    this.wingsVisible = false;

    // Debug flag
    this.debug = config.game.debug;

    // Initialize sound manager
    this.soundManager = new SoundManager();
    this.soundManager.init();

    // Initialize attack system
    this.attackSystem = new Attack(this);
    
    // Enable auto-attack by default
    this.autoAttackEnabled = true;

    // Set attack type based on hero type
    switch (heroType) {
      case 'dragon-knight':
      case 'axe':
        this.attackType = 'melee';
        break;
      case 'crystal-maiden':
      case 'lina':
        this.attackType = 'ranged';
        this.projectileColor = heroType === 'crystal-maiden' ? 0x00ffff : 0xff4400;
        break;
      default:
        this.attackType = 'melee';
    }

    // Initialize the hero
    this.init();

    // Ensure we're on the ground at start
    this.group.position.y = 0;

    console.log("Hero initialized, onGround:", this.onGround);
  }

  initializeSkills() {
    // Initialize skills based on hero type
    switch (this.heroType) {
      case 'dragon-knight':
        this.skills.set('Y', new DragonBreath(this));
        this.skills.set('U', new FlameStrike(this));
        this.skills.set('I', new DragonTail(this));
        this.skills.set('H', new ElderDragonForm(this));
        this.skills.set('J', new FireShield(this));
        this.skills.set('K', new DragonRush(this));
        break;
      case 'crystal-maiden':
        this.skills.set('Y', new FrostNova(this));
        this.skills.set('U', new IceBlast(this));
        this.skills.set('I', new GlacialBarrier(this));
        this.skills.set('H', new Blizzard(this));
        this.skills.set('J', new FrozenOrb(this));
        this.skills.set('K', new IceShards(this));
        break;
      case 'axe':
        this.skills.set('Y', new BerserkersCall(this));
        this.skills.set('U', new BattleHunger(this));
        this.skills.set('I', new CounterHelix(this));
        this.skills.set('H', new CullingBlade(this));
        this.skills.set('J', new BattleTrance(this));
        this.skills.set('K', new BerserkersRage(this));
        break;
      case 'lina':
        // Placeholder for Lina skills - these would need to be implemented
        // For now, we'll create generic skill objects
        this.skills.set('Y', this.createGenericSkill('Dragon Slave', 40, 100, 'fire'));
        this.skills.set('U', this.createGenericSkill('Light Strike Array', 60, 120, 'fire'));
        this.skills.set('I', this.createGenericSkill('Fiery Soul', 50, 0, 'buff'));
        this.skills.set('H', this.createGenericSkill('Laguna Blade', 100, 300, 'fire'));
        this.skills.set('J', this.createGenericSkill('Flame Cloak', 70, 0, 'buff'));
        this.skills.set('K', this.createGenericSkill('Inferno Wave', 80, 150, 'fire'));
        break;
      // Add more hero types and their skills here
    }
    
    // If we have a skill tree, initialize skills from it
    if (this.skillTree) {
      // Get all skills from the skill tree
      for (const skillId in this.skillTree.skills) {
        const skill = this.skillTree.skills[skillId];
        
        // Check if the skill is unlocked or is a starting skill (no requirements)
        if (this.skillTree.isSkillUnlocked(skillId) || 
            (skill.requirements && skill.requirements.length === 0)) {
          
          // Map skill to a key if not already mapped
          // This is a simple mapping - in a full implementation, you'd want a more sophisticated system
          const keyMap = {
            'brutal-strike': 'Y',
            'whirlwind': 'U',
            'iron-skin': 'I',
            'fireball': 'Y',
            'meteor': 'U',
            'shadow-strike': 'Y',
            'smoke-bomb': 'U',
            'divine-smite': 'Y',
            'holy-shield': 'U'
          };
          
          const key = keyMap[skillId];
          if (key && !this.skills.has(key)) {
            // Create a generic skill wrapper for the skill tree skill
            this.skills.set(key, {
              name: skill.name,
              description: skill.description,
              cooldown: skill.cooldown,
              manaCost: skill.manaCost,
              baseDamage: skill.baseDamage,
              damageType: skill.damageType,
              effects: skill.effects,
              
              // Skill methods
              canUse: () => {
                return this.mana >= skill.manaCost && 
                       (!this.cooldowns.has(key) || this.cooldowns.get(key) <= 0);
              },
              
              activate: () => {
                if (this.mana >= skill.manaCost) {
                  // Deduct mana
                  this.mana -= skill.manaCost;
                  
                  // Set cooldown
                  this.cooldowns.set(key, skill.cooldown);
                  
                  // Calculate damage if applicable
                  let damage = 0;
                  if (skill.baseDamage && this.characterClass) {
                    damage = this.characterClass.getSkillDamage(skillId);
                  }
                  
                  console.log(`Using skill: ${skill.name}, Damage: ${damage}`);
                  
                  // Play sound effect
                  if (this.soundManager) {
                    this.soundManager.playSound('skill-cast');
                  }
                  
                  // Create visual effect
                  if (this.effects) {
                    // Different effect based on damage type
                    const effectType = skill.damageType === 'magic' ? 'magic' : 'physical';
                    const position = new THREE.Vector3().copy(this.group.position);
                    position.y += 1; // Adjust to be at character height
                    
                    this.effects.createEffect(effectType, position, {
                      direction: this.direction.clone(),
                      color: this.heroType === 'crystal-maiden' ? 0x00ffff : 
                             this.heroType === 'lina' ? 0xff4400 : 0xffffff
                    });
                  }
                  
                  return true;
                }
                return false;
              },
              
              update: (delta) => {
                // Nothing to update for basic skills
              },
              
              getCooldownDuration: () => {
                return skill.cooldown;
              }
            });
          }
        }
      }
    }
  }

  useSkill(key) {
    const skill = this.skills.get(key);
    if (skill && skill.canUse()) {
      skill.activate();
      this.cooldowns.set(key, skill.getCooldownDuration());
    }
  }

  updateSkills(delta) {
    // Update all skills
    for (const [key, skill] of this.skills) {
      skill.update(delta);
    }

    // Update cooldowns
    for (const [key, cooldown] of this.cooldowns) {
      if (cooldown > 0) {
        this.cooldowns.set(key, cooldown - delta);
      }
    }

    // Update attack system
    this.attackSystem.update(delta);
  }

  handleInput(input) {
    // Handle basic attack (left mouse click)
    if (input.mouseButtons.left) {
      this.attackSystem.startAttack();
    }

    // Handle skill activation
    if (input.keys.Y) this.useSkill('Y');
    if (input.keys.U) this.useSkill('U');
    if (input.keys.I) this.useSkill('I');
    if (input.keys.H) this.useSkill('H');
    if (input.keys.J) this.useSkill('J');
    if (input.keys.K) this.useSkill('K');
    
    // Toggle auto-attack with T key
    if (input.keys.T && !this.lastTKeyState) {
      this.autoAttackEnabled = !this.autoAttackEnabled;
      this.showMessage(`Auto-attack ${this.autoAttackEnabled ? 'enabled' : 'disabled'}`);
    }
    this.lastTKeyState = input.keys.T;
  }

  init() {
    // Create a group to hold the hero and allow for rotation
    this.group = new THREE.Group();
    this.type = 'hero'; // Set type for detection
    this.group.userData.type = 'hero'; // Set type in userData for raycasting
    this.group.userData.heroRef = this; // Store reference to this hero instance
    this.group.userData.isHero = true; // Additional flag for detection
    this.scene.add(this.group);
    
    // Initialize skills based on hero type
    this.initializeSkills();

    // Create a hero model based on hero type
    switch (this.heroType) {
      case "dragon-knight":
        this.createHeroModel(DragonKnight);
        break;
      case "axe":
        this.createHeroModel(Axe);
        break;
      case "crystal-maiden":
        this.createHeroModel(CrystalMaiden);
        break;
      case "lina":
        this.createHeroModel(Lina);
        break;
      default:
        this.createHeroModel(DefaultHero);
    }

    // Create wings (initially hidden)
    this.createWings();
    
    // Update UI
    this.updateUI();
  }

  createHeroModel(HeroClass) {
    // Create the hero model using the appropriate class
    const heroModel = new HeroClass();
    this.group.add(heroModel);
  }

  createWings() {
    // Create wings using the Wings class
    this.wings = new Wings();
    this.wings.setVisible(false);
    this.group.add(this.wings);
    this.setupWingAnimations();
  }

  setupWingAnimations() {
    // Setup more complex wing animations
    if (!this.wings) return;

    // Store animation parameters
    this.wingAnimations = {
      flapSpeed: 0,
      flapDirection: 1,
      flapAmplitude: 0.2, // Increased amplitude for larger wings
      shimmerIntensity: 0.5, // Increased shimmer
      shimmerSpeed: 2.5, // Slightly faster shimmer
      featherPhase: 0,
      idleTime: 0,
    };

    // Create animation clips for different wing states
    this.wingStates = {
      idle: {
        flapSpeed: 2.5, // Increased for more continuous movement
        flapAmplitude: 0.15, // Increased for more visible flapping
        shimmerIntensity: 0.5,
        shimmerSpeed: 1.5,
      },
      flying: {
        flapSpeed: 6.0, // Increased for more continuous flapping
        flapAmplitude: 0.4, // More dramatic flapping for flying
        shimmerIntensity: 0.8,
        shimmerSpeed: 4.0,
      },
      gliding: {
        flapSpeed: 1.8, // Increased for more continuous movement
        flapAmplitude: 0.2, // Increased for more visible flapping
        shimmerIntensity: 0.6,
        shimmerSpeed: 2.0,
      },
      hovering: {
        flapSpeed: 8.5, // Faster flapping for hovering
        flapAmplitude: 0.35, // Increased for more visible flapping
        shimmerIntensity: 0.9,
        shimmerSpeed: 6.0,
      },
    };

    // Set initial state
    this.setWingState("idle");
  }

  createGenericSkill(name, manaCost, damage, damageType) {
    return {
      name: name,
      manaCost: manaCost,
      damage: damage,
      damageType: damageType,
      
      // Skill methods
      canUse: () => {
        return this.mana >= manaCost && 
               (!this.cooldowns.has(name) || this.cooldowns.get(name) <= 0);
      },
      
      activate: () => {
        if (this.mana >= manaCost) {
          // Deduct mana
          this.mana -= manaCost;
          
          // Set cooldown
          this.cooldowns.set(name, 5.0); // Default 5 second cooldown
          
          console.log(`Using skill: ${name}, Damage: ${damage}`);
          
          // Play sound effect
          if (this.soundManager) {
            this.soundManager.playSound('skill-cast');
          }
          
          // Create visual effect
          if (this.effects) {
            // Different effect based on damage type
            const effectType = damageType === 'fire' ? 'fire' : 
                              damageType === 'buff' ? 'buff' : 'physical';
            const position = new THREE.Vector3().copy(this.group.position);
            position.y += 1; // Adjust to be at character height
            
            this.effects.createEffect(effectType, position, {
              direction: this.direction.clone(),
              color: damageType === 'fire' ? 0xff4400 : 0xffffff
            });
          }
          
          return true;
        }
        return false;
      },
      
      update: (delta) => {
        // Nothing to update for generic skills
      },
      
      getCooldownDuration: () => {
        return 5.0; // Default cooldown of 5 seconds
      }
    };
  }
  
  // This method is no longer needed as we're using initializeSkills instead
  // Keeping it commented out for reference
  /*
  initSkills() {
    // Assign skills based on hero type
    // In a full implementation, each hero would have unique skills
    this.skills = {
      y: config.skills.fireball,
      u: config.skills.iceSpike,
      i: config.skills.thunderStrike,
      h: config.skills.heal,
      j: config.skills.shield,
      k: config.skills.dash,
    };

    // Initialize cooldowns
    for (const key in this.skills) {
      this.cooldowns[key] = 0;
    }
  }
  */

  update(deltaTime, keys, inputHandler) {
    // Handle rotation from mouse and Q/E keys
    if (inputHandler) {
      this.handleRotation(inputHandler);
    }

    // Apply horizontal velocity from jumping if any
    if (!this.onGround && (this.velocity.x !== 0 || this.velocity.z !== 0)) {
      this.group.position.x += this.velocity.x * deltaTime;
      this.group.position.z += this.velocity.z * deltaTime;

      // Gradually reduce horizontal velocity (air resistance)
      this.velocity.x *= 0.98;
      this.velocity.z *= 0.98;

      // If velocity is very small, set to zero
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
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

    // Update hero animations
    this.updateAnimations(deltaTime, keys);

    // Update debug display if debug mode is enabled
    if (this.debug) {
      this.updateDebugDisplay();
    }
  }

  updateAnimations(deltaTime, keys) {
    // Central method for all hero animations

    // 1. Animate wings if visible
    if (this.wings && this.wings.visible) {
      this.flapWings(deltaTime);
    }

    // 2. Animate body parts based on movement state
    this.animateBodyParts(deltaTime, keys);

    // 3. Add breathing animation
    this.animateBreathing(deltaTime);

    // 4. Add head tracking animation
    this.animateHeadTracking(deltaTime);

    // 5. Animate weapon if applicable
    this.animateWeapon(deltaTime, keys);
  }

  animateBodyParts(deltaTime, keys) {
    // Animate body parts based on movement state
    const isMoving = keys["w"] || keys["a"] || keys["s"] || keys["d"];
    const isJumping = this.isJumping;
    const isFlying = this.isFlying;

    // Find body parts to animate
    const bodyGroup = this.group.children[0]; // First child should be the body group
    if (!bodyGroup) return;

    // Find arms and legs
    let leftArm, rightArm, leftLeg, rightLeg, head;

    // Search for body parts by position
    bodyGroup.children.forEach((part) => {
      // Check position to identify parts
      const pos = part.position;

      // Left arm is usually positioned to the left (negative X) and at mid-height
      if (pos.x < -0.5 && pos.y > 0.8 && pos.y < 1.6) leftArm = part;

      // Right arm is usually positioned to the right (positive X) and at mid-height
      if (pos.x > 0.5 && pos.y > 0.8 && pos.y < 1.6) rightArm = part;

      // Left leg is usually positioned to the left (negative X) and at low height
      if (pos.x < 0 && pos.y < 0.8) leftLeg = part;

      // Right leg is usually positioned to the right (positive X) and at low height
      if (pos.x > 0 && pos.y < 0.8) rightLeg = part;

      // Head is usually positioned at the top
      if (pos.y > 1.6) head = part;
    });

    // Animation parameters
    const walkSpeed = 5;
    const walkTime = (this.walkTime || 0) + (isMoving ? deltaTime : 0);
    this.walkTime = walkTime;

    // Animate legs when walking
    if (leftLeg && rightLeg && isMoving && !isFlying) {
      // Walking animation - alternating leg movement
      const legSwing = Math.sin(walkTime * walkSpeed) * 0.3;

      leftLeg.rotation.x = legSwing;
      rightLeg.rotation.x = -legSwing;
    } else if (leftLeg && rightLeg) {
      // Reset legs when not walking
      leftLeg.rotation.x = this.lerpValue(leftLeg.rotation.x, 0, deltaTime * 5);
      rightLeg.rotation.x = this.lerpValue(
        rightLeg.rotation.x,
        0,
        deltaTime * 5
      );
    }

    // Animate arms
    if (leftArm && rightArm) {
      if (isMoving && !isFlying) {
        // Walking arm swing - opposite to legs
        const armSwing = Math.sin(walkTime * walkSpeed) * 0.2;

        leftArm.rotation.x = -armSwing;
        rightArm.rotation.x = armSwing;
      } else if (isFlying) {
        // Flying pose - arms slightly back
        leftArm.rotation.x = this.lerpValue(
          leftArm.rotation.x,
          -0.3,
          deltaTime * 3
        );
        rightArm.rotation.x = this.lerpValue(
          rightArm.rotation.x,
          -0.3,
          deltaTime * 3
        );
      } else {
        // Idle arm position
        leftArm.rotation.x = this.lerpValue(
          leftArm.rotation.x,
          0,
          deltaTime * 5
        );
        rightArm.rotation.x = this.lerpValue(
          rightArm.rotation.x,
          0,
          deltaTime * 5
        );
      }
    }

    // Animate head for looking around
    if (head) {
      // Head follows look direction slightly
      const lookX = this.rotation.y * 0.2;
      const lookY = this.rotation.x * 0.2;

      head.rotation.y = this.lerpValue(head.rotation.y, lookX, deltaTime * 3);
      head.rotation.x = this.lerpValue(head.rotation.x, lookY, deltaTime * 3);
    }

    // Animate body tilt based on movement
    if (isMoving && !isFlying) {
      // Slight forward tilt when walking
      bodyGroup.rotation.x = this.lerpValue(
        bodyGroup.rotation.x,
        0.1,
        deltaTime * 2
      );
    } else if (isFlying) {
      // Forward tilt when flying
      bodyGroup.rotation.x = this.lerpValue(
        bodyGroup.rotation.x,
        0.2,
        deltaTime * 2
      );
    } else {
      // Reset tilt when idle
      bodyGroup.rotation.x = this.lerpValue(
        bodyGroup.rotation.x,
        0,
        deltaTime * 2
      );
    }
  }
  
  animateBreathing(deltaTime) {
    // Add subtle breathing animation to the hero's body
    const bodyGroup = this.group.children[0];
    if (!bodyGroup) return;

    // Find the body (usually the largest part)
    let body;
    let maxSize = 0;

    bodyGroup.children.forEach((part) => {
      // Find the body by looking for the largest part at mid-height
      if (part.geometry && part.position.y > 0.5 && part.position.y < 1.5) {
        const size =
          part.geometry.parameters.width * part.geometry.parameters.height;
        if (size > maxSize) {
          maxSize = size;
          body = part;
        }
      }
    });

    if (body) {
      // Breathing animation - subtle scale changes
      const breathingTime = (this.breathingTime || 0) + deltaTime;
      this.breathingTime = breathingTime;

      const breathingSpeed = 0.5; // Slow breathing
      const breathingAmount = 0.02; // Subtle effect

      const breathScale =
        1 + Math.sin(breathingTime * breathingSpeed) * breathingAmount;

      // Apply breathing to chest area only
      const originalScale =
        body.userData.originalScale || new THREE.Vector3(1, 1, 1);

      // Store original scale if not already stored
      if (!body.userData.originalScale) {
        body.userData.originalScale = body.scale.clone();
      }

      // Apply breathing scale
      body.scale.set(
        originalScale.x * breathScale,
        originalScale.y,
        originalScale.z * breathScale
      );
    }
  }

  animateHeadTracking(deltaTime) {
    // Add head tracking animation
    const bodyGroup = this.group.children[0];
    if (!bodyGroup) return;

    // Find the head
    let head;
    bodyGroup.children.forEach((part) => {
      if (part.position.y > 1.6) {
        head = part;
      }
    });

    if (head) {
      // Occasional random head movements
      const randomMovementTime = (this.randomMovementTime || 0) + deltaTime;
      this.randomMovementTime = randomMovementTime;

      // Every few seconds, add a random head movement
      if (Math.sin(randomMovementTime * 0.2) > 0.95) {
        this.targetHeadRotation = {
          x: (Math.random() - 0.5) * 0.2,
          y: (Math.random() - 0.5) * 0.3,
        };
      }

      // Smoothly move head to target rotation
      if (this.targetHeadRotation) {
        head.rotation.x = this.lerpValue(
          head.rotation.x,
          this.targetHeadRotation.x,
          deltaTime * 2
        );
        head.rotation.y = this.lerpValue(
          head.rotation.y,
          this.targetHeadRotation.y,
          deltaTime * 2
        );
      }
    }
  }

  animateWeapon(deltaTime, keys) {
    // Animate weapon if present
    const bodyGroup = this.group.children[0];
    if (!bodyGroup) return;

    // Find weapon (sword, axe, staff, etc.)
    let weapon;
    bodyGroup.children.forEach((part) => {
      // Check if this part has children that might be a weapon
      if (part.children && part.children.length > 0) {
        part.children.forEach((child) => {
          // Weapons are usually longer in one dimension
          if (
            child.geometry &&
            (child.geometry.parameters.height > 1 ||
              child.geometry.parameters.width > 1 ||
              child.geometry.parameters.depth > 1)
          ) {
            weapon = child;
          }
        });
      }
    });

    if (weapon) {
      // Idle weapon animation - subtle movement
      const idleTime = (this.weaponIdleTime || 0) + deltaTime;
      this.weaponIdleTime = idleTime;

      // Subtle weapon sway
      const swayAmount = 0.03;
      const swaySpeed = 0.7;

      // Apply sway
      weapon.rotation.z = Math.sin(idleTime * swaySpeed) * swayAmount;

      // Attack animation when mouse is clicked
      if (
        keys["attack"] ||
        (this.inputHandler && this.inputHandler.isMouseButtonPressed(0))
      ) {
        // Start attack animation
        this.startWeaponAttackAnimation(weapon);
      }

      // Update ongoing attack animation if active
      if (this.attackAnimationActive) {
        this.updateWeaponAttackAnimation(deltaTime, weapon);
      }
    }
  }

  startWeaponAttackAnimation(weapon) {
    // Only start if not already attacking
    if (this.attackAnimationActive) return;

    // Set attack animation state
    this.attackAnimationActive = true;
    this.attackAnimationTime = 0;
    this.attackAnimationDuration = 0.5; // Half second attack

    // Store original weapon rotation
    this.originalWeaponRotation = {
      x: weapon.rotation.x,
      y: weapon.rotation.y,
      z: weapon.rotation.z,
    };

    // Play attack sound
    if (window.soundManager) {
      window.soundManager.playSound("attack");
    }
  }

  updateWeaponAttackAnimation(deltaTime, weapon) {
    // Update attack animation time
    this.attackAnimationTime += deltaTime;

    // Calculate animation progress (0 to 1)
    const progress = Math.min(
      this.attackAnimationTime / this.attackAnimationDuration,
      1
    );

    // Attack animation phases
    if (progress < 0.3) {
      // Wind up phase - pull back
      const windupProgress = progress / 0.3;
      weapon.rotation.z =
        this.originalWeaponRotation.z - (windupProgress * Math.PI) / 4;
    } else if (progress < 0.6) {
      // Strike phase - swing forward
      const strikeProgress = (progress - 0.3) / 0.3;
      weapon.rotation.z =
        this.originalWeaponRotation.z -
        Math.PI / 4 +
        (strikeProgress * Math.PI) / 2;
    } else {
      // Return phase - return to original position
      const returnProgress = (progress - 0.6) / 0.4;
      weapon.rotation.z =
        this.originalWeaponRotation.z +
        Math.PI / 4 -
        (returnProgress * Math.PI) / 4;
    }

    // End animation when complete
    if (progress >= 1) {
      this.attackAnimationActive = false;
      weapon.rotation.z = this.originalWeaponRotation.z;
    }
  }

  updateDebugDisplay() {
    // Create or update debug display
    let debugDisplay = document.getElementById("debug-display");

    if (!debugDisplay) {
      debugDisplay = document.createElement("div");
      debugDisplay.id = "debug-display";
      debugDisplay.style.position = "absolute";
      debugDisplay.style.top = "100px";
      debugDisplay.style.left = "10px";
      debugDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      debugDisplay.style.color = "white";
      debugDisplay.style.padding = "10px";
      debugDisplay.style.fontFamily = "monospace";
      debugDisplay.style.fontSize = "12px";
      debugDisplay.style.zIndex = "1000";
      debugDisplay.style.pointerEvents = "none"; // Don't block mouse events
      document.body.appendChild(debugDisplay);
    }

    // Get collision info if available
    let collisionInfo = "Not initialized";
    if (window.collisionDetector) {
      const currentPosition = this.group.position.clone();
      const collisionResult = window.collisionDetector.checkCollision(
        currentPosition,
        new THREE.Vector3(0, 0, 0),
        0
      );
      collisionInfo = collisionResult.canMove
        ? "No collision"
        : "Collision detected";
    }

    // Get nearby jumpable objects if available
    let jumpableInfo = "Not checked";
    if (window.collisionDetector && this.onGround) {
      const jumpResult = window.collisionDetector.checkJumpCollision(
        this.group.position,
        config.player.jumpHeight
      );
      jumpableInfo = jumpResult.canJump
        ? `Jumpable object at (${jumpResult.jumpTarget.x.toFixed(
            2
          )}, ${jumpResult.jumpTarget.y.toFixed(
            2
          )}, ${jumpResult.jumpTarget.z.toFixed(2)})`
        : "No jumpable objects nearby";
    }

    // Update debug info
    debugDisplay.innerHTML = `
        <h3>Hero Debug Info</h3>
        <p>Position: x=${this.group.position.x.toFixed(
          2
        )}, y=${this.group.position.y.toFixed(
      2
    )}, z=${this.group.position.z.toFixed(2)}</p>
        <p>Velocity: x=${this.velocity.x.toFixed(
          2
        )}, y=${this.velocity.y.toFixed(2)}, z=${this.velocity.z.toFixed(2)}</p>
        <p>onGround: ${this.onGround}</p>
        <p>isJumping: ${this.isJumping}</p>
        <p>isFlying: ${this.isFlying}</p>
        <p>wingsVisible: ${this.wingsVisible}</p>
        <p>Max Flying Height: ${config.player.maxFlyingHeight}</p>
        <p>Current Height %: ${(
          (this.group.position.y / config.player.maxFlyingHeight) *
          100
        ).toFixed(1)}%</p>
        <p>Space key pressed: ${
          window.inputHandler ? window.inputHandler.isKeyPressed(" ") : "N/A"
        }</p>
        <p>Collision status: ${collisionInfo}</p>
        <p>Jumpable objects: ${jumpableInfo}</p>
        <p>Movement keys: W=${window.inputHandler?.isKeyPressed("w")}, 
                          A=${window.inputHandler?.isKeyPressed("a")}, 
                          S=${window.inputHandler?.isKeyPressed("s")}, 
                          D=${window.inputHandler?.isKeyPressed("d")}</p>
    `;
  }

  // Inventory Methods
  addItem(item) {
    if (!item) return false;

    // Check if item is stackable and already exists in inventory
    if (item.stackable && this.inventory.has(item.id)) {
      const existingItem = this.inventory.get(item.id);
      existingItem.quantity += item.quantity || 1;
      return true;
    } else {
      // Add new item to inventory
      this.inventory.set(item.id, item);
      
      // Emit event for UI updates
      const event = new CustomEvent('inventoryUpdated', {
        detail: {
          hero: this,
          item: item,
          action: 'add'
        }
      });
      document.dispatchEvent(event);
      
      return true;
    }
  }

  removeItem(itemId, quantity = 1) {
    if (!this.inventory.has(itemId)) return false;

    const item = this.inventory.get(itemId);
    
    if (item.stackable) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        this.inventory.delete(itemId);
      }
    } else {
      this.inventory.delete(itemId);
    }

    // Emit event for UI updates
    const event = new CustomEvent('inventoryUpdated', {
      detail: {
        hero: this,
        itemId: itemId,
        action: 'remove'
      }
    });
    document.dispatchEvent(event);
    
    return true;
  }

  useItem(itemId) {
    if (!this.inventory.has(itemId)) return false;

    const item = this.inventory.get(itemId);
    
    // Check if item is usable
    if (!item.effect) return false;
    
    // Use the item on the hero
    const success = item.use(this);
    
    if (success) {
      // Remove one from stack if stackable, or remove completely if not
      if (item.stackable) {
        item.quantity--;
        if (item.quantity <= 0) {
          this.inventory.delete(itemId);
        }
      } else {
        this.inventory.delete(itemId);
      }
      
      // Emit event for UI updates
      const event = new CustomEvent('itemUsed', {
        detail: {
          hero: this,
          item: item
        }
      });
      document.dispatchEvent(event);
      
      return true;
    }
    
    return false;
  }

  equipItem(itemId) {
    // This would be expanded in a full implementation to handle equipment slots
    if (!this.inventory.has(itemId)) return false;
    
    const item = this.inventory.get(itemId);
    
    // Check if item is equippable
    if (item.type !== 'weapon' && item.type !== 'armor') return false;
    
    // Check level requirement
    if (item.levelReq && this.level < item.levelReq) return false;
    
    // Check stat requirements
    if (item.requirements) {
      for (const [stat, value] of Object.entries(item.requirements)) {
        if (this.stats[stat] < value) return false;
      }
    }
    
    // In a full implementation, we would handle equipment slots here
    console.log(`Equipped ${item.name}`);
    
    // Emit event for UI updates
    const event = new CustomEvent('itemEquipped', {
      detail: {
        hero: this,
        item: item
      }
    });
    document.dispatchEvent(event);
    
    return true;
  }

  getInventory() {
    return Array.from(this.inventory.values());
  }

  getInventoryByType(type) {
    return this.getInventory().filter(item => item.type === type);
  }

  handleRotation(inputHandler) {
    // Get look direction from input handler
    const lookDir = inputHandler.getLookDirection();

    // Apply rotation
    // Horizontal rotation (around Y axis)
    this.rotation.y -= lookDir.x * 0.01;

    // Vertical rotation (around X axis) - limit to avoid flipping
    this.rotation.x -= lookDir.y * 0.01;

    // Clamp vertical rotation to prevent flipping over
    // Allow looking up at the sky (-PI/2) and down at the ground (PI/2)
    // But leave a small margin to prevent complete flipping
    const verticalLimit = Math.PI / 2 - 0.05;
    this.rotation.x = Math.max(
      -verticalLimit,
      Math.min(verticalLimit, this.rotation.x)
    );

    // Apply rotation to the group - only Y rotation affects the character model
    this.group.rotation.y = this.rotation.y;

    // Update the direction vector based on both horizontal and vertical rotation
    // This ensures the direction vector points where the player is looking
    this.direction.set(0, 0, -1).applyEuler(this.rotation);

    // Reset input handler movement to avoid continuous rotation
    inputHandler.resetMovement();
  }

  updateDirection() {
    // Update direction vector based on current rotation (both horizontal and vertical)
    this.direction.set(0, 0, -1).applyEuler(this.rotation);
  }

  handleMovement(deltaTime, keys) {
    const moveSpeed = config.player.moveSpeed * deltaTime;

    // Calculate movement direction relative to facing direction
    let moveX = 0;
    let moveZ = 0;
    let lookDirectionChange = 0;
    let isMoving = false;

    // Handle all movement combinations

    // Forward movement (W)
    if (keys.w) {
      moveZ -= 1; // Forward
      isMoving = true;

      // Combined forward + left/right movement changes look direction
      if (keys.a) {
        lookDirectionChange = -1; // Look left while moving forward
      } else if (keys.d) {
        lookDirectionChange = 1; // Look right while moving forward
      }
    }

    // Backward movement (S)
    if (keys.s) {
      moveZ += 1; // Backward
      isMoving = true;

      // Combined backward + left/right movement changes look direction
      if (keys.a) {
        lookDirectionChange = -1; // Look left while moving backward
      } else if (keys.d) {
        lookDirectionChange = 1; // Look right while moving backward
      }
    }

    // Only handle horizontal look direction changes
    if (keys.a) {
      lookDirectionChange = -1;
    } else if (keys.d) {
      lookDirectionChange = 1;
    }

    // Handle left/right movement without forward/backward
    if (!keys.w && !keys.s) {
      if (keys.a) {
        moveX -= 1; // Left
        isMoving = true;
      }
      if (keys.d) {
        moveX += 1; // Right
        isMoving = true;
      }
    }

    // Apply look direction change if needed
    if (lookDirectionChange !== 0) {
      // Rotate the hero based on the combined movement
      const rotationSpeed = 0.03; // Base rotation speed

      // Adjust rotation speed based on movement type
      let adjustedRotationSpeed = rotationSpeed;

      // Apply the rotation
      this.rotation.y -= lookDirectionChange * adjustedRotationSpeed;
      this.group.rotation.y = this.rotation.y;
    }

    // Normalize if moving diagonally
    if (moveX !== 0 && moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
    }

    // Apply movement relative to facing direction
    if (isMoving && (moveX !== 0 || moveZ !== 0)) {
      // Create movement vector
      const movement = new THREE.Vector3(moveX, 0, moveZ);

      // Rotate movement vector by hero's Y rotation
      movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);

      // Calculate new position
      const newPosition = new THREE.Vector3(
        this.group.position.x + movement.x * moveSpeed,
        this.group.position.y,
        this.group.position.z + movement.z * moveSpeed
      );

      // Check for collisions if collision detector is available
      if (window.collisionDetector) {
        // First, check for direct enemy collisions at the current position
        // This is a more aggressive check to prevent walking through enemies
        const directEnemyCollision = this.checkDirectEnemyCollision(newPosition);
        
        if (directEnemyCollision) {
          // If we're about to walk into an enemy, don't move at all
          if (config.game.debug) {
            console.log("Direct enemy collision detected - preventing movement");
          }
        } else {
          // No direct enemy collision, proceed with normal collision detection
          const collisionResult = window.collisionDetector.checkCollision(
            this.group.position,
            movement,
            moveSpeed
          );

          if (collisionResult.canMove) {
            // Only update X and Z position
            this.group.position.x = collisionResult.newPosition.x;
            this.group.position.z = collisionResult.newPosition.z;
          } else {
            // We hit a solid object, try to slide along it
            const slideDirection = new THREE.Vector3(movement.z, 0, -movement.x).normalize();
            const slideCollision = window.collisionDetector.checkCollision(
              this.group.position,
              slideDirection,
              moveSpeed * 0.5
            );

            if (slideCollision.canMove) {
              // Only update X and Z position when sliding
              this.group.position.x = slideCollision.newPosition.x;
              this.group.position.z = slideCollision.newPosition.z;
            }
          }
        }
      } else {
        // No collision detection, just move
        this.group.position.x = newPosition.x;
        this.group.position.z = newPosition.z;
      }
    }
  }

  // Check for direct collisions with enemies
  checkDirectEnemyCollision(newPosition) {
    if (!window.collisionDetector || !window.collisionDetector.world || !window.collisionDetector.world.enemyManager) {
      return false;
    }
    
    const enemies = window.collisionDetector.world.enemyManager.enemies;
    if (!enemies || enemies.length === 0) {
      return false;
    }
    
    // Create a sphere around the hero for collision detection
    const heroRadius = 0.5; // Adjust based on hero size
    const heroSphere = new THREE.Sphere(newPosition, heroRadius);
    
    // Check each enemy for collision
    for (const enemy of enemies) {
      if (!enemy.mesh) continue;
      
      // Use box collision for enemies if available
      if (enemy.mesh.userData.collisionBox) {
        // Update the collision box to match the current position
        const box = new THREE.Box3().setFromObject(enemy.mesh);
        
        // Check if the hero sphere intersects with the enemy's box
        if (box.intersectsSphere(heroSphere)) {
          return true;
        }
      } else {
        // Fallback to distance-based collision
        // Calculate distance to enemy (horizontal only)
        const dx = newPosition.x - enemy.mesh.position.x;
        const dz = newPosition.z - enemy.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Enemy collision radius - increased to ensure no walking through
        const enemyRadius = 1.2; // Further increased for better collision detection
        
        // Check if we're colliding with the enemy
        if (distance < (heroRadius + enemyRadius)) {
          return true;
        }
      }
    }
    
    return false;
  }

  handleJumpAndFly(deltaTime, keys) {
    // Handle jumping when on ground
    if (this.onGround && keys[" "]) {
      // Start jump
      this.velocity.y = config.player.jumpForce;
      this.isJumping = true;
      this.onGround = false;
      this.jumpTime = 0;

      // Play jump sound
      if (window.soundManager) {
        window.soundManager.playSound("jump");
      }
    }

    // Handle flying
    if (!this.onGround) {
      this.jumpTime += deltaTime;

      // Check if we should transition to flying
      if (keys[" "] && this.jumpTime >= 0.2 && !this.isFlying && this.group.position.y >= config.player.flyingHeight) {
        this.isFlying = true;
        this.isJumping = false;

        // Show wings
        if (this.wings && !this.wingsVisible) {
          this.wings.visible = true;
          this.wingsVisible = true;
          this.setWingState("flying");
        }
      }

      // Apply physics
      if (this.isFlying) {
        // Flying physics
        if (keys[" "]) {
          // Ascend when holding space
          this.velocity.y = Math.min(this.velocity.y + 20 * deltaTime, 10);
        } else {
          // Gentle descent when not holding space
          this.velocity.y = Math.max(this.velocity.y - 10 * deltaTime, -5);
        }

        // Enforce maximum flying height
        if (this.group.position.y >= config.player.maxFlyingHeight) {
          this.group.position.y = config.player.maxFlyingHeight;
          this.velocity.y = Math.min(this.velocity.y, 0);
        }

        // Update wing animation state
        if (this.wings) {
          if (keys[" "]) {
            this.setWingState("flying");
          } else {
            this.setWingState("gliding");
          }
        }
      } else {
        // Normal jump physics
        this.velocity.y -= config.player.gravity * deltaTime;
      }

      // Calculate next Y position
      const newY = this.group.position.y + this.velocity.y * deltaTime;

      // Ground collision check first
      if (newY <= 0) {
        // Hit the ground, stop immediately
        this.group.position.y = 0;
        this.velocity.y = 0;
        this.onGround = true;
        this.isJumping = false;
        this.isFlying = false;

        // Play landing sound if falling fast
        if (this.velocity.y < -5 && window.soundManager) {
          window.soundManager.playSound("land");
        }

        // Hide wings
        if (this.wings && this.wingsVisible) {
          this.wings.visible = false;
          this.wingsVisible = false;
        }
        return;
      }

      // Check for other collisions
      if (window.collisionDetector) {
        const currentPosition = this.group.position.clone();
        currentPosition.y = newY;

        const collisionResult = window.collisionDetector.checkCollision(
          currentPosition,
          new THREE.Vector3(0, this.velocity.y > 0 ? 1 : -1, 0),
          Math.abs(this.velocity.y * deltaTime)
        );

        if (collisionResult.canMove) {
          // No collision, update Y position
          this.group.position.y = newY;
          this.onGround = false;
        } else {
          // Hit something
          this.group.position.y = collisionResult.newPosition.y;
          
          if (this.velocity.y < 0) {
            // We hit something while falling
            this.velocity.y = 0;
            this.onGround = true;
            this.isJumping = false;
            this.isFlying = false;

            // Play landing sound if falling fast
            if (this.velocity.y < -5 && window.soundManager) {
              window.soundManager.playSound("land");
            }

            // Hide wings
            if (this.wings && this.wingsVisible) {
              this.wings.visible = false;
              this.wingsVisible = false;
            }
          } else {
            // We hit something while going up
            this.velocity.y = 0;
          }
        }
      } else {
        // No collision detection, just update Y but respect ground
        this.group.position.y = Math.max(newY, 0);
        
        // Check for ground landing
        if (this.group.position.y === 0) {
          this.onGround = true;
          this.isJumping = false;
          this.isFlying = false;
          this.velocity.y = 0;

          // Hide wings
          if (this.wings && this.wingsVisible) {
            this.wings.visible = false;
            this.wingsVisible = false;
          }
        } else {
          this.onGround = false;
        }
      }
    }

    if (keys[" "]) {
      if (this.onGround) {
        // Normal jump from ground
        this.velocity.y = config.player.jumpForce;
        this.isJumping = true;
        this.onGround = false;

        // Play jump sound
        if (window.soundManager) {
          window.soundManager.playSound("jump");
        }
      } else {
        // Flying when in air
        const maxFlyingHeight = config.player.maxFlyingHeight || 200;

        // Enter flying mode
        this.isFlying = true;
        if (!this.wingsVisible && window.soundManager) {
          window.soundManager.playSound("dash");
        }

        // Calculate upward boost
        let boost = config.player.jumpForce * 0.3;

        // Limit height
        if (this.group.position.y >= maxFlyingHeight) {
          boost = 0;
          this.velocity.y = Math.min(0, this.velocity.y);
        } else {
          // Reduce boost as we approach max height
          boost *= Math.max(0.2, 1 - this.group.position.y / maxFlyingHeight);
        }

        // Apply boost and reduce gravity
        this.velocity.y += boost;
        this.velocity.y *= 0.85;
      }
    } else if (this.onGround) {
      // Reset states when landing
      this.isFlying = false;
      this.isJumping = false;
    }

    // Show wings when flying
    if (this.isFlying && !this.onGround) {
      if (!this.wingsVisible) {
        this.wings.visible = true;
        this.wingsVisible = true;
        this.wings.scale.set(0.5, 0.5, 0.5);
        this.animateWings();
      }

      // Flap wings with varying intensity
      const flapIntensity = keys[" "] ? 1.5 : 1.0;
      this.flapWings(deltaTime, flapIntensity);

      // Set wing state based on movement
      if (keys[" "]) {
        this.setWingState("flying");
      } else if (Math.abs(this.velocity.y) > 5) {
        this.setWingState("gliding");
      } else {
        this.setWingState("hovering");
      }
    } else if (this.wingsVisible || this.onGround) {
      // Hide wings and reset flying state when landing
      this.wings.visible = false;
      this.wingsVisible = false;
      this.isFlying = false;
    }

    // Show/hide wings based on flying state
    if (this.wings) {
      // Debug logging for wings
      if (this.debug) {
        console.log(
          "Wings check - Height:",
          this.group.position.y.toFixed(2),
          "Flying height threshold:",
          2,
          "Max flying height:",
          config.player.maxFlyingHeight || 200,
          "Wings visible:",
          this.wingsVisible,
          "Is flying:",
          this.isFlying
        );
      }

      // Show wings when flying
      if (this.isFlying && !this.onGround) {
        if (!this.wingsVisible) {
          this.wings.visible = true;
          this.wingsVisible = true;
          this.wings.scale.set(0.5, 0.5, 0.5);
          this.animateWings();
        }

        // Flap wings with varying intensity
        const flapIntensity = keys[" "] ? 1.5 : 1.0;
        this.flapWings(deltaTime, flapIntensity);

        // Set wing state based on movement
        if (keys[" "]) {
          this.setWingState("flying");
        } else if (Math.abs(this.velocity.y) > 5) {
          this.setWingState("gliding");
        } else {
          this.setWingState("hovering");
        }
      } else if (this.wingsVisible || this.onGround) {
        // Hide wings and reset flying state when landing
        this.wings.visible = false;
        this.wingsVisible = false;
        this.isFlying = false;
      }
    }
  }

  setWingState(state) {
    // Set wing animation state
    if (!this.wingAnimations || !this.wingStates || !this.wingStates[state])
      return;

    // Get state parameters
    const stateParams = this.wingStates[state];

    // Smoothly transition to new state
    this.targetWingState = stateParams;

    // Log state change
    console.log(`Wing state changed to: ${state}`);
  }

  flapWings(deltaTime, intensity = 1.0) {
    // Add elegant wing flapping animation with improved state-based system
    if (!this.wings || !this.wings.visible || !this.wingAnimations) return;

    // Update animation parameters
    const anim = this.wingAnimations;
    const target = this.targetWingState || this.wingStates.flying; // Default to flying state for more active flapping

    // Smoothly transition between states - faster transition for more responsive flapping
    anim.flapSpeed = this.lerpValue(
      anim.flapSpeed,
      target.flapSpeed * intensity,
      deltaTime * 3
    );
    anim.flapAmplitude = this.lerpValue(
      anim.flapAmplitude,
      target.flapAmplitude * intensity,
      deltaTime * 3
    );
    anim.shimmerIntensity = this.lerpValue(
      anim.shimmerIntensity,
      target.shimmerIntensity,
      deltaTime * 2
    );
    anim.shimmerSpeed = this.lerpValue(
      anim.shimmerSpeed,
      target.shimmerSpeed,
      deltaTime * 2
    );

    // Update animation timers - increased speed for more continuous flapping
    anim.featherPhase += deltaTime * anim.flapSpeed * 0.8;
    anim.idleTime += deltaTime;

    // Calculate flap position with improved natural motion
    // Use combination of sine waves for more natural motion
    const flapTime = anim.idleTime * anim.flapSpeed;
    // Use absolute sine value to ensure wings are always flapping (never completely still)
    const flapPosition =
      (Math.abs(Math.sin(flapTime)) * 0.7 + Math.sin(flapTime) * 0.3) *
      anim.flapAmplitude;

    // Add slight asymmetry for more natural look
    const asymmetry = Math.sin(flapTime * 0.5) * 0.08;

    // Add slight randomness for natural variation
    const randomness = Math.sin(flapTime * 0.3) * 0.04;

    // Apply rotation to wings
    if (this.wings.children.length >= 2) {
      // Left wing - enhanced rotation with natural motion
      this.wings.children[0].rotation.z =
        flapPosition + 0.1 + asymmetry + randomness;
      this.wings.children[0].rotation.x =
        Math.sin(flapTime * 0.7) * (anim.flapAmplitude * 0.3);
      this.wings.children[0].rotation.y = Math.sin(flapTime * 0.4) * 0.05;

      // Right wing - enhanced rotation (mirrored)
      this.wings.children[1].rotation.z =
        -flapPosition - 0.1 - asymmetry - randomness;
      this.wings.children[1].rotation.x =
        Math.sin(flapTime * 0.7) * (anim.flapAmplitude * 0.3);
      this.wings.children[1].rotation.y = -Math.sin(flapTime * 0.4) * 0.05;

      // Add enhanced up/down movement to the entire wing group
      const baseY = 1.3; // Base Y position
      this.wings.position.y = baseY + Math.sin(flapTime * 0.5) * 0.05;

      // Add enhanced forward/backward movement
      const baseZ = 0.35; // Base Z position
      this.wings.position.z = baseZ + Math.sin(flapTime * 0.7) * 0.03;

      // Add subtle side-to-side movement
      this.wings.position.x = Math.sin(flapTime * 0.3) * 0.02;

      // Add subtle rotation to entire wing group
      this.wings.rotation.x = 0.1 + Math.sin(flapTime * 0.2) * 0.05;
      this.wings.rotation.y = Math.sin(flapTime * 0.15) * 0.03;

      // Add enhanced feather animation if feathers exist
      if (this.wings.children[0].children.length > 0) {
        const leftFeathers = this.wings.children[0].children[0];
        const rightFeathers = this.wings.children[1].children[0];

        // Animate each feather with improved ripple effect
        for (let i = 0; i < leftFeathers.children.length; i++) {
          // Create a ripple effect with phase offset
          const delay = i * 0.15;
          const featherPhase = anim.featherPhase - delay;

          // More complex feather motion
          const featherFlapPosition =
            Math.sin(featherPhase) * (0.08 - i * 0.01);
          const featherTwist =
            Math.cos(featherPhase * 0.7) * (0.03 - i * 0.005);

          // Apply rotations
          if (leftFeathers.children[i]) {
            leftFeathers.children[i].rotation.z = featherFlapPosition;
            leftFeathers.children[i].rotation.x = featherTwist;
          }

          if (rightFeathers && rightFeathers.children[i]) {
            rightFeathers.children[i].rotation.z = -featherFlapPosition;
            rightFeathers.children[i].rotation.x = featherTwist;
          }
        }
      }
    }

    // Add enhanced shimmer/glow effect by varying emissive intensity
    const shimmerTime = anim.idleTime * anim.shimmerSpeed;
    const baseShimmer = anim.shimmerIntensity;
    const shimmerVariation = 0.15;

    // Complex shimmer pattern using multiple sine waves
    const shimmerIntensity =
      baseShimmer +
      (Math.sin(shimmerTime) * 0.7 + Math.sin(shimmerTime * 1.3) * 0.3) *
        shimmerVariation;

    // Apply shimmer to wing materials
    if (this.wings.children[0].material) {
      this.wings.children[0].material.emissiveIntensity = shimmerIntensity;
      this.wings.children[1].material.emissiveIntensity = shimmerIntensity;
    }

    // Determine wing state based on velocity, position, and height
    // Higher altitudes will have more dramatic wing animations
    const height = this.group.position.y;

    if (this.velocity.y > 10) {
      // Hovering - faster at higher altitudes
      this.setWingState("hovering");
      // Increase flap speed with height
      this.wingAnimations.flapSpeed =
        this.wingStates.hovering.flapSpeed * Math.min(2, 1 + height / 30);
    } else if (this.velocity.y > 5) {
      // Flying - more dramatic at higher altitudes
      this.setWingState("flying");
      // Increase amplitude with height
      this.wingAnimations.flapAmplitude =
        this.wingStates.flying.flapAmplitude * Math.min(1.5, 1 + height / 50);
    } else if (this.isFlying) {
      // Gliding - more shimmer at higher altitudes
      this.setWingState("gliding");
      // Increase shimmer with height
      this.wingAnimations.shimmerIntensity =
        this.wingStates.gliding.shimmerIntensity *
        Math.min(1.8, 1 + height / 40);
    } else {
      this.setWingState("idle");
    }
  }

  // Helper function for smooth transitions
  lerpValue(current, target, factor) {
    return current + (target - current) * Math.min(factor, 1);
  }
  animateWings() {
    // Create a beautiful wing appearance animation
    if (this.wings && this.wings.visible) {
      // Reset any previous animation state
      this.wings.scale.set(0.01, 0.01, 0.01);
      this.wings.rotation.y = -Math.PI / 2; // Start folded
      this.wings.rotation.z = 0;

      // Store original wing positions
      const leftWingOriginalPos = this.wings.children[0].position.clone();
      const rightWingOriginalPos = this.wings.children[1].position.clone();

      // Start with wings close together - adjusted for larger wings
      this.wings.children[0].position.x = -0.08;
      this.wings.children[1].position.x = 0.08;

      // Create a shimmer effect with particles
      this.createWingShimmerEffect();

      // Define the animation sequence
      const animateStep = (step = 0, maxSteps = 30) => {
        if (step <= maxSteps && this.wings && this.wings.visible) {
          // Calculate progress (0 to 1)
          const progress = step / maxSteps;
          const easeInOut =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2; // Smooth easing

          // Scale up gradually
          const targetScale = 0.8; // Final scale
          const currentScale = 0.01 + (targetScale - 0.01) * easeInOut;
          this.wings.scale.set(currentScale, currentScale, currentScale);

          // Unfold wings
          const startRotation = -Math.PI / 2;
          const endRotation = 0;
          this.wings.rotation.y =
            startRotation + (endRotation - startRotation) * easeInOut;

          // Spread wings apart
          const leftWingX = -0.05 + (leftWingOriginalPos.x + 0.05) * easeInOut;
          const rightWingX = 0.05 + (rightWingOriginalPos.x - 0.05) * easeInOut;

          this.wings.children[0].position.x = leftWingX;
          this.wings.children[1].position.x = rightWingX;

          // Add a gentle flap during appearance
          const flapAmount = Math.sin(progress * Math.PI * 2) * 0.2;
          this.wings.children[0].rotation.z = flapAmount;
          this.wings.children[1].rotation.z = -flapAmount;

          // Shimmer effect - vary opacity and emissive
          const shimmerIntensity = 0.3 + Math.sin(progress * Math.PI * 6) * 0.2;
          if (this.wings.children[0].material) {
            this.wings.children[0].material.emissiveIntensity =
              shimmerIntensity;
            this.wings.children[1].material.emissiveIntensity =
              shimmerIntensity;

            // Start more transparent and become more solid
            const opacity = 0.5 + (0.9 - 0.5) * easeInOut;
            this.wings.children[0].material.opacity = opacity;
            this.wings.children[1].material.opacity = opacity;
          }

          // Continue animation in next frame
          setTimeout(() => animateStep(step + 1, maxSteps), 30);
        }
      };

      // Start the animation sequence
      animateStep();
    }
  }

  createWingShimmerEffect() {
    // Create a beautiful shimmer effect when wings appear
    if (!this.wings) return;

    // Create a particle group
    const particleGroup = new THREE.Group();

    // Create 20 shimmer particles
    for (let i = 0; i < 20; i++) {
      // Create a small glowing particle
      const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
      const particleMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        emissive: 0xffffff,
        emissiveIntensity: 1.0,
        shininess: 100
      });

      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      // Random position around the wings
      particle.position.set(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.5
      );

      // Add to particle group
      particleGroup.add(particle);

      // Animate each particle
      const speed = 0.5 + Math.random() * 1.5;
      const delay = Math.random() * 1000;

      setTimeout(() => {
        const animateParticle = () => {
          if (!this.wings || !this.wings.visible) return;

          // Move particle upward and outward
          particle.position.y += 0.01 * speed;
          particle.position.x +=
            (particle.position.x > 0 ? 0.005 : -0.005) * speed;

          // Fade out
          if (particle.material.opacity > 0) {
            particle.material.opacity -= 0.01 * speed;
          }

          // Continue animation until faded
          if (particle.material.opacity > 0) {
            requestAnimationFrame(animateParticle);
          } else {
            particleGroup.remove(particle);
          }
        };

        animateParticle();
      }, delay);
    }

    // Add particles to wings
    this.wings.add(particleGroup);

    // Remove particles after animation completes
    setTimeout(() => {
      if (this.wings) {
        this.wings.remove(particleGroup);
      }
    }, 3000);
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
          abilityElement.textContent = `${key.toUpperCase()} (${Math.ceil(
            this.cooldowns[key]
          )}s)`;
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
  
  gainExperience(amount) {
    // If we have a character class, use its experience system
    if (this.characterClass) {
      this.characterClass.gainExperience(amount);
      
      // Update hero level from character class
      this.level = this.characterClass.level;
      
      // Show a message
      this.showMessage(`Gained ${amount} experience!`);
      
      return;
    }
    
    // Fallback to basic experience system if no character class
    this.experience += amount;
    
    // Check for level up
    if (this.experience >= this.nextLevelExp) {
      this.levelUp();
    }
    
    // Show a message
    this.showMessage(`Gained ${amount} experience!`);
  }
  
  levelUp() {
    // If we have a character class, it handles leveling up
    if (this.characterClass) {
      // The character class already leveled up in gainExperience
      // Just update our stats from it
      if (this.characterClass.stats) {
        this.maxHealth = this.characterClass.stats.health;
        this.health = this.maxHealth; // Heal to full on level up
        this.maxMana = this.characterClass.stats.mana;
        this.mana = this.maxMana; // Restore mana to full on level up
      }
      
      // Show level up message
      this.showMessage(`Level up! You are now level ${this.level}!`);
      this.showMessage(`You gained skill points and attribute points!`);
      
      // Play level up sound
      if (this.soundManager) {
        this.soundManager.playSound('level-up');
      }
      
      // Create level up effect
      if (this.effects) {
        const position = new THREE.Vector3().copy(this.group.position);
        this.effects.createEffect('levelUp', position);
      }
      
      return;
    }
    
    // Fallback to basic leveling if no character class
    this.level++;
    this.experience -= this.nextLevelExp;
    this.nextLevelExp = Math.floor(this.nextLevelExp * 1.5); // Increase exp needed for next level
    
    // Increase stats
    this.maxHealth += 10;
    this.health = this.maxHealth; // Heal to full on level up
    this.maxMana += 5;
    this.mana = this.maxMana; // Restore mana to full on level up
    
    // Show level up message
    this.showMessage(`Level up! You are now level ${this.level}!`);
    
    // Play level up sound
    if (this.soundManager) {
      this.soundManager.playSound('level-up');
    }
  }
  
  equipItem(item, slot) {
    // If we have a character class, use its equipment system
    if (this.characterClass) {
      const success = this.characterClass.equipItem(item, slot);
      
      if (success) {
        // Update stats from character class
        if (this.characterClass.stats) {
          this.maxHealth = this.characterClass.stats.health;
          this.maxMana = this.characterClass.stats.mana;
        }
        
        // Show message
        this.showMessage(`Equipped ${item.name}!`);
        
        // Play equip sound
        if (this.soundManager) {
          this.soundManager.playSound('equip-item');
        }
        
        return true;
      } else {
        // Show message
        this.showMessage(`Cannot equip ${item.name}!`);
        return false;
      }
    }
    
    // No character class, can't equip
    this.showMessage(`Cannot equip items without a character class!`);
    return false;
  }
  
  unequipItem(slot) {
    // If we have a character class, use its equipment system
    if (this.characterClass) {
      const item = this.characterClass.unequipItem(slot);
      
      if (item) {
        // Update stats from character class
        if (this.characterClass.stats) {
          this.maxHealth = this.characterClass.stats.health;
          this.maxMana = this.characterClass.stats.mana;
        }
        
        // Show message
        this.showMessage(`Unequipped ${item.name}!`);
        
        // Play unequip sound
        if (this.soundManager) {
          this.soundManager.playSound('unequip-item');
        }
        
        return item;
      }
    }
    
    return null;
  }
  
  spendSkillPoint(skillId) {
    // If we have a character class and skill tree, use them
    if (this.characterClass && this.skillTree) {
      const success = this.characterClass.spendSkillPoint(skillId);
      
      if (success) {
        // Show message
        this.showMessage(`Learned new skill: ${this.skillTree.getSkill(skillId).name}!`);
        
        // Play skill learn sound
        if (this.soundManager) {
          this.soundManager.playSound('learn-skill');
        }
        
        // Reinitialize skills to include the new one
        this.initializeSkills();
        
        return true;
      } else {
        // Show message
        this.showMessage(`Cannot learn that skill!`);
        return false;
      }
    }
    
    // No character class or skill tree, can't spend skill points
    this.showMessage(`Cannot learn skills without a character class!`);
    return false;
  }
  
  spendAttributePoint(attribute) {
    // If we have a character class, use it
    if (this.characterClass) {
      const success = this.characterClass.spendAttributePoint(attribute);
      
      if (success) {
        // Update stats from character class
        if (this.characterClass.stats) {
          this.maxHealth = this.characterClass.stats.health;
          this.maxMana = this.characterClass.stats.mana;
        }
        
        // Show message
        this.showMessage(`Increased ${attribute}!`);
        
        return true;
      } else {
        // Show message
        this.showMessage(`Cannot increase ${attribute}!`);
        return false;
      }
    }
    
    // No character class, can't spend attribute points
    this.showMessage(`Cannot increase attributes without a character class!`);
    return false;
  }
  
  getStats() {
    // If we have a character class, get stats from it
    if (this.characterClass && this.characterClass.stats) {
      return {
        ...this.characterClass.stats,
        health: this.health,
        maxHealth: this.maxHealth,
        mana: this.mana,
        maxMana: this.maxMana,
        level: this.level,
        experience: this.characterClass.experience,
        nextLevelExp: this.characterClass.getExperienceForNextLevel(),
        skillPoints: this.characterClass.skillPoints,
        attributePoints: this.characterClass.attributePoints,
        equipment: this.characterClass.equipment
      };
    }
    
    // Fallback to basic stats if no character class
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      mana: this.mana,
      maxMana: this.maxMana,
      level: this.level,
      experience: this.experience,
      nextLevelExp: this.nextLevelExp
    };
  }
  
  calculateDamage(baseDamage, damageType = 'physical') {
    // If we have a character class, use its damage calculation
    if (this.characterClass) {
      return this.characterClass.calculateDamage(baseDamage, damageType);
    }
    
    // Fallback to basic damage calculation
    return Math.floor(baseDamage);
  }
  
  calculateDefense(damage, damageType = 'physical') {
    // If we have a character class, use its defense calculation
    if (this.characterClass) {
      return this.characterClass.calculateDefense(damage, damageType);
    }
    
    // Fallback to basic defense calculation (no reduction)
    return damage;
  }

  handleSkills(keys) {
    // Check for skill activation
    for (const key in this.skills) {
      if (
        keys[key] &&
        this.cooldowns[key] <= 0 &&
        this.mana >= this.skills[key].manaCost
      ) {
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

    switch (skill.name) {
      case "Fireball":
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
        material = new THREE.MeshBasicMaterial({ color: 0xff4500 });
        break;
      case "Ice Spike":
        geometry = new THREE.ConeGeometry(0.5, 2, 16);
        material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        break;
      case "Thunder Strike":
        geometry = new THREE.CylinderGeometry(0, 0.5, 3, 16);
        material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        break;
      case "Heal":
        geometry = new THREE.TorusGeometry(1, 0.2, 16, 32);
        material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        break;
      case "Shield":
        geometry = new THREE.SphereGeometry(1.2, 16, 16);
        material = new THREE.MeshBasicMaterial({
          color: 0x4169e1,
          transparent: true,
          opacity: 0.5,
        });
        break;
      case "Dash":
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
    if (["Fireball", "Ice Spike", "Thunder Strike"].includes(skill.name)) {
      const offset = this.direction.clone().multiplyScalar(2);
      spawnPosition.add(offset);
    }

    effect.position.copy(spawnPosition);

    // For directional skills, orient them in the direction the hero is facing
    if (["Fireball", "Ice Spike", "Thunder Strike"].includes(skill.name)) {
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

  setPosition(x, y, z) {
    if (this.group) {
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        this.group.position.set(x, y, z);
      } else if (x instanceof THREE.Vector3) {
        this.group.position.copy(x);
      }
    }
  }

  getDirection() {
    return this.direction.clone();
  }

  getCameraPositionInfo() {
    // Return camera positioning information based on hero state
    let cameraDistance = 5; // Default distance behind hero
    let cameraHeight = 3; // Default height above hero
    let targetHeight = 1.5; // Default target height (where camera looks)

    // Adjust camera based on hero state
    if (this.isFlying) {
      // When flying, position camera further back and higher
      cameraDistance = 7;
      cameraHeight = 4;
      targetHeight = 2;
    } else if (this.isJumping) {
      // When jumping, position camera slightly higher
      cameraDistance = 6;
      cameraHeight = 3.5;
      targetHeight = 1.8;
    }

    return {
      distance: cameraDistance,
      height: cameraHeight,
      targetHeight: targetHeight,
    };
  }

  takeDamage(amount) {
    console.log(`Hero taking ${amount} damage, current health: ${this.health}`);
    this.health = Math.max(0, this.health - amount);
    this.updateUI();
    
    // Play blood effect instead of damage numbers
    this.showBloodEffect();

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
    this.showMessage("You have died!");

    // In a full implementation, we would handle respawning, game over, etc.
  }
  
  showBloodEffect() {
    // Create blood particle system
    const particleCount = 20;
    const particles = [];
    const bloodGroup = new THREE.Group();
    
    // Create blood particles
    for (let i = 0; i < particleCount; i++) {
      // Random size for particles
      const size = 0.03 + Math.random() * 0.05;
      const geometry = new THREE.SphereGeometry(size, 6, 6);
      
      // Dark red color with slight variation
      const hue = 0.98 + Math.random() * 0.04; // Red with slight variation
      const saturation = 0.8 + Math.random() * 0.2;
      const lightness = 0.2 + Math.random() * 0.2; // Darker red for blood
      
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      // Random position around the hero
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.2 + Math.random() * 0.3;
      
      particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
      particle.position.y = 1 + radius * Math.sin(phi) * Math.sin(theta); // Position at mid-height
      particle.position.z = radius * Math.cos(phi);
      
      // Random velocity
      const speed = 0.01 + Math.random() * 0.03;
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        -0.5 - Math.random(), // Mostly downward
        (Math.random() - 0.5) * 2
      ).normalize();
      
      particles.push({
        mesh: particle,
        velocity: direction.multiplyScalar(speed),
        gravity: 0.001 + Math.random() * 0.002,
        life: 1.0
      });
      
      bloodGroup.add(particle);
    }
    
    // Position the blood effect at the hero
    bloodGroup.position.copy(this.group.position);
    this.scene.add(bloodGroup);
    
    // Animate blood particles
    const animate = () => {
      let allDead = true;
      
      particles.forEach(particle => {
        // Apply gravity
        particle.velocity.y -= particle.gravity;
        
        // Move particle
        particle.mesh.position.add(particle.velocity);
        
        // Reduce life
        particle.life -= 0.02;
        particle.mesh.material.opacity = particle.life;
        
        if (particle.life > 0) {
          allDead = false;
        }
      });
      
      if (allDead) {
        // Clean up
        this.scene.remove(bloodGroup);
        particles.forEach(particle => {
          particle.mesh.geometry.dispose();
          particle.mesh.material.dispose();
        });
      } else {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  updateUI() {
    // Update health bar
    const healthBar = document.getElementById("health-bar");
    const healthText = document.getElementById("health-text");
    if (healthBar && healthText) {
      const healthPercent = (this.health / this.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
      healthText.textContent = `${Math.floor(this.health)}/${Math.floor(
        this.maxHealth
      )}`;
    }

    // Update mana bar
    const manaBar = document.getElementById("mana-bar");
    const manaText = document.getElementById("mana-text");
    if (manaBar && manaText) {
      const manaPercent = (this.mana / this.maxMana) * 100;
      manaBar.style.width = `${manaPercent}%`;
      manaText.textContent = `${Math.floor(this.mana)}/${Math.floor(
        this.maxMana
      )}`;
    }

    // Update level and XP
    const levelText = document.getElementById("level-text");
    const xpBar = document.getElementById("xp-bar");
    if (levelText && xpBar) {
      levelText.textContent = `Level ${this.level}`;
      const xpPercent = (this.experience / this.nextLevelExp) * 100;
      xpBar.style.width = `${xpPercent}%`;
    }
  }

  showMessage(text) {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      const message = document.createElement("div");
      message.className = "game-message";
      message.textContent = text;
      messageContainer.appendChild(message);

      // Remove the message after a few seconds
      setTimeout(() => {
        message.classList.add("fade-out");
        setTimeout(() => {
          messageContainer.removeChild(message);
        }, 1000);
      }, 3000);
    }
  }
}
