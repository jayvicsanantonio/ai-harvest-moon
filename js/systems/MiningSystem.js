// Mining system managing rock entities, mining mechanics, and ore collection
// Handles rock placement, mining progression, and resource generation

import { Rock } from '../entities/Rock.js';

export class MiningSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        
        // Rock management
        this.rocks = new Map();
        this.miningAreas = new Map();
        
        // Player progress
        this.miningSkill = 1;
        this.rocksMinedTotal = 0;
        this.oreCollectedTotal = 0;
        
        // Mining mechanics
        this.baseStaminaCost = 15;
        this.staminaCostReduction = 0.8; // Per skill level
        
        // Ore generation and spawning
        this.lastRockSpawn = 0;
        this.rockSpawnInterval = 600000; // 10 minutes
        this.maxRocksPerArea = 5;
        
        console.log('MiningSystem initialized');
    }
    
    // Initialize mining system
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.createDefaultMiningAreas();
        this.spawnInitialRocks();
        this.isActive = true;
    }
    
    // Create default mining areas
    createDefaultMiningAreas() {
        const defaultAreas = [
            { id: 'farm_rocks', x: 50, y: 50, width: 150, height: 150, type: 'common', name: 'Farm Rocks' },
            { id: 'quarry', x: 500, y: 300, width: 200, height: 200, type: 'mining', name: 'Stone Quarry' },
            { id: 'deep_cave', x: 800, y: 500, width: 150, height: 150, type: 'deep_mining', name: 'Deep Cave' }
        ];
        
        defaultAreas.forEach(area => {
            this.createMiningArea(area.id, area.x, area.y, area.width, area.height, area.type, area.name);
        });
    }
    
    // Create a mining area
    createMiningArea(id, x, y, width, height, type = 'common', name = 'Mining Area') {
        const miningArea = {
            id,
            x,
            y,
            width,
            height,
            type,
            name,
            rocks: [],
            maxRocks: this.maxRocksPerArea,
            lastSpawn: 0,
            spawnRate: this.rockSpawnInterval,
            rarityBoost: this.getRarityBoost(type)
        };
        
        this.miningAreas.set(id, miningArea);
        console.log(`Created mining area: ${name} at (${x}, ${y})`);
    }
    
    // Get rarity boost based on area type
    getRarityBoost(areaType) {
        const rarityBoosts = {
            'common': 0,
            'mining': 0.1,
            'deep_mining': 0.2,
            'rare': 0.3
        };
        
        return rarityBoosts[areaType] || 0;
    }
    
    // Spawn initial rocks in all areas
    spawnInitialRocks() {
        for (const area of this.miningAreas.values()) {
            this.spawnRocksInArea(area, Math.floor(area.maxRocks * 0.7));
        }
    }
    
    // Spawn rocks in a specific area
    spawnRocksInArea(area, count = 1) {
        for (let i = 0; i < count; i++) {
            if (area.rocks.length >= area.maxRocks) break;
            
            // Find random position in area
            const x = area.x + Math.random() * area.width;
            const y = area.y + Math.random() * area.height;
            
            // Generate rock type based on area
            const rockType = Rock.getRandomRockType(area.type, area.rarityBoost);
            
            // Create rock
            const rock = new Rock(x, y, rockType, this.gameEngine);
            this.rocks.set(rock.entityId, rock);
            area.rocks.push(rock);
            
            // Add to current scene if it exists
            const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
            if (currentScene && currentScene.entities) {
                currentScene.entities.push(rock);
            }
        }
        
        console.log(`Spawned ${count} rocks in ${area.name}`);
    }
    
    // Update mining system
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update all rocks
        for (const rock of this.rocks.values()) {
            rock.update(deltaTime);
        }
        
        // Handle rock respawning
        this.updateRockSpawning(deltaTime);
        
        // Clean up broken non-regenerating rocks
        this.cleanupBrokenRocks();
    }
    
    // Update rock spawning in areas
    updateRockSpawning(deltaTime) {
        const currentTime = Date.now();
        
        for (const area of this.miningAreas.values()) {
            const timeSinceLastSpawn = currentTime - area.lastSpawn;
            
            if (timeSinceLastSpawn >= area.spawnRate && area.rocks.length < area.maxRocks) {
                const rocksToSpawn = Math.min(2, area.maxRocks - area.rocks.length);
                this.spawnRocksInArea(area, rocksToSpawn);
                area.lastSpawn = currentTime;
            }
        }
    }
    
    // Clean up broken rocks that don't regenerate
    cleanupBrokenRocks() {
        const rocksToRemove = [];
        
        for (const [entityId, rock] of this.rocks.entries()) {
            if (rock.isBroken && !rock.canRegenerate) {
                // Remove after 5 minutes
                if (Date.now() - rock.brokeTime > 300000) {
                    rocksToRemove.push(entityId);
                }
            }
        }
        
        // Remove rocks from system and areas
        for (const entityId of rocksToRemove) {
            const rock = this.rocks.get(entityId);
            if (rock) {
                // Remove from mining areas
                for (const area of this.miningAreas.values()) {
                    const index = area.rocks.findIndex(r => r.entityId === entityId);
                    if (index !== -1) {
                        area.rocks.splice(index, 1);
                        break;
                    }
                }
                
                // Remove from current scene
                const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
                if (currentScene && currentScene.entities) {
                    const entityIndex = currentScene.entities.findIndex(e => e.entityId === entityId);
                    if (entityIndex !== -1) {
                        currentScene.entities.splice(entityIndex, 1);
                    }
                }
                
                this.rocks.delete(entityId);
            }
        }
        
        if (rocksToRemove.length > 0) {
            console.log(`Cleaned up ${rocksToRemove.length} broken rocks`);
        }
    }
    
    // Attempt to mine a rock
    attemptMine(player, rock) {
        if (!rock || !rock.canBeMined()) {
            return { success: false, message: "Cannot mine this rock" };
        }
        
        // Get player's current tool
        const currentTool = this.getCurrentTool(player);
        if (!currentTool) {
            return { success: false, message: "You need a pickaxe to mine rocks" };
        }
        
        // Check stamina cost
        const staminaCost = this.calculateStaminaCost();
        if (player.stamina < staminaCost) {
            return { success: false, message: "Not enough stamina to mine" };
        }
        
        // Attempt to mine the rock
        const mineResult = rock.attemptMine(currentTool, this.miningSkill);
        
        if (mineResult.success) {
            // Consume stamina
            this.gameEngine.staminaSystem?.consumeStamina(staminaCost);
            
            if (mineResult.broken) {
                // Rock broken - give rewards
                this.handleRockBroken(player, rock, mineResult);
                return {
                    success: true,
                    message: mineResult.message,
                    broken: true,
                    drops: mineResult.drops
                };
            } else {
                // Rock damaged but not broken
                return {
                    success: true,
                    message: mineResult.message,
                    broken: false,
                    damage: mineResult.damage
                };
            }
        } else {
            return { success: false, message: mineResult.message };
        }
    }
    
    // Handle rock being broken
    handleRockBroken(player, rock, mineResult) {
        // Add drops to inventory
        if (mineResult.drops && mineResult.drops.length > 0) {
            const inventory = this.gameEngine.getSystem('tool')?.getInventory();
            
            for (const drop of mineResult.drops) {
                const item = {
                    type: 'resource',
                    subType: drop.type,
                    name: this.getResourceName(drop.type),
                    value: this.getResourceValue(drop.type)
                };
                
                inventory?.addItem(item, drop.amount);
            }
            
            // Update statistics
            this.rocksMinedTotal++;
            this.oreCollectedTotal += mineResult.drops.reduce((sum, drop) => sum + drop.amount, 0);
            
            // Improve mining skill
            this.improveMiningSkill(rock.hardness, rock.rockType);
        }
        
        console.log(`${rock.name} broken by player! Drops:`, mineResult.drops);
    }
    
    // Improve mining skill based on rock difficulty
    improveMiningSkill(rockHardness, rockType) {
        let skillGain = 0.05 + (rockHardness * 0.02);
        
        // Rare rock bonus
        const rareRocks = ['gold_ore', 'crystal_formation'];
        if (rareRocks.includes(rockType)) {
            skillGain *= 1.5;
        }
        
        // Apply diminishing returns
        const skillCap = 10.0;
        const diminishingFactor = Math.max(0.1, 1.0 - (this.miningSkill / skillCap) * 0.8);
        
        const oldSkill = this.miningSkill;
        this.miningSkill += skillGain * diminishingFactor;
        this.miningSkill = Math.min(skillCap, this.miningSkill);
        
        // Check for skill level up
        const newSkillLevel = Math.floor(this.miningSkill);
        const oldSkillLevel = Math.floor(oldSkill);
        
        if (newSkillLevel > oldSkillLevel) {
            console.log(`⛏️ Mining skill increased to level ${newSkillLevel}!`);
            this.handleSkillMilestone(newSkillLevel);
        }
    }
    
    // Handle mining skill milestones
    handleSkillMilestone(level) {
        const milestones = {
            2: { name: 'Novice Miner', reward: 'Reduced stamina cost for mining' },
            3: { name: 'Rock Breaker', reward: 'Increased mining damage' },
            5: { name: 'Ore Seeker', reward: 'Better ore drop chances' },
            7: { name: 'Master Miner', reward: 'Can mine rare rocks more efficiently' },
            10: { name: 'Legendary Prospector', reward: 'Rare rocks spawn more frequently' }
        };
        
        const milestone = milestones[level];
        if (milestone) {
            console.log(`⛏️ Achievement Unlocked: ${milestone.name} - ${milestone.reward}`);
            this.applySkillBonus(level);
        }
    }
    
    // Apply skill-based bonuses
    applySkillBonus(level) {
        if (level >= 2) {
            // Reduce stamina cost
            this.staminaCostReduction = Math.max(0.5, this.staminaCostReduction - 0.05);
        }
        
        if (level >= 5) {
            // Increase rarity boost for all areas
            for (const area of this.miningAreas.values()) {
                area.rarityBoost = Math.min(0.5, area.rarityBoost + 0.05);
            }
        }
        
        if (level >= 10) {
            // Increase rock spawn rate
            this.rockSpawnInterval = Math.max(300000, this.rockSpawnInterval * 0.8);
        }
    }
    
    // Get current mining tool from player
    getCurrentTool(player) {
        const toolSystem = this.gameEngine.getSystem('tool');
        if (!toolSystem) return null;
        
        // Check if player has pickaxe equipped or in inventory
        const pickaxe = toolSystem.getEquippedTool('pickaxe') || toolSystem.getTool('pickaxe');
        
        return pickaxe ? {
            type: 'pickaxe',
            level: pickaxe.level || 1,
            efficiency: pickaxe.efficiency || 1
        } : null;
    }
    
    // Calculate stamina cost for mining
    calculateStaminaCost() {
        const skillReduction = Math.floor(this.miningSkill - 1) * this.staminaCostReduction;
        return Math.max(5, this.baseStaminaCost - skillReduction);
    }
    
    // Get resource display name
    getResourceName(resourceType) {
        const names = {
            'stone': 'Stone',
            'coal': 'Coal',
            'iron_ore': 'Iron Ore',
            'gold_ore': 'Gold Ore',
            'limestone': 'Limestone',
            'crystal': 'Crystal',
            'gems': 'Precious Gems',
            'rare_crystal': 'Rare Crystal'
        };
        
        return names[resourceType] || resourceType;
    }
    
    // Get resource base value
    getResourceValue(resourceType) {
        const values = {
            'stone': 2,
            'coal': 5,
            'iron_ore': 15,
            'gold_ore': 50,
            'limestone': 8,
            'crystal': 100,
            'gems': 200,
            'rare_crystal': 500
        };
        
        return values[resourceType] || 1;
    }
    
    // Get nearest rock to position
    getNearestRock(x, y, maxDistance = 50) {
        let nearestRock = null;
        let nearestDistance = Infinity;
        
        for (const rock of this.rocks.values()) {
            if (!rock.canBeMined()) continue;
            
            const distance = Math.sqrt((rock.x - x) ** 2 + (rock.y - y) ** 2);
            if (distance < nearestDistance && distance <= maxDistance) {
                nearestDistance = distance;
                nearestRock = rock;
            }
        }
        
        return nearestRock;
    }
    
    // Handle player interaction with mining
    handlePlayerInteraction(player, action, targetRock = null) {
        if (action === 'mine') {
            const rock = targetRock || this.getNearestRock(player.x, player.y);
            if (rock) {
                return this.attemptMine(player, rock);
            } else {
                return { success: false, message: "No rocks nearby to mine" };
            }
        }
        
        return { success: false, message: "Unknown mining action" };
    }
    
    // Render mining system debug info
    renderDebug(renderSystem) {
        if (!renderSystem || !this.gameEngine?.isDebugMode()) return;
        
        // Render mining area boundaries
        for (const area of this.miningAreas.values()) {
            renderSystem.drawRect(
                area.x, area.y,
                area.width, area.height,
                '#ffff00',
                { alpha: 0.2, layer: 1000 }
            );
            
            // Area name
            renderSystem.drawText(
                `${area.name} (${area.rocks.length}/${area.maxRocks})`,
                area.x + 5, area.y - 5,
                { 
                    font: '12px Arial',
                    color: '#ffff00',
                    layer: 1001
                }
            );
        }
        
        // Render mining stats
        let yOffset = 200;
        const statColor = '#ffff00';
        
        renderSystem.drawText(
            `Mining Skill: ${this.miningSkill.toFixed(1)}`,
            10, yOffset, { color: statColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Rocks Mined: ${this.rocksMinedTotal}`,
            10, yOffset, { color: statColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Ore Collected: ${this.oreCollectedTotal}`,
            10, yOffset, { color: statColor, layer: 1000 }
        );
        yOffset += 20;
        
        renderSystem.drawText(
            `Active Rocks: ${this.rocks.size}`,
            10, yOffset, { color: statColor, layer: 1000 }
        );
    }
    
    // Get mining statistics
    getStats() {
        return {
            miningSkill: this.miningSkill,
            rocksMinedTotal: this.rocksMinedTotal,
            oreCollectedTotal: this.oreCollectedTotal,
            activeRocks: this.rocks.size,
            miningAreas: this.miningAreas.size
        };
    }
    
    // Serialize mining system data for saving
    serialize() {
        const rocks = {};
        for (const [id, rock] of this.rocks.entries()) {
            rocks[id] = rock.serialize();
        }
        
        const areas = {};
        for (const [id, area] of this.miningAreas.entries()) {
            areas[id] = {
                ...area,
                rocks: area.rocks.map(rock => rock.entityId)
            };
        }
        
        return {
            miningSkill: this.miningSkill,
            rocksMinedTotal: this.rocksMinedTotal,
            oreCollectedTotal: this.oreCollectedTotal,
            rocks: rocks,
            miningAreas: areas
        };
    }
    
    // Deserialize mining system data from save
    deserialize(data, gameEngine) {
        this.miningSkill = data.miningSkill || 1;
        this.rocksMinedTotal = data.rocksMinedTotal || 0;
        this.oreCollectedTotal = data.oreCollectedTotal || 0;
        
        // Restore rocks
        if (data.rocks) {
            this.rocks.clear();
            for (const [id, rockData] of Object.entries(data.rocks)) {
                const rock = Rock.deserialize(rockData, gameEngine);
                this.rocks.set(id, rock);
            }
        }
        
        // Restore mining areas
        if (data.miningAreas) {
            for (const [id, areaData] of Object.entries(data.miningAreas)) {
                if (this.miningAreas.has(id)) {
                    const area = this.miningAreas.get(id);
                    area.rocks = [];
                    
                    // Reconnect rocks to areas
                    if (areaData.rocks) {
                        for (const rockId of areaData.rocks) {
                            const rock = this.rocks.get(rockId);
                            if (rock) {
                                area.rocks.push(rock);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Clean up mining system
    cleanup() {
        this.rocks.clear();
        for (const area of this.miningAreas.values()) {
            area.rocks = [];
        }
    }
}