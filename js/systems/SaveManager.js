// Save/load system for persistent game state across browser sessions
// Handles complete game state serialization with version control and validation

export class SaveManager {
    constructor() {
        this.gameEngine = null;
        this.saveVersion = '1.0.0';
        this.maxSaveSlots = 3;
        this.autoSaveInterval = 300000; // 5 minutes in milliseconds
        this.lastAutoSave = 0;
        
        // Save data structure template
        this.saveTemplate = {
            version: this.saveVersion,
            timestamp: 0,
            gameTime: {
                totalPlayTime: 0,
                currentDay: 1,
                currentSeason: 'SPRING',
                currentYear: 1,
                timeOfDay: 0,
                timeScale: 1.0
            },
            player: {
                position: { x: 0, y: 0 },
                stamina: { current: 100, max: 100 },
                stats: {
                    totalCropsHarvested: 0,
                    totalEarnings: 0,
                    daysPlayed: 0
                }
            },
            inventory: {
                items: {},
                tools: {},
                capacity: 30,
                currentSlot: 0
            },
            farming: {
                farmTiles: {},
                activeCrops: {},
                stats: {}
            },
            world: {
                currentScene: 'Farm',
                weather: 'sunny',
                season: 'SPRING'
            },
            settings: {
                debugMode: false,
                soundEnabled: true,
                musicVolume: 1.0,
                sfxVolume: 1.0
            },
            achievements: [],
            metadata: {
                saveSlot: 0,
                characterName: 'Player',
                farmName: 'Green Valley Farm',
                difficulty: 'normal'
            }
        };
        
        // Compression and validation
        this.compressionEnabled = true;
        this.validationEnabled = true;
        
        // Error tracking
        this.lastError = null;
        this.saveAttempts = 0;
        this.loadAttempts = 0;
        
        console.log('SaveManager initialized');
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupAutoSave();
        console.log('SaveManager connected to GameEngine');
    }
    
    setupAutoSave() {
        // Auto-save every 5 minutes during gameplay
        setInterval(() => {
            if (this.gameEngine && this.gameEngine.isGameRunning()) {
                this.autoSave();
            }
        }, this.autoSaveInterval);
    }
    
    // Create complete save data from current game state
    createSaveData(saveSlot = 0, metadata = {}) {
        if (!this.gameEngine) {
            throw new Error('SaveManager not initialized with GameEngine');
        }
        
        const saveData = JSON.parse(JSON.stringify(this.saveTemplate));
        
        // Basic metadata
        saveData.version = this.saveVersion;
        saveData.timestamp = Date.now();
        saveData.metadata.saveSlot = saveSlot;
        Object.assign(saveData.metadata, metadata);
        
        // Time system data
        if (this.gameEngine.timeSystem) {
            const timeData = this.gameEngine.timeSystem.getTimeData();
            saveData.gameTime = {
                totalPlayTime: this.gameEngine.timeSystem.totalPlayTime || 0,
                currentDay: timeData.day,
                currentSeason: timeData.season,
                currentYear: timeData.year,
                timeOfDay: timeData.timeOfDay,
                timeScale: this.gameEngine.timeSystem.timeScale
            };
        }
        
        // Player data
        const player = this.getPlayer();
        if (player) {
            saveData.player = {
                position: { x: player.x, y: player.y },
                stamina: {
                    current: player.stamina?.current || 100,
                    max: player.stamina?.max || 100
                },
                stats: player.stats || saveData.player.stats
            };
        }
        
        // Inventory data
        if (player && player.inventory) {
            saveData.inventory = this.serializeInventory(player.inventory);
        }
        
        // Farming system data
        if (this.gameEngine.farmingSystem) {
            saveData.farming = this.serializeFarmingSystem();
        }
        
        // Animal system data
        if (this.gameEngine.animalSystem) {
            saveData.animals = this.serializeAnimalSystem();
        }
        
        // NPC system data
        if (this.gameEngine.npcSystem) {
            saveData.npcs = this.serializeNPCSystem();
        }
        
        // World state
        saveData.world = {
            currentScene: this.gameEngine.sceneManager?.getCurrentScene()?.name || 'Farm',
            weather: this.gameEngine.weatherSystem?.getCurrentWeather()?.type || 'sunny',
            season: this.gameEngine.seasonalSystem?.currentSeason || 'SPRING'
        };
        
        // Settings
        saveData.settings = {
            debugMode: this.gameEngine.isDebugMode(),
            soundEnabled: true,
            musicVolume: 1.0,
            sfxVolume: 1.0
        };
        
        return saveData;
    }
    
