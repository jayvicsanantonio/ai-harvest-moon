// Comprehensive time management system for day/night cycles and calendar tracking
// Handles time progression, seasons, weather patterns, and daily events

export class TimeSystem {
    constructor() {
        // Time configuration
        this.timeScale = 1; // 1 real second = 1 game minute (adjustable)
        this.dayLength = 24 * 60; // 24 hours in game minutes
        this.seasonLength = 30; // 30 days per season
        this.yearLength = 4 * this.seasonLength; // 4 seasons per year
        
        // Current time state
        this.currentTime = 6 * 60; // Start at 6:00 AM
        this.currentDay = 1;
        this.currentSeason = 0; // 0=Spring, 1=Summer, 2=Fall, 3=Winter
        this.currentYear = 1;
        
        // Time tracking
        this.elapsedRealTime = 0; // For time scaling
        this.isPaused = false;
        this.timeEvents = new Map(); // scheduled events
        
        // Seasons
        this.seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
        this.seasonColors = {
            0: { primary: '#90EE90', secondary: '#228B22' }, // Spring - Light/Dark Green
            1: { primary: '#FFD700', secondary: '#FF8C00' }, // Summer - Gold/Orange
            2: { primary: '#FF8C00', secondary: '#8B4513' }, // Fall - Orange/Brown
            3: { primary: '#E6E6FA', secondary: '#4682B4' }  // Winter - Light Blue/Steel Blue
        };
        
        // Day/Night cycle configuration
        this.dayPhases = {
            DAWN: { start: 5 * 60, end: 7 * 60, name: 'Dawn' },
            MORNING: { start: 7 * 60, end: 12 * 60, name: 'Morning' },
            AFTERNOON: { start: 12 * 60, end: 17 * 60, name: 'Afternoon' },
            EVENING: { start: 17 * 60, end: 20 * 60, name: 'Evening' },
            NIGHT: { start: 20 * 60, end: 24 * 60, name: 'Night' },
            LATE_NIGHT: { start: 0, end: 5 * 60, name: 'Late Night' }
        };
        
        // Event callbacks
        this.callbacks = {
            onTimeChange: [],
            onDayChange: [],
            onSeasonChange: [],
            onYearChange: [],
            onPhaseChange: []
        };
        
        this.currentPhase = this.getCurrentPhase();
        
        console.log('TimeSystem initialized');
        this.logCurrentTime();
    }
    
    // Update time progression
    update(deltaTime) {
        if (this.isPaused) return;
        
        this.elapsedRealTime += deltaTime;
        
        // Convert real time to game time based on time scale
        const gameTimeToAdd = (deltaTime / 1000) * this.timeScale;
        const oldTime = this.currentTime;
        const oldDay = this.currentDay;
        const oldSeason = this.currentSeason;
        const oldYear = this.currentYear;
        const oldPhase = this.currentPhase;
        
        this.currentTime += gameTimeToAdd;
        
        // Handle day advancement
        if (this.currentTime >= this.dayLength) {
            const daysAdvanced = Math.floor(this.currentTime / this.dayLength);
            this.currentTime = this.currentTime % this.dayLength;
            this.currentDay += daysAdvanced;
            
            // Handle season advancement
            const dayInSeason = ((this.currentDay - 1) % this.seasonLength) + 1;
            if (this.currentDay > oldDay && dayInSeason === 1 && this.currentDay > 1) {
                this.currentSeason = (this.currentSeason + 1) % 4;
                
                // Handle year advancement
                if (this.currentSeason === 0 && this.currentDay > this.seasonLength) {
                    this.currentYear++;
                }
            }
        }
        
        // Update current phase
        this.currentPhase = this.getCurrentPhase();
        
        // Trigger callbacks for changes
        if (Math.floor(this.currentTime) !== Math.floor(oldTime)) {
            this.triggerCallbacks('onTimeChange', this.getTimeData());
        }
        
        if (this.currentDay !== oldDay) {
            this.triggerCallbacks('onDayChange', this.getTimeData());
            this.processScheduledEvents();
        }
        
        if (this.currentSeason !== oldSeason) {
            this.triggerCallbacks('onSeasonChange', this.getTimeData());
        }
        
        if (this.currentYear !== oldYear) {
            this.triggerCallbacks('onYearChange', this.getTimeData());
        }
        
        if (this.currentPhase !== oldPhase) {
            this.triggerCallbacks('onPhaseChange', this.getTimeData());
        }
        
        // Process scheduled events
        this.updateScheduledEvents();
    }
    
