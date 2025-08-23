// Animal management system handling livestock care, product collection, and AI
// Manages animal spawning, interactions, and daily care mechanics

import { Animal } from '../entities/Animal.js';

export class AnimalSystem {
    constructor() {
        this.gameEngine = null;
        this.animals = new Map(); // entityId -> Animal instance
        this.animalBuildings = new Map(); // building position -> building data
        
        // Animal spawn configurations
        this.spawnConfigs = {
            barn: {
                animalTypes: ['cow', 'sheep'],
                capacity: 8,
                requiredBuilding: 'barn'
            },
            coop: {
                animalTypes: ['chicken'],
                capacity: 12,
                requiredBuilding: 'coop'
            }
        };
        
        // System statistics
        this.stats = {
            totalAnimals: 0,
            animalsByType: {
                cow: 0,
                chicken: 0,
                sheep: 0
            },
            productsCollectedToday: 0,
            totalProductsCollected: 0,
            totalHappiness: 0,
            averageHappiness: 0
        };
        
        // Daily care tracking
        this.dailyCareReminders = [];
        this.productionSchedule = new Map();
        
        // Interaction settings
        this.playerInteractionRange = 48; // 1.5 tiles
        this.lastInteractionTime = 0;
        this.interactionCooldown = 500; // 0.5 second global cooldown
        
        console.log('AnimalSystem initialized');
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Set up time-based callbacks
        if (gameEngine.timeSystem) {
            gameEngine.timeSystem.on('onDayChange', (timeData) => {
                this.onNewDay(timeData);
            });
            
            gameEngine.timeSystem.on('onHourChange', (timeData) => {
                this.onHourChange(timeData);
            });
        }
        
        console.log('AnimalSystem connected to GameEngine');
    }
    
    update(deltaTime) {
        // Update all animals
        for (const animal of this.animals.values()) {
            animal.update(deltaTime);
        }
        
        // Update system statistics
        this.updateStatistics();
        
        // Check for care reminders
        this.checkCareReminders();
    }
    
    updateStatistics() {
        let totalHappiness = 0;
        this.stats.totalAnimals = this.animals.size;
        
        // Reset type counts
        for (const type of Object.keys(this.stats.animalsByType)) {
            this.stats.animalsByType[type] = 0;
        }
        
        // Calculate stats from all animals
        for (const animal of this.animals.values()) {
            totalHappiness += animal.happiness;
            this.stats.animalsByType[animal.animalType]++;
        }
        
        this.stats.totalHappiness = totalHappiness;
        this.stats.averageHappiness = this.stats.totalAnimals > 0 ? 
            Math.round(totalHappiness / this.stats.totalAnimals) : 0;
    }
    
    // Animal management
    spawnAnimal(animalType, x, y, buildingType = null) {
        try {
            // Validate spawn conditions
            if (!this.canSpawnAnimal(animalType, buildingType)) {
                console.warn(`Cannot spawn ${animalType}: capacity or building restrictions`);
                return null;
            }
            
            // Create animal entity
            const animal = new Animal(x, y, animalType, this.gameEngine);
            animal.init(this.gameEngine);
            
            // Register animal in system
            this.animals.set(animal.entityId, animal);
            
            // Add to current scene if available
            const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
            if (currentScene) {
                currentScene.addEntity(animal);
            }
            
            console.log(`Spawned ${animalType} at (${x}, ${y})`);
            return animal;
            
        } catch (error) {
            console.error(`Failed to spawn ${animalType}:`, error);
            return null;
        }
    }
    
    canSpawnAnimal(animalType, buildingType) {
        // Check if animal type is valid
        const validTypes = ['cow', 'chicken', 'sheep'];
        if (!validTypes.includes(animalType)) {
            return false;
        }
        
        // Check building capacity if specified
        if (buildingType) {
            const config = this.spawnConfigs[buildingType];
            if (!config) return false;
            
            if (!config.animalTypes.includes(animalType)) {
                return false;
            }
            
            const currentCount = this.getAnimalCountByBuilding(buildingType);
            if (currentCount >= config.capacity) {
                return false;
            }
        }
        
        return true;
    }
    
    getAnimalCountByBuilding(buildingType) {
        const config = this.spawnConfigs[buildingType];
        if (!config) return 0;
        
        let count = 0;
        for (const animal of this.animals.values()) {
            if (config.animalTypes.includes(animal.animalType)) {
                count++;
            }
        }
        return count;
    }
    
