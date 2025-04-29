// Game configuration settings
export const config = {
    // Game settings
    game: {
        title: "ARPG Game",
        version: "0.1.0",
        debug: false
    },
    
    // Camera settings
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        initialPosition: { x: 0, y: 5, z: 10 }
    },
    
    // Player settings
    player: {
        moveSpeed: 5,
        jumpHeight: 2,
        jumpDuration: 0.5,
        health: 100,
        mana: 100,
        experience: {
            initial: 0,
            levelUpThreshold: 100,
            levelUpMultiplier: 1.5
        }
    },
    
    // Enemy settings
    enemies: {
        spawnRate: 5, // seconds between spawns
        maxEnemies: 10,
        types: {
            basic: {
                health: 50,
                damage: 10,
                moveSpeed: 2,
                experienceValue: 20
            },
            elite: {
                health: 100,
                damage: 20,
                moveSpeed: 1.5,
                experienceValue: 50
            },
            boss: {
                health: 500,
                damage: 50,
                moveSpeed: 1,
                experienceValue: 200
            }
        }
    },
    
    // Skills configuration
    skills: {
        // Y key skill
        fireball: {
            name: "Fireball",
            damage: 30,
            manaCost: 20,
            cooldown: 2, // seconds
            range: 10,
            areaOfEffect: 3
        },
        // U key skill
        iceSpike: {
            name: "Ice Spike",
            damage: 20,
            manaCost: 15,
            cooldown: 1.5,
            range: 8,
            slowEffect: 0.5 // 50% slow
        },
        // I key skill
        thunderStrike: {
            name: "Thunder Strike",
            damage: 50,
            manaCost: 30,
            cooldown: 5,
            range: 15,
            areaOfEffect: 5
        },
        // H key skill
        heal: {
            name: "Heal",
            healAmount: 40,
            manaCost: 25,
            cooldown: 8
        },
        // J key skill
        shield: {
            name: "Shield",
            damageReduction: 0.5, // 50% damage reduction
            duration: 5, // seconds
            manaCost: 35,
            cooldown: 12
        },
        // K key skill
        dash: {
            name: "Dash",
            distance: 10,
            manaCost: 15,
            cooldown: 3
        }
    },
    
    // Controls configuration
    controls: {
        keyboard: {
            moveForward: "w",
            moveBackward: "s",
            moveLeft: "a",
            moveRight: "d",
            lookLeft: "q",
            lookRight: "e",
            jump: " ", // space
            skill1: "y",
            skill2: "u",
            skill3: "i",
            skill4: "h",
            skill5: "j",
            skill6: "k"
        },
        mouse: {
            look: true,
            sensitivity: 0.5,
            attack: 0 // left mouse button
        }
    },
    
    // Sound settings
    sound: {
        music: {
            volume: 0.5,
            enabled: true
        },
        effects: {
            volume: 0.8,
            enabled: true
        }
    }
};

export default config;