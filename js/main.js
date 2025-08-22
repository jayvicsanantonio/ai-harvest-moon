// Main entry point for Harvest Moon web game
// Initializes game engine and starts the main game loop

import { GameEngine } from './engine/GameEngine.js';
import { FarmScene } from './scenes/FarmScene.js';

class Game {
    constructor() {
        this.engine = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            const canvas = document.getElementById('game-canvas');
            if (!canvas) {
                throw new Error('Game canvas not found');
            }

            this.engine = new GameEngine(canvas);
            await this.engine.init();

            const farmScene = new FarmScene();
            this.engine.setScene(farmScene);
            
            this.isInitialized = true;
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to start game. Please refresh and try again.');
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
    
    // Add debug mode toggle (press F1 to toggle debug info)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'F1') {
            event.preventDefault();
            const isDebug = localStorage.getItem('debug_mode') === 'true';
            localStorage.setItem('debug_mode', (!isDebug).toString());
            console.log(`Debug mode ${!isDebug ? 'enabled' : 'disabled'}`);
        }
    });
    
    await game.init();
    game.start();
});