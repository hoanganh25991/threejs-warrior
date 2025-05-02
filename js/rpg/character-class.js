import SkillTree from './skill-tree.js';

export default class CharacterClass {
    constructor(type) {
        this.type = type;
        this.stats = this.getBaseStats();
        this.skillTree = new SkillTree(type);
        this.level = 1;
        this.experience = 0;
        this.skillPoints = 0;
        this.attributePoints = 0;
        
        // Equipment slots
        this.equipment = {
            head: null,
            chest: null,
            legs: null,
            boots: null,
            mainHand: null,
            offHand: null,
            necklace: null,
            ring1: null,
            ring2: null
        };
    }

    getBaseStats() {
        const baseStats = {
            warrior: {
                health: 150_000,
                mana: 50_000,
                strength: 15,
                dexterity: 10,
                intelligence: 5,
                armor: 10,
                attackPower: 10,
                critChance: 0.05,
                critMultiplier: 1.5
            },
            mage: {
                health: 80,
                mana: 150,
                strength: 5,
                dexterity: 8,
                intelligence: 20,
                armor: 4,
                spellPower: 15,
                critChance: 0.08,
                critMultiplier: 2.0
            },
            rogue: {
                health: 100,
                mana: 80,
                strength: 8,
                dexterity: 20,
                intelligence: 8,
                armor: 6,
                attackPower: 12,
                critChance: 0.15,
                critMultiplier: 2.5
            },
            paladin: {
                health: 120,
                mana: 100,
                strength: 12,
                dexterity: 8,
                intelligence: 10,
                armor: 12,
                healPower: 8,
                critChance: 0.05,
                critMultiplier: 1.8
            }
        };

        return baseStats[this.type] || baseStats.warrior;
    }

    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        const expNeeded = this.getExperienceForNextLevel();
        if (this.experience >= expNeeded) {
            this.levelUp();
        }
    }

    getExperienceForNextLevel() {
        // Experience needed = base * (multiplier ^ (level - 1))
        const base = 100;
        const multiplier = 1.5;
        return Math.floor(base * Math.pow(multiplier, this.level - 1));
    }

    levelUp() {
        this.level++;
        this.skillPoints += 1;
        this.attributePoints += 5;
        this.experience -= this.getExperienceForNextLevel();

        // Increase base stats
        const statIncrease = {
            warrior: {
                health: 15,
                mana: 5,
                strength: 3,
                dexterity: 2,
                intelligence: 1,
                armor: 2
            },
            mage: {
                health: 8,
                mana: 15,
                strength: 1,
                dexterity: 1,
                intelligence: 3,
                spellPower: 2
            },
            rogue: {
                health: 10,
                mana: 8,
                strength: 1,
                dexterity: 3,
                intelligence: 1,
                attackPower: 2
            },
            paladin: {
                health: 12,
                mana: 10,
                strength: 2,
                dexterity: 1,
                intelligence: 2,
                armor: 2,
                healPower: 1
            }
        }[this.type];

        Object.entries(statIncrease).forEach(([stat, value]) => {
            this.stats[stat] += value;
        });

        // Create level up effect
        this.createLevelUpEffect();
    }

    createLevelUpEffect() {
        // Emit event for level up effect
        const event = new CustomEvent('levelUp', {
            detail: {
                level: this.level,
                class: this.type
            }
        });
        document.dispatchEvent(event);
    }

    equipItem(item, slot) {
        if (!this.canEquipItem(item)) {
            console.warn(`Cannot equip ${item.name} - requirements not met`);
            return false;
        }

        // Remove old item stats
        if (this.equipment[slot]) {
            this.removeItemStats(this.equipment[slot]);
        }

        // Equip new item and apply stats
        this.equipment[slot] = item;
        this.applyItemStats(item);

        return true;
    }

    unequipItem(slot) {
        const item = this.equipment[slot];
        if (item) {
            this.removeItemStats(item);
            this.equipment[slot] = null;
            return item;
        }
        return null;
    }

    canEquipItem(item) {
        // Check level requirement
        if (item.levelReq > this.level) return false;

        // Check class requirement
        if (item.classReq && item.classReq !== this.type) return false;

        // Check stat requirements
        if (item.requirements) {
            for (const [stat, value] of Object.entries(item.requirements)) {
                if (this.stats[stat] < value) return false;
            }
        }

        return true;
    }

    applyItemStats(item) {
        if (!item.stats) return;

        for (const [stat, value] of Object.entries(item.stats)) {
            if (typeof this.stats[stat] === 'number') {
                this.stats[stat] += value;
            }
        }
    }

    removeItemStats(item) {
        if (!item.stats) return;

        for (const [stat, value] of Object.entries(item.stats)) {
            if (typeof this.stats[stat] === 'number') {
                this.stats[stat] -= value;
            }
        }
    }

    spendSkillPoint(skillId) {
        if (this.skillPoints <= 0) return false;
        
        if (this.skillTree.unlockSkill(skillId)) {
            this.skillPoints--;
            return true;
        }
        return false;
    }

    spendAttributePoint(attribute) {
        if (this.attributePoints <= 0) return false;
        
        const validAttributes = ['strength', 'dexterity', 'intelligence'];
        if (!validAttributes.includes(attribute)) return false;

        this.stats[attribute]++;
        this.attributePoints--;
        return true;
    }

    calculateDamage(base, type = 'physical') {
        let damage = base;
        
        // Apply attribute bonuses
        switch (type) {
            case 'physical':
                damage *= (1 + this.stats.strength * 0.01);
                break;
            case 'magic':
                damage *= (1 + this.stats.intelligence * 0.01);
                break;
            case 'ranged':
                damage *= (1 + this.stats.dexterity * 0.01);
                break;
        }

        // Apply critical hit
        if (Math.random() < this.stats.critChance) {
            damage *= this.stats.critMultiplier;
        }

        return Math.floor(damage);
    }

    calculateDefense(damage, type = 'physical') {
        let reduction = this.stats.armor;
        
        // Apply type-specific reductions
        switch (type) {
            case 'magic':
                reduction *= 0.5; // Armor is less effective against magic
                break;
            case 'true':
                reduction = 0; // True damage ignores armor
                break;
        }

        // Damage reduction formula
        const damageReduction = reduction / (reduction + 100);
        return Math.floor(damage * (1 - damageReduction));
    }

    getSkillDamage(skillId) {
        const skill = this.skillTree.getSkill(skillId);
        if (!skill) return 0;

        let damage = skill.baseDamage;

        // Apply skill-specific scaling
        if (skill.scaling) {
            Object.entries(skill.scaling).forEach(([stat, value]) => {
                damage += this.stats[stat] * value;
            });
        }

        return this.calculateDamage(damage, skill.damageType);
    }

    save() {
        return {
            type: this.type,
            level: this.level,
            experience: this.experience,
            skillPoints: this.skillPoints,
            attributePoints: this.attributePoints,
            stats: { ...this.stats },
            equipment: { ...this.equipment },
            skillTree: this.skillTree.save()
        };
    }

    load(data) {
        this.type = data.type;
        this.level = data.level;
        this.experience = data.experience;
        this.skillPoints = data.skillPoints;
        this.attributePoints = data.attributePoints;
        this.stats = { ...data.stats };
        this.equipment = { ...data.equipment };
        this.skillTree.load(data.skillTree);
    }
}
