// Character Info UI Module
export default class CharacterInfo {
    constructor(hero, mouseCaptureManager) {
        this.hero = hero;
        this.modal = document.getElementById('class-info-modal');
        this.closeButton = document.querySelector('.close-button');
        this.openButton = document.getElementById('class-info-button');
        this.mouseCaptureManager = mouseCaptureManager || window.mouseCaptureManager;
        
        // Unique identifier for this component
        this.componentId = 'character-info-modal';
        
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
        
        // Disable mouse capture while modal is open
        if (this.mouseCaptureManager) {
            this.mouseCaptureManager.disableMouseCapture(this.componentId);
        } else {
            // Fallback if mouse capture manager is not available
            if (window.inputHandler) {
                window.inputHandler.isMouseCaptured = false;
                if (document.pointerLockElement) {
                    document.exitPointerLock();
                }
            }
        }
    }
    
    closeModal() {
        this.modal.classList.add('hidden');
        
        // Re-enable mouse capture when modal is closed
        if (this.mouseCaptureManager) {
            this.mouseCaptureManager.enableMouseCapture(this.componentId);
        } else {
            // Fallback if mouse capture manager is not available
            if (window.inputHandler) {
                window.inputHandler.isMouseCaptured = true;
            }
        }
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
        const characterClass = this.hero.characterClass.type;
        
        // Create a visual skill tree container
        const skillTreeContainer = document.createElement('div');
        skillTreeContainer.className = `skill-tree-container ${characterClass}`;
        
        // Add a description for the skill tree
        const skillTreeDescription = document.createElement('div');
        skillTreeDescription.className = 'skill-tree-description';
        skillTreeDescription.style.marginBottom = '20px';
        skillTreeDescription.style.padding = '10px';
        skillTreeDescription.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        skillTreeDescription.style.borderRadius = '5px';
        skillTreeDescription.style.color = '#fff';
        skillTreeDescription.style.fontSize = '14px';
        skillTreeDescription.style.lineHeight = '1.4';
        
        // Add class-specific description
        let description = '';
        switch(characterClass) {
            case 'warrior':
                description = 'The Warrior skill tree focuses on powerful melee attacks and defensive abilities. Start with basic skills like Brutal Strike and Iron Skin, then progress to more powerful abilities like Whirlwind. Warriors excel at close combat and tanking damage.';
                break;
            case 'mage':
                description = 'The Mage skill tree focuses on powerful magical attacks and area damage. Begin with Fireball as your basic attack, then progress to more devastating spells like Meteor. Mages excel at dealing high damage from a distance.';
                break;
            case 'rogue':
                description = 'The Rogue skill tree focuses on stealth, critical strikes, and mobility. Start with Shadow Strike for high single-target damage, then unlock Smoke Bomb for area control. Rogues excel at dealing burst damage and evading enemies.';
                break;
            case 'paladin':
                description = 'The Paladin skill tree balances offensive holy magic with protective abilities. Begin with Divine Smite for damage, then progress to Holy Shield for protection. Paladins excel at supporting allies while dealing consistent damage.';
                break;
            default:
                description = 'Unlock base skills first, then progress to more powerful abilities. Spend skill points wisely to create a build that matches your playstyle.';
        }
        
        skillTreeDescription.innerHTML = `<strong>Skill Progression Guide:</strong><br>${description}<br><br>
            <strong>How to use:</strong> Click on available skills (gold border) to unlock them. Skills with requirements will become available once you unlock their prerequisites.`;
        
        skillTreeContainer.appendChild(skillTreeDescription);
        
        // Create the skill tree structure
        const skillTree = document.createElement('div');
        skillTree.className = 'skill-tree';
        
        // Organize skills by their requirements
        const skillsByLevel = this.organizeSkillsByLevel(skills);
        
        // Create rows for each level
        Object.keys(skillsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
            const rowContainer = document.createElement('div');
            rowContainer.className = 'skill-tree-row-container';
            
            // Add a title for this level
            const rowTitle = document.createElement('div');
            rowTitle.className = 'skill-tree-row-title';
            rowTitle.textContent = parseInt(level) === 0 ? 'Base Skills' : `Tier ${level} Skills`;
            rowTitle.style.color = '#f8d000';
            rowTitle.style.fontWeight = 'bold';
            rowTitle.style.marginBottom = '10px';
            rowTitle.style.textAlign = 'center';
            rowTitle.style.fontSize = '1.2rem';
            rowTitle.style.textShadow = '1px 1px 2px black';
            rowContainer.appendChild(rowTitle);
            
            const row = document.createElement('div');
            row.className = 'skill-tree-row';
            
            // Add skills to this row
            skillsByLevel[level].forEach(skillId => {
                const skill = skills[skillId];
                const isUnlocked = this.hero.skillTree.isSkillUnlocked(skillId);
                const canUnlock = this.hero.skillTree.canUnlockSkill(skillId);
                
                // Create skill node
                const skillNode = document.createElement('div');
                skillNode.className = `skill-node ${isUnlocked ? 'unlocked' : canUnlock ? 'available' : 'locked'}`;
                skillNode.setAttribute('data-skill-id', skillId);
                
                // Add skill icon (using text and color instead of image)
                const skillIcon = document.createElement('div');
                skillIcon.className = 'skill-icon';
                skillIcon.style.backgroundColor = this.getSkillIconColor(skill.damageType || 'physical');
                
                // Add skill initial as text
                const iconText = document.createElement('div');
                iconText.textContent = skill.name.charAt(0).toUpperCase();
                iconText.style.color = 'white';
                iconText.style.fontSize = '24px';
                iconText.style.fontWeight = 'bold';
                iconText.style.textShadow = '1px 1px 2px black';
                iconText.style.display = 'flex';
                iconText.style.justifyContent = 'center';
                iconText.style.alignItems = 'center';
                iconText.style.width = '100%';
                iconText.style.height = '100%';
                
                skillIcon.appendChild(iconText);
                skillNode.appendChild(skillIcon);
                
                // Add skill tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'skill-tooltip';
                
                // Add skill name
                const skillName = document.createElement('h4');
                skillName.textContent = skill.name;
                tooltip.appendChild(skillName);
                
                // Add skill description
                const skillDesc = document.createElement('p');
                skillDesc.textContent = skill.description;
                tooltip.appendChild(skillDesc);
                
                // Add skill stats
                const skillStats = document.createElement('div');
                skillStats.className = 'skill-stats';
                
                // Add relevant stats based on skill type
                if (skill.baseDamage) {
                    skillStats.innerHTML += `Damage: ${skill.baseDamage}<br>`;
                }
                if (skill.damageType) {
                    skillStats.innerHTML += `Type: ${this.capitalizeFirstLetter(skill.damageType)}<br>`;
                }
                if (skill.cooldown) {
                    skillStats.innerHTML += `Cooldown: ${skill.cooldown}s<br>`;
                }
                if (skill.manaCost) {
                    skillStats.innerHTML += `Mana: ${skill.manaCost}<br>`;
                }
                
                tooltip.appendChild(skillStats);
                
                // Add requirements if any
                if (skill.requirements && skill.requirements.length > 0) {
                    const reqElement = document.createElement('div');
                    reqElement.className = `skill-requirements ${this.areRequirementsMet(skill.requirements) ? 'met' : ''}`;
                    
                    const reqList = skill.requirements.map(req => {
                        const [reqSkill, reqLevel] = req.split('-');
                        const reqSkillObj = skills[reqSkill];
                        return reqSkillObj ? `${reqSkillObj.name} (Level ${reqLevel})` : req;
                    }).join(', ');
                    
                    reqElement.textContent = `Requires: ${reqList}`;
                    tooltip.appendChild(reqElement);
                }
                
                // Add unlock button if not already unlocked
                if (!isUnlocked) {
                    const unlockButton = document.createElement('button');
                    unlockButton.textContent = 'Unlock Skill';
                    unlockButton.disabled = !canUnlock || this.hero.characterClass.skillPoints <= 0;
                    
                    unlockButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.unlockSkill(skillId);
                    });
                    
                    tooltip.appendChild(unlockButton);
                } else {
                    // Show that the skill is already unlocked
                    const unlockedText = document.createElement('div');
                    unlockedText.textContent = 'Unlocked';
                    unlockedText.style.color = '#4CAF50';
                    unlockedText.style.fontWeight = 'bold';
                    unlockedText.style.marginTop = '8px';
                    tooltip.appendChild(unlockedText);
                }
                
                skillNode.appendChild(tooltip);
                
                // Add skill points indicator if available
                if (canUnlock && this.hero.characterClass.skillPoints > 0) {
                    const indicator = document.createElement('div');
                    indicator.className = 'skill-points-indicator';
                    indicator.textContent = '!';
                    skillNode.appendChild(indicator);
                }
                
                row.appendChild(skillNode);
            });
            
