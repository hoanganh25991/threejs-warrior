// Import Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Import game modules
import { config } from "./config/config.js";
import Hero from "./hero/hero.js";
import EnemyManager from "./enemies/enemyManager.js";
import SkillManager from "./skills/skillManager.js";
import InputHandler from "./input.js";
import World from "./world/world.js";
import SoundManager from "./audio/sound-manager.js";
import CollisionDetector from "./collisionDetector.js";
import ParticleSystem from "./effects/particle-system.js";
import Effects from "./effects/effects.js";
import Shop from "./shop/shop.js";
import Crafting from "./crafting/crafting.js";
import CharacterClass from "./rpg/character-class.js";
import SkillTree from "./rpg/skill-tree.js";
import HUD from "./ui/hud.js";
import CraftingUI from "./ui/craftingUI.js";
import ShopUI from "./ui/shopUI.js";
import ShopButton from "./ui/shopButton.js";
import Boss from "./enemies/boss.js";
import Attack from "./combat/attack.js";
import Terrain from "./terrain/terrain.js";
import MouseCaptureManager from "./ui/mouse-capture-manager.js";

// Game class
class Game {
  constructor() {
    // Initialize properties
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();
    this.mixers = [];
    this.hero = null;
    this.enemyManager = null;
    this.skillManager = null;
    this.inputHandler = null;
    this.world = null;
    this.soundManager = null;
    this.collisionDetector = null;
    this.particleSystem = null;
    this.effects = null;
    this.shop = null;
    this.crafting = null;
    this.characterClass = null;
    this.skillTree = null;
    this.hud = null;
    this.craftingUI = null;
    this.shopUI = null;
    this.shopButton = null;
    this.boss = null;
    this.terrain = null;
    this.attack = null;
    this.isGameStarted = false;
    this.selectedHero = null;
    this.isLoading = true;

    // Initialize the game
    this.init();
  }

  init() {
    // Show loading screen
    this.showLoadingScreen(true);

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      config.camera.fov,
      window.innerWidth / window.innerHeight,
      config.camera.near,
      config.camera.far
    );
    this.camera.position.set(
      config.camera.initialPosition.x,
      config.camera.initialPosition.y,
      config.camera.initialPosition.z
    );

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("game-canvas"),
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Setup shadow map
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;

    // Add lights
    this.addLights();

    // Initialize world
    this.world = new World(this.scene);

    // Initialize sound manager
    this.soundManager = new SoundManager();
    this.soundManager.init();

    // Make sound manager globally accessible
    window.soundManager = this.soundManager;

    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Add event listeners
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Add specific event listener for the canvas to handle jumping
    const canvas = document.getElementById("game-canvas");
    if (canvas) {
      canvas.addEventListener("keydown", (event) => {
        console.log("Canvas key pressed:", event.key, "Code:", event.code);

        // Handle space key for jumping
        if (event.key === " " || event.code === "Space") {
          console.log("Space key detected on canvas");
        }
      });

      // Make canvas focusable
      canvas.tabIndex = 1;
    }

