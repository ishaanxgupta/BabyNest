/**
 * ActionExecutor - Maps JSON actions to local database operations
 * Handles structured action execution with validation and error handling
 * Fully offline - uses database.js instead of backend API
 */

import * as db from './database';

class ActionExecutor {
  constructor() {
    this.actionHistory = [];
    this.isOnline = true;
  }

  /**
   * Execute a structured action
   */
  async executeAction(action, userContext = {}) {
    try {
      if (!this.validateAction(action)) {
        return { success: false, message: '❌ Invalid action structure', error: 'Missing required fields: type and payload' };
      }

      let result;
      switch (action.type) {
        case 'create_appointment': result = await this.createAppointment(action.payload, userContext); break;
        case 'update_appointment': result = await this.updateAppointment(action.payload, userContext); break;
        case 'delete_appointment': result = await this.deleteAppointment(action.payload, userContext); break;
        case 'create_weight': result = await this.createWeight(action.payload, userContext); break;
        case 'create_mood': result = await this.createMood(action.payload, userContext); break;
        case 'create_sleep': result = await this.createSleep(action.payload, userContext); break;
        case 'create_symptom': result = await this.createSymptom(action.payload, userContext); break;
        case 'create_medicine': result = await this.createMedicine(action.payload, userContext); break;
        case 'create_blood_pressure': result = await this.createBloodPressure(action.payload, userContext); break;
        case 'query_stats': result = await this.queryStats(action.payload, userContext); break;
        case 'undo_last': result = await this.undoLastAction(userContext); break;
        case 'navigate': result = await this.navigate(action.payload, userContext); break;
        default:
          result = { success: false, message: `❌ Unknown action type: ${action.type}`, error: 'Unsupported action type' };
          break;
      }

      if (result.success && this.isUndoableAction(action.type)) {
        this.logAction(action, userContext, result);
      }

      return result;
    } catch (error) {
      console.error('ActionExecutor error:', error);
      return { success: false, message: `❌ Action execution failed: ${error.message}`, error: error.message };
    }
  }

  validateAction(action) {
    return action && typeof action === 'object' && action.type && typeof action.type === 'string' && action.payload && typeof action.payload === 'object';
  }

  isUndoableAction(actionType) {
    return ['create_appointment', 'update_appointment', 'delete_appointment', 'create_weight', 'create_mood', 'create_sleep', 'create_symptom', 'create_medicine', 'create_blood_pressure'].includes(actionType);
  }

