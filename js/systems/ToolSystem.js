// Comprehensive tool system for managing tool durability, efficiency, and upgrades
// Handles tool usage, maintenance, and progression mechanics

export class ToolSystem {
    constructor() {
        this.tools = new Map(); // toolId -> Tool instance
        this.toolTypes = new Map(); // toolType -> ToolType definition
        this.activeTools = new Map(); // playerId -> currentTool
        
        // Tool upgrade materials and requirements
        this.upgradeMaterials = new Map();
        
        this.initializeToolTypes();
        console.log('ToolSystem initialized');
    }
    
    // Initialize tool type definitions
    initializeToolTypes() {
        // Hoe tool types
        this.registerToolType('basic_hoe', {
            name: 'Basic Hoe',
            category: 'hoe',
            durability: 100,
            efficiency: 1.0,
            staminaCost: 10,
            value: 500,
            description: 'A simple tool for tilling soil',
            upgrades: ['copper_hoe']
        });
        
        this.registerToolType('copper_hoe', {
            name: 'Copper Hoe',
            category: 'hoe',
            durability: 150,
            efficiency: 1.25,
            staminaCost: 8,
            value: 1000,
            description: 'An improved hoe made of copper',
            upgrades: ['iron_hoe'],
            materials: { copper: 5, wood: 3 }
        });
        
        this.registerToolType('iron_hoe', {
            name: 'Iron Hoe',
            category: 'hoe',
            durability: 200,
            efficiency: 1.5,
            staminaCost: 6,
            value: 2000,
            description: 'A sturdy iron hoe for efficient tilling',
            upgrades: ['gold_hoe'],
            materials: { iron: 5, wood: 2 }
        });
        
        this.registerToolType('gold_hoe', {
            name: 'Gold Hoe',
            category: 'hoe',
            durability: 300,
            efficiency: 2.0,
            staminaCost: 4,
            value: 5000,
            description: 'The finest hoe money can buy',
            materials: { gold: 5, wood: 1 }
        });
        
        // Watering Can tool types
        this.registerToolType('basic_watering_can', {
            name: 'Basic Watering Can',
            category: 'watering_can',
            durability: 100,
            efficiency: 1.0,
            capacity: 20,
            staminaCost: 5,
            value: 300,
            description: 'A simple watering can',
            upgrades: ['copper_watering_can']
        });
        
        this.registerToolType('copper_watering_can', {
            name: 'Copper Watering Can',
            category: 'watering_can',
            durability: 150,
            efficiency: 1.25,
            capacity: 30,
            staminaCost: 4,
            value: 750,
            description: 'Holds more water and waters more efficiently',
            upgrades: ['iron_watering_can'],
            materials: { copper: 3, iron: 2 }
        });
        
        this.registerToolType('iron_watering_can', {
            name: 'Iron Watering Can',
            category: 'watering_can',
            durability: 200,
            efficiency: 1.5,
            capacity: 40,
            staminaCost: 3,
            value: 1500,
            description: 'Large capacity watering can',
            upgrades: ['gold_watering_can'],
            materials: { iron: 3, copper: 2 }
        });
        
        this.registerToolType('gold_watering_can', {
            name: 'Gold Watering Can',
            category: 'watering_can',
            durability: 300,
            efficiency: 2.0,
            capacity: 60,
            staminaCost: 2,
            value: 3000,
            description: 'The ultimate watering can',
            materials: { gold: 3, iron: 1 }
        });
        
        // Axe tool types
        this.registerToolType('basic_axe', {
            name: 'Basic Axe',
            category: 'axe',
            durability: 100,
            efficiency: 1.0,
            staminaCost: 15,
            value: 750,
            description: 'For chopping wood',
            upgrades: ['copper_axe']
        });
        
        this.registerToolType('copper_axe', {
            name: 'Copper Axe',
            category: 'axe',
            durability: 150,
            efficiency: 1.25,
            staminaCost: 12,
            value: 1500,
            description: 'Cuts through wood faster',
            upgrades: ['iron_axe'],
            materials: { copper: 5, wood: 3 }
        });
        
        // Pickaxe tool types
        this.registerToolType('basic_pickaxe', {
            name: 'Basic Pickaxe',
            category: 'pickaxe',
            durability: 100,
            efficiency: 1.0,
            staminaCost: 20,
            value: 800,
            description: 'For breaking rocks',
            upgrades: ['copper_pickaxe']
        });
        
        this.registerToolType('copper_pickaxe', {
            name: 'Copper Pickaxe',
            category: 'pickaxe',
            durability: 150,
            efficiency: 1.25,
            staminaCost: 16,
            value: 1600,
            description: 'Breaks rocks more efficiently',
            upgrades: ['iron_pickaxe'],
            materials: { copper: 5, wood: 2 }
        });
        
        console.log(`Registered ${this.toolTypes.size} tool types`);
    }
    
    // Register a new tool type
    registerToolType(typeId, properties) {
        this.toolTypes.set(typeId, {
            id: typeId,
            ...properties
        });
    }
    
