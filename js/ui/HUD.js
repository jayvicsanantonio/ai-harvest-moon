// Heads-Up Display for showing game information
// Displays time, stamina, current tool, and other important stats

export class HUD {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.isVisible = true;
        
        // HUD layout configuration
        this.padding = 10;
        this.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.textColor = '#ffffff';
        this.fontSize = 14;
        this.smallFontSize = 12;
        
        // HUD sections
        this.sections = {
            timePanel: { x: 0, y: 0, width: 200, height: 80 },
            staminaPanel: { x: 0, y: 0, width: 150, height: 30 },
            toolPanel: { x: 0, y: 0, width: 200, height: 50 },
            statusPanel: { x: 0, y: 0, width: 180, height: 40 }
        };
        
        // Animation states
        this.animations = {
            staminaFlash: false,
            staminaFlashTime: 0,
            timeUpdate: false,
            timeUpdateTime: 0
        };
        
        console.log('HUD initialized');
    }
    
    // Update HUD layout based on canvas size
    updateLayout() {
        if (!this.gameEngine?.renderSystem) return;
        
        const canvas = this.gameEngine.renderSystem.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Position panels
        // Time panel - top left
        this.sections.timePanel.x = this.padding;
        this.sections.timePanel.y = this.padding;
        
        // Stamina panel - top right
        this.sections.staminaPanel.x = canvasWidth - this.sections.staminaPanel.width - this.padding;
        this.sections.staminaPanel.y = this.padding;
        
        // Tool panel - bottom left
        this.sections.toolPanel.x = this.padding;
        this.sections.toolPanel.y = canvasHeight - this.sections.toolPanel.height - this.padding;
        
        // Status panel - bottom right
        this.sections.statusPanel.x = canvasWidth - this.sections.statusPanel.width - this.padding;
        this.sections.statusPanel.y = canvasHeight - this.sections.statusPanel.height - this.padding;
    }
    
    // Update HUD animations and state
    update(deltaTime) {
        // Update stamina flash animation
        if (this.animations.staminaFlash) {
            this.animations.staminaFlashTime += deltaTime;
            if (this.animations.staminaFlashTime >= 1000) { // Flash for 1 second
                this.animations.staminaFlash = false;
                this.animations.staminaFlashTime = 0;
            }
        }
        
        // Update time change animation
        if (this.animations.timeUpdate) {
            this.animations.timeUpdateTime += deltaTime;
            if (this.animations.timeUpdateTime >= 500) { // Highlight for 0.5 seconds
                this.animations.timeUpdate = false;
                this.animations.timeUpdateTime = 0;
            }
        }
        
        // Check for low stamina to trigger flash
        this.checkStaminaWarning();
    }
    
    // Check if player stamina is low
    checkStaminaWarning() {
        const player = this.getCurrentPlayer();
        if (!player || !this.gameEngine.staminaSystem) return;
        
        const currentStamina = this.gameEngine.staminaSystem.getStamina(player.entityId);
        const maxStamina = this.gameEngine.staminaSystem.getMaxStamina(player.entityId);
        
        if (currentStamina / maxStamina < 0.2 && !this.animations.staminaFlash) {
            this.triggerStaminaFlash();
        }
    }
    
    // Trigger stamina warning flash
    triggerStaminaFlash() {
        this.animations.staminaFlash = true;
        this.animations.staminaFlashTime = 0;
    }
    
    // Trigger time update highlight
    triggerTimeUpdate() {
        this.animations.timeUpdate = true;
        this.animations.timeUpdateTime = 0;
    }
    
    // Render the complete HUD
    render(renderSystem) {
        if (!this.isVisible || !renderSystem) return;
        
        this.updateLayout();
        
        // Render each HUD section
        this.renderTimePanel(renderSystem);
        this.renderStaminaPanel(renderSystem);
        this.renderToolPanel(renderSystem);
        this.renderStatusPanel(renderSystem);
        
        // Render debug info if enabled
        if (this.gameEngine.isDebugMode()) {
            this.renderDebugPanel(renderSystem);
        }
    }
    
    // Render time and date panel
    renderTimePanel(renderSystem) {
        const section = this.sections.timePanel;
        
        if (!this.gameEngine.timeSystem) return;
        
        const timeData = this.gameEngine.timeSystem.getTimeData();
        
        // Background
        renderSystem.drawRect(
            section.x, section.y, section.width, section.height,
            this.backgroundColor, { layer: 200 }
        );
        
        // Border (highlight if time updated recently)
        const borderColor = this.animations.timeUpdate ? '#ffff00' : '#555555';
        renderSystem.drawRect(
            section.x - 1, section.y - 1, section.width + 2, section.height + 2,
            borderColor, { alpha: 0.8, layer: 199 }
        );
        
        // Time display
        renderSystem.drawText(
            timeData.formattedTime,
            section.x + this.padding, section.y + this.padding + 2,
            { 
                color: this.textColor, 
                fontSize: this.fontSize + 2, 
                layer: 201 
            }
        );
        
        // Date display
        renderSystem.drawText(
            timeData.formattedDate,
            section.x + this.padding, section.y + this.padding + 25,
            { 
                color: '#cccccc', 
                fontSize: this.smallFontSize, 
                layer: 201 
            }
        );
        
        // Phase display
        renderSystem.drawText(
            timeData.phaseName,
            section.x + this.padding, section.y + this.padding + 45,
            { 
                color: this.getPhaseColor(timeData.phase), 
                fontSize: this.smallFontSize, 
                layer: 201 
            }
        );
        
        // Weather indicator
        if (this.gameEngine.weatherSystem) {
            const weather = this.gameEngine.weatherSystem.getCurrentWeather();
            const weatherDisplay = this.getWeatherDisplay(weather.type);
            
            renderSystem.drawText(
                `${weatherDisplay.icon} ${weatherDisplay.text}`,
                section.x + this.padding, section.y + this.padding + 62,
                { 
                    color: weatherDisplay.color, 
                    fontSize: this.smallFontSize, 
                    layer: 201 
                }
            );
        }
    }
    
    // Render stamina bar and info
    renderStaminaPanel(renderSystem) {
        const section = this.sections.staminaPanel;
        const player = this.getCurrentPlayer();
        
        if (!player || !this.gameEngine.staminaSystem) return;
        
        const currentStamina = this.gameEngine.staminaSystem.getStamina(player.entityId);
        const maxStamina = this.gameEngine.staminaSystem.getMaxStamina(player.entityId);
        const staminaPercent = currentStamina / maxStamina;
        
        // Background
        const bgColor = this.animations.staminaFlash && 
                       Math.floor(this.animations.staminaFlashTime / 200) % 2 === 0 ? 
                       'rgba(255, 0, 0, 0.8)' : this.backgroundColor;
        
        renderSystem.drawRect(
            section.x, section.y, section.width, section.height,
            bgColor, { layer: 200 }
        );
        
        // Border
        renderSystem.drawRect(
            section.x - 1, section.y - 1, section.width + 2, section.height + 2,
            '#555555', { alpha: 0.8, layer: 199 }
        );
        
        // Stamina label
        renderSystem.drawText(
            'Stamina',
            section.x + this.padding, section.y + this.padding,
            { 
                color: this.textColor, 
                fontSize: this.smallFontSize, 
                layer: 201 
            }
        );
        
        // Stamina bar background
        const barWidth = section.width - (this.padding * 2);
        const barHeight = 8;
        const barY = section.y + this.padding + 12;
        
        renderSystem.drawRect(
            section.x + this.padding, barY, barWidth, barHeight,
            '#333333', { layer: 201 }
        );
        
        // Stamina bar fill
        const fillWidth = barWidth * staminaPercent;
        const staminaColor = staminaPercent > 0.5 ? '#4CAF50' : 
                           staminaPercent > 0.2 ? '#FFC107' : '#F44336';
        
        renderSystem.drawRect(
            section.x + this.padding, barY, fillWidth, barHeight,
            staminaColor, { layer: 202 }
        );
        
        // Stamina text
        renderSystem.drawText(
            `${Math.floor(currentStamina)}/${Math.floor(maxStamina)}`,
            section.x + section.width - this.padding, section.y + this.padding,
            { 
                color: this.textColor, 
                fontSize: this.smallFontSize, 
                textAlign: 'right',
                layer: 201 
            }
        );
    }
    
    // Render current tool and seed info
    renderToolPanel(renderSystem) {
        const section = this.sections.toolPanel;
        const player = this.getCurrentPlayer();
        
        if (!player) return;
        
        // Background
        renderSystem.drawRect(
            section.x, section.y, section.width, section.height,
            this.backgroundColor, { layer: 200 }
        );
        
        // Border
        renderSystem.drawRect(
            section.x - 1, section.y - 1, section.width + 2, section.height + 2,
            '#555555', { alpha: 0.8, layer: 199 }
        );
        
        // Current tool
        renderSystem.drawText(
            `Tool: ${player.currentTool || 'None'}`,
            section.x + this.padding, section.y + this.padding,
            { 
                color: this.textColor, 
                fontSize: this.smallFontSize, 
                layer: 201 
            }
        );
        
        // Tool durability (if applicable)
        if (player.tools && player.currentTool) {
            const tool = player.tools.get(player.currentTool);
            if (tool && tool.durability !== undefined) {
                const durabilityPercent = tool.durability / 100; // Assuming max 100
                const durabilityColor = durabilityPercent > 0.5 ? '#4CAF50' : 
                                      durabilityPercent > 0.2 ? '#FFC107' : '#F44336';
                
                renderSystem.drawText(
                    `Durability: ${Math.floor(tool.durability)}%`,
                    section.x + this.padding, section.y + this.padding + 15,
                    { 
                        color: durabilityColor, 
                        fontSize: this.smallFontSize, 
                        layer: 201 
                    }
                );
            }
        }
        
        // Current seed type
        if (player.currentSeed) {
            const seedCount = player.inventory?.getItemCount(`${player.currentSeed}_seeds`) || 0;
            
            renderSystem.drawText(
                `Seeds: ${player.currentSeed} (${seedCount})`,
                section.x + this.padding, section.y + this.padding + 30,
                { 
                    color: seedCount > 0 ? '#90EE90' : '#FF6B6B', 
                    fontSize: this.smallFontSize, 
                    layer: 201 
                }
            );
        }
    }
    
    // Render general status information
    renderStatusPanel(renderSystem) {
        const section = this.sections.statusPanel;
        const player = this.getCurrentPlayer();
        
        if (!player) return;
        
        // Background
        renderSystem.drawRect(
            section.x, section.y, section.width, section.height,
            this.backgroundColor, { layer: 200 }
        );
        
        // Border
        renderSystem.drawRect(
            section.x - 1, section.y - 1, section.width + 2, section.height + 2,
            '#555555', { alpha: 0.8, layer: 199 }
        );
        
        // Money display
        renderSystem.drawText(
            `Money: ${player.money || 0}G`,
            section.x + this.padding, section.y + this.padding,
            { 
                color: '#FFD700', 
                fontSize: this.smallFontSize, 
                layer: 201 
            }
        );
        
        // Inventory info
        if (player.inventory) {
            const stats = player.inventory.getStats();
            renderSystem.drawText(
                `Items: ${stats.usedSlots}/${player.inventory.capacity}`,
                section.x + this.padding, section.y + this.padding + 15,
                { 
                    color: stats.usedSlots >= player.inventory.capacity ? '#FF6B6B' : '#ffffff', 
                    fontSize: this.smallFontSize, 
                    layer: 201 
                }
            );
        }
    }
    
    // Render debug information panel
    renderDebugPanel(renderSystem) {
        if (!this.gameEngine.renderSystem) return;
        
        const canvas = this.gameEngine.renderSystem.canvas;
        const debugX = canvas.width - 300;
        const debugY = 100;
        
        // Background
        renderSystem.drawRect(
            debugX, debugY, 280, 120,
            'rgba(0, 0, 0, 0.9)', { layer: 250 }
        );
        
        // Debug info
        let yOffset = debugY + 15;
        const debugColor = '#00ff00';
        
        if (this.gameEngine.timeSystem) {
            const timeData = this.gameEngine.timeSystem.getTimeData();
            renderSystem.drawText(
                `Light Level: ${(timeData.lightLevel * 100).toFixed(1)}%`,
                debugX + 10, yOffset, { color: debugColor, fontSize: 11, layer: 251 }
            );
            yOffset += 15;
            
            renderSystem.drawText(
                `Time Scale: ${this.gameEngine.timeSystem.timeScale}x`,
                debugX + 10, yOffset, { color: debugColor, fontSize: 11, layer: 251 }
            );
            yOffset += 15;
        }
        
        // FPS and performance
        renderSystem.drawText(
            `FPS: ${this.gameEngine.getFPS()}`,
            debugX + 10, yOffset, { color: debugColor, fontSize: 11, layer: 251 }
        );
        yOffset += 15;
        
        // System status
        renderSystem.drawText(
            `Systems: ${this.gameEngine.systems.size} active`,
            debugX + 10, yOffset, { color: debugColor, fontSize: 11, layer: 251 }
        );
    }
    
    // Get color for time phase
    getPhaseColor(phase) {
        const colors = {
            'DAWN': '#FFA500',      // Orange
            'MORNING': '#FFD700',   // Gold
            'AFTERNOON': '#FFFF00', // Yellow
            'EVENING': '#FF4500',   // Orange Red
            'NIGHT': '#4169E1',     // Royal Blue
            'LATE_NIGHT': '#191970' // Midnight Blue
        };
        
        return colors[phase] || '#ffffff';
    }
    
    // Get current player reference
    getCurrentPlayer() {
        const currentScene = this.gameEngine.sceneManager?.getCurrentScene();
        if (!currentScene) return null;
        
        // Find player entity in current scene
        return currentScene.entities?.find(entity => entity.constructor.name === 'Player') || null;
    }
    
    // Get weather display information
    getWeatherDisplay(weatherType) {
        const weatherDisplays = {
            sunny: {
                icon: '☀️',
                text: 'Sunny',
                color: '#ffff00'
            },
            cloudy: {
                icon: '☁️',
                text: 'Cloudy', 
                color: '#cccccc'
            },
            rainy: {
                icon: '🌧️',
                text: 'Rainy',
                color: '#4682b4'
            }
        };
        
        return weatherDisplays[weatherType] || {
            icon: '?',
            text: 'Unknown',
            color: '#ffffff'
        };
    }
    
    // Show/hide HUD
    show() {
        this.isVisible = true;
    }
    
    hide() {
        this.isVisible = false;
    }
    
    toggle() {
        this.isVisible = !this.isVisible;
    }
    
    // Handle input for HUD interactions
    handleInput(inputManager) {
        // Toggle HUD with H key
        if (inputManager.isKeyPressed('KeyH')) {
            this.toggle();
        }
        
        // Time controls in debug mode
        if (this.gameEngine.isDebugMode()) {
            // Speed up time with + key
            if (inputManager.isKeyPressed('Equal')) {
                const newScale = Math.min(5, this.gameEngine.timeSystem.timeScale + 0.5);
                this.gameEngine.timeSystem.setTimeScale(newScale);
            }
            
            // Slow down time with - key
            if (inputManager.isKeyPressed('Minus')) {
                const newScale = Math.max(0.1, this.gameEngine.timeSystem.timeScale - 0.5);
                this.gameEngine.timeSystem.setTimeScale(newScale);
            }
            
            // Pause time with P key
            if (inputManager.isKeyPressed('KeyP')) {
                this.gameEngine.timeSystem.togglePause();
            }
        }
    }
}