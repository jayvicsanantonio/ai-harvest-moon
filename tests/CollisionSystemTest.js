// Unit tests for collision detection and movement systems
// Tests tile-based collision, boundary checking, and position validation

import { TestFramework } from './TestFramework.js';
import { CollisionSystem } from '../js/engine/CollisionSystem.js';

const test = new TestFramework();

// Mock tile map for testing
const createMockTileMap = () => ({
  width: 10,
  height: 10,
  tileSize: 32,
  layers: {
    collision: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 1, 0],
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  },
  getTileAt(x, y, layer = 'collision') {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return 1; // Out of bounds is solid
    }
    
    return this.layers[layer][tileY][tileX];
  }
});

// Mock entity for testing
const createMockEntity = (x = 0, y = 0, width = 32, height = 32) => ({
  x, y, width, height,
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }
});

test.describe('CollisionSystem Initialization', () => {

  test.it('should initialize with default properties', () => {
    const collisionSystem = new CollisionSystem();
    
    test.assert(collisionSystem, 'CollisionSystem should be created');
    test.assertEqual(typeof collisionSystem.checkTileCollision, 'function', 'Should have checkTileCollision method');
    test.assertEqual(typeof collisionSystem.addBody, 'function', 'Should have addBody method');
    test.assertEqual(collisionSystem.cellSize, 32, 'Should have default cell size of 32');
    test.assertEqual(collisionSystem.bodies.size, 0, 'Should start with no collision bodies');
  });

});

test.describe('Tile-Based Collision Detection', () => {

  test.it('should detect collision with solid tiles', () => {
    const collisionSystem = new CollisionSystem();
    
    // Add a solid tile collision at position (1,1)
    collisionSystem.addTileCollision(1, 1, true);
    
    const hasCollision = collisionSystem.checkTileCollision(1, 1);
    
    test.assert(hasCollision.length > 0, 'Should detect collision with solid tile');
  });

  test.it('should not detect collision with empty tiles', () => {
    const collisionSystem = new CollisionSystem();
    
    // Test tile with no collision body
    const hasCollision = collisionSystem.checkTileCollision(0, 0);
    
    test.assertEqual(hasCollision.length, 0, 'Should not detect collision with empty tile');
  });

  test.it('should handle large area collision checks', () => {
    const collisionSystem = new CollisionSystem();
    
    // Add collision bodies
    collisionSystem.addTileCollision(1, 1, true);
    collisionSystem.addTileCollision(2, 1, true);
    
    // Check large area that spans multiple tiles
    const collisions = collisionSystem.checkRect(0, 0, 96, 64);
    
    test.assert(collisions.length > 0, 'Should detect collisions in large area check');
  });

  test.it('should handle precise collision boundaries', () => {
    const collisionSystem = new CollisionSystem();
    
    // Add collision at tile (1,1) = world position (32,32)
    collisionSystem.addTileCollision(1, 1, true);
    
    // Test exact tile boundary
    const collision1 = collisionSystem.checkRect(31, 31, 1, 1);
    const collision2 = collisionSystem.checkRect(32, 32, 1, 1);
    
    test.assertEqual(collision1.length, 0, 'Should not collide when not overlapping');
    test.assert(collision2.length > 0, 'Should collide when overlapping');
  });

});

test.describe('Body Management', () => {

  test.it('should add and remove collision bodies', () => {
    const collisionSystem = new CollisionSystem();
    
    const bodyId = collisionSystem.addBody(64, 64, 32, 32);
    
    test.assert(bodyId > 0, 'Should return valid body ID');
    test.assertEqual(collisionSystem.bodies.size, 1, 'Should have one body after adding');
    
    const body = collisionSystem.getBody(bodyId);
    test.assert(body, 'Should be able to retrieve body by ID');
    test.assertEqual(body.x, 64, 'Body should have correct x position');
    test.assertEqual(body.y, 64, 'Body should have correct y position');
    
    collisionSystem.removeBody(bodyId);
    test.assertEqual(collisionSystem.bodies.size, 0, 'Should have no bodies after removal');
  });

  test.it('should update body positions', () => {
    const collisionSystem = new CollisionSystem();
    
    const bodyId = collisionSystem.addBody(32, 32, 32, 32);
    collisionSystem.updateBodyPosition(bodyId, 64, 64);
    
    const body = collisionSystem.getBody(bodyId);
    test.assertEqual(body.x, 64, 'Body x position should be updated');
    test.assertEqual(body.y, 64, 'Body y position should be updated');
  });

});

