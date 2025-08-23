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
            await this.assetLoader.loadAll();
            
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
        this.engine.sceneManager.registerScene('Farm', FarmScene);
        this.engine.sceneManager.registerScene('Village', VillageScene);
        this.engine.sceneManager.registerScene('House', () => new InteriorScene('house'));
        this.engine.sceneManager.registerScene('Shop', () => new InteriorScene('shop'));
        this.engine.sceneManager.registerScene('Barn', () => new InteriorScene('barn'));
        
        // Start with Farm scene
        this.engine.sceneManager.transitionToScene('Farm');
        
        console.log('Scenes initialized and Farm scene loaded');
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
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }
        console.log('Assets loaded, showing game container');
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
    
    await game.init();
    game.start();
});