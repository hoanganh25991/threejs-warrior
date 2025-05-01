import { config } from "../config/config.js";
import CharacterInfo from "./character-info.js";

export default class HUD {
    constructor(hero) {
        this.hero = hero;
        this.init();
        
        // Initialize character info UI if hero is available
        if (hero) {
            this.characterInfo = new CharacterInfo(hero, window.mouseCaptureManager);
        }
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'game-hud';
        document.body.appendChild(this.container);

        // Create status bars
        this.createStatusBars();
        
        // Create skill bar
        this.createSkillBar();
        
        // Create score display
        this.createScoreDisplay();

        this.addStyles();
    }

    createStatusBars() {
        // Health bar
        this.healthBar = this.createBar('health', 'red');
        
        // Mana bar
        this.manaBar = this.createBar('mana', 'blue');
        
        // Experience bar
        this.expBar = this.createBar('exp', 'yellow');
    }

    createBar(type, color) {
        const barContainer = document.createElement('div');
        barContainer.className = `status-bar ${type}-bar`;
        
        const bar = document.createElement('div');
        bar.className = 'bar-fill';
        bar.style.backgroundColor = color;
        
        const text = document.createElement('span');
        text.className = 'bar-text';
        
        barContainer.appendChild(bar);
        barContainer.appendChild(text);
        this.container.appendChild(barContainer);
        
        return { bar, text };
    }

    createSkillBar() {
        this.skillBar = document.createElement('div');
        this.skillBar.className = 'skill-bar';
        this.container.appendChild(this.skillBar);

        // Skill slots for Y, U, I, H, J, K keys
        const keys = ['Y', 'U', 'I', 'H', 'J', 'K'];
        this.skillSlots = {};

        keys.forEach(key => {
            const slot = document.createElement('div');
            slot.className = 'skill-slot skill-slot-3d';
            slot.innerHTML = `
                <div class="skill-3d-container">
                    <div class="skill-3d-face skill-3d-front">
                        <div class="key-bind">${key}</div>
                        <div class="skill-icon"></div>
                        <div class="skill-glow"></div>
                    </div>
                    <div class="skill-3d-face skill-3d-left"></div>
                    <div class="skill-3d-face skill-3d-right"></div>
                    <div class="skill-3d-face skill-3d-top"></div>
                    <div class="skill-3d-face skill-3d-bottom"></div>
                    <div class="skill-3d-face skill-3d-back"></div>
                </div>
                <div class="cooldown"></div>
                <div class="skill-tooltip">
                    <div class="tooltip-name"></div>
                    <div class="tooltip-description"></div>
                    <div class="tooltip-cooldown"></div>
                    <div class="tooltip-mana"></div>
                </div>
            `;
            this.skillBar.appendChild(slot);
            this.skillSlots[key] = slot;
            
            // Show tooltip on hover
            slot.addEventListener('mouseenter', () => {
                const tooltip = slot.querySelector('.skill-tooltip');
                if (tooltip) tooltip.style.display = 'block';
                
                // Add 3D rotation effect on hover
                const container = slot.querySelector('.skill-3d-container');
                if (container) {
                    container.style.transform = 'rotateX(15deg) rotateY(15deg)';
                }
            });
            
            slot.addEventListener('mouseleave', () => {
                const tooltip = slot.querySelector('.skill-tooltip');
                if (tooltip) tooltip.style.display = 'none';
                
                // Reset 3D rotation on mouse leave
                const container = slot.querySelector('.skill-3d-container');
                if (container) {
                    container.style.transform = 'rotateX(0deg) rotateY(0deg)';
                }
            });
        });
    }

