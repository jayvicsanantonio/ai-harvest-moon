// Achievement system managing milestone tracking, rewards, and player progression recognition
// Handles achievement unlocking, progress tracking, and reward distribution

export class AchievementSystem {
    constructor() {
        this.gameEngine = null;
        this.isActive = false;
        
        // Achievement management
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.achievementProgress = new Map();
        
        // Achievement categories
        this.categories = new Map();
        
        // Recent unlocks for UI display
        this.recentUnlocks = [];
        this.showAchievementPopup = false;
        this.currentPopup = null;
        
        // Progress tracking for various game systems
        this.statistics = {
            // Farming stats
            cropsPlanted: 0,
            cropsHarvested: 0,
            cropsWatered: 0,
            goldCropsHarvested: 0,
            
            // Animal stats
            animalsPetted: 0,
            animalsFed: 0,
            animalProductsCollected: 0,
            
            // Activity stats
            fishCaught: 0,
            rocksMinedTotal: 0,
            foodsCooked: 0,
            
            // Social stats
            giftsGiven: 0,
            dialoguesCompleted: 0,
            friendshipsFormed: 0,
            
            // Progression stats
            toolsUpgraded: 0,
            buildingsUpgraded: 0,
            daysPlayed: 0,
            totalPlayTime: 0,
            goldEarned: 0,
            goldSpent: 0
        };
        
        console.log('AchievementSystem initialized');
    }
    
