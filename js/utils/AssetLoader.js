// Asset loading utility for setting up game assets
// Configures and loads all required game resources

export class AssetLoader {
    constructor(assetManager) {
        this.assetManager = assetManager;
    }
    
    // Queue all game assets for loading
    queueGameAssets() {
        this.queuePlayerAssets();
        this.queueEnvironmentAssets();
        this.queueUIAssets();
        this.queueAudioAssets();
        this.queueGameData();
    }
    
    queuePlayerAssets() {
        // Player sprites (using placeholder colored rectangles for now)
        // In a real game, these would be actual sprite files
        
        // These will use fallback colored rectangles since files don't exist yet
        this.assetManager.queueSprite('player_idle_down', 'sprites/player/idle_down.png', { priority: 'high' });
        this.assetManager.queueSprite('player_idle_up', 'sprites/player/idle_up.png', { priority: 'high' });
        this.assetManager.queueSprite('player_idle_left', 'sprites/player/idle_left.png', { priority: 'high' });
        this.assetManager.queueSprite('player_idle_right', 'sprites/player/idle_right.png', { priority: 'high' });
        
        this.assetManager.queueSprite('player_walk_down_1', 'sprites/player/walk_down_1.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_down_2', 'sprites/player/walk_down_2.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_down_3', 'sprites/player/walk_down_3.png', { priority: 'high' });
        
        this.assetManager.queueSprite('player_walk_up_1', 'sprites/player/walk_up_1.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_up_2', 'sprites/player/walk_up_2.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_up_3', 'sprites/player/walk_up_3.png', { priority: 'high' });
        
        this.assetManager.queueSprite('player_walk_left_1', 'sprites/player/walk_left_1.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_left_2', 'sprites/player/walk_left_2.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_left_3', 'sprites/player/walk_left_3.png', { priority: 'high' });
        
        this.assetManager.queueSprite('player_walk_right_1', 'sprites/player/walk_right_1.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_right_2', 'sprites/player/walk_right_2.png', { priority: 'high' });
        this.assetManager.queueSprite('player_walk_right_3', 'sprites/player/walk_right_3.png', { priority: 'high' });
    }
    
    queueEnvironmentAssets() {
        // Environment tiles
        this.assetManager.queueSprite('grass_tile', 'sprites/environment/grass.png');
        this.assetManager.queueSprite('dirt_tile', 'sprites/environment/dirt.png');
        this.assetManager.queueSprite('farmland_tile', 'sprites/environment/farmland.png');
        this.assetManager.queueSprite('water_tile', 'sprites/environment/water.png');
        this.assetManager.queueSprite('stone_tile', 'sprites/environment/stone.png');
        
        // Objects
        this.assetManager.queueSprite('tree', 'sprites/objects/tree.png');
        this.assetManager.queueSprite('rock', 'sprites/objects/rock.png');
        this.assetManager.queueSprite('fence', 'sprites/objects/fence.png');
        this.assetManager.queueSprite('house', 'sprites/buildings/house.png');
        this.assetManager.queueSprite('barn', 'sprites/buildings/barn.png');
        
        // Crops
        this.assetManager.queueSprite('crop_stage_1', 'sprites/crops/stage_1.png');
        this.assetManager.queueSprite('crop_stage_2', 'sprites/crops/stage_2.png');
        this.assetManager.queueSprite('crop_stage_3', 'sprites/crops/stage_3.png');
        this.assetManager.queueSprite('crop_stage_4', 'sprites/crops/stage_4.png');
        
        // Tools
        this.assetManager.queueSprite('hoe', 'sprites/tools/hoe.png');
        this.assetManager.queueSprite('watering_can', 'sprites/tools/watering_can.png');
        this.assetManager.queueSprite('axe', 'sprites/tools/axe.png');
        this.assetManager.queueSprite('pickaxe', 'sprites/tools/pickaxe.png');
    }
    
