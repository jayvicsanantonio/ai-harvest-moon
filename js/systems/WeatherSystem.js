// Weather system managing weather patterns, rain effects, and crop interaction
// Handles weather state transitions, visual effects, and automatic crop watering

export class WeatherSystem {
    constructor() {
        this.gameEngine = null;
        this.currentWeather = 'sunny';
        this.weatherDuration = 0;
        this.weatherTimer = 0;
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 2000; // 2 seconds transition
        
        // Weather state definitions
        this.weatherTypes = {
            sunny: {
                name: 'Sunny',
                duration: { min: 240, max: 480 }, // 4-8 minutes in real time
                probability: 0.6,
                effects: {
                    lightLevel: 1.0,
                    cropWatering: false,
                    visibility: 1.0
                },
                visual: {
                    skyTint: '#87CEEB',
                    particles: null,
                    overlay: null
                },
                audio: {
                    ambient: 'ambient_birds',
                    volume: 0.3
                }
            },
            cloudy: {
                name: 'Cloudy',
                duration: { min: 180, max: 360 }, // 3-6 minutes
                probability: 0.25,
                effects: {
                    lightLevel: 0.7,
                    cropWatering: false,
                    visibility: 0.9
                },
                visual: {
                    skyTint: '#778899',
                    particles: null,
                    overlay: 'clouds'
                },
                audio: {
                    ambient: 'ambient_wind',
                    volume: 0.2
                }
            },
            rainy: {
                name: 'Rainy',
                duration: { min: 120, max: 300 }, // 2-5 minutes
                probability: 0.15,
                effects: {
                    lightLevel: 0.5,
                    cropWatering: true,
                    visibility: 0.6
                },
                visual: {
                    skyTint: '#2F4F4F',
                    particles: 'rain',
                    overlay: 'rain_overlay'
                },
                audio: {
                    ambient: 'ambient_rain',
                    volume: 0.5
                }
            }
        };
        
        // Weather transition rules
        this.weatherTransitions = {
            sunny: ['cloudy', 'rainy'],
            cloudy: ['sunny', 'rainy'],
            rainy: ['cloudy', 'sunny']
        };
        
        // Rain particle system
        this.rainParticles = [];
        this.maxRainParticles = 150;
        this.rainIntensity = 1.0;
        
        // Weather effects state
        this.effects = {
            skyTint: '#87CEEB',
            lightLevel: 1.0,
            visibility: 1.0,
            particles: null,
            overlay: null
        };
        
        // Callbacks for other systems
        this.callbacks = {
            onWeatherChange: [],
            onRainStart: [],
            onRainEnd: []
        };
        
        // Performance tracking
        this.stats = {
            particlesActive: 0,
            lastWeatherChange: 0,
            totalRainTime: 0
        };
    }
    
    init(gameEngine) {
        this.gameEngine = gameEngine;
        
        // Set initial weather
        this.setWeather('sunny', true);
        
        // Initialize rain particle pool
        this.initializeRainParticles();
        
        console.log('WeatherSystem initialized with initial weather:', this.currentWeather);
    }
    
    initializeRainParticles() {
        this.rainParticles = [];
        for (let i = 0; i < this.maxRainParticles; i++) {
            this.rainParticles.push({
                x: 0,
                y: 0,
                velocityY: 0,
                active: false,
                opacity: 0
            });
        }
    }
    
    update(deltaTime) {
        if (!this.gameEngine) return;
        
        // Update weather timer
        this.weatherTimer += deltaTime;
        
        // Handle weather transitions
        if (this.isTransitioning) {
            this.updateTransition(deltaTime);
        } else {
            // Check if current weather should end
            if (this.weatherTimer >= this.weatherDuration) {
                this.startWeatherTransition();
            }
        }
        
        // Update weather effects
        this.updateWeatherEffects(deltaTime);
        
        // Update rain particles if active
        if (this.effects.particles === 'rain') {
            this.updateRainParticles(deltaTime);
        }
        
        // Apply weather effects to crops
        this.applyWeatherEffects();
    }
    
    updateTransition(deltaTime) {
        this.transitionTimer += deltaTime;
        
        if (this.transitionTimer >= this.transitionDuration) {
            // Transition complete
            this.isTransitioning = false;
            this.transitionTimer = 0;
            
            console.log(`Weather transition complete: ${this.currentWeather}`);
        }
    }
    
