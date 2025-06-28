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
        this.radius = 50; // Joystick radius
        this.knobRadius = 20; // Knob radius
        
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
        
        this.container.appendChild(this.joystickContainer);
        
        // Get references to elements
        this.base = this.joystickContainer.querySelector('.joystick-base');
        this.knob = this.joystickContainer.querySelector('.joystick-knob');
        
        // Add styles
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .virtual-joystick {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 1000;
                pointer-events: auto;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
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
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // Touch events for mobile
        this.base.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this));
        
        // Mouse events for desktop/tablet
        this.base.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        
        // Prevent context menu on long press
        this.base.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleStart(event) {
        event.preventDefault();
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
    }
    
    handleMove(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        
        // Get touch/mouse position
        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        // Calculate distance from center
        const deltaX = clientX - this.centerX;
        const deltaY = clientY - this.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Constrain knob to joystick radius
        const maxDistance = this.radius - this.knobRadius;
        let knobX = deltaX;
        let knobY = deltaY;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(deltaY, deltaX);
            knobX = Math.cos(angle) * maxDistance;
            knobY = Math.sin(angle) * maxDistance;
        }
        
        // Update knob position
        this.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
        
        // Store normalized values (-1 to 1)
        this.deltaX = knobX / maxDistance;
        this.deltaY = knobY / maxDistance;
        
        // Clamp values
        this.deltaX = Math.max(-1, Math.min(1, this.deltaX));
        this.deltaY = Math.max(-1, Math.min(1, this.deltaY));
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
    }
    
    // Get movement input (normalized -1 to 1)
    getInput() {
        return {
            x: this.deltaX,
            y: -this.deltaY, // Invert Y for game coordinates
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
    }
}

export default VirtualJoystick;