// Comprehensive inventory system for item storage and management
// Handles item stacking, capacity limits, and categorization

export class InventorySystem {
    constructor() {
        this.items = new Map(); // itemId -> ItemStack
        this.capacity = 30; // Default inventory slots
        this.maxStackSize = 999; // Maximum items per stack
        
        // Item categories for organization
        this.categories = {
            CROPS: 'crops',
            TOOLS: 'tools',
            SEEDS: 'seeds',
            RESOURCES: 'resources',
            FOOD: 'food',
            MATERIALS: 'materials',
            MISC: 'misc'
        };
        
        // Item database with properties
        this.itemDatabase = new Map();
        this.initializeItemDatabase();
        
        console.log('InventorySystem initialized');
    }
    
    // Initialize item database with properties
    initializeItemDatabase() {
        // Crops
        this.registerItem('turnip', {
            name: 'Turnip',
            category: this.categories.CROPS,
            description: 'A fast-growing root vegetable',
            value: 60,
            maxStack: 999,
            quality: ['poor', 'normal', 'good', 'excellent']
        });
        
        this.registerItem('potato', {
            name: 'Potato',
            category: this.categories.CROPS,
            description: 'A versatile underground tuber',
            value: 80,
            maxStack: 999,
            quality: ['poor', 'normal', 'good', 'excellent']
        });
        
        this.registerItem('carrot', {
            name: 'Carrot',
            category: this.categories.CROPS,
            description: 'A nutritious orange root vegetable',
            value: 120,
            maxStack: 999,
            quality: ['poor', 'normal', 'good', 'excellent']
        });
        
        this.registerItem('corn', {
            name: 'Corn',
            category: this.categories.CROPS,
            description: 'Golden kernels of summer',
            value: 150,
            maxStack: 999,
            quality: ['poor', 'normal', 'good', 'excellent']
        });
        
        this.registerItem('tomato', {
            name: 'Tomato',
            category: this.categories.CROPS,
            description: 'Juicy red fruit perfect for cooking',
            value: 100,
            maxStack: 999,
            quality: ['poor', 'normal', 'good', 'excellent']
        });
        
        // Seeds
        this.registerItem('turnip_seeds', {
            name: 'Turnip Seeds',
            category: this.categories.SEEDS,
            description: 'Seeds for growing turnips',
            value: 20,
            maxStack: 999,
            growsInto: 'turnip'
        });
        
        this.registerItem('potato_seeds', {
            name: 'Potato Seeds',
            category: this.categories.SEEDS,
            description: 'Seeds for growing potatoes',
            value: 30,
            maxStack: 999,
            growsInto: 'potato'
        });
        
        this.registerItem('carrot_seeds', {
            name: 'Carrot Seeds',
            category: this.categories.SEEDS,
            description: 'Seeds for growing carrots',
            value: 45,
            maxStack: 999,
            growsInto: 'carrot'
        });
        
        this.registerItem('corn_seeds', {
            name: 'Corn Seeds',
            category: this.categories.SEEDS,
            description: 'Seeds for growing corn',
            value: 60,
            maxStack: 999,
            growsInto: 'corn'
        });
        
        this.registerItem('tomato_seeds', {
            name: 'Tomato Seeds',
            category: this.categories.SEEDS,
            description: 'Seeds for growing tomatoes',
            value: 40,
            maxStack: 999,
            growsInto: 'tomato'
        });
        
        // Tools
        this.registerItem('hoe', {
            name: 'Hoe',
            category: this.categories.TOOLS,
            description: 'Used for tilling soil',
            value: 500,
            maxStack: 1,
            durability: 100,
            efficiency: 1
        });
        
        this.registerItem('watering_can', {
            name: 'Watering Can',
            category: this.categories.TOOLS,
            description: 'Used for watering crops',
            value: 300,
            maxStack: 1,
            durability: 100,
            capacity: 20,
            efficiency: 1
        });
        
        this.registerItem('axe', {
            name: 'Axe',
            category: this.categories.TOOLS,
            description: 'Used for chopping wood',
            value: 750,
            maxStack: 1,
            durability: 100,
            efficiency: 1
        });
        
        this.registerItem('pickaxe', {
            name: 'Pickaxe',
            category: this.categories.TOOLS,
            description: 'Used for mining rocks',
            value: 800,
            maxStack: 1,
            durability: 100,
            efficiency: 1
        });
        
        // Resources
        this.registerItem('wood', {
            name: 'Wood',
            category: this.categories.RESOURCES,
            description: 'Basic building material from trees',
            value: 10,
            maxStack: 999
        });
        
        this.registerItem('stone', {
            name: 'Stone',
            category: this.categories.RESOURCES,
            description: 'Basic building material from rocks',
            value: 15,
            maxStack: 999
        });
        
        console.log(`Loaded ${this.itemDatabase.size} items into database`);
    }
    