    startWeatherTransition() {
        const nextWeather = this.selectNextWeather();
        
        this.isTransitioning = true;
        this.transitionTimer = 0;
        
        // Trigger transition callbacks
        this.triggerCallbacks('onWeatherChange', {
            from: this.currentWeather,
            to: nextWeather,
            isTransitioning: true
        });
        
        this.setWeather(nextWeather);
    }
    
    selectNextWeather() {
        const possibleWeathers = this.weatherTransitions[this.currentWeather];
        const seasonalWeather = this.getSeasonalWeatherBias();
        
        // Apply seasonal bias to weather selection
        let weightedOptions = [];
        
        for (const weather of possibleWeathers) {
            const baseProb = this.weatherTypes[weather].probability;
            const seasonalMultiplier = seasonalWeather[weather] || 1.0;
            const finalWeight = baseProb * seasonalMultiplier;
            
            for (let i = 0; i < Math.floor(finalWeight * 100); i++) {
                weightedOptions.push(weather);
            }
        }
        
        return weightedOptions[Math.floor(Math.random() * weightedOptions.length)] || 'sunny';
    }
    
    getSeasonalWeatherBias() {
        if (!this.gameEngine?.seasonalSystem) {
            return { sunny: 1.0, cloudy: 1.0, rainy: 1.0 };
        }
        
        const currentSeason = this.gameEngine.seasonalSystem.currentSeason;
        
        const seasonalBias = {
            SPRING: { sunny: 0.8, cloudy: 1.2, rainy: 1.5 },
            SUMMER: { sunny: 1.5, cloudy: 0.8, rainy: 0.5 },
            AUTUMN: { sunny: 1.0, cloudy: 1.3, rainy: 1.2 },
            WINTER: { sunny: 0.6, cloudy: 1.4, rainy: 0.8 }
        };
        
        return seasonalBias[currentSeason] || { sunny: 1.0, cloudy: 1.0, rainy: 1.0 };
    }
    
    setWeather(weatherType, immediate = false) {
        if (!this.weatherTypes[weatherType]) {
            console.warn(`Unknown weather type: ${weatherType}`);
            return;
        }
        
        const previousWeather = this.currentWeather;
        this.currentWeather = weatherType;
        this.weatherTimer = 0;
        
        const weather = this.weatherTypes[weatherType];
        
        // Set weather duration
        this.weatherDuration = (Math.random() * 
            (weather.duration.max - weather.duration.min) + 
            weather.duration.min) * 1000; // Convert to milliseconds
        
        // Update visual effects
        this.effects.skyTint = weather.visual.skyTint;
        this.effects.lightLevel = weather.effects.lightLevel;
        this.effects.visibility = weather.effects.visibility;
        this.effects.particles = weather.visual.particles;
        this.effects.overlay = weather.visual.overlay;
        
        // Handle rain-specific effects
        if (weatherType === 'rainy' && previousWeather !== 'rainy') {
            this.startRain();
            this.triggerCallbacks('onRainStart', { weather: weatherType });
        } else if (weatherType !== 'rainy' && previousWeather === 'rainy') {
            this.stopRain();
            this.triggerCallbacks('onRainEnd', { weather: weatherType });
        }
        
        // Update rain intensity based on weather
        if (weatherType === 'rainy') {
            this.rainIntensity = 1.0;
        } else {
            this.rainIntensity = 0.0;
        }
        
        this.stats.lastWeatherChange = Date.now();
        
        if (!immediate) {
            console.log(`Weather changed to ${weather.name} for ${Math.round(this.weatherDuration / 1000)}s`);
        }
        
        // Trigger weather change callbacks
        this.triggerCallbacks('onWeatherChange', {
            weather: weatherType,
            effects: this.effects,
            immediate
        });
    }
    
    startRain() {
        // Activate rain particles
        for (const particle of this.rainParticles) {
            if (Math.random() < 0.7) { // Not all particles active at once
                this.resetRainParticle(particle);
            }
        }
        
        console.log('Rain started - automatic crop watering enabled');
    }
    
    stopRain() {
        // Gradually fade out rain particles
        for (const particle of this.rainParticles) {
            particle.active = false;
        }
        
        console.log('Rain stopped');
    }
    
