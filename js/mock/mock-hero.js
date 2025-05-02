import * as THREE from 'three';

/**
 * A simplified mock hero class for testing skills in the model viewer
 */
export default class MockHero {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.direction = new THREE.Vector3(0, 0, 1); // Forward direction (Z+)
        this.mana = 100;
        this.health = 100;
        this.maxMana = 100;
        this.maxHealth = 100;
        
        // Create a simple hero representation
        this.createHeroMesh();
        
        // Add to scene
        scene.add(this.group);
        
        // Mock sound manager
        this.soundManager = {
            playSound: (sound) => {
                console.log(`Playing sound: ${sound}`);
            }
        };
    }
    
    createHeroMesh() {
        // Create a simple character representation
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1; // Place bottom at ground level
        this.group.add(body);
        
        // Add a head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.4; // Place on top of body
        this.group.add(head);
        
        // Add a direction indicator (arrow)
        const arrowGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
        const arrowMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.rotation.x = Math.PI / 2; // Point forward (Z+)
        arrow.position.z = 1; // Place in front
        arrow.position.y = 1; // At body center height
        this.group.add(arrow);
    }
    
    update(delta) {
        // Rotate the hero to demonstrate direction changes
        this.group.rotation.y += delta * 0.2;
        
        // Update direction vector based on rotation
        this.direction.set(0, 0, 1).applyQuaternion(this.group.quaternion);
    }
    
    // Method to restore mana for testing
    restoreMana() {
        this.mana = this.maxMana;
    }
}