/**
 * OfflineDatabaseService - SQLite wrapper for React Native offline operation
 * Replaces the Python Flask backend database operations
 */

import SQLite from 'react-native-sqlite-storage';
import { DATABASE_CONFIG, CACHE_CONFIG } from '../../config/config';

SQLite.enablePromise(true);

class OfflineDatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_CONFIG.name,
        location: 'default',
      });

      await this.createTables();
      await this.seedDefaultData();
      this.isInitialized = true;
      console.log('✅ OfflineDatabaseService initialized');
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        appointment_location TEXT NOT NULL,
        appointment_status TEXT CHECK(appointment_status IN ('pending', 'completed')) DEFAULT 'pending'
      )`,
      
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        starting_week INTEGER NOT NULL,
        ending_week INTEGER NOT NULL,
        task_priority TEXT CHECK(task_priority IN ('low', 'medium', 'high')) DEFAULT 'low',
        isOptional INTEGER DEFAULT 0,
        isAppointmentMade INTEGER DEFAULT 0,
        task_status TEXT CHECK(task_status IN ('pending', 'completed')) DEFAULT 'pending'
      )`,
      
      `CREATE TABLE IF NOT EXISTS blood_pressure_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        time TEXT NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS discharge_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL,
        bleeding TEXT NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lmp TEXT NOT NULL,
        cycleLength INTEGER NOT NULL,
        periodLength INTEGER NOT NULL,
        age INTEGER NOT NULL,
        weight INTEGER NOT NULL,
        user_location TEXT NOT NULL,
        dueDate TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS weekly_weight (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        weight REAL NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS weekly_medicine (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        name TEXT NOT NULL,
        dose TEXT NOT NULL,
        time TEXT NOT NULL,
        taken INTEGER DEFAULT 0,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS weekly_symptoms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        symptom TEXT NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS context_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        cache_data TEXT NOT NULL,
        last_updated TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS mood_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        mood TEXT NOT NULL,
        intensity TEXT,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS sleep_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        duration REAL NOT NULL,
        bedtime TEXT,
        wake_time TEXT,
        quality TEXT,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const query of queries) {
      await this.db.executeSql(query);
    }
    
    console.log('✅ Database tables created');
  }

  async seedDefaultData() {
    const [profileResult] = await this.db.executeSql('SELECT COUNT(*) as count FROM profile');
    const profileCount = profileResult.rows.item(0).count;
    
    if (profileCount === 0) {
      console.log('📦 Seeding default tasks data...');
      await this.seedTasks();
    }
  }

  async seedTasks() {
    const defaultTasks = [
      { title: 'Initial Prenatal Visit', content: 'First doctor visit to confirm pregnancy and health check.', starting_week: 4, ending_week: 4, priority: 'high' },
      { title: 'Early Ultrasound', content: 'Confirm pregnancy location and heartbeat.', starting_week: 6, ending_week: 8, priority: 'high' },
      { title: 'Folic Acid Supplementation', content: 'Start folic acid for neural tube development.', starting_week: 4, ending_week: 12, priority: 'high' },
      { title: 'Blood Tests', content: 'Check for blood type, hemoglobin, and infections.', starting_week: 8, ending_week: 10, priority: 'high' },
      { title: 'Down Syndrome Screening', content: 'Non-invasive prenatal screening for chromosomal conditions.', starting_week: 10, ending_week: 12, priority: 'medium' },
      { title: 'NT Scan', content: 'Nuchal translucency scan for fetal abnormalities.', starting_week: 12, ending_week: 14, priority: 'high' },
      { title: 'Gestational Diabetes Test', content: 'Glucose test to check blood sugar levels.', starting_week: 14, ending_week: 16, priority: 'high' },
      { title: 'Detailed Anomaly Scan', content: '20-week scan to check fetal development.', starting_week: 18, ending_week: 20, priority: 'high' },
      { title: 'Fetal Movement Monitoring', content: 'Track baby movements for health assessment.', starting_week: 21, ending_week: 24, priority: 'medium' },
      { title: 'Iron and Calcium Supplements', content: 'Ensure proper bone and blood health for mother and baby.', starting_week: 21, ending_week: 28, priority: 'medium' },
      { title: 'Rh Factor Screening', content: 'Test if mother needs Rh immunoglobulin.', starting_week: 26, ending_week: 28, priority: 'high' },
      { title: 'Glucose Tolerance Test', content: 'Second test if needed for gestational diabetes.', starting_week: 28, ending_week: 28, priority: 'medium' },
      { title: 'Pre-Birth Vaccination', content: 'Tdap and flu shots for maternal and newborn protection.', starting_week: 30, ending_week: 32, priority: 'high' },
      { title: 'Third-Trimester Ultrasound', content: 'Assess baby\'s growth and position.', starting_week: 30, ending_week: 32, priority: 'high' },
      { title: 'Birth Plan Discussion', content: 'Discuss delivery preferences with doctor.', starting_week: 33, ending_week: 34, priority: 'medium' },
      { title: 'Hospital Tour', content: 'Visit maternity hospital to prepare for delivery.', starting_week: 33, ending_week: 34, priority: 'low' },
      { title: 'Labor Signs Monitoring', content: 'Educate about labor contractions and when to go to hospital.', starting_week: 36, ending_week: 40, priority: 'high' },
      { title: 'Final Checkups', content: 'Last medical assessments before labor.', starting_week: 38, ending_week: 40, priority: 'high' },
    ];

    for (const task of defaultTasks) {
      await this.db.executeSql(
        'INSERT INTO tasks (title, content, starting_week, ending_week, task_priority) VALUES (?, ?, ?, ?, ?)',
        [task.title, task.content, task.starting_week, task.ending_week, task.priority]
      );
    }
  }

  // Profile Operations
  async getProfile() {
    const [result] = await this.db.executeSql('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
    if (result.rows.length > 0) {
      return result.rows.item(0);
    }
    return null;
  }

  async setProfile(data) {
    const { lmp, cycleLength, periodLength, age, weight, location } = data;
    const dueDate = this.calculateDueDate(lmp, cycleLength);
    
    await this.db.executeSql('DELETE FROM profile');
    await this.db.executeSql(
      'INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lmp, cycleLength, periodLength, age, weight, location, dueDate]
    );
    
    return { dueDate };
  }

  calculateDueDate(lmpStr, cycleLength) {
    const lmpDate = new Date(lmpStr);
    const adjustment = (cycleLength || 28) - 28;
    const dueDate = new Date(lmpDate.getTime() + (280 + adjustment) * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  }

  // Appointments Operations
  async getAppointments() {
    const [result] = await this.db.executeSql('SELECT * FROM appointments ORDER BY appointment_date ASC');
    return this.rowsToArray(result.rows);
  }

  async createAppointment(data) {
    const { title, content, date, time, location, status = 'pending' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content || '', date, time, location, status]
    );
    return { id: result.insertId };
  }

  async updateAppointment(id, data) {
    const { title, content, date, time, location, status } = data;
    await this.db.executeSql(
      'UPDATE appointments SET title = ?, content = ?, appointment_date = ?, appointment_time = ?, appointment_location = ?, appointment_status = ? WHERE id = ?',
      [title, content, date, time, location, status, id]
    );
    return { success: true };
  }

  async deleteAppointment(id) {
    await this.db.executeSql('DELETE FROM appointments WHERE id = ?', [id]);
    return { success: true };
  }

  // Tasks Operations
  async getTasks(weekFilter = null) {
    let query = 'SELECT * FROM tasks';
    const params = [];
    
    if (weekFilter) {
      query += ' WHERE starting_week <= ? AND ending_week >= ?';
      params.push(weekFilter, weekFilter);
    }
    
    query += ' ORDER BY starting_week ASC';
    const [result] = await this.db.executeSql(query, params);
    return this.rowsToArray(result.rows);
  }

  async updateTaskStatus(id, status) {
    await this.db.executeSql('UPDATE tasks SET task_status = ? WHERE id = ?', [status, id]);
    return { success: true };
  }

  // Weight Operations
  async getWeightLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM weekly_weight ORDER BY week_number DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logWeight(data) {
    const { week_number, weight, note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO weekly_weight (week_number, weight, note) VALUES (?, ?, ?)',
      [week_number, weight, note]
    );
    return { id: result.insertId };
  }

  // Medicine Operations
  async getMedicineLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM weekly_medicine ORDER BY week_number DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logMedicine(data) {
    const { week_number, name, dose, time, taken = false, note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO weekly_medicine (week_number, name, dose, time, taken, note) VALUES (?, ?, ?, ?, ?, ?)',
      [week_number, name, dose, time, taken ? 1 : 0, note]
    );
    return { id: result.insertId };
  }

  // Symptoms Operations
  async getSymptomLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM weekly_symptoms ORDER BY week_number DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logSymptom(data) {
    const { week_number, symptom, note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO weekly_symptoms (week_number, symptom, note) VALUES (?, ?, ?)',
      [week_number, symptom, note]
    );
    return { id: result.insertId };
  }

  // Blood Pressure Operations
  async getBloodPressureLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM blood_pressure_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logBloodPressure(data) {
    const { week_number, systolic, diastolic, time, note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO blood_pressure_logs (week_number, systolic, diastolic, time, note) VALUES (?, ?, ?, ?, ?)',
      [week_number, systolic, diastolic, time, note]
    );
    return { id: result.insertId };
  }

  // Discharge Operations
  async getDischargeLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM discharge_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logDischarge(data) {
    const { week_number, type, color, bleeding, note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO discharge_logs (week_number, type, color, bleeding, note) VALUES (?, ?, ?, ?, ?)',
      [week_number, type, color, bleeding, note]
    );
    return { id: result.insertId };
  }

  // Mood Operations
  async getMoodLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM mood_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logMood(data) {
    const { week_number, mood, intensity = '', note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO mood_logs (week_number, mood, intensity, note) VALUES (?, ?, ?, ?)',
      [week_number, mood, intensity, note]
    );
    return { id: result.insertId };
  }

  // Sleep Operations
  async getSleepLogs(limit = 10) {
    const [result] = await this.db.executeSql(
      'SELECT * FROM sleep_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return this.rowsToArray(result.rows);
  }

  async logSleep(data) {
    const { week_number, duration, bedtime = '', wake_time = '', quality = '', note = '' } = data;
    const [result] = await this.db.executeSql(
      'INSERT INTO sleep_logs (week_number, duration, bedtime, wake_time, quality, note) VALUES (?, ?, ?, ?, ?, ?)',
      [week_number, duration, bedtime, wake_time, quality, note]
    );
    return { id: result.insertId };
  }

  // Cache Operations
  async getCachedContext(userId = 'default') {
    const [result] = await this.db.executeSql(
      'SELECT cache_data FROM context_cache WHERE user_id = ?',
      [userId]
    );
    if (result.rows.length > 0) {
      try {
        return JSON.parse(result.rows.item(0).cache_data);
      } catch {
        return null;
      }
    }
    return null;
  }

  async setCachedContext(userId, cacheData) {
    const cacheJson = JSON.stringify(cacheData);
    await this.db.executeSql(
      `INSERT OR REPLACE INTO context_cache (user_id, cache_data, last_updated) VALUES (?, ?, datetime('now'))`,
      [userId, cacheJson]
    );
  }

  async clearCache(userId = null) {
    if (userId) {
      await this.db.executeSql('DELETE FROM context_cache WHERE user_id = ?', [userId]);
    } else {
      await this.db.executeSql('DELETE FROM context_cache');
    }
  }

  // Utility Methods
  rowsToArray(rows) {
    const arr = [];
    for (let i = 0; i < rows.length; i++) {
      arr.push(rows.item(i));
    }
    return arr;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Get current pregnancy week from profile
  async getCurrentWeek() {
    const profile = await this.getProfile();
    if (!profile || !profile.dueDate) {
      return 1;
    }

    const dueDate = new Date(profile.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const weeksLeft = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    const currentWeek = 40 - weeksLeft;
    
    return Math.max(1, Math.min(currentWeek, 40));
  }
}

// Export singleton instance
export const offlineDatabaseService = new OfflineDatabaseService();
export default offlineDatabaseService;