    // Get current day phase
    getCurrentPhase() {
        for (const [phaseName, phase] of Object.entries(this.dayPhases)) {
            if (this.currentTime >= phase.start && this.currentTime < phase.end) {
                return phaseName;
            }
        }
        
        // Handle wraparound for late night
        if (this.currentTime >= 0 && this.currentTime < this.dayPhases.LATE_NIGHT.end) {
            return 'LATE_NIGHT';
        }
        
        return 'NIGHT';
    }
    
    // Get formatted time string (12-hour format)
    getFormattedTime() {
        const totalMinutes = Math.floor(this.currentTime);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
        const ampm = hours < 12 ? 'AM' : 'PM';
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    // Get formatted date string
    getFormattedDate() {
        const dayInSeason = ((this.currentDay - 1) % this.seasonLength) + 1;
        const seasonName = this.seasons[this.currentSeason];
        
        return `${seasonName} ${dayInSeason}, Year ${this.currentYear}`;
    }
    
    // Get complete time data object
    getTimeData() {
        const dayInSeason = ((this.currentDay - 1) % this.seasonLength) + 1;
        
        return {
            time: this.currentTime,
            formattedTime: this.getFormattedTime(),
            day: this.currentDay,
            dayInSeason: dayInSeason,
            season: this.currentSeason,
            seasonName: this.seasons[this.currentSeason],
            year: this.currentYear,
            phase: this.currentPhase,
            phaseName: this.dayPhases[this.currentPhase]?.name || 'Unknown',
            formattedDate: this.getFormattedDate(),
            lightLevel: this.getLightLevel(),
            seasonProgress: (dayInSeason - 1) / this.seasonLength
        };
    }
    
    // Calculate light level based on time of day (0.0 to 1.0)
    getLightLevel() {
        const time = this.currentTime;
        
        // Dawn: gradual increase from 0.2 to 1.0
        if (time >= this.dayPhases.DAWN.start && time < this.dayPhases.DAWN.end) {
            const progress = (time - this.dayPhases.DAWN.start) / 
                           (this.dayPhases.DAWN.end - this.dayPhases.DAWN.start);
            return 0.2 + (progress * 0.8);
        }
        
        // Morning/Afternoon: full light
        if (time >= this.dayPhases.MORNING.start && time < this.dayPhases.EVENING.start) {
            return 1.0;
        }
        
        // Evening: gradual decrease from 1.0 to 0.2
        if (time >= this.dayPhases.EVENING.start && time < this.dayPhases.NIGHT.start) {
            const progress = (time - this.dayPhases.EVENING.start) / 
                           (this.dayPhases.NIGHT.start - this.dayPhases.EVENING.start);
            return 1.0 - (progress * 0.8);
        }
        
        // Night/Late Night: low light
        return 0.2;
    }
    
    // Get season color overlay
    getSeasonOverlay() {
        const colors = this.seasonColors[this.currentSeason];
        const lightLevel = this.getLightLevel();
        
        return {
            primary: colors.primary,
            secondary: colors.secondary,
            alpha: Math.max(0.1, 1.0 - lightLevel) * 0.3
        };
    }
    
    // Advance time by specified amount
    advanceTime(minutes) {
        this.currentTime += minutes;
        this.update(0); // Trigger change processing
    }
    
    // Advance to next day
    advanceDay() {
        const timeUntilNextDay = this.dayLength - this.currentTime;
        this.advanceTime(timeUntilNextDay);
    }
    
    // Set specific time
    setTime(hours, minutes = 0) {
        this.currentTime = (hours * 60) + minutes;
        this.update(0);
    }
    
    // Set time scale (how fast time passes)
    setTimeScale(scale) {
        this.timeScale = Math.max(0.1, Math.min(10, scale));
        console.log(`Time scale set to ${this.timeScale}x`);
    }
    
    // Pause/unpause time
    pause() {
        this.isPaused = true;
        console.log('Time paused');
    }
    
    resume() {
        this.isPaused = false;
        console.log('Time resumed');
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? 'Time paused' : 'Time resumed');
    }
    
