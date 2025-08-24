// Individual recipe entity for cooking system
// Handles recipe requirements, cooking mechanics, and result generation

export class Recipe {
    constructor(recipeId, recipeData) {
        this.recipeId = recipeId;
        this.name = recipeData.name;
        this.description = recipeData.description;
        this.category = recipeData.category || 'basic';
        this.difficulty = recipeData.difficulty || 1;
        
        // Ingredient requirements
        this.ingredients = recipeData.ingredients || [];
        this.requiredTool = recipeData.requiredTool || 'stove';
        this.cookingTime = recipeData.cookingTime || 5000; // milliseconds
        
        // Recipe result
        this.result = {
            itemType: recipeData.result?.itemType || 'food',
            name: recipeData.result?.name || this.name,
            staminaRestore: recipeData.result?.staminaRestore || 20,
            healthRestore: recipeData.result?.healthRestore || 0,
            value: recipeData.result?.value || 10,
            quality: recipeData.result?.quality || 'normal',
            buffs: recipeData.result?.buffs || []
        };
        
        // Unlock requirements
        this.unlockRequirements = {
            cookingLevel: recipeData.unlockRequirements?.cookingLevel || 1,
            requiredRecipes: recipeData.unlockRequirements?.requiredRecipes || [],
            requiredItems: recipeData.unlockRequirements?.requiredItems || []
        };
        
        // Visual properties
        this.sprite = recipeData.sprite || `recipe_${recipeId}`;
        this.resultSprite = recipeData.resultSprite || `food_${recipeId}`;
        
        console.log(`Created recipe: ${this.name}`);
    }
    
    // Check if player can cook this recipe
    canCook(inventory, cookingLevel = 1, unlockedRecipes = []) {
        // Check cooking level requirement
        if (cookingLevel < this.unlockRequirements.cookingLevel) {
            return {
                canCook: false,
                reason: 'level_too_low',
                message: `Requires cooking level ${this.unlockRequirements.cookingLevel}`
            };
        }
        
        // Check required recipes
        for (const requiredRecipe of this.unlockRequirements.requiredRecipes) {
            if (!unlockedRecipes.includes(requiredRecipe)) {
                return {
                    canCook: false,
                    reason: 'recipe_required',
                    message: `Must learn ${requiredRecipe} recipe first`
                };
            }
        }
        
        // Check required items (special ingredients)
        for (const requiredItem of this.unlockRequirements.requiredItems) {
            if (!inventory.hasItem(requiredItem.type, requiredItem.amount || 1)) {
                return {
                    canCook: false,
                    reason: 'missing_special_item',
                    message: `Requires ${requiredItem.amount || 1}x ${requiredItem.type}`
                };
            }
        }
        
        // Check ingredients availability
        const missingIngredients = this.getMissingIngredients(inventory);
        if (missingIngredients.length > 0) {
            return {
                canCook: false,
                reason: 'missing_ingredients',
                message: `Missing: ${missingIngredients.map(ing => `${ing.needed}x ${ing.type}`).join(', ')}`,
                missingIngredients
            };
        }
        
        return { canCook: true };
    }
    
    // Get missing ingredients for this recipe
    getMissingIngredients(inventory) {
        const missing = [];
        
        for (const ingredient of this.ingredients) {
            const available = inventory.getItemCount(ingredient.type) || 0;
            const needed = ingredient.amount;
            
            if (available < needed) {
                missing.push({
                    type: ingredient.type,
                    needed: needed - available,
                    available: available,
                    required: needed
                });
            }
        }
        
        return missing;
    }
    
    // Consume ingredients from inventory
    consumeIngredients(inventory) {
        const consumed = [];
        
        for (const ingredient of this.ingredients) {
            const success = inventory.removeItem(ingredient.type, ingredient.amount);
            if (success) {
                consumed.push({
                    type: ingredient.type,
                    amount: ingredient.amount
                });
            } else {
                // Rollback consumed ingredients if any failure
                for (const consumedIngredient of consumed) {
                    inventory.addItem(consumedIngredient.type, consumedIngredient.amount);
                }
                return { success: false, consumed: [] };
            }
        }
        
        return { success: true, consumed };
    }
    
