/**
 * OfflineAPIService - Replaces all backend API calls with local database operations
 * This service intercepts API-like calls and routes them to local SQLite operations
 */

import { offlineDatabaseService } from './OfflineDatabaseService';
import { offlineContextCache } from './OfflineContextCache';
import { DEFAULT_USER_ID } from '../../config/config';

class OfflineAPIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    await offlineDatabaseService.initialize();
    this.isInitialized = true;
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // Appointment Operations
  async addAppointment(data) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.createAppointment({
      title: data.title,
      content: data.content || data.note || '',
      date: data.date || data.appointment_date,
      time: data.time || data.appointment_time,
      location: data.location || data.appointment_location,
      status: 'pending'
    });
    return { success: true, id: result.id, message: 'Appointment created successfully' };
  }

  async getAppointments() {
    await this.ensureInitialized();
    return await offlineDatabaseService.getAppointments();
  }

  async updateAppointment(id, data) {
    await this.ensureInitialized();
    await offlineDatabaseService.updateAppointment(id, {
      title: data.title,
      content: data.content || data.note || '',
      date: data.date || data.appointment_date,
      time: data.time || data.appointment_time,
      location: data.location || data.appointment_location,
      status: data.status || data.appointment_status || 'pending'
    });
    return { success: true, message: 'Appointment updated successfully' };
  }

  async deleteAppointment(id) {
    await this.ensureInitialized();
    await offlineDatabaseService.deleteAppointment(id);
    return { success: true, message: 'Appointment deleted successfully' };
  }

  // Weight Operations
  async logWeight(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logWeight({
      week_number: weekNumber || data.week_number || 1,
      weight: data.weight,
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'weight', 'create');
    return { success: true, id: result.id, message: 'Weight logged successfully' };
  }

  async getWeightLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getWeightLogs(limit);
  }

  // Symptoms Operations
  async logSymptoms(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logSymptom({
      week_number: weekNumber || data.week_number || 1,
      symptom: data.symptom,
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'symptoms', 'create');
    return { success: true, id: result.id, message: 'Symptom logged successfully' };
  }

  async getSymptomsLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getSymptomLogs(limit);
  }

  // Blood Pressure Operations
  async logBloodPressure(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logBloodPressure({
      week_number: weekNumber || data.week_number || 1,
      systolic: data.systolic,
      diastolic: data.diastolic,
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'blood_pressure', 'create');
    return { success: true, id: result.id, message: 'Blood pressure logged successfully' };
  }

  async getBloodPressureLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getBloodPressureLogs(limit);
  }

  // Medicine Operations
  async logMedicine(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logMedicine({
      week_number: weekNumber || data.week_number || 1,
      name: data.name || data.medicine_name,
      dose: data.dose,
      time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      taken: data.taken || false,
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'medicine', 'create');
    return { success: true, id: result.id, message: 'Medicine logged successfully' };
  }

  async getMedicineLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getMedicineLogs(limit);
  }

  // Discharge Operations
  async logDischarge(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logDischarge({
      week_number: weekNumber || data.week_number || 1,
      type: data.type || data.discharge_type || 'normal',
      color: data.color || 'clear',
      bleeding: data.bleeding || 'none',
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'discharge', 'create');
    return { success: true, id: result.id, message: 'Discharge logged successfully' };
  }

  async getDischargeLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getDischargeLogs(limit);
  }

  // Mood Operations
  async logMood(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logMood({
      week_number: weekNumber || data.week_number || 1,
      mood: data.mood,
      intensity: data.intensity || '',
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'mood', 'create');
    return { success: true, id: result.id, message: 'Mood logged successfully' };
  }

  async getMoodLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getMoodLogs(limit);
  }

  // Sleep Operations
  async logSleep(data, weekNumber) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.logSleep({
      week_number: weekNumber || data.week_number || 1,
      duration: data.duration || data.hours,
      bedtime: data.bedtime || '',
      wake_time: data.wake_time || '',
      quality: data.quality || '',
      note: data.note || ''
    });
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'sleep', 'create');
    return { success: true, id: result.id, message: 'Sleep logged successfully' };
  }

  async getSleepLogs(limit = 10) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getSleepLogs(limit);
  }

  // Tasks Operations
  async getTasks(weekFilter = null) {
    await this.ensureInitialized();
    return await offlineDatabaseService.getTasks(weekFilter);
  }

  async updateTaskStatus(id, status) {
    await this.ensureInitialized();
    return await offlineDatabaseService.updateTaskStatus(id, status);
  }

  // Profile Operations
  async getProfile() {
    await this.ensureInitialized();
    return await offlineDatabaseService.getProfile();
  }

  async setProfile(data) {
    await this.ensureInitialized();
    const result = await offlineDatabaseService.setProfile(data);
    await offlineContextCache.updateCache(DEFAULT_USER_ID, 'profile', 'create');
    return { success: true, ...result, message: 'Profile saved successfully' };
  }

  async deleteProfile() {
    await this.ensureInitialized();
    await offlineDatabaseService.db.executeSql('DELETE FROM profile');
    await offlineContextCache.invalidateCache(DEFAULT_USER_ID);
    return { success: true, message: 'Profile deleted successfully' };
  }

  // Analytics Operations (computed from local data)
  async getAnalytics(metric, userContext) {
    await this.ensureInitialized();
    
    const analytics = {
      metric,
      data: [],
      summary: {}
    };

    switch (metric) {
      case 'weight': {
        const logs = await this.getWeightLogs(30);
        analytics.data = logs;
        if (logs.length > 0) {
          const weights = logs.map(l => l.weight);
          analytics.summary = {
            latest: weights[0],
            average: (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1),
            min: Math.min(...weights),
            max: Math.max(...weights),
            count: logs.length
          };
        }
        break;
      }
      case 'sleep': {
        const logs = await this.getSleepLogs(30);
        analytics.data = logs;
        if (logs.length > 0) {
          const durations = logs.map(l => l.duration);
          analytics.summary = {
            average: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1),
            min: Math.min(...durations),
            max: Math.max(...durations),
            count: logs.length
          };
        }
        break;
      }
      case 'blood_pressure': {
        const logs = await this.getBloodPressureLogs(30);
        analytics.data = logs;
        if (logs.length > 0) {
          analytics.summary = {
            latest: `${logs[0].systolic}/${logs[0].diastolic}`,
            count: logs.length
          };
        }
        break;
      }
      case 'mood': {
        const logs = await this.getMoodLogs(30);
        analytics.data = logs;
        if (logs.length > 0) {
          const moodCounts = {};
          logs.forEach(l => {
            moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
          });
          analytics.summary = {
            moodDistribution: moodCounts,
            count: logs.length
          };
        }
        break;
      }
    }

    return analytics;
  }

  // Helper to get current week
  async getCurrentWeek() {
    await this.ensureInitialized();
    return await offlineDatabaseService.getCurrentWeek();
  }
}

export const offlineAPIService = new OfflineAPIService();
export default offlineAPIService;
