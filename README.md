# ARPG Game

A simple 3D action role-playing game built with Three.js.

## Features

- 3D environment with detailed terrain, water, mountains, and a distant castle
- Controllable character with sword and shield
- WASD movement controls with space for jumping
- Multiple unique skills activated with Y, U, I, H, J, K keys
- Mouse pointer look around control
- Flying mode when jumping high enough
- Combat system with damage, health, and experience
- Progression system with leveling and stat improvements
- Sound effects and background music
- Configurable game settings

## How to Run

1. Start a local server in the project directory. You can use one of the following methods:

   Using Python:
   ```
   python -m http.server
   ```

   Using Node.js (with http-server installed):
   ```
   npx http-server
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

3. Select a hero and start playing!

## Controls

- **W, A, S, D**: Move the character (relative to facing direction)
- **Q, E**: Look left and right
- **Mouse**: Control look direction (click on game to capture mouse, ESC to release)
- **Space**: Jump (press multiple times to jump higher)
- **Y, U, I, H, J, K**: Use skills

## Project Structure

- `index.html`: Main entry point
- `js/main.js`: Game initialization and main loop
- `js/config/config.js`: Game configuration settings
- `js/characters/hero.js`: Hero character implementation
- `js/characters/enemy.js`: Enemy character implementation
- `js/characters/enemyManager.js`: Enemy spawning and management
- `js/skills/skillManager.js`: Skill system implementation
- `js/utils/input.js`: Input handling
- `js/utils/world.js`: World and environment creation
- `js/utils/soundManager.js`: Sound effects and music management
- `assets/`: Contains models, textures, and sounds

## Development

This project uses a simple setup with:
- HTML5 and CSS3
- JavaScript modules
- Three.js for 3D rendering
- No build tools or frameworks required

## License

MIT