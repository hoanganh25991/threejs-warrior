import { config } from '../config/config.js';

export class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            movementX: 0,
            movementY: 0,
            buttons: [false, false, false]
        };
        this.isPointerLocked = false;
        this.mouseSensitivity = 0.5; // Adjust this value to change mouse sensitivity
        
        // Initialize key states
        for (const action in config.controls.keyboard) {
            const key = config.controls.keyboard[action];
            this.keys[key] = false;
        }
        
        // Add E and Q keys for looking left and right
        this.keys['e'] = false;
        this.keys['q'] = false;
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse events
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.handlePointerLockChange.bind(this));
        
        // Add click event to canvas to request pointer lock
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('click', this.requestPointerLock.bind(this));
            
            // Add instructions for pointer lock
            const instructions = document.createElement('div');
            instructions.id = 'pointer-lock-instructions';
            instructions.innerHTML = 'Click to capture mouse and control look direction<br>Press ESC to release mouse';
            instructions.style.position = 'absolute';
            instructions.style.top = '10px';
            instructions.style.width = '100%';
            instructions.style.textAlign = 'center';
            instructions.style.color = 'white';
            instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            instructions.style.padding = '10px';
            instructions.style.zIndex = '100';
            instructions.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(instructions);
            
            // Hide instructions when pointer is locked
            document.addEventListener('pointerlockchange', () => {
                if (document.pointerLockElement === canvas) {
                    instructions.style.display = 'none';
                } else {
                    instructions.style.display = 'block';
                }
            });
        }
    }
    
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
            event.preventDefault();
        }
    }
    
    handleMouseMove(event) {
        if (this.isPointerLocked) {
            // Store raw movement values
            this.mouse.movementX = event.movementX * this.mouseSensitivity;
            this.mouse.movementY = event.movementY * this.mouseSensitivity;
            
            // Accumulate for total position
            this.mouse.x += this.mouse.movementX;
            this.mouse.y += this.mouse.movementY;
        } else {
            // Use clientX and clientY for normal mouse
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            this.mouse.movementX = 0;
            this.mouse.movementY = 0;
        }
    }
    
    handleMouseDown(event) {
        this.mouse.buttons[event.button] = true;
        
        // Request pointer lock on click if not already locked
        if (!this.isPointerLocked) {
            this.requestPointerLock();
        }
        
        event.preventDefault();
    }
    
    handleMouseUp(event) {
        this.mouse.buttons[event.button] = false;
        event.preventDefault();
    }
    
    requestPointerLock() {
        const canvas = document.getElementById('game-canvas');
        if (canvas && !this.isPointerLocked) {
            canvas.requestPointerLock();
        }
    }
    
    handlePointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === document.getElementById('game-canvas');
    }
    
    isKeyPressed(key) {
        return this.keys[key] === true;
    }
    
    isMouseButtonPressed(button) {
        return this.mouse.buttons[button] === true;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    getMouseMovement() {
        // Return mouse movement without resetting
        return { 
            x: this.mouse.movementX, 
            y: this.mouse.movementY 
        };
    }
    
    // Get look direction from E and Q keys or mouse
    getLookDirection() {
        let lookX = 0;
        
        // Handle E and Q keys for simple left/right looking
        if (this.keys['e']) {
            lookX += 2; // Look right
        }
        if (this.keys['q']) {
            lookX -= 2; // Look left
        }
        
        // Add mouse movement if pointer is locked
        if (this.isPointerLocked) {
            lookX += this.mouse.movementX;
        }
        
        return {
            x: lookX,
            y: this.isPointerLocked ? this.mouse.movementY : 0
        };
    }
    
    // Reset movement values after they've been used
    resetMovement() {
        this.mouse.movementX = 0;
        this.mouse.movementY = 0;
    }
}

export default InputHandler;