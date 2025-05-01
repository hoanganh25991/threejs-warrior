// Character Info UI Module
export default class CharacterInfo {
    constructor(hero) {
        this.hero = hero;
        this.modal = document.getElementById('class-info-modal');
        this.closeButton = document.querySelector('.close-button');
        this.openButton = document.getElementById('class-info-button');
        
        // Initialize event listeners
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Open modal when button is clicked
        this.openButton.addEventListener('click', () => {
            this.openModal();
        });
        
        // Close modal when X is clicked
        this.closeButton.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking outside the content
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
        
        // Add event listeners for attribute increase buttons
        const attrButtons = document.querySelectorAll('.attr-increase-btn');
        attrButtons.forEach(button => {
            button.addEventListener('click', () => {
                const attribute = button.getAttribute('data-attr');
                this.increaseAttribute(attribute);
            });
        });
    }
    
    openModal() {
        // Update modal content with current character info
        this.updateCharacterInfo();
        
        // Show modal
        this.modal.classList.remove('hidden');
    }
    
    closeModal() {
        this.modal.classList.add('hidden');
    }
    
    updateCharacterInfo() {
        if (!this.hero || !this.hero.characterClass) {
            console.warn('Hero or character class not available');
            return;
        }
        
        const characterClass = this.hero.characterClass;
        const stats = this.hero.getStats();
        
        // Update basic info
        document.getElementById('class-name').textContent = this.capitalizeFirstLetter(characterClass.type);
        document.getElementById('class-level').textContent = stats.level;
        document.getElementById('class-exp').textContent = `${stats.experience}/${characterClass.getExperienceForNextLevel()}`;
        document.getElementById('class-skill-points').textContent = characterClass.skillPoints;
        document.getElementById('class-attr-points').textContent = characterClass.attributePoints;
        
        // Update attributes
        document.getElementById('class-health').textContent = `${stats.health}/${stats.maxHealth}`;
        document.getElementById('class-mana').textContent = `${stats.mana}/${stats.maxMana}`;
        document.getElementById('class-strength').textContent = stats.strength;
        document.getElementById('class-dexterity').textContent = stats.dexterity;
        document.getElementById('class-intelligence').textContent = stats.intelligence;
        document.getElementById('class-armor').textContent = stats.armor;
        
        // Update combat stats
        document.getElementById('class-attack-power').textContent = stats.attackPower || 0;
        document.getElementById('class-spell-power').textContent = stats.spellPower || 0;
        document.getElementById('class-crit-chance').textContent = `${(stats.critChance * 100).toFixed(1)}%`;
        document.getElementById('class-crit-multi').textContent = `${stats.critMultiplier.toFixed(1)}x`;
        
        // Enable/disable attribute buttons based on available points
        const attrButtons = document.querySelectorAll('.attr-increase-btn');
        attrButtons.forEach(button => {
            button.disabled = characterClass.attributePoints <= 0;
        });
        
        // Update skills
        this.updateSkillsDisplay();
    }
    
    updateSkillsDisplay() {
        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = ''; // Clear existing skills
        
        if (!this.hero.skillTree || !this.hero.skillTree.skills) {
            return;
        }
        
        // Get all skills from the skill tree
        const skills = this.hero.skillTree.skills;
        
        // Create a skill item for each skill
        for (const skillId in skills) {
            const skill = skills[skillId];
            const isUnlocked = this.hero.skillTree.isSkillUnlocked(skillId);
            const canUnlock = this.hero.skillTree.canUnlockSkill(skillId);
            
            const skillElement = document.createElement('div');
            skillElement.className = 'skill-item';
            
            // Add skill name
            const nameElement = document.createElement('div');
            nameElement.className = 'skill-name';
            nameElement.textContent = skill.name;
            skillElement.appendChild(nameElement);
            
            // Add skill description
            const descElement = document.createElement('div');
            descElement.className = 'skill-description';
            descElement.textContent = skill.description;
            skillElement.appendChild(descElement);
            
            // Add skill stats
            const statsElement = document.createElement('div');
            statsElement.className = 'skill-stats';
            
            // Add relevant stats based on skill type
            if (skill.baseDamage) {
                statsElement.innerHTML += `Damage: ${skill.baseDamage}<br>`;
            }
            if (skill.damageType) {
                statsElement.innerHTML += `Type: ${this.capitalizeFirstLetter(skill.damageType)}<br>`;
            }
            if (skill.cooldown) {
                statsElement.innerHTML += `Cooldown: ${skill.cooldown}s<br>`;
            }
            if (skill.manaCost) {
                statsElement.innerHTML += `Mana: ${skill.manaCost}<br>`;
            }
            
            skillElement.appendChild(statsElement);
            
            // Add unlock button if not already unlocked
            if (!isUnlocked) {
                const unlockButton = document.createElement('button');
                unlockButton.className = 'skill-unlock-btn';
                unlockButton.textContent = 'Unlock Skill';
                unlockButton.disabled = !canUnlock || this.hero.characterClass.skillPoints <= 0;
                
                unlockButton.addEventListener('click', () => {
                    this.unlockSkill(skillId);
                });
                
                skillElement.appendChild(unlockButton);
            } else {
                // Show that the skill is already unlocked
                const unlockedText = document.createElement('div');
                unlockedText.className = 'skill-unlocked';
                unlockedText.textContent = 'Unlocked';
                unlockedText.style.color = '#4CAF50';
                unlockedText.style.fontWeight = 'bold';
                unlockedText.style.marginTop = '8px';
                skillElement.appendChild(unlockedText);
            }
            
            skillsContainer.appendChild(skillElement);
        }
    }
    
    increaseAttribute(attribute) {
        if (this.hero && this.hero.spendAttributePoint) {
            const success = this.hero.spendAttributePoint(attribute);
            if (success) {
                // Update the UI
                this.updateCharacterInfo();
            }
        }
    }
    
    unlockSkill(skillId) {
        if (this.hero && this.hero.spendSkillPoint) {
            const success = this.hero.spendSkillPoint(skillId);
            if (success) {
                // Update the UI
                this.updateCharacterInfo();
            }
        }
    }
    
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}