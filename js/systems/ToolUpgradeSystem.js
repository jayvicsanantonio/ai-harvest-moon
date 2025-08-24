// Tool upgrade system managing tool progression, material requirements, and upgrade UI
// Handles tool upgrade mechanics, blacksmith interactions, and upgrade costs

export class ToolUpgradeSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        
        // Upgrade stations (blacksmith shops)
        this.upgradeStations = new Map();
        
        // Upgrade progression tracking
        this.upgradeHistory = new Map(); // toolId -> upgrade history
        
        // Upgrade UI state
        this.showUpgradeUI = false;
        this.selectedTool = null;
        this.selectedStation = null;
        
        // Upgrade costs and materials database
        this.upgradeCosts = new Map();
        
        console.log('ToolUpgradeSystem initialized');
    }
    
    // Initialize tool upgrade system
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.createDefaultUpgradeStations();
        this.initializeUpgradeCosts();
        this.isActive = true;
    }
    
    // Create default upgrade stations
    createDefaultUpgradeStations() {
        const defaultStations = [
            { id: 'village_blacksmith', x: 400, y: 250, name: 'Village Blacksmith', level: 1 },
            { id: 'advanced_forge', x: 600, y: 100, name: 'Advanced Forge', level: 2 }
        ];
        
        defaultStations.forEach(station => {
            this.createUpgradeStation(station.id, station.x, station.y, station.name, station.level);
        });
    }
    
    // Create an upgrade station
    createUpgradeStation(id, x, y, name = 'Blacksmith', level = 1) {
        const upgradeStation = {
            id,
            x,
            y,
            name,
            level,
            isActive: true,
            inUse: false,
            availableUpgrades: this.getUpgradesForLevel(level),
            upgradeCostModifier: 1.0 - (level - 1) * 0.1 // Higher level stations cost less
        };
        
        this.upgradeStations.set(id, upgradeStation);
        console.log(`Created upgrade station: ${name} (Level ${level}) at (${x}, ${y})`);
    }
    
    // Get available upgrades for station level
    getUpgradesForLevel(level) {
        const upgradesByLevel = {
            1: ['copper_hoe', 'copper_watering_can', 'copper_pickaxe'],
            2: ['iron_hoe', 'iron_watering_can', 'iron_pickaxe', 'steel_axe'],
            3: ['gold_hoe', 'gold_watering_can', 'gold_pickaxe', 'mythril_axe']
        };
        
        // Return all upgrades up to and including current level
        let availableUpgrades = [];
        for (let i = 1; i <= level; i++) {
            if (upgradesByLevel[i]) {
                availableUpgrades = [...availableUpgrades, ...upgradesByLevel[i]];
            }
        }
        
        return availableUpgrades;
    }
    
    // Initialize upgrade costs and material requirements
    initializeUpgradeCosts() {
        // Define upgrade paths and costs
        this.upgradeCosts.set('basic_hoe->copper_hoe', {
            materials: { copper_ore: 3, wood: 2 },
            gold: 500,
            time: 3600000 // 1 hour
        });
        
        this.upgradeCosts.set('copper_hoe->iron_hoe', {
            materials: { iron_ore: 4, wood: 1 },
            gold: 1200,
            time: 7200000 // 2 hours
        });
        
        this.upgradeCosts.set('iron_hoe->gold_hoe', {
            materials: { gold_ore: 3, refined_wood: 1 },
            gold: 3000,
            time: 14400000 // 4 hours
        });
        
        this.upgradeCosts.set('basic_watering_can->copper_watering_can', {
            materials: { copper_ore: 2, iron_ore: 1 },
            gold: 400,
            time: 2700000 // 45 minutes
        });
        
        this.upgradeCosts.set('copper_watering_can->iron_watering_can', {
            materials: { iron_ore: 3, copper_ore: 1 },
            gold: 900,
            time: 5400000 // 1.5 hours
        });
        
        this.upgradeCosts.set('iron_watering_can->gold_watering_can', {
            materials: { gold_ore: 2, crystal: 1 },
            gold: 2500,
            time: 10800000 // 3 hours
        });
        
        this.upgradeCosts.set('pickaxe->copper_pickaxe', {
            materials: { copper_ore: 4, stone: 5 },
            gold: 600,
            time: 3600000 // 1 hour
        });
        
        this.upgradeCosts.set('copper_pickaxe->iron_pickaxe', {
            materials: { iron_ore: 5, copper_ore: 2 },
            gold: 1400,
            time: 7200000 // 2 hours
        });
        
        this.upgradeCosts.set('iron_pickaxe->gold_pickaxe', {
            materials: { gold_ore: 4, gems: 2 },
            gold: 3500,
            time: 18000000 // 5 hours
        });
        
        console.log(`Initialized ${this.upgradeCosts.size} upgrade paths`);
    }
    
    // Check if tool can be upgraded
    canUpgradeTool(tool, targetType, inventory, playerGold) {
        const currentType = tool.type || 'basic_hoe'; // Default fallback
        const upgradeKey = `${currentType}->${targetType}`;
        const upgradeCost = this.upgradeCosts.get(upgradeKey);
        
        if (!upgradeCost) {
            return {
                canUpgrade: false,
                reason: 'no_upgrade_path',
                message: `No upgrade path from ${currentType} to ${targetType}`
            };
        }
        
        // Check gold requirement
        if (playerGold < upgradeCost.gold) {
            return {
                canUpgrade: false,
                reason: 'insufficient_gold',
                message: `Need ${upgradeCost.gold} gold (have ${playerGold})`,
                requiredGold: upgradeCost.gold,
                currentGold: playerGold
            };
        }
        
        // Check material requirements
        const missingMaterials = [];
        for (const [material, amount] of Object.entries(upgradeCost.materials)) {
            const available = inventory.getItemCount(material) || 0;
            if (available < amount) {
                missingMaterials.push({
                    material,
                    needed: amount - available,
                    available,
                    required: amount
                });
            }
        }
        
        if (missingMaterials.length > 0) {
            return {
                canUpgrade: false,
                reason: 'missing_materials',
                message: `Missing materials: ${missingMaterials.map(m => `${m.needed}x ${m.material}`).join(', ')}`,
                missingMaterials
            };
        }
        
        return { canUpgrade: true, upgradeCost };
    }
    
    // Start tool upgrade process
    startUpgrade(player, toolId, targetType, stationId) {
        const station = this.upgradeStations.get(stationId);
        if (!station || !station.isActive || station.inUse) {
            return { success: false, message: "Upgrade station not available" };
        }
        
        // Get tool from tool system
        const toolSystem = this.gameEngine.getSystem('tool');
        if (!toolSystem) {
            return { success: false, message: "Tool system not available" };
        }
        
        const tool = toolSystem.tools.get(toolId);
        if (!tool) {
            return { success: false, message: "Tool not found" };
        }
        
        // Get player inventory and gold
        const inventory = toolSystem.getInventory();
        const playerGold = player.gold || 0;
        
        // Check if upgrade is possible
        const canUpgrade = this.canUpgradeTool(tool, targetType, inventory, playerGold);
        if (!canUpgrade.canUpgrade) {
            return { success: false, message: canUpgrade.message };
        }
        
        // Consume materials and gold
        const upgradeCost = canUpgrade.upgradeCost;
        
        // Remove materials from inventory
        for (const [material, amount] of Object.entries(upgradeCost.materials)) {
            if (!inventory.removeItem(material, amount)) {
                // Rollback if any material removal fails
                return { success: false, message: `Failed to consume ${material}` };
            }
        }
        
        // Remove gold
        if (player.gold !== undefined) {
            player.gold -= upgradeCost.gold;
        }
        
        // Mark station as in use
        station.inUse = true;
        
        // Create upgrade task
        const upgradeTask = {
            toolId,
            targetType,
            stationId,
            startTime: Date.now(),
            completionTime: Date.now() + upgradeCost.time,
            originalTool: { ...tool },
            upgradeCost
        };
        
        // For now, complete upgrade immediately (in full game would be time-based)
        this.completeUpgrade(upgradeTask);
        
        return {
            success: true,
            message: `Started upgrading ${tool.name} to ${targetType}`,
            upgradeTime: upgradeCost.time,
            tool: tool
        };
    }
    
    // Complete tool upgrade
    completeUpgrade(upgradeTask) {
        const toolSystem = this.gameEngine.getSystem('tool');
        const tool = toolSystem.tools.get(upgradeTask.toolId);
        const station = this.upgradeStations.get(upgradeTask.stationId);
        
        if (!tool || !station) {
            console.error('Cannot complete upgrade: tool or station not found');
            return;
        }
        
        // Get target tool type definition
        const targetToolType = toolSystem.toolTypes.get(upgradeTask.targetType);
        if (!targetToolType) {
            console.error('Target tool type not found:', upgradeTask.targetType);
            return;
        }
        
        // Upgrade the tool
        tool.upgrade(targetToolType);
        
        // Record upgrade history
        if (!this.upgradeHistory.has(upgradeTask.toolId)) {
            this.upgradeHistory.set(upgradeTask.toolId, []);
        }
        this.upgradeHistory.get(upgradeTask.toolId).push({
            fromType: upgradeTask.originalTool.type,
            toType: upgradeTask.targetType,
            timestamp: upgradeTask.startTime,
            cost: upgradeTask.upgradeCost,
            stationUsed: upgradeTask.stationId
        });
        
        // Free up the station
        station.inUse = false;
        
        console.log(`Completed upgrade: ${upgradeTask.originalTool.name} -> ${tool.name}`);
    }
    
    // Get available upgrades for a tool
    getAvailableUpgrades(tool, stationLevel = 1) {
        const currentType = tool.type || tool.toolType?.id || 'basic_hoe';
        const availableUpgrades = [];
        
        // Check all possible upgrade paths
        for (const [upgradeKey, cost] of this.upgradeCosts.entries()) {
            const [fromType, toType] = upgradeKey.split('->');
            if (fromType === currentType) {
                // Check if station can handle this upgrade
                const station = Array.from(this.upgradeStations.values())
                    .find(s => s.level >= stationLevel && s.availableUpgrades.includes(toType));
                
                if (station) {
                    availableUpgrades.push({
                        targetType: toType,
                        cost: cost,
                        stationRequired: station.level
                    });
                }
            }
        }
        
        return availableUpgrades;
    }
    
    // Get nearest upgrade station
    getNearestUpgradeStation(x, y, maxDistance = 80) {
        let nearestStation = null;
        let nearestDistance = Infinity;
        
        for (const station of this.upgradeStations.values()) {
            if (!station.isActive) continue;
            
            const distance = Math.sqrt((station.x - x) ** 2 + (station.y - y) ** 2);
            if (distance < nearestDistance && distance <= maxDistance) {
                nearestDistance = distance;
                nearestStation = station;
            }
        }
        
        return nearestStation;
    }
    
    // Handle player interaction with upgrade system
    handlePlayerInteraction(player, action, targetData = null) {
        if (action === 'open_upgrade_menu') {
            const station = targetData || this.getNearestUpgradeStation(player.x, player.y);
            if (station) {
                return this.openUpgradeMenu(player, station);
            } else {
                return { success: false, message: "No upgrade station nearby" };
            }
        } else if (action === 'upgrade_tool') {
            return this.startUpgrade(
                player, 
                targetData.toolId, 
                targetData.targetType, 
                targetData.stationId
            );
        }
        
        return { success: false, message: "Unknown upgrade action" };
    }
    
    // Open upgrade menu for a station
    openUpgradeMenu(player, station) {
        const toolSystem = this.gameEngine.getSystem('tool');
        if (!toolSystem) {
            return { success: false, message: "Tool system not available" };
        }
        
        const playerTools = toolSystem.getPlayerTools(player.id || 'player');
        const upgradableTools = [];
        
        for (const tool of playerTools) {
            const availableUpgrades = this.getAvailableUpgrades(tool, station.level);
            if (availableUpgrades.length > 0) {
                upgradableTools.push({
                    tool,
                    availableUpgrades
                });
            }
        }
        
        return {
            success: true,
            message: `Opened upgrade menu at ${station.name}`,
            station,
            upgradableTools,
            playerGold: player.gold || 0
        };
    }
    
    // Render upgrade stations and UI
    render(renderSystem) {
        if (!renderSystem) return;
        
        // Render upgrade stations
        for (const station of this.upgradeStations.values()) {
            this.renderUpgradeStation(renderSystem, station);
        }
        
        // Render upgrade UI if active
        if (this.showUpgradeUI) {
            this.renderUpgradeUI(renderSystem);
        }
    }
    
    // Render individual upgrade station
    renderUpgradeStation(renderSystem, station) {
        // Render station building (placeholder)
        const color = station.inUse ? '#ff4444' : '#8B4513';
        renderSystem.drawRect(
            station.x - 20, station.y - 20,
            40, 40,
            color,
            { layer: 5 }
        );
        
        // Station level indicator
        renderSystem.drawText(
            `L${station.level}`,
            station.x - 15, station.y - 30,
            {
                font: '12px Arial',
                color: '#ffffff',
                layer: 6
            }
        );
        
        // Show interaction prompt if player is nearby
        const currentScene = this.gameEngine.getSystem('scene')?.currentScene;
        if (currentScene && currentScene.player) {
            const distance = Math.sqrt((station.x - currentScene.player.x) ** 2 + (station.y - currentScene.player.y) ** 2);
            if (distance < 80 && !station.inUse) {
                renderSystem.drawText(
                    `Press U to upgrade at ${station.name}`,
                    station.x, station.y - 45,
                    {
                        font: '12px Arial',
                        color: '#ffffff',
                        align: 'center',
                        layer: 10
                    }
                );
            }
        }
        
        // Show working indicator
        if (station.inUse) {
            renderSystem.drawText(
                'Upgrading...',
                station.x, station.y + 25,
                {
                    font: '10px Arial',
                    color: '#ffff00',
                    align: 'center',
                    layer: 6
                }
            );
        }
    }
    
    // Render upgrade UI (placeholder)
    renderUpgradeUI(renderSystem) {
        const canvas = renderSystem.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // UI background
        renderSystem.drawRect(
            centerX - 250, centerY - 150,
            500, 300,
            '#000000',
            { alpha: 0.9, layer: 15 }
        );
        
        // Title
        renderSystem.drawText(
            'Tool Upgrade Menu',
            centerX, centerY - 120,
            {
                font: '20px Arial',
                color: '#ffffff',
                align: 'center',
                layer: 16
            }
        );
        
        // Placeholder for tool list and upgrade options
        renderSystem.drawText(
            'Select a tool to upgrade...',
            centerX, centerY - 80,
            {
                font: '14px Arial',
                color: '#cccccc',
                align: 'center',
                layer: 16
            }
        );
    }
    
    // Get upgrade statistics
    getStats() {
        return {
            totalUpgradeStations: this.upgradeStations.size,
            upgradePathsAvailable: this.upgradeCosts.size,
            toolsUpgraded: Array.from(this.upgradeHistory.values()).reduce((sum, history) => sum + history.length, 0)
        };
    }
    
    // Serialize tool upgrade system data for saving
    serialize() {
        const stations = {};
        for (const [id, station] of this.upgradeStations.entries()) {
            stations[id] = { ...station };
        }
        
        const history = {};
        for (const [toolId, upgrades] of this.upgradeHistory.entries()) {
            history[toolId] = upgrades;
        }
        
        return {
            upgradeStations: stations,
            upgradeHistory: history
        };
    }
    
    // Deserialize tool upgrade system data from save
    deserialize(data, gameEngine) {
        if (data.upgradeStations) {
            this.upgradeStations.clear();
            for (const [id, stationData] of Object.entries(data.upgradeStations)) {
                this.upgradeStations.set(id, stationData);
            }
        }
        
        if (data.upgradeHistory) {
            this.upgradeHistory.clear();
            for (const [toolId, history] of Object.entries(data.upgradeHistory)) {
                this.upgradeHistory.set(toolId, history);
            }
        }
    }
}