    removeAnimal(animalId) {
        const animal = this.animals.get(animalId);
        if (!animal) return false;
        
        // Remove from current scene
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        if (currentScene) {
            const entityIndex = currentScene.entities.indexOf(animal);
            if (entityIndex !== -1) {
                currentScene.entities.splice(entityIndex, 1);
            }
        }
        
        // Cleanup animal
        animal.destroy();
        
        // Remove from system
        this.animals.delete(animalId);
        
        console.log(`Removed animal ${animalId}`);
        return true;
    }
    
    // Player interaction handling
    handlePlayerInteraction(player, interactionType, targetAnimal = null) {
        const now = Date.now();
        if (now - this.lastInteractionTime < this.interactionCooldown) {
            return { success: false, message: 'Too soon for another interaction' };
        }
        
        // Find nearby animal if not specified
        if (!targetAnimal) {
            targetAnimal = this.getNearestAnimal(player.x, player.y);
        }
        
        if (!targetAnimal) {
            return { success: false, message: 'No animal nearby to interact with' };
        }
        
        const distance = Math.sqrt(
            Math.pow(player.x - targetAnimal.x, 2) + 
            Math.pow(player.y - targetAnimal.y, 2)
        );
        
        if (distance > this.playerInteractionRange) {
            return { success: false, message: 'Too far away from the animal' };
        }
        
        this.lastInteractionTime = now;
        
        // Handle specific interaction types
        switch (interactionType) {
            case 'feed':
                return this.handleFeedInteraction(player, targetAnimal);
            case 'pet':
                return targetAnimal.pet(player);
            case 'collect':
                return this.handleProductCollection(player, targetAnimal);
            case 'examine':
                return this.handleExamineInteraction(targetAnimal);
            default:
                return { success: false, message: 'Unknown interaction type' };
        }
    }
    
    handleFeedInteraction(player, animal) {
        // Find appropriate feed in player inventory
        for (const feedType of animal.config.feedTypes) {
            if (player.inventory.hasItem(feedType, 1)) {
                return animal.feed(feedType, player);
            }
        }
        
        return { 
            success: false, 
            message: `You need ${animal.config.feedTypes.join(' or ')} to feed ${animal.name}` 
        };
    }
    
    handleProductCollection(player, animal) {
        const result = animal.collectProduct(player);
        
        if (result.success) {
            this.stats.productsCollectedToday++;
            this.stats.totalProductsCollected++;
        }
        
        return result;
    }
    
    handleExamineInteraction(animal) {
        const status = animal.getStatusInfo();
        const careAdvice = this.getCareAdvice(animal);
        
        return {
            success: true,
            message: `${status.name}: ${status.happiness}% happy, ${Math.round((100 - status.hunger))}% fed`,
            details: {
                status: status,
                advice: careAdvice
            }
        };
    }
    
    getCareAdvice(animal) {
        const advice = [];
        
        if (animal.hunger > 60) {
            advice.push(`Feed with ${animal.config.feedTypes.join(' or ')}`);
        }
        
        if (animal.happiness < 50) {
            advice.push('Pet for happiness boost');
        }
        
        if (animal.hasProduct) {
            advice.push(`Collect ${animal.config.product}`);
        }
        
        if (animal.getDaysSinceLastCare() > 0) {
            advice.push('Needs daily care');
        }
        
        return advice.length > 0 ? advice : ['Animal is well cared for!'];
    }
    
    // Utility methods
    getNearestAnimal(x, y) {
        let nearestAnimal = null;
        let nearestDistance = Infinity;
        
        for (const animal of this.animals.values()) {
            const distance = Math.sqrt(
                Math.pow(x - animal.x, 2) + 
                Math.pow(y - animal.y, 2)
            );
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestAnimal = animal;
            }
        }
        