    // Schedule an event for a specific day/time
    scheduleEvent(eventId, targetDay, targetTime, callback, data = {}) {
        this.timeEvents.set(eventId, {
            targetDay,
            targetTime,
            callback,
            data,
            recurring: false
        });
    }
    
    // Schedule a recurring event
    scheduleRecurringEvent(eventId, intervalDays, targetTime, callback, data = {}) {
        this.timeEvents.set(eventId, {
            intervalDays,
            targetTime,
            callback,
            data,
            recurring: true,
            lastTriggered: this.currentDay
        });
    }
    
    // Update scheduled events
    updateScheduledEvents() {
        for (const [eventId, event] of this.timeEvents.entries()) {
            if (event.recurring) {
                const daysSinceLastTrigger = this.currentDay - event.lastTriggered;
                if (daysSinceLastTrigger >= event.intervalDays && 
                    Math.floor(this.currentTime) === Math.floor(event.targetTime)) {
                    
                    event.callback(event.data);
                    event.lastTriggered = this.currentDay;
                }
            } else {
                if (this.currentDay === event.targetDay && 
                    Math.floor(this.currentTime) === Math.floor(event.targetTime)) {
                    
                    event.callback(event.data);
                    this.timeEvents.delete(eventId);
                }
            }
        }
    }
    
    // Process daily events
    processScheduledEvents() {
        // This would handle things like:
        // - Crop growth updates
        // - Animal feeding requirements
        // - Shop inventory refresh
        // - NPC schedule updates
        
        console.log(`New day started: ${this.getFormattedDate()}`);
    }
    
    // Register callback for time events
    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }
    
    // Remove callback
    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index !== -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }
    
    // Trigger callbacks
    triggerCallbacks(eventType, data) {
        if (this.callbacks[eventType]) {
            for (const callback of this.callbacks[eventType]) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} callback:`, error);
                }
            }
        }
    }
    
    // Check if it's currently a specific phase
    isPhase(phaseName) {
        return this.currentPhase === phaseName.toUpperCase();
    }
    
    // Check if it's currently a specific season
    isSeason(seasonName) {
        const seasonIndex = this.seasons.findIndex(s => 
            s.toLowerCase() === seasonName.toLowerCase()
        );
        return this.currentSeason === seasonIndex;
    }
    
    // Get time until next phase
    getTimeUntilNextPhase() {
        const currentPhaseData = this.dayPhases[this.currentPhase];
        if (!currentPhaseData) return 0;
        
        return currentPhaseData.end - this.currentTime;
    }
    
    // Get time until specific time
    getTimeUntil(targetHour, targetMinute = 0) {
        const targetTime = (targetHour * 60) + targetMinute;
        let timeUntil = targetTime - this.currentTime;
        
        if (timeUntil < 0) {
            timeUntil += this.dayLength; // Next day
        }
        
        return timeUntil;
    }
    
    // Log current time (debug)
    logCurrentTime() {
        const data = this.getTimeData();
        console.log(`${data.formattedTime} - ${data.formattedDate} (${data.phaseName})`);
    }
    
    // Serialize time system state for saving
    serialize() {
        return {
            currentTime: this.currentTime,
            currentDay: this.currentDay,
            currentSeason: this.currentSeason,
            currentYear: this.currentYear,
            timeScale: this.timeScale,
            elapsedRealTime: this.elapsedRealTime,
            timeEvents: Array.from(this.timeEvents.entries())
        };
    }
    
    // Deserialize time system state
    deserialize(data) {
        this.currentTime = data.currentTime || this.currentTime;
        this.currentDay = data.currentDay || this.currentDay;
        this.currentSeason = data.currentSeason || this.currentSeason;
        this.currentYear = data.currentYear || this.currentYear;
        this.timeScale = data.timeScale || this.timeScale;
        this.elapsedRealTime = data.elapsedRealTime || 0;
        
        if (data.timeEvents) {
            this.timeEvents = new Map(data.timeEvents);
        }
        
        this.currentPhase = this.getCurrentPhase();
        this.logCurrentTime();
    }
    
    // Get debug information
    getDebugInfo() {
        return {
            ...this.getTimeData(),
            timeScale: this.timeScale,
            isPaused: this.isPaused,
            scheduledEvents: this.timeEvents.size,
            callbacks: Object.keys(this.callbacks).reduce((acc, key) => {
                acc[key] = this.callbacks[key].length;
                return acc;
            }, {})
        };
    }
}