    queueUIAssets() {
        // UI elements
        this.assetManager.queueSprite('ui_panel', 'sprites/ui/panel.png');
        this.assetManager.queueSprite('ui_button', 'sprites/ui/button.png');
        this.assetManager.queueSprite('ui_slot', 'sprites/ui/inventory_slot.png');
        this.assetManager.queueSprite('ui_health_bar', 'sprites/ui/health_bar.png');
        this.assetManager.queueSprite('ui_stamina_bar', 'sprites/ui/stamina_bar.png');
        
        // Icons
        this.assetManager.queueSprite('icon_seed', 'sprites/icons/seed.png');
        this.assetManager.queueSprite('icon_crop', 'sprites/icons/crop.png');
        this.assetManager.queueSprite('icon_tool', 'sprites/icons/tool.png');
    }
    
    queueAudioAssets() {
        // Music
        this.assetManager.queueAudio('bgm_farm', 'audio/music/farm_theme.ogg', { 
            loop: true, 
            volume: 0.6,
            preload: 'auto'
        });
        this.assetManager.queueAudio('bgm_village', 'audio/music/village_theme.ogg', { 
            loop: true, 
            volume: 0.6 
        });
        
        // Sound effects
        this.assetManager.queueAudio('sfx_footstep', 'audio/sfx/footstep.wav', { volume: 0.4 });
        this.assetManager.queueAudio('sfx_tool_use', 'audio/sfx/tool_use.wav', { volume: 0.5 });
        this.assetManager.queueAudio('sfx_plant', 'audio/sfx/plant.wav', { volume: 0.5 });
        this.assetManager.queueAudio('sfx_harvest', 'audio/sfx/harvest.wav', { volume: 0.5 });
        this.assetManager.queueAudio('sfx_water', 'audio/sfx/water.wav', { volume: 0.4 });
        this.assetManager.queueAudio('sfx_menu_select', 'audio/sfx/menu_select.wav', { volume: 0.3 });
        this.assetManager.queueAudio('sfx_menu_confirm', 'audio/sfx/menu_confirm.wav', { volume: 0.3 });
    }
    
    queueGameData() {
        // Game configuration data
        this.assetManager.queueData('crops_config', 'data/crops.json');
        this.assetManager.queueData('tools_config', 'data/tools.json');
        this.assetManager.queueData('npcs_config', 'data/npcs.json');
        this.assetManager.queueData('seasons_config', 'data/seasons.json');
        this.assetManager.queueData('recipes_config', 'data/recipes.json');
    }
    
    // Set up asset loading callbacks
    setupCallbacks() {
        this.assetManager.setCallbacks({
            onProgress: (progress, loaded, total) => {
                this.onLoadProgress(progress, loaded, total);
            },
            onComplete: (loaded, failed) => {
                this.onLoadComplete(loaded, failed);
            },
            onError: (assetId, error) => {
                this.onLoadError(assetId, error);
            }
        });
    }
    
    onLoadProgress(progress, loaded, total) {
        console.log(`Loading assets: ${Math.round(progress * 100)}% (${loaded}/${total})`);
        
        // Update loading screen if it exists
        const loadingBar = document.getElementById('loading-progress');
        if (loadingBar) {
            loadingBar.style.width = `${progress * 100}%`;
        }
        
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = `Loading... ${loaded}/${total}`;
        }
    }
    
    onLoadComplete(loaded, failed) {
        console.log(`Asset loading complete: ${loaded} loaded, ${failed} failed`);
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Emit event for game to continue
        window.dispatchEvent(new CustomEvent('assetsLoaded', {
            detail: { loaded, failed }
        }));
    }
    
    onLoadError(assetId, error) {
        console.warn(`Failed to load asset: ${assetId}`, error);
        // Asset manager will use fallbacks automatically
    }
    
    // Load all queued assets
    async loadAll() {
        this.setupCallbacks();
        await this.assetManager.loadAll();
    }
    
    // Preload only critical assets
    async preloadCritical() {
        this.setupCallbacks();
        await this.assetManager.preloadCritical();
    }
}