    serializeInventory(inventory) {
        return {
            items: inventory.items || {},
            tools: inventory.tools || {},
            capacity: inventory.capacity || 30,
            currentSlot: inventory.currentSlot || 0
        };
    }
    
    serializeFarmingSystem() {
        const farmingSystem = this.gameEngine.farmingSystem;
        const serializedData = {
            farmTiles: {},
            activeCrops: {},
            stats: farmingSystem.stats || {}
        };
        
        // Serialize farm tiles
        for (const [key, tile] of farmingSystem.farmTiles || []) {
            serializedData.farmTiles[key] = {
                worldX: tile.worldX,
                worldY: tile.worldY,
                state: tile.state,
                isWatered: tile.isWatered,
                lastWatered: tile.lastWatered,
                tillTime: tile.tillTime
            };
        }
        
        // Serialize active crops
        for (const [key, crop] of farmingSystem.activeCrops || []) {
            serializedData.activeCrops[key] = {
                worldX: crop.x,
                worldY: crop.y,
                type: crop.type,
                stage: crop.stage,
                growthProgress: crop.growthProgress,
                plantedTime: crop.plantedTime,
                isWatered: crop.isWatered,
                lastWatered: crop.lastWatered
            };
        }
        
        return serializedData;
    }
    
    serializeAnimalSystem() {
        const animalSystem = this.gameEngine.animalSystem;
        const serializedData = {
            animals: {},
            stats: animalSystem.stats || {},
            buildings: {}
        };
        
        // Serialize animals
        for (const [animalId, animal] of animalSystem.animals || []) {
            serializedData.animals[animalId] = {
                x: animal.x,
                y: animal.y,
                animalType: animal.animalType,
                happiness: animal.happiness,
                hunger: animal.hunger,
                lastFed: animal.lastFed,
                lastPetted: animal.lastPetted,
                lastProductGenerated: animal.lastProductGenerated,
                timesInteractedToday: animal.timesInteractedToday,
                hasProduct: animal.hasProduct,
                productQuality: animal.productQuality,
                currentState: animal.currentState
            };
        }
        
        // Serialize animal buildings
        for (const [key, building] of animalSystem.animalBuildings || []) {
            serializedData.buildings[key] = {
                type: building.type,
                position: building.position,
                capacity: building.capacity,
                animalTypes: building.animalTypes
            };
        }
        
        return serializedData;
    }
    
    serializeNPCSystem() {
        const npcSystem = this.gameEngine.npcSystem;
        const serializedData = {
            npcs: {},
            stats: npcSystem.stats || {},
            villageEvents: npcSystem.villageEvents || []
        };
        
        // Serialize NPCs
        for (const [npcId, npc] of npcSystem.npcs || []) {
            const relationships = {};
            for (const [playerId, relationship] of npc.relationships.entries()) {
                relationships[playerId] = relationship;
            }
            
            serializedData.npcs[npcId] = {
                npcId: npc.npcId,
                name: npc.name,
                x: npc.x,
                y: npc.y,
                profession: npc.profession,
                mood: npc.mood,
                energy: npc.energy,
                currentActivity: npc.currentActivity,
                relationships: relationships,
                dailyInteractions: npc.dailyInteractions,
                lastInteractionDay: npc.lastInteractionDay
            };
        }
        
        return serializedData;
    }
    
    // Load game state from save data
    loadGameState(saveData) {
        if (!this.validateSaveData(saveData)) {
            throw new Error('Invalid save data format');
        }
        
        console.log(`Loading game state from save version ${saveData.version}`);
        
        // Load time system
        if (this.gameEngine.timeSystem && saveData.gameTime) {
            this.loadTimeSystem(saveData.gameTime);
        }
        
        // Load player data
        if (saveData.player) {
            this.loadPlayerData(saveData.player);
        }
        
        // Load inventory
        if (saveData.inventory) {
            this.loadInventoryData(saveData.inventory);
        }
        
        // Load farming system
        if (saveData.farming && this.gameEngine.farmingSystem) {
            this.loadFarmingSystem(saveData.farming);
        }
        
        // Load animal system
        if (saveData.animals && this.gameEngine.animalSystem) {
            this.loadAnimalSystem(saveData.animals);
        }
        
        // Load NPC system
        if (saveData.npcs && this.gameEngine.npcSystem) {
            this.loadNPCSystem(saveData.npcs);
        }
        
        // Load world state
        if (saveData.world) {
            this.loadWorldState(saveData.world);
        }
        
        // Load settings
        if (saveData.settings) {
            this.loadSettings(saveData.settings);
        }
        
        console.log('Game state loaded successfully');
        return true;
    }
    
