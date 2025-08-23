// Inventory UI for displaying and managing player items
// Provides grid-based interface with drag-and-drop capabilities

export class InventoryUI {
    constructor(player) {
        this.player = player;
        this.isVisible = false;
        
        // UI settings
        this.slotSize = 48;
        this.slotsPerRow = 6;
        this.padding = 8;
        this.headerHeight = 40;
        this.tabHeight = 30;
        
        // UI state
        this.selectedSlot = null;
        this.draggedItem = null;
        this.currentTab = 'all';
        this.hoveredSlot = null;
        
        // UI position and size
        this.width = (this.slotSize * this.slotsPerRow) + (this.padding * 2);
        this.height = 400; // Will be calculated based on items
        this.x = 0; // Will be centered
        this.y = 0; // Will be centered
        
        // Item categories for tabs
        this.tabs = {
            'all': 'All Items',
            'crops': 'Crops',
            'tools': 'Tools', 
            'seeds': 'Seeds',
            'resources': 'Resources'
        };
        
        console.log('InventoryUI initialized');
    }
    
    // Toggle inventory visibility
    toggle() {
        this.isVisible = !this.isVisible;
        if (this.isVisible) {
            this.updateLayout();
        }
    }
    
    // Show inventory
    show() {
        this.isVisible = true;
        this.updateLayout();
    }
    
    // Hide inventory
    hide() {
        this.isVisible = false;
    }
    
    // Update UI layout based on canvas size
    updateLayout() {
        if (!this.player.gameEngine?.renderSystem) return;
        
        const canvas = this.player.gameEngine.renderSystem.canvas;
        this.x = (canvas.width - this.width) / 2;
        this.y = (canvas.height - this.height) / 2;
    }
    
    // Handle input events
    handleInput(inputManager) {
        if (!this.isVisible) return;
        
        // Toggle with 'I' key
        if (inputManager.isKeyPressed('KeyI')) {
            this.hide();
            return;
        }
        
        // Tab switching with number keys
        const tabKeys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
        const tabNames = Object.keys(this.tabs);
        
        for (let i = 0; i < tabKeys.length && i < tabNames.length; i++) {
            if (inputManager.isKeyPressed(tabKeys[i])) {
                this.currentTab = tabNames[i];
                break;
            }
        }
        
        // Mouse handling would go here for drag-and-drop
        // For now, we'll use keyboard navigation
    }
    
    // Render the inventory UI
    render(renderSystem) {
        if (!this.isVisible || !renderSystem) return;
        
        // Render background panel
        this.renderBackground(renderSystem);
        
        // Render tabs
        this.renderTabs(renderSystem);
        
        // Render items
        this.renderItems(renderSystem);
        
        // Render inventory stats
        this.renderStats(renderSystem);
        
        // Render item tooltip if hovering
        this.renderTooltip(renderSystem);
    }
    
    // Render background panel
    renderBackground(renderSystem) {
        // Main background
        renderSystem.drawRect(
            this.x, this.y, this.width, this.height,
            '#2a2a2a', { alpha: 0.95, layer: 100 }
        );
        
        // Border
        renderSystem.drawRect(
            this.x - 2, this.y - 2, this.width + 4, this.height + 4,
            '#8B4513', { alpha: 0.8, layer: 99 }
        );
        
        // Title
        renderSystem.drawText(
            'Inventory',
            this.x + this.width / 2, this.y + 20,
            { 
                color: '#ffffff', 
                fontSize: 18, 
                textAlign: 'center',
                layer: 101 
            }
        );
    }
    
    // Render category tabs
    renderTabs(renderSystem) {
        const tabY = this.y + this.headerHeight;
        const tabWidth = this.width / Object.keys(this.tabs).length;
        let tabX = this.x;
        
        for (const [tabId, tabName] of Object.entries(this.tabs)) {
            const isActive = this.currentTab === tabId;
            
            // Tab background
            renderSystem.drawRect(
                tabX, tabY, tabWidth, this.tabHeight,
                isActive ? '#8B4513' : '#555555',
                { alpha: 0.8, layer: 101 }
            );
            
            // Tab text
            renderSystem.drawText(
                tabName,
                tabX + tabWidth / 2, tabY + this.tabHeight / 2,
                {
                    color: isActive ? '#ffffff' : '#cccccc',
                    fontSize: 12,
                    textAlign: 'center',
                    layer: 102
                }
            );
            
            tabX += tabWidth;
        }
    }
    
