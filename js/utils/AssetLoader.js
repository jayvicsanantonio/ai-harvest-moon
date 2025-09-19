// Asset loading utility for setting up game assets
// Configures and loads all required game resources

export class AssetLoader {
    constructor(assetManager) {
        this.assetManager = assetManager;
    }
    
    // Queue all game assets for loading
    queueGameAssets() {
        this.queuePlayerAssets();
        this.queueAnimalAssets();
        this.queueNPCAssets();
        this.queueEnvironmentAssets();
        this.queueUIAssets();
        this.queueAudioAssets();
        this.queueGameData();
    }
    
    queuePlayerAssets() {
        // Player sprites (using placeholder colored rectangles for now)
        // In a real game, these would be actual sprite files
        
        // Player sprites - AssetManager automatically adds basePath './assets/'
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
    
    queueAnimalAssets() {
        // Cow sprites - all directions
        this.assetManager.queueSprite('cow_idle_down', 'sprites/animals/cow_down.png');
        this.assetManager.queueSprite('cow_idle_up', 'sprites/animals/cow_up.png');
        this.assetManager.queueSprite('cow_idle_left', 'sprites/animals/cow_left.png');
        this.assetManager.queueSprite('cow_idle_right', 'sprites/animals/cow_right.png');
        
        // Chicken sprites - all directions
        this.assetManager.queueSprite('chicken_idle_down', 'sprites/animals/chicken_down.png');
        this.assetManager.queueSprite('chicken_idle_up', 'sprites/animals/chicken_up.png');
        this.assetManager.queueSprite('chicken_idle_left', 'sprites/animals/chicken_left.png');
        this.assetManager.queueSprite('chicken_idle_right', 'sprites/animals/chicken_right.png');
        
        // Sheep sprites - all directions
        this.assetManager.queueSprite('sheep_idle_down', 'sprites/animals/sheep_down.png');
        this.assetManager.queueSprite('sheep_idle_up', 'sprites/animals/sheep_up.png');
        this.assetManager.queueSprite('sheep_idle_left', 'sprites/animals/sheep_left.png');
        this.assetManager.queueSprite('sheep_idle_right', 'sprites/animals/sheep_right.png');
    }
    
    queueNPCAssets() {
        // Farmer woman NPC - all directions
        this.assetManager.queueSprite('npc_farmer_woman_down', 'sprites/npcs/farmer_woman_down.png');
        this.assetManager.queueSprite('npc_farmer_woman_up', 'sprites/npcs/farmer_woman_up.png');
        this.assetManager.queueSprite('npc_farmer_woman_left', 'sprites/npcs/farmer_woman_left.png');
        this.assetManager.queueSprite('npc_farmer_woman_right', 'sprites/npcs/farmer_woman_right.png');
        
        // Additional NPCs can be added here as needed
        this.assetManager.queueSprite('npc_merchant_down', 'sprites/npcs/merchant_down.png');
        this.assetManager.queueSprite('npc_merchant_up', 'sprites/npcs/merchant_up.png');
        this.assetManager.queueSprite('npc_merchant_left', 'sprites/npcs/merchant_left.png');
        this.assetManager.queueSprite('npc_merchant_right', 'sprites/npcs/merchant_right.png');
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
        
        // Rock types
        this.assetManager.queueSprite('rock_limestone', 'sprites/rocks/rock_large.png');
        this.assetManager.queueSprite('rock_small_stone', 'sprites/rocks/rock_small.png');
        this.assetManager.queueSprite('rock_iron_ore', 'sprites/rocks/rock_medium.png');
        this.assetManager.queueSprite('rock_gold_ore', 'sprites/rocks/rock_large.png');
        this.assetManager.queueSprite('rock_crystal_formation', 'sprites/rocks/rock_large.png');
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
        this.assetManager.queueSprite('fishing_rod', 'sprites/tools/fishing_rod.png');
        
        // Fish sprites
        this.assetManager.queueSprite('fish_bass', 'sprites/fish/fish_bass.png');
        this.assetManager.queueSprite('fish_carp', 'sprites/fish/fish_carp.png');
        this.assetManager.queueSprite('fish_salmon', 'sprites/fish/fish_salmon.png');
        this.assetManager.queueSprite('fish_trout', 'sprites/fish/fish_trout.png');
        
        // Specific crop growth stages
        this.assetManager.queueSprite('parsnip_seedling', 'sprites/crops/parsnip_seedling.png');
        this.assetManager.queueSprite('parsnip_young', 'sprites/crops/parsnip_young.png');
        this.assetManager.queueSprite('parsnip_mature', 'sprites/crops/parsnip_mature.png');
        this.assetManager.queueSprite('parsnip_ready', 'sprites/crops/parsnip_ready.png');
        
        this.assetManager.queueSprite('potato_seedling', 'sprites/crops/potato_seedling.png');
        this.assetManager.queueSprite('potato_young', 'sprites/crops/potato_young.png');
        this.assetManager.queueSprite('potato_mature', 'sprites/crops/potato_mature.png');
        this.assetManager.queueSprite('potato_ready', 'sprites/crops/potato_ready.png');
        
        this.assetManager.queueSprite('turnip_seedling', 'sprites/crops/turnip_seedling.png');
        this.assetManager.queueSprite('turnip_young', 'sprites/crops/turnip_young.png');
        this.assetManager.queueSprite('turnip_mature', 'sprites/crops/turnip_mature.png');
        this.assetManager.queueSprite('turnip_ready', 'sprites/crops/turnip_ready.png');
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
        this.assetManager.queueSprite('icon_fish', 'sprites/icons/fish.png');
        this.assetManager.queueSprite('icon_mineral', 'sprites/icons/mineral.png');
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
        console.log('Setting up asset loading callbacks');
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
        
        // Emit event for game to continue
        console.log('Dispatching assetsLoaded event');
        window.dispatchEvent(new CustomEvent('assetsLoaded', {
            detail: { loaded, failed }
        }));
        
        console.log('assetsLoaded event dispatched successfully');
    }
    
    onLoadError(assetId, error) {
        console.warn(`Failed to load asset: ${assetId}`, error);
        // Asset manager will use fallbacks automatically
    }
    
    // Load all queued assets
    async loadAll() {
        console.log('AssetLoader.loadAll() called');
        this.setupCallbacks();
        console.log('About to call assetManager.loadAll()');
        await this.assetManager.loadAll();
        console.log('assetManager.loadAll() completed');
    }
    
    // Preload only critical assets
    async preloadCritical() {
        this.setupCallbacks();
        await this.assetManager.preloadCritical();
    }
}