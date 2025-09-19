# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Game
- `npm run dev` - Start server and auto-open browser (recommended for development)
- `npm start` - Start development server on port 8000 (manual browser navigation)
- `npm run serve` - Alternative server command

### Testing
- `npm test` - Run all unit tests (58 tests across 5 test suites)
- Individual test files can be run with: `node tests/[TestName].js`
- Test suites: FarmingSystemTest, SaveLoadTest, CollisionSystemTest, IntegrationTest, PerformanceTest
- Browser tests: `npm run test-browser` (uses Playwright)

### Setup and Maintenance
- `npm run setup` - Generate placeholder assets and complete initial setup
- `npm run placeholders` - Generate placeholder sprites only
- `npm run clean` - Remove temporary files (*.png, test-game.js)

## Architecture Overview

### Core Game Loop
The game uses a classic Entity-Component-System (ECS) architecture centered around `GameEngine.js`:
- **60fps target** with frame time capping to prevent spiral of death
- **Scene-based architecture** with transitions between Farm, Village, Interior scenes
- **System coordination** where GameEngine orchestrates 17+ interconnected systems

### System Dependencies and Data Flow
Critical system interaction patterns:

**Time → All Systems**: TimeSystem broadcasts time events that drive:
- FarmingSystem (crop growth, watering timers)
- WeatherSystem (daily weather changes)
- SeasonalSystem (seasonal crop availability)
- AnimalSystem (feeding schedules, production)
- NPCSystem (daily routines and schedules)

**Player Input → Multiple Systems**:
- InputManager captures input → ToolSystem → specific action systems
- Farming actions: InputManager → ToolSystem → FarmingSystem → InventorySystem
- Save/Load: InputManager → SaveManager → all systems for state serialization

**Cross-System State Management**:
- SaveManager coordinates state across all systems via `getSystemData()` and `loadSystemData()` methods
- Each system must implement save/load interface for persistence
- Error handling centralized in SaveErrorHandler with fallback mechanisms

### File Structure Patterns

**js/engine/**: Core engine systems (rendering, input, collision, scene management)
**js/systems/**: Game logic systems (farming, time, weather, NPCs, etc.)
**js/entities/**: Game objects (Player, Crop, Animal, NPC, Fish, etc.)
**js/scenes/**: Scene implementations (FarmScene, VillageScene, InteriorScene)
**js/ui/**: User interface components (HUD, InventoryUI)
**tests/**: Comprehensive test suite with custom TestFramework

### Asset Management
- Fallback-first approach: assets default to colored rectangles if sprites missing
- AssetLoader with 10-second timeout protection
- Assets organized by category: sprites/, audio/, data/
- Placeholder generation system for development without art assets

### Critical Implementation Notes

**Canvas and DOM Requirements**:
- Game requires HTML5 Canvas and browser window object
- Tests fail in Node.js due to DOM dependencies - this is expected
- All game systems assume browser environment with canvas rendering

**Performance Monitoring**:
- Built-in FPS monitoring and performance metrics in GameEngine
- PerformanceTest.js validates 60fps targets and memory leak prevention
- Frame time capping prevents performance spiral under load

**Save System Architecture**:
- localStorage-based persistence with error recovery
- Each system implements standardized save/load interface
- SaveManager orchestrates cross-system state serialization
- Handles partial save failures and data validation

**Scene Lifecycle**:
- Scenes follow load() → activate() → update()/render() → deactivate() lifecycle
- SceneManager handles transitions and memory cleanup
- Each scene responsible for its own asset loading and entity management

## Testing Strategy

The codebase uses a custom TestFramework with 5 test suites:
- Tests run in Node.js with mock canvas/DOM objects
- Expected ~45% pass rate due to browser dependencies in game systems
- Focus on system logic rather than rendering/DOM interaction
- Performance tests validate frame timing and memory management

When adding new systems:
1. Implement save/load interface for persistence
2. Add system to GameEngine initialization
3. Create corresponding test suite following existing patterns
4. Ensure system responds to relevant time/input events