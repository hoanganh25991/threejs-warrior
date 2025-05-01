/**
 * Mouse Capture Manager
 * 
 * A centralized system for managing mouse capture state across different UI components.
 * This ensures consistent behavior when opening/closing UI elements that need to disable
 * mouse capture for camera control.
 */
export default class MouseCaptureManager {
    constructor(inputHandler) {
        this.inputHandler = inputHandler;
        this.toggleButton = document.getElementById('toggle-mouse-capture');
        this.toggleIcon = this.toggleButton ? this.toggleButton.querySelector('.toggle-icon') : null;
        this.toggleText = this.toggleButton ? this.toggleButton.querySelector('.toggle-text') : null;
        
        // Track which UI components have requested mouse capture to be disabled
        this.disableRequests = new Set();
        
        // Initialize toggle button
        this.initToggleButton();
        
        // Update button state initially
        this.updateToggleButtonState();
    }
    
    initToggleButton() {
        if (!this.toggleButton) return;
        
        this.toggleButton.addEventListener('click', (event) => {
            // Prevent the click from propagating to the canvas
            event.stopPropagation();
            
            this.toggleMouseCapture();
        });
        
        // Prevent pointer lock when clicking on the toggle button
        this.toggleButton.addEventListener('mousedown', (event) => {
            event.stopPropagation();
        });
    }
    
    toggleMouseCapture() {
        if (!this.inputHandler) return;
        
        // Toggle the mouse capture state
        this.inputHandler.isMouseCaptured = !this.inputHandler.isMouseCaptured;
        
        // Update the button state
        this.updateToggleButtonState();
        
        // If enabling mouse capture, request pointer lock
        if (this.inputHandler.isMouseCaptured) {
            this.inputHandler.requestPointerLock();
        } 
        // If disabling, exit pointer lock
        else if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        console.log(`Mouse capture ${this.inputHandler.isMouseCaptured ? 'enabled' : 'disabled'}`);
    }
    
    updateToggleButtonState() {
        if (!this.toggleButton) return;
        
        const isActive = this.inputHandler && this.inputHandler.isMouseCaptured;
        
        // Update button classes
        this.toggleButton.classList.remove('active', 'inactive');
        this.toggleButton.classList.add(isActive ? 'active' : 'inactive');
        
        // Update icon and text
        if (this.toggleIcon) {
            this.toggleIcon.textContent = isActive ? '🔒' : '🔓';
        }
        
        if (this.toggleText) {
            this.toggleText.textContent = isActive ? 'Mouse Locked' : 'Mouse Free';
        }
    }
    
    /**
     * Disable mouse capture for a specific UI component
     * @param {string} requesterId - Unique identifier for the UI component
     */
    disableMouseCapture(requesterId) {
        if (!this.inputHandler) return;
        
        // Store the original state if this is the first request
        if (this.disableRequests.size === 0) {
            this.originalMouseCaptured = this.inputHandler.isMouseCaptured;
        }
        
        // Add this requester to the set
        this.disableRequests.add(requesterId);
        
        // Disable mouse capture
        this.inputHandler.isMouseCaptured = false;
        
        // Exit pointer lock if active
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Update button state
        this.updateToggleButtonState();
        
        console.log(`Mouse capture disabled by ${requesterId}`);
    }
    
    /**
     * Re-enable mouse capture for a specific UI component
     * @param {string} requesterId - Unique identifier for the UI component
     */
    enableMouseCapture(requesterId) {
        if (!this.inputHandler) return;
        
        // Remove this requester from the set
        this.disableRequests.delete(requesterId);
        
        // Only re-enable mouse capture if no other components are requesting it to be disabled
        if (this.disableRequests.size === 0) {
            // Restore to original state
            this.inputHandler.isMouseCaptured = this.originalMouseCaptured || false;
            
            // Request pointer lock if mouse capture is enabled
            if (this.inputHandler.isMouseCaptured) {
                this.inputHandler.requestPointerLock();
            }
            
            // Update button state
            this.updateToggleButtonState();
            
            console.log(`Mouse capture re-enabled (no more active requests)`);
        } else {
            console.log(`Mouse capture still disabled by ${this.disableRequests.size} components`);
        }
    }
    
    /**
     * Check if mouse capture is currently enabled
     * @returns {boolean} - Whether mouse capture is enabled
     */
    isMouseCaptureEnabled() {
        return this.inputHandler && this.inputHandler.isMouseCaptured;
    }
}