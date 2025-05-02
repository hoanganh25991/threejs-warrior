// Game configuration settings
export const config = {
    // Game settings
    game: {
        title: "ARPG Game",
        version: "0.1.0",
        debug: false  // Enable debug mode
    },
    
    // Performance settings
    performance: {
        useGPUAcceleration: true,  // Enable GPU acceleration
        lowPolyMode: true,         // Use low-poly models for better performance
        useInstancing: true,       // Use instanced meshes for similar objects
        maxActiveSkills: 50,       // Limit the number of active skills
        maxParticles: 1000,        // Limit the number of particles
        shadowQuality: 'low',      // Shadow quality: 'off', 'low', 'medium', 'high'
        effectDetail: 'low',       // Effect detail: 'low', 'medium', 'high'
        throttleSkillUpdates: true // Throttle skill updates for better performance
    },
    
    // Camera settings
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        initialPosition: { x: 0, y: 5, z: 15 } // Increased initial distance
    },
    
    // Player settings
    player: {
        moveSpeed: 5 * 2,
        jumpHeight: 5,         // Maximum height the player can jump onto objects
        jumpForce: 5,         // Initial upward force
        gravity: 25,           // Gravity force
        flyingHeight: 7,       // Height at which wings appear (same as tree height)
        maxFlyingHeight: 200,  // Maximum height the player can fly to
        maxStepHeight: 1.0,    // Maximum height the player can step up without jumping (increased for better stair climbing)
        health: 300_000,
        mana: 300_000,
        experience: {
            initial: 0,
            levelUpThreshold: 100,
            levelUpMultiplier: 1.5
        }
    },
    
    // Combat settings
    combat: {
        attackRange: 2,
        attackSpeed: 1.0,
        baseDamage: 20,
        meleeRange: 2,
        rangedRange: 10,
        criticalChance: 0.1,
        criticalMultiplier: 2.0,
        knockbackForce: 5,
        comboTimeWindow: 0.5,
        maxCombo: 3
    },

    // Enemy settings
    enemies: {
        spawnRate: 5, // seconds between spawns
        maxEnemies: 10,
        basic: {
            health: 50,
            damage: 10,
            speed: 2,
            experience: 20,
            attackRange: 2,
            detectionRange: 10,
            attackSpeed: 1
        },
        archer: {
            health: 40,
            damage: 15,
            speed: 1.5,
            experience: 30,
            attackRange: 8,
            detectionRange: 15,
            attackSpeed: 0.8
        },
        mage: {
            health: 30,
            damage: 25,
            speed: 1,
            experience: 40,
            attackRange: 10,
            detectionRange: 20,
            attackSpeed: 0.6
        },
        tank: {
            health: 100,
            damage: 8,
            speed: 0.8,
            experience: 50,
            attackRange: 2,
            detectionRange: 8,
            attackSpeed: 0.5
        },
        boss: {
            health: 500,
            damage: 50,
            speed: 1,
            experience: 200,
            attackRange: 3,
            detectionRange: 25,
            attackSpeed: 0.7
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
        // Dragon Knight skills
        dragonBreath: {
            name: "Dragon Breath",
            damage: 35,
            manaCost: 25,
            cooldown: 3, // seconds
            range: 8,
            areaOfEffect: 4
        },
        flameStrike: {
            name: "Flame Strike",
            damage: 40,
            manaCost: 30,
            cooldown: 4,
            range: 6,
            areaOfEffect: 5
        },
        dragonTail: {
            name: "Dragon Tail",
            damage: 25,
            manaCost: 20,
            cooldown: 5,
            range: 3,
            stunDuration: 2
        },
        elderDragonForm: {
            name: "Elder Dragon Form",
            damageBoost: 1.5,
            duration: 10,
            manaCost: 50,
            cooldown: 30
        },
        fireShield: {
            name: "Fire Shield",
            damageReduction: 0.3,
            reflectDamage: 15,
            duration: 8,
            manaCost: 35,
            cooldown: 15
        },
        dragonRush: {
            name: "Dragon Rush",
            damage: 30,
            distance: 15,
            manaCost: 25,
            cooldown: 8
        },
        
        // Crystal Maiden skills
        frostNova: {
            name: "Frost Nova",
            damage: 25,
            manaCost: 20,
            cooldown: 3,
            range: 6,
            areaOfEffect: 4,
            slowEffect: 0.4
        },
        iceBlast: {
            name: "Ice Blast",
            damage: 35,
            manaCost: 30,
            cooldown: 5,
            range: 10,
            freezeDuration: 1.5
        },
        glacialBarrier: {
            name: "Glacial Barrier",
            damageReduction: 0.4,
            duration: 6,
            manaCost: 35,
            cooldown: 12
        },
        blizzard: {
            name: "Blizzard",
            damage: 60,
            manaCost: 45,
            cooldown: 20,
            range: 8,
            areaOfEffect: 6,
            duration: 3
        },
        frozenOrb: {
            name: "Frozen Orb",
            damage: 30,
            manaCost: 40,
            cooldown: 15,
            range: 5,
            areaOfEffect: 8,
            duration: 5
        },
        iceShards: {
            name: "Ice Shards",
            damage: 20,
            manaCost: 25,
            cooldown: 7,
            range: 7,
            projectileCount: 5
        },
        
        // Axe skills
        berserkerCall: {
            name: "Berserker's Call",
            damage: 15,
            manaCost: 30,
            cooldown: 10,
            range: 4,
            tauntDuration: 3
        },
        battleHunger: {
            name: "Battle Hunger",
            damage: 10,
            damageOverTime: 5,
            duration: 8,
            manaCost: 25,
            cooldown: 12,
            range: 6
        },
        counterHelix: {
            name: "Counter Helix",
            damage: 30,
            manaCost: 20,
            cooldown: 8,
            areaOfEffect: 3
        },
        cullingBlade: {
            name: "Culling Blade",
            damage: 100,
            executeThreshold: 50,
            manaCost: 60,
            cooldown: 25,
            range: 2
        },
        battleTrance: {
            name: "Battle Trance",
            damageReduction: 0.5,
            attackSpeedBoost: 0.3,
            duration: 6,
            manaCost: 40,
            cooldown: 20
        },
        berserkerRage: {
            name: "Berserker's Rage",
            damageBoost: 0.4,
            moveSpeedBoost: 0.2,
            duration: 8,
            manaCost: 35,
            cooldown: 15
        },
        
        // Lina skills
        dragonSlave: {
            name: "Dragon Slave",
            damage: 40,
            manaCost: 25,
            cooldown: 4,
            range: 9,
            areaOfEffect: 2
        },
        lightStrikeArray: {
            name: "Light Strike Array",
            damage: 35,
            manaCost: 30,
            cooldown: 7,
            range: 7,
            areaOfEffect: 5,
            stunDuration: 1.5
        },
        fierySoul: {
            name: "Fiery Soul",
            attackSpeedBoost: 0.3,
            moveSpeedBoost: 0.2,
            duration: 10,
            manaCost: 35,
            cooldown: 15
        },
        lagunaBlade: {
            name: "Laguna Blade",
            damage: 120,
            manaCost: 70,
            cooldown: 30,
            range: 6
        },
        flameCloak: {
            name: "Flame Cloak",
            damageReduction: 0.3,
            burnDamage: 15,
            duration: 8,
            manaCost: 40,
            cooldown: 18
        },
        infernoWave: {
            name: "Inferno Wave",
            damage: 50,
            manaCost: 45,
            cooldown: 12,
            range: 8,
            areaOfEffect: 7
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
        healingWave: {
            name: "Healing Wave",
            healAmount: 60,
            areaOfEffect: 5,
            manaCost: 35,
            cooldown: 12
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
            skill6: "k",
            toggleAutoAttack: "t" // Toggle auto-attack
        },
        mouse: {
            look: true,
            sensitivity: 0.8, // Increased sensitivity for better responsiveness
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