export class Item {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // weapon, armor, consumable, material
        this.subtype = data.subtype;
        this.rarity = data.rarity; // common, uncommon, rare, epic, legendary
        this.basePrice = data.basePrice;
        this.levelReq = data.levelReq || 1;
        this.classReq = data.classReq || null;
        this.requirements = data.requirements || null;
        this.stats = data.stats || null;
        this.effect = data.effect || null;
        this.stackable = data.stackable || false;
        this.quantity = data.quantity || 1;
        this.durability = data.durability || null;
        this.maxDurability = data.maxDurability || null;
        this.description = data.description || '';
        this.icon = data.icon || null;
        this.model = data.model || null;
        this.quality = 100; // Item quality (affects stats)
        this.enchantments = new Map();
        this.sockets = data.sockets || 0;
        this.socketedItems = new Array(this.sockets).fill(null);
    }

    clone() {
        const clone = new Item({
            id: this.id,
            name: this.name,
            type: this.type,
            subtype: this.subtype,
            rarity: this.rarity,
            basePrice: this.basePrice,
            levelReq: this.levelReq,
            classReq: this.classReq,
            requirements: { ...this.requirements },
            stats: { ...this.stats },
            effect: { ...this.effect },
            stackable: this.stackable,
            quantity: this.quantity,
            durability: this.durability,
            maxDurability: this.maxDurability,
            description: this.description,
            icon: this.icon,
            model: this.model,
            sockets: this.sockets
        });

        clone.quality = this.quality;
        clone.enchantments = new Map(this.enchantments);
        clone.socketedItems = [...this.socketedItems];

        return clone;
    }

    getEffectiveStats() {
        if (!this.stats) return null;

        const effectiveStats = { ...this.stats };

        // Apply quality modifier
        const qualityMod = this.quality / 100;
        for (const [stat, value] of Object.entries(effectiveStats)) {
            if (typeof value === 'number') {
                effectiveStats[stat] = Math.floor(value * qualityMod);
            }
        }

        // Add enchantment stats
        for (const enchant of this.enchantments.values()) {
            for (const [stat, value] of Object.entries(enchant.stats)) {
                effectiveStats[stat] = (effectiveStats[stat] || 0) + value;
            }
        }

        // Add socketed item stats
        for (const socket of this.socketedItems) {
            if (socket) {
                for (const [stat, value] of Object.entries(socket.stats)) {
                    effectiveStats[stat] = (effectiveStats[stat] || 0) + value;
                }
            }
        }

        return effectiveStats;
    }

    addEnchantment(enchantment) {
        if (this.enchantments.size >= 3) return false; // Max 3 enchantments
        this.enchantments.set(enchantment.id, enchantment);
        return true;
    }

    removeEnchantment(enchantmentId) {
        return this.enchantments.delete(enchantmentId);
    }

    socketItem(item, slot) {
        if (slot < 0 || slot >= this.sockets) return false;
        if (this.socketedItems[slot]) return false;
        
        this.socketedItems[slot] = item;
        return true;
    }

    unsocketItem(slot) {
        if (slot < 0 || slot >= this.sockets) return null;
        const item = this.socketedItems[slot];
        this.socketedItems[slot] = null;
        return item;
    }

    repair() {
        if (this.durability === null) return false;
        this.durability = this.maxDurability;
        return true;
    }

    damage(amount) {
        if (this.durability === null) return false;
        this.durability = Math.max(0, this.durability - amount);
        return true;
    }

    isBroken() {
        return this.durability !== null && this.durability <= 0;
    }

    use(target) {
        if (!this.effect) return false;

        switch (this.effect.type) {
            case 'heal':
                if (target.health) {
                    target.health = Math.min(
                        target.health + this.effect.value,
                        target.maxHealth
                    );
                    return true;
                }
                break;

            case 'restore-mana':
                if (target.mana) {
                    target.mana = Math.min(
                        target.mana + this.effect.value,
                        target.maxMana
                    );
                    return true;
                }
                break;

            case 'buff':
                if (target.addBuff) {
                    target.addBuff(this.effect.buff);
                    return true;
                }
                break;
        }

        return false;
    }

    getDisplayName() {
        let name = this.name;
        
        // Add quality prefix
        if (this.quality < 50) name = 'Damaged ' + name;
        else if (this.quality > 150) name = 'Superior ' + name;

        // Add rarity color (for UI)
        const rarityColors = {
            common: '#ffffff',
            uncommon: '#1eff00',
            rare: '#0070dd',
            epic: '#a335ee',
            legendary: '#ff8000'
        };

        return `<span style="color: ${rarityColors[this.rarity]}">${name}</span>`;
    }

    getTooltip() {
        let tooltip = `${this.getDisplayName()}\n`;
        tooltip += `${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`;
        if (this.subtype) tooltip += ` - ${this.subtype}`;
        tooltip += '\n';

        if (this.levelReq) tooltip += `Required Level: ${this.levelReq}\n`;
        if (this.classReq) tooltip += `Required Class: ${this.classReq}\n`;

        if (this.requirements) {
            tooltip += 'Requirements:\n';
            for (const [stat, value] of Object.entries(this.requirements)) {
                tooltip += `  ${stat}: ${value}\n`;
            }
        }

        const stats = this.getEffectiveStats();
        if (stats) {
            tooltip += 'Stats:\n';
            for (const [stat, value] of Object.entries(stats)) {
                tooltip += `  ${stat}: ${value}\n`;
            }
        }

        if (this.effect) {
            tooltip += `Use: ${this.effect.description}\n`;
        }

        if (this.durability !== null) {
            tooltip += `Durability: ${this.durability}/${this.maxDurability}\n`;
        }

        if (this.enchantments.size > 0) {
            tooltip += 'Enchantments:\n';
            for (const enchant of this.enchantments.values()) {
                tooltip += `  ${enchant.name}\n`;
            }
        }

        if (this.sockets > 0) {
            tooltip += `Sockets: ${this.socketedItems.filter(Boolean).length}/${this.sockets}\n`;
        }

        return tooltip;
    }

    save() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            subtype: this.subtype,
            rarity: this.rarity,
            basePrice: this.basePrice,
            levelReq: this.levelReq,
            classReq: this.classReq,
            requirements: this.requirements,
            stats: this.stats,
            effect: this.effect,
            stackable: this.stackable,
            quantity: this.quantity,
            durability: this.durability,
            maxDurability: this.maxDurability,
            description: this.description,
            icon: this.icon,
            model: this.model,
            quality: this.quality,
            enchantments: Array.from(this.enchantments.entries()),
            sockets: this.sockets,
            socketedItems: this.socketedItems.map(item => item ? item.save() : null)
        };
    }

    load(data) {
        Object.assign(this, data);
        this.enchantments = new Map(data.enchantments);
        this.socketedItems = data.socketedItems.map(itemData => 
            itemData ? new Item(itemData) : null
        );
    }
}
