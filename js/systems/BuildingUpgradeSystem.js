// Building upgrade system managing farm structure improvements and capacity expansion
// Handles building upgrades, construction costs, and capacity management

export class BuildingUpgradeSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        
        // Building management
        this.buildings = new Map();
        this.buildingTypes = new Map();
        
        // Upgrade tracking
        this.upgradeHistory = new Map();
        
        // Construction worker/contractor management
        this.constructionStations = new Map();
        
        // Active construction projects
        this.activeConstructions = new Map();
        
        console.log('BuildingUpgradeSystem initialized');
    }
    
    // Initialize building upgrade system
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.initializeBuildingTypes();
        this.createDefaultBuildings();
        this.createConstructionStations();
        this.isActive = true;
    }
    
    // Initialize building type definitions
    initializeBuildingTypes() {
        // Coop upgrades
        this.buildingTypes.set('basic_coop', {
            name: 'Basic Coop',
            category: 'animal_housing',
            capacity: 4,
            size: { width: 64, height: 64 },
            upgrades: ['standard_coop'],
            maintenanceCost: 50,
            description: 'A small coop for chickens'
        });
        
        this.buildingTypes.set('standard_coop', {
            name: 'Standard Coop',
            category: 'animal_housing',
            capacity: 8,
            size: { width: 96, height: 64 },
            upgrades: ['deluxe_coop'],
            maintenanceCost: 100,
            description: 'Larger coop with more space',
            upgradeCost: {
                gold: 4000,
                materials: { wood: 200, stone: 100, nails: 50 },
                constructionTime: 172800000 // 48 hours
            }
        });
        
        this.buildingTypes.set('deluxe_coop', {
            name: 'Deluxe Coop',
            category: 'animal_housing',
            capacity: 12,
            size: { width: 128, height: 96 },
            maintenanceCost: 150,
            description: 'Luxurious coop with automatic feeders',
            features: ['auto_feeder', 'incubator'],
            upgradeCost: {
                gold: 8000,
                materials: { hardwood: 150, stone: 200, iron_bar: 25 },
                constructionTime: 259200000 // 72 hours
            }
        });
        
        // Barn upgrades
        this.buildingTypes.set('basic_barn', {
            name: 'Basic Barn',
            category: 'animal_housing',
            capacity: 4,
            size: { width: 96, height: 96 },
            upgrades: ['standard_barn'],
            maintenanceCost: 75,
            description: 'A simple barn for cows and goats'
        });
        
        this.buildingTypes.set('standard_barn', {
            name: 'Standard Barn',
            category: 'animal_housing',
            capacity: 8,
            size: { width: 128, height: 96 },
            upgrades: ['deluxe_barn'],
            maintenanceCost: 125,
            description: 'Spacious barn for larger herds',
            upgradeCost: {
                gold: 6000,
                materials: { wood: 350, stone: 150, nails: 75 },
                constructionTime: 216000000 // 60 hours
            }
        });
        
        this.buildingTypes.set('deluxe_barn', {
            name: 'Deluxe Barn',
            category: 'animal_housing',
            capacity: 12,
            size: { width: 160, height: 128 },
            maintenanceCost: 200,
            description: 'Premium barn with automated systems',
            features: ['auto_milker', 'hay_hopper', 'climate_control'],
            upgradeCost: {
                gold: 12000,
                materials: { hardwood: 250, stone: 300, iron_bar: 50, steel_bar: 10 },
                constructionTime: 345600000 // 96 hours
            }
        });
        
        // Silo upgrades
        this.buildingTypes.set('basic_silo', {
            name: 'Basic Silo',
            category: 'storage',
            capacity: 100, // hay storage
            size: { width: 48, height: 96 },
            upgrades: ['large_silo'],
            maintenanceCost: 25,
            description: 'Stores hay for animal feed'
        });
        
        this.buildingTypes.set('large_silo', {
            name: 'Large Silo',
            category: 'storage',
            capacity: 240,
            size: { width: 64, height: 128 },
            maintenanceCost: 40,
            description: 'Expanded silo with greater capacity',
            upgradeCost: {
                gold: 2500,
                materials: { wood: 100, stone: 200, clay: 50 },
                constructionTime: 86400000 // 24 hours
            }
        });
        
        console.log(`Initialized ${this.buildingTypes.size} building types`);
    }
    
    // Create default buildings on the farm
    createDefaultBuildings() {
        const defaultBuildings = [
            { id: 'farm_coop_1', x: 200, y: 200, type: 'basic_coop' },
            { id: 'farm_barn_1', x: 350, y: 200, type: 'basic_barn' },
            { id: 'farm_silo_1', x: 500, y: 150, type: 'basic_silo' }
        ];
        
        defaultBuildings.forEach(buildingData => {
            this.createBuilding(buildingData.id, buildingData.x, buildingData.y, buildingData.type);
        });
    }
    
    // Create a building
    createBuilding(id, x, y, typeId, level = 1) {
        const buildingType = this.buildingTypes.get(typeId);
        if (!buildingType) {
            console.error(`Building type ${typeId} not found`);
            return null;
        }
        
        const building = {
            id,
            x,
            y,
            type: typeId,
            level,
            buildingType,
            capacity: buildingType.capacity,
            currentOccupancy: 0,
            condition: 100, // Building condition/durability
            lastMaintenance: Date.now(),
            features: buildingType.features || [],
            isUpgrading: false,
            upgradeStartTime: 0,
            upgradeTargetType: null
        };
        
        this.buildings.set(id, building);
        console.log(`Created building: ${buildingType.name} at (${x}, ${y})`);
        return building;
    }
    
    // Create construction stations (carpenters)
    createConstructionStations() {
        const defaultStations = [
            { id: 'village_carpenter', x: 300, y: 100, name: 'Village Carpenter', level: 1 },
            { id: 'master_builder', x: 700, y: 50, name: 'Master Builder', level: 2 }
        ];
        
        defaultStations.forEach(station => {
            this.createConstructionStation(station.id, station.x, station.y, station.name, station.level);
        });
    }
    
    // Create a construction station
    createConstructionStation(id, x, y, name = 'Carpenter', level = 1) {
        const constructionStation = {
            id,
            x,
            y,
            name,
            level,
            isActive: true,
            inUse: false,
            availableUpgrades: this.getUpgradesForConstructionLevel(level),
            costModifier: 1.0 - (level - 1) * 0.05 // Higher level reduces cost
        };
        
        this.constructionStations.set(id, constructionStation);
        console.log(`Created construction station: ${name} (Level ${level}) at (${x}, ${y})`);
    }
    
    // Get available upgrades for construction station level
    getUpgradesForConstructionLevel(level) {
        const upgradesByLevel = {
            1: ['standard_coop', 'standard_barn', 'large_silo'],
            2: ['deluxe_coop', 'deluxe_barn']
        };
        
        let availableUpgrades = [];
        for (let i = 1; i <= level; i++) {
            if (upgradesByLevel[i]) {
                availableUpgrades = [...availableUpgrades, ...upgradesByLevel[i]];
            }
        }
        
        return availableUpgrades;
    }
    
    // Check if building can be upgraded
    canUpgradeBuilding(building, targetType, inventory, playerGold) {
        if (building.isUpgrading) {
            return {
                canUpgrade: false,
                reason: 'already_upgrading',
                message: 'Building is already being upgraded'
            };
        }
        
        const currentType = this.buildingTypes.get(building.type);
        const targetBuildingType = this.buildingTypes.get(targetType);
        
        if (!targetBuildingType) {
            return {
                canUpgrade: false,
                reason: 'invalid_target',
                message: 'Target building type not found'
            };
        }
        
        // Check if upgrade path exists
        if (!currentType.upgrades || !currentType.upgrades.includes(targetType)) {
            return {
                canUpgrade: false,
                reason: 'no_upgrade_path',
                message: `Cannot upgrade ${currentType.name} to ${targetBuildingType.name}`
            };
        }
        
        const upgradeCost = targetBuildingType.upgradeCost;
        if (!upgradeCost) {
            return {
                canUpgrade: false,
                reason: 'no_upgrade_cost',
                message: 'Upgrade cost not defined'
            };
        }
        
        // Check gold requirement
        if (playerGold < upgradeCost.gold) {
            return {
                canUpgrade: false,
                reason: 'insufficient_gold',
                message: `Need ${upgradeCost.gold} gold (have ${playerGold})`,
                requiredGold: upgradeCost.gold
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
    
    // Start building upgrade
    startBuildingUpgrade(player, buildingId, targetType, stationId) {
        const building = this.buildings.get(buildingId);
        if (!building) {
            return { success: false, message: "Building not found" };
        }
        
        const station = this.constructionStations.get(stationId);
        if (!station || !station.isActive || station.inUse) {
            return { success: false, message: "Construction station not available" };
        }
        
        // Get player inventory
        const inventory = this.gameEngine.getSystem('tool')?.getInventory();
        if (!inventory) {
            return { success: false, message: "Inventory system not available" };
        }
        
        // Check if upgrade is possible
        const canUpgrade = this.canUpgradeBuilding(building, targetType, inventory, player.gold || 0);
        if (!canUpgrade.canUpgrade) {
            return { success: false, message: canUpgrade.message };
        }
        
        const upgradeCost = canUpgrade.upgradeCost;
        
        // Consume materials and gold
        for (const [material, amount] of Object.entries(upgradeCost.materials)) {
            if (!inventory.removeItem(material, amount)) {
                return { success: false, message: `Failed to consume ${material}` };
            }
        }
        
        if (player.gold !== undefined) {
            player.gold -= upgradeCost.gold;
        }
        
        // Start upgrade process
        building.isUpgrading = true;
        building.upgradeStartTime = Date.now();
        building.upgradeTargetType = targetType;
        station.inUse = true;
        
        // Create construction project
        const constructionProject = {
            buildingId,
            targetType,
            stationId,
            startTime: Date.now(),
            completionTime: Date.now() + upgradeCost.constructionTime,
            originalBuilding: { ...building },
            cost: upgradeCost
        };
        
        this.activeConstructions.set(buildingId, constructionProject);
        
        console.log(`Started upgrading ${building.buildingType.name} to ${targetType} (${upgradeCost.constructionTime}ms)`);
        
        return {
            success: true,
            message: `Started upgrading ${building.buildingType.name}`,
            constructionTime: upgradeCost.constructionTime,
            building
        };
    }
    
    // Update building upgrade system
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Check for completed construction projects
        this.updateConstructionProjects();
        
        // Update building conditions
        this.updateBuildingConditions(deltaTime);
    }
    
    // Update active construction projects
    updateConstructionProjects() {
        const currentTime = Date.now();
        const completedProjects = [];
        
        for (const [buildingId, project] of this.activeConstructions.entries()) {
            if (currentTime >= project.completionTime) {
                completedProjects.push(buildingId);
            }
        }
        
        // Complete finished projects
        for (const buildingId of completedProjects) {
            this.completeUpgrade(buildingId);
        }
    }
    
    // Complete building upgrade
    completeUpgrade(buildingId) {
        const project = this.activeConstructions.get(buildingId);
        const building = this.buildings.get(buildingId);
        const station = this.constructionStations.get(project.stationId);
        
        if (!project || !building || !station) {
            console.error('Cannot complete upgrade: missing project, building, or station');
            return;
        }
        
        // Get target building type
        const targetBuildingType = this.buildingTypes.get(project.targetType);
        if (!targetBuildingType) {
            console.error('Target building type not found:', project.targetType);
            return;
        }
        
        // Upgrade the building
        const oldName = building.buildingType.name;
        building.type = project.targetType;
        building.buildingType = targetBuildingType;
        building.capacity = targetBuildingType.capacity;
        building.features = targetBuildingType.features || [];
        building.level++;
        building.isUpgrading = false;
        building.upgradeStartTime = 0;
        building.upgradeTargetType = null;
        
        // Record upgrade history
        if (!this.upgradeHistory.has(buildingId)) {
            this.upgradeHistory.set(buildingId, []);
        }
        this.upgradeHistory.get(buildingId).push({
            fromType: project.originalBuilding.type,
            toType: project.targetType,
            timestamp: project.startTime,
            cost: project.cost,
            stationUsed: project.stationId
        });
        
        // Free up the station
        station.inUse = false;
        
        // Remove from active constructions
        this.activeConstructions.delete(buildingId);
        
        console.log(`🏗️ Completed upgrade: ${oldName} -> ${building.buildingType.name}`);
        console.log(`📈 New capacity: ${building.capacity} (was ${project.originalBuilding.capacity})`);
    }
    
    // Update building conditions over time
    updateBuildingConditions(deltaTime) {
        const conditionDecayRate = 0.001; // Very slow decay
        
        for (const building of this.buildings.values()) {
            if (!building.isUpgrading) {
                building.condition = Math.max(0, building.condition - conditionDecayRate * deltaTime);
                
                // Buildings in poor condition have reduced efficiency
                if (building.condition < 25) {
                    // Could reduce capacity or add negative effects
                }
            }
        }
    }
    
    // Get nearest construction station
    getNearestConstructionStation(x, y, maxDistance = 100) {
        let nearestStation = null;
        let nearestDistance = Infinity;
        
        for (const station of this.constructionStations.values()) {
            if (!station.isActive) continue;
            
            const distance = Math.sqrt((station.x - x) ** 2 + (station.y - y) ** 2);
            if (distance < nearestDistance && distance <= maxDistance) {
                nearestDistance = distance;
                nearestStation = station;
            }
        }
        
        return nearestStation;
    }
    
    // Handle player interaction with building upgrade system
    handlePlayerInteraction(player, action, targetData = null) {
        if (action === 'open_building_menu') {
            const station = targetData || this.getNearestConstructionStation(player.x, player.y);
            if (station) {
                return this.openBuildingUpgradeMenu(player, station);
            } else {
                return { success: false, message: "No construction station nearby" };
            }
        } else if (action === 'upgrade_building') {
            return this.startBuildingUpgrade(
                player,
                targetData.buildingId,
                targetData.targetType,
                targetData.stationId
            );
        }
        
        return { success: false, message: "Unknown building upgrade action" };
    }
    
    // Open building upgrade menu
    openBuildingUpgradeMenu(player, station) {
        const upgradableBuildings = [];
        
        for (const building of this.buildings.values()) {
            if (building.isUpgrading) continue;
            
            const currentType = this.buildingTypes.get(building.type);
            if (currentType.upgrades && currentType.upgrades.length > 0) {
                const availableUpgrades = currentType.upgrades.filter(upgradeType =>
                    station.availableUpgrades.includes(upgradeType)
                );
                
                if (availableUpgrades.length > 0) {
                    upgradableBuildings.push({
                        building,
                        availableUpgrades: availableUpgrades.map(upgradeType => ({
                            targetType: upgradeType,
                            buildingType: this.buildingTypes.get(upgradeType)
                        }))
                    });
                }
            }
        }
        
        return {
            success: true,
            message: `Opened building upgrade menu at ${station.name}`,
            station,
            upgradableBuildings,
            playerGold: player.gold || 0
        };
    }
    
    // Render building upgrade system
    render(renderSystem) {
        if (!renderSystem) return;
        
        // Render buildings
        for (const building of this.buildings.values()) {
            this.renderBuilding(renderSystem, building);
        }
        
        // Render construction stations
        for (const station of this.constructionStations.values()) {
            this.renderConstructionStation(renderSystem, station);
        }
    }
    
    // Render individual building
    renderBuilding(renderSystem, building) {
        const size = building.buildingType.size;
        let color = '#8B4513'; // Brown for buildings
        
        if (building.isUpgrading) {
            color = '#FF6600'; // Orange when upgrading
        } else if (building.condition < 50) {
            color = '#654321'; // Darker brown for poor condition
        }
        
        // Render building
        renderSystem.drawRect(
            building.x, building.y,
            size.width, size.height,
            color,
            { layer: 4 }
        );
        
        // Building name
        renderSystem.drawText(
            building.buildingType.name,
            building.x + size.width / 2, building.y - 5,
            {
                font: '10px Arial',
                color: '#ffffff',
                align: 'center',
                layer: 5
            }
        );
        
        // Capacity indicator
        renderSystem.drawText(
            `${building.currentOccupancy}/${building.capacity}`,
            building.x + 5, building.y + 15,
            {
                font: '10px Arial',
                color: '#ffffff',
                layer: 5
            }
        );
        
        // Upgrade progress if upgrading
        if (building.isUpgrading) {
            const project = this.activeConstructions.get(building.id);
            if (project) {
                const progress = Math.min(1.0, (Date.now() - project.startTime) / (project.completionTime - project.startTime));
                const progressWidth = (size.width - 10) * progress;
                
                // Progress bar background
                renderSystem.drawRect(
                    building.x + 5, building.y + size.height - 10,
                    size.width - 10, 5,
                    '#333333',
                    { layer: 6 }
                );
                
                // Progress bar fill
                renderSystem.drawRect(
                    building.x + 5, building.y + size.height - 10,
                    progressWidth, 5,
                    '#00ff00',
                    { layer: 6 }
                );
            }
        }
    }
    
    // Render construction station
    renderConstructionStation(renderSystem, station) {
        const color = station.inUse ? '#ff6600' : '#8B4513';
        
        // Render station
        renderSystem.drawRect(
            station.x - 15, station.y - 15,
            30, 30,
            color,
            { layer: 5 }
        );
        
        // Show interaction prompt if player is nearby
        const currentScene = this.gameEngine.getSystem('scene')?.currentScene;
        if (currentScene && currentScene.player) {
            const distance = Math.sqrt((station.x - currentScene.player.x) ** 2 + (station.y - currentScene.player.y) ** 2);
            if (distance < 100 && !station.inUse) {
                renderSystem.drawText(
                    `Press B for ${station.name}`,
                    station.x, station.y - 35,
                    {
                        font: '12px Arial',
                        color: '#ffffff',
                        align: 'center',
                        layer: 10
                    }
                );
            }
        }
    }
    
    // Get building upgrade statistics
    getStats() {
        return {
            totalBuildings: this.buildings.size,
            upgradableBuildings: Array.from(this.buildings.values()).filter(b => !b.isUpgrading && this.buildingTypes.get(b.type).upgrades?.length > 0).length,
            activeUpgrades: this.activeConstructions.size,
            totalUpgrades: Array.from(this.upgradeHistory.values()).reduce((sum, history) => sum + history.length, 0)
        };
    }
    
    // Serialize building upgrade system data
    serialize() {
        const buildings = {};
        for (const [id, building] of this.buildings.entries()) {
            buildings[id] = {
                ...building,
                buildingType: undefined // Don't serialize the full type object
            };
        }
        
        const constructions = {};
        for (const [id, project] of this.activeConstructions.entries()) {
            constructions[id] = project;
        }
        
        return {
            buildings,
            activeConstructions: constructions,
            upgradeHistory: Object.fromEntries(this.upgradeHistory.entries())
        };
    }
    
    // Deserialize building upgrade system data
    deserialize(data, gameEngine) {
        if (data.buildings) {
            this.buildings.clear();
            for (const [id, buildingData] of Object.entries(data.buildings)) {
                const building = { ...buildingData };
                // Restore building type reference
                building.buildingType = this.buildingTypes.get(building.type);
                this.buildings.set(id, building);
            }
        }
        
        if (data.activeConstructions) {
            this.activeConstructions.clear();
            for (const [id, project] of Object.entries(data.activeConstructions)) {
                this.activeConstructions.set(id, project);
            }
        }
        
        if (data.upgradeHistory) {
            this.upgradeHistory.clear();
            for (const [buildingId, history] of Object.entries(data.upgradeHistory)) {
                this.upgradeHistory.set(buildingId, history);
            }
        }
    }
}