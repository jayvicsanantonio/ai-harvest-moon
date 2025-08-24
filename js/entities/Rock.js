// Individual rock entity for mining with durability and ore generation
// Handles rock breaking mechanics, tool requirements, and resource drops

export class Rock {
    constructor(x, y, rockType, gameEngine) {
        this.entityId = `rock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = x;
        this.y = y;
        this.tileX = Math.floor(x / 32);
        this.tileY = Math.floor(y / 32);
        this.rockType = rockType;
        this.gameEngine = gameEngine;
        
        // Rock properties based on type
        const rockData = this.getRockData(rockType);
        this.name = rockData.name;
        this.maxDurability = rockData.durability;
        this.currentDurability = this.maxDurability;
        this.requiredTool = rockData.requiredTool;
        this.toolLevel = rockData.toolLevel;
        this.oreDrops = rockData.oreDrops;
        this.hardness = rockData.hardness;
        
        // Visual properties
        this.sprite = `rock_${rockType}`;
        this.damageSprite = null;
        this.renderLayer = 6;
        
        // State tracking
        this.isBroken = false;
        this.lastHitTime = 0;
        this.hitCount = 0;
        this.crackLevel = 0; // 0-3 crack visual levels
        
        // Mining mechanics
        this.regenerationTime = rockData.regenerationTime || 86400000; // 24 hours default
        this.brokeTime = 0;
        this.canRegenerate = rockData.canRegenerate !== false;
        
        console.log(`Created ${this.name} rock at (${this.tileX}, ${this.tileY})`);
    }
    
    // Get rock data for different rock types
    getRockData(rockType) {
        const rockDatabase = {
            'small_stone': {
                name: 'Small Stone',
                durability: 3,
                requiredTool: 'pickaxe',
                toolLevel: 1,
                hardness: 1,
                canRegenerate: true,
                regenerationTime: 3600000, // 1 hour
                oreDrops: [
                    { type: 'stone', min: 1, max: 3, chance: 1.0 },
                    { type: 'coal', min: 1, max: 1, chance: 0.3 },
                    { type: 'iron_ore', min: 1, max: 1, chance: 0.1 }
                ]
            },
            'limestone': {
                name: 'Limestone Rock',
                durability: 5,
                requiredTool: 'pickaxe',
                toolLevel: 1,
                hardness: 2,
                canRegenerate: true,
                regenerationTime: 7200000, // 2 hours
                oreDrops: [
                    { type: 'stone', min: 2, max: 4, chance: 1.0 },
                    { type: 'limestone', min: 1, max: 2, chance: 0.8 },
                    { type: 'coal', min: 1, max: 2, chance: 0.4 }
                ]
            },
            'iron_ore': {
                name: 'Iron Ore Deposit',
                durability: 8,
                requiredTool: 'pickaxe',
                toolLevel: 2,
                hardness: 3,
                canRegenerate: true,
                regenerationTime: 14400000, // 4 hours
                oreDrops: [
                    { type: 'stone', min: 1, max: 2, chance: 1.0 },
                    { type: 'iron_ore', min: 2, max: 4, chance: 1.0 },
                    { type: 'coal', min: 1, max: 2, chance: 0.6 }
                ]
            },
            'gold_ore': {
                name: 'Gold Ore Deposit',
                durability: 12,
                requiredTool: 'pickaxe',
                toolLevel: 3,
                hardness: 4,
                canRegenerate: true,
                regenerationTime: 21600000, // 6 hours
                oreDrops: [
                    { type: 'stone', min: 1, max: 3, chance: 1.0 },
                    { type: 'iron_ore', min: 1, max: 2, chance: 0.8 },
                    { type: 'gold_ore', min: 1, max: 3, chance: 1.0 },
                    { type: 'gems', min: 1, max: 1, chance: 0.2 }
                ]
            },
            'crystal_formation': {
                name: 'Crystal Formation',
                durability: 15,
                requiredTool: 'pickaxe',
                toolLevel: 4,
                hardness: 5,
                canRegenerate: true,
                regenerationTime: 43200000, // 12 hours
                oreDrops: [
                    { type: 'crystal', min: 2, max: 5, chance: 1.0 },
                    { type: 'gems', min: 1, max: 2, chance: 0.8 },
                    { type: 'rare_crystal', min: 1, max: 1, chance: 0.3 }
                ]
            },
            'boulder': {
                name: 'Large Boulder',
                durability: 20,
                requiredTool: 'pickaxe',
                toolLevel: 2,
                hardness: 6,
                canRegenerate: false,
                oreDrops: [
                    { type: 'stone', min: 5, max: 10, chance: 1.0 },
                    { type: 'iron_ore', min: 2, max: 4, chance: 0.7 },
                    { type: 'gold_ore', min: 1, max: 2, chance: 0.3 },
                    { type: 'gems', min: 1, max: 1, chance: 0.1 }
                ]
            }
        };
        
        return rockDatabase[rockType] || rockDatabase['small_stone'];
    }
    
    // Update rock state
    update(deltaTime) {
        // Check for regeneration if rock is broken
        if (this.isBroken && this.canRegenerate) {
            const timeSinceBroke = Date.now() - this.brokeTime;
            if (timeSinceBroke >= this.regenerationTime) {
                this.regenerate();
            }
        }
        
        // Update crack visuals
        this.updateCrackLevel();
    }
    
    // Update crack level based on durability
    updateCrackLevel() {
        const durabilityPercent = this.currentDurability / this.maxDurability;
        
        if (durabilityPercent > 0.75) {
            this.crackLevel = 0; // No cracks
        } else if (durabilityPercent > 0.5) {
            this.crackLevel = 1; // Light cracks
        } else if (durabilityPercent > 0.25) {
            this.crackLevel = 2; // Medium cracks
        } else {
            this.crackLevel = 3; // Heavy cracks
        }
        
        // Update damage sprite
        if (this.crackLevel > 0) {
            this.damageSprite = `${this.sprite}_crack${this.crackLevel}`;
        } else {
            this.damageSprite = null;
        }
    }
    
    // Attempt to mine this rock
    attemptMine(tool, playerLevel = 1) {
        if (this.isBroken) {
            return { success: false, reason: 'already_broken', message: 'This rock is already broken' };
        }
        
        // Check tool requirements
        if (!this.hasRequiredTool(tool)) {
            return { 
                success: false, 
                reason: 'wrong_tool', 
                message: `You need a ${this.requiredTool} to mine this rock` 
            };
        }
        
        // Check tool level
        if (tool.level < this.toolLevel) {
            return {
                success: false,
                reason: 'tool_level_low',
                message: `You need a level ${this.toolLevel} ${this.requiredTool} for this rock`
            };
        }
        
        // Calculate damage based on tool efficiency and rock hardness
        const baseDamage = this.calculateMineDamage(tool, playerLevel);
        const actualDamage = Math.max(1, baseDamage);
        
        // Apply damage
        this.currentDurability -= actualDamage;
        this.hitCount++;
        this.lastHitTime = Date.now();
        
        // Check if rock is broken
        if (this.currentDurability <= 0) {
            return this.breakRock();
        } else {
            // Rock damaged but not broken
            console.log(`Hit ${this.name} for ${actualDamage} damage (${this.currentDurability}/${this.maxDurability} remaining)`);
            return {
                success: true,
                broken: false,
                damage: actualDamage,
                durability: this.currentDurability,
                message: `Hit ${this.name} - ${this.currentDurability}/${this.maxDurability} left`
            };
        }
    }
    
    // Calculate mining damage
    calculateMineDamage(tool, playerLevel) {
        let damage = tool.efficiency || 1;
        
        // Player level bonus
        damage += Math.floor(playerLevel / 2);
        
        // Tool level bonus
        damage += tool.level - 1;
        
        // Hardness resistance
        damage = Math.max(1, damage - this.hardness);
        
        // Random variation ±20%
        const variation = (Math.random() - 0.5) * 0.4;
        damage = Math.round(damage * (1 + variation));
        
        return Math.max(1, damage);
    }
    
    // Check if player has required tool
    hasRequiredTool(tool) {
        if (!tool) return false;
        return tool.type === this.requiredTool;
    }
    
    // Break the rock and generate ore drops
    breakRock() {
        this.isBroken = true;
        this.brokeTime = Date.now();
        this.currentDurability = 0;
        
        // Generate ore drops
        const drops = this.generateOreDrops();
        
        console.log(`${this.name} broken! Dropped:`, drops);
        
        return {
            success: true,
            broken: true,
            drops: drops,
            message: `${this.name} broken!`,
            canRegenerate: this.canRegenerate,
            regenerationTime: this.regenerationTime
        };
    }
    
    // Generate ore drops based on drop table
    generateOreDrops() {
        const drops = [];
        
        for (const oreDrop of this.oreDrops) {
            const roll = Math.random();
            if (roll < oreDrop.chance) {
                const amount = Math.floor(Math.random() * (oreDrop.max - oreDrop.min + 1)) + oreDrop.min;
                drops.push({
                    type: oreDrop.type,
                    amount: amount
                });
            }
        }
        
        // Always guarantee at least one drop
        if (drops.length === 0) {
            drops.push({
                type: 'stone',
                amount: 1
            });
        }
        
        return drops;
    }
    
    // Regenerate broken rock
    regenerate() {
        if (!this.canRegenerate) return;
        
        this.isBroken = false;
        this.currentDurability = this.maxDurability;
        this.hitCount = 0;
        this.crackLevel = 0;
        this.damageSprite = null;
        this.brokeTime = 0;
        
        console.log(`${this.name} has regenerated at (${this.tileX}, ${this.tileY})`);
    }
    
    // Check if rock can be mined
    canBeMined() {
        return !this.isBroken;
    }
    
    // Get rock information for UI display
    getRockInfo() {
        return {
            name: this.name,
            rockType: this.rockType,
            durability: this.currentDurability,
            maxDurability: this.maxDurability,
            requiredTool: this.requiredTool,
            toolLevel: this.toolLevel,
            hardness: this.hardness,
            isBroken: this.isBroken,
            canRegenerate: this.canRegenerate,
            hitCount: this.hitCount,
            crackLevel: this.crackLevel,
            timeUntilRegeneration: this.canRegenerate && this.isBroken ? 
                Math.max(0, this.regenerationTime - (Date.now() - this.brokeTime)) : 0
        };
    }
    
    // Render rock entity
    render(renderSystem) {
        if (!renderSystem || this.isBroken) return;
        
        // Render base rock sprite
        renderSystem.drawSprite(
            this.sprite,
            this.x, this.y,
            { layer: this.renderLayer }
        );
        
        // Render damage overlay if cracked
        if (this.damageSprite) {
            renderSystem.drawSprite(
                this.damageSprite,
                this.x, this.y,
                { layer: this.renderLayer + 1, alpha: 0.8 }
            );
        }
        
        // Render durability bar in debug mode
        if (this.gameEngine?.isDebugMode() && this.crackLevel > 0) {
            const barWidth = 24;
            const barHeight = 3;
            const durabilityPercent = this.currentDurability / this.maxDurability;
            
            // Background bar
            renderSystem.drawRect(
                this.x + 4, this.y - 8,
                barWidth, barHeight,
                '#333333',
                { layer: this.renderLayer + 2 }
            );
            
            // Durability bar
            const barColor = durabilityPercent > 0.5 ? '#00ff00' : 
                           durabilityPercent > 0.25 ? '#ffff00' : '#ff0000';
            renderSystem.drawRect(
                this.x + 4, this.y - 8,
                barWidth * durabilityPercent, barHeight,
                barColor,
                { layer: this.renderLayer + 2 }
            );
        }
    }
    
    // Serialize rock data for saving
    serialize() {
        return {
            entityId: this.entityId,
            x: this.x,
            y: this.y,
            rockType: this.rockType,
            currentDurability: this.currentDurability,
            isBroken: this.isBroken,
            brokeTime: this.brokeTime,
            hitCount: this.hitCount
        };
    }
    
    // Deserialize rock data from save
    static deserialize(data, gameEngine) {
        const rock = new Rock(data.x, data.y, data.rockType, gameEngine);
        rock.entityId = data.entityId;
        rock.currentDurability = data.currentDurability;
        rock.isBroken = data.isBroken;
        rock.brokeTime = data.brokeTime;
        rock.hitCount = data.hitCount;
        rock.updateCrackLevel();
        return rock;
    }
    
    // Get random rock type for generation
    static getRandomRockType(area = 'common', rarityBoost = 0) {
        const rocksByArea = {
            'common': ['small_stone', 'limestone'],
            'mining': ['small_stone', 'limestone', 'iron_ore'],
            'deep_mining': ['iron_ore', 'gold_ore', 'crystal_formation'],
            'surface': ['small_stone', 'limestone', 'boulder'],
            'rare': ['gold_ore', 'crystal_formation']
        };
        
        const availableRocks = rocksByArea[area] || rocksByArea['common'];
        
        // Apply rarity distribution
        let rarityRoll = Math.random() + rarityBoost;
        
        if (rarityRoll > 0.9) {
            // Rare rocks (10% + boost)
            const rareRocks = ['gold_ore', 'crystal_formation'];
            const validRareRocks = rareRocks.filter(rock => availableRocks.includes(rock));
            if (validRareRocks.length > 0) {
                return validRareRocks[Math.floor(Math.random() * validRareRocks.length)];
            }
        } else if (rarityRoll > 0.6) {
            // Uncommon rocks (30% + boost)
            const uncommonRocks = ['iron_ore', 'boulder'];
            const validUncommonRocks = uncommonRocks.filter(rock => availableRocks.includes(rock));
            if (validUncommonRocks.length > 0) {
                return validUncommonRocks[Math.floor(Math.random() * validUncommonRocks.length)];
            }
        }
        
        // Common rocks (60% + boost)
        const commonRocks = ['small_stone', 'limestone'];
        const validCommonRocks = commonRocks.filter(rock => availableRocks.includes(rock));
        return validCommonRocks[Math.floor(Math.random() * validCommonRocks.length)] || availableRocks[0];
    }
}