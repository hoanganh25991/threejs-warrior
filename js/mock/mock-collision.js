import * as THREE from 'three';

/**
 * A simplified collision system for testing skills in the model viewer
 */
export default class MockCollisionSystem {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.debugMode = true;
        
        // Create a group for debug visualization
        this.debugGroup = new THREE.Group();
        scene.add(this.debugGroup);
    }
    
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }
    
    clearEnemies() {
        this.enemies = [];
    }
    
    checkSkillCollision(effect, origin, direction, range, radius, damage, damageType) {
        // Clear previous debug visualizations
        while (this.debugGroup.children.length > 0) {
            this.debugGroup.remove(this.debugGroup.children[0]);
        }
        
        // Create debug visualization based on effect type
        if (this.debugMode) {
            this.createDebugVisualization(effect, origin, direction, range, radius);
        }
        
        // Check for collisions based on effect type
        const hitEnemies = [];
        
        for (const enemy of this.enemies) {
            let hit = false;
            
            switch (effect.type) {
                case 'projectile':
                    hit = this.checkProjectileCollision(origin, direction, range, radius, enemy);
                    break;
                case 'cone':
                    hit = this.checkConeCollision(origin, direction, range, effect.width || Math.PI/4, enemy);
                    break;
                case 'aoe':
                    hit = this.checkAOECollision(effect.position || origin, effect.radius || radius, enemy);
                    break;
                default:
                    hit = this.checkProjectileCollision(origin, direction, range, radius, enemy);
            }
            
            if (hit) {
                // Apply damage to enemy
                if (enemy.takeDamage) {
                    enemy.takeDamage(damage, damageType);
                }
                
                // Add to hit list
                hitEnemies.push({
                    enemy,
                    position: enemy.position.clone(),
                    damage
                });
            }
        }
        
        return hitEnemies;
    }
    
    checkProjectileCollision(origin, direction, range, radius, enemy) {
        // Simple ray-cylinder intersection
        const rayOrigin = origin.clone();
        const rayDirection = direction.clone().normalize();
        
        const enemyPos = enemy.position.clone();
        enemyPos.y = rayOrigin.y; // Simplify to 2D for now
        
        // Calculate distance from ray to enemy center
        const toEnemy = enemyPos.clone().sub(rayOrigin);
        const projection = toEnemy.dot(rayDirection);
        
        // Enemy is behind the ray origin
        if (projection < 0) return false;
        
        // Enemy is beyond the ray range
        if (projection > range) return false;
        
        // Calculate closest point on ray to enemy
        const closestPoint = rayOrigin.clone().add(rayDirection.clone().multiplyScalar(projection));
        const distance = closestPoint.distanceTo(enemyPos);
        
        // Check if within collision radius (enemy radius + projectile radius)
        return distance < (radius + 0.5); // Assuming enemy radius is 0.5
    }
    
    checkConeCollision(origin, direction, range, angle, enemy) {
        const toEnemy = enemy.position.clone().sub(origin);
        
        // Check distance
        const distance = toEnemy.length();
        if (distance > range) return false;
        
        // Check angle
        toEnemy.normalize();
        const dot = toEnemy.dot(direction.clone().normalize());
        const angleBetween = Math.acos(dot);
        
        return angleBetween <= angle / 2;
    }
    
    checkAOECollision(center, radius, enemy) {
        const distance = center.distanceTo(enemy.position);
        return distance <= radius + 0.5; // Assuming enemy radius is 0.5
    }
    
    createDebugVisualization(effect, origin, direction, range, radius) {
        switch (effect.type) {
            case 'projectile':
                this.createProjectileVisualization(origin, direction, range, radius);
                break;
            case 'cone':
                this.createConeVisualization(origin, direction, range, effect.width || Math.PI/4);
                break;
            case 'aoe':
                this.createAOEVisualization(effect.position || origin, effect.radius || radius);
                break;
            default:
                this.createProjectileVisualization(origin, direction, range, radius);
        }
    }
    
    createProjectileVisualization(origin, direction, range, radius) {
        // Create a line representing the projectile path
        const points = [
            origin.clone(),
            origin.clone().add(direction.clone().normalize().multiplyScalar(range))
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff });
        const line = new THREE.Line(geometry, material);
        this.debugGroup.add(line);
        
        // Create a cylinder representing the collision volume
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, range, 8);
        cylinderGeometry.rotateX(Math.PI / 2);
        cylinderGeometry.translate(0, 0, range / 2);
        
        const cylinderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.2,
            wireframe: true
        });
        
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.position.copy(origin);
        
        // Align cylinder with direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
        cylinder.quaternion.copy(quaternion);
        
        this.debugGroup.add(cylinder);
    }
    
    createConeVisualization(origin, direction, range, angle) {
        // Create a cone representing the area of effect
        const coneGeometry = new THREE.ConeGeometry(Math.tan(angle / 2) * range, range, 16, 1, true);
        coneGeometry.rotateX(Math.PI / 2);
        
        const coneMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff9900, 
            transparent: true, 
            opacity: 0.2,
            wireframe: true,
            side: THREE.DoubleSide
        });
        
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.copy(origin);
        
        // Align cone with direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
        cone.quaternion.copy(quaternion);
        
        this.debugGroup.add(cone);
    }
    
    createAOEVisualization(center, radius) {
        // Create a sphere representing the area of effect
        const sphereGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.2,
            wireframe: true
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(center);
        
        this.debugGroup.add(sphere);
    }
    
    cleanup() {
        this.scene.remove(this.debugGroup);
    }
}