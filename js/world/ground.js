import * as THREE from 'three';

/**
 * Creates and adds ground to the scene
 */
export default class Groud extends THREE.Object3D {
  constructor() {
    // Call the parent constructor
    super();

    // Create a more detailed ground with texture
    const groundSize = 1000;
    const groundSegments = 128;
    const groundGeometry = new THREE.PlaneGeometry(
      groundSize,
      groundSize,
      groundSegments,
      groundSegments
    );

    // Create a canvas for the ground texture
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext("2d");

    // Fill with base color
    context.fillStyle = "#3a7e4f";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add some texture variation
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 4 + 1;
      const alpha = Math.random() * 0.2 + 0.05;

      // Randomly choose between darker and lighter patches
      if (Math.random() > 0.5) {
        context.fillStyle = `rgba(30, 80, 30, ${alpha})`; // Darker green
      } else {
        context.fillStyle = `rgba(100, 180, 100, ${alpha})`; // Lighter green
      }

      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }

    // Create texture from canvas
    const groundTexture = new THREE.CanvasTexture(canvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(10, 10);

    // Create bump map for more detail
    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = 1024;
    bumpCanvas.height = 1024;
    const bumpContext = bumpCanvas.getContext("2d");

    // Fill with neutral gray
    bumpContext.fillStyle = "#808080";
    bumpContext.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // Add random bumps
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * bumpCanvas.width;
      const y = Math.random() * bumpCanvas.height;
      const size = Math.random() * 6 + 1;
      const value = Math.random() * 60 + 100; // Values between 100-160

      bumpContext.fillStyle = `rgb(${value}, ${value}, ${value})`;
      bumpContext.beginPath();
      bumpContext.arc(x, y, size, 0, Math.PI * 2);
      bumpContext.fill();
    }

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.repeat.set(10, 10);

    // Create ground material with textures
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.2,
      roughness: 0.8,
      metalness: 0.1,
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    // Rotate and position the ground
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;

    return ground;
  }
}
