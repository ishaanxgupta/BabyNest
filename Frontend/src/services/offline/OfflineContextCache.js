/**
 * OfflineContextCache - Manages user context caching for offline operation
 * Port of Python cache.py to JavaScript
 */

import { offlineDatabaseService } from './OfflineDatabaseService';
import { CACHE_CONFIG, DEFAULT_USER_ID } from '../../config/config';

class OfflineContextCache {
  constructor() {
    this.memoryCache = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    await offlineDatabaseService.initialize();
    this.isInitialized = true;
    console.log('✅ OfflineContextCache initialized');
  }

  async getContext(userId = DEFAULT_USER_ID) {
    await this.initialize();

    // Check memory cache first
    if (this.memoryCache.has(userId)) {
      const cached = this.memoryCache.get(userId);
      if (this.isCacheValid(cached)) {
        return cached;
      }
    }

    // Check database cache
    const dbCache = await offlineDatabaseService.getCachedContext(userId);
    if (dbCache && this.isCacheValid(dbCache)) {
      this.memoryCache.set(userId, dbCache);
      return dbCache;
    }

    // Build fresh context from database
    const freshContext = await this.buildContext(userId);
    if (freshContext) {
      this.memoryCache.set(userId, freshContext);
      await offlineDatabaseService.setCachedContext(userId, freshContext);
    }

    return freshContext;
  }

  isCacheValid(cache) {
    if (!cache || !cache.last_updated) return false;
    
    const lastUpdated = new Date(cache.last_updated);
    const now = new Date();
    const ageMs = now.getTime() - lastUpdated.getTime();
    const maxAgeMs = CACHE_CONFIG.maxCacheAgeDays * 24 * 60 * 60 * 1000;
    
    return ageMs < maxAgeMs;
  }

  async buildContext(userId = DEFAULT_USER_ID) {
    try {
      const profile = await offlineDatabaseService.getProfile();
      
      if (!profile) {
        return null;
      }

      const currentWeek = await offlineDatabaseService.getCurrentWeek();
      
      // Fetch recent tracking data
      const [weightData, medicineData, symptomsData, bpData, dischargeData, moodData, sleepData] = await Promise.all([
        offlineDatabaseService.getWeightLogs(CACHE_CONFIG.maxTrackingEntries),
        offlineDatabaseService.getMedicineLogs(CACHE_CONFIG.maxTrackingEntries),
        offlineDatabaseService.getSymptomLogs(CACHE_CONFIG.maxTrackingEntries),
        offlineDatabaseService.getBloodPressureLogs(CACHE_CONFIG.maxTrackingEntries),
        offlineDatabaseService.getDischargeLogs(CACHE_CONFIG.maxTrackingEntries),
        offlineDatabaseService.getMoodLogs(CACHE_CONFIG.maxTrackingEntries),
        offlineDatabaseService.getSleepLogs(CACHE_CONFIG.maxTrackingEntries),
      ]);

      const context = {
        current_week: currentWeek,
        location: profile.user_location,
        age: profile.age,
        weight: profile.weight,
        due_date: profile.dueDate,
        lmp: profile.lmp,
        cycle_length: profile.cycleLength,
        period_length: profile.periodLength,
        tracking_data: {
          weight: weightData.map(w => ({
            week: w.week_number,
            weight: w.weight,
            note: w.note,
            date: w.created_at
          })),
          medicine: medicineData.map(m => ({
            week: m.week_number,
            name: m.name,
            dose: m.dose,
            time: m.time,
            taken: m.taken === 1,
            note: m.note,
            date: m.created_at
          })),
          symptoms: symptomsData.map(s => ({
            week: s.week_number,
            symptom: s.symptom,
            note: s.note,
            date: s.created_at
          })),
          blood_pressure: bpData.map(bp => ({
            week: bp.week_number,
            systolic: bp.systolic,
            diastolic: bp.diastolic,
            time: bp.time,
            note: bp.note,
            date: bp.created_at
          })),
          discharge: dischargeData.map(d => ({
            week: d.week_number,
            type: d.type,
            color: d.color,
            bleeding: d.bleeding,
            note: d.note,
            date: d.created_at
          })),
          mood: moodData.map(m => ({
            week: m.week_number,
            mood: m.mood,
            intensity: m.intensity,
            note: m.note,
            date: m.created_at
          })),
          sleep: sleepData.map(s => ({
            week: s.week_number,
            duration: s.duration,
            bedtime: s.bedtime,
            wake_time: s.wake_time,
            quality: s.quality,
            note: s.note,
            date: s.created_at
          })),
        },
        last_updated: new Date().toISOString()
      };

      return context;
    } catch (error) {
      console.error('Error building context:', error);
      return null;
    }
  }

