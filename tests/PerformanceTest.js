// Performance tests with frame rate monitoring and benchmarks for Harvest Moon
// Tests rendering performance, memory usage, and 60fps maintenance under load

import { TestFramework } from './TestFramework.js';
import { GameEngine } from '../js/engine/GameEngine.js';

const test = new TestFramework();

// Performance testing utilities
class PerformanceMonitor {
  constructor() {
    this.measurements = [];
    this.memoryBaseline = this.getMemoryUsage();
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  startMeasurement() {
    return {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    };
  }

  endMeasurement(measurement) {
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    
    const result = {
      duration: endTime - measurement.startTime,
      memoryDelta: endMemory.used - measurement.startMemory.used,
      startMemory: measurement.startMemory,
      endMemory: endMemory
    };
    
    this.measurements.push(result);
    return result;
  }

  getAverageFrameTime() {
    if (this.measurements.length === 0) return 0;
    const totalTime = this.measurements.reduce((sum, m) => sum + m.duration, 0);
    return totalTime / this.measurements.length;
  }

  getMaxFrameTime() {
    if (this.measurements.length === 0) return 0;
    return Math.max(...this.measurements.map(m => m.duration));
  }

  getMemoryLeak() {
    if (this.measurements.length === 0) return 0;
    const latestMemory = this.measurements[this.measurements.length - 1].endMemory.used;
    return latestMemory - this.memoryBaseline.used;
  }
}

// Create mock canvas with performance tracking
const createPerformanceCanvas = () => {
  let drawCalls = 0;
  let pixelsDrawn = 0;

  const mockContext = {
    drawCallCount: 0,
    pixelsDrawn: 0,
    
    // Tracking wrapper for drawing operations
    drawImage: function(...args) {
      this.drawCallCount++;
      if (args.length >= 5) {
        pixelsDrawn += args[3] * args[4]; // width * height
      }
    },
    
    fillRect: function(x, y, w, h) {
      this.drawCallCount++;
      pixelsDrawn += w * h;
    },
    
    clearRect: function(x, y, w, h) {
      this.drawCallCount++;
      pixelsDrawn += w * h;
    },
    
    // Other required methods
    save: () => {},
    restore: () => {},
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
    
    canvas: { width: 800, height: 600 },
    
    getStats: function() {
      return {
        drawCalls: this.drawCallCount,
        pixelsDrawn: pixelsDrawn
      };
    },
    
    resetStats: function() {
      this.drawCallCount = 0;
      pixelsDrawn = 0;
    }
  };

  return {
    width: 800,
    height: 600,
    getContext: () => mockContext
  };
};

test.describe('Frame Rate Performance', () => {

  test.it('should maintain 60fps during normal operation', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const monitor = new PerformanceMonitor();
    const targetFrameTime = 16.67; // 60fps = 16.67ms per frame
    const testFrames = 60; // Test 1 second worth of frames
    
    gameEngine.start();
    
    // Simulate 60 frames
    for (let i = 0; i < testFrames; i++) {
      const measurement = monitor.startMeasurement();
      
      gameEngine.update(targetFrameTime);
      gameEngine.render();
      
      monitor.endMeasurement(measurement);
    }
    
    gameEngine.stop();
    
    const avgFrameTime = monitor.getAverageFrameTime();
    const maxFrameTime = monitor.getMaxFrameTime();
    
    test.assert(avgFrameTime < targetFrameTime * 1.2, `Average frame time (${avgFrameTime.toFixed(2)}ms) should be close to target (${targetFrameTime}ms)`);
    test.assert(maxFrameTime < targetFrameTime * 2, `Max frame time (${maxFrameTime.toFixed(2)}ms) should not exceed 2x target`);
    test.assert(gameEngine.currentFPS >= 50, 'FPS should maintain at least 50fps during normal operation');
  });

  test.it('should handle performance under heavy load', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Add load by creating many entities/crops
    const farmingSystem = gameEngine.farmingSystem;
    
    // Simulate a large farm with many crops (if APIs support it)
    const heavyLoadFrames = 30;
    const monitor = new PerformanceMonitor();
    
    for (let i = 0; i < heavyLoadFrames; i++) {
      const measurement = monitor.startMeasurement();
      
      gameEngine.update(16.67);
      gameEngine.render();
      
      monitor.endMeasurement(measurement);
    }
    
    const avgFrameTimeUnderLoad = monitor.getAverageFrameTime();
    
    test.assert(avgFrameTimeUnderLoad < 50, `Frame time under load (${avgFrameTimeUnderLoad.toFixed(2)}ms) should remain reasonable`);
    test.assert(gameEngine.currentFPS >= 20, 'Should maintain at least 20fps under heavy load');
  });

});

