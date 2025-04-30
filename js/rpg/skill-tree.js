export default class SkillTree {
    constructor(characterClass) {
        this.characterClass = characterClass;
        this.skills = this.getSkillTreeData();
        this.unlockedSkills = new Set();
    }

    getSkillTreeData() {
        const trees = {
            warrior: {
                // Offense Tree
                'brutal-strike': {
                    name: 'Brutal Strike',
                    description: 'A powerful melee attack that deals heavy damage',
                    maxLevel: 5,
                    baseDamage: 50,
                    damageType: 'physical',
                    scaling: { strength: 0.8 },
                    cooldown: 5,
                    manaCost: 20,
                    requirements: [],
                    effects: ['knockback'],
                    upgrades: [
                        'Increased damage',
                        'Reduced cooldown',
                        'Added bleed effect',
                        'Increased knockback',
                        'Area of effect'
                    ]
                },
                'whirlwind': {
                    name: 'Whirlwind',
                    description: 'Spin to hit all nearby enemies',
                    maxLevel: 5,
                    baseDamage: 30,
                    damageType: 'physical',
                    scaling: { strength: 0.6 },
                    cooldown: 8,
                    manaCost: 35,
                    requirements: ['brutal-strike-3'],
                    effects: ['movement'],
                    upgrades: [
                        'Increased damage',
                        'Larger radius',
                        'Movement speed',
                        'Duration',
                        'Damage reduction while active'
                    ]
                },
                // Defense Tree
                'iron-skin': {
                    name: 'Iron Skin',
                    description: 'Temporarily increase armor',
                    maxLevel: 5,
                    baseDuration: 10,
                    cooldown: 15,
                    manaCost: 30,
                    requirements: [],
                    effects: ['armor'],
                    upgrades: [
                        'Increased armor',
                        'Longer duration',
                        'Health regeneration',
                        'Reflect damage',
                        'Share with allies'
                    ]
                }
            },
            mage: {
                // Fire Tree
                'fireball': {
                    name: 'Fireball',
                    description: 'Launch a ball of fire',
                    maxLevel: 5,
                    baseDamage: 60,
                    damageType: 'magic',
                    scaling: { intelligence: 1.0 },
                    cooldown: 4,
                    manaCost: 40,
                    requirements: [],
                    effects: ['burn'],
                    upgrades: [
                        'Increased damage',
                        'Larger explosion',
                        'Longer burn',
                        'Multiple projectiles',
                        'Penetrating projectile'
                    ]
                },
                'meteor': {
                    name: 'Meteor',
                    description: 'Call down a meteor from the sky',
                    maxLevel: 5,
                    baseDamage: 120,
                    damageType: 'magic',
                    scaling: { intelligence: 1.5 },
                    cooldown: 12,
                    manaCost: 80,
                    requirements: ['fireball-3'],
                    effects: ['burn', 'knockdown'],
                    upgrades: [
                        'Increased damage',
                        'Larger impact',
                        'Multiple meteors',
                        'Burning ground',
                        'Stun duration'
                    ]
                }
            },
            rogue: {
                // Stealth Tree
                'shadow-strike': {
                    name: 'Shadow Strike',
                    description: 'Strike from the shadows for bonus damage',
                    maxLevel: 5,
                    baseDamage: 80,
                    damageType: 'physical',
                    scaling: { dexterity: 1.2 },
                    cooldown: 6,
                    manaCost: 30,
                    requirements: [],
                    effects: ['stealth'],
                    upgrades: [
                        'Increased damage',
                        'Bonus crit chance',
                        'Poison effect',
                        'Reset cooldown on kill',
                        'Teleport to target'
                    ]
                },
                'smoke-bomb': {
                    name: 'Smoke Bomb',
                    description: 'Create a smoke cloud that blinds enemies',
                    maxLevel: 5,
                    duration: 5,
                    cooldown: 10,
                    manaCost: 45,
                    requirements: ['shadow-strike-3'],
                    effects: ['blind', 'stealth'],
                    upgrades: [
                        'Larger radius',
                        'Longer duration',
                        'Damage over time',
                        'Movement speed',
                        'Instant stealth'
                    ]
                }
            },
            paladin: {
                // Holy Tree
                'divine-smite': {
                    name: 'Divine Smite',
                    description: 'Channel holy energy into a powerful strike',
                    maxLevel: 5,
                    baseDamage: 70,
                    damageType: 'magic',
                    scaling: { strength: 0.6, intelligence: 0.6 },
                    cooldown: 8,
                    manaCost: 50,
                    requirements: [],
                    effects: ['holy'],
                    upgrades: [
                        'Increased damage',
                        'Heal on hit',
                        'Bonus vs undead',
                        'Area of effect',
                        'Stun chance'
                    ]
                },
                'holy-shield': {
                    name: 'Holy Shield',
                    description: 'Create a protective barrier that absorbs damage',
                    maxLevel: 5,
                    baseShield: 100,
                    duration: 8,
                    cooldown: 12,
                    manaCost: 60,
                    requirements: ['divine-smite-3'],
                    effects: ['shield', 'holy'],
                    upgrades: [
                        'Increased absorption',
                        'Longer duration',
                        'Damage reflection',
                        'Share with allies',
                        'Heal when broken'
                    ]
                }
            }
        };

        return trees[this.characterClass] || {};
    }

    getSkill(skillId) {
        return this.skills[skillId];
    }

    unlockSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill) return false;

        // Check if all requirements are met
        if (skill.requirements) {
            for (const req of skill.requirements) {
                const [reqSkill, reqLevel] = req.split('-');
                if (!this.unlockedSkills.has(reqSkill) || 
                    this.getSkillLevel(reqSkill) < parseInt(reqLevel)) {
                    return false;
                }
            }
        }

        this.unlockedSkills.add(skillId);
        return true;
    }

    getSkillLevel(skillId) {
        return this.unlockedSkills.has(skillId) ? 1 : 0;
    }

    isSkillUnlocked(skillId) {
        return this.unlockedSkills.has(skillId);
    }

    canUnlockSkill(skillId) {
        const skill = this.skills[skillId];
        if (!skill) return false;

        // Already unlocked
        if (this.unlockedSkills.has(skillId)) return false;

        // Check requirements
        if (skill.requirements) {
            for (const req of skill.requirements) {
                const [reqSkill, reqLevel] = req.split('-');
                if (!this.unlockedSkills.has(reqSkill) || 
                    this.getSkillLevel(reqSkill) < parseInt(reqLevel)) {
                    return false;
                }
            }
        }

        return true;
    }

    getSkillDamage(skillId, characterStats) {
        const skill = this.skills[skillId];
        if (!skill || !this.unlockedSkills.has(skillId)) return 0;

        let damage = skill.baseDamage;

        // Apply stat scaling
        if (skill.scaling) {
            Object.entries(skill.scaling).forEach(([stat, scale]) => {
                damage += characterStats[stat] * scale;
            });
        }

        return damage;
    }

    getSkillCooldown(skillId) {
        const skill = this.skills[skillId];
        if (!skill || !this.unlockedSkills.has(skillId)) return 0;
        return skill.cooldown;
    }

    getSkillManaCost(skillId) {
        const skill = this.skills[skillId];
        if (!skill || !this.unlockedSkills.has(skillId)) return 0;
        return skill.manaCost;
    }

    getSkillEffects(skillId) {
        const skill = this.skills[skillId];
        if (!skill || !this.unlockedSkills.has(skillId)) return [];
        return skill.effects || [];
    }

    getSkillUpgrades(skillId) {
        const skill = this.skills[skillId];
        if (!skill || !this.unlockedSkills.has(skillId)) return [];
        return skill.upgrades || [];
    }

    save() {
        return {
            characterClass: this.characterClass,
            unlockedSkills: Array.from(this.unlockedSkills)
        };
    }

    load(data) {
        this.characterClass = data.characterClass;
        this.skills = this.getSkillTreeData();
        this.unlockedSkills = new Set(data.unlockedSkills);
    }
}