    createScoreDisplay() {
        this.scoreDisplay = document.createElement('div');
        this.scoreDisplay.className = 'score-display';
        this.container.appendChild(this.scoreDisplay);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .game-hud {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                pointer-events: none;
            }

            .status-bar {
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                margin-bottom: 5px;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }

            .bar-fill {
                height: 100%;
                width: 100%;
                transition: width 0.3s;
            }

            .bar-text {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                color: white;
                text-shadow: 1px 1px 2px black;
            }

            .skill-bar {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
                perspective: 1000px;
            }

            .skill-slot {
                width: 60px;
                height: 60px;
                position: relative;
                cursor: pointer;
                overflow: visible;
            }

            /* 3D Skill Slot Styling */
            .skill-slot-3d {
                transform-style: preserve-3d;
                perspective: 600px;
            }

            .skill-3d-container {
                width: 100%;
                height: 100%;
                position: relative;
                transform-style: preserve-3d;
                transition: transform 0.3s ease;
                transform: rotateX(0deg) rotateY(0deg);
            }

            .skill-3d-face {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: visible;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            }

            .skill-3d-front {
                background: rgba(0, 0, 0, 0.7);
                transform: translateZ(5px);
                border: 2px solid #666;
                overflow: hidden;
                z-index: 1;
            }

            .skill-3d-back {
                background: rgba(20, 20, 20, 0.9);
                transform: translateZ(-5px) rotateY(180deg);
                border: 1px solid #333;
            }

            .skill-3d-left {
                background: rgba(40, 40, 40, 0.8);
                transform: rotateY(-90deg) translateZ(5px);
                width: 10px;
                left: -5px;
            }

            .skill-3d-right {
                background: rgba(40, 40, 40, 0.8);
                transform: rotateY(90deg) translateZ(55px);
                width: 10px;
                right: -5px;
            }

            .skill-3d-top {
                background: rgba(60, 60, 60, 0.8);
                transform: rotateX(90deg) translateZ(5px);
                height: 10px;
                top: -5px;
            }

            .skill-3d-bottom {
                background: rgba(60, 60, 60, 0.8);
                transform: rotateX(-90deg) translateZ(55px);
                height: 10px;
                bottom: -5px;
            }

            .skill-slot:hover .skill-3d-front {
                border-color: #888;
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
            }

            .key-bind {
                position: absolute;
                top: 2px;
                right: 2px;
                color: white;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.7);
                padding: 2px 4px;
                border-radius: 3px;
                z-index: 2;
                box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
            }

            .skill-icon {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                position: relative;
                z-index: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
            }

            .skill-glow {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 5px;
                background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%);
                z-index: 0;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .skill-slot:hover .skill-glow {
                opacity: 1;
                animation: pulse-glow 2s infinite;
            }

            @keyframes pulse-glow {
                0% { opacity: 0.3; }
                50% { opacity: 0.7; }
                100% { opacity: 0.3; }
            }

            .cooldown {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0%;
                background: rgba(0, 0, 0, 0.7);
                transition: height 0.1s;
                z-index: 3;
                border-radius: 0 0 5px 5px;
            }

            .skill-tooltip {
                display: none;
                position: absolute;
                bottom: 70px;
                left: 50%;
                transform: translateX(-50%);
                width: 220px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 12px;
                border-radius: 8px;
                z-index: 10;
                pointer-events: none;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(100, 100, 100, 0.5);
            }

            .tooltip-name {
                font-weight: bold;
                margin-bottom: 8px;
                color: #ffcc00;
                text-shadow: 0 0 5px rgba(255, 204, 0, 0.5);
                font-size: 14px;
            }