    // Create a new tool instance
    createTool(typeId, ownerId) {
        const toolType = this.toolTypes.get(typeId);
        if (!toolType) {
            console.warn(`Unknown tool type: ${typeId}`);
            return null;
        }
        
        const toolId = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tool = new Tool(toolId, toolType, ownerId);
        
        this.tools.set(toolId, tool);
        return tool;
    }
    
    // Get tool by ID
    getTool(toolId) {
        return this.tools.get(toolId);
    }
    
    // Use a tool (consume durability and stamina)
    useTool(toolId, user, action = 'default') {
        const tool = this.tools.get(toolId);
        if (!tool) {
            return { success: false, message: 'Tool not found' };
        }
        
        if (tool.durability <= 0) {
            return { success: false, message: 'Tool is broken and needs repair' };
        }
        
        // Check if user has enough stamina
        const staminaCost = this.calculateStaminaCost(tool, action);
        if (user && user.gameEngine?.staminaSystem) {
            const currentStamina = user.gameEngine.staminaSystem.getStamina(user.entityId);
            if (currentStamina < staminaCost) {
                return { success: false, message: 'Not enough stamina' };
            }
            
            // Consume stamina
            user.gameEngine.staminaSystem.consumeStamina(user.entityId, staminaCost);
        }
        
        // Use tool durability
        const durabilityLoss = this.calculateDurabilityLoss(tool, action);
        tool.useTool(durabilityLoss);
        
        // Check if tool broke
        if (tool.durability <= 0) {
            tool.onBreak();
            return { 
                success: true, 
                message: `${tool.name} broke!`,
                toolBroke: true 
            };
        }
        
        return { 
            success: true, 
            efficiency: tool.efficiency,
            staminaCost: staminaCost,
            durabilityUsed: durabilityLoss
        };
    }
    
    // Calculate stamina cost for tool usage
    calculateStaminaCost(tool, action) {
        const baseCost = tool.staminaCost;
        const efficiency = tool.efficiency;
        
        // More efficient tools cost less stamina
        return Math.max(1, Math.round(baseCost / efficiency));
    }
    
    // Calculate durability loss for tool usage
    calculateDurabilityLoss(tool, action) {
        // Base durability loss is 1, but can be modified
        let loss = 1;
        
        // Different actions might cause different wear
        const actionModifiers = {
            'default': 1,
            'heavy': 2,
            'light': 0.5
        };
        
        loss *= actionModifiers[action] || 1;
        
        return loss;
    }
    
    // Repair a tool
    repairTool(toolId, materials, repairAmount) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            return { success: false, message: 'Tool not found' };
        }
        
        // Check if player has required materials (simplified)
        // In a full implementation, this would check against player inventory
        
        const oldDurability = tool.durability;
        tool.repair(repairAmount);
        
        return { 
            success: true, 
            message: `Repaired ${tool.name}`,
            durabilityRestored: tool.durability - oldDurability
        };
    }
    
    // Upgrade a tool
    upgradeTool(toolId, materials, targetType) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            return { success: false, message: 'Tool not found' };
        }
        
        const currentType = tool.toolType;
        const targetToolType = this.toolTypes.get(targetType);
        
        if (!targetToolType) {
            return { success: false, message: 'Target tool type not found' };
        }
        
        // Check if upgrade is possible
        if (!currentType.upgrades || !currentType.upgrades.includes(targetType)) {
            return { success: false, message: 'Cannot upgrade to this tool type' };
        }
        
        // Check materials (simplified - full implementation would check inventory)
        const requiredMaterials = targetToolType.materials || {};
        
        // Perform upgrade
        const oldName = tool.name;
        tool.upgrade(targetToolType);
        
        return { 
            success: true, 
            message: `Upgraded ${oldName} to ${tool.name}`,
            newTool: tool
        };
    }
    
    // Get all tools owned by a player
    getPlayerTools(playerId) {
        const playerTools = [];
        
        for (const tool of this.tools.values()) {
            if (tool.ownerId === playerId) {
                playerTools.push(tool);
            }
        }
        
        return playerTools.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Get tools by category
    getToolsByCategory(category) {
        const tools = [];
        
        for (const tool of this.tools.values()) {
            if (tool.category === category) {
                tools.push(tool);
            }
        }
        
        return tools;
    }
    
    // Get available upgrades for a tool
    getAvailableUpgrades(toolId) {
        const tool = this.tools.get(toolId);
        if (!tool || !tool.toolType.upgrades) {
            return [];
        }
        
        return tool.toolType.upgrades.map(upgradeId => this.toolTypes.get(upgradeId));
    }
    
    // Set active tool for player
    setActiveTool(playerId, toolId) {
        this.activeTools.set(playerId, toolId);
    }
    
    // Get active tool for player
    getActiveTool(playerId) {
        const toolId = this.activeTools.get(playerId);
        return toolId ? this.tools.get(toolId) : null;
    }
    
    // Remove a tool (when it breaks completely or is discarded)
    removeTool(toolId) {
        const tool = this.tools.get(toolId);
        if (tool) {
            // Remove from active tools if it was active
            for (const [playerId, activeToolId] of this.activeTools.entries()) {
                if (activeToolId === toolId) {
                    this.activeTools.delete(playerId);
                }
            }
            
            this.tools.delete(toolId);
            return true;
        }
        
        return false;
    }
    
    // Get tool statistics
    getStats() {
        const stats = {
            totalTools: this.tools.size,
            toolsByCategory: {},
            brokenTools: 0,
            averageDurability: 0
        };
        
        let totalDurability = 0;
        
        for (const tool of this.tools.values()) {
            const category = tool.category;
            if (!stats.toolsByCategory[category]) {
                stats.toolsByCategory[category] = 0;
            }
            stats.toolsByCategory[category]++;
            
            if (tool.durability <= 0) {
                stats.brokenTools++;
            }
            
            totalDurability += tool.durability;
        }
        
        if (this.tools.size > 0) {
            stats.averageDurability = Math.round(totalDurability / this.tools.size);
        }
        
        return stats;
    }
}