    // Render inventory items
    renderItems(renderSystem) {
        const startY = this.y + this.headerHeight + this.tabHeight + this.padding;
        let currentX = this.x + this.padding;
        let currentY = startY;
        let slotsInRow = 0;
        
        // Get items for current tab
        const items = this.getItemsForTab(this.currentTab);
        
        for (const item of items) {
            // Render slot background
            renderSystem.drawRect(
                currentX, currentY, this.slotSize, this.slotSize,
                '#444444', { alpha: 0.8, layer: 101 }
            );
            
            // Render slot border
            renderSystem.drawRect(
                currentX - 1, currentY - 1, this.slotSize + 2, this.slotSize + 2,
                '#666666', { alpha: 0.6, layer: 100 }
            );
            
            // Render item icon (placeholder - would use actual sprites)
            renderSystem.drawRect(
                currentX + 4, currentY + 4, this.slotSize - 8, this.slotSize - 8,
                this.getItemColor(item.properties.category),
                { alpha: 0.7, layer: 102 }
            );
            
            // Render item name
            renderSystem.drawText(
                item.properties.name.substring(0, 8),
                currentX + this.slotSize / 2, currentY + 16,
                {
                    color: '#ffffff',
                    fontSize: 8,
                    textAlign: 'center',
                    layer: 103
                }
            );
            
            // Render quantity
            if (item.quantity > 1) {
                renderSystem.drawText(
                    item.quantity.toString(),
                    currentX + this.slotSize - 4, currentY + this.slotSize - 4,
                    {
                        color: '#ffffff',
                        fontSize: 10,
                        textAlign: 'right',
                        layer: 103
                    }
                );
            }
            
            // Render quality indicator for crops
            if (item.quality && item.quality !== 'normal') {
                const qualityColor = this.getQualityColor(item.quality);
                renderSystem.drawRect(
                    currentX + 2, currentY + 2, 6, 6,
                    qualityColor, { alpha: 0.8, layer: 104 }
                );
            }
            
            // Move to next slot position
            slotsInRow++;
            if (slotsInRow >= this.slotsPerRow) {
                currentX = this.x + this.padding;
                currentY += this.slotSize + 4;
                slotsInRow = 0;
            } else {
                currentX += this.slotSize + 4;
            }
        }
    }
    
    // Render inventory statistics
    renderStats(renderSystem) {
        const stats = this.player.inventory.getStats();
        const statsY = this.y + this.height - 60;
        
        // Background for stats
        renderSystem.drawRect(
            this.x, statsY, this.width, 50,
            '#1a1a1a', { alpha: 0.8, layer: 101 }
        );
        
        // Stats text
        renderSystem.drawText(
            `Items: ${stats.usedSlots}/${this.player.inventory.capacity}`,
            this.x + 10, statsY + 15,
            { color: '#ffffff', fontSize: 12, layer: 102 }
        );
        
        renderSystem.drawText(
            `Total Value: ${stats.totalValue}G`,
            this.x + 10, statsY + 30,
            { color: '#ffff00', fontSize: 12, layer: 102 }
        );
        
        renderSystem.drawText(
            `Total Items: ${stats.totalItems}`,
            this.x + this.width - 10, statsY + 15,
            { color: '#ffffff', fontSize: 12, textAlign: 'right', layer: 102 }
        );
    }
    
    // Render item tooltip
    renderTooltip(renderSystem) {
        if (!this.hoveredSlot) return;
        
        // Tooltip would show item details
        // Implementation depends on mouse support
    }
    
    // Get items for the current tab
    getItemsForTab(tab) {
        if (tab === 'all') {
            return this.player.inventory.getAllItems();
        }
        
        const categoryMap = {
            'crops': this.player.inventory.categories.CROPS,
            'tools': this.player.inventory.categories.TOOLS,
            'seeds': this.player.inventory.categories.SEEDS,
            'resources': this.player.inventory.categories.RESOURCES
        };
        
        const category = categoryMap[tab];
        if (category) {
            return this.player.inventory.getItemsByCategory(category);
        }
        
        return [];
    }
    
    // Get color for item category
    getItemColor(category) {
        const colors = {
            'crops': '#228b22',     // Green
            'tools': '#8b7355',     // Brown
            'seeds': '#daa520',     // Golden
            'resources': '#696969', // Gray
            'food': '#ff6347',      // Tomato
            'materials': '#4682b4', // Steel Blue
            'misc': '#9370db'       // Medium Purple
        };
        
        return colors[category] || '#666666';
    }
    
    // Get color for item quality
    getQualityColor(quality) {
        const colors = {
            'poor': '#8b4513',      // Saddle Brown
            'normal': '#ffffff',    // White
            'good': '#00ff00',      // Lime
            'excellent': '#ffd700'  // Gold
        };
        
        return colors[quality] || '#ffffff';
    }
    
    // Check if inventory UI is currently visible
    isOpen() {
        return this.isVisible;
    }
    
    // Get UI bounds for mouse interaction
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}