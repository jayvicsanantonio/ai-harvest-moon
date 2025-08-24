// Core game engine managing the main loop and system coordination
// Handles 60fps rendering, scene management, and system updates

import { RenderSystem } from './RenderSystem.js';
import { InputManager } from './InputManager.js';
import { CollisionSystem } from './CollisionSystem.js';
import { AnimationSystem } from './AnimationSystem.js';
import { AssetManager } from './AssetManager.js';
import { SceneManager } from './SceneManager.js';
import { StaminaSystem } from '../systems/StaminaSystem.js';
import { FarmingSystem } from '../systems/FarmingSystem.js';
import { ToolSystem } from '../systems/ToolSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { SleepSystem } from '../systems/SleepSystem.js';
import { SeasonalSystem } from '../systems/SeasonalSystem.js';
import { WeatherSystem } from '../systems/WeatherSystem.js';
import { LocalStorageSaveManager } from '../systems/LocalStorageSaveManager.js';
import { AnimalSystem } from '../systems/AnimalSystem.js';
import { NPCSystem } from '../systems/NPCSystem.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';
import { FishingSystem } from '../systems/FishingSystem.js';
import { MiningSystem } from '../systems/MiningSystem.js';
import { CookingSystem } from '../systems/CookingSystem.js';
import { ToolUpgradeSystem } from '../systems/ToolUpgradeSystem.js';
import { BuildingUpgradeSystem } from '../systems/BuildingUpgradeSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = null;
    this.isRunning = false;

    // Frame timing and monitoring
    this.lastTime = 0;
    this.deltaTime = 0;
    this.targetFPS = 60;
    this.frameTime = 1000 / this.targetFPS;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.currentFPS = 0;
    this.maxDeltaTime = 50; // Cap delta time to prevent spiral of death

    // Scene and system management
    this.currentScene = null;
    this.nextScene = null;
    this.systems = new Map();
    this.isTransitioning = false;

    // Performance monitoring
    this.performanceMetrics = {
      updateTime: 0,
      renderTime: 0,
      totalFrameTime: 0,
    };
    
    // Rendering system
    this.renderSystem = null;
    
    // Input system
    this.inputManager = null;
    
    // Collision system
    this.collisionSystem = null;
    
    // Animation system
    this.animationSystem = null;
    
    // Stamina system
    this.staminaSystem = null;
    
    // Farming system
    this.farmingSystem = null;
    
    // Tool system
    this.toolSystem = null;
    
    // Time system
    this.timeSystem = null;
    
    // Sleep system
    this.sleepSystem = null;
    
    // Seasonal system
    this.seasonalSystem = null;
    
    // Weather system
    this.weatherSystem = null;
    
    // Asset management
    this.assetManager = null;
    
    // Scene management
    this.sceneManager = null;
    
    // Save/Load system
    this.saveManager = null;
    
    // Animal system
    this.animalSystem = null;
    
    // NPC and dialogue systems
    this.npcSystem = null;
    this.dialogueSystem = null;
    
    // Fishing system
    this.fishingSystem = null;
    
    // Mining system
    this.miningSystem = null;
    
    // Cooking system
    this.cookingSystem = null;
    
    // Tool upgrade system
    this.toolUpgradeSystem = null;
    
    // Building upgrade system
    this.buildingUpgradeSystem = null;
    
    // Achievement system
    this.achievementSystem = null;
  }

  async init() {
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      throw new Error("Unable to get 2D rendering context");
    }

    // Initialize asset manager first
    this.assetManager = new AssetManager();
    this.registerSystem('assets', this.assetManager);

    // Initialize rendering system
    this.renderSystem = new RenderSystem(this.canvas, this.ctx, this.assetManager);
    this.registerSystem('render', this.renderSystem);
    
    // Initialize input system
    this.inputManager = new InputManager();
    this.registerSystem('input', this.inputManager);
    
    // Initialize collision system
    this.collisionSystem = new CollisionSystem();
    this.registerSystem('collision', this.collisionSystem);
    
    // Initialize animation system
    this.animationSystem = new AnimationSystem();
    this.registerSystem('animation', this.animationSystem);
    
    // Initialize stamina system
    this.staminaSystem = new StaminaSystem();
    this.registerSystem('stamina', this.staminaSystem);
    
    // Initialize farming system
    this.farmingSystem = new FarmingSystem();
    this.registerSystem('farming', this.farmingSystem);
    
    // Initialize tool system
    this.toolSystem = new ToolSystem();
    this.registerSystem('tool', this.toolSystem);
    
    // Initialize time system
    this.timeSystem = new TimeSystem();
    this.registerSystem('time', this.timeSystem);
    
    // Initialize sleep system
    this.sleepSystem = new SleepSystem();
    this.registerSystem('sleep', this.sleepSystem);
    
    // Initialize seasonal system
    this.seasonalSystem = new SeasonalSystem();
    this.registerSystem('seasonal', this.seasonalSystem);
    
    // Initialize weather system
    this.weatherSystem = new WeatherSystem();
    this.registerSystem('weather', this.weatherSystem);
    
    // Initialize scene manager
    this.sceneManager = new SceneManager(this);
    this.registerSystem('scene', this.sceneManager);
    
    // Initialize save manager
    this.saveManager = new LocalStorageSaveManager();
    this.saveManager.init(this);
    this.registerSystem('save', this.saveManager);
    
    // Initialize animal system
    this.animalSystem = new AnimalSystem();
    this.animalSystem.init(this);
    this.registerSystem('animal', this.animalSystem);
    
    // Initialize dialogue system
    this.dialogueSystem = new DialogueSystem();
    this.dialogueSystem.init(this);
    this.registerSystem('dialogue', this.dialogueSystem);
    
    // Initialize NPC system
    this.npcSystem = new NPCSystem();
    this.npcSystem.init(this);
    this.registerSystem('npc', this.npcSystem);
    
    // Initialize fishing system
    this.fishingSystem = new FishingSystem();
    this.fishingSystem.init(this);
    this.registerSystem('fishing', this.fishingSystem);
    
    // Initialize mining system
    this.miningSystem = new MiningSystem();
    this.miningSystem.init(this);
    this.registerSystem('mining', this.miningSystem);
    
    // Initialize cooking system
    this.cookingSystem = new CookingSystem();
    this.cookingSystem.init(this);
    this.registerSystem('cooking', this.cookingSystem);
    
    // Initialize tool upgrade system
    this.toolUpgradeSystem = new ToolUpgradeSystem();
    this.toolUpgradeSystem.init(this);
    this.registerSystem('toolUpgrade', this.toolUpgradeSystem);
    
    // Initialize building upgrade system
    this.buildingUpgradeSystem = new BuildingUpgradeSystem();
    this.buildingUpgradeSystem.init(this);
    this.registerSystem('buildingUpgrade', this.buildingUpgradeSystem);
    
    // Initialize achievement system
    this.achievementSystem = new AchievementSystem();
    this.achievementSystem.init(this);
    this.registerSystem('achievement', this.achievementSystem);

    console.log("GameEngine initialized");
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop = (currentTime) => {
    if (!this.isRunning) return;

    const frameStart = performance.now();

    // Calculate delta time and cap it to prevent spiral of death
    this.deltaTime = Math.min(currentTime - this.lastTime, this.maxDeltaTime);
    this.lastTime = currentTime;

    // Scene transitions are now handled by SceneManager

    // Update phase
    const updateStart = performance.now();
    this.update(this.deltaTime);
    this.performanceMetrics.updateTime = performance.now() - updateStart;

    // Render phase
    const renderStart = performance.now();
    this.render();
    this.performanceMetrics.renderTime = performance.now() - renderStart;

    // Frame rate monitoring
    this.updateFPSCounter(this.deltaTime);

    // Total frame time
    this.performanceMetrics.totalFrameTime = performance.now() - frameStart;

    requestAnimationFrame(this.gameLoop);
  };

  update(deltaTime) {
    try {
      // Update input system first to capture frame-based input states
      this.inputManager.update();
      
      // Update scene manager (handles current scene)
      if (this.sceneManager) {
        this.sceneManager.update(deltaTime, this.inputManager);
      }
      
      // Handle dialogue input if dialogue is active
      if (this.dialogueSystem && this.dialogueSystem.isDialogueActive()) {
        this.dialogueSystem.handleInput(this.inputManager);
      }

      // Update all registered systems (except input which we already updated)
      for (const [systemName, system] of this.systems.entries()) {
        if (systemName !== 'input' && system.update) {
          try {
            system.update(deltaTime);
          } catch (error) {
            console.error(`Error updating system ${systemName}:`, error);
            // Continue with other systems
          }
        }
      }
    } catch (error) {
      console.error("Critical error in game update:", error);
      this.handleCriticalError(error);
    }
  }

  render() {
    try {
      // Clear and begin render frame
      this.renderSystem.clear();

      // Render current scene through scene manager
      if (this.sceneManager) {
        this.sceneManager.render(this.renderSystem);
      }

      // Flush all queued render commands
      this.renderSystem.flush();
      
      // Render dialogue system on top of everything
      if (this.dialogueSystem) {
        this.dialogueSystem.render(this.renderSystem);
      }
      
      // Render achievement system (popups and notifications)
      if (this.achievementSystem) {
        this.achievementSystem.render(this.renderSystem);
      }

      // Render debug information in development
      if (this.isDebugMode()) {
        this.renderDebugInfo();
      }
    } catch (error) {
      console.error("Error during rendering:", error);
      this.renderErrorState();
    }
  }

  renderDebugInfo() {
    const renderStats = this.renderSystem.getStats();
    
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(10, 10, 240, 120);

    this.ctx.fillStyle = "white";
    this.ctx.font = "12px monospace";
    this.ctx.fillText(`FPS: ${this.currentFPS}`, 15, 25);
    this.ctx.fillText(
      `Update: ${this.performanceMetrics.updateTime.toFixed(1)}ms`,
      15,
      40,
    );
    this.ctx.fillText(
      `Render: ${this.performanceMetrics.renderTime.toFixed(1)}ms`,
      15,
      55,
    );
    this.ctx.fillText(
      `Frame: ${this.performanceMetrics.totalFrameTime.toFixed(1)}ms`,
      15,
      70,
    );
    this.ctx.fillText(`Draw Calls: ${renderStats.drawCalls}`, 15, 85);
    this.ctx.fillText(`Sprites: ${renderStats.spritesRendered}`, 15, 100);
    this.ctx.fillText(
      `Camera: ${this.renderSystem.camera.x.toFixed(0)}, ${this.renderSystem.camera.y.toFixed(0)}`,
      15,
      115,
    );
  }

  renderErrorState() {
    this.ctx.fillStyle = "#e74c3c";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "Rendering Error",
      this.canvas.width / 2,
      this.canvas.height / 2,
    );
    this.ctx.fillText(
      "Check console for details",
      this.canvas.width / 2,
      this.canvas.height / 2 + 30,
    );
    this.ctx.textAlign = "left";
  }

  isDebugMode() {
    return (
      localStorage.getItem("debug_mode") === "true" ||
      window.location.search.includes("debug=true")
    );
  }

  handleCriticalError(error) {
    console.error("Critical game engine error:", error);
    this.stop();

    // Show user-friendly error message
    const errorEvent = new CustomEvent("gameError", {
      detail: {
        error,
        message: "A critical error occurred. The game has been stopped.",
      },
    });
    window.dispatchEvent(errorEvent);
  }

  // Scene management is now handled by SceneManager

  updateFPSCounter(deltaTime) {
    this.frameCount++;
    this.fpsTimer += deltaTime;

    // Update FPS every second
    if (this.fpsTimer >= 1000) {
      this.currentFPS = Math.round((this.frameCount * 1000) / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;

      // Log performance warnings
      if (this.currentFPS < this.targetFPS * 0.8) {
        console.warn(
          `Low FPS detected: ${this.currentFPS}fps (target: ${this.targetFPS}fps)`,
        );
      }
    }
  }

  getFPS() {
    return this.currentFPS;
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  isGameRunning() {
    return this.isRunning;
  }

  registerSystem(name, system) {
    this.systems.set(name, system);
  }

  getSystem(name) {
    return this.systems.get(name);
  }
}