    updateRainParticles(deltaTime) {
        if (!this.gameEngine?.renderSystem?.camera) return;
        
        const camera = this.gameEngine.renderSystem.camera;
        const screenWidth = this.gameEngine.canvas.width;
        const screenHeight = this.gameEngine.canvas.height;
        
        this.stats.particlesActive = 0;
        
        for (const particle of this.rainParticles) {
            if (!particle.active) continue;
            
            // Update particle position
            particle.y += particle.velocityY * (deltaTime / 16.67); // Normalize for 60fps
            
            // Reset particle if it goes off screen
            if (particle.y > camera.y + screenHeight + 50) {
                this.resetRainParticle(particle);
            }
            
            // Check collision with ground tiles and objects
            this.checkRainParticleCollision(particle);
            
            this.stats.particlesActive++;
        }
        
        // Spawn new particles based on intensity
        const spawnRate = this.rainIntensity * 3; // particles per frame
        for (let i = 0; i < spawnRate; i++) {
            this.spawnRainParticle(camera, screenWidth, screenHeight);
        }
    }
    
    resetRainParticle(particle) {
        if (!this.gameEngine?.renderSystem?.camera) return;
        
        const camera = this.gameEngine.renderSystem.camera;
        const screenWidth = this.gameEngine.canvas.width;
        
        particle.x = camera.x + (Math.random() * (screenWidth + 100)) - 50;
        particle.y = camera.y - 50;
        particle.velocityY = 400 + Math.random() * 200; // 400-600 pixels per second
        particle.active = true;
        particle.opacity = 0.3 + Math.random() * 0.4; // 0.3-0.7 opacity
    }
    
    spawnRainParticle(camera, screenWidth, screenHeight) {
        // Find inactive particle to reuse
        for (const particle of this.rainParticles) {
            if (!particle.active) {
                this.resetRainParticle(particle);
                break;
            }
        }
    }
    
    checkRainParticleCollision(particle) {
        if (!this.gameEngine?.collisionSystem) return;
        
        // Convert particle world position to tile coordinates
        const tileX = Math.floor(particle.x / 32);
        const tileY = Math.floor(particle.y / 32);
        
        // Check for solid tiles or objects at particle position
        const collision = this.gameEngine.collisionSystem.getTileCollision(tileX, tileY);
        
        if (collision && collision.solid) {
            // Create splash effect and reset particle
            this.createSplashEffect(particle.x, particle.y);
            particle.active = false;
        }
        
        // Also check if particle reached ground level (for open areas)
        const groundLevel = tileY * 32 + 24; // Near bottom of tile
        if (particle.y >= groundLevel) {
            // Check if there's no solid tile - create ground splash
            if (!collision || !collision.solid) {
                this.createSplashEffect(particle.x, particle.y);
            }
            particle.active = false;
        }
    }
    
    createSplashEffect(x, y) {
        // Simple splash effect - could be expanded with particle system
        if (Math.random() < 0.1) { // Only create splash for some particles
            console.log(`Rain splash at ${Math.round(x)}, ${Math.round(y)}`);
            
            // Future: Create visual splash particles
            // Future: Play splash sound effect
            // this.gameEngine.assetManager?.playAudio('sfx_rain_splash');
        }
    }
    
    updateWeatherEffects(deltaTime) {
        // Apply weather effects to render system
        if (this.gameEngine?.renderSystem) {
            this.gameEngine.renderSystem.setWeatherEffects({
                skyTint: this.effects.skyTint,
                lightLevel: this.effects.lightLevel,
                visibility: this.effects.visibility
            });
        }
    }
    
    applyWeatherEffects() {
        // Automatic crop watering during rain
        if (this.currentWeather === 'rainy' && this.gameEngine?.farmingSystem) {
            this.waterAllCrops();
            this.stats.totalRainTime += 16.67; // Approximate frame time
        }
    }
    
    waterAllCrops() {
        const farmingSystem = this.gameEngine.farmingSystem;
        if (!farmingSystem.crops) return;
        
        let cropsWatered = 0;
        
        for (const [posKey, crop] of farmingSystem.crops.entries()) {
            if (!crop.isWatered && crop.stage !== 'ready') {
                crop.isWatered = true;
                crop.lastWatered = Date.now();
                cropsWatered++;
            }
        }
        
        if (cropsWatered > 0) {
            console.log(`Rain watered ${cropsWatered} crops automatically`);
        }
    }
    
    renderWeatherEffects(renderSystem) {
        // Render sky tint overlay
        this.renderSkyOverlay(renderSystem);
        
        // Render rain particles
        if (this.effects.particles === 'rain') {
            this.renderRainParticles(renderSystem);
        }
        
        // Render weather overlay effects
        if (this.effects.overlay) {
            this.renderWeatherOverlay(renderSystem);
        }
    }
    
