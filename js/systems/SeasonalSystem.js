// Seasonal system managing season transitions, visual changes, and crop availability
// Handles seasonal color palettes, crop restrictions, and seasonal events

export class SeasonalSystem {
    constructor() {
        // Season definitions
        this.seasons = {
            SPRING: {
                id: 0,
                name: 'Spring',
                description: 'Season of growth and new beginnings',
                colorScheme: {
                    primary: '#90EE90',    // Light Green
                    secondary: '#228B22',  // Forest Green
                    accent: '#FFB6C1',     // Light Pink
                    overlay: '#90EE90'
                },
                lighting: {
                    brightness: 1.0,
                    warmth: 0.6,
                    saturation: 1.1
                },
                temperature: 'mild',
                cropBonus: 1.2, // 20% faster growth
                specialEvents: ['spring_festival', 'seed_sale']
            },
            
            SUMMER: {
                id: 1,
                name: 'Summer',
                description: 'Hot season perfect for growth',
                colorScheme: {
                    primary: '#FFD700',    // Gold
                    secondary: '#FF8C00',  // Dark Orange
                    accent: '#87CEEB',     // Sky Blue
                    overlay: '#FFD700'
                },
                lighting: {
                    brightness: 1.2,
                    warmth: 0.8,
                    saturation: 1.3
                },
                temperature: 'hot',
                cropBonus: 1.5, // 50% faster growth
                specialEvents: ['summer_festival', 'beach_day']
            },
            
            FALL: {
                id: 2,
                name: 'Fall',
                description: 'Harvest season with beautiful colors',
                colorScheme: {
                    primary: '#FF8C00',    // Dark Orange
                    secondary: '#8B4513',  // Saddle Brown
                    accent: '#DC143C',     // Crimson
                    overlay: '#D2691E'
                },
                lighting: {
                    brightness: 0.9,
                    warmth: 0.7,
                    saturation: 1.2
                },
                temperature: 'cool',
                cropBonus: 1.0, // Normal growth
                specialEvents: ['harvest_festival', 'thanksgiving']
            },
            
            WINTER: {
                id: 3,
                name: 'Winter',
                description: 'Cold season of rest and preparation',
                colorScheme: {
                    primary: '#E6E6FA',    // Lavender
                    secondary: '#4682B4',  // Steel Blue
                    accent: '#F0F8FF',     // Alice Blue
                    overlay: '#B0C4DE'
                },
                lighting: {
                    brightness: 0.7,
                    warmth: 0.4,
                    saturation: 0.8
                },
                temperature: 'cold',
                cropBonus: 0.5, // 50% slower growth
                specialEvents: ['winter_festival', 'new_year']
            }
        };
        
        // Current season state
        this.currentSeasonId = 0;
        this.transitionProgress = 0; // 0-1 for smooth transitions
        this.isTransitioning = false;
        this.transitionDuration = 2000; // 2 seconds transition
        
        // Seasonal crop availability
        this.cropSeasons = {
            'turnip': [0, 2], // Spring, Fall
            'potato': [0, 1, 2], // Spring, Summer, Fall
            'carrot': [0, 1, 2], // Spring, Summer, Fall
            'corn': [1], // Summer only
            'tomato': [1, 2], // Summer, Fall
            'cabbage': [0, 2], // Spring, Fall
            'pumpkin': [2], // Fall only
            'strawberry': [0], // Spring only
            'watermelon': [1], // Summer only
            'wheat': [2, 3] // Fall, Winter
        };
        
        // Seasonal tile variations
        this.tileVariations = {
            'grass': {
                0: 'grass_spring',
                1: 'grass_summer', 
                2: 'grass_fall',
                3: 'grass_winter'
            },
            'tree': {
                0: 'tree_spring',
                1: 'tree_summer',
                2: 'tree_fall', 
                3: 'tree_winter'
            }
        };
        
        // Event callbacks
        this.callbacks = {
            onSeasonChange: [],
            onTransitionStart: [],
            onTransitionComplete: []
        };
        
        console.log('SeasonalSystem initialized');
    }
    
