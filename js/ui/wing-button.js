/**
 * Wing Button Component
 * Provides a touch-friendly button for flying, mimicking the space key functionality
 */
export class WingButton {
    constructor(inputHandler) {
        this.inputHandler = inputHandler;
        this.isPressed = false;
        this.button = null;
        this.touchStartTime = 0;
        
        this.init();
    }
    
    init() {
        this.createButton();
        this.setupEventListeners();
        this.addStyles();
    }
    
    createButton() {
        // Create the wing button element
        this.button = document.createElement('div');
        this.button.className = 'wing-button';
        this.button.innerHTML = `
            <div class="wing-button-inner">
                <span class="wing-icon">🪶</span>
                <div class="wing-glow"></div>
            </div>
        `;
        
        // Add to body (will be positioned absolutely)
        document.body.appendChild(this.button);
        
        console.log('Wing button created and added to DOM');
    }
    
    setupEventListeners() {
        // Touch events
        this.button.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.button.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.button.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events for desktop testing
        this.button.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.button.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.button.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // Prevent context menu
        this.button.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.touchStartTime = Date.now();
        this.setPressed(true);
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        console.log('Wing button: Touch start - Flying activated');
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.setPressed(false);
        
        console.log('Wing button: Touch end - Flying deactivated');
    }
    
    handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.setPressed(true);
        console.log('Wing button: Mouse down - Flying activated');
    }
    
    handleMouseUp(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.setPressed(false);
        console.log('Wing button: Mouse up - Flying deactivated');
    }
    
    setPressed(pressed) {
        this.isPressed = pressed;
        
        // Update visual state
        if (pressed) {
            this.button.classList.add('pressed');
            this.button.classList.add('flying');
        } else {
            this.button.classList.remove('pressed');
            // Keep flying class for a moment to show we're still airborne
            setTimeout(() => {
                this.button.classList.remove('flying');
            }, 100);
        }
        
        // Simulate space key press/release in the input handler
        if (this.inputHandler && this.inputHandler.keys) {
            this.inputHandler.keys[' '] = pressed;
            
            // Trigger the same debug updates as keyboard
            if (this.inputHandler.updateKeyDisplay) {
                this.inputHandler.updateKeyDisplay();
            }
        }
    }
    
    // Check if the wing button is currently pressed
    isFlying() {
        return this.isPressed;
    }
    
    // Show/hide the button
    setVisible(visible) {
        if (this.button) {
            this.button.style.display = visible ? 'block' : 'none';
        }
    }
    
    // Enable/disable the button
    setEnabled(enabled) {
        if (this.button) {
            this.button.classList.toggle('disabled', !enabled);
            this.button.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .wing-button {
                position: fixed;
                right: 20px;
                bottom: 140px;
                width: 80px;
                height: 80px;
                z-index: 1000;
                opacity: 0.8;
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                touch-action: manipulation;
            }
            
            .wing-button-inner {
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #4a90e2 0%, #7b68ee 50%, #9370db 100%);
                border: 3px solid #fff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.15s ease;
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.3),
                    0 2px 8px rgba(74, 144, 226, 0.4),
                    inset 0 2px 0 rgba(255, 255, 255, 0.3);
            }
            
            .wing-icon {
                font-size: 32px;
                color: #fff;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                z-index: 2;
                position: relative;
                animation: float 2s ease-in-out infinite;
            }
            
            .wing-glow {
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                background: radial-gradient(circle, rgba(74, 144, 226, 0.4) 0%, transparent 70%);
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .wing-button:hover .wing-button-inner {
                transform: scale(1.05);
                box-shadow: 
                    0 6px 20px rgba(0, 0, 0, 0.4),
                    0 4px 12px rgba(74, 144, 226, 0.6),
                    inset 0 2px 0 rgba(255, 255, 255, 0.4);
            }
            
            .wing-button:hover .wing-glow {
                opacity: 1;
            }
            
            .wing-button.pressed .wing-button-inner {
                transform: scale(0.95);
                background: linear-gradient(135deg, #3a7bc8 0%, #6b58d4 50%, #8360c7 100%);
                box-shadow: 
                    0 2px 8px rgba(0, 0, 0, 0.4),
                    0 1px 4px rgba(74, 144, 226, 0.8),
                    inset 0 3px 8px rgba(0, 0, 0, 0.3);
            }
            
            .wing-button.pressed .wing-glow {
                opacity: 1;
                background: radial-gradient(circle, rgba(74, 144, 226, 0.8) 0%, transparent 70%);
            }
            
            .wing-button.pressed .wing-icon {
                animation: flap 0.2s ease-in-out infinite alternate;
            }
            
            .wing-button.disabled {
                opacity: 0.5;
                pointer-events: none;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
            }
            
            @keyframes flap {
                0% { transform: scale(1) rotate(-2deg); }
                100% { transform: scale(1.1) rotate(2deg); }
            }
            
            /* Responsive design */
            @media (max-width: 768px) {
                .wing-button {
                    right: 15px;
                    bottom: 120px;
                    width: 70px;
                    height: 70px;
                }
                
                .wing-icon {
                    font-size: 28px;
                }
            }
            
            @media (max-width: 480px) {
                .wing-button {
                    right: 10px;
                    bottom: 110px;
                    width: 60px;
                    height: 60px;
                }
                
                .wing-icon {
                    font-size: 24px;
                }
            }
            
            /* Landscape mobile adjustments */
            @media screen and (max-height: 500px) and (orientation: landscape) {
                .wing-button {
                    right: 10px;
                    bottom: 80px;
                    width: 55px;
                    height: 55px;
                }
                
                .wing-icon {
                    font-size: 22px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Cleanup method
    destroy() {
        if (this.button && this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
    }
}

export default WingButton;