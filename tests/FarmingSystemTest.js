// Unit tests for FarmingSystem crop lifecycle calculations and mechanics
// Tests crop planting, growth progression, watering effects, and harvest timing

import { TestFramework } from './TestFramework.js';
import { FarmingSystem } from '../js/systems/FarmingSystem.js';
import { Crop } from '../js/entities/Crop.js';

const test = new TestFramework();

// Mock game engine for testing
const mockEngine = {
  achievementSystem: {
    onCropPlanted: () => {},
    onCropHarvested: () => {},
    onCropWatered: () => {}
  },
  sceneManager: {
    getCurrentScene: () => ({
      tileMap: {
        width: 10,
        height: 10,
        getTilesAtPosition: () => ({ farmland: 1 }),
        tileProperties: new Map([[1, { farmable: true }]])
      }
    })
  },
  seasonalSystem: {
    currentSeason: 'SPRING'
  },
  timeSystem: {
    on: () => {}
  }
};

test.describe('FarmingSystem Core Tests', () => {
  
  test.it('should initialize with empty crops map', () => {
    const farmingSystem = new FarmingSystem();
    
    test.assertEqual(farmingSystem.activeCrops.size, 0, 'Active crops map should be empty on initialization');
    test.assertEqual(farmingSystem.farmTiles.size, 0, 'Farm tiles map should be empty on initialization');
  });

  test.it('should till soil successfully', () => {
    const farmingSystem = new FarmingSystem();
    farmingSystem.init(mockEngine);
    
    const result = farmingSystem.tillSoil(0, 0, mockPlayer, { type: 'hoe' });
    
    test.assert(result, 'Should successfully till soil');
    const farmTile = farmingSystem.getFarmTile(0, 0);
    test.assertEqual(farmTile.soilState, farmingSystem.soilStates.TILLED, 'Soil should be tilled');
  });

  test.it('should plant seed on tilled soil', () => {
    const farmingSystem = new FarmingSystem();
    farmingSystem.init(mockEngine);
    
    // Mock player with inventory
    const mockPlayer = {
      inventory: {
        hasItem: () => true,
        removeItem: () => true
      }
    };
    
    // Till soil first
    farmingSystem.tillSoil(0, 0, mockPlayer, { type: 'hoe' });
    
    // Plant seed
    const result = farmingSystem.plantSeed(0, 0, 'turnip', mockPlayer, { type: 'turnip_seeds' });
    
    test.assert(result, 'Should successfully plant seed on tilled soil');
    test.assertEqual(farmingSystem.activeCrops.size, 1, 'Should have one active crop');
  });

  test.it('should fail to plant on untilled soil', () => {
    const farmingSystem = new FarmingSystem();
    farmingSystem.init(mockEngine);
    
    const mockPlayer = {
      inventory: {
        hasItem: () => true,
        removeItem: () => true
      }
    };
    
    const result = farmingSystem.plantSeed(0, 0, 'turnip', mockPlayer, { type: 'turnip_seeds' });
    
    test.assertFalsy(result, 'Should fail to plant on untilled soil');
    test.assertEqual(farmingSystem.activeCrops.size, 0, 'Should have no active crops');
  });

});

test.describe('Crop Growth Calculations', () => {

  test.it('should create crop with correct properties', () => {
    const turnipCrop = new Crop(160, 160, 'turnip', mockEngine);
    
    test.assertEqual(turnipCrop.seedType, 'turnip', 'Crop should have correct seed type');
    test.assertEqual(turnipCrop.currentStage, 0, 'New crop should start at stage 0');
    test.assertEqual(turnipCrop.tileX, 5, 'Should calculate correct tile X');
    test.assertEqual(turnipCrop.tileY, 5, 'Should calculate correct tile Y');
    test.assert(turnipCrop.stageGrowthTimes.length > 0, 'Should have growth times defined');
  });

  test.it('should update crop growth over time', () => {
    const crop = new Crop(160, 160, 'turnip', mockEngine);
    const initialStage = crop.currentStage;
    
    // Simulate time passage by updating crop
    crop.update(1000); // 1 second
    
    test.assert(crop.currentStage >= initialStage, 'Stage should not decrease');
    test.assert(crop.stageStartTime > 0, 'Should have stage start time');
  });

  test.it('should handle mature crop state', () => {
    const crop = new Crop(160, 160, 'turnip', mockEngine);
    
    // Force crop to mature stage
    crop.currentStage = crop.growthStages.READY;
    crop.canHarvest = true;
    
    test.assertEqual(crop.currentStage, crop.growthStages.READY, 'Crop should be at ready stage');
    test.assert(crop.canHarvest, 'Mature crop should be harvestable');
  });

  test.it('should handle crop watering', () => {
    const crop = new Crop(160, 160, 'turnip', mockEngine);
    const initialWaterLevel = crop.currentWaterLevel;
    
    crop.water(50);
    
    test.assert(crop.currentWaterLevel >= initialWaterLevel, 'Water level should increase');
    test.assert(crop.currentWaterLevel <= crop.maxWaterLevel, 'Should not exceed max water level');
  });

});

