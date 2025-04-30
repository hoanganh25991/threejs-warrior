import DragonKnight from "./dragon-knight.js";
import Axe from "./axe.js";
import CrystalMaiden from "./crystal-maiden.js";
import Lina from "./lina.js";
import DefaultHero from "./default-hero.js";
import Wings from "./wings.js";
import * as THREE from "three";
import { config } from "../config/config.js";

export default class Hero {
  constructor(scene, heroType) {
    this.scene = scene;
    this.heroType = heroType;
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
    this.rotation = new THREE.Euler(0, 0, 0, "YXZ"); // YXZ order for FPS-style rotation
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

    console.log("Hero initialized, onGround:", this.onGround);
  }

  init() {
    // Create a group to hold the hero and allow for rotation
    this.group = new THREE.Group();
    this.scene.add(this.group);

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

    // Initialize skills based on hero type
    this.initSkills();
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

    // Handle vertical movement (flying up/down) with combined look direction changes
    if (this.isFlying) {
      // Up movement
      if (keys[" "]) {
        // Space key for up
        // Combined up + left/right movement changes look direction
        if (keys.a) {
          lookDirectionChange = -1; // Look left while moving up
        } else if (keys.d) {
          lookDirectionChange = 1; // Look right while moving up
        }
      }

      // Down movement (when not pressing space while flying)
      if (!keys[" "] && this.velocity.y < 0) {
        // Combined down + left/right movement changes look direction
        if (keys.a) {
          lookDirectionChange = -1; // Look left while moving down
        } else if (keys.d) {
          lookDirectionChange = 1; // Look right while moving down
        }
      }
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
        const collisionResult = window.collisionDetector.checkCollision(
          this.group.position,
          movement,
          moveSpeed
        );

        if (collisionResult.canMove) {
          // Update position with collision-adjusted position
          this.group.position.copy(collisionResult.newPosition);

          // Update onGround status based on slope
          this.onGround = collisionResult.isOnSlope || Math.abs(this.group.position.y - collisionResult.newPosition.y) < 0.1;

          // If we're on a slope, adjust movement speed
          if (collisionResult.isOnSlope) {
            // Reduce movement speed on slopes
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
          }
        } else {
          // We hit a solid object, slide along it
          const slideDirection = new THREE.Vector3(movement.z, 0, -movement.x).normalize();
          const slideCollision = window.collisionDetector.checkCollision(
            this.group.position,
            slideDirection,
            moveSpeed * 0.5
          );

          if (slideCollision.canMove) {
            this.group.position.copy(slideCollision.newPosition);
          }
        }
      } else {
        // No collision detection, just move
        this.group.position.x = newPosition.x;
        this.group.position.z = newPosition.z;
      }
    }
  }

  handleJumpAndFly(deltaTime, keys) {
    // Always apply gravity when not on ground - even when flying
    // This ensures the hero falls when space is released
    if (!this.onGround) {
      // Apply gravity to velocity - reduced gravity when flying for better control
      const gravityFactor = this.isFlying && keys[" "] ? 0.7 : 1.0;
      this.velocity.y -= config.player.gravity * gravityFactor * deltaTime;

      // Update position based on velocity
      this.group.position.y += this.velocity.y * deltaTime;

      // Check for collisions with objects while in the air
      if (window.collisionDetector) {
        // Get current position
        const currentPosition = this.group.position.clone();

        // Check if we're colliding with any objects at our current position
        const collisionResult = window.collisionDetector.checkCollision(
          currentPosition,
          new THREE.Vector3(0, 0, 0), // No movement direction
          0 // No movement distance
        );

        // If we can't move, we've hit something
        if (!collisionResult.canMove) {
          // Adjust position based on collision
          this.group.position.copy(collisionResult.newPosition);

          // If we hit something from above, stop upward velocity
          if (this.velocity.y > 0) {
            this.velocity.y = 0;
          }
        }
      }

      // Check if we've landed on something
      let landingHeight = 0;
      let hasLanded = false;

      // Check if we've landed on the ground
      if (this.group.position.y <= 0) {
        landingHeight = 0;
        hasLanded = true;
      }
      // Check if we've landed on an object
      else if (this.velocity.y < 0 && window.collisionDetector) {
        // Cast a ray downward to check for objects below
        const rayStart = this.group.position.clone();
        const rayDirection = new THREE.Vector3(0, -1, 0);
        const rayLength = 0.5; // Check 0.5 units below the hero

        // Create a raycaster
        const raycaster = new THREE.Raycaster(
          rayStart,
          rayDirection,
          0,
          rayLength
        );

        // Get all collidable objects
        const collidableObjects = window.collisionDetector.collisionObjects
          .filter((obj) => obj.isCollidable && obj.mesh)
          .map((obj) => obj.mesh);

        // Check for intersections
        const intersects = raycaster.intersectObjects(collidableObjects, true);

        // If we hit something, we've landed
        if (intersects.length > 0) {
          landingHeight = intersects[0].point.y;
          hasLanded = true;

          if (this.debug) {
            console.log(`Landed on object at height ${landingHeight}`);
          }
        }
      }

      // Handle landing
      if (hasLanded) {
        // Only play landing sound if we were falling with significant velocity
        if (this.velocity.y < -5 && window.soundManager) {
          window.soundManager.playSound("land");
        }

        this.group.position.y = landingHeight;
        this.velocity.y = 0;
        this.velocity.x = 0; // Stop horizontal movement on landing
        this.velocity.z = 0;
        this.onGround = true;
        this.isJumping = false;
        this.isFlying = false;

        // Hide wings when landing
        if (this.wings && this.wingsVisible) {
          this.wings.visible = false;
          this.wingsVisible = false;
        }
      }
    }

    // Handle continuous jumping with space key
    if (keys[" "]) {
      // If on ground, initiate jump
      if (this.onGround) {
        console.log("Jump initiated from ground!");

        // Check if we can jump onto nearby objects
        let jumpTarget = null;

        if (window.collisionDetector) {
          const jumpResult = window.collisionDetector.checkJumpCollision(
            this.group.position,
            config.player.jumpHeight
          );

          if (jumpResult.canJump) {
            jumpTarget = jumpResult.jumpTarget;
            console.log("Jump target found:", jumpTarget);
          }
        }

        // Apply jump force
        this.velocity.y = config.player.jumpForce;
        this.isJumping = true;
        this.onGround = false;
        this.isFlying = false; // Reset flying state on new jump

        // If we have a jump target, adjust velocity to reach it
        if (jumpTarget) {
          // Calculate horizontal distance to target
          const horizontalDist = new THREE.Vector2(
            jumpTarget.x - this.group.position.x,
            jumpTarget.z - this.group.position.z
          ).length();

          // Calculate time to reach peak of jump
          const timeToApex = this.velocity.y / config.player.gravity;

          // Calculate horizontal velocity needed to reach target
          const horizontalVelocity = horizontalDist / (timeToApex * 2);

          // Create direction vector to target
          const direction = new THREE.Vector3(
            jumpTarget.x - this.group.position.x,
            0,
            jumpTarget.z - this.group.position.z
          ).normalize();

          // Apply horizontal velocity in direction of target
          this.velocity.x = direction.x * horizontalVelocity;
          this.velocity.z = direction.z * horizontalVelocity;
        }

        // Play jump sound
        if (window.soundManager) {
          window.soundManager.playSound("jump");
        }
      }
      // If already in the air, handle flying
      else if (this.isJumping || this.isFlying) {
        // Get maximum flying height from config
        const maxFlyingHeight = config.player.maxFlyingHeight || 200;

        // Enter flying mode immediately when holding space in air
        if (!this.isFlying) {
          this.isFlying = true;
          if (window.soundManager) {
            window.soundManager.playSound("dash");
          }
        }

        // Calculate boost based on current height and velocity
        let boost = 0;

        if (this.isFlying) {
          // Strong upward boost when flying
          boost = config.player.jumpForce * 0.3;

          // If below max height, allow strong boosting
          if (this.group.position.y < maxFlyingHeight) {
            // Reduce boost as we approach max height
            const heightFactor = Math.max(
              0.2,
              1 - this.group.position.y / maxFlyingHeight
            );
            boost *= heightFactor;
          } else {
            // At max height, stop upward movement
            if (this.velocity.y > 0) {
              this.velocity.y = 0;
            }
            boost = 0;
          }

          // Apply gravity reduction while flying
          this.velocity.y *= 0.8; // Reduce downward velocity
        } else {
          // Normal jump physics
          if (this.velocity.y < 0) {
            boost = config.player.jumpForce * 0.1; // Small boost for better control
          }
        }

        // Add the boost to velocity
        this.velocity.y += boost;

        // Check if we should exit flying mode
        if (this.onGround || this.group.position.y <= 0.1) {
            this.isFlying = false;
            this.isJumping = false;
            if (this.wings && this.wingsVisible) {
                this.wings.visible = false;
                this.wingsVisible = false;
            }
        }
      }

      // Debug logging
      console.log(
        "Space pressed, y-pos:",
        this.group.position.y.toFixed(2),
        "velocity:",
        this.velocity.y.toFixed(2),
        "flying:",
        this.isFlying
      );
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

      // Show wings when flying or jumping
      if ((this.isFlying || (this.isJumping && !this.onGround)) && !this.onGround) {
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
        // Hide wings when not flying/jumping or when on ground
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
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        emissive: 0xffffff,
        emissiveIntensity: 1.0,
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
    this.showMessage("You have died!");

    // In a full implementation, we would handle respawning, game over, etc.
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
