export default class ShopButton {
    constructor(shopUI) {
        this.shopUI = shopUI;
        this.init();
    }
    
    init() {
        // Create shop button
        this.createShopButton();
        
        // Add event listeners
        this.addEventListeners();
    }
    
    createShopButton() {
        // Create a button to open shop UI
        this.shopButton = document.createElement('button');
        this.shopButton.id = 'shop-button';
        this.shopButton.textContent = 'Shop';
        this.shopButton.className = 'game-button';
        document.body.appendChild(this.shopButton);
        
        // Add styles for the button
        const style = document.createElement('style');
        style.textContent = `
            #shop-button {
                position: fixed;
                top: 110px;
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
                opacity: 0.5;
            }
            
            #shop-button:hover {
                background-color: #6b3e1c;
            }
        `;
        document.head.appendChild(style);
    }
    
    addEventListeners() {
        // Open shop when button is clicked
        this.shopButton.addEventListener('click', () => {
            if (this.shopUI) {
                this.shopUI.open();
            } else {
                console.error('Shop UI not initialized');
            }
        });
    }
}