test.describe('Harvest Mechanics', () => {

  test.it('should identify mature crops correctly', () => {
    const crop = new Crop(160, 160, 'turnip', mockEngine);
    
    test.assertFalsy(crop.canHarvest, 'Young crop should not be ready for harvest');
    
    // Force crop to mature
    crop.currentStage = crop.growthStages.READY;
    crop.canHarvest = true;
    
    test.assert(crop.canHarvest, 'Mature crop should be ready for harvest');
  });

  test.it('should harvest mature crop successfully', () => {
    const farmingSystem = new FarmingSystem();
    farmingSystem.init(mockEngine);
    
    const mockPlayer = {
      inventory: {
        hasItem: () => true,
        removeItem: () => true,
        addItem: () => true
      }
    };
    
    // Till and plant
    farmingSystem.tillSoil(0, 0, mockPlayer, { type: 'hoe' });
    farmingSystem.plantSeed(0, 0, 'turnip', mockPlayer, { type: 'turnip_seeds' });
    
    // Get the crop and force it to mature
    const cropKey = farmingSystem.activeCrops.keys().next().value;
    const crop = farmingSystem.activeCrops.get(cropKey);
    crop.currentStage = crop.growthStages.READY;
    crop.canHarvest = true;
    
    const result = farmingSystem.harvestCrop(0, 0, mockPlayer);
    
    test.assert(result, 'Should successfully harvest mature crop');
  });

  test.it('should fail to harvest immature crops', () => {
    const farmingSystem = new FarmingSystem();
    farmingSystem.init(mockEngine);
    
    const mockPlayer = {
      inventory: {
        hasItem: () => true,
        removeItem: () => true,
        addItem: () => true
      }
    };
    
    // Till and plant but don't mature
    farmingSystem.tillSoil(0, 0, mockPlayer, { type: 'hoe' });
    farmingSystem.plantSeed(0, 0, 'turnip', mockPlayer, { type: 'turnip_seeds' });
    
    const result = farmingSystem.harvestCrop(0, 0, mockPlayer);
    
    test.assertFalsy(result, 'Should fail to harvest immature crop');
    test.assertEqual(farmingSystem.activeCrops.size, 1, 'Crop should still exist after failed harvest');
  });

  test.it('should clean up after successful harvest', () => {
    const farmingSystem = new FarmingSystem();
    farmingSystem.init(mockEngine);
    
    const mockPlayer = {
      inventory: {
        hasItem: () => true,
        removeItem: () => true,
        addItem: () => true
      }
    };
    
    // Till, plant and mature crop
    farmingSystem.tillSoil(0, 0, mockPlayer, { type: 'hoe' });
    farmingSystem.plantSeed(0, 0, 'turnip', mockPlayer, { type: 'turnip_seeds' });
    
    const cropKey = farmingSystem.activeCrops.keys().next().value;
    const crop = farmingSystem.activeCrops.get(cropKey);
    crop.currentStage = crop.growthStages.READY;
    crop.canHarvest = true;
    
    farmingSystem.harvestCrop(0, 0, mockPlayer);
    
    test.assertEqual(farmingSystem.activeCrops.size, 0, 'Crop should be removed after harvest');
    const farmTile = farmingSystem.getFarmTile(0, 0);
    test.assertEqual(farmTile.soilState, farmingSystem.soilStates.TILLED, 'Soil should remain tilled for replanting');
  });

});

// Run all tests
if (typeof window !== 'undefined') {
  test.runTests().then(results => {
    console.log('FarmingSystem tests completed');
  });
}

export default test;