    // Register a new item type in the database
    registerItem(itemId, properties) {
        this.itemDatabase.set(itemId, {
            id: itemId,
            ...properties
        });
    }
    
    // Get item properties from database
    getItemProperties(itemId) {
        return this.itemDatabase.get(itemId);
    }
    
    // Add items to inventory
    addItem(itemId, quantity = 1, quality = 'normal', metadata = {}) {
        if (!this.itemDatabase.has(itemId)) {
            console.warn(`Unknown item: ${itemId}`);
            return false;
        }
        
        const itemProperties = this.itemDatabase.get(itemId);
        const maxStack = itemProperties.maxStack || this.maxStackSize;
        
        // Create unique stack key (includes quality for crops)
        const stackKey = this.createStackKey(itemId, quality, metadata);
        
        let remainingQuantity = quantity;
        
        // Try to add to existing stacks first
        if (this.items.has(stackKey)) {
            const existingStack = this.items.get(stackKey);
            const canAdd = Math.min(remainingQuantity, maxStack - existingStack.quantity);
            
            existingStack.quantity += canAdd;
            remainingQuantity -= canAdd;
            
            console.log(`Added ${canAdd}x ${itemProperties.name} to existing stack`);
        }
        
        // Create new stacks if needed and there's space
        while (remainingQuantity > 0 && this.getUsedSlots() < this.capacity) {
            const newQuantity = Math.min(remainingQuantity, maxStack);
            const newStackKey = this.getNextAvailableStackKey(itemId, quality, metadata);
            
            this.items.set(newStackKey, {
                itemId: itemId,
                quantity: newQuantity,
                quality: quality,
                metadata: { ...metadata },
                properties: itemProperties
            });
            
            remainingQuantity -= newQuantity;
            console.log(`Created new stack: ${newQuantity}x ${itemProperties.name}`);
        }
        
        if (remainingQuantity > 0) {
            console.warn(`Could not add all items. ${remainingQuantity} items remain.`);
            return false;
        }
        
        return true;
    }
    
    // Remove items from inventory
    removeItem(itemId, quantity = 1, quality = 'normal') {
        const stackKey = this.createStackKey(itemId, quality);
        
        if (!this.items.has(stackKey)) {
            console.warn(`Item not found in inventory: ${itemId} (${quality})`);
            return false;
        }
        
        const stack = this.items.get(stackKey);
        
        if (stack.quantity < quantity) {
            console.warn(`Not enough items in stack. Have: ${stack.quantity}, Need: ${quantity}`);
            return false;
        }
        
        stack.quantity -= quantity;
        
        // Remove empty stacks
        if (stack.quantity <= 0) {
            this.items.delete(stackKey);
        }
        
        console.log(`Removed ${quantity}x ${stack.properties.name}`);
        return true;
    }
    
    // Check if inventory has specific item
    hasItem(itemId, quantity = 1, quality = 'normal') {
        const stackKey = this.createStackKey(itemId, quality);
        const stack = this.items.get(stackKey);
        
        return stack && stack.quantity >= quantity;
    }
    
    // Get total quantity of an item (all qualities)
    getItemCount(itemId) {
        let total = 0;
        
        for (const [stackKey, stack] of this.items.entries()) {
            if (stack.itemId === itemId) {
                total += stack.quantity;
            }
        }
        
        return total;
    }
    
    // Get items by category
    getItemsByCategory(category) {
        const items = [];
        
        for (const [stackKey, stack] of this.items.entries()) {
            if (stack.properties.category === category) {
                items.push({
                    stackKey,
                    ...stack
                });
            }
        }
        
        return items.sort((a, b) => a.properties.name.localeCompare(b.properties.name));
    }
    
    // Get all items in inventory
    getAllItems() {
        const items = [];
        
        for (const [stackKey, stack] of this.items.entries()) {
            items.push({
                stackKey,
                ...stack
            });
        }
        
        return items.sort((a, b) => {
            // Sort by category first, then by name
            if (a.properties.category !== b.properties.category) {
                return a.properties.category.localeCompare(b.properties.category);
            }
            return a.properties.name.localeCompare(b.properties.name);
        });
    }
    
