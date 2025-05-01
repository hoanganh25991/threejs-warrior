import * as THREE from 'three';

export default class ShopUI {
    constructor(hero, shop) {
        this.hero = hero;
        this.shop = shop;
        this.isOpen = false;
        this.selectedTab = 'weapons';
        this.selectedItem = null;
        this.filterRarity = 'all';
        
        // Initialize UI elements
        this.initUI();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    initUI() {
        // Get UI elements
        this.shopModal = document.getElementById('shop-modal');
        this.shopContent = document.getElementById('shop-content');
        this.shopTabs = document.getElementById('shop-tabs');
        this.itemsContainer = document.getElementById('shop-items');
        this.itemDetails = document.getElementById('item-details');
        this.playerGold = document.getElementById('player-gold');
        this.shopGold = document.getElementById('shop-gold');
        this.buyButton = document.getElementById('buy-button');
        this.sellButton = document.getElementById('sell-button');
        this.closeButton = document.querySelector('#shop-modal .close-button');
        this.rarityFilter = document.getElementById('rarity-filter');
        
        // Set initial state
        this.updateGoldDisplay();
    }
    
    addEventListeners() {
        // Tab switching
        if (this.shopTabs) {
            const tabs = this.shopTabs.querySelectorAll('.shop-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.selectedTab = tab.getAttribute('data-tab');
                    this.updateTabSelection();
                    this.populateItems();
                });
            });
        }
        
        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.close();
            });
        }
        
        // Buy button
        if (this.buyButton) {
            this.buyButton.addEventListener('click', () => {
                this.buySelectedItem();
            });
        }
        
        // Sell button
        if (this.sellButton) {
            this.sellButton.addEventListener('click', () => {
                this.sellSelectedItem();
            });
        }
        
        // Rarity filter
        if (this.rarityFilter) {
            this.rarityFilter.addEventListener('change', () => {
                this.filterRarity = this.rarityFilter.value;
                this.populateItems();
            });
        }
        
        // Global key listener for shop toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.toggle();
            }
            
            // Close shop with Escape key
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Listen for item purchase/sell events
        document.addEventListener('itemPurchased', (e) => {
            this.updateGoldDisplay();
            this.populateItems();
            this.showMessage(`Purchased ${e.detail.item.name}`);
        });
        
        document.addEventListener('itemSold', (e) => {
            this.updateGoldDisplay();
            this.populateItems();
            this.showMessage(`Sold ${e.detail.item.name}`);
        });
    }
    
    updateTabSelection() {
        if (this.shopTabs) {
            const tabs = this.shopTabs.querySelectorAll('.shop-tab');
            tabs.forEach(tab => {
                if (tab.getAttribute('data-tab') === this.selectedTab) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
        }
    }
    
    populateItems() {
        if (!this.itemsContainer) return;
        
        // Clear current items
        this.itemsContainer.innerHTML = '';
        
        // Get items based on selected tab
        let items;
        if (this.selectedTab === 'inventory') {
            // Show player inventory
            items = this.hero.inventory ? Array.from(this.hero.inventory.values()) : [];
        } else {
            // Show shop inventory filtered by type
            const shopInventory = this.shop.getInventoryByType(this.selectedTab);
            items = shopInventory ? Array.from(shopInventory.values()) : [];
        }
        
        // Apply rarity filter if not set to 'all'
        if (this.filterRarity !== 'all') {
            items = items.filter(item => item.rarity === this.filterRarity);
        }
        
        // Create item elements
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            itemElement.setAttribute('data-id', item.id);
            
            // Add rarity class
            itemElement.classList.add(`rarity-${item.rarity}`);
            
            // Create item content
            itemElement.innerHTML = `
                <div class="item-icon">${this.getItemIcon(item)}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${this.selectedTab === 'inventory' 
                    ? this.shop.getBuyingPrice(item) 
                    : this.shop.getSellingPrice(item)} gold</div>
                ${item.stackable ? `<div class="item-quantity">x${item.quantity}</div>` : ''}
            `;
            
            // Add click event
            itemElement.addEventListener('click', () => {
                this.selectItem(item);
                
                // Remove selection from all items
                const items = this.itemsContainer.querySelectorAll('.shop-item');
                items.forEach(i => i.classList.remove('selected'));
                
                // Add selection to clicked item
                itemElement.classList.add('selected');
            });
            
            this.itemsContainer.appendChild(itemElement);
        });
        
        // Show message if no items
        if (items.length === 0) {
            const noItems = document.createElement('div');
            noItems.className = 'no-items';
            noItems.textContent = 'No items available';
            this.itemsContainer.appendChild(noItems);
        }
    }
    
    getItemIcon(item) {
        // Return icon based on item type and subtype
        const icons = {
            weapon: {
                sword: '⚔️',
                axe: '🪓',
                staff: '🔮',
                bow: '🏹',
                default: '⚔️'
            },
            armor: {
                helmet: '🪖',
                chest: '🛡️',
                gloves: '🧤',
                boots: '👢',
                default: '🛡️'
            },
            consumable: {
                potion: '🧪',
                food: '🍖',
                scroll: '📜',
                default: '🧪'
            },
            material: {
                metal: '🔩',
                cloth: '🧵',
                leather: '🧶',
                crystal: '💎',
                default: '📦'
            },
            default: '❓'
        };
        
        const typeIcons = icons[item.type] || icons.default;
        return typeIcons[item.subtype] || typeIcons.default;
    }
    
    selectItem(item) {
        this.selectedItem = item;
        this.updateItemDetails();
        this.updateActionButtons();
    }
    
    updateItemDetails() {
        if (!this.itemDetails || !this.selectedItem) return;
        
        // Display item details
        this.itemDetails.innerHTML = `
            <h3>${this.selectedItem.getDisplayName()}</h3>
            <div class="item-type">${this.selectedItem.type} - ${this.selectedItem.subtype}</div>
            <div class="item-rarity">${this.selectedItem.rarity}</div>
            
            ${this.selectedItem.levelReq ? `<div class="item-req">Required Level: ${this.selectedItem.levelReq}</div>` : ''}
            
            ${this.selectedItem.stats ? `
                <div class="item-stats">
                    <h4>Stats:</h4>
                    <ul>
                        ${Object.entries(this.selectedItem.getEffectiveStats()).map(([stat, value]) => 
                            `<li>${stat}: ${value}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${this.selectedItem.effect ? `
                <div class="item-effect">
                    <h4>Effect:</h4>
                    <p>${this.getEffectDescription(this.selectedItem.effect)}</p>
                </div>
            ` : ''}
            
            ${this.selectedItem.durability ? `
                <div class="item-durability">
                    Durability: ${this.selectedItem.durability}/${this.selectedItem.maxDurability}
                </div>
            ` : ''}
            
            <div class="item-price-details">
                <div>Buy price: ${this.shop.getSellingPrice(this.selectedItem)} gold</div>
                <div>Sell price: ${this.shop.getBuyingPrice(this.selectedItem)} gold</div>
            </div>
        `;
    }
    
    getEffectDescription(effect) {
        switch (effect.type) {
            case 'heal':
                return `Restores ${effect.value} health`;
            case 'restore-mana':
                return `Restores ${effect.value} mana`;
            case 'buff':
                return `Applies ${effect.buff.name} buff for ${effect.buff.duration} seconds`;
            default:
                return effect.description || 'Unknown effect';
        }
    }
    
    updateActionButtons() {
        if (!this.buyButton || !this.sellButton || !this.selectedItem) return;
        
        if (this.selectedTab === 'inventory') {
            // Player is selling
            this.buyButton.style.display = 'none';
            this.sellButton.style.display = 'block';
            
            // Check if shop has enough gold
            const canSell = this.shop.gold >= this.shop.getBuyingPrice(this.selectedItem);
            this.sellButton.disabled = !canSell;
            
            if (!canSell) {
                this.sellButton.title = 'Shop doesn\'t have enough gold';
            } else {
                this.sellButton.title = '';
            }
        } else {
            // Player is buying
            this.buyButton.style.display = 'block';
            this.sellButton.style.display = 'none';
            
            // Check if player has enough gold and meets requirements
            const price = this.shop.getSellingPrice(this.selectedItem);
            const hasGold = this.hero.gold >= price;
            let meetsRequirements = true;
            
            // Check level requirement
            if (this.selectedItem.levelReq && this.hero.level < this.selectedItem.levelReq) {
                meetsRequirements = false;
                this.buyButton.title = `Requires level ${this.selectedItem.levelReq}`;
            }
            
            // Check stat requirements
            if (meetsRequirements && this.selectedItem.requirements) {
                for (const [stat, value] of Object.entries(this.selectedItem.requirements)) {
                    if (!this.hero.stats || this.hero.stats[stat] < value) {
                        meetsRequirements = false;
                        this.buyButton.title = `Requires ${stat}: ${value}`;
                        break;
                    }
                }
            }
            
            if (!hasGold) {
                this.buyButton.title = 'Not enough gold';
            }
            
            this.buyButton.disabled = !hasGold || !meetsRequirements;
        }
    }
    
    updateGoldDisplay() {
        if (this.playerGold) {
            this.playerGold.textContent = `${this.hero.gold || 0} gold`;
        }
        
        if (this.shopGold) {
            this.shopGold.textContent = `${this.shop.gold || 0} gold`;
        }
    }
    
    buySelectedItem() {
        if (!this.selectedItem) return;
        
        // Determine quantity (for stackable items, could add quantity selector)
        const quantity = 1;
        
        // Try to buy the item
        const success = this.shop.sellToPlayer(this.selectedItem.id, this.hero, quantity);
        
        if (success) {
            // Update UI
            this.updateGoldDisplay();
            this.populateItems();
            this.selectedItem = null;
            this.itemDetails.innerHTML = '';
        } else {
            this.showMessage('Failed to buy item');
        }
    }
    
    sellSelectedItem() {
        if (!this.selectedItem) return;
        
        // Determine quantity (for stackable items, could add quantity selector)
        const quantity = 1;
        
        // Try to sell the item
        const success = this.shop.buyFromPlayer(this.selectedItem.id, this.hero, quantity);
        
        if (success) {
            // Update UI
            this.updateGoldDisplay();
            this.populateItems();
            this.selectedItem = null;
            this.itemDetails.innerHTML = '';
        } else {
            this.showMessage('Failed to sell item');
        }
    }
    
    showMessage(message) {
        const messageContainer = document.getElementById('message-container');
        if (!messageContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        messageContainer.appendChild(messageElement);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => {
                messageContainer.removeChild(messageElement);
            }, 500);
        }, 3000);
    }
    
    open() {
        if (!this.shopModal) return;
        
        this.shopModal.classList.remove('hidden');
        this.isOpen = true;
        
        // Populate items
        this.populateItems();
        
        // Update gold display
        this.updateGoldDisplay();
        
        // Set default tab
        this.selectedTab = 'weapons';
        this.updateTabSelection();
    }
    
    close() {
        if (!this.shopModal) return;
        
        this.shopModal.classList.add('hidden');
        this.isOpen = false;
        this.selectedItem = null;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}