    loadTimeSystem(timeData) {
        const timeSystem = this.gameEngine.timeSystem;
        timeSystem.totalPlayTime = timeData.totalPlayTime || 0;
        timeSystem.currentDay = timeData.currentDay || 1;
        timeSystem.currentYear = timeData.currentYear || 1;
        timeSystem.timeOfDay = timeData.timeOfDay || 0;
        timeSystem.timeScale = timeData.timeScale || 1.0;
        
        // Update seasonal system if available
        if (this.gameEngine.seasonalSystem && timeData.currentSeason) {
            this.gameEngine.seasonalSystem.currentSeason = timeData.currentSeason;
        }
    }
    
    loadPlayerData(playerData) {
        const player = this.getPlayer();
        if (!player) return;
        
        // Load position
        if (playerData.position) {
            player.x = playerData.position.x;
            player.y = playerData.position.y;
        }
        
        // Load stamina
        if (playerData.stamina && player.stamina) {
            player.stamina.current = playerData.stamina.current;
            player.stamina.max = playerData.stamina.max;
        }
        
        // Load stats
        if (playerData.stats) {
            player.stats = { ...player.stats, ...playerData.stats };
        }
    }
    
    loadInventoryData(inventoryData) {
        const player = this.getPlayer();
        if (!player || !player.inventory) return;
        
        player.inventory.items = inventoryData.items || {};
        player.inventory.tools = inventoryData.tools || {};
        player.inventory.capacity = inventoryData.capacity || 30;
        player.inventory.currentSlot = inventoryData.currentSlot || 0;
    }
    
    loadFarmingSystem(farmingData) {
        const farmingSystem = this.gameEngine.farmingSystem;
        
        // Load stats
        if (farmingData.stats) {
            farmingSystem.stats = { ...farmingSystem.stats, ...farmingData.stats };
        }
        
        // Load farm tiles
        farmingSystem.farmTiles.clear();
        if (farmingData.farmTiles) {
            for (const [key, tileData] of Object.entries(farmingData.farmTiles)) {
                const tile = {
                    worldX: tileData.worldX,
                    worldY: tileData.worldY,
                    state: tileData.state,
                    isWatered: tileData.isWatered,
                    lastWatered: tileData.lastWatered,
                    tillTime: tileData.tillTime
                };
                farmingSystem.farmTiles.set(key, tile);
            }
        }
        
        // Load active crops - recreate Crop entities from saved data
        farmingSystem.activeCrops.clear();
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        
        if (farmingData.activeCrops && currentScene) {
            // Import Crop class dynamically
            import('../entities/Crop.js').then(({ Crop }) => {
                for (const [key, cropData] of Object.entries(farmingData.activeCrops)) {
                    // Create new crop entity with saved data
                    const crop = new Crop(cropData.worldX, cropData.worldY, cropData.type, this.gameEngine);
                    
                    // Restore crop state
                    crop.stage = cropData.stage;
                    crop.growthProgress = cropData.growthProgress || 0;
                    crop.plantedTime = cropData.plantedTime;
                    crop.isWatered = cropData.isWatered || false;
                    crop.lastWatered = cropData.lastWatered || 0;
                    
                    // Initialize crop and add to systems
                    crop.init(this.gameEngine);
                    farmingSystem.activeCrops.set(key, crop);
                    currentScene.entities.push(crop);
                }
                console.log(`Restored ${Object.keys(farmingData.activeCrops).length} crops`);
            }).catch(error => {
                console.error('Failed to load Crop class:', error);
            });
        }
        
        console.log(`Loaded ${farmingSystem.farmTiles.size} farm tiles`);
    }
    
