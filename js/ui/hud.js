import { config } from "../config/config.js";
import CharacterInfo from "./character-info.js";

export default class HUD {
    constructor(hero) {
        this.hero = hero;
        this.init();
        
        // Initialize character info UI if hero is available
        if (hero) {
            this.characterInfo = new CharacterInfo(hero);
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
                <div class="cooldown"></div>
            `;
            this.skillBar.appendChild(slot);
            this.skillSlots[key] = slot;
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
            }

            .key-bind {
                position: absolute;
                top: 2px;
                right: 2px;
                color: white;
                font-size: 12px;
            }

            .cooldown {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0%;
                background: rgba(0, 0, 0, 0.7);
                transition: height 0.1s;
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

        // Update skill cooldowns if hero has them
        if (data.hero.cooldowns) {
            for (const [key, cooldown] of Object.entries(data.hero.cooldowns)) {
                const slot = this.skillSlots[key];
                if (slot && cooldown > 0) {
                    const percent = (cooldown / config.skills[key].cooldown) * 100;
                    slot.querySelector('.cooldown').style.height = `${percent}%`;
                } else if (slot) {
                    slot.querySelector('.cooldown').style.height = '0%';
                }
            }
        }

        // Update score
        this.scoreDisplay.textContent = `Score: ${data.hero.score || 0}`;
        
        // Update hero reference for character info if needed
        if (this.hero !== data.hero) {
            this.hero = data.hero;
            if (!this.characterInfo && this.hero) {
                this.characterInfo = new CharacterInfo(this.hero);
            } else if (this.characterInfo) {
                this.characterInfo.hero = this.hero;
            }
        }
    }
}