  async updateCache(userId = DEFAULT_USER_ID, dataType = null, operation = 'update') {
    await this.initialize();

    let currentCache = this.memoryCache.get(userId);
    
    if (!currentCache) {
      currentCache = await offlineDatabaseService.getCachedContext(userId);
    }

    if (!currentCache) {
      // Build full context if no cache exists
      const freshContext = await this.buildContext(userId);
      if (freshContext) {
        this.memoryCache.set(userId, freshContext);
        await offlineDatabaseService.setCachedContext(userId, freshContext);
      }
      return;
    }

    // Update specific data type
    if (dataType) {
      const updatedData = await this.fetchSpecificData(dataType);
      if (updatedData !== null) {
        if (dataType === 'profile') {
          Object.assign(currentCache, updatedData);
        } else {
          currentCache.tracking_data = currentCache.tracking_data || {};
          currentCache.tracking_data[dataType] = updatedData;
        }
        currentCache.last_updated = new Date().toISOString();
      }
    }

    this.memoryCache.set(userId, currentCache);
    await offlineDatabaseService.setCachedContext(userId, currentCache);
    
    // Cleanup if needed
    this.cleanupMemoryCache();
  }

  async fetchSpecificData(dataType) {
    const limit = CACHE_CONFIG.maxTrackingEntries;

    switch (dataType) {
      case 'profile': {
        const profile = await offlineDatabaseService.getProfile();
        if (profile) {
          const currentWeek = await offlineDatabaseService.getCurrentWeek();
          return {
            current_week: currentWeek,
            location: profile.user_location,
            age: profile.age,
            weight: profile.weight,
            due_date: profile.dueDate,
            lmp: profile.lmp,
            cycle_length: profile.cycleLength,
            period_length: profile.periodLength,
          };
        }
        return null;
      }
      
      case 'weight': {
        const data = await offlineDatabaseService.getWeightLogs(limit);
        return data.map(w => ({
          week: w.week_number,
          weight: w.weight,
          note: w.note,
          date: w.created_at
        }));
      }
      
      case 'medicine': {
        const data = await offlineDatabaseService.getMedicineLogs(limit);
        return data.map(m => ({
          week: m.week_number,
          name: m.name,
          dose: m.dose,
          time: m.time,
          taken: m.taken === 1,
          note: m.note,
          date: m.created_at
        }));
      }
      
      case 'symptoms': {
        const data = await offlineDatabaseService.getSymptomLogs(limit);
        return data.map(s => ({
          week: s.week_number,
          symptom: s.symptom,
          note: s.note,
          date: s.created_at
        }));
      }
      
      case 'blood_pressure': {
        const data = await offlineDatabaseService.getBloodPressureLogs(limit);
        return data.map(bp => ({
          week: bp.week_number,
          systolic: bp.systolic,
          diastolic: bp.diastolic,
          time: bp.time,
          note: bp.note,
          date: bp.created_at
        }));
      }
      
      case 'discharge': {
        const data = await offlineDatabaseService.getDischargeLogs(limit);
        return data.map(d => ({
          week: d.week_number,
          type: d.type,
          color: d.color,
          bleeding: d.bleeding,
          note: d.note,
          date: d.created_at
        }));
      }

      case 'mood': {
        const data = await offlineDatabaseService.getMoodLogs(limit);
        return data.map(m => ({
          week: m.week_number,
          mood: m.mood,
          intensity: m.intensity,
          note: m.note,
          date: m.created_at
        }));
      }

      case 'sleep': {
        const data = await offlineDatabaseService.getSleepLogs(limit);
        return data.map(s => ({
          week: s.week_number,
          duration: s.duration,
          bedtime: s.bedtime,
          wake_time: s.wake_time,
          quality: s.quality,
          note: s.note,
          date: s.created_at
        }));
      }
      
      default:
        return null;
    }
  }

  cleanupMemoryCache() {
    if (this.memoryCache.size > CACHE_CONFIG.maxMemoryCacheSize) {
      // Remove oldest entries
      const sortedEntries = Array.from(this.memoryCache.entries())
        .sort((a, b) => {
          const dateA = new Date(a[1].last_updated || '1970-01-01');
          const dateB = new Date(b[1].last_updated || '1970-01-01');
          return dateA.getTime() - dateB.getTime();
        });

      const toRemove = sortedEntries.slice(0, this.memoryCache.size - CACHE_CONFIG.maxMemoryCacheSize);
      for (const [userId] of toRemove) {
        this.memoryCache.delete(userId);
      }
    }
  }

  async invalidateCache(userId = null) {
    if (userId) {
      this.memoryCache.delete(userId);
      await offlineDatabaseService.clearCache(userId);
    } else {
      this.memoryCache.clear();
      await offlineDatabaseService.clearCache();
    }
  }

  getCacheStats() {
    return {
      memory_cache_size: this.memoryCache.size,
      max_memory_cache_size: CACHE_CONFIG.maxMemoryCacheSize,
      max_cache_size_mb: CACHE_CONFIG.maxCacheSizeMb,
      max_tracking_entries: CACHE_CONFIG.maxTrackingEntries,
      max_cache_age_days: CACHE_CONFIG.maxCacheAgeDays,
    };
  }
}

export const offlineContextCache = new OfflineContextCache();
export default offlineContextCache;