        return nearestDistance <= this.playerInteractionRange ? nearestAnimal : null;
    }
    
    getAnimalsInRange(x, y, range) {
        const animalsInRange = [];
        
        for (const animal of this.animals.values()) {
            const distance = Math.sqrt(
                Math.pow(x - animal.x, 2) + 
                Math.pow(y - animal.y, 2)
            );
            
            if (distance <= range) {
                animalsInRange.push(animal);
            }
        }
        
        return animalsInRange;
    }
    
    getAnimalById(animalId) {
        return this.animals.get(animalId) || null;
    }
    
    getAllAnimals() {
        return Array.from(this.animals.values());
    }
    
    getAnimalsByType(animalType) {
        return Array.from(this.animals.values()).filter(
            animal => animal.animalType === animalType
        );
    }
    
    // Time-based events
    onNewDay(timeData) {
        console.log(`New day - checking ${this.animals.size} animals`);
        
        // Reset daily stats
        this.stats.productsCollectedToday = 0;
        this.dailyCareReminders = [];
        
        // Check which animals need care
        for (const animal of this.animals.values()) {
            if (animal.getDaysSinceLastCare() > 0) {
                this.dailyCareReminders.push({
                    animalId: animal.entityId,
                    type: animal.animalType,
                    position: { x: animal.x, y: animal.y },
                    priority: animal.happiness < 30 ? 'high' : 'normal'
                });
            }
        }
        
        if (this.dailyCareReminders.length > 0) {
            console.log(`${this.dailyCareReminders.length} animals need care today`);
        }
    }
    
    onHourChange(timeData) {
        // Update production schedules
        this.updateProductionSchedule();
    }
    
    updateProductionSchedule() {
        this.productionSchedule.clear();
        
        for (const animal of this.animals.values()) {
            if (!animal.hasProduct) {
                const timeUntilProduct = animal.config.productCooldown - 
                    (Date.now() - animal.lastProductGenerated);
                
                if (timeUntilProduct > 0) {
                    this.productionSchedule.set(animal.entityId, {
                        animalType: animal.animalType,
                        productType: animal.config.product,
                        timeRemaining: timeUntilProduct,
                        estimatedQuality: animal.calculateProductQuality()
                    });
                }
            }
        }
    }
    
    checkCareReminders() {
        // Notify about animals that urgently need care
        const urgentCare = this.dailyCareReminders.filter(reminder => 
            reminder.priority === 'high'
        );
        
        if (urgentCare.length > 0 && Math.random() < 0.001) { // Very low chance per frame
            console.warn(`${urgentCare.length} animals urgently need care!`);
        }
    }
    
    // Building management
    registerAnimalBuilding(buildingType, x, y, capacity = null) {
        const key = `${x},${y}`;
        const config = this.spawnConfigs[buildingType];
        
        if (!config) {
            console.warn(`Unknown building type: ${buildingType}`);
            return false;
        }
        
        this.animalBuildings.set(key, {
            type: buildingType,
            position: { x, y },
            capacity: capacity || config.capacity,
            animalTypes: config.animalTypes,
            animals: []
        });
        
        console.log(`Registered ${buildingType} at (${x}, ${y})`);
        return true;
    }
    
    // System information and debugging
    getSystemStats() {
        return {
            ...this.stats,
            careReminders: this.dailyCareReminders.length,
            productionSchedule: this.productionSchedule.size,
            buildings: this.animalBuildings.size
        };
    }
    
    getDetailedAnimalInfo() {
        const animalInfo = [];
        
        for (const animal of this.animals.values()) {
            animalInfo.push({
                ...animal.getStatusInfo(),
                careAdvice: this.getCareAdvice(animal)
            });
        }
        
        return animalInfo.sort((a, b) => a.happiness - b.happiness); // Sort by happiness (lowest first)
    }
    
    getCareReminders() {
        return [...this.dailyCareReminders];
    }
    
    getProductionSchedule() {
        return new Map(this.productionSchedule);
    }
    
    // Debug methods
    renderDebug(renderSystem) {
        if (!this.gameEngine.isDebugMode()) return;
        
        let yOffset = 200;
        const stats = this.getSystemStats();
        
        renderSystem.drawText(
            `Animals: ${stats.totalAnimals} (Avg Happiness: ${stats.averageHappiness}%)`,
            10, yOffset, { color: '#00ff00', layer: 1000 }
        );
        yOffset += 15;
        
        renderSystem.drawText(
            `Products Today: ${stats.productsCollectedToday} | Care Needed: ${stats.careReminders}`,
            10, yOffset, { color: '#00ff00', layer: 1000 }
        );
        
        // Highlight animals needing care
        for (const animal of this.animals.values()) {
            if (animal.happiness < 30 || animal.hunger > 80) {
                renderSystem.drawRect(
                    animal.x - 2, animal.y - 2, 
                    animal.width + 4, animal.height + 4,
                    '#ff0000', 
                    { alpha: 0.3, layer: animal.renderLayer - 1 }
                );
            }
        }
    }
    
    // Cleanup
    cleanup() {
        // Remove all animals
        for (const animal of this.animals.values()) {
            animal.destroy();
        }
        
        this.animals.clear();
        this.animalBuildings.clear();
        this.dailyCareReminders = [];
        this.productionSchedule.clear();
        
        console.log('AnimalSystem cleaned up');
    }
}