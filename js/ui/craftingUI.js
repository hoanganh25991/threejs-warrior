import CraftingSystem from '../crafting/crafting.js';

export default class CraftingUI {
    constructor(hero) {
        this.hero = hero;
        this.craftingSystem = new CraftingSystem();
        this.isOpen = false;
        this.selectedRecipe = null;
        
        // Load inventory from localStorage or initialize empty
        this.inventory = this.loadInventory();
        
        // Initialize player skills (simplified for demo)
        this.skills = this.loadSkills();
        
        // Store original input handler state
        this.originalInputState = null;
        
        this.init();
    }
    
    init() {
        // Create UI elements
        this.createCraftingButton();
        this.createCraftingPanel();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    createCraftingButton() {
        // Create a button to open crafting UI
        this.craftingButton = document.createElement('button');
        this.craftingButton.id = 'crafting-button';
        this.craftingButton.textContent = 'Crafting';
        this.craftingButton.className = 'game-button';
        document.body.appendChild(this.craftingButton);
        
        // Add styles for the button
        const style = document.createElement('style');
        style.textContent = `
            #crafting-button {
                position: fixed;
                top: 66px;
                right: 10px;
                padding: 10px 20px;
                background-color: #4a2b0f;
                color: #fff;
                border: 2px solid #6b3e1c;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s;
                pointer-events: auto;
            }
            
            #crafting-button:hover {
                background-color: #6b3e1c;
            }
        `;
        document.head.appendChild(style);
    }
    
    createCraftingPanel() {
        // Create the main crafting panel
        this.panel = document.createElement('div');
        this.panel.id = 'crafting-panel';
        this.panel.className = 'game-panel';
        this.panel.style.display = 'none';
        
        // Create panel content
        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>Crafting</h2>
                <button id="close-crafting" class="close-button">×</button>
            </div>
            <div class="panel-content">
                <div class="crafting-container">
                    <div class="recipe-list">
                        <h3>Recipes</h3>
                        <div class="recipe-categories">
                            <button class="category-btn active" data-category="all">All</button>
                            <button class="category-btn" data-category="weapon">Weapons</button>
                            <button class="category-btn" data-category="armor">Armor</button>
                            <button class="category-btn" data-category="consumable">Potions</button>
                            <button class="category-btn" data-category="enchantment">Enchantments</button>
                        </div>
                        <div id="recipe-items"></div>
                    </div>
                    <div class="crafting-details">
                        <div id="recipe-details">
                            <p class="select-recipe-prompt">Select a recipe to view details</p>
                        </div>
                        <div class="crafting-actions">
                            <button id="craft-button" class="craft-button" disabled>Craft</button>
                        </div>
                    </div>
                </div>
                <div class="inventory-container">
                    <h3>Inventory</h3>
                    <div id="inventory-items"></div>
                    <button id="add-materials" class="add-materials-button">Add Test Materials</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        // Add styles for the crafting panel
        const style = document.createElement('style');
        style.textContent = `
            #crafting-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                height: 600px;
                background-color: rgba(30, 30, 30, 0.95);
                border: 2px solid #6b3e1c;
                border-radius: 10px;
                color: #fff;
                z-index: 1001;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                pointer-events: auto;
            }
            
            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 20px;
                background-color: #4a2b0f;
                border-bottom: 2px solid #6b3e1c;
            }
            
            .panel-header h2 {
                margin: 0;
                font-size: 24px;
            }
            
            .close-button {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
            }
            
            .panel-content {
                display: flex;
                flex-direction: column;
                padding: 20px;
                overflow-y: auto;
                flex: 1;
            }
            
            .crafting-container {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                height: 350px;
            }
            
            .recipe-list {
                flex: 1;
                border: 1px solid #6b3e1c;
                border-radius: 5px;
                padding: 10px;
                overflow-y: auto;
            }
            
            .recipe-categories {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            
            .category-btn {
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .category-btn.active {
                background-color: #6b3e1c;
            }
            
            #recipe-items {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .recipe-item {
                padding: 8px;
                border: 1px solid #555;
                border-radius: 3px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .recipe-item:hover {
                background-color: #444;
            }
            
            .recipe-item.selected {
                background-color: #6b3e1c;
            }
            
            .crafting-details {
                flex: 1;
                border: 1px solid #6b3e1c;
                border-radius: 5px;
                padding: 10px;
                display: flex;
                flex-direction: column;
            }
            
            #recipe-details {
                flex: 1;
                overflow-y: auto;
            }
            
            .select-recipe-prompt {
                text-align: center;
                margin-top: 50px;
                color: #aaa;
            }
            
            .crafting-actions {
                display: flex;
                justify-content: center;
                margin-top: 10px;
            }
            
            .craft-button {
                padding: 10px 20px;
                background-color: #4a2b0f;
                color: #fff;
                border: 2px solid #6b3e1c;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .craft-button:hover:not(:disabled) {
                background-color: #6b3e1c;
            }
            
            .craft-button:disabled {
                background-color: #333;
                border-color: #555;
                color: #777;
                cursor: not-allowed;
            }
            
            .inventory-container {
                border: 1px solid #6b3e1c;
                border-radius: 5px;
                padding: 10px;
            }
            
            #inventory-items {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 10px;
                margin-bottom: 10px;
            }
            
            .inventory-item {
                background-color: #333;
                border: 1px solid #555;
                border-radius: 3px;
                padding: 5px 10px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .material-sufficient {
                color: #5cb85c;
            }
            
            .material-insufficient {
                color: #d9534f;
            }
            
            .item-rarity-common {
                color: #aaa;
            }
            
            .item-rarity-uncommon {
                color: #2ecc71;
            }
            
            .item-rarity-rare {
                color: #3498db;
            }
            
            .item-rarity-epic {
                color: #9b59b6;
            }
            
            .item-rarity-legendary {
                color: #f1c40f;
            }
            
            .add-materials-button {
                padding: 5px 10px;
                background-color: #333;
                color: #fff;
                border: 1px solid #555;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .add-materials-button:hover {
                background-color: #444;
            }
            
            .stat-item {
                margin: 2px 0;
            }
            
            .requirement-item {
                margin: 2px 0;
            }
            
            .requirement-met {
                color: #5cb85c;
            }
            
            .requirement-not-met {
                color: #d9534f;
            }
        `;
        document.head.appendChild(style);
    }
    
    addEventListeners() {
        // Toggle crafting panel
        this.craftingButton.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // Close panel button
        document.getElementById('close-crafting').addEventListener('click', () => {
            this.closePanel();
        });
        
        // Category filter buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Update active button
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Filter recipes
                const category = e.target.dataset.category;
                this.filterRecipes(category);
            });
        });
        
        // Craft button
        document.getElementById('craft-button').addEventListener('click', () => {
            this.craftItem();
        });
        
        // Add test materials button
        document.getElementById('add-materials').addEventListener('click', () => {
            this.addTestMaterials();
        });
        
        // Add escape key handler to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closePanel();
            }
        });
    }
    
    togglePanel() {
        this.isOpen = !this.isOpen;
        this.panel.style.display = this.isOpen ? 'flex' : 'none';
        
        if (this.isOpen) {
            // Disable mouse capture for camera control
            this.disableMouseCapture();
            
            // Refresh UI
            this.refreshRecipeList();
            this.refreshInventory();
        } else {
            // Re-enable mouse capture for camera control
            this.enableMouseCapture();
        }
    }
    
    closePanel() {
        this.isOpen = false;
        this.panel.style.display = 'none';
        
        // Re-enable mouse capture for camera control
        this.enableMouseCapture();
    }
    
    disableMouseCapture() {
        // Use mouse capture manager if available
        if (window.mouseCaptureManager) {
            window.mouseCaptureManager.disableMouseCapture('crafting-ui');
        } 
        // Fallback to direct input handler access
        else if (window.inputHandler) {
            // Store original state
            this.originalInputState = {
                isMouseCaptured: window.inputHandler.isMouseCaptured,
                isPointerLocked: document.pointerLockElement !== null
            };
            
            // Disable mouse capture
            window.inputHandler.isMouseCaptured = false;
            
            // Exit pointer lock if active
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            
            console.log('Mouse capture disabled for crafting UI');
        }
    }
    
    enableMouseCapture() {
        // Use mouse capture manager if available
        if (window.mouseCaptureManager) {
            window.mouseCaptureManager.enableMouseCapture('crafting-ui');
        }
        // Fallback to direct input handler access
        else if (window.inputHandler && this.originalInputState) {
            // Restore original state
            window.inputHandler.isMouseCaptured = this.originalInputState.isMouseCaptured;
            
            // Reset stored state
            this.originalInputState = null;
            
            console.log('Mouse capture re-enabled');
        }
    }
    
    refreshRecipeList(category = 'all') {
        const recipeContainer = document.getElementById('recipe-items');
        recipeContainer.innerHTML = '';
        
        let recipes;
        if (category === 'all') {
            recipes = Array.from(this.craftingSystem.recipes.entries());
        } else {
            recipes = Array.from(this.craftingSystem.getRecipesByType(category).entries());
        }
        
        if (recipes.length === 0) {
            recipeContainer.innerHTML = '<p class="no-recipes">No recipes found</p>';
            return;
        }
        
        recipes.forEach(([id, recipe]) => {
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe-item';
            if (this.selectedRecipe && this.selectedRecipe.id === id) {
                recipeElement.classList.add('selected');
            }
            
            const canCraft = this.craftingSystem.canCraft(id, this.inventory, this.skills);
            const rarityClass = recipe.result.rarity ? `item-rarity-${recipe.result.rarity}` : '';
            
            recipeElement.innerHTML = `
                <div class="recipe-name ${rarityClass}">${recipe.name}</div>
                <div class="recipe-type">${this.capitalizeFirstLetter(recipe.type)}</div>
            `;
            
            recipeElement.addEventListener('click', () => {
                this.selectRecipe(id);
            });
            
            recipeContainer.appendChild(recipeElement);
        });
    }
    
    filterRecipes(category) {
        this.refreshRecipeList(category);
    }
    
    selectRecipe(recipeId) {
        // Update selected recipe
        this.selectedRecipe = this.craftingSystem.getRecipe(recipeId);
        
        // Update UI
        const recipeItems = document.querySelectorAll('.recipe-item');
        recipeItems.forEach(item => {
            item.classList.remove('selected');
            if (item.querySelector('.recipe-name').textContent === this.selectedRecipe.name) {
                item.classList.add('selected');
            }
        });
        
        // Update recipe details
        this.updateRecipeDetails();
        
        // Update craft button
        const craftButton = document.getElementById('craft-button');
        const canCraft = this.craftingSystem.canCraft(recipeId, this.inventory, this.skills);
        craftButton.disabled = !canCraft;
    }
    
    updateRecipeDetails() {
        const detailsContainer = document.getElementById('recipe-details');
        
        if (!this.selectedRecipe) {
            detailsContainer.innerHTML = '<p class="select-recipe-prompt">Select a recipe to view details</p>';
            return;
        }
        
        const recipe = this.selectedRecipe;
        const result = recipe.result;
        const rarityClass = result.rarity ? `item-rarity-${result.rarity}` : '';
        
        // Check if player can craft this item
        const canCraft = this.craftingSystem.canCraft(recipe.id, this.inventory, this.skills);
        
        let statsHtml = '';
        if (result.stats) {
            statsHtml = '<div class="result-stats"><h4>Stats:</h4>';
            for (const [stat, value] of Object.entries(result.stats)) {
                statsHtml += `<div class="stat-item">${this.formatStatName(stat)}: +${value}</div>`;
            }
            statsHtml += '</div>';
        }
        
        let requirementsHtml = '';
        if (result.requirements) {
            requirementsHtml = '<div class="result-requirements"><h4>Requirements:</h4>';
            for (const [req, value] of Object.entries(result.requirements)) {
                const playerValue = this.hero ? (this.hero[req] || 0) : 0;
                const meetsReq = playerValue >= value;
                const reqClass = meetsReq ? 'requirement-met' : 'requirement-not-met';
                requirementsHtml += `<div class="requirement-item ${reqClass}">${this.formatStatName(req)}: ${value}</div>`;
            }
            requirementsHtml += '</div>';
        }
        
        let effectHtml = '';
        if (result.effect) {
            effectHtml = '<div class="result-effect"><h4>Effect:</h4>';
            effectHtml += `<div>${this.formatEffectDescription(result.effect)}</div>`;
            effectHtml += '</div>';
        }
        
        // Generate materials list with availability indicators
        let materialsHtml = '<div class="required-materials"><h4>Required Materials:</h4>';
        for (const [materialId, quantity] of Object.entries(recipe.materials)) {
            const material = this.inventory.get(materialId);
            const available = material ? material.quantity : 0;
            const isSufficient = available >= quantity;
            const statusClass = isSufficient ? 'material-sufficient' : 'material-insufficient';
            
            materialsHtml += `
                <div class="material-item ${statusClass}">
                    ${this.formatMaterialName(materialId)}: ${available}/${quantity}
                </div>
            `;
        }
        materialsHtml += '</div>';
        
        // Generate skill requirements
        let skillReqHtml = '';
        if (recipe.skillReq) {
            skillReqHtml = '<div class="skill-requirements"><h4>Skill Requirements:</h4>';
            for (const [skill, level] of Object.entries(recipe.skillReq)) {
                const playerSkill = this.skills[skill] || 0;
                const meetsReq = playerSkill >= level;
                const reqClass = meetsReq ? 'requirement-met' : 'requirement-not-met';
                
                skillReqHtml += `
                    <div class="skill-req-item ${reqClass}">
                        ${this.formatSkillName(skill)}: ${playerSkill}/${level}
                    </div>
                `;
            }
            skillReqHtml += '</div>';
        }
        
        detailsContainer.innerHTML = `
            <div class="recipe-detail-header">
                <h3 class="${rarityClass}">${recipe.name}</h3>
                <div class="recipe-type">${this.capitalizeFirstLetter(recipe.type)}</div>
            </div>
            <div class="recipe-detail-content">
                ${statsHtml}
                ${requirementsHtml}
                ${effectHtml}
                ${materialsHtml}
                ${skillReqHtml}
                <div class="craft-status">
                    ${canCraft ? 
                        '<div class="can-craft">Ready to craft!</div>' : 
                        '<div class="cannot-craft">Cannot craft - missing requirements</div>'}
                </div>
            </div>
        `;
    }
    
    refreshInventory() {
        const inventoryContainer = document.getElementById('inventory-items');
        inventoryContainer.innerHTML = '';
        
        if (this.inventory.size === 0) {
            inventoryContainer.innerHTML = '<p class="no-items">No materials in inventory</p>';
            return;
        }
        
        for (const [itemId, item] of this.inventory.entries()) {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.innerHTML = `
                <span class="item-name">${this.formatMaterialName(itemId)}</span>
                <span class="item-quantity">x${item.quantity}</span>
            `;
            inventoryContainer.appendChild(itemElement);
        }
    }
    
    craftItem() {
        if (!this.selectedRecipe) return;
        
        const recipeId = this.selectedRecipe.id;
        if (!this.craftingSystem.canCraft(recipeId, this.inventory, this.skills)) {
            return;
        }
        
        // Craft the item
        const result = this.craftingSystem.craft(recipeId, this.inventory, this.skills);
        
        if (result) {
            // Show crafting success message
            this.showCraftingResult(result);
            
            // Update inventory display
            this.refreshInventory();
            
            // Update recipe details (material counts may have changed)
            this.updateRecipeDetails();
            
            // Update craft button state
            const craftButton = document.getElementById('craft-button');
            const canCraft = this.craftingSystem.canCraft(recipeId, this.inventory, this.skills);
            craftButton.disabled = !canCraft;
            
            // Save inventory to localStorage
            this.saveInventory();
            
            // Save skills to localStorage (they might have gained XP)
            this.saveSkills();
        }
    }
    
    showCraftingResult(result) {
        // Create a floating notification
        const notification = document.createElement('div');
        notification.className = 'crafting-notification';
        
        const rarityClass = result.rarity ? `item-rarity-${result.rarity}` : '';
        
        notification.innerHTML = `
            <div class="notification-content">
                <h4>Item Crafted!</h4>
                <div class="crafted-item ${rarityClass}">${result.name}</div>
                <div class="crafted-quality">Quality: ${result.quality || 100}%</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles for the notification
        const style = document.createElement('style');
        style.textContent = `
            .crafting-notification {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(30, 30, 30, 0.9);
                border: 2px solid #6b3e1c;
                border-radius: 5px;
                padding: 15px;
                color: white;
                z-index: 1002;
                animation: fadeInOut 3s forwards;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; }
                10% { opacity: 1; }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            .notification-content {
                text-align: center;
            }
            
            .crafted-item {
                font-size: 18px;
                margin: 10px 0;
            }
            
            .crafted-quality {
                font-size: 14px;
                color: #aaa;
            }
        `;
        document.head.appendChild(style);
        
        // Remove notification after animation completes
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    addTestMaterials() {
        // Add some test materials to inventory
        const testMaterials = {
            'iron-ingot': 10,
            'steel-ingot': 10,
            'leather-strip': 10,
            'leather': 10,
            'health-herb': 10,
            'magic-crystal': 10,
            'water-essence': 10,
            'fire-essence': 10,
            'ancient-scroll': 10
        };
        
        for (const [materialId, quantity] of Object.entries(testMaterials)) {
            const existingMaterial = this.inventory.get(materialId);
            if (existingMaterial) {
                existingMaterial.quantity += quantity;
            } else {
                this.inventory.set(materialId, {
                    id: materialId,
                    name: this.formatMaterialName(materialId),
                    quantity: quantity
                });
            }
        }
        
        // Refresh inventory display
        this.refreshInventory();
        
        // Update recipe details (material counts may have changed)
        if (this.selectedRecipe) {
            this.updateRecipeDetails();
            
            // Update craft button state
            const craftButton = document.getElementById('craft-button');
            const canCraft = this.craftingSystem.canCraft(this.selectedRecipe.id, this.inventory, this.skills);
            craftButton.disabled = !canCraft;
        }
        
        // Save inventory to localStorage
        this.saveInventory();
    }
    
    // Helper methods
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    formatMaterialName(materialId) {
        return materialId
            .split('-')
            .map(word => this.capitalizeFirstLetter(word))
            .join(' ');
    }
    
    formatStatName(stat) {
        return stat
            .split(/(?=[A-Z])/)
            .join(' ')
            .split('-')
            .map(word => this.capitalizeFirstLetter(word))
            .join(' ');
    }
    
    formatSkillName(skill) {
        return this.capitalizeFirstLetter(skill);
    }
    
    formatEffectDescription(effect) {
        let description = '';
        
        if (effect.type === 'heal') {
            description = `Heals ${effect.value} health points`;
        } else if (effect.type === 'burn') {
            description = `Burns target for ${effect.damage} damage over ${effect.duration} seconds`;
        } else {
            description = `${this.capitalizeFirstLetter(effect.type)} effect`;
        }
        
        return description;
    }
    
    // LocalStorage methods
    loadInventory() {
        const savedInventory = localStorage.getItem('craftingInventory');
        if (savedInventory) {
            try {
                const parsed = JSON.parse(savedInventory);
                return new Map(parsed);
            } catch (e) {
                console.error('Failed to parse inventory from localStorage:', e);
            }
        }
        return new Map();
    }
    
    saveInventory() {
        const serialized = JSON.stringify(Array.from(this.inventory.entries()));
        localStorage.setItem('craftingInventory', serialized);
    }
    
    loadSkills() {
        const savedSkills = localStorage.getItem('craftingSkills');
        if (savedSkills) {
            try {
                return JSON.parse(savedSkills);
            } catch (e) {
                console.error('Failed to parse skills from localStorage:', e);
            }
        }
        // Default skills
        return {
            blacksmithing: 1,
            alchemy: 1,
            enchanting: 1
        };
    }
    
    saveSkills() {
        localStorage.setItem('craftingSkills', JSON.stringify(this.skills));
    }
}