  logAction(action, userContext, result) {
    this.actionHistory.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action, userContext, result,
      executed: true, undone: false
    });
    if (this.actionHistory.length > 50) this.actionHistory = this.actionHistory.slice(-50);
  }

  // ==================== CREATE OPERATIONS (Local DB) ====================

  async createAppointment(payload, userContext) {
    try {
      const requiredFields = ['title', 'startISO'];
      const missingFields = requiredFields.filter(f => !payload[f]);
      if (missingFields.length > 0) {
        return { success: false, message: `❌ Missing: ${missingFields.join(', ')}`, error: 'Missing required fields', missingFields };
      }
      const data = {
        title: payload.title,
        description: payload.description || '',
        location: payload.location || '',
        appointment_date: this.formatDate(payload.startISO),
        appointment_time: this.formatTime(payload.startISO),
        appointment_status: 'scheduled',
        content: payload.description || '',
        week_number: userContext.current_week || 12
      };
      const result = await db.addAppointment(data);
      return {
        success: true,
        message: `✅ Appointment "${payload.title}" created!\n\n📅 ${data.appointment_date}\n⏰ ${data.appointment_time}\n📍 ${data.location}`,
        data: result, actionType: 'create_appointment', appointmentId: result.id
      };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async updateAppointment(payload, userContext) {
    try {
      if (!payload.id) return { success: false, message: '❌ Appointment ID required', error: 'Missing appointment ID' };
      const updateData = {};
      if (payload.title) updateData.title = payload.title;
      if (payload.description) updateData.description = payload.description;
      if (payload.location) updateData.appointment_location = payload.location;
      if (payload.startISO) {
        updateData.appointment_date = this.formatDate(payload.startISO);
        updateData.appointment_time = this.formatTime(payload.startISO);
      }
      await db.updateAppointment(payload.id, updateData);
      return { success: true, message: '✅ Appointment updated!', actionType: 'update_appointment' };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async deleteAppointment(payload, userContext) {
    try {
      if (!payload.id) return { success: false, message: '❌ Appointment ID required', error: 'Missing appointment ID' };
      await db.deleteAppointment(payload.id);
      return { success: true, message: '✅ Appointment deleted!', actionType: 'delete_appointment' };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async createWeight(payload, userContext) {
    try {
      if (!payload.weight) return { success: false, message: '❌ Weight value required', error: 'Missing weight' };
      const data = { weight: payload.weight, week_number: payload.week || userContext.current_week || 12, note: payload.note || '' };
      const result = await db.addWeight(data);
      return { success: true, message: `⚖️ Weight logged!\n\n**${payload.weight}kg** (Week ${data.week_number})`, actionType: 'create_weight', weightId: result.id };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async createMood(payload, userContext) {
    try {
      if (!payload.mood) return { success: false, message: '❌ Mood value required', error: 'Missing mood' };
      const data = { mood: payload.mood, intensity: payload.intensity || 'medium', note: payload.note || '', week_number: userContext.current_week || 12 };
      const result = await db.addMood(data);
      return { success: true, message: `😊 Mood logged!\n\n**${payload.mood}** (${data.intensity})`, actionType: 'create_mood', moodId: result.id };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async createSleep(payload, userContext) {
    try {
      if (!payload.duration) return { success: false, message: '❌ Sleep duration required', error: 'Missing duration' };
      const data = { duration: payload.duration, bedtime: payload.bedtime || null, wake_time: payload.wake_time || null, quality: payload.quality || 'good', note: payload.note || '', week_number: userContext.current_week || 12 };
      const result = await db.addSleep(data);
      return { success: true, message: `😴 Sleep logged!\n\n**${payload.duration}h** (${data.quality})`, actionType: 'create_sleep', sleepId: result.id };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async createSymptom(payload, userContext) {
    try {
      if (!payload.symptom) return { success: false, message: '❌ Symptom required', error: 'Missing symptom' };
      const data = { symptom: payload.symptom, week_number: payload.week || userContext.current_week || 12, note: payload.note || '' };
      const result = await db.addSymptom(data);
      return { success: true, message: `🤒 Symptom logged!\n\n**${payload.symptom}**`, actionType: 'create_symptom', symptomId: result.id };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async createMedicine(payload, userContext) {
    try {
      if (!payload.name) return { success: false, message: '❌ Medicine name required', error: 'Missing name' };
      const data = { name: payload.name, dose: payload.dose || '', time: payload.time || '', week_number: payload.week || userContext.current_week || 12, note: payload.note || '' };
      const result = await db.addMedicine(data);
      return { success: true, message: `💊 Medicine logged!\n\n**${payload.name}** ${data.dose}`, actionType: 'create_medicine', medicineId: result.id };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async createBloodPressure(payload, userContext) {
    try {
      if (!payload.systolic || !payload.diastolic) return { success: false, message: '❌ Both BP values required', error: 'Missing BP values' };
      const data = { systolic: payload.systolic, diastolic: payload.diastolic, week_number: payload.week || userContext.current_week || 12, note: payload.note || '' };
      const result = await db.addBloodPressure(data);
      return { success: true, message: `🩸 BP logged!\n\n**${payload.systolic}/${payload.diastolic}** mmHg`, actionType: 'create_blood_pressure', bpId: result.id };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  async queryStats(payload, userContext) {
    try {
      if (!payload.metric) return { success: false, message: '❌ Metric type required', error: 'Missing metric' };
      let allData = [];
      switch (payload.metric) {
        case 'weight': allData = await db.getWeightHistory(); break;
        case 'mood': allData = await db.getMoodHistory(); break;
        case 'sleep': allData = await db.getSleepHistory(); break;
        case 'symptoms': allData = await db.getSymptomsHistory(); break;
        case 'blood_pressure': allData = await db.getBloodPressureHistory(); break;
        default: allData = [];
      }
      return { success: true, message: `📊 Analytics: ${allData.length} ${payload.metric} entries found.`, data: allData, actionType: 'query_stats' };
    } catch (error) {
      return { success: false, message: `❌ Failed: ${error.message}`, error: error.message };
    }
  }

  // ==================== UNDO OPERATIONS (Local DB) ====================

  async undoLastAction(userContext) {
    try {
      const lastAction = this.actionHistory.slice().reverse().find(a => a.executed && !a.undone);
      if (!lastAction) return { success: false, message: '❌ No actions to undo', error: 'No undoable action' };
      const rollbackResult = await this.performRollback(lastAction);
      if (rollbackResult.success) {
        lastAction.undone = true;
        return { success: true, message: '↩️ Last action undone!', actionType: 'undo_last', undoneAction: lastAction.action.type, rollbackDetails: rollbackResult.message };
      }
      return { success: false, message: `❌ Undo failed: ${rollbackResult.message}`, error: rollbackResult.message };
    } catch (error) {
      return { success: false, message: `❌ Undo failed: ${error.message}`, error: error.message };
    }
  }

  async performRollback(actionLog) {
    try {
      const { action, result } = actionLog;
      switch (action.type) {
        case 'create_appointment': return await this.rollbackCreateAppointment(result);
        case 'update_appointment': return await this.rollbackUpdateAppointment(action.payload, result);
        case 'delete_appointment': return await this.rollbackDeleteAppointment(result);
        case 'create_weight': return await this.rollbackCreateWeight(result);
        case 'create_mood': return await this.rollbackCreateMood(result);
        case 'create_sleep': return await this.rollbackCreateSleep(result);
        case 'create_symptom': return await this.rollbackCreateSymptom(result);
        case 'create_medicine': return await this.rollbackCreateMedicine(result);
        case 'create_blood_pressure': return await this.rollbackCreateBloodPressure(result);
        default: return { success: false, message: `Cannot undo: ${action.type}` };
      }
    } catch (error) {
      return { success: false, message: `Rollback failed: ${error.message}` };
    }
  }

  async navigate(payload, userContext) {
    if (!payload.screen) return { success: false, message: '❌ Screen name required', error: 'Missing screen' };
    return { success: true, message: `🚀 Navigating to ${payload.screen}...`, actionType: 'navigate', screen: payload.screen };
  }

  // ==================== ROLLBACK OPERATIONS (Local DB) ====================

  async rollbackCreateAppointment(result) {
    try {
      if (result.appointmentId) { await db.deleteAppointment(result.appointmentId); return { success: true, message: 'Appointment creation rolled back' }; }
      return { success: false, message: 'No appointment ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackUpdateAppointment(originalPayload, result) {
    try {
      if (result.appointmentId && result.previousData) { await db.updateAppointment(result.appointmentId, result.previousData); return { success: true, message: 'Appointment update rolled back' }; }
      return { success: false, message: 'Cannot rollback - missing data' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackDeleteAppointment(result) {
    try {
      if (result.deletedAppointment) { await db.addAppointment(result.deletedAppointment); return { success: true, message: 'Appointment restored' }; }
      return { success: false, message: 'Cannot restore - missing data' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackCreateWeight(result) {
    try {
      if (result.weightId) { await db.deleteWeight(result.weightId); return { success: true, message: 'Weight entry rolled back' }; }
      return { success: false, message: 'No weight ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackCreateMood(result) {
    try {
      if (result.moodId) { await db.deleteMood(result.moodId); return { success: true, message: 'Mood entry rolled back' }; }
      return { success: false, message: 'No mood ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackCreateSleep(result) {
    try {
      if (result.sleepId) { await db.deleteSleep(result.sleepId); return { success: true, message: 'Sleep entry rolled back' }; }
      return { success: false, message: 'No sleep ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackCreateSymptom(result) {
    try {
      if (result.symptomId) { await db.deleteSymptom(result.symptomId); return { success: true, message: 'Symptom entry rolled back' }; }
      return { success: false, message: 'No symptom ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackCreateMedicine(result) {
    try {
      if (result.medicineId) { await db.deleteMedicine(result.medicineId); return { success: true, message: 'Medicine entry rolled back' }; }
      return { success: false, message: 'No medicine ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  async rollbackCreateBloodPressure(result) {
    try {
      if (result.bpId) { await db.deleteBloodPressure(result.bpId); return { success: true, message: 'BP entry rolled back' }; }
      return { success: false, message: 'No BP ID to rollback' };
    } catch (e) { return { success: false, message: `Rollback failed: ${e.message}` }; }
  }

  // ==================== UTILITIES ====================

  formatDate(isoString) {
    if (!isoString) return null;
    const directMatch = isoString.match(/^\d{4}-\d{2}-\d{2}/);
    if (directMatch) return directMatch[0];
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  formatTime(isoString) {
    if (!isoString) return null;
    return new Date(isoString).toTimeString().slice(0, 5);
  }

  getActionHistory() { return this.actionHistory; }
  clearActionHistory() { this.actionHistory = []; }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
export default actionExecutor;
