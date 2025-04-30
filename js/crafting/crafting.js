import { Item } from '../shop/item.js';

export default class CraftingSystem {
    constructor() {
        this.recipes = new Map();
        this.initializeRecipes();
    }

    initializeRecipes() {
        // Weapons
        this.addRecipe({
            id: 'steel-sword',
            name: 'Steel Sword',
            type: 'weapon',
            materials: {
                'iron-ingot': 3,
                'steel-ingot': 2,
                'leather-strip': 1
            },
            result: new Item({
                id: 'steel-sword',
                name: 'Steel Sword',
                type: 'weapon',
                subtype: 'sword',
                rarity: 'uncommon',
                basePrice: 200,
                levelReq: 5,
                stats: {
                    attackPower: 15,
                    strength: 8
                },
                requirements: {
                    strength: 12
                }
            }),
            skillReq: {
                blacksmithing: 2
            }
        });

        // Armor
        this.addRecipe({
            id: 'steel-plate-armor',
            name: 'Steel Plate Armor',
            type: 'armor',
            materials: {
                'iron-ingot': 4,
                'steel-ingot': 3,
                'leather': 2
            },
            result: new Item({
                id: 'steel-plate-armor',
                name: 'Steel Plate Armor',
                type: 'armor',
                subtype: 'chest',
                rarity: 'uncommon',
                basePrice: 300,
                levelReq: 8,
                stats: {
                    armor: 20,
                    strength: 8
                },
                requirements: {
                    strength: 15
                }
            }),
            skillReq: {
                blacksmithing: 3
            }
        });

        // Potions
        this.addRecipe({
            id: 'greater-health-potion',
            name: 'Greater Health Potion',
            type: 'consumable',
            materials: {
                'health-herb': 3,
                'magic-crystal': 1,
                'water-essence': 1
            },
            result: new Item({
                id: 'greater-health-potion',
                name: 'Greater Health Potion',
                type: 'consumable',
                subtype: 'potion',
                rarity: 'uncommon',
                basePrice: 50,
                stackable: true,
                effect: {
                    type: 'heal',
                    value: 100
                }
            }),
            skillReq: {
                alchemy: 2
            }
        });

        // Enchantments
        this.addRecipe({
            id: 'fire-enchant',
            name: 'Fire Enchantment',
            type: 'enchantment',
            materials: {
                'magic-crystal': 2,
                'fire-essence': 1,
                'ancient-scroll': 1
            },
            result: {
                id: 'fire-enchant',
                name: 'Fire Enchantment',
                stats: {
                    attackPower: 5,
                    'fire-damage': 10
                },
                effect: {
                    type: 'burn',
                    damage: 5,
                    duration: 3
                }
            },
            skillReq: {
                enchanting: 3
            }
        });
    }

    addRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
    }

    getRecipe(recipeId) {
        return this.recipes.get(recipeId);
    }

    canCraft(recipeId, inventory, skills) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;

        // Check skill requirements
        if (recipe.skillReq) {
            for (const [skill, level] of Object.entries(recipe.skillReq)) {
                if (!skills[skill] || skills[skill] < level) {
                    return false;
                }
            }
        }

        // Check materials
        for (const [materialId, quantity] of Object.entries(recipe.materials)) {
            const material = inventory.get(materialId);
            if (!material || material.quantity < quantity) {
                return false;
            }
        }

        return true;
    }

    craft(recipeId, inventory, skills) {
        if (!this.canCraft(recipeId, inventory, skills)) {
            return null;
        }

        const recipe = this.recipes.get(recipeId);

        // Consume materials
        for (const [materialId, quantity] of Object.entries(recipe.materials)) {
            const material = inventory.get(materialId);
            material.quantity -= quantity;
            if (material.quantity <= 0) {
                inventory.delete(materialId);
            }
        }

        // Calculate quality based on skill level
        let quality = 100;
        if (recipe.skillReq) {
            const mainSkill = Object.keys(recipe.skillReq)[0];
            const skillLevel = skills[mainSkill];
            const reqLevel = recipe.skillReq[mainSkill];
            quality += (skillLevel - reqLevel) * 10;
        }

        // Create result item
        let result;
        if (recipe.type === 'enchantment') {
            result = { ...recipe.result };
        } else {
            result = recipe.result.clone();
            result.quality = quality;
        }

        // Create crafting effect
        this.createCraftingEffect(recipe);

        // Grant crafting experience
        this.grantCraftingExperience(recipe, skills);

        return result;
    }

    createCraftingEffect(recipe) {
        // Create particle effects based on recipe type
        const effects = {
            weapon: {
                color: 0xff0000,
                sparks: true,
                sound: 'hammer'
            },
            armor: {
                color: 0x00ff00,
                sparks: true,
                sound: 'anvil'
            },
            consumable: {
                color: 0x0000ff,
                bubbles: true,
                sound: 'bubble'
            },
            enchantment: {
                color: 0xff00ff,
                magic: true,
                sound: 'magic'
            }
        };

        const effect = effects[recipe.type];
        if (effect) {
            // Emit crafting event for effects
            const event = new CustomEvent('itemCrafted', {
                detail: {
                    recipe: recipe,
                    effect: effect
                }
            });
            document.dispatchEvent(event);
        }
    }

    grantCraftingExperience(recipe, skills) {
        if (!recipe.skillReq) return;

        const baseXP = {
            common: 10,
            uncommon: 20,
            rare: 40,
            epic: 80,
            legendary: 160
        }[recipe.result.rarity] || 10;

        for (const [skill, level] of Object.entries(recipe.skillReq)) {
            const xp = baseXP * level;
            if (skills[skill]) {
                skills[skill].gainExperience(xp);
            }
        }
    }

    getAvailableRecipes(inventory, skills) {
        const available = new Map();
        for (const [id, recipe] of this.recipes) {
            if (this.canCraft(id, inventory, skills)) {
                available.set(id, recipe);
            }
        }
        return available;
    }

    getRecipesByType(type) {
        const filtered = new Map();
        for (const [id, recipe] of this.recipes) {
            if (recipe.type === type) {
                filtered.set(id, recipe);
            }
        }
        return filtered;
    }

    getRecipesBySkill(skill) {
        const filtered = new Map();
        for (const [id, recipe] of this.recipes) {
            if (recipe.skillReq && recipe.skillReq[skill]) {
                filtered.set(id, recipe);
            }
        }
        return filtered;
    }
}
