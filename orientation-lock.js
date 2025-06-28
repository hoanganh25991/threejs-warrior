// Create rotation prompt overlay
function createRotationPrompt() {
  const overlay = document.createElement('div');
  overlay.id = 'rotation-prompt';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    z-index: 9999;
    color: white;
    font-family: Arial, sans-serif;
    text-align: center;
    transition: opacity 0.3s ease;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 2rem 1rem;
    box-sizing: border-box;
  `;

  // Create scrollable content container
  const contentContainer = document.createElement('div');
  contentContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 400px;
    min-height: 100vh;
    justify-content: center;
    padding: 1rem 0;
  `;

  const icon = document.createElement('div');
  icon.innerHTML = '📱➡️📱';
  icon.style.cssText = `
    font-size: clamp(3rem, 8vw, 4rem);
    margin-bottom: 1rem;
    animation: rotate-hint 2s infinite ease-in-out;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Please Rotate Your Device';
  title.style.cssText = `
    font-size: clamp(1.2rem, 5vw, 1.8rem);
    margin-bottom: 0.5rem;
    font-weight: bold;
    line-height: 1.2;
  `;

  const subtitle = document.createElement('p');
  subtitle.textContent = 'This game is best experienced in landscape mode';
  subtitle.style.cssText = `
    font-size: clamp(0.9rem, 3.5vw, 1rem);
    margin-bottom: 2rem;
    opacity: 0.8;
    line-height: 1.4;
    max-width: 300px;
  `;

  // Add visual rotation guide
  const rotationGuide = document.createElement('div');
  rotationGuide.style.cssText = `
    margin: 1rem 0 2rem 0;
    padding: 1rem;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    width: 100%;
    max-width: 280px;
  `;
  
  const guideText = document.createElement('p');
  guideText.innerHTML = '🔄 Turn your device 90° clockwise or counterclockwise';
  guideText.style.cssText = `
    font-size: clamp(0.8rem, 3vw, 0.9rem);
    margin: 0;
    opacity: 0.7;
  `;
  
  rotationGuide.appendChild(guideText);

  // Add CSS animation and responsive styles
  if (!document.getElementById('rotation-styles')) {
    const style = document.createElement('style');
    style.id = 'rotation-styles';
    style.textContent = `
      @keyframes rotate-hint {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-15deg); }
        75% { transform: rotate(15deg); }
      }
      
      /* Hide on landscape orientation */
      @media (orientation: landscape) {
        #rotation-prompt { 
          opacity: 0 !important; 
          pointer-events: none !important; 
        }
      }
      
      /* Responsive adjustments for very small phones */
      @media screen and (max-height: 600px) and (orientation: portrait) {
        #rotation-prompt {
          padding: 1rem 0.5rem;
        }
        #rotation-prompt > div {
          min-height: auto;
          justify-content: flex-start;
          padding-top: 2rem;
        }
      }
      
      /* Extra small phones */
      @media screen and (max-height: 500px) and (orientation: portrait) {
        #rotation-prompt > div {
          padding-top: 1rem;
        }
      }
      
      /* Ensure scrolling on very small screens */
      @media screen and (max-height: 400px) and (orientation: portrait) {
        #rotation-prompt {
          justify-content: flex-start;
          padding: 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Assemble the content
  contentContainer.appendChild(icon);
  contentContainer.appendChild(title);
  contentContainer.appendChild(subtitle);
  contentContainer.appendChild(rotationGuide);
  
  overlay.appendChild(contentContainer);
  
  return overlay;
}

// Show rotation prompt
function showRotationPrompt() {
  let existingPrompt = document.getElementById('rotation-prompt');
  if (!existingPrompt) {
    existingPrompt = createRotationPrompt();
    document.body.appendChild(existingPrompt);
  }
  existingPrompt.style.opacity = '1';
  existingPrompt.style.pointerEvents = 'auto';
}

// Hide rotation prompt
function hideRotationPrompt() {
  const prompt = document.getElementById('rotation-prompt');
  if (prompt) {
    prompt.style.opacity = '0';
    prompt.style.pointerEvents = 'none';
  }
}

// Check if device is in portrait mode
function isPortraitMode() {
  if (screen.orientation) {
    return screen.orientation.angle === 0 || screen.orientation.angle === 180;
  }
  // Fallback for older browsers
  return window.innerHeight > window.innerWidth;
}

// Handle orientation changes
function handleOrientationChange() {
  setTimeout(function() {
    if (isPortraitMode()) {
      showRotationPrompt();
    } else {
      hideRotationPrompt();
    }
  }, 100); // Small delay to ensure orientation change is complete
}

// Event listeners
window.addEventListener("orientationchange", handleOrientationChange);
window.addEventListener("resize", handleOrientationChange);

// Initial check when page loads
document.addEventListener("DOMContentLoaded", function () {
  handleOrientationChange();
});
