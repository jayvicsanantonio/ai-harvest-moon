// Cooking system managing recipes, cooking mechanics, and food preparation
// Handles recipe selection, ingredient checking, and cooking mini-games

import { Recipe } from '../entities/Recipe.js';

export class CookingSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        
        // Recipe management
        this.availableRecipes = new Map();
        this.unlockedRecipes = new Set();
        this.favoriteRecipes = new Set();
        
        // Cooking stations
        this.cookingStations = new Map();
        
        // Player progress
        this.cookingLevel = 1;
        this.cookingExperience = 0;
        this.totalFoodsCooked = 0;
        this.perfectCooks = 0;
        
        // Cooking session state
        this.isCooking = false;
        this.currentRecipe = null;
        this.currentStation = null;
        this.cookingStartTime = 0;
        this.cookingDuration = 0;
        this.perfectTimingWindow = { start: 0, end: 0 };
        
        // UI state
        this.showCookingUI = false;
        this.selectedRecipe = null;
        this.cookingProgress = 0;
        
        console.log('CookingSystem initialized');
    }
    
    // Initialize cooking system
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.loadRecipeDatabase();
        this.createDefaultCookingStations();
        this.unlockStarterRecipes();
        this.isActive = true;
    }
    
    // Load all available recipes
    loadRecipeDatabase() {
        const recipeDatabase = Recipe.createRecipeDatabase();
        
        for (const [recipeId, recipeData] of Object.entries(recipeDatabase)) {
            const recipe = new Recipe(recipeId, recipeData);
            this.availableRecipes.set(recipeId, recipe);
        }
        
        console.log(`Loaded ${this.availableRecipes.size} recipes`);
    }
    
    // Create default cooking stations
    createDefaultCookingStations() {
        const defaultStations = [
            { id: 'kitchen_stove', x: 300, y: 150, type: 'stove', name: 'Kitchen Stove' },
            { id: 'kitchen_oven', x: 350, y: 150, type: 'oven', name: 'Kitchen Oven' },
            { id: 'outdoor_grill', x: 600, y: 400, type: 'grill', name: 'Outdoor Grill' }
        ];
        
        defaultStations.forEach(station => {
            this.createCookingStation(station.id, station.x, station.y, station.type, station.name);
        });
    }
    
    // Create a cooking station
    createCookingStation(id, x, y, type, name = 'Cooking Station') {
        const cookingStation = {
            id,
            x,
            y,
            type,
            name,
            isActive: true,
            inUse: false,
            recipes: this.getRecipesForStation(type),
            level: 1
        };
        
        this.cookingStations.set(id, cookingStation);
        console.log(`Created cooking station: ${name} (${type}) at (${x}, ${y})`);
    }
    
    // Get recipes that can be cooked at a specific station type
    getRecipesForStation(stationType) {
        const compatibleRecipes = [];
        
        for (const recipe of this.availableRecipes.values()) {
            if (recipe.requiredTool === stationType || 
                (stationType === 'advanced_stove' && recipe.requiredTool === 'stove')) {
                compatibleRecipes.push(recipe.recipeId);
            }
        }
        
        return compatibleRecipes;
    }
    
    // Unlock starter recipes
    unlockStarterRecipes() {
        const starterRecipes = ['baked_potato', 'grilled_fish'];
        
        for (const recipeId of starterRecipes) {
            if (this.availableRecipes.has(recipeId)) {
                this.unlockedRecipes.add(recipeId);
                console.log(`Unlocked starter recipe: ${recipeId}`);
            }
        }
    }
    
    // Update cooking system
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update active cooking session
        if (this.isCooking) {
            this.updateCookingSession(deltaTime);
        }
        
        // Check for recipe unlocks based on cooking level
        this.checkRecipeUnlocks();
    }
    
    // Update active cooking session
    updateCookingSession(deltaTime) {
        if (!this.currentRecipe) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.cookingStartTime;
        
        // Update cooking progress
        this.cookingProgress = Math.min(1.0, elapsed / this.cookingDuration);
        
        // Update perfect timing window
        const perfectStart = this.cookingDuration * 0.85;
        const perfectEnd = this.cookingDuration * 0.95;
        this.perfectTimingWindow = {
            start: this.cookingStartTime + perfectStart,
            end: this.cookingStartTime + perfectEnd,
            active: elapsed >= perfectStart && elapsed <= perfectEnd
        };
        
        // Auto-complete if cooking time is exceeded
        if (elapsed >= this.cookingDuration * 1.2) {
            this.completeCooking(false, true); // overcook = true
        }
    }
    
    // Check for new recipe unlocks
    checkRecipeUnlocks() {
        for (const recipe of this.availableRecipes.values()) {
            if (this.unlockedRecipes.has(recipe.recipeId)) continue;
            
            // Check if requirements are met
            if (this.cookingLevel >= recipe.unlockRequirements.cookingLevel) {
                let canUnlock = true;
                
                // Check required recipes
                for (const requiredRecipe of recipe.unlockRequirements.requiredRecipes) {
                    if (!this.unlockedRecipes.has(requiredRecipe)) {
                        canUnlock = false;
                        break;
                    }
                }
                
                if (canUnlock) {
                    this.unlockRecipe(recipe.recipeId);
                }
            }
        }
    }
    
    // Unlock a recipe
    unlockRecipe(recipeId) {
        if (!this.availableRecipes.has(recipeId) || this.unlockedRecipes.has(recipeId)) {
            return false;
        }
        
        this.unlockedRecipes.add(recipeId);
        const recipe = this.availableRecipes.get(recipeId);
        console.log(`🍳 Recipe unlocked: ${recipe.name}!`);
        
        return true;
    }
    
    // Start cooking a recipe
    startCooking(player, recipeId, stationId) {
        if (this.isCooking) {
            return { success: false, message: "Already cooking something" };
        }
        
        const recipe = this.availableRecipes.get(recipeId);
        if (!recipe) {
            return { success: false, message: "Recipe not found" };
        }
        
        const station = this.cookingStations.get(stationId);
        if (!station || !station.isActive) {
            return { success: false, message: "Cooking station not available" };
        }
        
        if (station.inUse) {
            return { success: false, message: "Cooking station is in use" };
        }
        
        // Check if recipe is unlocked
        if (!this.unlockedRecipes.has(recipeId)) {
            return { success: false, message: "Recipe not unlocked" };
        }
        
        // Get player inventory
        const inventory = this.gameEngine.getSystem('tool')?.getInventory();
        if (!inventory) {
            return { success: false, message: "Inventory system not available" };
        }
        
        // Check if recipe can be cooked
        const canCook = recipe.canCook(inventory, this.cookingLevel, Array.from(this.unlockedRecipes));
        if (!canCook.canCook) {
            return { success: false, message: canCook.message };
        }
        
        // Check stamina cost
        const staminaCost = this.calculateStaminaCost(recipe);
        if (player.stamina < staminaCost) {
            return { success: false, message: "Not enough stamina to cook" };
        }
        
        // Consume ingredients
        const consumeResult = recipe.consumeIngredients(inventory);
        if (!consumeResult.success) {
            return { success: false, message: "Failed to consume ingredients" };
        }
        
        // Start cooking session
        this.isCooking = true;
        this.currentRecipe = recipe;
        this.currentStation = station;
        this.cookingStartTime = Date.now();
        this.cookingDuration = recipe.cookingTime;
        this.cookingProgress = 0;
        this.showCookingUI = true;
        
        // Mark station as in use
        station.inUse = true;
        
        // Consume stamina
        this.gameEngine.staminaSystem?.consumeStamina(staminaCost);
        
        console.log(`Started cooking ${recipe.name} at ${station.name}`);
        return { 
            success: true, 
            message: `Started cooking ${recipe.name}`,
            recipe: recipe,
            cookingTime: this.cookingDuration
        };
    }
    
    // Complete cooking (called when player presses finish or auto-completes)
    completeCooking(perfectTiming = false, overcooked = false) {
        if (!this.isCooking || !this.currentRecipe) {
            return { success: false, message: "Not currently cooking" };
        }
        
        const recipe = this.currentRecipe;
        let quality = 'normal';
        
        if (overcooked) {
            quality = 'poor';
            console.log(`${recipe.name} was overcooked!`);
        } else if (perfectTiming) {
            quality = 'perfect';
            this.perfectCooks++;
            console.log(`${recipe.name} cooked perfectly!`);
        }
        
        // Create result item
        const resultItem = recipe.createResultItem(this.cookingLevel, perfectTiming);
        if (overcooked) {
            resultItem.quality = 'poor';
            resultItem.staminaRestore = Math.max(1, Math.round(resultItem.staminaRestore * 0.5));
            resultItem.value = Math.max(1, Math.round(resultItem.value * 0.3));
        }
        
        // Add to inventory
        const inventory = this.gameEngine.getSystem('tool')?.getInventory();
        if (inventory) {
            inventory.addItem(resultItem, 1);
        }
        
        // Update statistics
        this.totalFoodsCooked++;
        
        // Gain cooking experience
        const experience = recipe.getCookingExperience(perfectTiming && !overcooked);
        this.gainCookingExperience(experience);
        
        // Clean up cooking session
        this.endCookingSession();
        
        return {
            success: true,
            message: `Finished cooking ${recipe.name}`,
            result: resultItem,
            experience: experience,
            perfectTiming,
            overcooked
        };
    }
    
    // End cooking session
    endCookingSession() {
        if (this.currentStation) {
            this.currentStation.inUse = false;
        }
        
        this.isCooking = false;
        this.currentRecipe = null;
        this.currentStation = null;
        this.cookingStartTime = 0;
        this.cookingDuration = 0;
        this.cookingProgress = 0;
        this.showCookingUI = false;
        this.perfectTimingWindow = { start: 0, end: 0, active: false };
    }
    
    // Calculate stamina cost for cooking
    calculateStaminaCost(recipe) {
        const baseCost = 10 + (recipe.difficulty * 5);
        const skillReduction = Math.floor((this.cookingLevel - 1) * 2);
        return Math.max(5, baseCost - skillReduction);
    }
    
    // Gain cooking experience
    gainCookingExperience(amount) {
        const oldLevel = this.cookingLevel;
        this.cookingExperience += amount;
        
        // Check for level up
        const requiredExp = this.getRequiredExperience(this.cookingLevel);
        if (this.cookingExperience >= requiredExp) {
            this.cookingLevel++;
            this.cookingExperience -= requiredExp;
            
            console.log(`🍳 Cooking level increased to ${this.cookingLevel}!`);
            this.handleCookingLevelUp(this.cookingLevel);
        }
    }
    
    // Get required experience for level
    getRequiredExperience(level) {
        return level * 100 + (level - 1) * 50;
    }
    
    // Handle cooking level up
    handleCookingLevelUp(newLevel) {
        const milestones = {
            2: { name: 'Apprentice Cook', reward: 'Unlocked new recipes' },
            3: { name: 'Skilled Cook', reward: 'Reduced stamina cost and new recipes' },
            5: { name: 'Master Chef', reward: 'Perfect timing window increased' },
            7: { name: 'Culinary Artist', reward: 'Advanced recipes unlocked' },
            10: { name: 'Legendary Cook', reward: 'All recipes unlocked and maximum bonuses' }
        };
        
        const milestone = milestones[newLevel];
        if (milestone) {
            console.log(`🍳 Achievement Unlocked: ${milestone.name} - ${milestone.reward}`);
        }
    }
    
    // Get nearest cooking station
    getNearestCookingStation(x, y, maxDistance = 60) {
        let nearestStation = null;
        let nearestDistance = Infinity;
        
        for (const station of this.cookingStations.values()) {
            if (!station.isActive || station.inUse) continue;
            
            const distance = Math.sqrt((station.x - x) ** 2 + (station.y - y) ** 2);
            if (distance < nearestDistance && distance <= maxDistance) {
                nearestDistance = distance;
                nearestStation = station;
            }
        }
        
        return nearestStation;
    }
    
    // Handle player interaction with cooking
    handlePlayerInteraction(player, action, targetData = null) {
        if (action === 'open_cooking_menu') {
            const station = targetData || this.getNearestCookingStation(player.x, player.y);
            if (station) {
                return this.openCookingMenu(station);
            } else {
                return { success: false, message: "No cooking station nearby" };
            }
        } else if (action === 'start_cooking') {
            return this.startCooking(player, targetData.recipeId, targetData.stationId);
        } else if (action === 'finish_cooking') {
            const currentTime = Date.now();
            const perfectTiming = this.perfectTimingWindow.active && 
                                currentTime >= this.perfectTimingWindow.start && 
                                currentTime <= this.perfectTimingWindow.end;
            return this.completeCooking(perfectTiming);
        } else if (action === 'cancel_cooking') {
            this.endCookingSession();
            return { success: true, message: "Cooking cancelled" };
        }
        
        return { success: false, message: "Unknown cooking action" };
    }
    
    // Open cooking menu for a station
    openCookingMenu(station) {
        const availableRecipes = [];
        
        for (const recipeId of station.recipes) {
            if (this.unlockedRecipes.has(recipeId)) {
                const recipe = this.availableRecipes.get(recipeId);
                if (recipe) {
                    availableRecipes.push(recipe.getRecipeInfo());
                }
            }
        }
        
        return {
            success: true,
            message: `Opened cooking menu for ${station.name}`,
            station: station,
            availableRecipes: availableRecipes
        };
    }
    
    // Render cooking system UI
    render(renderSystem) {
        if (!renderSystem) return;
        
        // Render cooking stations
        for (const station of this.cookingStations.values()) {
            this.renderCookingStation(renderSystem, station);
        }
        
        // Render cooking UI if active
        if (this.showCookingUI && this.isCooking) {
            this.renderCookingUI(renderSystem);
        }
    }
    
    // Render individual cooking station
    renderCookingStation(renderSystem, station) {
        // Render station sprite (placeholder)
        renderSystem.drawRect(
            station.x - 16, station.y - 16,
            32, 32,
            station.inUse ? '#ff6600' : '#8B4513',
            { layer: 5 }
        );
        
        // Show interaction prompt if player is nearby
        const currentScene = this.gameEngine.getSystem('scene')?.currentScene;
        if (currentScene && currentScene.player) {
            const distance = Math.sqrt((station.x - currentScene.player.x) ** 2 + (station.y - currentScene.player.y) ** 2);
            if (distance < 60 && !station.inUse) {
                renderSystem.drawText(
                    `Press Q to cook at ${station.name}`,
                    station.x, station.y - 40,
                    { 
                        font: '12px Arial',
                        color: '#ffffff',
                        align: 'center',
                        layer: 10
                    }
                );
            }
        }
        
        // Show cooking progress if in use
        if (station.inUse && this.isCooking && this.currentStation === station) {
            const progressWidth = 40 * this.cookingProgress;
            renderSystem.drawRect(
                station.x - 20, station.y + 20,
                40, 6,
                '#333333',
                { layer: 6 }
            );
            renderSystem.drawRect(
                station.x - 20, station.y + 20,
                progressWidth, 6,
                '#00ff00',
                { layer: 6 }
            );
        }
    }
    
    // Render cooking UI
    renderCookingUI(renderSystem) {
        const canvas = renderSystem.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // UI background
        renderSystem.drawRect(
            centerX - 200, centerY + 80,
            400, 100,
            '#000000',
            { alpha: 0.8, layer: 15 }
        );
        
        if (this.currentRecipe) {
            // Recipe name
            renderSystem.drawText(
                `Cooking: ${this.currentRecipe.name}`,
                centerX, centerY + 100,
                { 
                    font: '18px Arial',
                    color: '#ffffff',
                    align: 'center',
                    layer: 16
                }
            );
            
            // Progress bar
            const progressWidth = this.cookingProgress * 350;
            renderSystem.drawRect(
                centerX - 175, centerY + 120,
                350, 15,
                '#333333',
                { layer: 16 }
            );
            renderSystem.drawRect(
                centerX - 175, centerY + 120,
                progressWidth, 15,
                '#00ff00',
                { layer: 16 }
            );
            
            // Perfect timing indicator
            if (this.perfectTimingWindow.active) {
                renderSystem.drawText(
                    'PERFECT TIMING! Press SPACE!',
                    centerX, centerY + 150,
                    { 
                        font: '16px Arial',
                        color: '#ffff00',
                        align: 'center',
                        layer: 16
                    }
                );
            } else {
                renderSystem.drawText(
                    'Press SPACE when ready...',
                    centerX, centerY + 150,
                    { 
                        font: '14px Arial',
                        color: '#cccccc',
                        align: 'center',
                        layer: 16
                    }
                );
            }
        }
    }
    
    // Get cooking statistics
    getStats() {
        return {
            cookingLevel: this.cookingLevel,
            cookingExperience: this.cookingExperience,
            totalFoodsCooked: this.totalFoodsCooked,
            perfectCooks: this.perfectCooks,
            unlockedRecipes: this.unlockedRecipes.size,
            availableRecipes: this.availableRecipes.size,
            isCooking: this.isCooking
        };
    }
    
    // Serialize cooking system data for saving
    serialize() {
        return {
            cookingLevel: this.cookingLevel,
            cookingExperience: this.cookingExperience,
            totalFoodsCooked: this.totalFoodsCooked,
            perfectCooks: this.perfectCooks,
            unlockedRecipes: Array.from(this.unlockedRecipes),
            favoriteRecipes: Array.from(this.favoriteRecipes)
        };
    }
    
    // Deserialize cooking system data from save
    deserialize(data, gameEngine) {
        this.cookingLevel = data.cookingLevel || 1;
        this.cookingExperience = data.cookingExperience || 0;
        this.totalFoodsCooked = data.totalFoodsCooked || 0;
        this.perfectCooks = data.perfectCooks || 0;
        
        if (data.unlockedRecipes) {
            this.unlockedRecipes = new Set(data.unlockedRecipes);
        }
        
        if (data.favoriteRecipes) {
            this.favoriteRecipes = new Set(data.favoriteRecipes);
        }
    }
}