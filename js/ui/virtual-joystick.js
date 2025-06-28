export class VirtualJoystick {
    constructor(container) {
        this.container = container || document.body;
        this.isActive = false;
        this.centerX = 0;
        this.centerY = 0;
        this.knobX = 0;
        this.knobY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.radius = 75; // Joystick radius (1.5x bigger: 50 * 1.5 = 75)
        this.knobRadius = 30; // Knob radius (1.5x bigger: 20 * 1.5 = 30)
        
        this.init();
    }
    
    init() {
        this.createJoystick();
        this.setupEventListeners();
    }
    
    createJoystick() {
        // Create main joystick container
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.className = 'virtual-joystick';
        this.joystickContainer.innerHTML = `
            <div class="joystick-base">
                <div class="joystick-knob"></div>
            </div>
        `;
        
        // Force append to body to avoid any CSS inheritance issues
        document.body.appendChild(this.joystickContainer);
        
        // Get references to elements
        this.base = this.joystickContainer.querySelector('.joystick-base');
        this.knob = this.joystickContainer.querySelector('.joystick-knob');
        
        // Add styles
        this.addStyles();
        
        console.log('Virtual joystick created and added to DOM');
        console.log('Container element:', this.joystickContainer);
        console.log('Base element:', this.base);
        console.log('Knob element:', this.knob);
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .virtual-joystick {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 9999 !important;
                pointer-events: auto !important;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                -webkit-touch-callout: none;
                touch-action: none;
                isolation: isolate;
            }
            
            .joystick-base {
                width: ${this.radius * 2}px;
                height: ${this.radius * 2}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                border: 3px solid rgba(255,255,255,0.3);
                position: relative;
                box-shadow: 
                    0 0 20px rgba(0,0,0,0.5),
                    inset 0 0 20px rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                transition: all 0.2s ease;
                pointer-events: auto;
                cursor: pointer;
            }
            
            .joystick-base.active {
                background: radial-gradient(circle, rgba(248,208,0,0.2) 0%, rgba(248,208,0,0.1) 100%);
                border-color: rgba(248,208,0,0.5);
                box-shadow: 
                    0 0 30px rgba(248,208,0,0.3),
                    inset 0 0 20px rgba(255,255,255,0.2);
            }
            
            .joystick-knob {
                width: ${this.knobRadius * 2}px;
                height: ${this.knobRadius * 2}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.9) 100%);
                border: 2px solid rgba(255,255,255,0.9);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 
                    0 0 15px rgba(0,0,0,0.4),
                    inset 0 0 10px rgba(255,255,255,0.3);
                transition: all 0.1s ease;
                cursor: pointer;
                pointer-events: none;
            }
            
            .joystick-knob.active {
                background: radial-gradient(circle, rgba(248,208,0,0.9) 0%, rgba(255,165,0,0.9) 100%);
                border-color: rgba(248,208,0,1);
                box-shadow: 
                    0 0 20px rgba(248,208,0,0.6),
                    inset 0 0 10px rgba(255,255,255,0.4);
                transform: translate(-50%, -50%) scale(1.1);
            }
            
            /* Tablet optimizations */
            @media screen and (max-width: 1024px) {
                .virtual-joystick {
                    bottom: 30px;
                    left: 30px;
                }
                
                .joystick-base {
                    width: ${this.radius * 2.2}px;
                    height: ${this.radius * 2.2}px;
                }
                
                .joystick-knob {
                    width: ${this.knobRadius * 2.2}px;
                    height: ${this.knobRadius * 2.2}px;
                }
            }
            
            /* Mobile optimizations */
            @media screen and (max-width: 768px) {
                .virtual-joystick {
                    bottom: 25px;
                    left: 25px;
                }
                
                .joystick-base {
                    width: ${this.radius * 1.8}px;
                    height: ${this.radius * 1.8}px;
                }
                
                .joystick-knob {
                    width: ${this.knobRadius * 1.8}px;
                    height: ${this.knobRadius * 1.8}px;
                }
            }
            
            /* Always visible but with different opacity for desktop */
            @media screen and (min-width: 1025px) and (hover: hover) and (pointer: fine) {
                .virtual-joystick {
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                }
                
                .virtual-joystick:hover {
                    opacity: 1;
                }
            }
            
            /* Ensure good visibility on all devices */
            .virtual-joystick {
                opacity: 0.9;
            }
        `;
        
        // Check if styles already exist to avoid duplicates
        if (!document.querySelector('#virtual-joystick-styles')) {
            style.id = 'virtual-joystick-styles';
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        // Add event listeners to the entire joystick container, not just the base
        // This makes it easier to interact with the joystick
        
        // Touch events for mobile
        this.joystickContainer.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this));
        document.addEventListener('touchcancel', this.handleEnd.bind(this));
        
        // Mouse events for desktop/tablet
        this.joystickContainer.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        
        // Prevent default behaviors
        this.joystickContainer.addEventListener('contextmenu', (e) => e.preventDefault());
        this.joystickContainer.addEventListener('selectstart', (e) => e.preventDefault());
        this.joystickContainer.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Add visual feedback for debugging (can be removed in production)
        this.joystickContainer.addEventListener('touchstart', () => {
            console.log('Virtual joystick: touch interaction started');
        });
        this.joystickContainer.addEventListener('mousedown', () => {
            console.log('Virtual joystick: mouse interaction started');
        });
    }
    
    handleStart(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.isActive = true;
        
        // Get base center position
        const rect = this.base.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        
        // Add active classes
        this.base.classList.add('active');
        this.knob.classList.add('active');
        
        // Handle initial position
        this.handleMove(event);
        
        console.log('Virtual joystick activated');
    }
    
    handleMove(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        // Get touch/mouse position
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.clientX !== undefined) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            console.warn('Virtual joystick: No valid input coordinates');
            return;
        }
        
        // Calculate distance from center
        const deltaX = clientX - this.centerX;
        const deltaY = clientY - this.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Allow dragging outside for easier control, but limit knob visual position
        const maxDistance = this.radius - this.knobRadius;
        const maxInputDistance = this.radius * 1.5; // Allow 1.5x radius for input sensitivity
        
        // Visual knob position (constrained to base)
        let knobX = deltaX;
        let knobY = deltaY;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            knobX = Math.cos(angle) * maxDistance;
            knobY = Math.sin(angle) * maxDistance;
        }
        
        // Update knob position (visually constrained)
        this.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        
        // Input values (can extend beyond visual boundary for easier control)
        let inputX = deltaX;
        let inputY = deltaY;
        
        if (distance > maxInputDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            inputX = Math.cos(angle) * maxInputDistance;
            inputY = Math.sin(angle) * maxInputDistance;
        }
        
        // Store normalized values (-1 to 1) based on extended input range
        this.deltaX = inputX / maxInputDistance;
        this.deltaY = inputY / maxInputDistance;
        
        // Clamp values
        this.deltaX = Math.max(-1, Math.min(1, this.deltaX));
        this.deltaY = Math.max(-1, Math.min(1, this.deltaY));
        
        // Optional debug output for significant movements
        // if (Math.abs(this.deltaX) > 0.5 || Math.abs(this.deltaY) > 0.5) {
        //     console.log('Joystick input:', this.deltaX.toFixed(2), this.deltaY.toFixed(2));
        // }
    }
    
    handleEnd(event) {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Remove active classes
        this.base.classList.remove('active');
        this.knob.classList.remove('active');
        
        // Reset knob position with smooth animation
        this.knob.style.transform = 'translate(-50%, -50%)';
        
        // Reset values
        this.deltaX = 0;
        this.deltaY = 0;
        
        console.log('Virtual joystick deactivated');
    }
    
    // Get movement input (normalized -1 to 1)
    getInput() {
        return {
            x: this.deltaX,
            y: this.deltaY, // Drag UP (negative deltaY) = Forward (negative Y), Drag DOWN (positive deltaY) = Backward (positive Y)
            magnitude: Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY)
        };
    }
    
    // Check if joystick is being used
    isInUse() {
        return this.isActive;
    }
    
    // Destroy the joystick
    destroy() {
        if (this.joystickContainer && this.joystickContainer.parentNode) {
            this.joystickContainer.parentNode.removeChild(this.joystickContainer);
        }
    }
    
    // Show/hide the joystick
    setVisible(visible) {
        if (this.joystickContainer) {
            this.joystickContainer.style.display = visible ? 'block' : 'none';
        }
        console.log('Virtual joystick visibility set to:', visible);
    }
    
    // Debug method to check joystick status
    getDebugInfo() {
        const computedStyle = this.joystickContainer ? getComputedStyle(this.joystickContainer) : null;
        return {
            isVisible: this.joystickContainer && this.joystickContainer.style.display !== 'none',
            isActive: this.isActive,
            containerExists: !!this.joystickContainer,
            baseExists: !!this.base,
            knobExists: !!this.knob,
            position: this.joystickContainer ? this.joystickContainer.getBoundingClientRect() : null,
            computedPointerEvents: computedStyle ? computedStyle.pointerEvents : null,
            computedZIndex: computedStyle ? computedStyle.zIndex : null,
            computedDisplay: computedStyle ? computedStyle.display : null
        };
    }
    
    // Force enable method for debugging
    forceEnable() {
        if (this.joystickContainer) {
            this.joystickContainer.style.pointerEvents = 'auto';
            this.joystickContainer.style.zIndex = '9999';
            this.joystickContainer.style.display = 'block';
            this.joystickContainer.style.position = 'fixed';
            console.log('Joystick force enabled');
        }
    }
}

export default VirtualJoystick;