    loadAnimalSystem(animalData) {
        const animalSystem = this.gameEngine.animalSystem;
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        
        // Clear existing animals
        animalSystem.cleanup();
        
        // Load stats
        if (animalData.stats) {
            animalSystem.stats = { ...animalSystem.stats, ...animalData.stats };
        }
        
        // Load animal buildings
        if (animalData.buildings) {
            for (const [key, buildingData] of Object.entries(animalData.buildings)) {
                animalSystem.animalBuildings.set(key, buildingData);
            }
        }
        
        // Load animals
        if (animalData.animals && currentScene) {
            import('../entities/Animal.js').then(({ Animal }) => {
                for (const [animalId, animalSaveData] of Object.entries(animalData.animals)) {
                    // Create new animal entity
                    const animal = new Animal(
                        animalSaveData.x,
                        animalSaveData.y,
                        animalSaveData.animalType,
                        this.gameEngine
                    );
                    
                    // Restore animal state
                    animal.entityId = animalId;
                    animal.happiness = animalSaveData.happiness || 75;
                    animal.hunger = animalSaveData.hunger || 60;
                    animal.lastFed = animalSaveData.lastFed || 0;
                    animal.lastPetted = animalSaveData.lastPetted || 0;
                    animal.lastProductGenerated = animalSaveData.lastProductGenerated || Date.now();
                    animal.timesInteractedToday = animalSaveData.timesInteractedToday || 0;
                    animal.hasProduct = animalSaveData.hasProduct || false;
                    animal.productQuality = animalSaveData.productQuality || 'normal';
                    animal.currentState = animalSaveData.currentState || animal.behaviorStates.IDLE;
                    
                    // Initialize and register animal
                    animal.init(this.gameEngine);
                    animalSystem.animals.set(animalId, animal);
                    currentScene.entities.push(animal);
                }
                console.log(`Restored ${Object.keys(animalData.animals).length} animals`);
            }).catch(error => {
                console.error('Failed to load Animal class:', error);
            });
        }
    }
    
    loadNPCSystem(npcData) {
        const npcSystem = this.gameEngine.npcSystem;
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        
        // Clear existing NPCs
        npcSystem.cleanup();
        
        // Load stats
        if (npcData.stats) {
            npcSystem.stats = { ...npcSystem.stats, ...npcData.stats };
        }
        
        // Load village events
        if (npcData.villageEvents) {
            npcSystem.villageEvents = [...npcData.villageEvents];
        }
        
        // Load NPCs
        if (npcData.npcs && currentScene) {
            import('../entities/NPC.js').then(({ NPC }) => {
                for (const [entityId, npcSaveData] of Object.entries(npcData.npcs)) {
                    // Get NPC data from database
                    const npcDefinition = npcSystem.npcDatabase[npcSaveData.npcId];
                    if (!npcDefinition) {
                        console.warn(`NPC definition not found for ${npcSaveData.npcId}`);
                        continue;
                    }
                    
                    // Create new NPC entity
                    const npc = new NPC(npcSaveData.x, npcSaveData.y, npcDefinition, this.gameEngine);
                    
                    // Restore NPC state
                    npc.entityId = entityId;
                    npc.mood = npcSaveData.mood || 'neutral';
                    npc.energy = npcSaveData.energy || 100;
                    npc.currentActivity = npcSaveData.currentActivity || 'idle';
                    npc.dailyInteractions = npcSaveData.dailyInteractions || 0;
                    npc.lastInteractionDay = npcSaveData.lastInteractionDay || 0;
                    
                    // Restore relationships
                    if (npcSaveData.relationships) {
                        for (const [playerId, relationship] of Object.entries(npcSaveData.relationships)) {
                            npc.relationships.set(playerId, relationship);
                        }
                    }
                    
                    // Initialize and register NPC
                    npc.init(this.gameEngine);
                    npcSystem.npcs.set(entityId, npc);
                    currentScene.entities.push(npc);
                }
                console.log(`Restored ${Object.keys(npcData.npcs).length} NPCs`);
            }).catch(error => {
                console.error('Failed to load NPC class:', error);
            });
        }
    }
    
    loadWorldState(worldData) {
        // Set weather if weather system exists
        if (this.gameEngine.weatherSystem && worldData.weather) {
            this.gameEngine.weatherSystem.setWeather(worldData.weather, true);
        }
        
        // Set season if seasonal system exists  
        if (this.gameEngine.seasonalSystem && worldData.season) {
            this.gameEngine.seasonalSystem.currentSeason = worldData.season;
        }
        
        // Scene switching would happen during load process
        // For now, just log the target scene
        console.log(`Target scene after load: ${worldData.currentScene}`);
    }
    
    loadSettings(settingsData) {
        // Apply settings to game systems
        console.log('Settings loaded:', settingsData);
        // Future: Apply audio settings, graphics settings, etc.
    }
    
    // Save data validation
    validateSaveData(saveData) {
        if (!this.validationEnabled) return true;
        
        try {
            // Check required structure
            if (!saveData || typeof saveData !== 'object') return false;
            if (!saveData.version) return false;
            if (!saveData.timestamp) return false;
            if (!saveData.gameTime) return false;
            if (!saveData.player) return false;
            
            // Version compatibility check
            if (!this.isVersionCompatible(saveData.version)) {
                console.warn(`Save version ${saveData.version} may not be fully compatible with current version ${this.saveVersion}`);
            }
            
            return true;
        } catch (error) {
            console.error('Save data validation failed:', error);
            return false;
        }
    }
    
