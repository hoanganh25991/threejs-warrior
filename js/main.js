// Import Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Import game modules
import { config } from './config/config.js';
import { Hero } from './characters/hero.js';
import { EnemyManager } from './characters/enemyManager.js';
import { SkillManager } from './skills/skillManager.js';
import { InputHandler } from './utils/input.js';
import { World } from './utils/world.js';
import { SoundManager } from './utils/soundManager.js';

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
            canvas: document.getElementById('game-canvas'),
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        // Add lights
        this.addLights();
        
        // Initialize world
        this.world = new World(this.scene);
        
        // Initialize sound manager
        this.soundManager = new SoundManager();
        
        // Add controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Add hero selection event listeners
        const heroButtons = document.querySelectorAll('.select-hero-btn');
        heroButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                this.selectedHero = event.target.getAttribute('data-hero');
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
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            if (show) {
                loadingScreen.classList.remove('hidden');
            } else {
                loadingScreen.classList.add('hidden');
            }
        }
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        
        // Set up shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        
        this.scene.add(directionalLight);
    }
    
    startGame() {
        // Hide hero selection screen
        document.getElementById('hero-selection').classList.add('hidden');
        
        // Show game UI
        document.getElementById('game-ui').classList.remove('hidden');
        
        // Initialize input handler
        this.inputHandler = new InputHandler();
        
        // Initialize skill manager
        this.skillManager = new SkillManager(this.scene);
        
        // Initialize enemy manager
        this.enemyManager = new EnemyManager(this.scene);
        
        // Create hero
        this.hero = new Hero(this.scene, this.selectedHero);
        
        // Start background music
        this.soundManager.playMusic();
        
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
        
        // Update world
        if (this.world) {
            this.world.update(deltaTime);
        }
        
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
            
            // Set the camera position to match the hero's position (first-person view)
            // Position the camera at the hero's eye level
            const eyeHeight = 1.7; // Approximate eye height
            this.camera.position.copy(heroPosition);
            this.camera.position.y += eyeHeight;
            
            // Set the camera's rotation to match the hero's rotation
            this.camera.rotation.set(heroRotation.x, heroRotation.y, 0, 'YXZ');
            
            // Update the camera's direction to match the hero's look direction
            const lookDirection = this.hero.getDirection();
            const lookTarget = new THREE.Vector3().copy(this.camera.position).add(lookDirection);
            this.camera.lookAt(lookTarget);
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
                this.soundManager.playSound('hit');
            }
        }
        
        // Update skills
        if (this.skillManager && this.enemyManager) {
            this.skillManager.update(deltaTime, this.enemyManager);
        }
        
        // Handle skill activation
        if (this.hero && this.inputHandler && this.skillManager) {
            // Check for skill keys
            const skillKeys = ['y', 'u', 'i', 'h', 'j', 'k'];
            
            for (const key of skillKeys) {
                if (this.inputHandler.isKeyPressed(key) && this.hero.cooldowns[key] <= 0) {
                    // Use skill
                    const skillName = this.hero.skills[key].name;
                    
                    // Create skill effect using hero's direction
                    const heroPosition = this.hero.getPosition().clone();
                    heroPosition.y += 1; // Adjust to center of hero
                    const heroDirection = this.hero.getDirection();
                    
                    this.skillManager.useSkill(skillName, heroPosition, heroDirection);
                    
                    // Play sound
                    this.soundManager.playSound(skillName.toLowerCase().replace(/\s+/g, ''));
                    
                    // Set cooldown
                    this.hero.cooldowns[key] = this.hero.skills[key].cooldown;
                }
            }
        }
        
        // Update animations
        if (this.mixers.length > 0) {
            this.mixers.forEach(mixer => mixer.update(deltaTime));
        }
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const deltaTime = this.clock.getDelta();
        
        // Update controls
        this.controls.update();
        
        // Update game
        this.update(deltaTime);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});