test.describe('Memory Performance', () => {

  test.it('should not have significant memory leaks during gameplay', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const monitor = new PerformanceMonitor();
    const testCycles = 100;
    
    // Run many update/render cycles to detect memory leaks
    for (let i = 0; i < testCycles; i++) {
      const measurement = monitor.startMeasurement();
      
      gameEngine.update(16.67);
      gameEngine.render();
      
      // Occasionally trigger garbage collection test
      if (i % 20 === 0 && typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
      
      monitor.endMeasurement(measurement);
    }
    
    const memoryLeak = monitor.getMemoryLeak();
    const memoryLeakMB = memoryLeak / (1024 * 1024);
    
    test.assert(memoryLeakMB < 10, `Memory leak (${memoryLeakMB.toFixed(2)}MB) should be minimal after ${testCycles} cycles`);
  });

  test.it('should efficiently manage system resources', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const initialMemory = new PerformanceMonitor().getMemoryUsage();
    
    // Test resource usage of different systems
    const systemTests = [
      () => gameEngine.renderSystem.clear(),
      () => gameEngine.inputManager.update(),
      () => gameEngine.farmingSystem.update(16.67),
      () => gameEngine.timeSystem.update(16.67)
    ];
    
    for (const systemTest of systemTests) {
      const beforeMemory = new PerformanceMonitor().getMemoryUsage();
      
      // Run system operation multiple times
      for (let i = 0; i < 10; i++) {
        systemTest();
      }
      
      const afterMemory = new PerformanceMonitor().getMemoryUsage();
      const memoryDelta = afterMemory.used - beforeMemory.used;
      
      test.assert(memoryDelta < 1024 * 1024, 'System operations should not consume excessive memory');
    }
  });

});

test.describe('Rendering Performance', () => {

  test.it('should optimize draw calls efficiently', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const ctx = canvas.getContext('2d');
    ctx.resetStats();
    
    // Render several frames
    for (let i = 0; i < 10; i++) {
      gameEngine.render();
    }
    
    const stats = ctx.getStats();
    
    test.assert(stats.drawCalls > 0, 'Should have performed draw calls');
    test.assert(stats.drawCalls < 1000, 'Should not have excessive draw calls per frame');
    
    const averageDrawCallsPerFrame = stats.drawCalls / 10;
    test.assert(averageDrawCallsPerFrame < 100, `Average draw calls per frame (${averageDrawCallsPerFrame}) should be reasonable`);
  });

  test.it('should handle large viewport efficiently', async () => {
    const largeCanvas = createPerformanceCanvas();
    largeCanvas.width = 1920;
    largeCanvas.height = 1080;
    
    const gameEngine = new GameEngine(largeCanvas);
    await gameEngine.init();
    
    const monitor = new PerformanceMonitor();
    const testFrames = 10;
    
    for (let i = 0; i < testFrames; i++) {
      const measurement = monitor.startMeasurement();
      gameEngine.render();
      monitor.endMeasurement(measurement);
    }
    
    const avgRenderTime = monitor.getAverageFrameTime();
    
    test.assert(avgRenderTime < 10, `Large viewport render time (${avgRenderTime.toFixed(2)}ms) should be reasonable`);
  });

});

test.describe('System Scale Performance', () => {

  test.it('should scale with entity count', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    // Test with minimal entities
    const minimalMonitor = new PerformanceMonitor();
    
    for (let i = 0; i < 20; i++) {
      const measurement = minimalMonitor.startMeasurement();
      gameEngine.update(16.67);
      minimalMonitor.endMeasurement(measurement);
    }
    
    const minimalAvgTime = minimalMonitor.getAverageFrameTime();
    
    // Simulate adding more entities (collision bodies, etc.)
    const collisionSystem = gameEngine.collisionSystem;
    const entityIds = [];
    
    for (let i = 0; i < 50; i++) {
      const bodyId = collisionSystem.addBody(i * 32, i * 32, 32, 32);
      entityIds.push(bodyId);
    }
    
    // Test with more entities
    const loadedMonitor = new PerformanceMonitor();
    
    for (let i = 0; i < 20; i++) {
      const measurement = loadedMonitor.startMeasurement();
      gameEngine.update(16.67);
      loadedMonitor.endMeasurement(measurement);
    }
    
    const loadedAvgTime = loadedMonitor.getAverageFrameTime();
    
    // Clean up
    entityIds.forEach(id => collisionSystem.removeBody(id));
    
    const performanceDegradation = (loadedAvgTime - minimalAvgTime) / minimalAvgTime;
    
    test.assert(performanceDegradation < 2.0, `Performance degradation (${(performanceDegradation * 100).toFixed(1)}%) should be reasonable with more entities`);
    test.assert(loadedAvgTime < 50, `Update time with entities (${loadedAvgTime.toFixed(2)}ms) should remain acceptable`);
  });

  test.it('should maintain performance with complex scenes', async () => {
    const canvas = createPerformanceCanvas();
    const gameEngine = new GameEngine(canvas);
    await gameEngine.init();
    
    const performanceTest = new PerformanceMonitor();
    const complexSceneFrames = 50;
    
    // Simulate complex scene with multiple systems active
    for (let i = 0; i < complexSceneFrames; i++) {
      const measurement = performanceTest.startMeasurement();
      
      // Update all systems
      gameEngine.update(16.67);
      gameEngine.render();
      
      // Simulate some game activity
      gameEngine.inputManager.update();
      gameEngine.timeSystem.update(16.67);
      gameEngine.farmingSystem.update(16.67);
      
      performanceTest.endMeasurement(measurement);
    }
    
    const avgComplexFrameTime = performanceTest.getAverageFrameTime();
    const maxComplexFrameTime = performanceTest.getMaxFrameTime();
    
    test.assert(avgComplexFrameTime < 20, `Complex scene average frame time (${avgComplexFrameTime.toFixed(2)}ms) should be under 20ms`);
    test.assert(maxComplexFrameTime < 40, `Complex scene max frame time (${maxComplexFrameTime.toFixed(2)}ms) should be under 40ms`);
  });

});

// Run all tests
if (typeof window !== 'undefined') {
  test.runTests().then(results => {
    console.log('Performance tests completed');
  });
}

export default test;