// Individual tool class
export class Tool {
    constructor(id, toolType, ownerId) {
        this.id = id;
        this.toolType = toolType;
        this.ownerId = ownerId;
        
        // Copy properties from tool type
        this.name = toolType.name;
        this.category = toolType.category;
        this.maxDurability = toolType.durability;
        this.durability = toolType.durability;
        this.efficiency = toolType.efficiency;
        this.staminaCost = toolType.staminaCost;
        this.value = toolType.value;
        this.description = toolType.description;
        
        // Tool-specific properties
        if (toolType.capacity) {
            this.maxCapacity = toolType.capacity;
            this.currentCapacity = toolType.capacity; // For watering cans
        }
        
        // Status
        this.isBroken = false;
        this.timesUsed = 0;
        this.timesRepaired = 0;
        this.createdAt = Date.now();
        
        console.log(`Created ${this.name} (${this.id})`);
    }
    
    // Use the tool
    useTool(durabilityLoss = 1) {
        if (this.isBroken) return false;
        
        this.durability = Math.max(0, this.durability - durabilityLoss);
        this.timesUsed++;
        
        if (this.durability <= 0 && !this.isBroken) {
            this.onBreak();
        }
        
        return true;
    }
    
    // Repair the tool
    repair(amount = null) {
        const repairAmount = amount || Math.floor(this.maxDurability * 0.5);
        
        this.durability = Math.min(this.maxDurability, this.durability + repairAmount);
        this.timesRepaired++;
        
        if (this.durability > 0) {
            this.isBroken = false;
        }
        
        console.log(`Repaired ${this.name} by ${repairAmount} points`);
        return repairAmount;
    }
    
    // Upgrade the tool to a new type
    upgrade(newToolType) {
        const oldName = this.name;
        
        // Update properties
        this.toolType = newToolType;
        this.name = newToolType.name;
        this.category = newToolType.category;
        this.maxDurability = newToolType.durability;
        this.durability = newToolType.durability; // Full durability on upgrade
        this.efficiency = newToolType.efficiency;
        this.staminaCost = newToolType.staminaCost;
        this.value = newToolType.value;
        this.description = newToolType.description;
        
        // Update capacity if applicable
        if (newToolType.capacity) {
            this.maxCapacity = newToolType.capacity;
            this.currentCapacity = newToolType.capacity;
        }
        
        this.isBroken = false;
        
        console.log(`Upgraded ${oldName} to ${this.name}`);
    }
    
    // Handle tool breaking
    onBreak() {
        this.isBroken = true;
        console.log(`${this.name} broke after ${this.timesUsed} uses!`);
    }
    
    // Get durability percentage
    getDurabilityPercent() {
        return (this.durability / this.maxDurability) * 100;
    }
    
    // Check if tool needs repair
    needsRepair() {
        return this.durability <= this.maxDurability * 0.2; // Below 20%
    }
    
    // Get tool condition
    getCondition() {
        const percent = this.getDurabilityPercent();
        
        if (percent <= 0) return 'Broken';
        if (percent <= 20) return 'Poor';
        if (percent <= 50) return 'Fair';
        if (percent <= 80) return 'Good';
        return 'Excellent';
    }
    
    // Serialize tool data
    serialize() {
        return {
            id: this.id,
            toolTypeId: this.toolType.id,
            ownerId: this.ownerId,
            durability: this.durability,
            currentCapacity: this.currentCapacity,
            timesUsed: this.timesUsed,
            timesRepaired: this.timesRepaired,
            createdAt: this.createdAt,
            isBroken: this.isBroken
        };
    }
    
    // Deserialize tool data
    static deserialize(data, toolType, toolSystem) {
        const tool = new Tool(data.id, toolType, data.ownerId);
        
        tool.durability = data.durability || tool.maxDurability;
        tool.currentCapacity = data.currentCapacity || tool.maxCapacity;
        tool.timesUsed = data.timesUsed || 0;
        tool.timesRepaired = data.timesRepaired || 0;
        tool.createdAt = data.createdAt || Date.now();
        tool.isBroken = data.isBroken || false;
        
        return tool;
    }
}