    // Calculate cooking result based on skill and quality
    calculateResult(cookingLevel = 1, perfectTiming = false) {
        let result = { ...this.result };
        
        // Apply cooking skill bonuses
        const skillMultiplier = 1 + (cookingLevel - 1) * 0.1;
        result.staminaRestore = Math.round(result.staminaRestore * skillMultiplier);
        result.healthRestore = Math.round(result.healthRestore * skillMultiplier);
        result.value = Math.round(result.value * skillMultiplier);
        
        // Apply perfect timing bonus
        if (perfectTiming) {
            result.staminaRestore = Math.round(result.staminaRestore * 1.3);
            result.healthRestore = Math.round(result.healthRestore * 1.3);
            result.value = Math.round(result.value * 1.5);
            result.quality = this.upgradeQuality(result.quality);
            
            // Add perfect cooking buff
            result.buffs = [...result.buffs, {
                type: 'energy_boost',
                duration: 300000, // 5 minutes
                effect: 0.2 // 20% stamina regeneration boost
            }];
        }
        
        // Apply recipe difficulty bonus
        if (this.difficulty > 1) {
            const difficultyBonus = 1 + (this.difficulty - 1) * 0.15;
            result.staminaRestore = Math.round(result.staminaRestore * difficultyBonus);
            result.value = Math.round(result.value * difficultyBonus);
        }
        
        return result;
    }
    
    // Upgrade quality level
    upgradeQuality(currentQuality) {
        const qualityLevels = ['poor', 'normal', 'good', 'excellent', 'perfect'];
        const currentIndex = qualityLevels.indexOf(currentQuality);
        
        if (currentIndex < qualityLevels.length - 1) {
            return qualityLevels[currentIndex + 1];
        }
        
        return currentQuality;
    }
    
    // Get recipe information for UI display
    getRecipeInfo() {
        return {
            recipeId: this.recipeId,
            name: this.name,
            description: this.description,
            category: this.category,
            difficulty: this.difficulty,
            ingredients: this.ingredients.map(ing => ({
                type: ing.type,
                amount: ing.amount,
                name: this.getIngredientName(ing.type)
            })),
            requiredTool: this.requiredTool,
            cookingTime: this.cookingTime,
            result: {
                ...this.result,
                name: this.result.name
            },
            unlockRequirements: this.unlockRequirements
        };
    }
    
    // Get display name for ingredient
    getIngredientName(ingredientType) {
        const ingredientNames = {
            // Crops
            'turnip': 'Turnip',
            'potato': 'Potato',
            'carrot': 'Carrot',
            'corn': 'Corn',
            'tomato': 'Tomato',
            
            // Fish
            'minnow': 'Minnow',
            'trout': 'Trout',
            'bass': 'Bass',
            'salmon': 'Salmon',
            
            // Animal products
            'milk': 'Milk',
            'egg': 'Egg',
            'cheese': 'Cheese',
            'butter': 'Butter',
            
            // Basic ingredients
            'flour': 'Flour',
            'sugar': 'Sugar',
            'salt': 'Salt',
            'oil': 'Oil',
            'herbs': 'Herbs',
            'spices': 'Spices',
            
            // Processed ingredients
            'bread': 'Bread',
            'pasta': 'Pasta'
        };
        
        return ingredientNames[ingredientType] || ingredientType;
    }
    
    // Create recipe result item
    createResultItem(cookingLevel = 1, perfectTiming = false) {
        const result = this.calculateResult(cookingLevel, perfectTiming);
        
        return {
            type: 'food',
            subType: this.recipeId,
            name: result.name,
            description: this.description,
            staminaRestore: result.staminaRestore,
            healthRestore: result.healthRestore,
            value: result.value,
            quality: result.quality,
            buffs: result.buffs,
            sprite: this.resultSprite,
            craftedBy: 'cooking',
            recipeId: this.recipeId,
            difficulty: this.difficulty
        };
    }
    
    // Serialize recipe data for saving
    serialize() {
        return {
            recipeId: this.recipeId,
            name: this.name,
            category: this.category,
            difficulty: this.difficulty
        };
    }
    
    // Get cooking experience gained from this recipe
    getCookingExperience(perfectTiming = false) {
        let experience = this.difficulty * 10;
        
        if (perfectTiming) {
            experience *= 1.5;
        }
        
        return Math.round(experience);
    }
    