    renderSkyOverlay(renderSystem) {
        const canvas = this.gameEngine.canvas;
        const overlayAlpha = this.isTransitioning ? 
            0.1 + (this.transitionTimer / this.transitionDuration) * 0.2 : 0.3;
        
        renderSystem.ctx.save();
        renderSystem.ctx.fillStyle = this.effects.skyTint;
        renderSystem.ctx.globalAlpha = overlayAlpha;
        renderSystem.ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderSystem.ctx.restore();
    }
    
    renderRainParticles(renderSystem) {
        renderSystem.ctx.save();
        renderSystem.ctx.strokeStyle = '#B0C4DE';
        renderSystem.ctx.lineWidth = 1;
        renderSystem.ctx.globalAlpha = this.effects.visibility;
        
        const camera = renderSystem.camera;
        
        for (const particle of this.rainParticles) {
            if (!particle.active) continue;
            
            const screenX = particle.x - camera.x;
            const screenY = particle.y - camera.y;
            
            renderSystem.ctx.globalAlpha = particle.opacity * this.effects.visibility;
            renderSystem.ctx.beginPath();
            renderSystem.ctx.moveTo(screenX, screenY);
            renderSystem.ctx.lineTo(screenX, screenY + 8);
            renderSystem.ctx.stroke();
        }
        
        renderSystem.ctx.restore();
    }
    
    renderWeatherOverlay(renderSystem) {
        if (this.effects.overlay === 'clouds') {
            this.renderCloudOverlay(renderSystem);
        } else if (this.effects.overlay === 'rain_overlay') {
            this.renderRainOverlay(renderSystem);
        }
    }
    
    renderCloudOverlay(renderSystem) {
        const canvas = this.gameEngine.canvas;
        
        renderSystem.ctx.save();
        renderSystem.ctx.fillStyle = '#DCDCDC';
        renderSystem.ctx.globalAlpha = 0.15;
        renderSystem.ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderSystem.ctx.restore();
    }
    
    renderRainOverlay(renderSystem) {
        const canvas = this.gameEngine.canvas;
        
        renderSystem.ctx.save();
        renderSystem.ctx.fillStyle = '#4682B4';
        renderSystem.ctx.globalAlpha = 0.1;
        renderSystem.ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderSystem.ctx.restore();
    }
    
    // Event system for weather callbacks
    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }
    
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index > -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }
    
    triggerCallbacks(eventType, data) {
        if (this.callbacks[eventType]) {
            for (const callback of this.callbacks[eventType]) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in weather callback ${eventType}:`, error);
                }
            }
        }
    }
    
    // Public API methods
    getCurrentWeather() {
        return {
            type: this.currentWeather,
            name: this.weatherTypes[this.currentWeather].name,
            effects: this.effects,
            timeRemaining: this.weatherDuration - this.weatherTimer,
            isTransitioning: this.isTransitioning
        };
    }
    
    forceWeatherChange(weatherType) {
        if (this.weatherTypes[weatherType]) {
            this.setWeather(weatherType);
            console.log(`Forced weather change to: ${weatherType}`);
        }
    }
    
    getWeatherStats() {
        return {
            ...this.stats,
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration,
            timeRemaining: this.weatherDuration - this.weatherTimer
        };
    }
    
    // Debug methods
    renderDebug(renderSystem) {
        if (!this.gameEngine.isDebugMode()) return;
        
        const weather = this.getCurrentWeather();
        let yOffset = 140;
        
        renderSystem.drawText(
            `Weather: ${weather.name} (${Math.round(weather.timeRemaining / 1000)}s remaining)`,
            10, yOffset, { color: '#ffff00', layer: 1000 }
        );
        yOffset += 15;
        
        renderSystem.drawText(
            `Light: ${(weather.effects.lightLevel * 100).toFixed(0)}% | Rain Particles: ${this.stats.particlesActive}`,
            10, yOffset, { color: '#ffff00', layer: 1000 }
        );
        
        if (weather.isTransitioning) {
            yOffset += 15;
            renderSystem.drawText(
                `Transitioning... ${Math.round((this.transitionTimer / this.transitionDuration) * 100)}%`,
                10, yOffset, { color: '#ff8800', layer: 1000 }
            );
        }
    }
}