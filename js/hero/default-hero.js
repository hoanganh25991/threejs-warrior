import * as THREE from 'three';

export class DefaultHero {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.mesh = null;
        
        // Create the model
        this.createModel();
    }
    
    createModel() {
        // Create a simple default hero
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 1;
        this.mesh.castShadow = true;
        this.group.add(this.mesh);
    }
    
    getGroup() {
        return this.group;
    }
    
    getMesh() {
        return this.mesh;
    }
}