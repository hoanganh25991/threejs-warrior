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
            slot.className = 'skill-slot';
            slot.innerHTML = `
                <div class="key-bind">${key}</div>
                <div class="skill-icon"></div>
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
            });
            
            slot.addEventListener('mouseleave', () => {
                const tooltip = slot.querySelector('.skill-tooltip');
                if (tooltip) tooltip.style.display = 'none';
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
                gap: 10px;
                margin-top: 20px;
            }

            .skill-slot {
                width: 50px;
                height: 50px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 5px;
                position: relative;
                cursor: pointer;
                border: 2px solid #444;
                overflow: hidden;
            }

            .skill-slot:hover {
                border-color: #888;
            }

            .key-bind {
                position: absolute;
                top: 2px;
                right: 2px;
                color: white;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.5);
                padding: 2px 4px;
                border-radius: 3px;
                z-index: 2;
            }

            .skill-icon {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                position: relative;
                z-index: 1;
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
            }

            .skill-tooltip {
                display: none;
                position: absolute;
                bottom: 60px;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                z-index: 10;
                pointer-events: none;
            }

            .tooltip-name {
                font-weight: bold;
                margin-bottom: 5px;
                color: #ffcc00;
            }

            .tooltip-description {
                font-size: 12px;
                margin-bottom: 5px;
            }

            .tooltip-cooldown, .tooltip-mana {
                font-size: 11px;
                color: #aaa;
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
                        if (iconElement) {
                            // Set background color based on hero type
                            let bgColor;
                            switch (data.hero.heroType) {
                                case 'dragon-knight':
                                    bgColor = '#ff6600'; // Orange-red for fire
                                    break;
                                case 'crystal-maiden':
                                    bgColor = '#88ccff'; // Light blue for ice
                                    break;
                                case 'lina':
                                    bgColor = '#ff3300'; // Bright red for fire
                                    break;
                                case 'axe':
                                    bgColor = '#cc0000'; // Dark red for blood
                                    break;
                                default:
                                    bgColor = '#888888'; // Gray default
                            }
                            
                            // Set icon background
                            iconElement.style.backgroundColor = bgColor;
                            
                            // Add skill name as text in the icon
                            if (skill.name && !iconElement.textContent) {
                                const nameInitial = skill.name.charAt(0);
                                iconElement.textContent = nameInitial;
                                iconElement.style.display = 'flex';
                                iconElement.style.justifyContent = 'center';
                                iconElement.style.alignItems = 'center';
                                iconElement.style.fontSize = '24px';
                                iconElement.style.fontWeight = 'bold';
                                iconElement.style.color = 'white';
                                iconElement.style.textShadow = '1px 1px 2px black';
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
