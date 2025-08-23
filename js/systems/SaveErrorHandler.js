// Comprehensive error handling and recovery system for save/load operations
// Handles corruption detection, migration, and data recovery mechanisms

export class SaveErrorHandler {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.errorLog = [];
        this.maxErrorHistory = 50;
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 3;
        
        // Error categories
        this.errorTypes = {
            CORRUPTION: 'corruption',
            QUOTA_EXCEEDED: 'quota_exceeded',
            PERMISSION_DENIED: 'permission_denied',
            VERSION_MISMATCH: 'version_mismatch',
            MISSING_DATA: 'missing_data',
            INVALID_FORMAT: 'invalid_format',
            STORAGE_UNAVAILABLE: 'storage_unavailable'
        };
        
        // Recovery strategies
        this.recoveryStrategies = new Map([
            [this.errorTypes.CORRUPTION, this.handleCorruption.bind(this)],
            [this.errorTypes.QUOTA_EXCEEDED, this.handleQuotaExceeded.bind(this)],
            [this.errorTypes.VERSION_MISMATCH, this.handleVersionMismatch.bind(this)],
            [this.errorTypes.MISSING_DATA, this.handleMissingData.bind(this)],
            [this.errorTypes.INVALID_FORMAT, this.handleInvalidFormat.bind(this)],
            [this.errorTypes.STORAGE_UNAVAILABLE, this.handleStorageUnavailable.bind(this)]
        ]);
        
