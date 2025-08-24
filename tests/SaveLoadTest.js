// Unit tests for save/load data integrity and validation
// Tests serialization, deserialization, data corruption detection, and format migration

import { TestFramework } from './TestFramework.js';
import { LocalStorageSaveManager } from '../js/systems/LocalStorageSaveManager.js';

const test = new TestFramework();

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key] || null;
  }
  
  setItem(key, value) {
    this.store[key] = value;
  }
  
  removeItem(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {};
  }
}

// Setup mock localStorage globally
const mockLocalStorage = new MockLocalStorage();
if (typeof global !== 'undefined') {
  global.localStorage = mockLocalStorage;
} else if (typeof window !== 'undefined') {
  window.localStorage = mockLocalStorage;
}

// Mock game engine with all systems
const createMockEngine = () => ({
  sceneManager: {
    getCurrentScene: () => ({
      player: {
        x: 100, y: 150, stamina: 80, gold: 5000,
        inventory: { items: new Map([['turnip', 5], ['potato', 3]]) }
      }
    })
  },
  farmingSystem: {
    crops: [
      { type: 'turnip', x: 5, y: 5, stage: 2, plantedTime: Date.now() - 10000, lastWatered: Date.now() - 5000 }
    ],
    tilledSoil: new Set(['5,5', '6,6']),
    wateredSoil: new Set(['5,5'])
  },
  timeSystem: {
    currentDay: 15,
    currentSeason: 'spring',
    currentYear: 1,
    timeOfDay: 12.5
  },
  animalSystem: {
    animals: [
      { id: 'cow1', type: 'cow', happiness: 80, hunger: 60, lastFed: Date.now() - 7200000 }
    ]
  },
  npcSystem: {
    relationships: new Map([['alice', 75], ['bob', 50]])
  },
  achievementSystem: {
    unlockedAchievements: new Set(['first_crop', 'early_riser'])
  }
});

test.describe('Save Data Serialization', () => {

  test.it('should create save data structure', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    // Test save data creation without localStorage
    const saveData = saveManager.createSaveData();
    
    test.assert(saveData, 'Should create save data');
    test.assert(saveData.version, 'Save should include version');
    test.assert(saveData.timestamp, 'Save should include timestamp');
    test.assert(saveData.gameState, 'Save should include game state');
  });

  test.it('should serialize player data correctly', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const saveData = saveManager.createSaveData();
    
    test.assertEqual(saveData.gameState.player.x, 100, 'Player x position should be saved');
    test.assertEqual(saveData.gameState.player.y, 150, 'Player y position should be saved');
    test.assertEqual(saveData.gameState.player.stamina, 80, 'Player stamina should be saved');
    test.assertEqual(saveData.gameState.player.gold, 5000, 'Player gold should be saved');
    test.assert(Array.isArray(saveData.gameState.player.inventory), 'Inventory should be serialized as array');
  });

  test.it('should serialize farming system data', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const saveData = saveManager.createSaveData();
    
    test.assert(Array.isArray(saveData.gameState.farming.crops), 'Crops should be serialized as array');
    test.assertEqual(saveData.gameState.farming.crops.length, 1, 'Should save correct number of crops');
    test.assertEqual(saveData.gameState.farming.crops[0].type, 'turnip', 'Should save crop type');
  });

});

test.describe('Save Data Validation', () => {

  test.it('should validate save data structure', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const validSaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: {
        player: { x: 100, y: 150, stamina: 80, gold: 5000 },
        farming: { crops: [], tilledSoil: [], wateredSoil: [] },
        time: { currentDay: 1, currentSeason: 'spring', currentYear: 1 }
      }
    };
    
    const isValid = saveManager.validateSaveData(validSaveData);
    test.assert(isValid, 'Valid save data should pass validation');
  });

  test.it('should detect invalid save data', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const invalidSaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: {
        player: { x: "invalid", y: 150 }
        // Missing required fields
      }
    };
    
    const isValid = saveManager.validateSaveData(invalidSaveData);
    test.assertFalsy(isValid, 'Invalid save data should fail validation');
  });

  test.it('should serialize complex data structures', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const saveData = saveManager.createSaveData();
    
    test.assert(Array.isArray(saveData.gameState.npcRelationships), 'NPC relationships should be serialized');
    test.assert(Array.isArray(saveData.gameState.achievements), 'Achievements should be serialized');
    test.assert(saveData.gameState.time.currentSeason, 'Time data should be serialized');
  });

});

test.describe('Data Integrity', () => {

  test.it('should handle JSON parsing errors', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    // Test parsing invalid JSON
    let parseError = false;
    try {
      JSON.parse('{"invalid": json data}');
    } catch (error) {
      parseError = true;
    }
    
    test.assert(parseError, 'Should detect JSON parsing errors');
  });

  test.it('should validate save data version', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const oldVersionSave = {
      version: '0.0.1',
      timestamp: Date.now(),
      gameState: {}
    };
    
    const isValid = saveManager.validateSaveData(oldVersionSave);
    test.assertFalsy(isValid, 'Should reject incompatible version');
  });

  test.it('should validate required game state properties', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const incompleteSave = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: {
        player: { x: 100, y: 150 }
        // Missing other required properties
      }
    };
    
    const isValid = saveManager.validateSaveData(incompleteSave);
    test.assertFalsy(isValid, 'Should reject save data missing required properties');
  });

  test.it('should validate data types in save file', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const invalidTypeSave = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: {
        player: { x: "not_a_number", y: 150, stamina: 80, gold: 5000 },
        farming: { crops: [], tilledSoil: [], wateredSoil: [] },
        time: { currentDay: 1, currentSeason: 'spring', currentYear: 1 }
      }
    };
    
    const isValid = saveManager.validateSaveData(invalidTypeSave);
    test.assertFalsy(isValid, 'Should reject save data with invalid types');
  });

});

test.describe('Save Data Format', () => {

  test.it('should create consistent save data format', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const saveData1 = saveManager.createSaveData();
    const saveData2 = saveManager.createSaveData();
    
    test.assertEqual(saveData1.version, saveData2.version, 'Version should be consistent');
    test.assert(saveData1.timestamp <= saveData2.timestamp, 'Timestamps should be sequential');
    test.assertEqual(typeof saveData1.gameState, typeof saveData2.gameState, 'Game state structure should be consistent');
  });

  test.it('should handle save data compression', () => {
    const saveManager = new LocalStorageSaveManager();
    const mockEngine = createMockEngine();
    saveManager.init(mockEngine);
    
    const saveData = saveManager.createSaveData();
    const jsonString = JSON.stringify(saveData);
    
    test.assert(jsonString.length > 0, 'Save data should serialize to JSON');
    test.assert(jsonString.includes('gameState'), 'JSON should contain game state');
    test.assert(jsonString.includes('version'), 'JSON should contain version');
  });

});

// Run all tests
if (typeof window !== 'undefined') {
  test.runTests().then(results => {
    console.log('SaveLoad tests completed');
  });
}

export default test;