            rowContainer.appendChild(row);
            skillTree.appendChild(rowContainer);
            
            // Add connections between skills
            this.addSkillConnections(row, skillsByLevel, level, skills);
        });
        
        skillTreeContainer.appendChild(skillTree);
        skillsContainer.appendChild(skillTreeContainer);
        
        // Add the list view toggle
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle List View';
        toggleButton.style.marginTop = '10px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#555';
        toggleButton.style.color = '#fff';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        
        toggleButton.addEventListener('click', () => {
            const listView = document.querySelector('.skills-list-view');
            const treeView = document.querySelector('.skill-tree-container');
            
            if (listView) {
                listView.style.display = listView.style.display === 'none' ? 'block' : 'none';
            }
            
            if (treeView) {
                treeView.style.display = treeView.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        skillsContainer.appendChild(toggleButton);
        
        // Also add a simple list view (hidden by default)
        const listView = document.createElement('div');
        listView.className = 'skills-list-view';
        listView.style.display = 'none';
        listView.style.marginTop = '10px';
        
        // Create a skill item for each skill in list format
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
            
            listView.appendChild(skillElement);
        }
        
        skillsContainer.appendChild(listView);
    }
    
    // Helper method to organize skills by their level in the tree
    organizeSkillsByLevel(skills) {
        const skillsByLevel = { '0': [] };
        
        // First pass: add skills with no requirements to level 0
        for (const skillId in skills) {
            const skill = skills[skillId];
            if (!skill.requirements || skill.requirements.length === 0) {
                skillsByLevel['0'].push(skillId);
            }
        }
        
        // Second pass: organize other skills by their requirement depth
        let currentLevel = 0;
        let allSkillsAssigned = false;
        
        while (!allSkillsAssigned) {
            allSkillsAssigned = true;
            const nextLevel = (currentLevel + 1).toString();
            
            if (!skillsByLevel[nextLevel]) {
                skillsByLevel[nextLevel] = [];
            }
            
            for (const skillId in skills) {
                // Skip skills that are already assigned
                if (Object.values(skillsByLevel).flat().includes(skillId)) {
                    continue;
                }
                
                const skill = skills[skillId];
                if (!skill.requirements) continue;
                
                // Check if all requirements are in previous levels
                const allReqsMet = skill.requirements.every(req => {
                    const reqSkillId = req.split('-')[0];
                    return Object.keys(skillsByLevel)
                        .filter(level => parseInt(level) <= currentLevel)
                        .some(level => skillsByLevel[level].includes(reqSkillId));
                });
                
                if (allReqsMet) {
                    skillsByLevel[nextLevel].push(skillId);
                } else {
                    allSkillsAssigned = false;
                }
            }
            
            currentLevel++;
            
            // Safety check to prevent infinite loops
            if (currentLevel > 10) break;
        }
        
        return skillsByLevel;
    }
    
    // Helper method to add connections between skills
    addSkillConnections(row, skillsByLevel, currentLevel, skills) {
        const skillNodes = row.querySelectorAll('.skill-node');
        
        skillNodes.forEach(node => {
            const skillId = node.getAttribute('data-skill-id');
            const skill = skills[skillId];
            
            if (skill.requirements && skill.requirements.length > 0) {
                skill.requirements.forEach(req => {
                    const reqSkillId = req.split('-')[0];
                    
                    // Find the parent skill node in previous rows
                    const parentLevel = Object.keys(skillsByLevel).find(level => 
                        parseInt(level) < parseInt(currentLevel) && 
                        skillsByLevel[level].includes(reqSkillId)
                    );
                    
                    if (parentLevel !== undefined) {
                        // Create a connection line
                        const connection = document.createElement('div');
                        connection.className = `skill-tree-connection ${this.hero.skillTree.isSkillUnlocked(reqSkillId) ? 'active' : ''}`;
                        
                        // Determine if it's a direct parent (previous level) or needs a more complex connection
                        if (parseInt(parentLevel) === parseInt(currentLevel) - 1) {
                            connection.classList.add('vertical');
                            node.appendChild(connection);
                        } else {
                            // More complex connection needed for skills that skip levels
                            // This is a simplified approach - for a real game you might want a more sophisticated connection system
                            connection.classList.add('vertical');
                            connection.style.height = `${(parseInt(currentLevel) - parseInt(parentLevel)) * 40}px`;
                            node.appendChild(connection);
                        }
                    }
                });
            }
        });
    }
    
    // Helper method to check if all requirements for a skill are met
    areRequirementsMet(requirements) {
        if (!requirements || requirements.length === 0) return true;
        
        return requirements.every(req => {
            const [reqSkill, reqLevel] = req.split('-');
            return this.hero.skillTree.isSkillUnlocked(reqSkill) && 
                   this.hero.skillTree.getSkillLevel(reqSkill) >= parseInt(reqLevel);
        });
    }
    
    // Helper method to get a color for skill icons based on damage type
    getSkillIconColor(damageType) {
        const colors = {
            physical: '#8B4513', // Brown
            magic: '#4169E1',    // Royal Blue
            fire: '#FF4500',     // Orange Red
            ice: '#00BFFF',      // Deep Sky Blue
            lightning: '#FFD700', // Gold
            poison: '#32CD32',   // Lime Green
            holy: '#FFFF00',     // Yellow
            shadow: '#800080'    // Purple
        };
        
        return colors[damageType] || '#888888';
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