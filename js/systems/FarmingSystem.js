// Core farming system managing soil tilling, crop lifecycle, and farming mechanics
// Handles soil states, tool interactions, and farmable tile management

import { Crop } from '../entities/Crop.js';

export class FarmingSystem {
    constructor() {
        this.farmTiles = new Map(); // position -> FarmTile data
        this.activeCrops = new Map(); // position -> Crop data
        this.tileSize = 32;
        
        // Soil states for farming progression
        this.soilStates = {
            UNTILLED: 'untilled',
            TILLED: 'tilled',
            WATERED: 'watered',
            PLANTED: 'planted',
            GROWING: 'growing'
        };
        
        // Tool requirements for different actions
        this.toolRequirements = {
            till: ['hoe'],
            water: ['watering_can'],
            plant: ['seeds'],
            harvest: ['hands'] // No tool needed for harvesting
        };
        
        // Performance tracking
        this.stats = {
            tilledPlots: 0,
            plantedCrops: 0,
            wateredPlots: 0,
            harvestedCrops: 0
        };
        
        console.log('FarmingSystem initialized');
    }
    
    // Initialize farming system with game engine
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupFarmableAreas();
    }
    
    // Setup farmable areas based on current scene
    setupFarmableAreas() {
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        if (!currentScene || !currentScene.tileMap) return;
        
        const tileMap = currentScene.tileMap;
        
        // Find all farmable tiles in the current scene
        for (let y = 0; y < tileMap.height; y++) {
            for (let x = 0; x < tileMap.width; x++) {
                // Check all layers for farmable properties
                const tiles = tileMap.getTilesAtPosition(x, y);
                
                for (const [layerName, tileId] of Object.entries(tiles)) {
                    if (tileId > 0) {
                        const properties = tileMap.tileProperties.get(tileId);
                        if (properties?.farmable) {
                            this.registerFarmTile(x, y, properties);
                            break; // Only register once per position
                        }
                    }
                }
            }
        }
        
        console.log(`Registered ${this.farmTiles.size} farmable tiles`);
    }
    
    // Register a tile as farmable
    registerFarmTile(tileX, tileY, properties = {}) {
        const position = `${tileX},${tileY}`;
        
        const farmTile = {
            x: tileX,
            y: tileY,
            worldX: tileX * this.tileSize,
            worldY: tileY * this.tileSize,
            soilState: this.soilStates.UNTILLED,
            waterLevel: 0,
            maxWaterLevel: 100,
            fertility: properties.fertility || 1.0,
            lastWatered: 0,
            properties: { ...properties }
        };
        
        this.farmTiles.set(position, farmTile);
    }
    
    // Check if a world position is on a farmable tile
    isFarmableTile(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        const position = `${tileX},${tileY}`;
        
        return this.farmTiles.has(position);
    }
    
    // Get farm tile data at world position
    getFarmTile(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        const position = `${tileX},${tileY}`;
        
        return this.farmTiles.get(position);
    }

    // Till soil at the given position using a hoe
    tillSoil(worldX, worldY, player, tool) {
        // Validate tool requirement
        if (!this.canUseTool('till', tool)) {
            console.log('Need a hoe to till soil!');
            return false;
        }
        
        const farmTile = this.getFarmTile(worldX, worldY);
        if (!farmTile) {
            console.log('Cannot till soil here - not a farmable area');
            return false;
        }
        
        // Check if already tilled or has crop
        if (farmTile.soilState !== this.soilStates.UNTILLED) {
            console.log('Soil is already tilled or has a crop');
            return false;
        }
        
        // Check player stamina
        const staminaCost = this.getActionStaminaCost('till', tool);
        if (!this.consumeStamina(player, staminaCost)) {
            console.log('Not enough stamina to till soil');
            return false;
        }
        
        // Perform tilling
        farmTile.soilState = this.soilStates.TILLED;
        this.stats.tilledPlots++;
        
        // Use tool durability
        this.useTool(player, tool);
        
        // Visual feedback
        this.createTillEffect(farmTile.worldX, farmTile.worldY);
        
        console.log(`Tilled soil at (${Math.floor(worldX/32)}, ${Math.floor(worldY/32)})`);
        return true;
    }

    // Water crops or tilled soil
    waterSoil(worldX, worldY, player, tool) {
        // Validate tool requirement
        if (!this.canUseTool('water', tool)) {
            console.log('Need a watering can to water plants!');
            return false;
        }
        
        const farmTile = this.getFarmTile(worldX, worldY);
        if (!farmTile) {
            console.log('Cannot water here - not a farmable area');
            return false;
        }
        
        // Check if soil can be watered
        if (farmTile.soilState === this.soilStates.UNTILLED) {
            console.log('Till the soil first before watering');
            return false;
        }
        
        // Check if already fully watered
        if (farmTile.waterLevel >= farmTile.maxWaterLevel) {
            console.log('Soil is already fully watered');
            return false;
        }
        
        // Check watering can has water
        if (!this.hasWater(tool)) {
            console.log('Watering can is empty!');
            return false;
        }
        
        // Check player stamina
        const staminaCost = this.getActionStaminaCost('water', tool);
        if (!this.consumeStamina(player, staminaCost)) {
            console.log('Not enough stamina to water crops');
            return false;
        }
        
        // Perform watering
        const waterAmount = this.getWateringAmount(tool);
        farmTile.waterLevel = Math.min(farmTile.waterLevel + waterAmount, farmTile.maxWaterLevel);
        farmTile.lastWatered = Date.now();
        
        if (farmTile.soilState === this.soilStates.TILLED) {
            farmTile.soilState = this.soilStates.WATERED;
        }
        
        // Also water any crop at this location
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        const crop = this.getCropAt(tileX, tileY);
        if (crop) {
            crop.receiveWater(waterAmount);
        }
        
        this.stats.wateredPlots++;
        
        // Use watering can water
        this.useWater(tool, 1);
        
        // Use tool durability (minimal for watering)
        this.useTool(player, tool, 0.1);
        
        // Visual feedback
        this.createWaterEffect(farmTile.worldX, farmTile.worldY);
        
        console.log(`Watered soil at (${Math.floor(worldX/32)}, ${Math.floor(worldY/32)})`);
        return true;
    }

    // Legacy methods for backward compatibility with existing code
    tillSoil_legacy(x, y) {
        return this.tillSoil(x * this.tileSize, y * this.tileSize, null, { type: 'hoe', durability: 100, efficiency: 1 });
    }

    waterCrop(x, y) {
        return this.waterSoil(x * this.tileSize, y * this.tileSize, null, { type: 'watering_can', water: 20, efficiency: 1 });
    }

    // Check if player can use a specific tool for an action
    canUseTool(action, tool) {
        if (!tool) return false;
        
        const requiredTools = this.toolRequirements[action];
        if (!requiredTools) return true;
        
        return requiredTools.includes(tool.type);
    }
    
    // Get stamina cost for a farming action
    getActionStaminaCost(action, tool) {
        const baseCosts = {
            till: 10,
            water: 5,
            plant: 3,
            harvest: 2
        };
        
        const baseCost = baseCosts[action] || 5;
        const toolEfficiency = tool?.efficiency || 1;
        
        // More efficient tools reduce stamina cost
        return Math.max(1, Math.round(baseCost / toolEfficiency));
    }
    
    // Consume player stamina for farming action
    consumeStamina(player, amount) {
        if (!this.gameEngine?.staminaSystem || !player) return true;
        
        const currentStamina = this.gameEngine.staminaSystem.getStamina(player.entityId);
        if (currentStamina < amount) {
            return false;
        }
        
        this.gameEngine.staminaSystem.consumeStamina(player.entityId, amount);
        return true;
    }
    
    // Use tool durability
    useTool(player, tool, durabilityLoss = 1) {
        if (!tool || !tool.durability) return;
        
        tool.durability = Math.max(0, tool.durability - durabilityLoss);
        
        if (tool.durability <= 0) {
            console.log(`${tool.type} broke!`);
            // TODO: Remove broken tool from inventory
        }
    }
    
    // Check if watering can has water
    hasWater(tool) {
        if (tool.type !== 'watering_can') return false;
        return (tool.water || 0) > 0;
    }
    
    // Use water from watering can
    useWater(tool, amount) {
        if (tool.type !== 'watering_can') return;
        tool.water = Math.max(0, (tool.water || 0) - amount);
    }
    
    // Get amount of water applied per watering action
    getWateringAmount(tool) {
        if (tool.type !== 'watering_can') return 25;
        
        // Better watering cans water more efficiently
        const efficiency = tool.efficiency || 1;
        return Math.round(25 * efficiency);
    }

    update(deltaTime) {
        this.updateSoilMoisture(deltaTime);
        this.updateCropGrowth(deltaTime);
    }
    
    // Update soil moisture levels over time
    updateSoilMoisture(deltaTime) {
        const moistureLossRate = 0.1; // Water lost per second
        
        for (const [position, farmTile] of this.farmTiles.entries()) {
            if (farmTile.waterLevel > 0) {
                farmTile.waterLevel = Math.max(0, farmTile.waterLevel - moistureLossRate * deltaTime / 1000);
                
                // Update soil state based on water level
                if (farmTile.waterLevel <= 0 && farmTile.soilState === this.soilStates.WATERED) {
                    farmTile.soilState = this.soilStates.TILLED;
                }
            }
        }
    }
    
    // Update crop growth for all active crops
    updateCropGrowth(deltaTime) {
        for (const [position, crop] of this.activeCrops.entries()) {
            crop.update(deltaTime);
            
            // Update farm tile soil state if crop advances
            const farmTile = this.getFarmTile(crop.x, crop.y);
            if (farmTile) {
                if (crop.currentStage > 0 && farmTile.soilState !== this.soilStates.GROWING) {
                    farmTile.soilState = this.soilStates.GROWING;
                }
            }
        }
    }

    // Create visual effect for tilling
    createTillEffect(worldX, worldY) {
        // TODO: Create dust cloud or soil particles effect
        console.log(`Till effect at ${worldX}, ${worldY}`);
    }
    
    // Create visual effect for watering
    createWaterEffect(worldX, worldY) {
        // TODO: Create water droplet or splash effect
        console.log(`Water effect at ${worldX}, ${worldY}`);
    }
    
    // Create visual effect for planting
    createPlantingEffect(worldX, worldY) {
        // TODO: Create seed planting or soil movement effect
        console.log(`Planting effect at ${worldX}, ${worldY}`);
    }
    
    // Check if player has specific seeds
    hasSeeds(seedInventory, seedType) {
        if (!seedInventory || !seedInventory.seeds) return false;
        return (seedInventory.seeds[seedType] || 0) > 0;
    }
    
    // Use seeds from inventory
    useSeeds(seedInventory, seedType, amount) {
        if (!seedInventory || !seedInventory.seeds) return;
        if (seedInventory.seeds[seedType]) {
            seedInventory.seeds[seedType] = Math.max(0, seedInventory.seeds[seedType] - amount);
        }
    }
    
    // Get crop at specific tile position
    getCropAt(tileX, tileY) {
        const position = `${tileX},${tileY}`;
        return this.activeCrops.get(position);
    }
    
    // Water specific crop directly
    waterCropAt(tileX, tileY, waterAmount) {
        const crop = this.getCropAt(tileX, tileY);
        if (crop) {
            return crop.receiveWater(waterAmount);
        }
        return false;
    }
    
    // Render farming system debug information
    renderDebug(renderSystem) {
        if (!renderSystem) return;
        
        const debugColor = '#00ff88';
        let yOffset = 120;
        
        // Show farming statistics
        renderSystem.drawText(
            `Farming - Tilled: ${this.stats.tilledPlots}, Watered: ${this.stats.wateredPlots}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Planted: ${this.stats.plantedCrops}, Harvested: ${this.stats.harvestedCrops}, Active: ${this.activeCrops.size}`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        
        // Render farm tile states
        this.renderFarmTileStates(renderSystem);
        
        // Render crop information
        this.renderCropStates(renderSystem);
    }
    
    // Render visual indicators for farm tile states
    renderFarmTileStates(renderSystem) {
        for (const [position, farmTile] of this.farmTiles.entries()) {
            let tileColor = null;
            let alpha = 0.3;
            
            switch (farmTile.soilState) {
                case this.soilStates.UNTILLED:
                    tileColor = '#8b4513'; // Brown - untilled
                    break;
                case this.soilStates.TILLED:
                    tileColor = '#654321'; // Dark brown - tilled
                    break;
                case this.soilStates.WATERED:
                    tileColor = '#2e8b57'; // Dark green - watered
                    alpha = 0.5;
                    break;
                case this.soilStates.PLANTED:
                    tileColor = '#228b22'; // Green - planted
                    alpha = 0.4;
                    break;
                case this.soilStates.GROWING:
                    tileColor = '#32cd32'; // Lime green - growing
                    alpha = 0.6;
                    break;
            }
            
            if (tileColor) {
                renderSystem.drawRect(
                    farmTile.worldX, farmTile.worldY,
                    this.tileSize, this.tileSize,
                    tileColor,
                    { alpha, layer: 2 }
                );
                
                // Show water level indicator
                if (farmTile.waterLevel > 0) {
                    const waterHeight = (farmTile.waterLevel / farmTile.maxWaterLevel) * 4;
                    renderSystem.drawRect(
                        farmTile.worldX + 2, farmTile.worldY + this.tileSize - waterHeight - 2,
                        4, waterHeight,
                        '#4682b4', // Steel blue for water indicator
                        { alpha: 0.8, layer: 3 }
                    );
                }
            }
        }
    }
    
    // Render visual indicators for crop states
    renderCropStates(renderSystem) {
        for (const [position, crop] of this.activeCrops.entries()) {
            // Draw crop growth progress bar
            const progressPercent = crop.getGrowthProgress();
            const barWidth = 24;
            const barHeight = 3;
            const barX = crop.x + 4;
            const barY = crop.y - 8;
            
            // Background bar
            renderSystem.drawRect(
                barX, barY, barWidth, barHeight,
                '#333333', { alpha: 0.7, layer: 10 }
            );
            
            // Progress bar
            const progressWidth = (progressPercent / 100) * barWidth;
            let progressColor = '#ffff00'; // Yellow for growing
            
            if (crop.isReadyForHarvest()) {
                progressColor = '#00ff00'; // Green for ready
            } else if (progressPercent > 75) {
                progressColor = '#ff8800'; // Orange for almost ready
            }
            
            renderSystem.drawRect(
                barX, barY, progressWidth, barHeight,
                progressColor, { alpha: 0.9, layer: 11 }
            );
            
            // Show harvest indicator for ready crops
            if (crop.isReadyForHarvest()) {
                renderSystem.drawRect(
                    crop.x + 26, crop.y + 2,
                    6, 6,
                    '#00ff00', { alpha: 0.8, layer: 12 }
                );
                
                // Pulsing effect for ready crops
                const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                renderSystem.drawRect(
                    crop.x + 28, crop.y + 4,
                    2, 2,
                    '#ffffff', { alpha: pulse, layer: 13 }
                );
            }
            
            // Show health indicator if unhealthy
            if (!crop.isHealthy) {
                renderSystem.drawRect(
                    crop.x + 2, crop.y + 2,
                    4, 4,
                    '#ff0000', { alpha: 0.8, layer: 12 }
                );
            }
        }
    }

    // Plant a seed at the given tile position
    plantSeed(tileX, tileY, seedType, player, seeds) {
        // Validate seed requirement
        if (!this.canUseTool('plant', seeds)) {
            console.log('Need seeds to plant!');
            return false;
        }
        
        const worldX = tileX * this.tileSize;
        const worldY = tileY * this.tileSize;
        const farmTile = this.getFarmTile(worldX, worldY);
        
        if (!farmTile) {
            console.log('Cannot plant here - not a farmable area');
            return false;
        }
        
        // Check if soil is prepared and not already planted
        if (farmTile.soilState === this.soilStates.UNTILLED) {
            console.log('Till the soil first before planting');
            return false;
        }
        
        if (farmTile.soilState === this.soilStates.PLANTED || 
            farmTile.soilState === this.soilStates.GROWING) {
            console.log('There is already a crop planted here');
            return false;
        }
        
        // Check if player has the specific seed type
        if (!player || !player.inventory) {
            console.log('Player inventory not available');
            return false;
        }
        
        const seedItemId = `${seedType}_seeds`;
        if (!player.inventory.hasItem(seedItemId, 1)) {
            console.log(`No ${seedType} seeds available`);
            return false;
        }
        
        // Check player stamina
        const staminaCost = this.getActionStaminaCost('plant', seeds);
        if (!this.consumeStamina(player, staminaCost)) {
            console.log('Not enough stamina to plant seeds');
            return false;
        }
        
        // Create crop entity
        const crop = new Crop(worldX, worldY, seedType, this.gameEngine);
        crop.init(this.gameEngine);
        
        // Register crop in system
        const position = `${tileX},${tileY}`;
        this.activeCrops.set(position, crop);
        
        // Update farm tile state
        farmTile.soilState = this.soilStates.PLANTED;
        
        // Add to current scene entities if available
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        if (currentScene) {
            currentScene.addEntity(crop);
        }
        
        // Consume seed from player inventory
        if (player && player.inventory) {
            const seedItemId = `${seedType}_seeds`;
            player.inventory.removeItem(seedItemId, 1);
        }
        
        // Update statistics
        this.stats.plantedCrops++;
        
        // Visual feedback
        this.createPlantingEffect(worldX, worldY);
        
        console.log(`Planted ${seedType} at (${tileX}, ${tileY})`);
        return true;
    }

    // Harvest a mature crop at the given tile position
    harvestCrop(tileX, tileY, player) {
        const position = `${tileX},${tileY}`;
        const crop = this.activeCrops.get(position);
        
        if (!crop) {
            console.log('No crop to harvest here');
            return false;
        }
        
        if (!crop.isReadyForHarvest()) {
            console.log(`${crop.seedType} is not ready for harvest yet`);
            return false;
        }
        
        // Check player stamina for harvesting
        const staminaCost = this.getActionStaminaCost('harvest', null);
        if (!this.consumeStamina(player, staminaCost)) {
            console.log('Not enough stamina to harvest crops');
            return false;
        }
        
        // Perform harvest
        const harvestResult = crop.harvest();
        if (!harvestResult) {
            console.log('Failed to harvest crop');
            return false;
        }
        
        // Add harvested items to player inventory
        if (player && player.inventory) {
            player.inventory.addItem(harvestResult.itemType, harvestResult.amount, harvestResult.quality);
        }
        
        // Remove crop from active crops
        this.activeCrops.delete(position);
        
        // Remove crop from current scene entities
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        if (currentScene) {
            const cropIndex = currentScene.entities.findIndex(entity => entity.entityId === crop.entityId);
            if (cropIndex !== -1) {
                currentScene.entities.splice(cropIndex, 1);
            }
        }
        
        // Reset farm tile to tilled state for replanting
        const worldX = tileX * this.tileSize;
        const worldY = tileY * this.tileSize;
        const farmTile = this.getFarmTile(worldX, worldY);
        if (farmTile) {
            farmTile.soilState = this.soilStates.TILLED;
            farmTile.waterLevel = 0; // Reset water level after harvest
        }
        
        // Update statistics
        this.stats.harvestedCrops++;
        
        // Visual feedback
        this.createHarvestEffect(worldX, worldY);
        
        console.log(`Harvested ${harvestResult.amount}x ${harvestResult.quality} ${harvestResult.itemType} at (${tileX}, ${tileY})`);
        return harvestResult;
    }
    
    // Create visual effect for harvesting
    createHarvestEffect(worldX, worldY) {
        // TODO: Create sparkle or collection effect
        console.log(`Harvest effect at ${worldX}, ${worldY}`);
    }
    
    // Get farming system statistics
    getStats() {
        return {
            ...this.stats,
            totalFarmTiles: this.farmTiles.size,
            activeCrops: this.activeCrops.size,
            averageWaterLevel: this.getAverageWaterLevel()
        };
    }
    
    // Calculate average water level across all farm tiles
    getAverageWaterLevel() {
        if (this.farmTiles.size === 0) return 0;
        
        let totalWater = 0;
        for (const farmTile of this.farmTiles.values()) {
            totalWater += farmTile.waterLevel;
        }
        
        return Math.round(totalWater / this.farmTiles.size);
    }
    
    // Save farming system state
    serialize() {
        return {
            farmTiles: Array.from(this.farmTiles.entries()),
            activeCrops: Array.from(this.activeCrops.entries()),
            stats: this.stats
        };
    }
    
    // Load farming system state
    deserialize(data) {
        if (data.farmTiles) {
            this.farmTiles = new Map(data.farmTiles);
        }
        if (data.activeCrops) {
            this.activeCrops = new Map(data.activeCrops);
        }
        if (data.stats) {
            this.stats = { ...this.stats, ...data.stats };
        }
    }
}