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
        console.log('Initializing Shop UI');
        
        // Get UI elements
        this.shopModal = document.getElementById('shop-modal');
        console.log('Shop modal element:', this.shopModal);
        
        // If shop modal doesn't exist, create it
        if (!this.shopModal) {
            console.log('Creating shop modal dynamically');
            this.createShopModal();
        }
        
        // Get all UI elements
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
        
        // Log all UI elements to check if they're found
        console.log('UI Elements after initialization:', {
            shopModal: this.shopModal,
            shopContent: this.shopContent,
            shopTabs: this.shopTabs,
            itemsContainer: this.itemsContainer,
            itemDetails: this.itemDetails,
            playerGold: this.playerGold,
            shopGold: this.shopGold,
            buyButton: this.buyButton,
            sellButton: this.sellButton,
            closeButton: this.closeButton,
            rarityFilter: this.rarityFilter
        });
        
        // Set initial state
        this.updateGoldDisplay();
    }
    
    createShopModal() {
        // Create the shop modal element
        this.shopModal = document.createElement('div');
        this.shopModal.id = 'shop-modal';
        this.shopModal.className = 'modal hidden';
        
        // Create the modal content
        this.shopModal.innerHTML = `
            <div class="modal-content shop-modal-content">
                <span class="close-button" title="Close">&times;</span>
                <h2>Shop</h2>
                
                <div class="shop-header">
                    <div id="player-gold" class="gold-display">0 gold</div>
                    <div id="shop-gold" class="gold-display">1000 gold</div>
                </div>
                
                <div class="shop-filter">
                    <label for="rarity-filter">Filter by rarity:</label>
                    <select id="rarity-filter">
                        <option value="all">All</option>
                        <option value="common">Common</option>
                        <option value="uncommon">Uncommon</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                    </select>
                </div>
                
                <div id="shop-content">
                    <div id="shop-tabs" class="tabs">
                        <div class="shop-tab active" data-tab="weapons">Weapons</div>
                        <div class="shop-tab" data-tab="armor">Armor</div>
                        <div class="shop-tab" data-tab="consumable">Consumables</div>
                        <div class="shop-tab" data-tab="material">Materials</div>
                        <div class="shop-tab" data-tab="inventory">My Inventory</div>
                    </div>
                    
                    <div class="shop-container">
                        <div id="shop-items" class="items-list">
                            <!-- Items will be populated dynamically -->
                        </div>
                        
                        <div id="item-details" class="item-details">
                            <!-- Item details will be shown here -->
                            <p class="no-selection">Select an item to view details</p>
                        </div>
                    </div>
                    
                    <div class="shop-actions">
                        <button id="buy-button" disabled>Buy</button>
                        <button id="sell-button" disabled>Sell</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add the shop modal to the game UI
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.appendChild(this.shopModal);
            console.log('Shop modal added to game UI');
        } else {
            // If game UI doesn't exist, add to body
            document.body.appendChild(this.shopModal);
            console.log('Shop modal added to body (game UI not found)');
        }
    }
    
    addEventListeners() {
        console.log('Adding event listeners to shop UI');
        
        // Tab switching
        if (this.shopTabs) {
            const tabs = this.shopTabs.querySelectorAll('.shop-tab');
            console.log('Shop tabs found:', tabs.length);
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    this.selectedTab = tab.getAttribute('data-tab');
                    this.updateTabSelection();
                    this.populateItems();
                });
            });
        } else {
            console.warn('Shop tabs not found');
        }
        
        // Close button
        if (this.closeButton) {
            console.log('Close button found');
            this.closeButton.addEventListener('click', () => {
                console.log('Close button clicked');
                this.close();
            });
        } else {
            console.warn('Close button not found');
        }
        
        // Buy button
        if (this.buyButton) {
            console.log('Buy button found');
            this.buyButton.addEventListener('click', () => {
                this.buySelectedItem();
            });
        } else {
            console.warn('Buy button not found');
        }
        
        // Sell button
        if (this.sellButton) {
            console.log('Sell button found');
            this.sellButton.addEventListener('click', () => {
                this.sellSelectedItem();
            });
        } else {
            console.warn('Sell button not found');
        }
        
        // Rarity filter
        if (this.rarityFilter) {
            console.log('Rarity filter found');
            this.rarityFilter.addEventListener('change', () => {
                this.filterRarity = this.rarityFilter.value;
                this.populateItems();
            });
        } else {
            console.warn('Rarity filter not found');
        }
        
        // Global key listener for shop toggle
        console.log('Adding global key listener for shop toggle');
        this.keyListener = (e) => {
            console.log('Key pressed:', e.key);
            if (e.key === 'p' || e.key === 'P') {
                console.log('P key detected, toggling shop');
                this.toggle();
            }
            
            // Close shop with Escape key
            if (e.key === 'Escape' && this.isOpen) {
                console.log('Escape key detected, closing shop');
                this.close();
            }
        };
        
        // Remove any existing listener to avoid duplicates
        document.removeEventListener('keydown', this.keyListener);
        
        // Add the new listener
        document.addEventListener('keydown', this.keyListener);
        
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
        
        console.log('Event listeners added to shop UI');
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
        console.log('Populating items for tab:', this.selectedTab);
        
        // Re-fetch itemsContainer if not found
        if (!this.itemsContainer) {
            console.log('Items container not found, trying to re-fetch');
            this.itemsContainer = document.getElementById('shop-items');
        }
        
        if (!this.itemsContainer) {
            console.error('Items container still not found!');
            return;
        }
        
        // Clear current items
        this.itemsContainer.innerHTML = '';
        
        // Get items based on selected tab
        let items;
        if (this.selectedTab === 'inventory') {
            // Show player inventory
            items = this.hero.inventory ? Array.from(this.hero.inventory.values()) : [];
            console.log('Player inventory items:', items.length);
        } else {
            // Show shop inventory filtered by type
            const shopInventory = this.shop.getInventoryByType(this.selectedTab);
            items = shopInventory ? Array.from(shopInventory.values()) : [];
            console.log('Shop inventory items for', this.selectedTab + ':', items.length);
        }
        
        // Apply rarity filter if not set to 'all'
        if (this.filterRarity !== 'all') {
            const filteredItems = items.filter(item => item.rarity === this.filterRarity);
            console.log('Filtered by rarity', this.filterRarity + ':', filteredItems.length, 'items');
            items = filteredItems;
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
            console.log('No items available message shown');
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
        console.log('Updating gold display');
        
        // Re-fetch elements in case they were just created
        if (!this.playerGold) {
            this.playerGold = document.getElementById('player-gold');
        }
        
        if (!this.shopGold) {
            this.shopGold = document.getElementById('shop-gold');
        }
        
        if (this.playerGold) {
            this.playerGold.textContent = `${this.hero.gold || 0} gold`;
            console.log('Player gold updated:', this.hero.gold);
        } else {
            console.warn('Player gold element not found');
        }
        
        if (this.shopGold) {
            this.shopGold.textContent = `${this.shop.gold || 0} gold`;
            console.log('Shop gold updated:', this.shop.gold);
        } else {
            console.warn('Shop gold element not found');
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
        console.log('Opening shop modal');
        
        // Check if shop modal exists, create it if not
        if (!this.shopModal) {
            console.log('Shop modal not found, creating it');
            this.createShopModal();
            
            // Re-initialize UI elements
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
            
            // Re-add event listeners
            this.addEventListeners();
        }
        
        if (!this.shopModal) {
            console.error('Failed to create shop modal!');
            return;
        }
        
        this.shopModal.classList.remove('hidden');
        this.isOpen = true;
        console.log('Shop opened, isOpen =', this.isOpen);
        
        // Populate items
        this.populateItems();
        
        // Update gold display
        this.updateGoldDisplay();
        
        // Set default tab
        this.selectedTab = 'weapons';
        this.updateTabSelection();
    }
    
    close() {
        console.log('Closing shop modal');
        if (!this.shopModal) {
            console.error('Shop modal element not found!');
            return;
        }
        
        this.shopModal.classList.add('hidden');
        this.isOpen = false;
        this.selectedItem = null;
        console.log('Shop closed, isOpen =', this.isOpen);
    }
    
    toggle() {
        console.log('Toggle shop called, current state:', this.isOpen);
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}