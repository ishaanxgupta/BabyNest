/**
 * Local Database Helper - Offline-first storage for all BabyNest data
 * Uses AsyncStorage for persistent local storage on device.
 * No backend server required.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ─────────────────────────────────────────────
const KEYS = {
  PROFILE: '@babynest_profile',
  APPOINTMENTS: '@babynest_appointments',
  TASKS: '@babynest_tasks',
  WEIGHT: '@babynest_weight',
  SYMPTOMS: '@babynest_symptoms',
  MEDICINE: '@babynest_medicine',
  BLOOD_PRESSURE: '@babynest_blood_pressure',
  DISCHARGE: '@babynest_discharge',
  ID_COUNTER: '@babynest_id_counter',
};

// ─── ID Generator ─────────────────────────────────────────────
async function nextId() {
  const raw = await AsyncStorage.getItem(KEYS.ID_COUNTER);
  const counter = raw ? parseInt(raw, 10) + 1 : 1;
  await AsyncStorage.setItem(KEYS.ID_COUNTER, String(counter));
  return counter;
}

// ─── Generic CRUD helpers ─────────────────────────────────────
async function getAll(key) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll(key, items) {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

async function addItem(key, item) {
  const items = await getAll(key);
  const id = await nextId();
  const newItem = { ...item, id, created_at: new Date().toISOString() };
  items.push(newItem);
  await saveAll(key, items);
  return newItem;
}

async function updateItem(key, id, updates) {
  const items = await getAll(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Item not found');
  items[idx] = { ...items[idx], ...updates };
  await saveAll(key, items);
  return items[idx];
}

async function deleteItem(key, id) {
  const items = await getAll(key);
  const filtered = items.filter(i => i.id !== id);
  await saveAll(key, filtered);
}

// ─── Profile ──────────────────────────────────────────────────
export function calculateDueDate(lmpDateString, cycleLength) {
  const lmpDate = new Date(lmpDateString);
  const cycleLengthNum = parseInt(cycleLength, 10) || 28;
  const adjustment = cycleLengthNum - 28;
  const dueDateMs = lmpDate.getTime() + (280 + adjustment) * 24 * 60 * 60 * 1000;
  const dueDate = new Date(dueDateMs);
  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, '0');
  const day = String(dueDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function saveProfileLocally(profileData) {
  const data = { ...profileData, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(data));
  return data;
}

export async function getLocalProfile() {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteLocalProfile() {
  await AsyncStorage.removeItem(KEYS.PROFILE);
}

// ─── Appointments ─────────────────────────────────────────────
export async function getAppointments() {
  return getAll(KEYS.APPOINTMENTS);
}

export async function addAppointment(data) {
  return addItem(KEYS.APPOINTMENTS, {
    title: data.title,
    content: data.content || '',
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    appointment_location: data.appointment_location || '',
    appointment_status: 'pending',
  });
}

export async function updateAppointment(id, data) {
  return updateItem(KEYS.APPOINTMENTS, id, data);
}

export async function deleteAppointment(id) {
  return deleteItem(KEYS.APPOINTMENTS, id);
}

// ─── Tasks ────────────────────────────────────────────────────
export async function getTasks() {
  return getAll(KEYS.TASKS);
}

export async function addTask(data) {
  return addItem(KEYS.TASKS, {
    title: data.title,
    content: data.content || '',
    starting_week: data.starting_week,
    ending_week: data.ending_week || data.starting_week,
    task_priority: data.task_priority || 'low',
    isOptional: data.isOptional || false,
    isAppointmentMade: data.isAppointmentMade || false,
    task_status: data.task_status || 'pending',
  });
}

export async function updateTask(id, data) {
  return updateItem(KEYS.TASKS, id, data);
}

export async function deleteTask(id) {
  return deleteItem(KEYS.TASKS, id);
}

// Seed default tasks if none exist
export async function seedDefaultTasks() {
  const existing = await getTasks();
  if (existing.length > 0) return;

  const defaults = [
    { title: 'Initial Prenatal Visit', content: 'First doctor visit to confirm pregnancy.', starting_week: 4, ending_week: 4, task_priority: 'high' },
    { title: 'Early Ultrasound', content: 'Confirm pregnancy location and heartbeat.', starting_week: 6, ending_week: 8, task_priority: 'high' },
    { title: 'Folic Acid Supplementation', content: 'Start folic acid for neural tube development.', starting_week: 4, ending_week: 12, task_priority: 'high' },
    { title: 'Blood Tests', content: 'Check for blood type, hemoglobin, and infections.', starting_week: 8, ending_week: 10, task_priority: 'high' },
    { title: 'Down Syndrome Screening', content: 'Non-invasive prenatal screening.', starting_week: 10, ending_week: 12, task_priority: 'medium' },
    { title: 'NT Scan', content: 'Nuchal translucency scan for fetal abnormalities.', starting_week: 12, ending_week: 14, task_priority: 'high' },
    { title: 'Gestational Diabetes Test', content: 'Glucose test to check blood sugar levels.', starting_week: 14, ending_week: 16, task_priority: 'high' },
    { title: 'Detailed Anomaly Scan', content: '20-week scan to check fetal development.', starting_week: 18, ending_week: 20, task_priority: 'high' },
    { title: 'Fetal Movement Monitoring', content: 'Track baby movements for health assessment.', starting_week: 21, ending_week: 24, task_priority: 'medium' },
    { title: 'Iron and Calcium Supplements', content: 'Ensure proper bone and blood health.', starting_week: 21, ending_week: 28, task_priority: 'medium' },
    { title: 'Pre-Birth Vaccination', content: 'Tdap and flu shots for maternal and newborn protection.', starting_week: 30, ending_week: 32, task_priority: 'high' },
    { title: 'Third-Trimester Ultrasound', content: "Assess baby's growth and position.", starting_week: 30, ending_week: 32, task_priority: 'high' },
    { title: 'Birth Plan Discussion', content: 'Discuss delivery preferences with doctor.', starting_week: 33, ending_week: 34, task_priority: 'medium' },
    { title: 'Labor Signs Monitoring', content: 'Educate about labor contractions.', starting_week: 36, ending_week: 40, task_priority: 'high' },
    { title: 'Final Checkups', content: 'Last medical assessments before labor.', starting_week: 38, ending_week: 40, task_priority: 'high' },
  ];

  for (const task of defaults) {
    await addTask(task);
  }
}

// ─── Weight ───────────────────────────────────────────────────
export async function getWeightHistory() {
  return getAll(KEYS.WEIGHT);
}

export async function addWeight(data) {
  return addItem(KEYS.WEIGHT, {
    week_number: data.week_number,
    weight: data.weight,
    note: data.note || '',
  });
}

export async function updateWeight(id, data) {
  return updateItem(KEYS.WEIGHT, id, data);
}

export async function deleteWeight(id) {
  return deleteItem(KEYS.WEIGHT, id);
}

// ─── Symptoms ─────────────────────────────────────────────────
export async function getSymptomsHistory() {
  return getAll(KEYS.SYMPTOMS);
}

export async function addSymptom(data) {
  return addItem(KEYS.SYMPTOMS, {
    week_number: data.week_number,
    symptom: data.symptom,
    note: data.note || '',
  });
}

export async function updateSymptom(id, data) {
  return updateItem(KEYS.SYMPTOMS, id, data);
}

export async function deleteSymptom(id) {
  return deleteItem(KEYS.SYMPTOMS, id);
}

// ─── Medicine ─────────────────────────────────────────────────
export async function getMedicineHistory() {
  return getAll(KEYS.MEDICINE);
}

export async function addMedicine(data) {
  return addItem(KEYS.MEDICINE, {
    week_number: data.week_number,
    name: data.name,
    dose: data.dose,
    time: data.time || '',
    taken: data.taken || false,
    note: data.note || '',
  });
}

export async function updateMedicine(id, data) {
  return updateItem(KEYS.MEDICINE, id, data);
}

export async function deleteMedicine(id) {
  return deleteItem(KEYS.MEDICINE, id);
}

// ─── Blood Pressure ───────────────────────────────────────────
export async function getBloodPressureHistory() {
  return getAll(KEYS.BLOOD_PRESSURE);
}

export async function addBloodPressure(data) {
  return addItem(KEYS.BLOOD_PRESSURE, {
    week_number: data.week_number,
    systolic: data.systolic,
    diastolic: data.diastolic,
    time: data.time || '',
    note: data.note || '',
  });
}

export async function updateBloodPressure(id, data) {
  return updateItem(KEYS.BLOOD_PRESSURE, id, data);
}

export async function deleteBloodPressure(id) {
  return deleteItem(KEYS.BLOOD_PRESSURE, id);
}

// ─── Discharge ────────────────────────────────────────────────
export async function getDischargeHistory() {
  return getAll(KEYS.DISCHARGE);
}

export async function addDischarge(data) {
  return addItem(KEYS.DISCHARGE, {
    week_number: data.week_number,
    type: data.type,
    color: data.color,
    bleeding: data.bleeding || 'none',
    note: data.note || '',
  });
}

export async function updateDischarge(id, data) {
  return updateItem(KEYS.DISCHARGE, id, data);
}

export async function deleteDischarge(id) {
  return deleteItem(KEYS.DISCHARGE, id);
}

// ─── Mood ─────────────────────────────────────────────────────
const MOOD_KEY = '@babynest_mood';

export async function getMoodHistory() {
  return getAll(MOOD_KEY);
}

export async function addMood(data) {
  return addItem(MOOD_KEY, {
    mood: data.mood,
    intensity: data.intensity || 'medium',
    week_number: data.week_number,
    note: data.note || '',
  });
}

export async function updateMood(id, data) {
  return updateItem(MOOD_KEY, id, data);
}

export async function deleteMood(id) {
  return deleteItem(MOOD_KEY, id);
}

// ─── Sleep ────────────────────────────────────────────────────
const SLEEP_KEY = '@babynest_sleep';

export async function getSleepHistory() {
  return getAll(SLEEP_KEY);
}

export async function addSleep(data) {
  return addItem(SLEEP_KEY, {
    duration: data.duration,
    bedtime: data.bedtime || null,
    wake_time: data.wake_time || null,
    quality: data.quality || 'good',
    week_number: data.week_number,
    note: data.note || '',
  });
}

export async function updateSleep(id, data) {
  return updateItem(SLEEP_KEY, id, data);
}

export async function deleteSleep(id) {
  return deleteItem(SLEEP_KEY, id);
}