    // Initialize achievement system
    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.createAchievementCategories();
        this.createAchievements();
        this.isActive = true;
    }
    
    // Create achievement categories
    createAchievementCategories() {
        this.categories.set('farming', {
            name: 'Farming',
            description: 'Achievements related to crop cultivation',
            icon: '🌱',
            color: '#4CAF50'
        });
        
        this.categories.set('animals', {
            name: 'Animal Care',
            description: 'Achievements for animal husbandry',
            icon: '🐄',
            color: '#8BC34A'
        });
        
        this.categories.set('activities', {
            name: 'Activities',
            description: 'Fishing, mining, and cooking achievements',
            icon: '🎣',
            color: '#2196F3'
        });
        
        this.categories.set('social', {
            name: 'Social',
            description: 'Relationships and community achievements',
            icon: '👥',
            color: '#FF9800'
        });
        
        this.categories.set('progression', {
            name: 'Progression',
            description: 'Upgrades and advancement achievements',
            icon: '📈',
            color: '#9C27B0'
        });
        
        this.categories.set('special', {
            name: 'Special',
            description: 'Unique and rare achievements',
            icon: '⭐',
            color: '#FFD700'
        });
    }
    
    // Create all achievements
    createAchievements() {
        // Farming achievements
        this.createAchievement('first_plant', {
            name: 'First Steps',
            description: 'Plant your first crop',
            category: 'farming',
            condition: { type: 'counter', stat: 'cropsPlanted', target: 1 },
            reward: { type: 'item', item: 'turnip_seeds', amount: 5 }
        });
        
        this.createAchievement('green_thumb', {
            name: 'Green Thumb',
            description: 'Harvest 50 crops',
            category: 'farming',
            condition: { type: 'counter', stat: 'cropsHarvested', target: 50 },
            reward: { type: 'gold', amount: 1000 }
        });
        
        this.createAchievement('master_farmer', {
            name: 'Master Farmer',
            description: 'Harvest 500 crops',
            category: 'farming',
            condition: { type: 'counter', stat: 'cropsHarvested', target: 500 },
            reward: { type: 'item', item: 'quality_fertilizer', amount: 20 }
        });
        
        this.createAchievement('gold_standard', {
            name: 'Gold Standard',
            description: 'Harvest 100 gold-quality crops',
            category: 'farming',
            condition: { type: 'counter', stat: 'goldCropsHarvested', target: 100 },
            reward: { type: 'gold', amount: 5000 }
        });
        
        // Animal achievements
        this.createAchievement('animal_lover', {
            name: 'Animal Lover',
            description: 'Pet an animal for the first time',
            category: 'animals',
            condition: { type: 'counter', stat: 'animalsPetted', target: 1 },
            reward: { type: 'item', item: 'hay', amount: 10 }
        });
        
        this.createAchievement('caretaker', {
            name: 'Dedicated Caretaker',
            description: 'Feed animals 100 times',
            category: 'animals',
            condition: { type: 'counter', stat: 'animalsFed', target: 100 },
            reward: { type: 'gold', amount: 2000 }
        });
        
        this.createAchievement('rancher', {
            name: 'Successful Rancher',
            description: 'Collect 200 animal products',
            category: 'animals',
            condition: { type: 'counter', stat: 'animalProductsCollected', target: 200 },
            reward: { type: 'item', item: 'cheese_press', amount: 1 }
        });
        
        // Activity achievements
        this.createAchievement('first_catch', {
            name: 'First Catch',
            description: 'Catch your first fish',
            category: 'activities',
            condition: { type: 'counter', stat: 'fishCaught', target: 1 },
            reward: { type: 'item', item: 'bait', amount: 20 }
        });
        
        this.createAchievement('angler', {
            name: 'Skilled Angler',
            description: 'Catch 100 fish',
            category: 'activities',
            condition: { type: 'counter', stat: 'fishCaught', target: 100 },
            reward: { type: 'item', item: 'advanced_fishing_rod', amount: 1 }
        });
        
        this.createAchievement('miner', {
            name: 'Rock Breaker',
            description: 'Mine 50 rocks',
            category: 'activities',
            condition: { type: 'counter', stat: 'rocksMinedTotal', target: 50 },
            reward: { type: 'gold', amount: 1500 }
        });
        
        this.createAchievement('chef', {
            name: 'Home Chef',
            description: 'Cook 25 meals',
            category: 'activities',
            condition: { type: 'counter', stat: 'foodsCooked', target: 25 },
            reward: { type: 'item', item: 'recipe_book', amount: 1 }
        });
        
        // Social achievements
        this.createAchievement('friendly', {
            name: 'Friendly Neighbor',
            description: 'Give 10 gifts to villagers',
            category: 'social',
            condition: { type: 'counter', stat: 'giftsGiven', target: 10 },
            reward: { type: 'gold', amount: 800 }
        });
        
        this.createAchievement('socialite', {
            name: 'Village Socialite',
            description: 'Complete 50 conversations',
            category: 'social',
            condition: { type: 'counter', stat: 'dialoguesCompleted', target: 50 },
            reward: { type: 'item', item: 'friendship_bracelet', amount: 1 }
        });
        
        this.createAchievement('best_friend', {
            name: 'Best Friend Forever',
            description: 'Form a close friendship with a villager',
            category: 'social',
            condition: { type: 'counter', stat: 'friendshipsFormed', target: 1 },
            reward: { type: 'gold', amount: 2500 }
        });
        
        // Progression achievements
        this.createAchievement('upgrader', {
            name: 'Tool Improver',
            description: 'Upgrade your first tool',
            category: 'progression',
            condition: { type: 'counter', stat: 'toolsUpgraded', target: 1 },
            reward: { type: 'item', item: 'copper_ore', amount: 10 }
        });
        
        this.createAchievement('builder', {
            name: 'Master Builder',
            description: 'Upgrade a building',
            category: 'progression',
            condition: { type: 'counter', stat: 'buildingsUpgraded', target: 1 },
            reward: { type: 'gold', amount: 3000 }
        });
        
        this.createAchievement('wealthy', {
            name: 'Wealthy Farmer',
            description: 'Earn 50,000 gold total',
            category: 'progression',
            condition: { type: 'counter', stat: 'goldEarned', target: 50000 },
            reward: { type: 'item', item: 'golden_statue', amount: 1 }
        });
        
        // Special achievements
        this.createAchievement('veteran', {
            name: 'Farm Veteran',
            description: 'Play for 100 days',
            category: 'special',
            condition: { type: 'counter', stat: 'daysPlayed', target: 100 },
            reward: { type: 'title', title: 'Veteran Farmer' }
        });
        
        this.createAchievement('completionist', {
            name: 'Achievement Hunter',
            description: 'Unlock 75% of all achievements',
            category: 'special',
            condition: { type: 'percentage', stat: 'achievementsUnlocked', target: 0.75 },
            reward: { type: 'title', title: 'Achievement Master' }
        });
        
        console.log(`Created ${this.achievements.size} achievements across ${this.categories.size} categories`);
    }
    
    // Create an achievement
    createAchievement(id, achievementData) {
        const achievement = {
            id,
            name: achievementData.name,
            description: achievementData.description,
            category: achievementData.category,
            condition: achievementData.condition,
            reward: achievementData.reward,
            hidden: achievementData.hidden || false,
            unlocked: false,
            unlockedTime: null,
            progress: 0
        };
        
        this.achievements.set(id, achievement);
        this.achievementProgress.set(id, 0);
    }
    
    // Update statistic and check achievements
    updateStatistic(statName, value, mode = 'increment') {
        if (mode === 'increment') {
            this.statistics[statName] = (this.statistics[statName] || 0) + value;
        } else if (mode === 'set') {
            this.statistics[statName] = value;
        }
        
        // Check all achievements that might be affected by this statistic
        this.checkAchievementsForStat(statName);
    }
    
    // Check achievements for a specific statistic
    checkAchievementsForStat(statName) {
        for (const achievement of this.achievements.values()) {
            if (achievement.unlocked) continue;
            
            if (achievement.condition.stat === statName || 
                (achievement.condition.type === 'percentage' && statName === 'achievementsUnlocked')) {
                this.checkAchievementProgress(achievement);
            }
        }
    }
    
    // Check individual achievement progress
    checkAchievementProgress(achievement) {
        let progress = 0;
        let shouldUnlock = false;
        
        if (achievement.condition.type === 'counter') {
            const currentValue = this.statistics[achievement.condition.stat] || 0;
            progress = Math.min(1.0, currentValue / achievement.condition.target);
            shouldUnlock = currentValue >= achievement.condition.target;
        } else if (achievement.condition.type === 'percentage') {
            if (achievement.condition.stat === 'achievementsUnlocked') {
                const totalAchievements = this.achievements.size;
                const unlockedCount = this.unlockedAchievements.size;
                progress = Math.min(1.0, unlockedCount / totalAchievements);
                shouldUnlock = progress >= achievement.condition.target;
            }
        }
        
        // Update progress
        this.achievementProgress.set(achievement.id, progress);
        
        // Unlock if criteria met
        if (shouldUnlock && !achievement.unlocked) {
            this.unlockAchievement(achievement.id);
        }
    }
    
    // Unlock an achievement
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) return;
        
        achievement.unlocked = true;
        achievement.unlockedTime = Date.now();
        this.unlockedAchievements.add(achievementId);
        
        // Give reward
        this.giveAchievementReward(achievement.reward);
        
        // Add to recent unlocks for UI display
        this.recentUnlocks.push({
            achievement,
            timestamp: Date.now()
        });
        
        // Show popup
        this.showAchievementPopup = true;
        this.currentPopup = {
            achievement,
            showTime: Date.now(),
            duration: 5000 // 5 seconds
        };
        
        console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
        
        // Check for meta-achievements (like completionist)
        this.updateStatistic('achievementsUnlocked', this.unlockedAchievements.size, 'set');
    }
    
    // Give achievement reward
    giveAchievementReward(reward) {
        if (!reward) return;
        
        const player = this.gameEngine.getSystem('scene')?.currentScene?.player;
        const inventory = this.gameEngine.getSystem('tool')?.getInventory();
        
        switch (reward.type) {
            case 'gold':
                if (player && player.gold !== undefined) {
                    player.gold += reward.amount;
                    console.log(`💰 Received ${reward.amount} gold!`);
                }
                break;
                
            case 'item':
                if (inventory) {
                    inventory.addItem(reward.item, reward.amount);
                    console.log(`🎒 Received ${reward.amount}x ${reward.item}!`);
                }
                break;
                
            case 'title':
                console.log(`🎖️ Earned title: ${reward.title}!`);
                break;
        }
    }
    
    // Update achievement system
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update popup display
        if (this.showAchievementPopup && this.currentPopup) {
            const elapsed = Date.now() - this.currentPopup.showTime;
            if (elapsed >= this.currentPopup.duration) {
                this.showAchievementPopup = false;
                this.currentPopup = null;
            }
        }
        
        // Clean old recent unlocks (keep only last 10)
        if (this.recentUnlocks.length > 10) {
            this.recentUnlocks = this.recentUnlocks.slice(-10);
        }
    }
    
    // Get achievement progress for UI
    getAchievementProgress(achievementId) {
        return this.achievementProgress.get(achievementId) || 0;
    }
    
    // Get achievements by category
    getAchievementsByCategory(categoryId) {
        return Array.from(this.achievements.values())
            .filter(achievement => achievement.category === categoryId);
    }
    
    // Get unlocked achievements count
    getUnlockedCount() {
        return this.unlockedAchievements.size;
    }
    
    // Get total achievements count
    getTotalCount() {
        return this.achievements.size;
    }
    
    // Get completion percentage
    getCompletionPercentage() {
        return this.achievements.size > 0 ? (this.unlockedAchievements.size / this.achievements.size) * 100 : 0;
    }
    
    // Render achievement system UI
    render(renderSystem) {
        if (!renderSystem) return;
        
        // Render achievement popup if active
        if (this.showAchievementPopup && this.currentPopup) {
            this.renderAchievementPopup(renderSystem, this.currentPopup.achievement);
        }
    }
    
    // Render achievement unlock popup
    renderAchievementPopup(renderSystem, achievement) {
        const canvas = renderSystem.canvas;
        const centerX = canvas.width / 2;
        const popupY = 100;
        
        // Popup background
        renderSystem.drawRect(
            centerX - 200, popupY,
            400, 80,
            '#000000',
            { alpha: 0.9, layer: 20 }
        );
        
        // Border
        renderSystem.drawRect(
            centerX - 200, popupY,
            400, 80,
            '#FFD700',
            { alpha: 1.0, layer: 20, fill: false, strokeWidth: 3 }
        );
        
        // Achievement unlocked text
        renderSystem.drawText(
            '🏆 ACHIEVEMENT UNLOCKED!',
            centerX, popupY + 20,
            {
                font: '16px Arial',
                color: '#FFD700',
                align: 'center',
                layer: 21
            }
        );
        
        // Achievement name
        renderSystem.drawText(
            achievement.name,
            centerX, popupY + 40,
            {
                font: '14px Arial',
                color: '#ffffff',
                align: 'center',
                layer: 21
            }
        );
        
        // Achievement description
        renderSystem.drawText(
            achievement.description,
            centerX, popupY + 60,
            {
                font: '12px Arial',
                color: '#cccccc',
                align: 'center',
                layer: 21
            }
        );
    }
    
    // Get achievement statistics
    getStats() {
        return {
            totalAchievements: this.achievements.size,
            unlockedAchievements: this.unlockedAchievements.size,
            completionPercentage: this.getCompletionPercentage(),
            recentUnlocksCount: this.recentUnlocks.length,
            categoriesCount: this.categories.size,
            gameStatistics: { ...this.statistics }
        };
    }
    
    // Hook into game systems to track statistics
    connectToGameSystems() {
        // This would be called by individual systems to report events
        // For now, we'll update statistics manually when systems report events
    }
    
    // System event handlers (called by other systems)
    onCropPlanted() { this.updateStatistic('cropsPlanted', 1); }
    onCropHarvested(quality = 'normal') { 
        this.updateStatistic('cropsHarvested', 1);
        if (quality === 'gold' || quality === 'perfect') {
            this.updateStatistic('goldCropsHarvested', 1);
        }
    }
    onCropWatered() { this.updateStatistic('cropsWatered', 1); }
    onAnimalPetted() { this.updateStatistic('animalsPetted', 1); }
    onAnimalFed() { this.updateStatistic('animalsFed', 1); }
    onAnimalProductCollected() { this.updateStatistic('animalProductsCollected', 1); }
    onFishCaught() { this.updateStatistic('fishCaught', 1); }
    onRockMined() { this.updateStatistic('rocksMinedTotal', 1); }
    onFoodCooked() { this.updateStatistic('foodsCooked', 1); }
    onGiftGiven() { this.updateStatistic('giftsGiven', 1); }
    onDialogueCompleted() { this.updateStatistic('dialoguesCompleted', 1); }
    onFriendshipFormed() { this.updateStatistic('friendshipsFormed', 1); }
    onToolUpgraded() { this.updateStatistic('toolsUpgraded', 1); }
    onBuildingUpgraded() { this.updateStatistic('buildingsUpgraded', 1); }
    onDayPlayed() { this.updateStatistic('daysPlayed', 1); }
    onGoldEarned(amount) { this.updateStatistic('goldEarned', amount); }
    onGoldSpent(amount) { this.updateStatistic('goldSpent', amount); }
    
    // Serialize achievement system data for saving
    serialize() {
        const unlockedArray = Array.from(this.unlockedAchievements);
        const progressData = {};
        for (const [id, progress] of this.achievementProgress.entries()) {
            progressData[id] = progress;
        }
        
        return {
            unlockedAchievements: unlockedArray,
            achievementProgress: progressData,
            statistics: { ...this.statistics },
            recentUnlocks: this.recentUnlocks.slice(-5) // Keep only recent 5
        };
    }
    
    // Deserialize achievement system data from save
    deserialize(data, gameEngine) {
        if (data.unlockedAchievements) {
            this.unlockedAchievements = new Set(data.unlockedAchievements);
            
            // Mark achievements as unlocked
            for (const achievementId of data.unlockedAchievements) {
                const achievement = this.achievements.get(achievementId);
                if (achievement) {
                    achievement.unlocked = true;
                }
            }
        }
        
        if (data.achievementProgress) {
            this.achievementProgress.clear();
            for (const [id, progress] of Object.entries(data.achievementProgress)) {
                this.achievementProgress.set(id, progress);
            }
        }
        
        if (data.statistics) {
            this.statistics = { ...this.statistics, ...data.statistics };
        }
        
        if (data.recentUnlocks) {
            this.recentUnlocks = data.recentUnlocks;
        }
    }
}