    // Initialize seasonal system with game engine
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupTimeCallbacks();
        this.applySeasonalEffects();
    }
    
    // Setup callbacks with time system
    setupTimeCallbacks() {
        if (this.gameEngine?.timeSystem) {
            this.gameEngine.timeSystem.on('onSeasonChange', (timeData) => {
                this.onSeasonChanged(timeData);
            });
            
            // Set initial season based on time system
            const timeData = this.gameEngine.timeSystem.getTimeData();
            this.currentSeasonId = timeData.season;
            
            console.log('SeasonalSystem connected to TimeSystem');
        }
    }
    
    // Handle season change from time system
    onSeasonChanged(timeData) {
        if (this.currentSeasonId !== timeData.season) {
            this.startSeasonTransition(timeData.season);
        }
    }
    
    // Start transition to new season
    startSeasonTransition(newSeasonId) {
        if (this.isTransitioning) return;
        
        const oldSeason = this.getCurrentSeason();
        const newSeason = this.seasons[Object.keys(this.seasons)[newSeasonId]];
        
        console.log(`Starting season transition: ${oldSeason.name} → ${newSeason.name}`);
        
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.targetSeasonId = newSeasonId;
        
        // Trigger transition start callbacks
        this.triggerCallbacks('onTransitionStart', {
            oldSeason,
            newSeason,
            seasonId: newSeasonId
        });
        
        // Schedule transition completion
        setTimeout(() => {
            this.completeSeasonTransition();
        }, this.transitionDuration);
    }
    
    // Complete season transition
    completeSeasonTransition() {
        this.currentSeasonId = this.targetSeasonId;
        this.isTransitioning = false;
        this.transitionProgress = 1;
        
        const newSeason = this.getCurrentSeason();
        
        // Apply new seasonal effects
        this.applySeasonalEffects();
        
        // Update crop growth rates
        this.updateCropGrowthRates();
        
        // Update tile appearances
        this.updateTileAppearances();
        
        console.log(`Season transition complete: Now ${newSeason.name}`);
        
        // Trigger callbacks
        this.triggerCallbacks('onSeasonChange', {
            season: newSeason,
            seasonId: this.currentSeasonId
        });
        
        this.triggerCallbacks('onTransitionComplete', {
            season: newSeason,
            seasonId: this.currentSeasonId
        });
    }
    
    // Update transition progress
    update(deltaTime) {
        if (this.isTransitioning) {
            this.transitionProgress = Math.min(1, 
                this.transitionProgress + (deltaTime / this.transitionDuration));
        }
    }
    
    // Apply seasonal effects to various systems
    applySeasonalEffects() {
        const currentSeason = this.getCurrentSeason();
        
        // Update farming system with seasonal bonuses
        if (this.gameEngine?.farmingSystem) {
            this.gameEngine.farmingSystem.seasonalGrowthMultiplier = currentSeason.cropBonus;
        }
        
        // Update lighting system if available
        this.updateSeasonalLighting(currentSeason);
        
        // Schedule seasonal events
        this.scheduleSeasonalEvents(currentSeason);
    }
    
    // Update crop growth rates for current season
    updateCropGrowthRates() {
        if (!this.gameEngine?.farmingSystem) return;
        
        const currentSeason = this.getCurrentSeason();
        const farmingSystem = this.gameEngine.farmingSystem;
        
        // Update existing crops with seasonal growth rate
        for (const [position, crop] of farmingSystem.activeCrops.entries()) {
            if (crop.growthBonus !== undefined) {
                // Apply seasonal bonus to existing growth bonus
                crop.seasonalMultiplier = currentSeason.cropBonus;
            }
        }
        
        console.log(`Updated crop growth rates for ${currentSeason.name} (${currentSeason.cropBonus}x)`);
    }
    
    // Update tile appearances for current season
    updateTileAppearances() {
        const currentScene = this.gameEngine?.sceneManager?.getCurrentScene();
        if (!currentScene || !currentScene.tileMap) return;
        
        // This would update tile sprites based on season
        // For now, we'll just log the change
        console.log(`Updated tile appearances for ${this.getCurrentSeason().name}`);
    }
    
    // Update seasonal lighting effects
    updateSeasonalLighting(season) {
        // This would integrate with a lighting system
        console.log(`Applied ${season.name} lighting: brightness ${season.lighting.brightness}, warmth ${season.lighting.warmth}`);
    }
    
    // Schedule seasonal events
    scheduleSeasonalEvents(season) {
        if (!this.gameEngine?.timeSystem) return;
        
        // Schedule special events for this season
        for (const eventName of season.specialEvents) {
            // Schedule events at random times during the season
            const eventDay = Math.floor(Math.random() * 28) + 1; // Random day in season
            const eventTime = 10 * 60; // 10:00 AM
            
            this.gameEngine.timeSystem.scheduleEvent(
                `${eventName}_${this.currentSeasonId}`,
                eventDay,
                eventTime,
                (data) => this.triggerSeasonalEvent(eventName, data),
                { season: season.name, eventName }
            );
        }
        
        console.log(`Scheduled ${season.specialEvents.length} seasonal events for ${season.name}`);
    }
    
    // Trigger a seasonal event
    triggerSeasonalEvent(eventName, data) {
        console.log(`Seasonal Event: ${eventName} in ${data.season}`);
        
        // This would trigger specific event logic
        switch (eventName) {
            case 'spring_festival':
                console.log('Spring Festival is happening! Crops grow 50% faster today.');
                break;
            case 'seed_sale':
                console.log('Seed sale at the shop! 25% off all seeds.');
                break;
            case 'harvest_festival':
                console.log('Harvest Festival! Crops sell for 25% more today.');
                break;
            default:
                console.log(`Unknown seasonal event: ${eventName}`);
        }
    }
    
    // Check if a crop can be planted in current season
    canPlantCrop(cropType) {
        if (!this.cropSeasons[cropType]) {
            console.warn(`Unknown crop type: ${cropType}`);
            return false;
        }
        
        return this.cropSeasons[cropType].includes(this.currentSeasonId);
    }
    
    // Get crops available for current season
    getSeasonalCrops() {
        const availableCrops = [];
        
        for (const [cropType, seasons] of Object.entries(this.cropSeasons)) {
            if (seasons.includes(this.currentSeasonId)) {
                availableCrops.push(cropType);
            }
        }
        
        return availableCrops;
    }
    
    // Get current season object
    getCurrentSeason() {
        return this.seasons[Object.keys(this.seasons)[this.currentSeasonId]];
    }
    
    // Get season by ID
    getSeasonById(seasonId) {
        return this.seasons[Object.keys(this.seasons)[seasonId]];
    }
    
    // Get seasonal color overlay for rendering
    getSeasonalOverlay() {
        const currentSeason = this.getCurrentSeason();
        let overlayColor = currentSeason.colorScheme.overlay;
        let alpha = 0.1;
        
        // During transition, blend colors
        if (this.isTransitioning && this.targetSeasonId !== undefined) {
            const targetSeason = this.getSeasonById(this.targetSeasonId);
            // Blend overlay colors based on transition progress
            alpha = 0.1 + (this.transitionProgress * 0.1);
        }
        
        return {
            color: overlayColor,
            alpha: alpha
        };
    }
    
    // Get seasonal lighting modifiers
    getSeasonalLighting() {
        const currentSeason = this.getCurrentSeason();
        let lighting = { ...currentSeason.lighting };
        
        // During transition, blend lighting
        if (this.isTransitioning && this.targetSeasonId !== undefined) {
            const targetSeason = this.getSeasonById(this.targetSeasonId);
            const progress = this.transitionProgress;
            
            lighting.brightness = this.lerp(
                currentSeason.lighting.brightness,
                targetSeason.lighting.brightness,
                progress
            );
            
            lighting.warmth = this.lerp(
                currentSeason.lighting.warmth,
                targetSeason.lighting.warmth,
                progress
            );
            
            lighting.saturation = this.lerp(
                currentSeason.lighting.saturation,
                targetSeason.lighting.saturation,
                progress
            );
        }
        
        return lighting;
    }
    
    // Linear interpolation helper
    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }
    
    // Get seasonal temperature description
    getTemperature() {
        return this.getCurrentSeason().temperature;
    }
    
    // Get days remaining in current season
    getDaysRemainingInSeason() {
        if (!this.gameEngine?.timeSystem) return 0;
        
        const timeData = this.gameEngine.timeSystem.getTimeData();
        return 30 - timeData.dayInSeason + 1; // 30 days per season
    }
    
    // Register callback for seasonal events
    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }
    
    // Remove callback
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index !== -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }
    
    // Trigger callbacks
    triggerCallbacks(eventType, data) {
        if (this.callbacks[eventType]) {
            for (const callback of this.callbacks[eventType]) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} callback:`, error);
                }
            }
        }
    }
    
    // Render seasonal effects
    render(renderSystem) {
        if (!renderSystem) return;
        
        // Apply seasonal overlay
        const overlay = this.getSeasonalOverlay();
        if (overlay.alpha > 0) {
            const canvas = renderSystem.canvas;
            renderSystem.drawRect(
                0, 0, canvas.width, canvas.height,
                overlay.color,
                { alpha: overlay.alpha, layer: 1 }
            );
        }
        
        // Render seasonal transition effects
        if (this.isTransitioning) {
            this.renderTransitionEffects(renderSystem);
        }
    }
    
    // Render transition effects
    renderTransitionEffects(renderSystem) {
        // Add sparkle or particle effects during season transitions
        const canvas = renderSystem.canvas;
        const sparkleCount = 20;
        
        for (let i = 0; i < sparkleCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const alpha = Math.sin(this.transitionProgress * Math.PI) * 0.5;
            
            renderSystem.drawRect(
                x, y, 2, 2,
                '#ffffff',
                { alpha: alpha, layer: 50 }
            );
        }
    }
    
    // Render debug info
    renderDebug(renderSystem) {
        if (!renderSystem) return;
        
        const debugColor = '#ff69b4';
        let yOffset = 160;
        
        const currentSeason = this.getCurrentSeason();
        
        renderSystem.drawText(
            `Season: ${currentSeason.name} (${currentSeason.temperature})`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Growth Rate: ${(currentSeason.cropBonus * 100).toFixed(0)}%`,
            10, yOffset, { color: debugColor, layer: 1000 }
        );
        yOffset += 20;
        
        if (this.isTransitioning) {
            const targetSeason = this.getSeasonById(this.targetSeasonId);
            renderSystem.drawText(
                `Transitioning to ${targetSeason.name} (${(this.transitionProgress * 100).toFixed(1)}%)`,
                10, yOffset, { color: debugColor, layer: 1000 }
            );
        }
    }
    
    // Get system statistics
    getStats() {
        const currentSeason = this.getCurrentSeason();
        
        return {
            currentSeason: currentSeason.name,
            seasonId: this.currentSeasonId,
            temperature: currentSeason.temperature,
            cropBonus: currentSeason.cropBonus,
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress,
            availableCrops: this.getSeasonalCrops().length,
            daysRemaining: this.getDaysRemainingInSeason(),
            scheduledEvents: currentSeason.specialEvents.length
        };
    }
    
    // Serialize seasonal system state
    serialize() {
        return {
            currentSeasonId: this.currentSeasonId,
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress,
            targetSeasonId: this.targetSeasonId
        };
    }
    
    // Deserialize seasonal system state
    deserialize(data) {
        this.currentSeasonId = data.currentSeasonId || 0;
        this.isTransitioning = data.isTransitioning || false;
        this.transitionProgress = data.transitionProgress || 0;
        this.targetSeasonId = data.targetSeasonId;
        
        this.applySeasonalEffects();
        
        console.log(`Loaded seasonal state: ${this.getCurrentSeason().name}`);
    }
}