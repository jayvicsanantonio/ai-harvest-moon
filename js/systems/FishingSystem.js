// Fishing system managing fishing spots, mini-game mechanics, and fish catching
// Handles fishing spot detection, timing-based mini-game, and fish generation

import { Fish } from '../entities/Fish.js';

export class FishingSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        
        // Fishing spots and locations
        this.fishingSpots = new Map();
        this.activeFishingSpot = null;
        
        // Mini-game state
        this.isFishing = false;
        this.fishingStartTime = 0;
        this.biteTime = 0;
        this.hasBite = false;
        this.catchWindow = { start: 0, end: 0 };
        this.currentFish = null;
        
        // Mini-game mechanics
        this.minBiteDelay = 2000;  // 2 seconds minimum before bite
        this.maxBiteDelay = 8000;  // 8 seconds maximum before bite
        this.catchWindowDuration = 1500; // 1.5 seconds to catch
        this.perfectCatchWindow = 300; // 0.3 seconds for perfect catch
        
        // Player progress
        this.fishingSkill = 1;
        this.fishCaught = 0;
        this.perfectCatches = 0;
        
        // UI state
        this.showFishingUI = false;
        this.fishingProgress = 0;
        this.catchQuality = 'normal';
        
        console.log('FishingSystem initialized');
    }
    
    // Initialize fishing system
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.createDefaultFishingSpots();
        this.isActive = true;
    }
    
    // Create default fishing spots
    createDefaultFishingSpots() {
        const defaultSpots = [
            { id: 'river_spot_1', x: 400, y: 300, habitat: 'river', name: 'River Bend' },
            { id: 'lake_spot_1', x: 800, y: 200, habitat: 'lake', name: 'Crystal Lake' },
            { id: 'river_spot_2', x: 200, y: 500, habitat: 'river', name: 'Rapids' },
            { id: 'deep_lake_1', x: 900, y: 100, habitat: 'deep_lake', name: 'Deep Waters' }
        ];
        
        defaultSpots.forEach(spot => {
            this.createFishingSpot(spot.id, spot.x, spot.y, spot.habitat, spot.name);
        });
    }
    
    // Create a fishing spot
    createFishingSpot(id, x, y, habitat = 'river', name = 'Fishing Spot') {
        const fishingSpot = {
            id,
            x,
            y,
            habitat,
            name,
            isActive: true,
            lastFished: 0,
            restockTime: 300000, // 5 minutes to restock
            fishPopulation: this.generateFishPopulation(habitat),
            maxFish: 5,
            rarityBoost: 0
        };
        
        this.fishingSpots.set(id, fishingSpot);
        console.log(`Created fishing spot: ${name} at (${x}, ${y})`);
    }
    
    // Generate fish population for a habitat
    generateFishPopulation(habitat) {
        const population = [];
        const fishCount = Math.floor(Math.random() * 3) + 2; // 2-4 fish
        
        for (let i = 0; i < fishCount; i++) {
            const fishType = Fish.getRandomFishType(habitat);
            population.push(new Fish(fishType, this.gameEngine));
        }
        
        return population;
    }
    
    // Update fishing system
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update fishing spots (restock over time)
        this.updateFishingSpots(deltaTime);
        
        // Update active fishing session
        if (this.isFishing) {
            this.updateFishingSession(deltaTime);
        }
    }
    
    // Update fishing spots
    updateFishingSpots(deltaTime) {
        for (const spot of this.fishingSpots.values()) {
            // Restock fish if population is low and enough time has passed
            const timeSinceLastFished = Date.now() - spot.lastFished;
            if (spot.fishPopulation.length < spot.maxFish && timeSinceLastFished > spot.restockTime) {
                const newFishType = Fish.getRandomFishType(spot.habitat, spot.rarityBoost);
                spot.fishPopulation.push(new Fish(newFishType, this.gameEngine));
            }
            
            // Update fish in population
            spot.fishPopulation.forEach(fish => fish.update(deltaTime));
            
            // Remove escaped fish
            spot.fishPopulation = spot.fishPopulation.filter(fish => !fish.escaped);
        }
    }
    
    // Update active fishing session
    updateFishingSession(deltaTime) {
        const currentTime = Date.now();
        const fishingDuration = currentTime - this.fishingStartTime;
        
        // Check if bite should occur
        if (!this.hasBite && fishingDuration >= this.biteTime) {
            this.triggerBite();
        }
        
        // Update UI progress
        if (this.hasBite) {
            const catchProgress = (currentTime - this.catchWindow.start) / (this.catchWindow.end - this.catchWindow.start);
            this.fishingProgress = Math.min(1.0, catchProgress);
            
            // Auto-fail if catch window expires
            if (currentTime > this.catchWindow.end && this.isFishing) {
                this.endFishing('timeout');
            }
        } else {
            // Show waiting progress
            this.fishingProgress = Math.min(1.0, fishingDuration / this.biteTime);
        }
    }
    
    // Start fishing at a specific spot
    startFishing(player, spotId) {
        const spot = this.fishingSpots.get(spotId);
        if (!spot || !spot.isActive) {
            return { success: false, message: "No fishing spot here" };
        }
        
        if (spot.fishPopulation.length === 0) {
            return { success: false, message: "No fish in this spot" };
        }
        
        // Check if player has fishing rod
        if (!this.hasRequiredTool(player)) {
            return { success: false, message: "You need a fishing rod" };
        }
        
        // Check stamina cost
        const staminaCost = 10;
        if (player.stamina < staminaCost) {
            return { success: false, message: "Not enough stamina" };
        }
        
        // Start fishing session
        this.isFishing = true;
        this.activeFishingSpot = spot;
        this.fishingStartTime = Date.now();
        this.biteTime = this.calculateBiteTime();
        this.hasBite = false;
        this.showFishingUI = true;
        this.fishingProgress = 0;
        
        // Select random fish from spot
        const availableFish = spot.fishPopulation.filter(fish => !fish.isCaught);
        this.currentFish = availableFish[Math.floor(Math.random() * availableFish.length)];
        
        // Consume stamina
        this.gameEngine.staminaSystem?.consumeStamina(staminaCost);
        
        console.log(`Started fishing at ${spot.name}`);
        return { success: true, message: `Fishing at ${spot.name}...` };
    }
    
    // Calculate random bite time
    calculateBiteTime() {
        return Math.random() * (this.maxBiteDelay - this.minBiteDelay) + this.minBiteDelay;
    }
    
    // Trigger fish bite
    triggerBite() {
        if (!this.currentFish) return;
        
        this.hasBite = true;
        const currentTime = Date.now();
        this.catchWindow.start = currentTime;
        this.catchWindow.end = currentTime + this.currentFish.catchTimeWindow;
        
        console.log(`Fish biting! Catch window: ${this.currentFish.catchTimeWindow}ms`);
    }
    
    // Attempt to catch fish (called when player presses catch button)
    attemptCatch(player) {
        if (!this.isFishing || !this.hasBite || !this.currentFish) {
            return { success: false, message: "No fish to catch" };
        }
        
        const currentTime = Date.now();
        
        // Check if within catch window
        if (currentTime < this.catchWindow.start || currentTime > this.catchWindow.end) {
            this.endFishing('missed');
            return { success: false, message: "Missed the fish!" };
        }
        
        // Check for perfect timing
        const windowCenter = (this.catchWindow.start + this.catchWindow.end) / 2;
        const timingDifference = Math.abs(currentTime - windowCenter);
        const perfectTiming = timingDifference < this.perfectCatchWindow;
        
        // Attempt to catch the fish
        const catchResult = this.currentFish.attemptCatch(this.fishingSkill, perfectTiming);
        
        if (catchResult.success) {
            this.handleSuccessfulCatch(player, catchResult, perfectTiming);
            return { 
                success: true, 
                message: `Caught a ${this.currentFish.name}!`,
                fish: this.currentFish,
                quality: perfectTiming ? 'perfect' : 'normal'
            };
        } else {
            const failureMessage = this.getFailureMessage(catchResult.reason);
            this.endFishing(catchResult.reason);
            return { success: false, message: failureMessage };
        }
    }
    
    // Handle successful catch
    handleSuccessfulCatch(player, catchResult, perfectTiming) {
        // Add fish to inventory
        const fishItem = {
            type: 'fish',
            subType: this.currentFish.fishType,
            name: this.currentFish.name,
            value: this.currentFish.getValue(perfectTiming ? 'perfect' : 'normal'),
            quality: perfectTiming ? 'perfect' : 'normal',
            rarity: this.currentFish.rarity
        };
        
        this.gameEngine.getSystem('tool')?.getInventory()?.addItem(fishItem, 1);
        
        // Update statistics
        this.fishCaught++;
        if (perfectTiming) {
            this.perfectCatches++;
        }
        
        // Improve fishing skill
        this.improveFishingSkill(perfectTiming, this.currentFish.rarity);
        
        // Remove fish from spot
        if (this.activeFishingSpot) {
            const fishIndex = this.activeFishingSpot.fishPopulation.indexOf(this.currentFish);
            if (fishIndex !== -1) {
                this.activeFishingSpot.fishPopulation.splice(fishIndex, 1);
            }
            this.activeFishingSpot.lastFished = Date.now();
        }
        
        this.endFishing('success');
        console.log(`Successfully caught ${this.currentFish.name} (${perfectTiming ? 'Perfect' : 'Normal'})`);
    }
    
    // Implement skill progression system for fishing
    // This should increase fishing skill based on catches and perfect timing
    improveFishingSkill(perfectTiming, rarity) {
        // Base skill gain
        let skillGain = perfectTiming ? 0.1 : 0.05;
        
        // Rarity multipliers
        const rarityMultipliers = {
            'common': 1.0,
            'uncommon': 1.5,
            'rare': 2.0,
            'legendary': 3.0
        };
        
        skillGain *= rarityMultipliers[rarity] || 1.0;
        
        // Apply skill gain with diminishing returns
        const oldSkill = this.fishingSkill;
        const skillCap = 10.0;
        const diminishingFactor = Math.max(0.1, 1.0 - (this.fishingSkill / skillCap) * 0.8);
        
        this.fishingSkill += skillGain * diminishingFactor;
        this.fishingSkill = Math.min(skillCap, this.fishingSkill);
        
        // Check for skill milestones
        const newSkillLevel = Math.floor(this.fishingSkill);
        const oldSkillLevel = Math.floor(oldSkill);
        
        if (newSkillLevel > oldSkillLevel) {
            console.log(`Fishing skill increased to level ${newSkillLevel}!`);
            this.handleSkillMilestone(newSkillLevel);
        }
    }
    
    // Handle skill milestone rewards
    handleSkillMilestone(level) {
        const milestones = {
            2: { name: 'Novice Angler', reward: 'Reduced fish escape chance' },
            3: { name: 'Steady Hands', reward: 'Longer catch windows' },
            5: { name: 'Fish Whisperer', reward: 'Rare fish spawn more often' },
            7: { name: 'Master Fisher', reward: 'Perfect catch window increased' },
            10: { name: 'Legendary Angler', reward: 'Can catch legendary fish anywhere' }
        };
        
        const milestone = milestones[level];
        if (milestone) {
            console.log(`🎣 Achievement Unlocked: ${milestone.name} - ${milestone.reward}`);
            this.applySkillBonus(level);
        }
    }
    
    // Apply skill-based bonuses
    applySkillBonus(level) {
        if (level >= 2) {
            // Reduce fish escape chance by 10%
            for (const spot of this.fishingSpots.values()) {
                spot.rarityBoost = Math.min(0.2, spot.rarityBoost + 0.05);
            }
        }
        
        if (level >= 3) {
            // Increase catch windows by 20%
            this.catchWindowDuration = Math.min(2500, this.catchWindowDuration * 1.1);
        }
        
        if (level >= 7) {
            // Increase perfect catch window
            this.perfectCatchWindow = Math.min(500, this.perfectCatchWindow * 1.2);
        }
    }
    
    // Get failure message based on reason
    getFailureMessage(reason) {
        const messages = {
            'missed': 'The fish got away!',
            'escaped': 'The fish escaped!',
            'timeout': 'Too slow! The fish lost interest.',
            'already_caught': 'This fish was already caught.'
        };
        
        return messages[reason] || 'Failed to catch the fish.';
    }
    
    // End fishing session
    endFishing(reason) {
        this.isFishing = false;
        this.activeFishingSpot = null;
        this.currentFish = null;
        this.hasBite = false;
        this.showFishingUI = false;
        this.fishingProgress = 0;
        this.catchWindow = { start: 0, end: 0 };
        
        console.log(`Fishing session ended: ${reason}`);
    }
    
    // Check if player can fish (has required tool)
    hasRequiredTool(player) {
        // Check if player has fishing rod in inventory
        const toolSystem = this.gameEngine.getSystem('tool');
        return toolSystem?.hasItem('fishing_rod') || false;
    }
    
    // Get nearest fishing spot to position
    getNearestFishingSpot(x, y, maxDistance = 50) {
        let nearestSpot = null;
        let nearestDistance = Infinity;
        
        for (const spot of this.fishingSpots.values()) {
            const distance = Math.sqrt((spot.x - x) ** 2 + (spot.y - y) ** 2);
            if (distance < nearestDistance && distance <= maxDistance && spot.isActive) {
                nearestDistance = distance;
                nearestSpot = spot;
            }
        }
        
        return nearestSpot;
    }
    
    // Handle player interaction with fishing spots
    handlePlayerInteraction(player, action, targetSpot = null) {
        if (action === 'start_fishing') {
            const spot = targetSpot || this.getNearestFishingSpot(player.x, player.y);
            if (spot) {
                return this.startFishing(player, spot.id);
            } else {
                return { success: false, message: "No fishing spot nearby" };
            }
        } else if (action === 'catch_fish') {
            return this.attemptCatch(player);
        } else if (action === 'stop_fishing') {
            this.endFishing('stopped');
            return { success: true, message: "Stopped fishing" };
        }
        
        return { success: false, message: "Unknown fishing action" };
    }
    
    // Render fishing spots and UI
    render(renderSystem) {
        if (!renderSystem) return;
        
        // Render fishing spots
        for (const spot of this.fishingSpots.values()) {
            if (spot.isActive) {
                this.renderFishingSpot(renderSystem, spot);
            }
        }
        
        // Render fishing UI if active
        if (this.showFishingUI && this.isFishing) {
            this.renderFishingUI(renderSystem);
        }
    }
    
    // Render individual fishing spot
    renderFishingSpot(renderSystem, spot) {
        // Render water ripples or fishing spot indicator
        renderSystem.drawCircle(
            spot.x, spot.y,
            20,
            '#4682b4',
            { alpha: 0.6, layer: 3 }
        );
        
        // Render spot name if player is nearby
        const camera = renderSystem.camera;
        const playerNearby = this.gameEngine.getSystem('scene')?.currentScene?.player;
        if (playerNearby) {
            const distance = Math.sqrt((spot.x - playerNearby.x) ** 2 + (spot.y - playerNearby.y) ** 2);
            if (distance < 60) {
                renderSystem.drawText(
                    spot.name,
                    spot.x, spot.y - 30,
                    { 
                        font: '12px Arial',
                        color: '#ffffff',
                        align: 'center',
                        layer: 10
                    }
                );
            }
        }
        
        // Show fish count indicator
        if (spot.fishPopulation.length > 0) {
            const fishCount = spot.fishPopulation.filter(fish => !fish.isCaught).length;
            for (let i = 0; i < Math.min(fishCount, 3); i++) {
                renderSystem.drawCircle(
                    spot.x + (i * 8) - 8, spot.y - 10,
                    2,
                    '#ffff00',
                    { alpha: 0.8, layer: 4 }
                );
            }
        }
    }
    
    // Render fishing UI
    renderFishingUI(renderSystem) {
        const canvas = renderSystem.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // UI background
        renderSystem.drawRect(
            centerX - 150, centerY + 100,
            300, 80,
            '#000000',
            { alpha: 0.8, layer: 15 }
        );
        
        if (!this.hasBite) {
            // Waiting for bite
            renderSystem.drawText(
                'Waiting for a bite...',
                centerX, centerY + 120,
                { 
                    font: '16px Arial',
                    color: '#ffffff',
                    align: 'center',
                    layer: 16
                }
            );
            
            // Progress bar
            const progressWidth = this.fishingProgress * 250;
            renderSystem.drawRect(
                centerX - 125, centerY + 140,
                progressWidth, 10,
                '#4682b4',
                { layer: 16 }
            );
        } else {
            // Catch window active
            renderSystem.drawText(
                'BITE! Press SPACE to catch!',
                centerX, centerY + 120,
                { 
                    font: '18px Arial',
                    color: '#ff0000',
                    align: 'center',
                    layer: 16
                }
            );
            
            // Catch window indicator
            const windowProgress = this.fishingProgress;
            const windowWidth = 250;
            const catchBarWidth = windowProgress * windowWidth;
            
            // Background bar
            renderSystem.drawRect(
                centerX - 125, centerY + 140,
                windowWidth, 15,
                '#333333',
                { layer: 16 }
            );
            
            // Progress bar
            renderSystem.drawRect(
                centerX - 125, centerY + 140,
                catchBarWidth, 15,
                windowProgress > 0.8 ? '#ff0000' : '#00ff00',
                { layer: 16 }
            );
            
            // Perfect catch zone
            const perfectStart = windowWidth * 0.4;
            const perfectEnd = windowWidth * 0.6;
            renderSystem.drawRect(
                centerX - 125 + perfectStart, centerY + 140,
                perfectEnd - perfectStart, 15,
                '#ffff00',
                { alpha: 0.5, layer: 16 }
            );
        }
    }
    
    // Get fishing statistics
    getStats() {
        return {
            fishingSkill: this.fishingSkill,
            fishCaught: this.fishCaught,
            perfectCatches: this.perfectCatches,
            isFishing: this.isFishing,
            activeSpotsCount: Array.from(this.fishingSpots.values()).filter(spot => spot.isActive).length
        };
    }
    
    // Serialize fishing system data for saving
    serialize() {
        const spots = {};
        for (const [id, spot] of this.fishingSpots.entries()) {
            spots[id] = {
                ...spot,
                fishPopulation: spot.fishPopulation.map(fish => fish.serialize())
            };
        }
        
        return {
            fishingSkill: this.fishingSkill,
            fishCaught: this.fishCaught,
            perfectCatches: this.perfectCatches,
            fishingSpots: spots
        };
    }
    
    // Deserialize fishing system data from save
    deserialize(data, gameEngine) {
        this.fishingSkill = data.fishingSkill || 1;
        this.fishCaught = data.fishCaught || 0;
        this.perfectCatches = data.perfectCatches || 0;
        
        if (data.fishingSpots) {
            this.fishingSpots.clear();
            for (const [id, spotData] of Object.entries(data.fishingSpots)) {
                const spot = { ...spotData };
                spot.fishPopulation = spotData.fishPopulation.map(fishData => 
                    Fish.deserialize(fishData, gameEngine)
                );
                this.fishingSpots.set(id, spot);
            }
        }
    }
}