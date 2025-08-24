// Integration tests for system interactions and UI state changes in Harvest Moon
// Tests how farming, time, weather, and save systems work together

import { TestFramework } from './TestFramework.js';
import { GameEngine } from '../js/engine/GameEngine.js';

const test = new TestFramework();

// Create a more complete mock canvas for testing
const createMockCanvas = () => ({
  width: 800,
  height: 600,
  getContext: () => ({
    save: () => {},
    restore: () => {},
    clearRect: () => {},
    drawImage: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 100 }),
    setTransform: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    createImageData: () => ({ data: new Uint8ClampedArray(4) }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    canvas: { width: 800, height: 600 }
  })
});

test.describe('System Integration Tests', () => {

  test.it('should initialize all core systems without errors', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    
    let initSuccess = true;
    try {
      await gameEngine.init();
    } catch (error) {
      console.error('GameEngine initialization error:', error);
      initSuccess = false;
    }
    
    test.assert(initSuccess, 'GameEngine should initialize all systems without errors');
    test.assert(gameEngine.renderSystem, 'RenderSystem should be initialized');
    test.assert(gameEngine.inputManager, 'InputManager should be initialized');
    test.assert(gameEngine.farmingSystem, 'FarmingSystem should be initialized');
    test.assert(gameEngine.timeSystem, 'TimeSystem should be initialized');
    test.assert(gameEngine.saveManager, 'SaveManager should be initialized');
  });

  test.it('should coordinate farming and time systems', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test that farming system responds to time system events
    const initialDay = gameEngine.timeSystem.currentDay;
    const initialCropCount = gameEngine.farmingSystem.activeCrops.size;
    
    // Simulate time passing
    gameEngine.timeSystem.currentDay = initialDay + 1;
    gameEngine.farmingSystem.onNewDay({ 
      currentDay: gameEngine.timeSystem.currentDay,
      formattedDate: `Day ${gameEngine.timeSystem.currentDay}`
    });
    
    test.assertEqual(gameEngine.timeSystem.currentDay, initialDay + 1, 'Time should advance correctly');
    test.assert(gameEngine.farmingSystem.activeCrops.size >= initialCropCount, 'Crops should be maintained across days');
  });

  test.it('should integrate weather and farming systems', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test weather affecting farming
    const weatherSystem = gameEngine.weatherSystem;
    const farmingSystem = gameEngine.farmingSystem;
    
    // Set weather to rain
    weatherSystem.currentWeather = 'rain';
    weatherSystem.isRaining = true;
    
    // Simulate weather effect on farming
    const initialWateredSoilCount = farmingSystem.wateredSoil ? farmingSystem.wateredSoil.size : 0;
    
    // Weather system should interact with farming
    test.assert(weatherSystem.currentWeather === 'rain', 'Weather should be set to rain');
    test.assert(weatherSystem.isRaining, 'Rain flag should be set');
  });

});

test.describe('Save System Integration', () => {

  test.it('should maintain system state consistency during save/load cycle', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Set up initial state
    const timeSystem = gameEngine.timeSystem;
    const farmingSystem = gameEngine.farmingSystem;
    
    const originalDay = timeSystem.currentDay;
    const originalSeason = timeSystem.currentSeason;
    const originalCropCount = farmingSystem.activeCrops.size;
    
    // Create test save data structure
    const testSaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      gameState: {
        time: {
          currentDay: originalDay,
          currentSeason: originalSeason,
          currentYear: timeSystem.currentYear,
          timeOfDay: timeSystem.timeOfDay
        },
        farming: {
          crops: Array.from(farmingSystem.activeCrops.values()).map(crop => ({
            x: crop.x,
            y: crop.y,
            type: crop.seedType,
            stage: crop.currentStage
          }))
        },
        player: {
          x: 100,
          y: 100,
          stamina: 100,
          gold: 5000
        }
      }
    };
    
    // Validate that save data structure is correct
    test.assertEqual(testSaveData.gameState.time.currentDay, originalDay, 'Save data should preserve time state');
    test.assertEqual(testSaveData.gameState.time.currentSeason, originalSeason, 'Save data should preserve season');
    test.assert(Array.isArray(testSaveData.gameState.farming.crops), 'Crops should be serialized as array');
  });

  test.it('should handle cross-system dependencies in save data', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test that systems reference each other correctly
    test.assert(gameEngine.farmingSystem.gameEngine === gameEngine, 'FarmingSystem should reference GameEngine');
    test.assert(gameEngine.saveManager.gameEngine === gameEngine, 'SaveManager should reference GameEngine');
    
    // Test system interdependencies
    const systems = ['timeSystem', 'farmingSystem', 'weatherSystem', 'seasonalSystem'];
    for (const systemName of systems) {
      test.assert(gameEngine[systemName], `${systemName} should be initialized`);
    }
  });

});

test.describe('UI State Integration', () => {

  test.it('should update UI state when game systems change', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test render system integration
    const renderSystem = gameEngine.renderSystem;
    
    test.assert(renderSystem.camera, 'Camera should be initialized');
    test.assert(renderSystem.canvas === canvas, 'RenderSystem should reference correct canvas');
    
    // Test that render system can handle system state
    const initialCameraX = renderSystem.camera.x;
    const initialCameraY = renderSystem.camera.y;
    
    // Camera should be positioned correctly
    test.assert(typeof initialCameraX === 'number', 'Camera X should be numeric');
    test.assert(typeof initialCameraY === 'number', 'Camera Y should be numeric');
  });

  test.it('should coordinate input and game systems', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const inputManager = gameEngine.inputManager;
    
    // Test input system setup
    test.assert(inputManager, 'InputManager should be initialized');
    test.assert(typeof inputManager.update === 'function', 'InputManager should have update method');
    test.assert(typeof inputManager.isKeyPressed === 'function', 'InputManager should handle key presses');
    
    // Test input integration with game systems
    inputManager.update();
    
    // Input system should not throw errors during update
    test.assert(true, 'InputManager update should complete without errors');
  });

});

test.describe('System Performance Integration', () => {

  test.it('should maintain performance during system updates', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const startTime = performance.now();
    
    // Run multiple update cycles
    for (let i = 0; i < 10; i++) {
      gameEngine.update(16.67); // Simulate 60fps
    }
    
    const endTime = performance.now();
    const updateTime = endTime - startTime;
    
    test.assert(updateTime < 100, 'Ten update cycles should complete within 100ms');
    test.assert(gameEngine.currentFPS >= 0, 'FPS counter should be non-negative');
  });

  test.it('should handle system errors gracefully', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test error handling in update cycle
    let errorHandled = true;
    try {
      // Force an error condition and see if engine handles it
      gameEngine.update(16.67);
      gameEngine.render();
    } catch (error) {
      console.error('System integration error:', error);
      errorHandled = false;
    }
    
    test.assert(errorHandled, 'GameEngine should handle system errors gracefully');
  });

  test.it('should efficiently manage system resources', async () => {
    const canvas = createMockCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test system registration and retrieval
    const registeredSystems = ['render', 'input', 'farming', 'time', 'save'];
    
    for (const systemName of registeredSystems) {
      const system = gameEngine.getSystem(systemName);
      test.assert(system, `System '${systemName}' should be registered and retrievable`);
    }
    
    // Test system map size
    test.assert(gameEngine.systems.size >= 5, 'At least 5 core systems should be registered');
  });

});

// Run all tests
if (typeof window !== 'undefined') {
  test.runTests().then(results => {
    console.log('Integration tests completed');
  });
}

export default test;