    // Create unique stack key for items
    createStackKey(itemId, quality = 'normal', metadata = {}) {
        const metadataKey = Object.keys(metadata).length > 0 ? 
            '_' + JSON.stringify(metadata) : '';
        return `${itemId}_${quality}${metadataKey}`;
    }
    
    // Get next available stack key (for when creating new stacks)
    getNextAvailableStackKey(itemId, quality, metadata) {
        let counter = 0;
        let stackKey;
        
        do {
            const suffix = counter > 0 ? `_${counter}` : '';
            stackKey = this.createStackKey(itemId, quality, metadata) + suffix;
            counter++;
        } while (this.items.has(stackKey));
        
        return stackKey;
    }
    
    // Get number of used inventory slots
    getUsedSlots() {
        return this.items.size;
    }
    
    // Get number of available inventory slots
    getAvailableSlots() {
        return this.capacity - this.getUsedSlots();
    }
    
    // Check if inventory is full
    isFull() {
        return this.getUsedSlots() >= this.capacity;
    }
    
    // Calculate total value of inventory
    getTotalValue() {
        let totalValue = 0;
        
        for (const stack of this.items.values()) {
            const baseValue = stack.properties.value || 0;
            const qualityMultiplier = this.getQualityMultiplier(stack.quality);
            totalValue += baseValue * qualityMultiplier * stack.quantity;
        }
        
        return totalValue;
    }
    
    // Get quality multiplier for item value
    getQualityMultiplier(quality) {
        const multipliers = {
            'poor': 0.5,
            'normal': 1.0,
            'good': 1.25,
            'excellent': 1.5
        };
        
        return multipliers[quality] || 1.0;
    }
    
    // Move item from one slot to another
    moveItem(fromStackKey, toSlot, quantity = null) {
        if (!this.items.has(fromStackKey)) {
            return false;
        }
        
        const fromStack = this.items.get(fromStackKey);
        const moveQuantity = quantity || fromStack.quantity;
        
        if (moveQuantity > fromStack.quantity) {
            return false;
        }
        
        // For now, just update internal organization
        // This would be used for UI drag-and-drop functionality
        
        return true;
    }
    
    // Clear all items from inventory
    clear() {
        this.items.clear();
        console.log('Inventory cleared');
    }
    
    // Serialize inventory data for saving
    serialize() {
        const itemsArray = [];
        
        for (const [stackKey, stack] of this.items.entries()) {
            itemsArray.push({
                stackKey,
                itemId: stack.itemId,
                quantity: stack.quantity,
                quality: stack.quality,
                metadata: stack.metadata
            });
        }
        
        return {
            items: itemsArray,
            capacity: this.capacity,
            maxStackSize: this.maxStackSize
        };
    }
    
    // Deserialize inventory data from save
    deserialize(data) {
        this.clear();
        
        if (data.capacity) {
            this.capacity = data.capacity;
        }
        
        if (data.maxStackSize) {
            this.maxStackSize = data.maxStackSize;
        }
        
        if (data.items) {
            for (const itemData of data.items) {
                const properties = this.getItemProperties(itemData.itemId);
                if (properties) {
                    this.items.set(itemData.stackKey, {
                        itemId: itemData.itemId,
                        quantity: itemData.quantity,
                        quality: itemData.quality || 'normal',
                        metadata: itemData.metadata || {},
                        properties: properties
                    });
                }
            }
        }
        
        console.log(`Loaded ${this.items.size} item stacks from save data`);
    }
    
    // Get inventory statistics
    getStats() {
        const stats = {
            totalItems: 0,
            totalValue: 0,
            usedSlots: this.getUsedSlots(),
            availableSlots: this.getAvailableSlots(),
            categories: {}
        };
        
        for (const stack of this.items.values()) {
            stats.totalItems += stack.quantity;
            
            const category = stack.properties.category;
            if (!stats.categories[category]) {
                stats.categories[category] = { count: 0, value: 0 };
            }
            
            stats.categories[category].count += stack.quantity;
            const itemValue = (stack.properties.value || 0) * 
                            this.getQualityMultiplier(stack.quality) * 
                            stack.quantity;
            stats.categories[category].value += itemValue;
            stats.totalValue += itemValue;
        }
        
        return stats;
    }
}