// Individual crop entity with growth stages and lifecycle management
// Handles crop growth progression, watering requirements, and harvest readiness

export class Crop {
    constructor(x, y, seedType, gameEngine) {
        this.entityId = `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = x; // World coordinates
        this.y = y;
        this.tileX = Math.floor(x / 32);
        this.tileY = Math.floor(y / 32);
        
        this.seedType = seedType;
        this.gameEngine = gameEngine;
        
        // Growth stage progression
        this.growthStages = {
            SEED: 0,
            SPROUT: 1,
            YOUNG: 2,
            MATURE: 3,
            READY: 4
        };
        
        this.currentStage = this.growthStages.SEED;
        this.stageNames = ['seed', 'sprout', 'young', 'mature', 'ready'];
        
        // Growth timing (in milliseconds)
        this.stageGrowthTimes = this.getCropGrowthTimes(seedType);
        this.stageStartTime = Date.now();
        this.totalGrowthTime = this.stageGrowthTimes.reduce((sum, time) => sum + time, 0);
        
        // Crop properties
        this.waterRequirement = this.getCropWaterRequirement(seedType);
        this.currentWaterLevel = 0;
        this.maxWaterLevel = 100;
        this.growthBonus = 1.0; // Multiplier for growth speed based on care
        
        // Visual properties
        this.sprite = null;
        this.renderLayer = 5;
        
        // State tracking
        this.isHealthy = true;
        this.canHarvest = false;
        this.harvestYield = this.getCropYield(seedType);
        
        console.log(`Created ${seedType} crop at (${this.tileX}, ${this.tileY})`);
    }
    
    // Get growth times for different crop types
    getCropGrowthTimes(seedType) {
        const cropData = {
            'turnip': [3000, 4000, 5000, 6000, 4000], // Fast-growing starter crop
            'potato': [4000, 5000, 6000, 7000, 5000], // Medium growth
            'carrot': [5000, 6000, 7000, 8000, 6000],  // Slower growth
            'corn': [6000, 8000, 10000, 12000, 8000],   // Long growth time
            'tomato': [7000, 9000, 11000, 13000, 9000]  // Longest growth
        };
        
        return cropData[seedType] || cropData['turnip'];
    }
    
    // Get water requirement for crop type
    getCropWaterRequirement(seedType) {
        const waterRequirements = {
            'turnip': 20,
            'potato': 25,
            'carrot': 30,
            'corn': 40,
            'tomato': 45
        };
        
        return waterRequirements[seedType] || 20;
    }
    
    // Get harvest yield for crop type
    getCropYield(seedType) {
        const yields = {
            'turnip': { min: 1, max: 3, quality: 'normal' },
            'potato': { min: 2, max: 4, quality: 'normal' },
            'carrot': { min: 1, max: 2, quality: 'good' },
            'corn': { min: 1, max: 1, quality: 'excellent' },
            'tomato': { min: 3, max: 6, quality: 'normal' }
        };
        
        return yields[seedType] || yields['turnip'];
    }
    
    // Initialize crop entity
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.updateSprite();
    }
    
    // Update crop growth and state
    update(deltaTime) {
        const currentTime = Date.now();
        const stageElapsedTime = currentTime - this.stageStartTime;
        const requiredTime = this.stageGrowthTimes[this.currentStage] / this.growthBonus;
        
        // Check if ready to advance to next growth stage
        if (stageElapsedTime >= requiredTime && this.currentStage < this.growthStages.READY) {
            this.advanceGrowthStage();
        }
        
        // Update water level (crops consume water over time)
        if (this.currentWaterLevel > 0) {
            const waterConsumption = this.waterRequirement * (deltaTime / 1000) * 0.01;
            this.currentWaterLevel = Math.max(0, this.currentWaterLevel - waterConsumption);
        }
        
        // Update health based on water level
        this.updateHealthStatus();
        
        // Update growth bonus based on care level
        this.updateGrowthBonus();
    }
    
    // Advance to next growth stage
    advanceGrowthStage() {
        if (this.currentStage < this.growthStages.READY) {
            this.currentStage++;
            this.stageStartTime = Date.now();
            this.updateSprite();
            
            if (this.currentStage === this.growthStages.READY) {
                this.canHarvest = true;
                console.log(`${this.seedType} crop is ready for harvest at (${this.tileX}, ${this.tileY})`);
            } else {
                console.log(`${this.seedType} crop advanced to ${this.stageNames[this.currentStage]} stage`);
            }
        }
    }
    
    // Update health status based on water level
    updateHealthStatus() {
        const waterPercentage = this.currentWaterLevel / this.maxWaterLevel;
        
        if (waterPercentage < 0.2) {
            this.isHealthy = false;
            this.growthBonus = Math.max(0.3, this.growthBonus * 0.95); // Slow growth when unhealthy
        } else {
            this.isHealthy = true;
        }
    }
    
    // Update growth bonus based on care quality
    updateGrowthBonus() {
        const waterPercentage = this.currentWaterLevel / this.maxWaterLevel;
        
        // Well-watered crops grow faster
        if (waterPercentage > 0.8) {
            this.growthBonus = Math.min(2.0, this.growthBonus * 1.01);
        } else if (waterPercentage > 0.5) {
            this.growthBonus = Math.min(1.5, this.growthBonus * 1.005);
        }
        
        // Cap growth bonus
        this.growthBonus = Math.max(0.3, Math.min(2.0, this.growthBonus));
    }
    
    // Water this crop
    receiveWater(amount) {
        const oldWaterLevel = this.currentWaterLevel;
        this.currentWaterLevel = Math.min(this.maxWaterLevel, this.currentWaterLevel + amount);
        
        const waterAdded = this.currentWaterLevel - oldWaterLevel;
        if (waterAdded > 0) {
            console.log(`Watered ${this.seedType} crop (${Math.round(this.currentWaterLevel)}/${this.maxWaterLevel})`);
            return true;
        }
        
        return false;
    }
    
    // Update sprite based on current growth stage
    updateSprite() {
        if (!this.gameEngine?.assetManager) return;
        
        const stageName = this.stageNames[this.currentStage];
        const spriteName = `${this.seedType}_${stageName}`;
        
        // TODO: Queue crop sprite assets if not already loaded
        this.sprite = spriteName;
    }
    
    // Render crop entity
    render(renderSystem) {
        if (!renderSystem || !this.sprite) return;
        
        // Render crop sprite
        renderSystem.drawSprite(
            this.sprite,
            this.x, this.y,
            { layer: this.renderLayer }
        );
        
        // Render health indicator if unhealthy
        if (!this.isHealthy) {
            renderSystem.drawRect(
                this.x + 24, this.y + 2,
                4, 4,
                '#ff0000',
                { alpha: 0.7, layer: this.renderLayer + 1 }
            );
        }
        
        // Render water level indicator in debug mode
        if (this.gameEngine?.isDebugMode()) {
            const waterHeight = (this.currentWaterLevel / this.maxWaterLevel) * 6;
            if (waterHeight > 0) {
                renderSystem.drawRect(
                    this.x + 2, this.y + 32 - waterHeight - 2,
                    3, waterHeight,
                    '#4682b4',
                    { alpha: 0.8, layer: this.renderLayer + 1 }
                );
            }
        }
    }
    
    // Check if crop is ready for harvest
    isReadyForHarvest() {
        return this.canHarvest && this.currentStage === this.growthStages.READY;
    }
    
    // Harvest this crop
    harvest() {
        if (!this.isReadyForHarvest()) {
            return null;
        }
        
        // Calculate actual yield based on care quality
        const baseYield = this.harvestYield;
        const careMultiplier = Math.min(1.5, this.growthBonus);
        const actualAmount = Math.floor(
            Math.random() * (baseYield.max - baseYield.min + 1) + baseYield.min
        ) * careMultiplier;
        
        const harvestResult = {
            itemType: this.seedType,
            amount: Math.max(1, Math.round(actualAmount)),
            quality: this.isHealthy ? baseYield.quality : 'poor'
        };
        
        console.log(`Harvested ${harvestResult.amount}x ${harvestResult.quality} ${this.seedType}`);
        return harvestResult;
    }
    
    // Get crop information for UI display
    getCropInfo() {
        return {
            seedType: this.seedType,
            currentStage: this.currentStage,
            stageName: this.stageNames[this.currentStage],
            growthProgress: this.getGrowthProgress(),
            waterLevel: this.currentWaterLevel,
            maxWaterLevel: this.maxWaterLevel,
            isHealthy: this.isHealthy,
            canHarvest: this.canHarvest,
            timeToNextStage: this.getTimeToNextStage()
        };
    }
    
    // Get growth progress as percentage
    getGrowthProgress() {
        if (this.currentStage >= this.growthStages.READY) {
            return 100;
        }
        
        const currentTime = Date.now();
        const stageElapsedTime = currentTime - this.stageStartTime;
        const requiredTime = this.stageGrowthTimes[this.currentStage] / this.growthBonus;
        
        return Math.min(100, (stageElapsedTime / requiredTime) * 100);
    }
    
    // Get time remaining until next stage
    getTimeToNextStage() {
        if (this.currentStage >= this.growthStages.READY) {
            return 0;
        }
        
        const currentTime = Date.now();
        const stageElapsedTime = currentTime - this.stageStartTime;
        const requiredTime = this.stageGrowthTimes[this.currentStage] / this.growthBonus;
        
        return Math.max(0, requiredTime - stageElapsedTime);
    }
    
    // Serialize crop data for saving
    serialize() {
        return {
            entityId: this.entityId,
            x: this.x,
            y: this.y,
            seedType: this.seedType,
            currentStage: this.currentStage,
            stageStartTime: this.stageStartTime,
            currentWaterLevel: this.currentWaterLevel,
            growthBonus: this.growthBonus,
            isHealthy: this.isHealthy,
            canHarvest: this.canHarvest
        };
    }
    
    // Deserialize crop data from save
    static deserialize(data, gameEngine) {
        const crop = new Crop(data.x, data.y, data.seedType, gameEngine);
        crop.entityId = data.entityId;
        crop.currentStage = data.currentStage;
        crop.stageStartTime = data.stageStartTime;
        crop.currentWaterLevel = data.currentWaterLevel;
        crop.growthBonus = data.growthBonus;
        crop.isHealthy = data.isHealthy;
        crop.canHarvest = data.canHarvest;
        crop.updateSprite();
        return crop;
    }
}