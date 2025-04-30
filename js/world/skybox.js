import * as THREE from 'three';

/**
 * Creates and adds a skybox to the scene
 */
export default class Skybox extends THREE.Object3D {
   constructor() {

     // Use placeholder colors for the skybox faces
     const materialArray = [];
     const faceColors = [0x0077ff, 0x00aaff, 0x55aaff, 0x55aaff, 0x0088ff, 0x0088ff]; // Different blue shades
     
     for (let i = 0; i < 6; i++) {
         // Create a canvas for each face
         const canvas = document.createElement('canvas');
         canvas.width = 512;
         canvas.height = 512;
         const context = canvas.getContext('2d');
         
         // Fill with color
         context.fillStyle = '#' + faceColors[i].toString(16).padStart(6, '0');
         context.fillRect(0, 0, canvas.width, canvas.height);
         
         // Add some simple clouds or stars to make it more interesting
         context.fillStyle = 'rgba(255, 255, 255, 0.3)';
         for (let j = 0; j < 100; j++) {
             const x = Math.random() * canvas.width;
             const y = Math.random() * canvas.height;
             const size = Math.random() * 3 + 1;
             context.beginPath();
             context.arc(x, y, size, 0, Math.PI * 2);
             context.fill();
         }
         
         // Create texture from canvas
         const texture = new THREE.CanvasTexture(canvas);
         materialArray.push(new THREE.MeshBasicMaterial({
             map: texture,
             side: THREE.BackSide
         }));
     }
     
     // Create skybox mesh - make it much larger to ensure it's always far away
     // Increased size from 1000 to 5000 to ensure player can never reach it
     const skyboxGeo = new THREE.BoxGeometry(5000, 5000, 5000);
     const skyboxMesh = new THREE.Mesh(skyboxGeo, materialArray);
     
     // Set the renderOrder to ensure skybox is always rendered first (in the background)
     skyboxMesh.renderOrder = -1000;
     
     return skyboxMesh;
   }
}