    // Add hero selection event listeners
    const heroButtons = document.querySelectorAll(".select-hero-btn");
    heroButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        this.selectedHero = event.target.getAttribute("data-hero");
        this.startGame();
      });
    });

    // Hide loading screen
    setTimeout(() => {
      this.showLoadingScreen(false);
      this.isLoading = false;
    }, 1000);

    // Start animation loop
    this.animate();
  }

  showLoadingScreen(show) {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      if (show) {
        loadingScreen.classList.remove("hidden");
      } else {
        loadingScreen.classList.add("hidden");
      }
    }
  }

  addLights() {
    // Store lights in an array for easy access
    this.lights = {
      ambient: null,
      directional: null,
      hemisphere: null,
      point: [],
      spot: [],
    };

    // 1. Ambient light - provides base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Darker ambient light
    this.scene.add(ambientLight);
    this.lights.ambient = ambientLight;

    // 2. Hemisphere light - sky and ground colors
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a7e4f, 0.6); // Sky blue and grass green
    this.scene.add(hemisphereLight);
    this.lights.hemisphere = hemisphereLight;

    // 3. Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xfdb813, 1); // Golden sunlight
    directionalLight.position.set(50, 100, 75);
    directionalLight.castShadow = true;

    // Set up shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;

    this.scene.add(directionalLight);
    this.lights.directional = directionalLight;

    // 4. Add point lights around the scene
    const pointLightColors = [
      0xff5555, // Red
      0x55ff55, // Green
      0x5555ff, // Blue
      0xffff55, // Yellow
    ];

    // Add point lights at different positions
    for (let i = 0; i < 4; i++) {
      const pointLight = new THREE.PointLight(pointLightColors[i], 1, 50);
      const angle = (i / 4) * Math.PI * 2;
      const distance = 30;

      pointLight.position.set(
        Math.cos(angle) * distance,
        5,
        Math.sin(angle) * distance
      );

      pointLight.castShadow = true;
      pointLight.shadow.mapSize.width = 512;
      pointLight.shadow.mapSize.height = 512;

      // Add a visible sphere to represent the light
      const pointLightHelper = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: pointLightColors[i] })
      );
      pointLightHelper.position.copy(pointLight.position);

      this.scene.add(pointLight);
      this.scene.add(pointLightHelper);
      this.lights.point.push(pointLight);
    }

    // 5. Add spotlights for dramatic effect
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 30, -50);
    spotLight.angle = Math.PI / 8;
    spotLight.penumbra = 0.2;
    spotLight.decay = 1;
    spotLight.distance = 200;

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    this.scene.add(spotLight);
    this.lights.spot.push(spotLight);

    // Add a target for the spotlight
    const spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(0, 0, -100);
    this.scene.add(spotLightTarget);
    spotLight.target = spotLightTarget;
  }

  startGame() {
    // Hide hero selection screen
    document.getElementById("hero-selection").classList.add("hidden");

    // Show game UI
    document.getElementById("game-ui").classList.remove("hidden");
    
    // Check if shop modal exists in the DOM at game start
    console.log('Shop modal in DOM at game start:', document.getElementById('shop-modal'));

    // Initialize input handler
    this.inputHandler = new InputHandler();
    window.inputHandler = this.inputHandler;
    
    // Initialize mouse capture manager
    this.mouseCaptureManager = new MouseCaptureManager(this.inputHandler);
    window.mouseCaptureManager = this.mouseCaptureManager;

    // Initialize game systems
    this.skillManager = new SkillManager(this.scene);
    this.enemyManager = new EnemyManager(this.scene);
    this.collisionDetector = new CollisionDetector(this.world);
    window.collisionDetector = this.collisionDetector;

    // Initialize effect system
    this.effects = new Effects(this.scene);
    
    // Disable shadows for effects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Points) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });

    // Initialize terrain system
    try {
      this.terrain = new Terrain(this.scene, {
        width: 1000,
        height: 1000,
        segmentsW: 100,
        segmentsH: 100,
        maxHeight: 50,
        minHeight: -50,
        textures: {
          diffuse: '/assets/textures/terrain/grass_diffuse.jpg',
          normal: '/assets/textures/terrain/grass_normal.jpg'
        },
        materialOptions: {
          wireframe: false,
          flatShading: false
        }
      });
    } catch (error) {
      console.warn("Failed to initialize terrain:", error);
      this.terrain = null;
    }

    // Initialize RPG systems
    this.shop = new Shop(this.scene, this.effects);
    this.crafting = new Crafting();
    this.characterClass = new CharacterClass(this.selectedHero);
    this.skillTree = new SkillTree(this.selectedHero);

    // Initialize UI
    this.hud = new HUD();
    
    // Play background music
    if (this.soundManager) {
      this.soundManager.playSound('background-music', { loop: true });
    }

    // Create hero with all systems connected
    this.hero = new Hero(this.scene, this.selectedHero, {
      skillManager: this.skillManager,
      effects: this.effects,
      characterClass: this.characterClass,
      skillTree: this.skillTree,
      shop: this.shop,
      crafting: this.crafting
    });

    // Initialize combat system
    this.attack = new Attack(this.hero);
    
    // Initialize crafting UI
    this.craftingUI = new CraftingUI(this.hero);
    
    // Check if shop modal exists in the DOM
    console.log('Shop modal in DOM before ShopUI init:', document.getElementById('shop-modal'));
    
    // Initialize shop UI
    this.shopUI = new ShopUI(this.hero, this.shop);
    
    // Initialize shop button
    this.shopButton = new ShopButton(this.shopUI);
    
    // Log shop UI instance
    console.log('ShopUI initialized:', this.shopUI);

    // Add debug info for collision detection if debug mode is enabled
    if (config.game.debug) {
      const collisionDebug = document.createElement("div");
      collisionDebug.id = "collision-debug";
      collisionDebug.style.position = "absolute";
      collisionDebug.style.top = "100px";
      collisionDebug.style.left = "20px";
      collisionDebug.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      collisionDebug.style.color = "white";
      collisionDebug.style.padding = "10px";
      collisionDebug.style.borderRadius = "5px";
      collisionDebug.style.fontFamily = "Arial, sans-serif";
      collisionDebug.style.zIndex = "1000";
      collisionDebug.textContent = "Collision Detection: Active";
      document.body.appendChild(collisionDebug);
    }

    // Set game as started
    this.isGameStarted = true;
  }

  onWindowResize() {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update(deltaTime) {
    // Skip updates if game hasn't started
    if (!this.isGameStarted) return;

    // Update world and environment
    if (this.world) {
      this.world.update(deltaTime, this.camera);
    }

    // Update terrain
    if (this.terrain && typeof this.terrain.update === 'function') {
      try {
        this.terrain.update(deltaTime);
      } catch (error) {
        console.warn("Error updating terrain:", error);
      }
    }

    // Update game systems
    if (this.effects) {
      this.effects.update(deltaTime);
    }
    if (this.skillManager) {
      this.skillManager.update(deltaTime, this.enemyManager);
    }
    if (this.enemyManager && this.hero) {
      const heroPosition = this.hero.getPosition();
      this.enemyManager.update(deltaTime, heroPosition);
    }

    // Update combat system
    if (this.attack) {
      this.attack.update(deltaTime);
      
      // Handle attack input
      if (this.inputHandler && this.inputHandler.isKeyPressed('mouse0') && this.attack.canAttack()) {
        this.attack.startAttack();
      }
    }

    // Update boss if present
    if (this.boss) {
      this.boss.update(deltaTime);
    }

    // Update RPG systems
    if (this.shop && this.hero) {
      // Shop interactions would be handled by UI events
    }
    
    if (this.crafting && this.hero) {
      // Crafting interactions would be handled by UI events
    }

    // Update UI
    if (this.hud) {
      this.hud.update({
        hero: this.hero,
        boss: this.boss,
        skillManager: this.skillManager,
        characterClass: this.characterClass
      });
    }

    // Update lights
    this.updateLights(deltaTime);

    // Update hero
    if (this.hero && this.inputHandler) {
      // Pass the input handler to the hero for rotation
      this.hero.update(deltaTime, this.inputHandler.keys, this.inputHandler);

      // Get hero position and direction
      const heroPosition = this.hero.getPosition();
      const heroDirection = this.hero.getDirection();

      // Disable OrbitControls when game is started
      this.controls.enabled = false;

      // Get the hero's position and rotation
      const heroRotation = this.hero.rotation;

      // Set the camera position to a third-person view behind the hero
      // Get the hero's direction vector
      const lookDirection = this.hero.getDirection();

      // Get camera positioning information based on hero state
      const cameraInfo = this.hero.getCameraPositionInfo();

      // Calculate camera position behind the hero
      const cameraOffset = lookDirection
        .clone()
        .multiplyScalar(-cameraInfo.distance);

      // Apply horizontal direction only for camera positioning
      const horizontalDirection = new THREE.Vector3(
        lookDirection.x,
        0,
        lookDirection.z
      ).normalize();
      const horizontalOffset = horizontalDirection.multiplyScalar(
        -cameraInfo.distance
      );

      // Position camera behind player (horizontally)
      this.camera.position.copy(heroPosition).add(horizontalOffset);

      // Apply vertical offset based on player's vertical look direction
      // Calculate a height offset that decreases as player looks up, increases as player looks down
      const verticalLookFactor = Math.sin(this.hero.rotation.x);
      const heightAdjustment = -verticalLookFactor * 2; // Adjust multiplier as needed

      // Set camera height with adjustment
      this.camera.position.y =
        heroPosition.y + cameraInfo.height + heightAdjustment;

      // Calculate target position based on hero position and look direction
      const targetPosition = heroPosition.clone();
      targetPosition.add(lookDirection.clone().multiplyScalar(10)); // Look 10 units ahead in the direction

      // Make the camera look where the player is looking
      this.camera.lookAt(targetPosition);
      
      // Check if hero is on terrain and adjust height if needed
      if (this.terrain && typeof this.terrain.getHeightAt === 'function') {
        try {
          const terrainHeight = this.terrain.getHeightAt(heroPosition.x, heroPosition.z);
          if (terrainHeight > 0 && heroPosition.y < terrainHeight + 1) {
            this.hero.setPosition(heroPosition.x, terrainHeight + 1, heroPosition.z);
          }
        } catch (error) {
          console.warn("Error getting terrain height:", error);
        }
      }
    }

    // Update collision detector
    if (this.collisionDetector && this.camera) {
      this.collisionDetector.update(this.camera);
    }

    // Update enemies
    if (this.enemyManager && this.hero) {
      // Use hero's group position instead of mesh position
      const heroPosition = this.hero.getPosition();
      this.enemyManager.update(deltaTime, heroPosition);

      // Check for collisions between hero and enemies
      const collisions = this.enemyManager.checkCollisions(heroPosition);

      // Handle damage to hero
      for (const collision of collisions) {
        this.hero.takeDamage(collision.damage);
        this.soundManager.playSound("hit");
      }
    }

    // Update skills
    if (this.skillManager && this.enemyManager) {
      this.skillManager.update(deltaTime, this.enemyManager);
    }

    // Handle skill activation
    if (this.hero && this.inputHandler && this.skillManager) {
      // Check for skill keys
      const skillKeys = ["y", "u", "i", "h", "j", "k"];

      for (const key of skillKeys) {
        if (
          this.inputHandler.isKeyPressed(key) &&
          this.hero.cooldowns[key] <= 0
        ) {
          // Use skill
          const skillName = this.hero.skills[key].name;

          // Create skill effect using hero's direction
          const heroPosition = this.hero.getPosition().clone();
          heroPosition.y += 1; // Adjust to center of hero
          const heroDirection = this.hero.getDirection();

          this.skillManager.useSkill(skillName, heroPosition, heroDirection);

          // Play sound
          this.soundManager.playSound(
            skillName.toLowerCase().replace(/\s+/g, "")
          );

          // Set cooldown
          this.hero.cooldowns[key] = this.hero.skills[key].cooldown;
        }
      }
    }

    // Update animations
    if (this.mixers.length > 0) {
      this.mixers.forEach((mixer) => mixer.update(deltaTime));
    }

    // Update effects
    if (this.effects) {
      this.effects.update(deltaTime);
    }
  }

  updateLights(deltaTime) {
    // Skip if lights aren't initialized
    if (!this.lights) return;

    // Update point lights
    if (this.lights.point.length > 0) {
      for (let i = 0; i < this.lights.point.length; i++) {
        const light = this.lights.point[i];

        // Make the light pulse
        const intensity = 0.7 + Math.sin(Date.now() * 0.002 + i) * 0.3;
        light.intensity = intensity;

        // Optionally make the light move
        const angle = Date.now() * 0.0005 + (i * Math.PI) / 2;
        const distance = 30 + Math.sin(Date.now() * 0.001 + i) * 5;

        light.position.x = Math.cos(angle) * distance;
        light.position.z = Math.sin(angle) * distance;

        // Update the helper sphere position
        if (light.userData.helper) {
          light.userData.helper.position.copy(light.position);
        }
      }
    }

    // Update spotlight
    if (this.lights.spot.length > 0) {
      const spotLight = this.lights.spot[0];

      // Make the spotlight move
      const angle = Date.now() * 0.0002;
      const distance = 50;

      spotLight.position.x = Math.cos(angle) * distance;
      spotLight.position.z = Math.sin(angle) * distance;

      // Update the target to always point toward the center
      if (spotLight.target) {
        spotLight.target.position.x = 0;
        spotLight.target.position.z = 0;
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    // Update controls
    this.controls.update();

    // Update game
    this.update(deltaTime);

    // Update shadows only for non-particle objects
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Points) {
        obj.castShadow = false;
        obj.receiveShadow = false;
      }
    });

    // Update shadow map
    if (this.renderer.shadowMap.needsUpdate) {
      this.renderer.shadowMap.needsUpdate = false;
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  
  // Make game instance globally accessible for other components
  window.game = game;

  // Add global keyboard event listener for debugging
  document.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key, "Code:", event.code);
  });
});
