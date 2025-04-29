import { config } from '../config/config.js';

export class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            buttons: [false, false, false]
        };
        this.isPointerLocked = false;
        
        // Initialize key states
        for (const action in config.controls.keyboard) {
            const key = config.controls.keyboard[action];
            this.keys[key] = false;
        }
        
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
            // Use movementX and movementY for pointer lock
            this.mouse.x += event.movementX;
            this.mouse.y += event.movementY;
        } else {
            // Use clientX and clientY for normal mouse
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }
    }
    
    handleMouseDown(event) {
        this.mouse.buttons[event.button] = true;
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
        // Return mouse movement and reset
        const movement = { x: this.mouse.x, y: this.mouse.y };
        
        // Only reset if pointer is locked
        if (this.isPointerLocked) {
            this.mouse.x = 0;
            this.mouse.y = 0;
        }
        
        return movement;
    }
}

export default InputHandler;