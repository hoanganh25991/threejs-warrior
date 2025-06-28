/**
 * Touch Camera Controls
 * 
 * Provides intuitive touch-based camera orbit controls for mobile and desktop.
 * Allows users to drag anywhere on the screen to control the camera rotation.
 */
export class TouchCameraControls {
    constructor(options = {}) {
        this.isEnabled = true;
        this.isDragging = false;
        this.sensitivity = options.sensitivity || 1.0;
        this.minDistance = options.minDistance || 5; // Minimum drag distance to start camera control
        
        // Current rotation values
        this.rotationX = 0; // Up/down rotation
        this.rotationY = 0; // Left/right rotation
        
        // Touch/mouse tracking
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        
        // Reference to virtual joystick area to prevent conflicts
        this.joystickArea = null;
        
        this.setupEventListeners();
        this.createTouchIndicator();
    }
    
    setupEventListeners() {
        // Canvas or document level events
        const canvas = document.getElementById('game-canvas') || document;
        
        // Touch events
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events (for desktop)
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    createTouchIndicator() {
        // Create a visual indicator for touch camera controls
        const indicator = document.createElement('div');
        indicator.id = 'touch-camera-indicator';
        indicator.innerHTML = `
            <div class="indicator-content">
                <div>Drag to look around</div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #touch-camera-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 10px 20px;
                background-color:transparent;
                color: #fff;
                border: 2px solid #6b3e1c;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                z-index: 1000;
                opacity: 0.5;
                width: 200px;
                text-align: center;
                transition: all 0.3s;
                pointer-events: auto;
            }
            
            #touch-camera-indicator.active {
                opacity: 1;
            }
            
            #touch-camera-indicator.active {
                background: rgba(248, 208, 0, 0.8);
                color: black;
                border-color: rgba(248, 208, 0, 0.6);
            }
            
            /* Hide on very small screens to avoid clutter */
            @media screen and (max-width: 480px) {
                #touch-camera-indicator {
                    opacity: 0.5;
                    transform: scale(0.8);
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(indicator);
        
        this.indicator = indicator;
    }
    
    isInJoystickArea(x, y) {
        // Check if touch/click is in virtual joystick area
        const joystick = document.querySelector('.virtual-joystick');
        if (!joystick) return false;
        
        const rect = joystick.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }
    
    handleTouchStart(event) {
        if (!this.isEnabled) return;
        
        // Only handle single finger touch
        if (event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        
        // Don't interfere with virtual joystick
        if (this.isInJoystickArea(touch.clientX, touch.clientY)) return;
        
        this.startDrag(touch.clientX, touch.clientY);
        event.preventDefault();
    }
    
    handleTouchMove(event) {
        if (!this.isEnabled || !this.isDragging) return;
        
        if (event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        this.updateDrag(touch.clientX, touch.clientY);
        event.preventDefault();
    }
    
    handleTouchEnd(event) {
        if (!this.isEnabled) return;
        this.endDrag();
    }
    
    handleMouseDown(event) {
        if (!this.isEnabled) return;
        
        // Only handle left mouse button
        if (event.button !== 0) return;
        
        // Don't interfere with virtual joystick
        if (this.isInJoystickArea(event.clientX, event.clientY)) return;
        
        this.startDrag(event.clientX, event.clientY);
        event.preventDefault();
    }
    
    handleMouseMove(event) {
        if (!this.isEnabled || !this.isDragging) return;
        this.updateDrag(event.clientX, event.clientY);
    }
    
    handleMouseUp(event) {
        if (!this.isEnabled) return;
        this.endDrag();
    }
    
    startDrag(x, y) {
        this.isDragging = true;
        this.startX = x;
        this.startY = y;
        this.lastX = x;
        this.lastY = y;
        this.deltaX = 0;
        this.deltaY = 0;
        
        // Visual feedback
        if (this.indicator) {
            this.indicator.classList.add('active');
        }
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
    }
    
    updateDrag(x, y) {
        if (!this.isDragging) return;
        
        // Calculate movement delta
        this.deltaX = (x - this.lastX) * this.sensitivity;
        this.deltaY = (y - this.lastY) * this.sensitivity;
        
        // Update rotation values
        this.rotationY += this.deltaX * 0.01; // Horizontal rotation
        this.rotationX += this.deltaY * 0.01; // Vertical rotation
        
        // Constrain vertical rotation
        this.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotationX));
        
        // Update last position
        this.lastX = x;
        this.lastY = y;
    }
    
    endDrag() {
        this.isDragging = false;
        this.deltaX = 0;
        this.deltaY = 0;
        
        // Remove visual feedback
        if (this.indicator) {
            this.indicator.classList.remove('active');
        }
        
        // Reset cursor
        document.body.style.cursor = '';
    }
    
    // Get current camera rotation values
    getRotation() {
        return {
            x: this.rotationX,
            y: this.rotationY
        };
    }
    
    // Get camera movement delta (for this frame)
    getMovementDelta() {
        return {
            x: this.deltaX,
            y: this.deltaY
        };
    }
    
    // Reset camera rotation
    resetRotation() {
        this.rotationX = 0;
        this.rotationY = 0;
    }
    
    // Enable/disable controls
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled && this.isDragging) {
            this.endDrag();
        }
    }
    
    // Update sensitivity
    setSensitivity(sensitivity) {
        this.sensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
    }
    
    // Check if currently dragging
    isDraggingCamera() {
        return this.isDragging;
    }
    
    // Destroy the controls
    destroy() {
        if (this.indicator && this.indicator.parentNode) {
            this.indicator.parentNode.removeChild(this.indicator);
        }
        
        // Remove event listeners would need references to the bound functions
        // For simplicity, we'll leave them (they'll check isEnabled)
        this.setEnabled(false);
    }
}

export default TouchCameraControls;