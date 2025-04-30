import TreasureChest from './interactive-objects/TreasureChest.js';
import GlowingCrystal from './interactive-objects/GlowingCrystal.js';
import TrainingDummy from './interactive-objects/TrainingDummy.js';

/**
 * Creates and adds interactive objects to the scene
 */
export function addInteractiveObjects(scene) {
    const interactiveObjects = [];
    
    // 1. Add treasure chests
    for (let i = 0; i < 10; i++) {
        const chest = new TreasureChest().positionRandomly();
        scene.add(chest);
        interactiveObjects.push({
            mesh: chest,
            type: chest.type,
            interactionRadius: chest.interactionRadius,
            onInteract: chest.onInteract
        });
    }
    
    // 2. Add glowing crystals
    for (let i = 0; i < 15; i++) {
        const crystal = new GlowingCrystal().positionRandomly();
        scene.add(crystal);
        interactiveObjects.push({
            mesh: crystal,
            type: crystal.type,
            interactionRadius: crystal.interactionRadius,
            onInteract: crystal.onInteract
        });
    }
    
    // 3. Add training dummies
    for (let i = 0; i < 5; i++) {
        const dummy = new TrainingDummy().positionRandomly();
        scene.add(dummy);
        interactiveObjects.push({
            mesh: dummy,
            type: dummy.type,
            interactionRadius: dummy.interactionRadius,
            health: dummy.health,
            onInteract: dummy.onInteract
        });
    }
    
    return interactiveObjects;
}