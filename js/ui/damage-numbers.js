import * as THREE from 'three';

export default class DamageNumbers {
    constructor(scene) {
        this.scene = scene;
        this.damageNumbers = [];
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = 256;
        this.canvas.height = 256;
    }

    /**
     * Create a damage number at the specified position
     * @param {THREE.Vector3} position - Position to display the damage number
     * @param {Number} damage - Amount of damage to display
     * @param {String} type - Type of damage (physical, magic, fire, ice, etc.)
     */
    createDamageNumber(position, damage, type = 'physical') {
        // Round damage to nearest integer
        const damageValue = Math.round(damage);
        
        // Skip if damage is 0
        if (damageValue <= 0) return;
        
        // Get color based on damage type
        const color = this.getDamageTypeColor(type);
        
        // Create canvas texture with damage number
        const texture = this.createDamageTexture(damageValue, color);
        
        // Create sprite with the texture
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.position.y += 1.5; // Position above enemy
        sprite.scale.set(1, 1, 1);
        
        this.scene.add(sprite);
        
        // Add to damage numbers array
        this.damageNumbers.push({
            sprite,
            createdAt: Date.now(),
            lifetime: 1.0, // 1 second lifetime
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5, // Small random x movement
                1.5 + Math.random() * 0.5,   // Upward movement
                (Math.random() - 0.5) * 0.5  // Small random z movement
            )
        });
    }
    
    /**
     * Create a texture with the damage number
     */
    createDamageTexture(damage, color) {
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set text properties
        this.context.font = 'bold 120px Arial';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        
        // Add outline
        this.context.strokeStyle = '#000000';
        this.context.lineWidth = 8;
        this.context.strokeText(damage.toString(), this.canvas.width / 2, this.canvas.height / 2);
        
        // Fill text
        this.context.fillStyle = color;
        this.context.fillText(damage.toString(), this.canvas.width / 2, this.canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Get color based on damage type
     */
    getDamageTypeColor(type) {
        switch (type) {
            case 'physical': return '#ff3333'; // Red
            case 'magic': return '#cc33ff';    // Purple
            case 'fire': return '#ff6600';     // Orange
            case 'ice': return '#33ccff';      // Light blue
            case 'lightning': return '#ffff00'; // Yellow
            case 'poison': return '#33ff33';   // Green
            case 'healing': return '#33ff99';  // Teal
            default: return '#ffffff';         // White
        }
    }
    
    /**
     * Update damage numbers (move upward and fade out)
     */
    update() {
        const now = Date.now();
        
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const damageNumber = this.damageNumbers[i];
            const elapsed = (now - damageNumber.createdAt) / 1000;
            
            // Remove if lifetime is exceeded
            if (elapsed >= damageNumber.lifetime) {
                this.scene.remove(damageNumber.sprite);
                damageNumber.sprite.material.dispose();
                damageNumber.sprite.material.map.dispose();
                this.damageNumbers.splice(i, 1);
                continue;
            }
            
            // Calculate progress (0 to 1)
            const progress = elapsed / damageNumber.lifetime;
            
            // Move upward
            damageNumber.sprite.position.x += damageNumber.velocity.x * 0.016; // Assuming 60fps
            damageNumber.sprite.position.y += damageNumber.velocity.y * 0.016;
            damageNumber.sprite.position.z += damageNumber.velocity.z * 0.016;
            
            // Scale up slightly at start, then scale down
            let scale;
            if (progress < 0.2) {
                // Scale up from 0.8 to 1.2
                scale = 0.8 + progress * 2;
            } else {
                // Scale down from 1.2 to 0.6
                scale = 1.2 - (progress - 0.2) * 0.75;
            }
            damageNumber.sprite.scale.set(scale, scale, 1);
            
            // Fade out
            if (progress > 0.7) {
                damageNumber.sprite.material.opacity = 1 - (progress - 0.7) / 0.3;
            }
        }
    }
    
    /**
     * Dispose of all damage numbers
     */
    dispose() {
        for (const damageNumber of this.damageNumbers) {
            this.scene.remove(damageNumber.sprite);
            damageNumber.sprite.material.dispose();
            damageNumber.sprite.material.map.dispose();
        }
        
        this.damageNumbers = [];
    }
}