test.describe('Rectangle Collision Detection', () => {

  test.it('should detect collision between overlapping rectangles', () => {
    const collisionSystem = new CollisionSystem();
    
    const overlaps = collisionSystem.rectOverlap(50, 50, 32, 32, 60, 60, 32, 32);
    
    test.assert(overlaps, 'Should detect collision between overlapping rectangles');
  });

  test.it('should not detect collision between separated rectangles', () => {
    const collisionSystem = new CollisionSystem();
    
    const overlaps = collisionSystem.rectOverlap(50, 50, 32, 32, 100, 100, 32, 32);
    
    test.assertFalsy(overlaps, 'Should not detect collision between separated rectangles');
  });

  test.it('should handle rectangles touching at edges', () => {
    const collisionSystem = new CollisionSystem();
    
    const overlaps = collisionSystem.rectOverlap(50, 50, 32, 32, 82, 50, 32, 32);
    
    test.assertFalsy(overlaps, 'Should not detect collision when rectangles just touch at edges');
  });

  test.it('should detect collision with different sized rectangles', () => {
    const collisionSystem = new CollisionSystem();
    
    const overlaps = collisionSystem.rectOverlap(50, 50, 16, 16, 40, 40, 64, 64);
    
    test.assert(overlaps, 'Should detect collision between different sized rectangles');
  });

});

test.describe('Spatial Grid System', () => {

  test.it('should place bodies in spatial grid correctly', () => {
    const collisionSystem = new CollisionSystem();
    
    const bodyId = collisionSystem.addBody(64, 64, 32, 32);
    const body = collisionSystem.getBody(bodyId);
    
    test.assert(body.gridCells.size > 0, 'Body should be placed in grid cells');
  });

  test.it('should efficiently query bodies in region', () => {
    const collisionSystem = new CollisionSystem();
    
    // Add bodies in different positions
    collisionSystem.addBody(32, 32, 32, 32);
    collisionSystem.addBody(64, 64, 32, 32);
    collisionSystem.addBody(200, 200, 32, 32); // Far away
    
    const bodiesInRegion = collisionSystem.getBodiesInRegion(0, 0, 128, 128);
    
    test.assert(bodiesInRegion.length >= 2, 'Should find bodies in region');
    test.assert(bodiesInRegion.length < 3, 'Should not include bodies outside region');
  });

  test.it('should handle collision layer masking', () => {
    const collisionSystem = new CollisionSystem();
    
    // Add bodies on different layers
    const terrainId = collisionSystem.addBody(32, 32, 32, 32, { layer: collisionSystem.layers.TERRAIN });
    const entityId = collisionSystem.addBody(32, 32, 32, 32, { layer: collisionSystem.layers.ENTITIES });
    
    // Check collision with specific layer mask
    const terrainCollisions = collisionSystem.checkRect(32, 32, 32, 32, collisionSystem.layers.TERRAIN);
    const entityCollisions = collisionSystem.checkRect(32, 32, 32, 32, collisionSystem.layers.ENTITIES);
    
    test.assert(terrainCollisions.length > 0, 'Should find terrain layer collisions');
    test.assert(entityCollisions.length > 0, 'Should find entity layer collisions');
  });

});

test.describe('Collision Callbacks', () => {

  test.it('should register and trigger collision callbacks', () => {
    const collisionSystem = new CollisionSystem();
    let callbackTriggered = false;
    
    const bodyId = collisionSystem.addBody(32, 32, 32, 32);
    
    collisionSystem.onCollision(bodyId, (collisions) => {
      callbackTriggered = true;
    });
    
    // Simulate collision event
    collisionSystem.triggerCollisionEvents(bodyId, [{ id: 999, x: 64, y: 64 }]);
    
    test.assert(callbackTriggered, 'Collision callback should be triggered');
  });

  test.it('should handle solid and trigger bodies differently', () => {
    const collisionSystem = new CollisionSystem();
    
    const solidId = collisionSystem.addBody(32, 32, 32, 32, { solid: true });
    const triggerId = collisionSystem.addBody(64, 64, 32, 32, { solid: false, trigger: true });
    
    const solidBody = collisionSystem.getBody(solidId);
    const triggerBody = collisionSystem.getBody(triggerId);
    
    test.assert(solidBody.solid, 'Solid body should be marked as solid');
    test.assertFalsy(triggerBody.solid, 'Trigger body should not be solid');
    test.assert(triggerBody.trigger, 'Trigger body should be marked as trigger');
  });

});

// Run all tests
if (typeof window !== 'undefined') {
  test.runTests().then(results => {
    console.log('CollisionSystem tests completed');
  });
}

export default test;