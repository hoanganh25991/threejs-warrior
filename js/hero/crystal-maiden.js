import * as THREE from 'three';

export class CrystalMaiden {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.mesh = null;
        
        // Create the model
        this.createModel();
    }
    
    createModel() {
        // Create a more complex Crystal Maiden model
        const bodyGroup = new THREE.Group();
        
        // Body - slender and feminine
        const bodyGeometry = new THREE.BoxGeometry(0.8, 1.4, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, // Light sky blue
            metalness: 0.3,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        body.castShadow = true;
        bodyGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFE4E1, // Misty rose
            metalness: 0.1,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        bodyGroup.add(head);
        
        // Hair/Hood
        const hoodGeometry = new THREE.ConeGeometry(0.4, 0.8, 16, 1, true);
        const hoodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00BFFF, // Deep sky blue
            metalness: 0.2,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.y = 2.0;
        hood.rotation.x = Math.PI;
        hood.castShadow = true;
        bodyGroup.add(hood);
        
        // Cape
        const capeGeometry = new THREE.PlaneGeometry(1.2, 1.8);
        const capeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00BFFF, // Deep sky blue
            metalness: 0.2,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const cape = new THREE.Mesh(capeGeometry, capeMaterial);
        cape.position.set(0, 1.2, -0.4);
        cape.castShadow = true;
        bodyGroup.add(cape);
        
        // Arms - slender
        const armGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, // Light sky blue
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left arm
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 1.2, 0);
        leftArm.castShadow = true;
        bodyGroup.add(leftArm);
        
        // Right arm
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 1.2, 0);
        rightArm.castShadow = true;
        bodyGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEFA, // Light sky blue
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, 0.4, 0);
        leftLeg.castShadow = true;
        bodyGroup.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, 0.4, 0);
        rightLeg.castShadow = true;
        bodyGroup.add(rightLeg);
        
        // Staff
        const staffGroup = new THREE.Group();
        
        // Staff rod
        const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8);
        const rodMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887, // Burlywood
            metalness: 0.2,
            roughness: 0.8
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.castShadow = true;
        staffGroup.add(rod);
        
        // Crystal top
        const crystalGeometry = new THREE.OctahedronGeometry(0.2);
        const crystalMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xADD8E6, // Light blue
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8,
            emissive: 0x00BFFF,
            emissiveIntensity: 0.5
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.y = 1.0;
        crystal.castShadow = true;
        staffGroup.add(crystal);
        
        // Position staff in right hand
        staffGroup.position.set(0.7, 0.9, 0.2);
        staffGroup.rotation.z = Math.PI / 12;
        bodyGroup.add(staffGroup);
        
        // Ice particles
        const particlesGroup = new THREE.Group();
        for (let i = 0; i < 10; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xADD8E6, // Light blue
                emissive: 0x00BFFF,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around the crystal
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.2;
            particle.position.set(
                Math.cos(angle) * radius,
                1.0 + Math.random() * 0.4,
                Math.sin(angle) * radius
            );
            
            particlesGroup.add(particle);
        }
        staffGroup.add(particlesGroup);
        
        // Add the complete body to the group
        this.group.add(bodyGroup);
        this.mesh = body; // Set the main body as the reference mesh
    }
    
    getGroup() {
        return this.group;
    }
    
    getMesh() {
        return this.mesh;
    }
}