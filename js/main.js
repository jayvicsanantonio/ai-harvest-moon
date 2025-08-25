// Main entry point for Harvest Moon web game
// Initializes game engine and starts the main game loop

import { GameEngine } from './engine/GameEngine.js';
import { FarmScene } from './scenes/FarmScene.js';
import { VillageScene } from './scenes/VillageScene.js';
import { InteriorScene } from './scenes/InteriorScene.js';
import { AssetLoader } from './utils/AssetLoader.js';

class Game {
    constructor() {
        this.engine = null;
        this.assetLoader = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) {
                throw new Error('Game canvas not found');
            }

            // Initialize game engine
            this.engine = new GameEngine(canvas);
            await this.engine.init();

            // Create asset loader and queue all game assets
            this.assetLoader = new AssetLoader(this.engine.assetManager);
            this.assetLoader.queueGameAssets();

            // Load assets
            console.log('Loading game assets...');
            
            // Set up a timeout to ensure loading doesn't hang forever
            const loadingTimeout = setTimeout(() => {
                console.warn('Asset loading timeout reached, proceeding anyway');
                window.dispatchEvent(new CustomEvent('assetsLoaded', {
                    detail: { loaded: 0, failed: 0, timeout: true }
                }));
            }, 10000); // 10 second timeout
            
            try {
                await this.assetLoader.loadAll();
                clearTimeout(loadingTimeout);
            } catch (error) {
                console.error('Asset loading failed:', error);
                clearTimeout(loadingTimeout);
                // Dispatch the event manually to proceed
                window.dispatchEvent(new CustomEvent('assetsLoaded', {
                    detail: { loaded: 0, failed: 0, error: true }
                }));
            }
            
            // Setup scenes after assets are loaded
            this.setupScenes();
            
            this.isInitialized = true;
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to start game. Please refresh and try again.');
        }
    }
    
    setupScenes() {
        // Register all game scenes with the SceneManager
        // For class constructors, we need to create wrapper classes
        try {
            this.engine.sceneManager.registerScene('Farm', FarmScene);
            this.engine.sceneManager.registerScene('Village', VillageScene);
            
            // For InteriorScene variants, create specific scene classes
            class HouseScene extends InteriorScene {
                constructor(name) { super('house'); }
            }
            class ShopScene extends InteriorScene {
                constructor(name) { super('shop'); }
            }
            class BarnScene extends InteriorScene {
                constructor(name) { super('barn'); }
            }
            
            this.engine.sceneManager.registerScene('House', HouseScene);
            this.engine.sceneManager.registerScene('Shop', ShopScene);
            this.engine.sceneManager.registerScene('Barn', BarnScene);
            
            // Start with Farm scene
            this.engine.sceneManager.transitionToScene('Farm');
            
            console.log('Scenes initialized and Farm scene loaded');
        } catch (error) {
            console.error('Failed to setup scenes:', error);
            // Try to at least register the Farm scene
            try {
                this.engine.sceneManager.registerScene('Farm', FarmScene);
                this.engine.sceneManager.transitionToScene('Farm');
                console.log('Fallback: Farm scene loaded only');
            } catch (fallbackError) {
                console.error('Critical: Failed to load even Farm scene:', fallbackError);
            }
        }
    }

    start() {
        if (!this.isInitialized) {
            console.error('Game not initialized');
            return;
        }

        this.engine.start();
        console.log('Game started');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// Initialize and start the game when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();
    
    // Listen for critical game errors
    window.addEventListener('gameError', (event) => {
        game.showError(event.detail.message);
    });
    
    // Listen for assets loaded event to show game container
    window.addEventListener('assetsLoaded', (event) => {
        console.log('assetsLoaded event received, transitioning to game');
        
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        const { loaded, failed, timeout, error } = event.detail;
        if (timeout) {
            console.warn('Assets loaded with timeout - some assets may be missing');
        } else if (error) {
            console.warn('Assets loaded with errors - some assets may be missing');
        } else {
            console.log(`Assets loaded successfully: ${loaded} loaded, ${failed} failed`);
        }
        
        // Add a small delay to ensure DOM is ready, then transition
        setTimeout(() => {
            if (loadingScreen) {
                // Force hide loading screen completely
                loadingScreen.style.display = 'none';
                loadingScreen.style.visibility = 'hidden';
                loadingScreen.style.opacity = '0';
                loadingScreen.style.zIndex = '-1';
                console.log('Loading screen hidden');
            }
            
            if (gameContainer) {
                // Force show game container 
                gameContainer.style.display = 'flex';
                gameContainer.style.visibility = 'visible';
                gameContainer.style.opacity = '1';
                gameContainer.style.zIndex = '1';
                console.log('Game container shown');
            }
            
            console.log('Game container now visible, starting game');
        }, 100); // Small delay to ensure smooth transition
    });
    
    // Add debug mode toggle (press F1 to toggle debug info)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F1') {
            event.preventDefault();
            const isDebug = localStorage.getItem('debug_mode') === 'true';
            localStorage.setItem('debug_mode', (!isDebug).toString());
            console.log(`Debug mode ${!isDebug ? 'enabled' : 'disabled'}`);
        }
    });
    
    // Show loading screen (it's visible by default in HTML)
    console.log('Starting game initialization...');
    
    // Emergency fallback - force start the game after 15 seconds no matter what
    const emergencyTimeout = setTimeout(() => {
        console.warn('Emergency timeout reached - forcing game to start');
        
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen) {
            // Force hide loading screen completely
            loadingScreen.style.display = 'none';
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.opacity = '0';
            loadingScreen.style.zIndex = '-1';
        }
        
        if (gameContainer) {
            // Force show game container 
            gameContainer.style.display = 'flex';
            gameContainer.style.visibility = 'visible';
            gameContainer.style.opacity = '1';
            gameContainer.style.zIndex = '1';
        }
        
        // If we have a game instance, try to start it
        if (window.harvestMoonGame && window.harvestMoonGame.engine) {
            window.harvestMoonGame.start();
        }
    }, 15000); // 15 second emergency timeout
    
    // Additional failsafe - if loading screen is still visible after 5 seconds, force hide it
    const loadingFailsafe = setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            console.warn('Loading screen still visible after 5 seconds - forcing transition');
            
            // Force hide loading screen
            loadingScreen.style.display = 'none';
            loadingScreen.style.visibility = 'hidden';
            loadingScreen.style.opacity = '0';
            loadingScreen.style.zIndex = '-1';
            
            // Force show game container 
            if (gameContainer) {
                gameContainer.style.display = 'flex';
                gameContainer.style.visibility = 'visible';
                gameContainer.style.opacity = '1';
                gameContainer.style.zIndex = '1';
            }
        }
    }, 5000); // 5 second failsafe
    
    // Store game instance globally for emergency timeout
    window.harvestMoonGame = game;
    
    try {
        await game.init();
        game.start();
        clearTimeout(emergencyTimeout); // Cancel emergency timeout on success
        clearTimeout(loadingFailsafe); // Cancel failsafe timeout on success
    } catch (error) {
        clearTimeout(emergencyTimeout);
        clearTimeout(loadingFailsafe);
        console.error('Critical game initialization error:', error);
        
        // Force show the game container even if init fails
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        
        // Show error message
        game.showError('Game failed to initialize properly. Some features may not work.');
        
        // Try to start anyway
        if (game.engine) {
            game.start();
        }
    }
});