        console.log('SaveErrorHandler initialized');
    }
    
    // Main error handling entry point
    handleError(error, operation, context = {}) {
        const errorInfo = this.categorizeError(error, operation, context);
        this.logError(errorInfo);
        
        // Attempt recovery if possible
        const recoveryResult = this.attemptRecovery(errorInfo);
        
        return {
            error: errorInfo,
            recovered: recoveryResult.success,
            recoveryAction: recoveryResult.action,
            fallbackAvailable: recoveryResult.fallbackAvailable
        };
    }
    
    categorizeError(error, operation, context) {
        const errorInfo = {
            timestamp: Date.now(),
            operation: operation,
            originalError: error,
            message: error.message || 'Unknown error',
            context: context,
            type: this.errorTypes.MISSING_DATA,
            severity: 'medium',
            recoverable: true
        };
        
        // Categorize based on error message and type
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('quota') || message.includes('storage full') || error.code === 22) {
            errorInfo.type = this.errorTypes.QUOTA_EXCEEDED;
            errorInfo.severity = 'high';
        } else if (message.includes('permission') || message.includes('access denied')) {
            errorInfo.type = this.errorTypes.PERMISSION_DENIED;
            errorInfo.severity = 'high';
            errorInfo.recoverable = false;
        } else if (message.includes('version') || message.includes('compatibility')) {
            errorInfo.type = this.errorTypes.VERSION_MISMATCH;
            errorInfo.severity = 'medium';
        } else if (message.includes('corrupt') || message.includes('parse') || message.includes('invalid')) {
            errorInfo.type = this.errorTypes.CORRUPTION;
            errorInfo.severity = 'high';
        } else if (message.includes('not found') || message.includes('missing')) {
            errorInfo.type = this.errorTypes.MISSING_DATA;
            errorInfo.severity = 'low';
        } else if (!localStorage || typeof Storage === 'undefined') {
            errorInfo.type = this.errorTypes.STORAGE_UNAVAILABLE;
            errorInfo.severity = 'critical';
            errorInfo.recoverable = false;
        } else {
            errorInfo.type = this.errorTypes.INVALID_FORMAT;
            errorInfo.severity = 'medium';
        }
        
        return errorInfo;
    }
    
    logError(errorInfo) {
        // Add to error history
        this.errorLog.unshift(errorInfo);
        
        // Limit error history size
        if (this.errorLog.length > this.maxErrorHistory) {
            this.errorLog = this.errorLog.slice(0, this.maxErrorHistory);
        }
        
        // Log to console based on severity
        const logMethod = errorInfo.severity === 'critical' ? 'error' : 
                         errorInfo.severity === 'high' ? 'error' : 
                         errorInfo.severity === 'medium' ? 'warn' : 'log';
        
        console[logMethod](`Save Error [${errorInfo.type}]:`, errorInfo.message, errorInfo.context);
    }
    
    attemptRecovery(errorInfo) {
        if (!errorInfo.recoverable || this.recoveryAttempts >= this.maxRecoveryAttempts) {
            return { 
                success: false, 
                action: 'none', 
                fallbackAvailable: this.hasFallbackOptions(errorInfo)
            };
        }
        
        this.recoveryAttempts++;
        
        const strategy = this.recoveryStrategies.get(errorInfo.type);
        if (strategy) {
            return strategy(errorInfo);
        }
        
        return { 
            success: false, 
            action: 'no_strategy', 
            fallbackAvailable: false 
        };
    }
    
    // Recovery strategy implementations
    handleCorruption(errorInfo) {
        console.log('Attempting corruption recovery...');
        
        // Try to load from backup
        if (this.saveManager.backupEnabled) {
            try {
                const backupKey = errorInfo.context.key + '_backup';
                const backupData = this.saveManager.loadFromStorage(backupKey.replace(this.saveManager.storagePrefix, ''));
                
                if (backupData) {
                    console.log('Successfully recovered from backup');
                    return { 
                        success: true, 
                        action: 'backup_recovery',
                        fallbackAvailable: true,
                        recoveredData: backupData
                    };
                }
            } catch (backupError) {
                console.warn('Backup also corrupted:', backupError);
            }
        }
        
        // Try partial recovery
        return this.attemptPartialRecovery(errorInfo);
    }
    
    handleQuotaExceeded(errorInfo) {
        console.log('Attempting quota recovery...');
        
        // Try cleanup first
        if (this.saveManager.cleanupOldSaves) {
            this.saveManager.cleanupOldSaves();
        }
        
        // Enable compression if not already enabled
        if (!this.saveManager.compressionEnabled) {
            this.saveManager.compressionEnabled = true;
            console.log('Enabled compression to save space');
        }
        
        // Try to save again with compression
        return { 
            success: true, 
            action: 'cleanup_and_compression',
            fallbackAvailable: true
        };
    }
    
    handleVersionMismatch(errorInfo) {
        console.log('Attempting version migration...');
        
        const saveData = errorInfo.context.data;
        if (!saveData || !saveData.version) {
            return { success: false, action: 'no_version_info', fallbackAvailable: false };
        }
        
        // Try to migrate save data
        const migrated = this.migrateSaveData(saveData, this.saveManager.saveVersion);
        
        if (migrated) {
            return { 
                success: true, 
                action: 'version_migration',
                fallbackAvailable: true,
                migratedData: migrated
            };
        }
        
        return { success: false, action: 'migration_failed', fallbackAvailable: false };
    }
    
    handleMissingData(errorInfo) {
        console.log('Handling missing data...');
        
        // Create default save data
        const defaultSave = this.saveManager.createSaveData(0, {
            recovered: true,
            originalError: errorInfo.type
        });
        
        return { 
            success: true, 
            action: 'default_data_created',
            fallbackAvailable: true,
            defaultData: defaultSave
        };
    }
    
    handleInvalidFormat(errorInfo) {
        console.log('Attempting format recovery...');
        
        // Try to fix common JSON issues
        const rawData = errorInfo.context.rawData;
        if (rawData && typeof rawData === 'string') {
            const fixed = this.attemptJsonRepair(rawData);
            if (fixed) {
                return { 
                    success: true, 
                    action: 'json_repair',
                    fallbackAvailable: true,
                    repairedData: fixed
                };
            }
        }
        
        return { success: false, action: 'format_unrepairable', fallbackAvailable: false };
    }
    
    handleStorageUnavailable(errorInfo) {
        console.error('Storage unavailable - cannot recover');
        
        // Suggest alternative storage methods
        return { 
            success: false, 
            action: 'storage_unavailable',
            fallbackAvailable: false,
            suggestions: [
                'Enable localStorage in browser settings',
                'Clear browser data to free up space',
                'Use incognito/private mode',
                'Try a different browser'
            ]
        };
    }
    
    // Utility recovery methods
    attemptPartialRecovery(errorInfo) {
        console.log('Attempting partial data recovery...');
        
        // Try to extract salvageable parts of corrupted data
        const rawData = errorInfo.context.rawData;
        if (!rawData) return { success: false, action: 'no_raw_data', fallbackAvailable: false };
        
        try {
            // Look for recognizable JSON patterns
            const patterns = [
                /"player":\s*{[^}]+}/,
                /"gameTime":\s*{[^}]+}/,
                /"inventory":\s*{[^}]+}/,
                /"farming":\s*{[^}]+}/
            ];
            
            const extracted = {};
            let recoveredSections = 0;
            
            for (const pattern of patterns) {
                const match = rawData.match(pattern);
                if (match) {
                    try {
                        const section = JSON.parse('{' + match[0] + '}');
                        Object.assign(extracted, section);
                        recoveredSections++;
                    } catch (e) {
                        // Skip this section
                    }
                }
            }
            
            if (recoveredSections > 0) {
                console.log(`Recovered ${recoveredSections} sections from corrupted save`);
                return { 
                    success: true, 
                    action: 'partial_recovery',
                    fallbackAvailable: true,
                    partialData: extracted
                };
            }
            
        } catch (error) {
            console.error('Partial recovery failed:', error);
        }
        
        return { success: false, action: 'partial_recovery_failed', fallbackAvailable: false };
    }
    
    migrateSaveData(oldSaveData, targetVersion) {
        console.log(`Migrating save from ${oldSaveData.version} to ${targetVersion}`);
        
        try {
            const migrated = JSON.parse(JSON.stringify(oldSaveData));
            migrated.version = targetVersion;
            migrated.migrated = true;
            migrated.originalVersion = oldSaveData.version;
            migrated.migrationDate = Date.now();
            
            // Apply version-specific migrations
            if (this.needsPlayerStatsUpdate(oldSaveData.version)) {
                migrated.player.stats = migrated.player.stats || {};
            }
            
            if (this.needsInventoryUpdate(oldSaveData.version)) {
                migrated.inventory.capacity = migrated.inventory.capacity || 30;
            }
            
            return migrated;
        } catch (error) {
            console.error('Migration failed:', error);
            return null;
        }
    }
    
    needsPlayerStatsUpdate(version) {
        return version < '1.0.0';
    }
    
    needsInventoryUpdate(version) {
        return version < '1.0.0';
    }
    
    attemptJsonRepair(jsonString) {
        try {
            // Try common fixes for malformed JSON
            let repaired = jsonString;
            
            // Fix unescaped quotes
            repaired = repaired.replace(/([^\\])"/g, '$1\\"');
            
            // Fix trailing commas
            repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
            
            // Fix missing commas
            repaired = repaired.replace(/}(\s*{)/g, '},$1');
            repaired = repaired.replace(/](\s*[{\[])/g, '],$1');
            
            // Try to parse repaired JSON
            JSON.parse(repaired);
            
            console.log('JSON repair successful');
            return JSON.parse(repaired);
        } catch (error) {
            console.warn('JSON repair failed:', error);
            return null;
        }
    }
    
    hasFallbackOptions(errorInfo) {
        switch (errorInfo.type) {
            case this.errorTypes.CORRUPTION:
                return this.saveManager.backupEnabled;
            case this.errorTypes.QUOTA_EXCEEDED:
                return true; // Can always try cleanup
            case this.errorTypes.VERSION_MISMATCH:
                return true; // Can attempt migration
            case this.errorTypes.MISSING_DATA:
                return true; // Can create default data
            case this.errorTypes.INVALID_FORMAT:
                return true; // Can attempt repair
            default:
                return false;
        }
    }
    
    // Public API for error handling
    getErrorHistory() {
        return [...this.errorLog];
    }
    
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            errorsBySeverity: {},
            recoveryAttempts: this.recoveryAttempts,
            successfulRecoveries: 0
        };
        
        for (const error of this.errorLog) {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
            stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        }
        
        return stats;
    }
    
    clearErrorHistory() {
        this.errorLog = [];
        this.recoveryAttempts = 0;
        console.log('Error history cleared');
    }
    
    resetRecoveryAttempts() {
        this.recoveryAttempts = 0;
    }
}