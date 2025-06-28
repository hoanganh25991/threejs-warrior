import { config } from './config/config.js';
import VirtualJoystick from './ui/virtual-joystick.js';
import TouchCameraControls from './ui/touch-camera-controls.js';

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
        
        // Initialize virtual joystick for movement
        this.virtualJoystick = new VirtualJoystick();
        
        // Initialize touch camera controls for look direction
        this.touchCameraControls = new TouchCameraControls({
            sensitivity: config.controls.mouse.sensitivity || 1.0
        });
        
        this.detectAndSetupMobileControls();
        
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
        
        // Special handler for space key to debug jumping issues
        document.addEventListener('keydown', (event) => {
            if (event.key === ' ' || event.code === 'Space') {
                console.log('Space key pressed (direct event)');
                this.keys[' '] = true;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (event.key === ' ' || event.code === 'Space') {
                console.log('Space key released (direct event)');
                this.keys[' '] = false;
            }
        });
        
        // Mouse events (simplified - no pointer lock needed)
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    handleKeyDown(event) {
        const key = event.key.toLowerCase();
        
        // Handle all keys including space
        if (key === ' ' || event.code === 'Space') {
            this.keys[' '] = true;
        } else if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }

        // Update debug display
        this.updateKeyDisplay();
        
        // Don't prevent default for all keys to allow multiple key presses
        if (key === ' ' || key === 'w' || key === 'a' || key === 's' || key === 'd') {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        const key = event.key.toLowerCase();
        
        // Handle all keys including space
        if (key === ' ' || event.code === 'Space') {
            this.keys[' '] = false;
        } else if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }

        // Update debug display
        this.updateKeyDisplay();
        
        // Don't prevent default for all keys to allow multiple key presses
        if (key === ' ' || key === 'w' || key === 'a' || key === 's' || key === 'd') {
            event.preventDefault();
        }
    }

    updateKeyDisplay() {
        if (!config.game.debug) {
            return;
        }
        // Create or update key display
        let keyDisplay = document.getElementById('key-display');
        if (!keyDisplay) {
            keyDisplay = document.createElement('div');
            keyDisplay.id = 'key-display';
            keyDisplay.style.position = 'absolute';
            keyDisplay.style.top = '60px';
            keyDisplay.style.left = '20px';
            keyDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            keyDisplay.style.color = 'white';
            keyDisplay.style.padding = '10px';
            keyDisplay.style.borderRadius = '5px';
            keyDisplay.style.fontFamily = 'Arial, sans-serif';
            keyDisplay.style.zIndex = '1000';
            document.body.appendChild(keyDisplay);
        }

        // Show currently pressed keys
        const pressedKeys = Object.entries(this.keys)
            .filter(([_, isPressed]) => isPressed)
            .map(([key, _]) => key.toUpperCase())
            .join(', ');

        keyDisplay.textContent = `Pressed Keys: ${pressedKeys || 'None'}`;
    }
    
    // Mouse move handling is now handled by TouchCameraControls
    // Keeping this method for compatibility but it's no longer used for camera control
    
    handleMouseDown(event) {
        this.mouse.buttons[event.button] = true;
        // Note: Camera control is now handled by TouchCameraControls
    }
    
    handleMouseUp(event) {
        this.mouse.buttons[event.button] = false;
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
    
    // Get look direction from E and Q keys or touch/mouse drag
    getLookDirection() {
        let lookX = 0;
        let lookY = 0;
        
        // Handle E and Q keys for simple left/right looking
        if (this.keys['e']) {
            lookX += 2; // Look right
        }
        if (this.keys['q']) {
            lookX -= 2; // Look left
        }
        
        // Add touch/mouse camera movement
        const cameraMovement = this.touchCameraControls.getMovementDelta();
        lookX += cameraMovement.x;
        lookY += cameraMovement.y;
        
        return {
            x: lookX,
            y: lookY
        };
    }
    
    // Reset movement values after they've been used
    resetMovement() {
        this.mouse.movementX = 0;
        this.mouse.movementY = 0;
        // Note: Touch camera controls handle their own reset internally
    }
    
    // Detect mobile/tablet and setup controls accordingly
    detectAndSetupMobileControls() {
        // Always show virtual joystick on all devices for consistency
        // Users can choose to use keyboard or joystick
        this.virtualJoystick.setVisible(true);
    }
    
    // Get movement input combining keyboard and virtual joystick
    getMovementInput() {
        let x = 0;
        let y = 0;
        
        // Keyboard input
        if (this.keys['w']) y -= 1; // W moves forward (negative Y)
        if (this.keys['s']) y += 1; // S moves backward (positive Y)
        if (this.keys['a']) x -= 1;
        if (this.keys['d']) x += 1;
        
        // Virtual joystick input (can be used with or without keyboard)
        const joystickInput = this.virtualJoystick.getInput();
        if (joystickInput.magnitude > 0.1) {
            // Allow joystick to work independently or combined with keyboard
            if (x === 0 && y === 0) {
                // Use joystick exclusively when no keyboard input
                x = joystickInput.x;
                y = joystickInput.y;
            } else {
                // Blend joystick with keyboard input for enhanced control
                x = Math.max(-1, Math.min(1, x + joystickInput.x * 0.5));
                y = Math.max(-1, Math.min(1, y + joystickInput.y * 0.5));
            }
        }
        
        // Normalize diagonal movement
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude > 1) {
            x /= magnitude;
            y /= magnitude;
        }
        
        return { x, y, magnitude };
    }
    
    // Check if virtual joystick is being used
    isUsingVirtualJoystick() {
        return this.virtualJoystick.isInUse();
    }
    
    // Check if touch camera is being used
    isUsingTouchCamera() {
        return this.touchCameraControls.isDraggingCamera();
    }
    
    // Get current camera rotation from touch controls
    getCameraRotation() {
        return this.touchCameraControls.getRotation();
    }
    
    // Reset camera rotation
    resetCameraRotation() {
        this.touchCameraControls.resetRotation();
    }
    
    // Enable/disable touch camera controls
    setTouchCameraEnabled(enabled) {
        this.touchCameraControls.setEnabled(enabled);
    }
    
    // Update camera sensitivity
    setCameraSensitivity(sensitivity) {
        this.touchCameraControls.setSensitivity(sensitivity);
    }
}

export default InputHandler;