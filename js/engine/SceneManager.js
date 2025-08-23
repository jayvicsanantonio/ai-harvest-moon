// Scene management system for handling scene transitions and lifecycle
// Manages scene loading, unloading, transitions, and state persistence

import { Scene } from './Scene.js';

export class SceneManager {
    constructor(engine) {
        this.engine = engine;
        this.scenes = new Map(); // name -> Scene instance
        this.currentScene = null;
        this.pendingTransition = null;
        this.transitionInProgress = false;
        
        // Transition settings
        this.fadeTransitions = true;
        this.transitionDuration = 500; // milliseconds
        this.loadingScreen = true;
        
        // Performance tracking
        this.transitionStats = {
            totalTransitions: 0,
            averageTransitionTime: 0,
            lastTransitionTime: 0
        };
    }
    
    // Register a scene class
    registerScene(name, sceneClass, preload = false) {
        if (this.scenes.has(name)) {
            console.warn(`Scene '${name}' is already registered`);
            return;
        }
        
        const scene = new sceneClass(name);
        this.scenes.set(name, scene);
        
        // Optionally preload the scene
        if (preload) {
            this.preloadScene(name);
        }
        
        console.log(`Registered scene: ${name}`);
    }
    
    // Register a scene instance directly
    registerSceneInstance(scene) {
        if (!(scene instanceof Scene)) {
            console.error('Scene must extend Scene class');
            return;
        }
        
        this.scenes.set(scene.name, scene);
        console.log(`Registered scene instance: ${scene.name}`);
    }
    
    // Preload a scene without activating it
    async preloadScene(sceneName) {
        const scene = this.scenes.get(sceneName);
        if (!scene) {
            console.error(`Scene '${sceneName}' not found`);
            return false;
        }
        
        if (!scene.isLoaded) {
            console.log(`Preloading scene: ${sceneName}`);
            await scene.init(this.engine);
        }
        
        return true;
    }
    
    // Transition to a new scene
    async transitionToScene(sceneName, transitionData = null, options = {}) {
        if (this.transitionInProgress) {
            console.warn('Transition already in progress, queueing new transition');
            this.pendingTransition = { sceneName, transitionData, options };
            return;
        }
        
        const scene = this.scenes.get(sceneName);
        if (!scene) {
            console.error(`Scene '${sceneName}' not found`);
            return false;
        }
        
        if (this.currentScene && this.currentScene.name === sceneName) {
            console.log(`Already in scene '${sceneName}'`);
            return true;
        }
        
        this.transitionInProgress = true;
        const startTime = performance.now();
        
        try {
            // Show loading screen if enabled
            if (this.loadingScreen && options.showLoadingScreen !== false) {
                this.showLoadingScreen(sceneName);
            }
            
            // Deactivate current scene
            if (this.currentScene) {
                await this.deactivateScene(this.currentScene);
            }
            
            // Ensure target scene is loaded
            if (!scene.isLoaded) {
                await scene.init(this.engine);
            }
            
            // Wait for any pending assets
            await this.waitForSceneAssets(scene);
            
            // Activate new scene
            await this.activateScene(scene, transitionData);
            
            // Update current scene reference
            this.currentScene = scene;
            
            // Hide loading screen
            if (this.loadingScreen) {
                this.hideLoadingScreen();
            }
            
            // Update transition stats
            const transitionTime = performance.now() - startTime;
            this.updateTransitionStats(transitionTime);
            
            console.log(`Transitioned to scene '${sceneName}' in ${Math.round(transitionTime)}ms`);
            
            // Process pending transition if any
            this.processPendingTransition();
            
            return true;
            
        } catch (error) {
            console.error(`Failed to transition to scene '${sceneName}':`, error);
            this.transitionInProgress = false;
            
            if (this.loadingScreen) {
                this.hideLoadingScreen();
            }
            
            return false;
        }
    }
    
    // Deactivate and optionally unload a scene
    async deactivateScene(scene, unload = false) {
        if (scene.isActive) {
            scene.deactivate();
        }
        
        if (unload && scene.isLoaded) {
            await scene.unload();
        }
    }
    
    // Activate a scene
    async activateScene(scene, transitionData = null) {
        scene.activate(transitionData);
    }
    
    // Wait for scene assets to finish loading
    async waitForSceneAssets(scene) {
        if (!scene.hasLoadingAssets()) return;
        
        console.log(`Waiting for assets to load for scene '${scene.name}'`);
        
        return new Promise((resolve) => {
            const checkAssets = () => {
                if (!scene.hasLoadingAssets()) {
                    resolve();
                } else {
                    setTimeout(checkAssets, 16); // Check every frame
                }
            };
            checkAssets();
        });
    }
    
