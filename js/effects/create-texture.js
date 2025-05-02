// This script creates basic particle textures
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create directory if it doesn't exist
const path = require('path');
const dir = path.join(__dirname, '../../assets/textures/particles');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Function to create a circular gradient texture
function createParticleTexture(name, color, size = 128) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Create radial gradient
  const gradient = ctx.createRadialGradient(
    size/2, size/2, 0,
    size/2, size/2, size/2
  );
  
  // Set gradient colors
  gradient.addColorStop(0, color);
  
  // Properly modify the color for transparency
  let midColor, endColor;
  if (color.startsWith('rgba')) {
    // If already rgba, replace the last value
    midColor = color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/, 'rgba($1, $2, $3, 0.5)');
    endColor = color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/, 'rgba($1, $2, $3, 0)');
  } else if (color.startsWith('rgb')) {
    // If rgb, convert to rgba
    midColor = color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, 'rgba($1, $2, $3, 0.5)');
    endColor = color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, 'rgba($1, $2, $3, 0)');
  } else {
    // Fallback for hex or named colors
    midColor = color;
    endColor = 'transparent';
  }
  
  gradient.addColorStop(0.5, midColor);
  gradient.addColorStop(1, endColor);
  
  // Fill with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${dir}/${name}.png`, buffer);
  
  console.log(`Created ${name}.png`);
}

// Create basic particle textures
createParticleTexture('physical', 'rgba(255, 255, 255, 1)');
createParticleTexture('fire', 'rgba(255, 100, 0, 1)');
createParticleTexture('ice', 'rgba(100, 200, 255, 1)');
createParticleTexture('lightning', 'rgba(255, 255, 100, 1)');
createParticleTexture('healing', 'rgba(100, 255, 100, 1)');
createParticleTexture('shield', 'rgba(200, 200, 255, 1)');
createParticleTexture('smoke', 'rgba(100, 100, 100, 1)');
createParticleTexture('explosion', 'rgba(255, 200, 0, 1)');
createParticleTexture('blood', 'rgba(200, 0, 0, 1)');
createParticleTexture('water', 'rgba(0, 100, 255, 1)');
createParticleTexture('levelUp', 'rgba(255, 255, 0, 1)');
createParticleTexture('raindrop', 'rgba(100, 150, 255, 0.7)');

console.log('All textures created successfully!');