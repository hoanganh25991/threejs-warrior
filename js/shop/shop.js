import * as THREE from 'three';
import { Item } from './item.js';

export class Shop {
    constructor(scene) {
        this.scene = scene;
        this.inventory = new Map();
        this.gold = 1000; // Shop's gold for buying items from players
        this.markup = 1.5; // Price multiplier when selling to players
        this.discount = 0.5; // Price multiplier when buying from players
        
        // Initialize shop inventory
        this.restockInventory();
    }

    restockInventory() {
        // Clear current inventory
        this.inventory.clear();

        // Add weapons
        this.addItem(new Item({
            id: 'iron-sword',
            name: 'Iron Sword',
            type: 'weapon',
            subtype: 'sword',
            rarity: 'common',
            basePrice: 100,
            levelReq: 1,
            stats: {
                attackPower: 10,
                strength: 5
            },
            requirements: {
                strength: 10
            }
        }));

        this.addItem(new Item({
            id: 'fire-staff',
            name: 'Fire Staff',
            type: 'weapon',
            subtype: 'staff',
            rarity: 'rare',
            basePrice: 300,
            levelReq: 5,
            stats: {
                spellPower: 15,
                intelligence: 10,
                critChance: 0.05
            },
            requirements: {
                intelligence: 15
            }
        }));

        // Add armor
        this.addItem(new Item({
            id: 'leather-armor',
            name: 'Leather Armor',
            type: 'armor',
            subtype: 'chest',
            rarity: 'common',
            basePrice: 80,
            levelReq: 1,
            stats: {
                armor: 5,
                dexterity: 3
            }
        }));

        this.addItem(new Item({
            id: 'plate-armor',
            name: 'Plate Armor',
            type: 'armor',
            subtype: 'chest',
            rarity: 'uncommon',
            basePrice: 200,
            levelReq: 5,
            stats: {
                armor: 15,
                strength: 5
            },
            requirements: {
                strength: 12
            }
        }));

        // Add consumables
        this.addItem(new Item({
            id: 'health-potion',
            name: 'Health Potion',
            type: 'consumable',
            subtype: 'potion',
            rarity: 'common',
            basePrice: 20,
            stackable: true,
            quantity: 10,
            effect: {
                type: 'heal',
                value: 50
            }
        }));

        this.addItem(new Item({
            id: 'mana-potion',
            name: 'Mana Potion',
            type: 'consumable',
            subtype: 'potion',
            rarity: 'common',
            basePrice: 20,
            stackable: true,
            quantity: 10,
            effect: {
                type: 'restore-mana',
                value: 50
            }
        }));

        // Add crafting materials
        this.addItem(new Item({
            id: 'iron-ingot',
            name: 'Iron Ingot',
            type: 'material',
            subtype: 'metal',
            rarity: 'common',
            basePrice: 30,
            stackable: true,
            quantity: 20
        }));

        this.addItem(new Item({
            id: 'magic-crystal',
            name: 'Magic Crystal',
            type: 'material',
            subtype: 'crystal',
            rarity: 'uncommon',
            basePrice: 50,
            stackable: true,
            quantity: 10
        }));
    }

    addItem(item, quantity = 1) {
        if (this.inventory.has(item.id)) {
            const existingItem = this.inventory.get(item.id);
            if (existingItem.stackable) {
                existingItem.quantity += quantity;
            }
        } else {
            if (item.stackable) {
                item.quantity = quantity;
            }
            this.inventory.set(item.id, item);
        }
    }

    removeItem(itemId, quantity = 1) {
        const item = this.inventory.get(itemId);
        if (!item) return false;

        if (item.stackable) {
            item.quantity -= quantity;
            if (item.quantity <= 0) {
                this.inventory.delete(itemId);
            }
        } else {
            this.inventory.delete(itemId);
        }
        return true;
    }

    getSellingPrice(item) {
        return Math.floor(item.basePrice * this.markup);
    }

    getBuyingPrice(item) {
        return Math.floor(item.basePrice * this.discount);
    }

    sellToPlayer(itemId, player, quantity = 1) {
        const item = this.inventory.get(itemId);
        if (!item) return false;

        if (item.stackable && quantity > item.quantity) {
            return false;
        }

        const totalPrice = this.getSellingPrice(item) * quantity;
        if (player.gold < totalPrice) {
            return false;
        }

        // Check level requirement
        if (item.levelReq && player.level < item.levelReq) {
            return false;
        }

        // Check stat requirements
        if (item.requirements) {
            for (const [stat, value] of Object.entries(item.requirements)) {
                if (player.stats[stat] < value) {
                    return false;
                }
            }
        }

        // Transfer item and gold
        const soldItem = item.clone();
        if (soldItem.stackable) {
            soldItem.quantity = quantity;
        }

        if (player.addItem(soldItem)) {
            player.gold -= totalPrice;
            this.gold += totalPrice;
            this.removeItem(itemId, quantity);

            // Create purchase effect
            this.createPurchaseEffect(player, item);
            return true;
        }

        return false;
    }

    buyFromPlayer(itemId, player, quantity = 1) {
        const item = player.inventory.get(itemId);
        if (!item) return false;

        if (item.stackable && quantity > item.quantity) {
            return false;
        }

        const totalPrice = this.getBuyingPrice(item) * quantity;
        if (this.gold < totalPrice) {
            return false;
        }

        // Transfer item and gold
        if (player.removeItem(itemId, quantity)) {
            const boughtItem = item.clone();
            if (boughtItem.stackable) {
                boughtItem.quantity = quantity;
            }

            this.addItem(boughtItem);
            player.gold += totalPrice;
            this.gold -= totalPrice;

            // Create sell effect
            this.createSellEffect(player, item);
            return true;
        }

        return false;
    }

    createPurchaseEffect(player, item) {
        // Emit purchase event for UI and sound effects
        const event = new CustomEvent('itemPurchased', {
            detail: {
                player: player,
                item: item
            }
        });
        document.dispatchEvent(event);
    }

    createSellEffect(player, item) {
        // Emit sell event for UI and sound effects
        const event = new CustomEvent('itemSold', {
            detail: {
                player: player,
                item: item
            }
        });
        document.dispatchEvent(event);
    }

    getInventoryByType(type) {
        const filtered = new Map();
        for (const [id, item] of this.inventory) {
            if (item.type === type) {
                filtered.set(id, item);
            }
        }
        return filtered;
    }

    getInventoryByRarity(rarity) {
        const filtered = new Map();
        for (const [id, item] of this.inventory) {
            if (item.rarity === rarity) {
                filtered.set(id, item);
            }
        }
        return filtered;
    }

    save() {
        return {
            gold: this.gold,
            inventory: Array.from(this.inventory.entries())
        };
    }

    load(data) {
        this.gold = data.gold;
        this.inventory = new Map(data.inventory);
    }
}