    // Process pending transition after current one completes
    processPendingTransition() {
        this.transitionInProgress = false;
        
        if (this.pendingTransition) {
            const { sceneName, transitionData, options } = this.pendingTransition;
            this.pendingTransition = null;
            
            // Process pending transition on next frame
            setTimeout(() => {
                this.transitionToScene(sceneName, transitionData, options);
            }, 16);
        }
    }
    
    // Update current scene
    update(deltaTime, inputManager) {
        if (this.currentScene && this.currentScene.isActive) {
            this.currentScene.update(deltaTime, inputManager);
        }
    }
    
    // Render current scene
    render(renderSystem) {
        if (this.currentScene && this.currentScene.isActive) {
            this.currentScene.render(renderSystem);
        }
    }
    
    // Get current scene
    getCurrentScene() {
        return this.currentScene;
    }
    
    // Get scene by name
    getScene(sceneName) {
        return this.scenes.get(sceneName);
    }
    
    // Check if scene exists
    hasScene(sceneName) {
        return this.scenes.has(sceneName);
    }
    
    // Unload a specific scene
    async unloadScene(sceneName) {
        const scene = this.scenes.get(sceneName);
        if (!scene) return;
        
        // Don't unload current scene
        if (scene === this.currentScene) {
            console.warn(`Cannot unload current scene '${sceneName}'`);
            return;
        }
        
        await scene.unload();
    }
    
    // Unload all scenes except current
    async unloadInactiveScenes() {
        const unloadPromises = [];
        
        for (const [name, scene] of this.scenes) {
            if (scene !== this.currentScene && scene.isLoaded) {
                unloadPromises.push(this.unloadScene(name));
            }
        }
        
        await Promise.all(unloadPromises);
        console.log('Unloaded inactive scenes');
    }
    
    // Save all scene states
    saveSceneStates() {
        const sceneStates = {};
        
        for (const [name, scene] of this.scenes) {
            if (scene.isLoaded) {
                sceneStates[name] = scene.saveState();
            }
        }
        
        return {
            currentScene: this.currentScene?.name || null,
            sceneStates
        };
    }
    
    // Load scene states
    async loadSceneStates(saveData) {
        if (!saveData.sceneStates) return;
        
        for (const [sceneName, stateData] of Object.entries(saveData.sceneStates)) {
            const scene = this.scenes.get(sceneName);
            if (scene) {
                await scene.loadState(stateData);
            }
        }
        
        // Transition to saved current scene
        if (saveData.currentScene && this.scenes.has(saveData.currentScene)) {
            await this.transitionToScene(saveData.currentScene);
        }
    }
    
    // Show loading screen
    showLoadingScreen(targetSceneName) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            
            const loadingText = loadingScreen.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = `Loading ${targetSceneName}...`;
            }
        }
    }
    
    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
    }
    
    // Update transition statistics
    updateTransitionStats(transitionTime) {
        const stats = this.transitionStats;
        stats.totalTransitions++;
        stats.lastTransitionTime = transitionTime;
        stats.averageTransitionTime = 
            (stats.averageTransitionTime * (stats.totalTransitions - 1) + transitionTime) / 
            stats.totalTransitions;
    }
    
    // Get transition statistics
    getTransitionStats() {
        return { ...this.transitionStats };
    }
    
    // Configure transition settings
    setTransitionSettings(settings) {
        if (settings.fadeTransitions !== undefined) {
            this.fadeTransitions = settings.fadeTransitions;
        }
        if (settings.transitionDuration !== undefined) {
            this.transitionDuration = settings.transitionDuration;
        }
        if (settings.loadingScreen !== undefined) {
            this.loadingScreen = settings.loadingScreen;
        }
    }
    
    // Get all scene names
    getSceneNames() {
        return Array.from(this.scenes.keys());
    }
    
    // Get scene count
    getSceneCount() {
        return this.scenes.size;
    }
    
    // Get loaded scene count
    getLoadedSceneCount() {
        return Array.from(this.scenes.values()).filter(scene => scene.isLoaded).length;
    }
    
    // Handle window focus/blur for scene management
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause current scene when window loses focus
            if (this.currentScene) {
                this.currentScene.pause();
            }
        } else {
            // Resume current scene when window gains focus
            if (this.currentScene) {
                this.currentScene.resume();
            }
        }
    }
    
    // Clean up scene manager
    cleanup() {
        this.currentScene = null;
        this.pendingTransition = null;
        this.transitionInProgress = false;
        
        // Cleanup all scenes
        for (const scene of this.scenes.values()) {
            scene.cleanup();
        }
        
        this.scenes.clear();
    }
}