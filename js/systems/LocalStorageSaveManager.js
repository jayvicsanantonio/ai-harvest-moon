// LocalStorage implementation of SaveManager for browser-based persistence
// Handles browser localStorage with quota management and backup systems

import { SaveManager } from './SaveManager.js';
import { SaveErrorHandler } from './SaveErrorHandler.js';

export class LocalStorageSaveManager extends SaveManager {
    constructor() {
        super();
        this.storagePrefix = 'harvest_moon_';
        this.maxStorageSize = 5 * 1024 * 1024; // 5MB limit
        this.backupEnabled = true;
        
        // Storage monitoring
        this.currentUsage = 0;
        this.quotaExceeded = false;
        this.compressionRatio = 1.0;
        
        this.checkStorageSupport();
        this.updateStorageUsage();
        
        // Initialize error handler
        this.errorHandler = new SaveErrorHandler(this);
        
        console.log('LocalStorageSaveManager initialized');
    }
    
    checkStorageSupport() {
        try {
            const testKey = this.storagePrefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            this.storageSupported = true;
        } catch (error) {
            console.error('LocalStorage not supported:', error);
            this.storageSupported = false;
            throw new Error('LocalStorage is not available');
        }
    }
    
    updateStorageUsage() {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    totalSize += localStorage.getItem(key).length;
                }
            }
            this.currentUsage = totalSize;
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
            this.currentUsage = 0;
        }
    }
    
    // Implement abstract storage methods
    saveToStorage(key, data) {
        if (!this.storageSupported) {
            throw new Error('LocalStorage is not available');
        }
        
        const fullKey = this.storagePrefix + key;
        const serializedData = this.compressData(data);
        
        try {
            // Check storage quota before saving
            if (this.willExceedQuota(serializedData.length)) {
                this.handleQuotaExceeded();
            }
            
            // Create backup before overwriting
            if (this.backupEnabled) {
                this.createBackup(fullKey);
            }
            
            // Save the data
            localStorage.setItem(fullKey, serializedData);
            
            // Update usage statistics
            this.updateStorageUsage();
            this.quotaExceeded = false;
            
            console.log(`Saved ${Math.round(serializedData.length / 1024)}KB to ${key}`);
            
        } catch (error) {
            // Use error handler for comprehensive error management
            const errorResult = this.errorHandler.handleError(error, 'save', {
                key: fullKey,
                dataSize: serializedData.length
            });
            
            if (errorResult.recovered) {
                console.log(`Recovered from save error using: ${errorResult.recoveryAction}`);
                // Retry the operation if recovery was successful
                try {
                    localStorage.setItem(fullKey, serializedData);
                    this.updateStorageUsage();
                    return;
                } catch (retryError) {
                    throw new Error(`Save failed even after recovery: ${retryError.message}`);
                }
            }
            
            // Original error handling for backwards compatibility
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                this.quotaExceeded = true;
                this.handleQuotaExceeded();
                throw new Error('Storage quota exceeded. Unable to save game.');
            } else {
                throw new Error(`Failed to save to localStorage: ${error.message}`);
            }
        }
    }
    
    loadFromStorage(key) {
        if (!this.storageSupported) {
            throw new Error('LocalStorage is not available');
        }
        
        const fullKey = this.storagePrefix + key;
        
        try {
            const serializedData = localStorage.getItem(fullKey);
            if (serializedData === null) {
                return null; // No data found
            }
            
            const data = this.decompressData(serializedData);
            console.log(`Loaded ${Math.round(serializedData.length / 1024)}KB from ${key}`);
            return data;
            
        } catch (error) {
            console.error(`Failed to load from localStorage key ${key}:`, error);
            
            // Use error handler for comprehensive error management
            const errorResult = this.errorHandler.handleError(error, 'load', {
                key: fullKey,
                rawData: serializedData
            });
            
            if (errorResult.recovered) {
                console.log(`Recovered from load error using: ${errorResult.recoveryAction}`);
                
                // Return recovered data based on recovery type
                if (errorResult.recoveredData) {
                    return errorResult.recoveredData;
                } else if (errorResult.migratedData) {
                    return errorResult.migratedData;
                } else if (errorResult.defaultData) {
                    return errorResult.defaultData;
                } else if (errorResult.partialData) {
                    // Merge partial data with defaults
                    const defaultSave = this.createSaveData(0, { partialRecovery: true });
                    return { ...defaultSave, ...errorResult.partialData };
                }
            }
            
            // Try to load backup if main save is corrupted
            if (this.backupEnabled) {
                return this.loadBackup(fullKey);
            }
            
            throw new Error(`Failed to load save data: ${error.message}`);
        }
    }
    
    deleteFromStorage(key) {
        if (!this.storageSupported) {
            throw new Error('LocalStorage is not available');
        }
        
        const fullKey = this.storagePrefix + key;
        
        try {
            // Delete backup as well
            if (this.backupEnabled) {
                localStorage.removeItem(fullKey + '_backup');
            }
            
            localStorage.removeItem(fullKey);
            this.updateStorageUsage();
            
        } catch (error) {
            throw new Error(`Failed to delete from localStorage: ${error.message}`);
        }
    }
    
    // Quota management
    willExceedQuota(newDataSize) {
        const estimatedNewUsage = this.currentUsage + newDataSize;
        return estimatedNewUsage > this.maxStorageSize;
    }
    
    handleQuotaExceeded() {
        console.warn('Storage quota exceeded, attempting cleanup...');
        
        // Try to free up space by deleting old saves
        this.cleanupOldSaves();
        
        // Try compression if not already enabled
        if (!this.compressionEnabled) {
            console.log('Enabling compression to save space...');
            this.compressionEnabled = true;
        }
        
        // Update usage after cleanup
        this.updateStorageUsage();
    }
    
    cleanupOldSaves() {
        try {
            const saves = [];
            
            // Collect all save files with timestamps
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix) && !key.includes('backup')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.timestamp) {
                            saves.push({
                                key: key,
                                timestamp: data.timestamp,
                                size: localStorage.getItem(key).length
                            });
                        }
                    } catch (e) {
                        // Skip corrupted saves
                    }
                }
            }
            
            // Sort by timestamp (oldest first) and remove oldest saves
            saves.sort((a, b) => a.timestamp - b.timestamp);
            
            let freedSpace = 0;
            const targetFree = Math.round(this.maxStorageSize * 0.2); // Free 20% of quota
            
            for (const save of saves) {
                if (freedSpace >= targetFree) break;
                
                // Don't delete the most recent 3 saves
                if (saves.length - saves.indexOf(save) <= 3) break;
                
                localStorage.removeItem(save.key);
                freedSpace += save.size;
                console.log(`Deleted old save: ${save.key} (${Math.round(save.size / 1024)}KB)`);
            }
            
            console.log(`Cleanup freed ${Math.round(freedSpace / 1024)}KB of storage`);
            
        } catch (error) {
            console.error('Failed to cleanup old saves:', error);
        }
    }
    
    // Backup system
    createBackup(key) {
        try {
            const existingData = localStorage.getItem(key);
            if (existingData) {
                localStorage.setItem(key + '_backup', existingData);
            }
        } catch (error) {
            console.warn('Failed to create backup:', error);
        }
    }
    
    loadBackup(key) {
        try {
            const backupKey = key + '_backup';
            const backupData = localStorage.getItem(backupKey);
            
            if (backupData) {
                console.log('Loading from backup after main save corruption');
                return this.decompressData(backupData);
            }
            
            return null;
        } catch (error) {
            console.error('Backup also corrupted:', error);
            return null;
        }
    }
    
    // Enhanced compression for localStorage
    compressData(data) {
        const jsonString = JSON.stringify(data);
        
        if (!this.compressionEnabled) {
            return jsonString;
        }
        
        // Simple compression: remove unnecessary whitespace and apply basic string compression
        let compressed = jsonString;
        
        // Replace common patterns to reduce size
        const patterns = [
            ['"worldX":', '"wx":'],
            ['"worldY":', '"wy":'],
            ['"position":', '"pos":'],
            ['"current":', '"cur":'],
            ['"maximum":', '"max":'],
            ['"timestamp":', '"ts":'],
            ['"isWatered":', '"wet":'],
            ['"lastWatered":', '"lw":'],
            ['"plantedTime":', '"pt":']
        ];
        
        for (const [original, replacement] of patterns) {
            compressed = compressed.replace(new RegExp(original, 'g'), replacement);
        }
        
        // Calculate compression ratio
        this.compressionRatio = compressed.length / jsonString.length;
        
        return compressed;
    }
    
    decompressData(compressedData) {
        if (!this.compressionEnabled) {
            return JSON.parse(compressedData);
        }
        
        // Reverse compression patterns
        let decompressed = compressedData;
        
        const patterns = [
            ['"wx":', '"worldX":'],
            ['"wy":', '"worldY":'],
            ['"pos":', '"position":'],
            ['"cur":', '"current":'],
            ['"max":', '"maximum":'],
            ['"ts":', '"timestamp":'],
            ['"wet":', '"isWatered":'],
            ['"lw":', '"lastWatered":'],
            ['"pt":', '"plantedTime":']
        ];
        
        for (const [compressed, original] of patterns) {
            decompressed = decompressed.replace(new RegExp(compressed, 'g'), original);
        }
        
        return JSON.parse(decompressed);
    }
    
    // Management and utility methods
    exportSaveData(saveSlot) {
        try {
            const saveData = this.loadFromStorage(`save_slot_${saveSlot}`);
            if (!saveData) {
                throw new Error(`No save data in slot ${saveSlot}`);
            }
            
            // Create exportable format
            const exportData = {
                ...saveData,
                exportedAt: Date.now(),
                exportVersion: this.saveVersion,
                gameTitle: 'Harvest Moon Clone'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            return {
                blob: blob,
                filename: `harvest_moon_save_slot_${saveSlot}_${new Date().toISOString().slice(0, 10)}.json`
            };
            
        } catch (error) {
            throw new Error(`Failed to export save data: ${error.message}`);
        }
    }
    
    importSaveData(saveSlot, fileData) {
        try {
            const importedData = JSON.parse(fileData);
            
            // Validate imported data
            if (!this.validateSaveData(importedData)) {
                throw new Error('Invalid save file format');
            }
            
            // Remove export-specific fields
            delete importedData.exportedAt;
            delete importedData.exportVersion;
            delete importedData.gameTitle;
            
            // Update metadata for import
            importedData.metadata.saveSlot = saveSlot;
            importedData.metadata.importedAt = Date.now();
            
            // Save the imported data
            this.saveToStorage(`save_slot_${saveSlot}`, importedData);
            
            console.log(`Save data imported to slot ${saveSlot}`);
            return { success: true, saveSlot };
            
        } catch (error) {
            console.error('Failed to import save data:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Storage statistics and debugging
    getStorageStats() {
        return {
            ...this.getStats(),
            storageSupported: this.storageSupported,
            currentUsage: this.currentUsage,
            currentUsageMB: Math.round(this.currentUsage / (1024 * 1024) * 100) / 100,
            maxStorageSize: this.maxStorageSize,
            maxStorageMB: Math.round(this.maxStorageSize / (1024 * 1024) * 100) / 100,
            usagePercentage: Math.round((this.currentUsage / this.maxStorageSize) * 100),
            quotaExceeded: this.quotaExceeded,
            compressionEnabled: this.compressionEnabled,
            compressionRatio: Math.round(this.compressionRatio * 100) / 100,
            backupEnabled: this.backupEnabled
        };
    }
    
    listAllSaves() {
        const saves = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix) && !key.includes('backup')) {
                    const saveKey = key.replace(this.storagePrefix, '');
                    const data = localStorage.getItem(key);
                    
                    try {
                        const parsedData = JSON.parse(data);
                        saves.push({
                            key: saveKey,
                            size: data.length,
                            sizeMB: Math.round(data.length / (1024 * 1024) * 100) / 100,
                            timestamp: parsedData.timestamp,
                            version: parsedData.version,
                            metadata: parsedData.metadata
                        });
                    } catch (e) {
                        // Skip corrupted saves
                        saves.push({
                            key: saveKey,
                            size: data.length,
                            corrupted: true
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to list saves:', error);
        }
        
        return saves.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    
    clearAllSaves() {
        try {
            const keysToDelete = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    keysToDelete.push(key);
                }
            }
            
            for (const key of keysToDelete) {
                localStorage.removeItem(key);
            }
            
            this.updateStorageUsage();
            console.log(`Cleared ${keysToDelete.length} save files`);
            
            return { success: true, deletedCount: keysToDelete.length };
            
        } catch (error) {
            console.error('Failed to clear all saves:', error);
            return { success: false, error: error.message };
        }
    }
}