            .tooltip-description {
                font-size: 12px;
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .tooltip-cooldown, .tooltip-mana {
                font-size: 11px;
                color: #aaa;
                margin-top: 5px;
            }

            .score-display {
                position: fixed;
                top: 20px;
                right: 20px;
                color: white;
                font-size: 24px;
                text-shadow: 1px 1px 2px black;
            }
        `;
        document.head.appendChild(style);
    }

    update(data) {
        if (!data || !data.hero) return;
        
        // Update health bar
        const healthPercent = (data.hero.health / data.hero.maxHealth) * 100;
        this.healthBar.bar.style.width = `${healthPercent}%`;
        this.healthBar.text.textContent = `${Math.ceil(data.hero.health)} / ${data.hero.maxHealth}`;

        // Update mana bar
        const manaPercent = (data.hero.mana / data.hero.maxMana) * 100;
        this.manaBar.bar.style.width = `${manaPercent}%`;
        this.manaBar.text.textContent = `${Math.ceil(data.hero.mana)} / ${data.hero.maxMana}`;

        // Update experience bar
        const expPercent = (data.hero.experience / data.hero.nextLevelExp) * 100;
        this.expBar.bar.style.width = `${expPercent}%`;
        this.expBar.text.textContent = `Level ${data.hero.level} - ${Math.floor(expPercent)}%`;

        // Update skill information and cooldowns
        if (data.hero.skills) {
            // For Map-based skills
            if (data.hero.skills instanceof Map) {
                for (const [key, skill] of data.hero.skills.entries()) {
                    const slot = this.skillSlots[key];
                    if (slot) {
                        // Update skill icon based on hero type and skill
                        const iconElement = slot.querySelector('.skill-icon');
                        const glowElement = slot.querySelector('.skill-glow');
                        const container = slot.querySelector('.skill-3d-container');
                        
                        if (iconElement) {
                            // Set background color based on hero type
                            let bgColor, glowColor, borderColor;
                            switch (data.hero.heroType) {
                                case 'dragon-knight':
                                    bgColor = 'radial-gradient(circle, #ff8800 0%, #cc4400 100%)';
                                    glowColor = 'rgba(255, 136, 0, 0.5)';
                                    borderColor = '#ff6600';
                                    break;
                                case 'crystal-maiden':
                                    bgColor = 'radial-gradient(circle, #aaddff 0%, #0088cc 100%)';
                                    glowColor = 'rgba(136, 204, 255, 0.5)';
                                    borderColor = '#88ccff';
                                    break;
                                case 'lina':
                                    bgColor = 'radial-gradient(circle, #ff5500 0%, #cc0000 100%)';
                                    glowColor = 'rgba(255, 51, 0, 0.5)';
                                    borderColor = '#ff3300';
                                    break;
                                case 'axe':
                                    bgColor = 'radial-gradient(circle, #ff0000 0%, #880000 100%)';
                                    glowColor = 'rgba(204, 0, 0, 0.5)';
                                    borderColor = '#cc0000';
                                    break;
                                default:
                                    bgColor = 'radial-gradient(circle, #aaaaaa 0%, #555555 100%)';
                                    glowColor = 'rgba(136, 136, 136, 0.5)';
                                    borderColor = '#888888';
                            }
                            
                            // Set icon background
                            iconElement.style.background = bgColor;
                            
                            // Set glow color
                            if (glowElement) {
                                glowElement.style.boxShadow = `0 0 15px ${glowColor}`;
                                glowElement.style.background = `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`;
                            }
                            
                            // Set border color for 3D effect
                            const frontFace = slot.querySelector('.skill-3d-front');
                            if (frontFace) {
                                frontFace.style.borderColor = borderColor;
                            }
                            
                            // Add skill name and icon in the icon element
                            if (skill.name && !iconElement.innerHTML) {
                                const nameInitial = skill.name.charAt(0);
                                
                                // Create a more complex 3D-looking icon
                                iconElement.innerHTML = `
                                    <div class="skill-icon-inner">
                                        <div class="skill-icon-symbol">${nameInitial}</div>
                                        <div class="skill-icon-particles"></div>
                                    </div>
                                `;
                                
                                // Style the inner elements
                                const innerIcon = iconElement.querySelector('.skill-icon-inner');
                                const symbolElement = iconElement.querySelector('.skill-icon-symbol');
                                
                                if (innerIcon && symbolElement) {
                                    innerIcon.style.width = '100%';
                                    innerIcon.style.height = '100%';
                                    innerIcon.style.display = 'flex';
                                    innerIcon.style.justifyContent = 'center';
                                    innerIcon.style.alignItems = 'center';
                                    innerIcon.style.position = 'relative';
                                    
                                    symbolElement.style.fontSize = '28px';
                                    symbolElement.style.fontWeight = 'bold';
                                    symbolElement.style.color = 'white';
                                    symbolElement.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.5)';
                                    symbolElement.style.zIndex = '2';
                                    symbolElement.style.transform = 'translateZ(5px)';
                                }
                            }
                        }
                        
                        // Update tooltip information
                        const tooltipName = slot.querySelector('.tooltip-name');
                        const tooltipDesc = slot.querySelector('.tooltip-description');
                        const tooltipCooldown = slot.querySelector('.tooltip-cooldown');
                        const tooltipMana = slot.querySelector('.tooltip-mana');
                        
                        if (tooltipName && skill.name) {
                            tooltipName.textContent = skill.name;
                        }
                        
                        if (tooltipDesc) {
                            // Generate a description if not available
                            let description = '';
                            if (skill.damage) {
                                description += `Deals ${skill.damage} damage. `;
                            }
                            if (skill.range) {
                                description += `Range: ${skill.range} units. `;
                            }
                            if (skill.duration) {
                                description += `Duration: ${skill.duration} seconds. `;
                            }
                            tooltipDesc.textContent = description || 'No description available.';
                        }
                        
                        if (tooltipCooldown) {
                            tooltipCooldown.textContent = `Cooldown: ${skill.getCooldownDuration ? skill.getCooldownDuration() : '?'} seconds`;
                        }
                        
                        if (tooltipMana) {
                            tooltipMana.textContent = `Mana Cost: ${skill.manaCost || 0}`;
                        }
                        
                        // Update cooldown display
                        const cooldownElement = slot.querySelector('.cooldown');
                        if (cooldownElement) {
                            const cooldown = data.hero.cooldowns.get(key) || 0;
                            if (cooldown > 0 && skill.getCooldownDuration) {
                                const percent = (cooldown / skill.getCooldownDuration()) * 100;
                                cooldownElement.style.height = `${percent}%`;
                            } else {
                                cooldownElement.style.height = '0%';
                            }
                        }
                    }
                }
            } 
            // For object-based skills (legacy support)
            else {
                for (const key in data.hero.cooldowns) {
                    const slot = this.skillSlots[key];
                    const cooldown = data.hero.cooldowns[key];
                    if (slot && cooldown > 0) {
                        const percent = (cooldown / config.skills[key].cooldown) * 100;
                        slot.querySelector('.cooldown').style.height = `${percent}%`;
                    } else if (slot) {
                        slot.querySelector('.cooldown').style.height = '0%';
                    }
                }
            }
        }

        // Update score
        this.scoreDisplay.textContent = `Score: ${data.hero.score || 0}`;
        
        // Update hero reference for character info if needed
        if (this.hero !== data.hero) {
            this.hero = data.hero;
            if (!this.characterInfo && this.hero) {
                this.characterInfo = new CharacterInfo(this.hero, window.mouseCaptureManager);
            } else if (this.characterInfo) {
                this.characterInfo.hero = this.hero;
            }
        }
        
        // Update skill points notification
        this.updateSkillPointsNotification();
    }
    
    // Add notification for available skill points
    updateSkillPointsNotification() {
        if (!this.hero || !this.hero.characterClass) return;
        
        const classInfoButton = document.getElementById('class-info-button');
        if (!classInfoButton) return;
        
        // Remove existing notification if any
        const existingNotification = classInfoButton.querySelector('.skill-points-indicator');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Add notification if skill points are available
        if (this.hero.characterClass.skillPoints > 0) {
            const notification = document.createElement('div');
            notification.className = 'skill-points-indicator';
            notification.textContent = this.hero.characterClass.skillPoints;
            notification.style.position = 'absolute';
            notification.style.top = '-8px';
            notification.style.right = '-8px';
            notification.style.backgroundColor = '#f8d000';
            notification.style.color = '#000';
            notification.style.borderRadius = '50%';
            notification.style.width = '20px';
            notification.style.height = '20px';
            notification.style.display = 'flex';
            notification.style.justifyContent = 'center';
            notification.style.alignItems = 'center';
            notification.style.fontWeight = 'bold';
            notification.style.fontSize = '12px';
            notification.style.animation = 'bounce 1s infinite alternate';
            
            classInfoButton.style.position = 'relative';
            classInfoButton.appendChild(notification);
        }
    }
}
