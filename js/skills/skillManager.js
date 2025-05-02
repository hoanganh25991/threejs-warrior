import * as THREE from 'three';
import { config } from '../config/config.js';

export class SkillManager {
    constructor(scene) {
        this.scene = scene;
        this.activeSkills = [];
        this.skillEffects = [];
        
        // Cache for geometries and materials to avoid recreating them
        this.geometryCache = {};
        this.materialCache = {};
        
        // Initialize instanced meshes for common skill types
        this.initInstancedMeshes();
        
        // Performance settings
        this.useInstancing = true;
        this.lowPolyMode = true;
        this.maxActiveSkills = 50; // Limit the number of active skills
        
        // Last frame time for throttling updates
        this.lastUpdateTime = 0;
        this.updateInterval = 1/60; // Target 60 FPS for skill updates
    }
    
    initInstancedMeshes() {
        // Create instanced meshes for common skill types
        this.instancedMeshes = {
            fireball: this.createInstancedMesh('fireball', 20),
            iceball: this.createInstancedMesh('iceball', 20),
            shield: this.createInstancedMesh('shield', 5),
            cone: this.createInstancedMesh('cone', 10),
            cylinder: this.createInstancedMesh('cylinder', 10)
        };
    }
    
    createInstancedMesh(type, count) {
        let geometry, material;
        
        // Create low-poly geometries for instancing
        switch(type) {
            case 'fireball':
                geometry = new THREE.SphereGeometry(0.5, 8, 8);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0xff4500,
                    emissive: 0xff0000,
                    emissiveIntensity: 0.5
                });
                break;
            case 'iceball':
                geometry = new THREE.SphereGeometry(0.5, 8, 8);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    emissive: 0x0088ff,
                    emissiveIntensity: 0.5
                });
                break;
            case 'shield':
                geometry = new THREE.SphereGeometry(1.2, 8, 8);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0x4169e1,
                    transparent: true,
                    opacity: 0.5
                });
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.7, 2.5, 8);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0xff4500
                });
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
                material = new THREE.MeshBasicMaterial({ 
                    color: 0xffaa00
                });
                break;
            default:
                geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }
        
        // Store in cache
        this.geometryCache[type] = geometry;
        this.materialCache[type] = material;
        
        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        instancedMesh.count = 0; // Start with 0 instances
        instancedMesh.frustumCulled = true; // Enable frustum culling
        
        // Add to scene
        this.scene.add(instancedMesh);
        
        return {
            mesh: instancedMesh,
            type: type,
            maxCount: count,
            activeInstances: 0,
            instanceMap: new Map() // Maps skill ID to instance index
        };
    }
    
    useSkill(skillName, position, direction) {
        // Get skill configuration
        let skill;
        
        for (const key in config.skills) {
            if (config.skills[key].name === skillName) {
                skill = config.skills[key];
                break;
            }
        }
        
        if (!skill) {
            console.error(`Skill ${skillName} not found`);
            return null;
        }
        
        // Limit active skills for performance
        if (this.activeSkills.length >= this.maxActiveSkills) {
            // Remove oldest skill
            const oldestSkill = this.activeSkills.shift();
            this.removeSkillEffect(oldestSkill);
        }
        
        // Create skill effect
        const effect = this.createSkillEffect(skill, position, direction);
        
        // Add to active skills
        const activeSkill = {
            id: Date.now() + Math.random(), // Unique ID
            skill,
            effect,
            position: new THREE.Vector3().copy(position),
            direction: new THREE.Vector3().copy(direction),
            distance: 0,
            maxDistance: skill.range || 10,
            damage: skill.damage || 0,
            areaOfEffect: skill.areaOfEffect || 0,
            duration: 0,
            maxDuration: 2, // seconds
            instanceData: null // Will be set if using instancing
        };
        
        this.activeSkills.push(activeSkill);
        
        return effect;
    }
    
    getSkillType(skillName) {
        // Map skill names to instanced mesh types
        const skillTypeMap = {
            'Fireball': 'fireball',
            'Dragon Slave': 'fireball',
            'Battle Hunger': 'fireball',
            'Frost Nova': 'iceball',
            'Ice Blast': 'iceball',
            'Ice Shards': 'iceball',
            'Frozen Orb': 'iceball',
            'Shield': 'shield',
            'Fire Shield': 'shield',
            'Glacial Barrier': 'shield',
            'Dragon Breath': 'cone',
            'Flame Strike': 'cone',
            'Culling Blade': 'cone',
            'Ice Spike': 'cone',
            'Thunder Strike': 'cylinder',
            'Light Strike Array': 'cylinder',
            'Blizzard': 'cylinder'
        };
        
        return skillTypeMap[skillName] || null;
    }
    
    createSkillEffect(skill, position, direction) {
        // Check if we can use instancing for this skill
        const skillType = this.getSkillType(skill.name);
        
        if (this.useInstancing && skillType && this.instancedMeshes[skillType]) {
            return this.createInstancedEffect(skill, position, direction, skillType);
        }
        
        // Fall back to regular mesh creation if instancing not available
        return this.createRegularEffect(skill, position, direction);
    }
    
    createInstancedEffect(skill, position, direction, skillType) {
        const instancedMeshData = this.instancedMeshes[skillType];
        
        // Check if we have room for another instance
        if (instancedMeshData.activeInstances >= instancedMeshData.maxCount) {
            // No room, fall back to regular mesh
            return this.createRegularEffect(skill, position, direction);
        }
        
        // Get the next available instance index
        const instanceIndex = instancedMeshData.activeInstances++;
        
        // Create transform matrix for this instance
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(position.x, position.y, position.z);
        
        // For projectiles, apply rotation
        if (['fireball', 'iceball', 'cone'].includes(skillType)) {
            // Create a rotation matrix to point in the direction
            const lookAtMatrix = new THREE.Matrix4();
            const targetPos = position.clone().add(direction);
            
            // Create a temporary object to use lookAt
            const tempObj = new THREE.Object3D();
            tempObj.position.copy(position);
            tempObj.lookAt(targetPos);
            tempObj.updateMatrix();
            
            // Combine translation and rotation
            matrix.multiply(tempObj.matrix);
        }
        
        // Set the matrix for this instance
        instancedMeshData.mesh.setMatrixAt(instanceIndex, matrix);
        instancedMeshData.mesh.instanceMatrix.needsUpdate = true;
        
        // Make sure the instance count is updated
        if (instancedMeshData.mesh.count < instancedMeshData.activeInstances) {
            instancedMeshData.mesh.count = instancedMeshData.activeInstances;
        }
        
        // Store instance data in the skill
        const instanceData = {
            meshData: instancedMeshData,
            index: instanceIndex,
            type: skillType
        };
        
        // Map the skill ID to the instance index
        const skillId = Date.now() + Math.random();
        instancedMeshData.instanceMap.set(skillId, instanceIndex);
        
        // Return a proxy object that mimics a mesh
        return {
            isInstancedMesh: true,
            position: position.clone(),
            instanceData: instanceData,
            skillId: skillId,
            lookAt: function() {} // Dummy function
        };
    }
    
    createRegularEffect(skill, position, direction) {
        let geometry, material;
        
        // Use cached geometries and materials when possible
        const cacheKey = skill.name;
        
        if (this.geometryCache[cacheKey] && this.materialCache[cacheKey]) {
            geometry = this.geometryCache[cacheKey];
            material = this.materialCache[cacheKey];
        } else {
            // Create geometry and material based on skill type
            switch(skill.name) {
                case 'Fireball':
                    geometry = new THREE.SphereGeometry(0.5, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff4500,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.5
                    });
                    break;
                case 'Dragon Breath':
                    geometry = new THREE.ConeGeometry(0.7, 2.5, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff4500
                    });
                    break;
                case 'Flame Strike':
                    geometry = new THREE.CylinderGeometry(0, 1.5, 3, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff8800
                    });
                    break;
                case 'Dragon Tail':
                    geometry = new THREE.BoxGeometry(0.5, 0.5, 2);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xffaa00
                    });
                    break;
                case 'Elder Dragon Form':
                    geometry = new THREE.SphereGeometry(1.5, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.6
                    });
                    break;
                case 'Fire Shield':
                    geometry = new THREE.SphereGeometry(1.3, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff8800,
                        transparent: true,
                        opacity: 0.5
                    });
                    break;
                case 'Dragon Rush':
                    geometry = new THREE.BoxGeometry(0.7, 0.7, 3.5);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff4400,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                case 'Frost Nova':
                    geometry = new THREE.SphereGeometry(0.8, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ffff
                    });
                    break;
                case 'Ice Blast':
                    geometry = new THREE.IcosahedronGeometry(0.7, this.lowPolyMode ? 0 : 1);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ffff
                    });
                    break;
                case 'Glacial Barrier':
                    geometry = new THREE.SphereGeometry(1.3, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x88ccff,
                        transparent: true,
                        opacity: 0.5
                    });
                    break;
                case 'Blizzard':
                    geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xaaddff,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                case 'Frozen Orb':
                    geometry = new THREE.SphereGeometry(1, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.8
                    });
                    break;
                case 'Ice Shards':
                    geometry = new THREE.TetrahedronGeometry(0.6, this.lowPolyMode ? 0 : 1);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x88ccff
                    });
                    break;
                case 'Berserker\'s Call':
                    geometry = new THREE.RingGeometry(0.5, 1.5, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                case 'Battle Hunger':
                    geometry = new THREE.SphereGeometry(0.7, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff6600
                    });
                    break;
                case 'Counter Helix':
                    geometry = new THREE.TorusGeometry(1, 0.2, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 16 : 32);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.8
                    });
                    break;
                case 'Culling Blade':
                    geometry = new THREE.ConeGeometry(0.8, 2.5, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000
                    });
                    break;
                case 'Battle Trance':
                    geometry = new THREE.SphereGeometry(1.2, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff4400,
                        transparent: true,
                        opacity: 0.6
                    });
                    break;
                case 'Berserker\'s Rage':
                    geometry = new THREE.SphereGeometry(1, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                case 'Dragon Slave':
                    geometry = new THREE.ConeGeometry(0.6, 2, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff4400
                    });
                    break;
                case 'Light Strike Array':
                    geometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xffaa00,
                        transparent: true,
                        opacity: 0.8
                    });
                    break;
                case 'Fiery Soul':
                    geometry = new THREE.SphereGeometry(1, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff8800,
                        transparent: true,
                        opacity: 0.6
                    });
                    break;
                case 'Laguna Blade':
                    geometry = new THREE.CylinderGeometry(0.3, 0.3, 3, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff00ff
                    });
                    break;
                case 'Flame Cloak':
                    geometry = new THREE.SphereGeometry(1.2, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff6600,
                        transparent: true,
                        opacity: 0.5
                    });
                    break;
                case 'Inferno Wave':
                    geometry = new THREE.RingGeometry(0.5, 2, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xff4400,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                case 'Ice Spike':
                    geometry = new THREE.ConeGeometry(0.5, 2, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ffff
                    });
                    break;
                case 'Thunder Strike':
                    geometry = new THREE.CylinderGeometry(0, 0.5, 3, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0xffff00
                    });
                    break;
                case 'Heal':
                case 'Healing Wave':
                    geometry = new THREE.TorusGeometry(1, 0.2, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 16 : 32);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ff00,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                case 'Shield':
                    geometry = new THREE.SphereGeometry(1.2, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x4169e1,
                        transparent: true,
                        opacity: 0.5
                    });
                    break;
                case 'Dash':
                    geometry = new THREE.BoxGeometry(0.5, 0.5, 3);
                    material = new THREE.MeshBasicMaterial({ 
                        color: 0x808080,
                        transparent: true,
                        opacity: 0.7
                    });
                    break;
                default:
                    geometry = new THREE.SphereGeometry(0.5, this.lowPolyMode ? 8 : 16, this.lowPolyMode ? 8 : 16);
                    material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            }
            
            // Cache for future use
            this.geometryCache[cacheKey] = geometry;
            this.materialCache[cacheKey] = material;
        }
        
        // Create mesh with optimizations
        const effect = new THREE.Mesh(geometry, material);
        
        // Enable GPU acceleration hints
        effect.matrixAutoUpdate = false; // We'll update the matrix manually
        effect.frustumCulled = true; // Enable frustum culling
        
        // Position and orient the effect
        effect.position.copy(position);
        
        // For projectile skills, orient them in the direction of travel
        if ([
            'Fireball', 
            'Ice Spike', 
            'Dragon Breath',
            'Flame Strike',
            'Dragon Tail',
            'Frost Nova',
            'Ice Blast',
            'Ice Shards',
            'Battle Hunger',
            'Culling Blade',
            'Dragon Slave',
            'Laguna Blade'
        ].includes(skill.name)) {
            effect.lookAt(position.clone().add(direction));
        }
        
        // Update matrix once
        effect.updateMatrix();
        
        // Add to scene
        this.scene.add(effect);
        
        // Add to skill effects array
        this.skillEffects.push(effect);
        
        return effect;
    }
    
    update(deltaTime, enemyManager) {
        // Throttle updates for performance
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        this.lastUpdateTime = currentTime;
        
        // Update all active skills
        for (let i = this.activeSkills.length - 1; i >= 0; i--) {
            const activeSkill = this.activeSkills[i];
            
            // Update duration
            activeSkill.duration += deltaTime;
            
            // Handle different skill behaviors
            switch(activeSkill.skill.name) {
                // Projectile skills
                case 'Fireball':
                case 'Ice Spike':
                case 'Dragon Breath':
                case 'Flame Strike':
                case 'Dragon Tail':
                case 'Frost Nova':
                case 'Ice Blast':
                case 'Ice Shards':
                case 'Battle Hunger':
                case 'Culling Blade':
                case 'Dragon Slave':
                case 'Laguna Blade':
                    // Move projectile
                    this.updateProjectile(activeSkill, deltaTime, enemyManager);
                    break;
                
                // Area effect skills
                case 'Thunder Strike':
                case 'Light Strike Array':
                case 'Berserker\'s Call':
                case 'Counter Helix':
                case 'Blizzard':
                case 'Inferno Wave':
                    // Area effect at target location
                    this.updateAreaEffect(activeSkill, deltaTime, enemyManager);
                    break;
                
                // Self/buff skills
                case 'Heal':
                case 'Shield':
                case 'Elder Dragon Form':
                case 'Fire Shield':
                case 'Glacial Barrier':
                case 'Frozen Orb':
                case 'Fiery Soul':
                case 'Battle Trance':
                case 'Berserker\'s Rage':
                case 'Flame Cloak':
                    // Self effect (handled by hero class)
                    this.updateSelfEffect(activeSkill, deltaTime);
                    break;
                
                // Movement skills
                case 'Dash':
                case 'Dragon Rush':
                    // Dash effect (handled by hero class)
                    this.updateSelfEffect(activeSkill, deltaTime);
                    break;
            }
            
            // Remove skill if duration exceeded
            if (activeSkill.duration >= activeSkill.maxDuration) {
                this.removeSkillEffect(activeSkill);
                this.activeSkills.splice(i, 1);
            }
        }
        
        // Update instanced meshes
        this.updateInstancedMeshes();
    }
    
    removeSkillEffect(activeSkill) {
        if (!activeSkill.effect) return;
        
        if (activeSkill.effect.isInstancedMesh) {
            // Handle instanced mesh removal
            const instanceData = activeSkill.effect.instanceData;
            if (instanceData) {
                const meshData = instanceData.meshData;
                const index = instanceData.index;
                
                // Free up this instance
                meshData.instanceMap.delete(activeSkill.effect.skillId);
                meshData.activeInstances--;
                
                // Update the instance count
                if (meshData.activeInstances < meshData.mesh.count) {
                    meshData.mesh.count = meshData.activeInstances;
                }
            }
        } else {
            // Remove regular mesh from scene
            this.scene.remove(activeSkill.effect);
            
            // Remove from skill effects array
            const effectIndex = this.skillEffects.indexOf(activeSkill.effect);
            if (effectIndex !== -1) {
                this.skillEffects.splice(effectIndex, 1);
            }
            
            // Dispose of geometry and material to free memory
            if (activeSkill.effect.geometry && !this.geometryCache[activeSkill.skill.name]) {
                activeSkill.effect.geometry.dispose();
            }
            if (activeSkill.effect.material && !this.materialCache[activeSkill.skill.name]) {
                activeSkill.effect.material.dispose();
            }
        }
    }
    
    updateInstancedMeshes() {
        // Update all instanced meshes
        for (const type in this.instancedMeshes) {
            const meshData = this.instancedMeshes[type];
            if (meshData.activeInstances > 0) {
                meshData.mesh.instanceMatrix.needsUpdate = true;
            }
        }
    }
    
    updateProjectile(activeSkill, deltaTime, enemyManager) {
        // Move projectile in direction
        const moveSpeed = 10 * deltaTime;
        activeSkill.position.add(activeSkill.direction.clone().multiplyScalar(moveSpeed));
        
        // Update effect position
        if (activeSkill.effect.isInstancedMesh) {
            // Update instanced mesh
            const instanceData = activeSkill.effect.instanceData;
            if (instanceData) {
                const meshData = instanceData.meshData;
                const index = instanceData.index;
                
                // Update matrix for this instance
                const matrix = new THREE.Matrix4();
                matrix.makeTranslation(
                    activeSkill.position.x,
                    activeSkill.position.y,
                    activeSkill.position.z
                );
                
                meshData.mesh.setMatrixAt(index, matrix);
                // We'll update the instance matrix in the main update loop
            }
        } else {
            // Update regular mesh
            activeSkill.effect.position.copy(activeSkill.position);
            activeSkill.effect.updateMatrix();
        }
        
        // Update distance traveled
        activeSkill.distance += moveSpeed;
        
        // Check for collisions with enemies
        if (enemyManager) {
            const hitEnemies = enemyManager.handlePlayerAttack(
                activeSkill.position,
                activeSkill.areaOfEffect || 1,
                activeSkill.damage
            );
            
            // If hit any enemies, remove projectile
            if (hitEnemies.length > 0) {
                activeSkill.duration = activeSkill.maxDuration; // This will remove the skill on next update
            }
        }
        
        // Remove if max distance reached
        if (activeSkill.distance >= activeSkill.maxDistance) {
            activeSkill.duration = activeSkill.maxDuration;
        }
    }
    
    updateAreaEffect(activeSkill, deltaTime, enemyManager) {
        // For area effects, damage is applied once at the beginning
        if (activeSkill.duration < deltaTime && enemyManager) {
            enemyManager.handlePlayerAttack(
                activeSkill.position,
                activeSkill.areaOfEffect,
                activeSkill.damage
            );
        }
        
        // Scale effect up and down for visual appeal
        const scale = Math.sin(Math.PI * (activeSkill.duration / activeSkill.maxDuration));
        
        if (activeSkill.effect.isInstancedMesh) {
            // Update instanced mesh
            const instanceData = activeSkill.effect.instanceData;
            if (instanceData) {
                const meshData = instanceData.meshData;
                const index = instanceData.index;
                
                // Update matrix for this instance with scale
                const matrix = new THREE.Matrix4();
                matrix.makeTranslation(
                    activeSkill.position.x,
                    activeSkill.position.y,
                    activeSkill.position.z
                );
                
                // Apply scale
                const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);
                matrix.multiply(scaleMatrix);
                
                meshData.mesh.setMatrixAt(index, matrix);
                // We'll update the instance matrix in the main update loop
            }
        } else {
            // Update regular mesh
            activeSkill.effect.scale.set(scale, scale, scale);
            activeSkill.effect.updateMatrix();
        }
    }
    
    updateSelfEffect(activeSkill, deltaTime) {
        // For self effects (heal, shield, dash), just update visual effect
        // The actual effect is handled by the hero class
        
        // Fade out effect over time
        const opacity = 1 - (activeSkill.duration / activeSkill.maxDuration);
        
        if (activeSkill.effect.isInstancedMesh) {
            // Can't update opacity for individual instances, so we'll just update position
            const instanceData = activeSkill.effect.instanceData;
            if (instanceData) {
                const meshData = instanceData.meshData;
                const index = instanceData.index;
                
                // Update matrix for this instance
                const matrix = new THREE.Matrix4();
                matrix.makeTranslation(
                    activeSkill.position.x,
                    activeSkill.position.y,
                    activeSkill.position.z
                );
                
                meshData.mesh.setMatrixAt(index, matrix);
                // We'll update the instance matrix in the main update loop
            }
        } else if (activeSkill.effect.material && activeSkill.effect.material.opacity !== undefined) {
            activeSkill.effect.material.opacity = opacity;
        }
    }
    
    clearAllSkills() {
        // Remove all skill effects from scene
        for (const effect of this.skillEffects) {
            this.scene.remove(effect);
        }
        
        // Clear instanced meshes
        for (const type in this.instancedMeshes) {
            const meshData = this.instancedMeshes[type];
            meshData.activeInstances = 0;
            meshData.mesh.count = 0;
            meshData.instanceMap.clear();
        }
        
        // Clear arrays
        this.skillEffects = [];
        this.activeSkills = [];
    }
}

export default SkillManager;