# ARPG

## Overview

1. **Game Setup**: Establish the foundational setup for the game engine to support an ARPG environment with framework.

2. **Character Design**: Introduce a main hero character with distinct weapons and armor.

3. **Movement Mechanics**: Enable the character to navigate the game world smoothly.

4. **Skill System**: Implement a system where the character can use a variety of active skills, each mapped to specific controls.

5. **Configuration Management**: Ensure all game elements are easily configurable, with settings stored in a dedicated directory for adjustments.

6. **Advanced Movement**: Allow the character to perform advanced movements such as jumping, moving, attacking, and dodging.

## Characters

Give me characters, using idea from Dota 1:
- Dragon Knight
- Axe
- Crystal Maiden
- Lina
- Necromancer
- Moon Rider
- Warlock

## Features

- 3D environment with detailed terrain, water, mountains, and a distant castle
- Controllable character with sword and shield
- WASD movement controls with space for jumping
- A lot of unique skills activated, allowed to assign to 6 keys on UI: Y, U, I, H, J, K keys
- Mouse pointer look around control
- Flying mode when jumping high enough
- Combat system with damage, health, and experience
- Progression system with leveling and stat improvements
- Sound effects and background music
- Configurable game settings

## Controls

- **W, A, S, D**: Move the character
- **Space**: Jump (press multiple times to jump higher)
- **Mouse**: Control looks direction
- **Y, U, I, H, J, K**: Activate different skills

## Game Mechanics

### Combat
- Use skills (Y, U, I, H, J, K) to attack enemies
- Each skill has a cooldown period before it can be used again
- Enemies will chase and attack the player when in range
- Defeating enemies grants experience points

## Enemy

- Auto spawned enemy
- Randomly move within a certain area
- Attack the hero if they are close enough
- Different types of enemies with varying strengths and weaknesses

### Progression
- Gain experience by defeating enemies
- Level up when enough experience is earned
- Each level increases health and damage
- Higher levels allow you to defeat stronger enemies
