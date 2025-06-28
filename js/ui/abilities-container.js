/**
 * Simple and clean abilities container for click-to-cast functionality
 */
export default class AbilitiesContainer {
    constructor(gameInstance) {
        this.gameInstance = gameInstance;
        this.container = null;
        this.skillButtons = new Map();
        this.skillKeys = ['y', 'u', 'i', 'h', 'j', 'k'];
        
        this.init();
    }

    init() {
        this.container = document.getElementById('abilities-container');
        if (!this.container) {
            console.error('❌ Abilities container not found in DOM');
            return;
        }

        this.createSkillButtons();
        this.updateSkills();
        
        console.log('✅ Abilities container initialized');
    }

    createSkillButtons() {
        // Clear existing buttons
        this.container.innerHTML = '';
        this.skillButtons.clear();

        this.skillKeys.forEach(key => {
            const button = document.createElement('div');
            button.className = 'ability-button';
            button.dataset.skillKey = key;
            
            // Create button structure
            button.innerHTML = `
                <div class="ability-icon">
                    <img src="" alt="" class="skill-icon" style="display: none;">
                    <span class="key-binding">${key.toUpperCase()}</span>
                </div>
                <div class="ability-cooldown"></div>
                <div class="ability-tooltip">
                    <div class="tooltip-name">Empty Slot</div>
                    <div class="tooltip-description">No skill assigned</div>
                    <div class="tooltip-mana">Mana: 0</div>
                </div>
            `;

            // Add click event listener
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.castSkill(key);
            });

            // Add hover effects
            button.addEventListener('mouseenter', () => {
                button.querySelector('.ability-tooltip').style.display = 'block';
            });

            button.addEventListener('mouseleave', () => {
                button.querySelector('.ability-tooltip').style.display = 'none';
            });

            // Add to container and map
            this.container.appendChild(button);
            this.skillButtons.set(key, button);
        });
    }

    castSkill(skillKey) {
        console.log(`🎯 Touch button pressed for skill: ${skillKey}`);
        
        if (!this.gameInstance) {
            console.error('❌ Game instance not available');
            return;
        }

        // Get the button for visual feedback
        const button = this.skillButtons.get(skillKey);
        if (button) {
            button.classList.add('casting');
            setTimeout(() => {
                button.classList.remove('casting');
            }, 200);
            
            // Haptic feedback for touch devices
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }

        // Call the exact same castSkill method that keyboard uses
        // Make sure we pass lowercase key to match keyboard system
        const normalizedKey = skillKey.toLowerCase();
        
        try {
            if (typeof this.gameInstance.castSkill === 'function') {
                this.gameInstance.castSkill(normalizedKey);
                console.log(`✅ Touch skill cast successful: ${skillKey} -> ${normalizedKey}`);
            } else {
                console.error('❌ castSkill method not found on game instance');
            }
        } catch (error) {
            console.error(`❌ Error casting skill ${skillKey}:`, error);
        }
    }

    updateSkills() {
        if (!this.gameInstance?.hero?.skills) {
            console.log('🔄 Hero or skills not available yet, will retry...');
            setTimeout(() => this.updateSkills(), 1000);
            return;
        }

        const heroSkills = this.gameInstance.hero.skills;
        console.log('🔍 Updating skills display:', heroSkills);

        this.skillKeys.forEach(key => {
            const button = this.skillButtons.get(key);
            if (!button) return;

            // Get skill from hero (use lowercase to match keyboard system)
            const normalizedKey = key.toLowerCase();
            let skill = null;
            if (heroSkills instanceof Map) {
                skill = heroSkills.get(normalizedKey);
            } else {
                skill = heroSkills[normalizedKey];
            }

            const tooltip = button.querySelector('.ability-tooltip');
            const keyBinding = button.querySelector('.key-binding');
            const skillIcon = button.querySelector('.skill-icon');

            if (skill && skill.name && skill.name !== 'unnamed') {
                // Skill is available
                button.classList.remove('empty');
                button.classList.add('available');
                
                // Update tooltip
                tooltip.querySelector('.tooltip-name').textContent = skill.name || 'Unknown Skill';
                tooltip.querySelector('.tooltip-description').textContent = this.getSkillDescription(skill);
                tooltip.querySelector('.tooltip-mana').textContent = `Mana: ${skill.manaCost || 0}`;
                
                // Update visual style based on skill type
                button.style.borderColor = this.getSkillColor(skill);
                keyBinding.style.color = this.getSkillColor(skill);
                
            } else {
                // Empty slot
                button.classList.remove('available');
                button.classList.add('empty');
                
                tooltip.querySelector('.tooltip-name').textContent = 'Empty Slot';
                tooltip.querySelector('.tooltip-description').textContent = 'No skill assigned';
                tooltip.querySelector('.tooltip-mana').textContent = 'Mana: 0';
                
                button.style.borderColor = '#777';
                keyBinding.style.color = '#fff';
            }
        });
    }

    getSkillDescription(skill) {
        // Generate a description based on skill properties
        let desc = skill.description || '';
        
        if (!desc) {
            if (skill.damage) desc += `Deals ${skill.damage} damage. `;
            if (skill.range) desc += `Range: ${skill.range}. `;
            if (skill.duration) desc += `Duration: ${skill.duration}s. `;
        }
        
        return desc || 'Active skill';
    }

    getSkillColor(skill) {
        // Return color based on skill type or damage type
        const damageType = skill.damageType || skill.type || 'normal';
        
        const colors = {
            fire: '#ff4444',
            ice: '#44aaff',
            lightning: '#ffff44',
            shadow: '#9944ff',
            physical: '#ff8844',
            magic: '#44ff88',
            normal: '#ffffff'
        };
        
        return colors[damageType] || colors.normal;
    }

    updateCooldowns() {
        if (!this.gameInstance?.hero?.cooldowns) return;

        const cooldowns = this.gameInstance.hero.cooldowns;
        
        this.skillKeys.forEach(key => {
            const button = this.skillButtons.get(key);
            if (!button) return;

            // Use lowercase key to match keyboard system
            const normalizedKey = key.toLowerCase();
            let cooldownValue = 0;
            if (cooldowns instanceof Map) {
                cooldownValue = cooldowns.get(normalizedKey) || 0;
            } else {
                cooldownValue = cooldowns[normalizedKey] || 0;
            }

            const cooldownDiv = button.querySelector('.ability-cooldown');
            
            if (cooldownValue > 0) {
                button.classList.add('on-cooldown');
                cooldownDiv.style.display = 'block';
                cooldownDiv.textContent = Math.ceil(cooldownValue);
            } else {
                button.classList.remove('on-cooldown');
                cooldownDiv.style.display = 'none';
            }
        });
    }

    // Call this method regularly to update cooldowns
    update() {
        this.updateCooldowns();
    }
}