    // Create recipe database with all available recipes
    static createRecipeDatabase() {
        return {
            // Basic recipes
            'baked_potato': {
                name: 'Baked Potato',
                description: 'A simple baked potato with crispy skin',
                category: 'basic',
                difficulty: 1,
                ingredients: [
                    { type: 'potato', amount: 1 }
                ],
                requiredTool: 'oven',
                cookingTime: 3000,
                result: {
                    itemType: 'food',
                    name: 'Baked Potato',
                    staminaRestore: 25,
                    healthRestore: 5,
                    value: 15
                },
                unlockRequirements: {
                    cookingLevel: 1
                }
            },
            
            'grilled_fish': {
                name: 'Grilled Fish',
                description: 'Freshly grilled fish with herbs',
                category: 'basic',
                difficulty: 2,
                ingredients: [
                    { type: 'trout', amount: 1 },
                    { type: 'herbs', amount: 1 }
                ],
                requiredTool: 'grill',
                cookingTime: 4000,
                result: {
                    itemType: 'food',
                    name: 'Grilled Fish',
                    staminaRestore: 35,
                    healthRestore: 10,
                    value: 30
                },
                unlockRequirements: {
                    cookingLevel: 1
                }
            },
            
            'vegetable_soup': {
                name: 'Vegetable Soup',
                description: 'A hearty soup made with fresh vegetables',
                category: 'soup',
                difficulty: 2,
                ingredients: [
                    { type: 'carrot', amount: 2 },
                    { type: 'potato', amount: 1 },
                    { type: 'herbs', amount: 1 }
                ],
                requiredTool: 'stove',
                cookingTime: 6000,
                result: {
                    itemType: 'food',
                    name: 'Vegetable Soup',
                    staminaRestore: 40,
                    healthRestore: 15,
                    value: 25,
                    buffs: [
                        { type: 'warmth', duration: 180000, effect: 0.1 }
                    ]
                },
                unlockRequirements: {
                    cookingLevel: 2
                }
            },
            
            'fish_stew': {
                name: 'Fish Stew',
                description: 'A rich stew with fresh fish and vegetables',
                category: 'stew',
                difficulty: 3,
                ingredients: [
                    { type: 'salmon', amount: 1 },
                    { type: 'potato', amount: 2 },
                    { type: 'carrot', amount: 1 },
                    { type: 'herbs', amount: 1 }
                ],
                requiredTool: 'stove',
                cookingTime: 8000,
                result: {
                    itemType: 'food',
                    name: 'Fish Stew',
                    staminaRestore: 60,
                    healthRestore: 25,
                    value: 50,
                    buffs: [
                        { type: 'satiation', duration: 300000, effect: 0.15 }
                    ]
                },
                unlockRequirements: {
                    cookingLevel: 3,
                    requiredRecipes: ['grilled_fish', 'vegetable_soup']
                }
            },
            
            'corn_bread': {
                name: 'Corn Bread',
                description: 'Sweet and fluffy bread made with corn',
                category: 'baking',
                difficulty: 3,
                ingredients: [
                    { type: 'corn', amount: 2 },
                    { type: 'flour', amount: 1 },
                    { type: 'milk', amount: 1 },
                    { type: 'egg', amount: 1 }
                ],
                requiredTool: 'oven',
                cookingTime: 10000,
                result: {
                    itemType: 'food',
                    name: 'Corn Bread',
                    staminaRestore: 45,
                    healthRestore: 20,
                    value: 40,
                    buffs: [
                        { type: 'comfort_food', duration: 240000, effect: 0.2 }
                    ]
                },
                unlockRequirements: {
                    cookingLevel: 3
                }
            },
            
            'supreme_feast': {
                name: 'Supreme Feast',
                description: 'An elaborate dish combining the finest ingredients',
                category: 'advanced',
                difficulty: 5,
                ingredients: [
                    { type: 'salmon', amount: 1 },
                    { type: 'corn', amount: 2 },
                    { type: 'tomato', amount: 2 },
                    { type: 'cheese', amount: 1 },
                    { type: 'herbs', amount: 2 },
                    { type: 'spices', amount: 1 }
                ],
                requiredTool: 'advanced_stove',
                cookingTime: 15000,
                result: {
                    itemType: 'food',
                    name: 'Supreme Feast',
                    staminaRestore: 100,
                    healthRestore: 50,
                    value: 150,
                    quality: 'excellent',
                    buffs: [
                        { type: 'master_chef', duration: 600000, effect: 0.3 },
                        { type: 'well_fed', duration: 600000, effect: 0.25 }
                    ]
                },
                unlockRequirements: {
                    cookingLevel: 5,
                    requiredRecipes: ['fish_stew', 'corn_bread'],
                    requiredItems: [
                        { type: 'golden_spice', amount: 1 }
                    ]
                }
            }
        };
    }
}