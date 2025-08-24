// Individual fish entity with rarity, value, and fishing mechanics
// Handles fish properties, catch difficulty, and behavioral patterns

export class Fish {
    constructor(fishType, gameEngine) {
        this.entityId = `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.fishType = fishType;
        this.gameEngine = gameEngine;
        
        // Fish properties based on type
        const fishData = this.getFishData(fishType);
        this.name = fishData.name;
        this.rarity = fishData.rarity;
        this.baseValue = fishData.baseValue;
        this.catchDifficulty = fishData.catchDifficulty;
        this.size = fishData.size;
        this.habitat = fishData.habitat;
        
        // Catch mechanics
        this.escapeChance = this.calculateEscapeChance();
        this.catchTimeWindow = this.calculateCatchWindow();
        
        // Visual properties
        this.sprite = `fish_${fishType}`;
        this.description = fishData.description;
        
        // State tracking
        this.isCaught = false;
        this.timeAlive = 0;
        
        console.log(`Created ${this.name} fish (${this.rarity})`);
    }
    
    // Get fish data for different fish types
    getFishData(fishType) {
        const fishDatabase = {
            'minnow': {
                name: 'Minnow',
                rarity: 'common',
                baseValue: 10,
                catchDifficulty: 1,
                size: 'tiny',
                habitat: 'river',
                description: 'A small, common fish found in shallow waters'
            },
            'trout': {
                name: 'Trout',
                rarity: 'common',
                baseValue: 25,
                catchDifficulty: 2,
                size: 'small',
                habitat: 'river',
                description: 'A popular freshwater fish with speckled sides'
            },
            'bass': {
                name: 'Bass',
                rarity: 'uncommon',
                baseValue: 50,
                catchDifficulty: 3,
                size: 'medium',
                habitat: 'lake',
                description: 'A fighting fish that puts up a good struggle'
            },
            'salmon': {
                name: 'Salmon',
                rarity: 'uncommon',
                baseValue: 75,
                catchDifficulty: 4,
                size: 'large',
                habitat: 'river',
                description: 'A prized fish known for its upstream journey'
            },
            'golden_carp': {
                name: 'Golden Carp',
                rarity: 'rare',
                baseValue: 150,
                catchDifficulty: 5,
                size: 'medium',
                habitat: 'lake',
                description: 'A beautiful golden fish of legend'
            },
            'rainbow_fish': {
                name: 'Rainbow Fish',
                rarity: 'rare',
                baseValue: 200,
                catchDifficulty: 6,
                size: 'medium',
                habitat: 'ocean',
                description: 'A magical fish that shimmers with all colors'
            },
            'ancient_sturgeon': {
                name: 'Ancient Sturgeon',
                rarity: 'legendary',
                baseValue: 500,
                catchDifficulty: 8,
                size: 'huge',
                habitat: 'deep_lake',
                description: 'An ancient fish that has lived for centuries'
            }
        };
        
        return fishDatabase[fishType] || fishDatabase['minnow'];
    }
    
    // Calculate escape chance based on difficulty
    calculateEscapeChance() {
        const baseEscape = 0.1;
        const difficultyModifier = this.catchDifficulty * 0.05;
        return Math.min(0.8, baseEscape + difficultyModifier);
    }
    
    // Calculate catch time window based on difficulty
    calculateCatchWindow() {
        const baseWindow = 2000; // 2 seconds
        const difficultyReduction = this.catchDifficulty * 200;
        return Math.max(500, baseWindow - difficultyReduction);
    }
    
    // Update fish state
    update(deltaTime) {
        this.timeAlive += deltaTime;
        
        // Fish might escape over time if not caught quickly
        if (!this.isCaught && this.timeAlive > 10000) { // 10 seconds
            const escapeRoll = Math.random();
            if (escapeRoll < this.escapeChance * 0.1) {
                this.escape();
            }
        }
    }
    
    // Attempt to catch this fish
    attemptCatch(playerSkill = 1, perfectTiming = false) {
        if (this.isCaught) {
            return { success: false, reason: 'already_caught' };
        }
        
        // Calculate success chance
        let successChance = 0.5;
        
        // Player skill modifier
        successChance += (playerSkill - 1) * 0.1;
        
        // Perfect timing bonus
        if (perfectTiming) {
            successChance += 0.3;
        }
        
        // Difficulty penalty
        successChance -= (this.catchDifficulty - 1) * 0.08;
        
        // Rarity penalty
        const rarityPenalty = {
            'common': 0,
            'uncommon': 0.1,
            'rare': 0.2,
            'legendary': 0.3
        };
        successChance -= rarityPenalty[this.rarity] || 0;
        
        // Clamp success chance
        successChance = Math.max(0.05, Math.min(0.95, successChance));
        
        const catchRoll = Math.random();
        const success = catchRoll < successChance;
        
        if (success) {
            this.isCaught = true;
            console.log(`Successfully caught ${this.name}!`);
            return {
                success: true,
                fish: this,
                bonus: perfectTiming ? 'perfect' : 'normal'
            };
        } else {
            // Fish might escape on failed catch
            if (Math.random() < this.escapeChance) {
                this.escape();
                return { success: false, reason: 'escaped' };
            } else {
                return { success: false, reason: 'missed' };
            }
        }
    }
    
    // Fish escapes
    escape() {
        console.log(`${this.name} escaped!`);
        this.isCaught = false;
        // Fish is removed from fishing spot
    }
    
    // Get fish value with quality modifiers
    getValue(quality = 'normal') {
        let value = this.baseValue;
        
        const qualityMultipliers = {
            'poor': 0.5,
            'normal': 1.0,
            'good': 1.3,
            'perfect': 1.8
        };
        
        return Math.round(value * (qualityMultipliers[quality] || 1.0));
    }
    
    // Get fish information for UI display
    getFishInfo() {
        return {
            name: this.name,
            fishType: this.fishType,
            rarity: this.rarity,
            size: this.size,
            habitat: this.habitat,
            baseValue: this.baseValue,
            catchDifficulty: this.catchDifficulty,
            description: this.description,
            isCaught: this.isCaught,
            escapeChance: this.escapeChance
        };
    }
    
    // Render fish entity (for inventory or collection display)
    render(renderSystem, x, y, options = {}) {
        if (!renderSystem || !this.sprite) return;
        
        // Render fish sprite
        renderSystem.drawSprite(
            this.sprite,
            x, y,
            { 
                layer: options.layer || 5,
                scale: options.scale || 1.0,
                alpha: this.isCaught ? 1.0 : 0.8
            }
        );
        
        // Render rarity indicator
        if (options.showRarity) {
            const rarityColors = {
                'common': '#ffffff',
                'uncommon': '#00ff00',
                'rare': '#0080ff',
                'legendary': '#ff8000'
            };
            
            const color = rarityColors[this.rarity] || '#ffffff';
            renderSystem.drawRect(
                x, y - 4,
                32, 2,
                color,
                { alpha: 0.8, layer: (options.layer || 5) + 1 }
            );
        }
    }
    
    // Serialize fish data for saving
    serialize() {
        return {
            entityId: this.entityId,
            fishType: this.fishType,
            isCaught: this.isCaught,
            timeAlive: this.timeAlive
        };
    }
    
    // Deserialize fish data from save
    static deserialize(data, gameEngine) {
        const fish = new Fish(data.fishType, gameEngine);
        fish.entityId = data.entityId;
        fish.isCaught = data.isCaught;
        fish.timeAlive = data.timeAlive;
        return fish;
    }
    
    // Get random fish type based on location rarity
    static getRandomFishType(habitat = 'river', rarityBoost = 0) {
        const fishByHabitat = {
            'river': ['minnow', 'trout', 'salmon'],
            'lake': ['minnow', 'trout', 'bass', 'golden_carp'],
            'ocean': ['trout', 'bass', 'rainbow_fish'],
            'deep_lake': ['bass', 'golden_carp', 'ancient_sturgeon']
        };
        
        const availableFish = fishByHabitat[habitat] || fishByHabitat['river'];
        
        // Apply rarity distribution
        let rarityRoll = Math.random() + rarityBoost;
        
        if (rarityRoll > 0.95) {
            // Legendary (5% + boost)
            return availableFish.find(fish => {
                const fishData = new Fish(fish).getFishData(fish);
                return fishData.rarity === 'legendary';
            }) || availableFish[availableFish.length - 1];
        } else if (rarityRoll > 0.8) {
            // Rare (15% + boost)
            const rareFish = availableFish.filter(fish => {
                const fishData = new Fish(fish).getFishData(fish);
                return fishData.rarity === 'rare';
            });
            return rareFish[Math.floor(Math.random() * rareFish.length)] || availableFish[0];
        } else if (rarityRoll > 0.5) {
            // Uncommon (30% + boost)
            const uncommonFish = availableFish.filter(fish => {
                const fishData = new Fish(fish).getFishData(fish);
                return fishData.rarity === 'uncommon';
            });
            return uncommonFish[Math.floor(Math.random() * uncommonFish.length)] || availableFish[0];
        } else {
            // Common (50% + boost)
            const commonFish = availableFish.filter(fish => {
                const fishData = new Fish(fish).getFishData(fish);
                return fishData.rarity === 'common';
            });
            return commonFish[Math.floor(Math.random() * commonFish.length)] || availableFish[0];
        }
    }
}