    isVersionCompatible(saveVersion) {
        // Simple version compatibility check
        const [saveMajor] = saveVersion.split('.').map(Number);
        const [currentMajor] = this.saveVersion.split('.').map(Number);
        
        return saveMajor === currentMajor;
    }
    
    // Compression utilities
    compressData(data) {
        if (!this.compressionEnabled) return JSON.stringify(data);
        
        // Simple JSON minification - future: implement actual compression
        return JSON.stringify(data);
    }
    
    decompressData(compressedData) {
        if (!this.compressionEnabled) return JSON.parse(compressedData);
        
        return JSON.parse(compressedData);
    }
    
    // Auto-save functionality
    autoSave() {
        const now = Date.now();
        if (now - this.lastAutoSave < this.autoSaveInterval) return;
        
        try {
            const saveData = this.createSaveData(0, { autoSave: true });
            this.saveToStorage('autosave', saveData);
            this.lastAutoSave = now;
            console.log('Auto-save completed');
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.lastError = error;
        }
    }
    
    // Manual save to specific slot
    saveGame(saveSlot = 0, metadata = {}) {
        this.saveAttempts++;
        
        try {
            const saveData = this.createSaveData(saveSlot, metadata);
            this.saveToStorage(`save_slot_${saveSlot}`, saveData);
            
            console.log(`Game saved to slot ${saveSlot}`);
            return { success: true, saveSlot };
        } catch (error) {
            console.error(`Failed to save game to slot ${saveSlot}:`, error);
            this.lastError = error;
            return { success: false, error: error.message };
        }
    }
    
    // Load game from specific slot
    loadGame(saveSlot = 0) {
        this.loadAttempts++;
        
        try {
            const saveData = this.loadFromStorage(`save_slot_${saveSlot}`);
            if (!saveData) {
                throw new Error(`No save data found in slot ${saveSlot}`);
            }
            
            this.loadGameState(saveData);
            console.log(`Game loaded from slot ${saveSlot}`);
            return { success: true, saveSlot };
        } catch (error) {
            console.error(`Failed to load game from slot ${saveSlot}:`, error);
            this.lastError = error;
            return { success: false, error: error.message };
        }
    }
    
    // Abstract storage methods (to be implemented by subclasses)
    saveToStorage(key, data) {
        throw new Error('saveToStorage must be implemented by subclass');
    }
    
    loadFromStorage(key) {
        throw new Error('loadFromStorage must be implemented by subclass');
    }
    
    deleteFromStorage(key) {
        throw new Error('deleteFromStorage must be implemented by subclass');
    }
    
    // Utility methods
    getPlayer() {
        const currentScene = this.gameEngine?.sceneManager?.getCurrentScene();
        if (!currentScene) return null;
        
        return currentScene.entities?.find(entity => 
            entity.constructor.name === 'Player'
        ) || null;
    }
    
    getSaveSlotInfo(saveSlot) {
        try {
            const saveData = this.loadFromStorage(`save_slot_${saveSlot}`);
            if (!saveData) return null;
            
            return {
                saveSlot,
                timestamp: saveData.timestamp,
                version: saveData.version,
                gameTime: saveData.gameTime,
                metadata: saveData.metadata,
                player: {
                    position: saveData.player.position,
                    stats: saveData.player.stats
                }
            };
        } catch (error) {
            return null;
        }
    }
    
    getAllSaveSlots() {
        const slots = [];
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const info = this.getSaveSlotInfo(i);
            slots.push(info);
        }
        return slots;
    }
    
    deleteSaveSlot(saveSlot) {
        try {
            this.deleteFromStorage(`save_slot_${saveSlot}`);
            console.log(`Save slot ${saveSlot} deleted`);
            return { success: true };
        } catch (error) {
            console.error(`Failed to delete save slot ${saveSlot}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    // Debug and statistics
    getStats() {
        return {
            saveAttempts: this.saveAttempts,
            loadAttempts: this.loadAttempts,
            lastError: this.lastError?.message || null,
            autoSaveEnabled: this.autoSaveInterval > 0,
            compressionEnabled: this.compressionEnabled,
            validationEnabled: this.validationEnabled
        };
    }
    
    clearStats() {
        this.saveAttempts = 0;
        this.loadAttempts = 0;
        this.lastError = null;
    }
}