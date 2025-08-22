// Movement system providing smooth interpolation and grid-based movement
// Handles pixel-perfect movement with collision response

export class MovementComponent {
    constructor(entity, options = {}) {
        this.entity = entity;
        
        // Current position (actual render position)
        this.x = entity.x;
        this.y = entity.y;
        
        // Target position (where we're moving to)
        this.targetX = entity.x;
        this.targetY = entity.y;
        
        // Movement properties
        this.speed = options.speed || 120; // pixels per second
        this.smoothing = options.smoothing || 0.15; // interpolation factor
        this.gridSize = options.gridSize || 32; // for grid-based movement
        this.isGridBased = options.gridBased || false;
        
        // Movement state
        this.isMoving = false;
        this.movementQueue = []; // For grid-based movement
        this.lastDirection = { x: 0, y: 0 };
        
        // Animation integration
        this.animationSystem = null;
        this.animationId = null;
    }
    
    setAnimationSystem(animationSystem, animationId) {
        this.animationSystem = animationSystem;
        this.animationId = animationId;
    }
    
    // Set target position for smooth movement
    setTarget(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.updateMovingState();
    }
    
    // Move by delta amount
    moveBy(deltaX, deltaY) {
        this.setTarget(this.targetX + deltaX, this.targetY + deltaY);
    }
    
    // Grid-based movement (for tile-based games)
    moveToTile(tileX, tileY) {
        if (!this.isGridBased) return;
        
        const worldX = tileX * this.gridSize;
        const worldY = tileY * this.gridSize;
        this.setTarget(worldX, worldY);
    }
    
    // Queue movement for grid-based games (prevents diagonal movement)
    queueMovement(deltaX, deltaY) {
        if (!this.isGridBased) {
            this.moveBy(deltaX, deltaY);
            return;
        }
        
        // Only allow one queued movement at a time
        if (this.movementQueue.length === 0 && !this.isMoving) {
            const currentTileX = Math.round(this.x / this.gridSize);
            const currentTileY = Math.round(this.y / this.gridSize);
            
            const newTileX = currentTileX + Math.sign(deltaX);
            const newTileY = currentTileY + Math.sign(deltaY);
            
            this.movementQueue.push({ x: newTileX, y: newTileY });
        }
    }
    
    // Update movement interpolation
    update(deltaTime) {
        if (this.isGridBased) {
            this.updateGridMovement(deltaTime);
        } else {
            this.updateSmoothMovement(deltaTime);
        }
        
        // Update entity position
        this.entity.x = this.x;
        this.entity.y = this.y;
        
        // Update collision body if it exists
        if (this.entity.collisionBodyId && this.entity.gameEngine?.collisionSystem) {
            this.entity.gameEngine.collisionSystem.updateBody(
                this.entity.collisionBodyId, 
                this.x + 2, 
                this.y + 2
            );
        }
    }
    
    updateSmoothMovement(deltaTime) {
        const distanceX = this.targetX - this.x;
        const distanceY = this.targetY - this.y;
        
        // Check if we've reached the target
        if (Math.abs(distanceX) < 0.5 && Math.abs(distanceY) < 0.5) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            return;
        }
        
        // Smooth interpolation
        const moveX = distanceX * this.smoothing;
        const moveY = distanceY * this.smoothing;
        
        this.x += moveX;
        this.y += moveY;
        this.isMoving = true;
        
        // Update direction for animations
        if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
            this.lastDirection = { 
                x: Math.sign(moveX), 
                y: Math.sign(moveY) 
            };
        }
    }
    
    updateGridMovement(deltaTime) {
        // Process queued movements
        if (!this.isMoving && this.movementQueue.length > 0) {
            const nextMove = this.movementQueue.shift();
            this.moveToTile(nextMove.x, nextMove.y);
        }
        
        // Move towards target
        const distanceX = this.targetX - this.x;
        const distanceY = this.targetY - this.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance < 1) {
            // Snap to target
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            return;
        }
        
        // Move at constant speed
        const moveDistance = this.speed * deltaTime / 1000;
        const moveX = (distanceX / distance) * moveDistance;
        const moveY = (distanceY / distance) * moveDistance;
        
        this.x += moveX;
        this.y += moveY;
        this.isMoving = true;
        
        // Update direction
        this.lastDirection = { 
            x: Math.sign(distanceX), 
            y: Math.sign(distanceY) 
        };
    }
    
    updateMovingState() {
        const distanceX = this.targetX - this.x;
        const distanceY = this.targetY - this.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        this.isMoving = distance > 1;
    }
    
    // Get current facing direction based on movement
    getFacing() {
        if (Math.abs(this.lastDirection.x) > Math.abs(this.lastDirection.y)) {
            return this.lastDirection.x > 0 ? 'right' : 'left';
        } else if (this.lastDirection.y !== 0) {
            return this.lastDirection.y > 0 ? 'down' : 'up';
        }
        return 'down'; // Default facing
    }
    
    // Stop all movement
    stop() {
        this.targetX = this.x;
        this.targetY = this.y;
        this.movementQueue = [];
        this.isMoving = false;
    }
    
    // Check if entity can move to position (with collision)
    canMoveTo(x, y) {
        if (!this.entity.gameEngine?.collisionSystem) return true;
        
        return this.entity.gameEngine.collisionSystem.canMoveTo(
            this.entity.collisionBodyId, x, y
        );
    }
    
    // Move with collision detection
    moveWithCollision(deltaX, deltaY) {
        const newX = this.x + deltaX;
        const newY = this.y + deltaY;
        
        if (this.canMoveTo(newX, newY)) {
            this.setTarget(newX, newY);
            return true;
        }
        
        // Try moving just on X axis
        if (deltaX !== 0 && this.canMoveTo(newX, this.y)) {
            this.setTarget(newX, this.y);
            return true;
        }
        
        // Try moving just on Y axis
        if (deltaY !== 0 && this.canMoveTo(this.x, newY)) {
            this.setTarget(this.x, newY);
            return true;
        }
        
        return false;
    }
    
    // Get movement state for debugging
    getState() {
        return {
            x: this.x,
            y: this.y,
            targetX: this.targetX,
            targetY: this.targetY,
            isMoving: this.isMoving,
            facing: this.getFacing(),
            queueLength: this.movementQueue.length
        };
    }
}