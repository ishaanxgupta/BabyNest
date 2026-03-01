/**
 * RAG (Retrieval-Augmented Generation) Service
 * Intelligent query processing system for BabyNest app
 * Handles all user queries with semantic understanding
 */

import * as db from './database';

class RAGService {
  constructor() {
    this.intentEmbeddings = {};
    this.conversationContext = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the RAG system with intent embeddings
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Load pre-computed intent embeddings
      this.intentEmbeddings = await this.loadIntentEmbeddings();
      this.isInitialized = true;
      console.log('🧠 RAG Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  /**
   * Load intent embeddings for semantic matching
   */
  async loadIntentEmbeddings() {
    return {
      // Appointment intents
      'create_appointment': {
        keywords: ['appointment', 'schedule', 'book', 'meeting', 'visit', 'consultation'],
        examples: [
          'make an appointment',
          'schedule a visit',
          'book appointment for tomorrow',
          'I need to see a doctor',
          'can I get an appointment',
          'schedule ultrasound',
          'book consultation'
        ],
        action: 'createAppointment',
        requiredFields: ['title', 'date', 'time', 'location'],
        optionalFields: ['note']
      },
      
      // Weight logging intents
      'log_weight': {
        keywords: ['weight', 'weigh', 'kg', 'kilos', 'pounds', 'lbs'],
        examples: [
          'log my weight',
          'my weight is 65kg',
          'I weigh 65kg',
          'record weight',
          'add weight',
          'weight 65kg',
          'log weight 65kg for week 12'
        ],
        action: 'logWeight',
        requiredFields: ['weight'],
        optionalFields: ['week_number', 'note']
      },

      // Symptom logging intents
      'log_symptoms': {
        keywords: ['symptom', 'symptoms', 'feeling', 'pain', 'ache', 'nausea', 'sick'],
        examples: [
          'log symptoms',
          'I have nausea',
          'feeling sick',
          'add symptom',
          'record symptoms',
          'I feel dizzy',
          'morning sickness',
          'log symptom nausea'
        ],
        action: 'logSymptoms',
        requiredFields: ['symptom'],
        optionalFields: ['week_number', 'note']
      },

      // Blood pressure logging intents
      'log_blood_pressure': {
        keywords: ['blood pressure', 'bp', 'pressure', 'systolic', 'diastolic'],
        examples: [
          'log blood pressure',
          'blood pressure 120/80',
          'my bp is 120/80',
          'record blood pressure',
          'bp 120/80',
          'pressure reading'
        ],
        action: 'logBloodPressure',
        requiredFields: ['systolic', 'diastolic', 'time'],
        optionalFields: ['week_number', 'note']
      },

      // Medicine logging intents
      'log_medicine': {
        keywords: ['medicine', 'medication', 'med', 'pill', 'tablet', 'drug', 'took', 'taking', 'log', 'prescription'],
        examples: [
          'log medicine',
          'log medicine prescription',
          'I want to log a medicine prescription',
          'took paracetamol',
          'taking medicine',
          'add medication',
          'record medicine',
          'medicine paracetamol',
          'took 500mg paracetamol'
        ],
        action: 'logMedicine',
        requiredFields: ['name', 'dose', 'time'],
        optionalFields: ['week_number', 'note']
      },

      // Discharge logging intents
      'log_discharge': {
        keywords: ['discharge', 'bleeding', 'spotting', 'flow'],
        examples: [
          'log discharge',
          'having discharge',
          'bleeding',
          'spotting',
          'record discharge',
          'discharge normal'
        ],
        action: 'logDischarge',
        requiredFields: ['type', 'color', 'bleeding'],
        optionalFields: ['week_number', 'note']
      },

      // Task creation intents
      'create_task': {
        keywords: ['task', 'reminder', 'todo', 'schedule', 'need to', 'should'],
        examples: [
          'create task',
          'add reminder',
          'need ultrasound',
          'schedule blood test',
          'create reminder',
          'add todo',
          'task ultrasound scan'
        ],
        action: 'createTask',
        requiredFields: ['title'],
        optionalFields: ['week', 'priority', 'note']
      },

      // Mood tracking intents
      'log_mood': {
        keywords: ['mood', 'feeling', 'happy', 'sad', 'anxious', 'stressed', 'calm', 'energetic'],
        examples: [
          'log my mood',
          'I feel happy',
          'feeling anxious',
          'my mood is good',
          'record mood',
          'add mood entry',
          'I am stressed',
          'feeling calm today'
        ],
        action: 'logMood',
        requiredFields: ['mood'],
        optionalFields: ['intensity', 'note']
      },

      // Sleep tracking intents
      'log_sleep': {
        keywords: ['sleep', 'bedtime', 'wake up', 'slept', 'sleeping', 'hours of sleep'],
        examples: [
          'log sleep',
          'I slept 8 hours',
          'went to bed at 10pm',
          'woke up at 6am',
          'add sleep entry',
          'record sleep',
          'slept well',
          'poor sleep last night'
        ],
        action: 'logSleep',
        requiredFields: ['duration'],
        optionalFields: ['bedtime', 'wake_time', 'quality', 'note']
      },

      // Analytics and query intents
      'query_analytics': {
        keywords: ['analytics', 'stats', 'statistics', 'trend', 'average', 'summary', 'report', 'show', 'chart', 'graph', 'visualization'],
        examples: [
          'show weight analytics',
          'show weight trend',
          'weight analytics',
          'sleep analytics',
          'mood analytics',
          'blood pressure analytics',
          'show sleep data',
          'weight chart',
          'sleep trend',
          'mood summary',
          'analytics dashboard',
          'show my health data',
          'generate health report',
          'weight statistics',
          'sleep statistics',
          'mood statistics'
        ],
        action: 'queryAnalytics',
        requiredFields: ['metric'],
        optionalFields: ['timeframe', 'chart_type']
      },

      // View logs intents
      'view_weight_logs': {
        keywords: ['weight logs', 'weight history', 'weight entries', 'show weight', 'view weight', 'my weights', 'weight records'],
        examples: [
          'show my weight logs',
          'view weight history',
          'display weight entries',
          'show all weights',
          'my weight records',
          'weight tracking history'
        ],
        action: 'viewWeightLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit']
      },

      'view_medicine_logs': {
        keywords: ['medicine logs', 'medicine history', 'medicine entries', 'show medicine', 'view medicine', 'my medicines', 'medicine records', 'prescription history'],
        examples: [
          'show my medicine logs',
          'view medicine history',
          'display medicine entries',
          'show all medicines',
          'my medicine records',
          'prescription tracking history'
        ],
        action: 'viewMedicineLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit']
      },

      'view_symptoms_logs': {
        keywords: ['symptoms logs', 'symptoms history', 'symptoms entries', 'show symptoms', 'view symptoms', 'my symptoms', 'symptoms records'],
        examples: [
          'show my symptoms logs',
          'view symptoms history',
          'display symptoms entries',
          'show all symptoms',
          'my symptoms records',
          'symptoms tracking history'
        ],
        action: 'viewSymptomsLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit']
      },

      'view_blood_pressure_logs': {
        keywords: ['blood pressure logs', 'bp logs', 'bp history', 'blood pressure history', 'bp entries', 'show blood pressure', 'view blood pressure', 'my bp records'],
        examples: [
          'show my blood pressure logs',
          'view bp history',
          'display blood pressure entries',
          'show all bp readings',
          'my blood pressure records',
          'bp tracking history'
        ],
        action: 'viewBloodPressureLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit']
      },

      'view_discharge_logs': {
        keywords: ['discharge logs', 'discharge history', 'discharge entries', 'show discharge', 'view discharge', 'my discharge records'],
        examples: [
          'show my discharge logs',
          'view discharge history',
          'display discharge entries',
          'show all discharge records',
          'my discharge tracking'
        ],
        action: 'viewDischargeLogs',
        requiredFields: [],
        optionalFields: ['week_number', 'limit']
      },

      // Undo/delete intents
      'undo_action': {
        keywords: ['undo', 'delete', 'remove', 'cancel', 'revert'],
        examples: [
          'undo last action',
          'delete last entry',
          'remove last weight',
          'cancel last appointment',
          'revert changes',
          'undo my last log'
        ],
        action: 'undoAction',
        requiredFields: [],
        optionalFields: ['action_type']
      },

      // Navigation intents
      'navigate': {
        keywords: ['go to', 'navigate', 'open', 'show', 'take me to', 'switch to'],
        examples: [
          'go to weight screen',
          'navigate to appointments',
          'open calendar',
          'show symptoms',
          'take me to home',
          'switch to medicine',
          'open timeline'
        ],
        action: 'navigate',
        requiredFields: ['screen'],
        optionalFields: []
      },

      // Profile update intents
      'update_profile': {
        keywords: ['update', 'change', 'set', 'modify', 'edit'],
        examples: [
          'update my name',
          'change due date',
          'set my age',
          'update phone number',
          'modify profile',
          'edit details'
        ],
        action: 'updateProfile',
        requiredFields: ['field'],
        optionalFields: ['value']
      },

      // Data retrieval intents
      'get_data': {
        keywords: ['show', 'get', 'list', 'view', 'display', 'see', 'when', 'upcoming', 'next', 'schedule', 'appointment'],
        examples: [
          'show appointments',
          'get my weight history',
          'list symptoms',
          'view medicine log',
          'display tasks',
          'see blood pressure',
          'when is my upcoming appointment',
          'what are my next appointments',
          'show my schedule',
          'list my appointments',
          'when is my next appointment',
          'upcoming appointments'
        ],
        action: 'getData',
        requiredFields: ['type'],
        optionalFields: ['week', 'date']
      },

      // Appointment management intents
      'update_appointment': {
        keywords: ['update', 'change', 'modify', 'edit', 'reschedule'],
        examples: [
          'update appointment',
          'change appointment time',
          'modify appointment date',
          'edit appointment',
          'reschedule appointment',
          'update my appointment',
          'change ultrasound appointment'
        ],
        action: 'updateAppointment',
        requiredFields: ['appointment_identifier'],
        optionalFields: ['title', 'date', 'time', 'location', 'note']
      },

      'delete_appointment': {
        keywords: ['delete', 'remove', 'cancel', 'delete appointment', 'cancel appointment'],
        examples: [
          'delete appointment',
          'remove appointment',
          'cancel appointment',
          'delete my appointment',
          'cancel ultrasound',
          'remove checkup appointment',
          'delete appointment on monday'
        ],
        action: 'deleteAppointment',
        requiredFields: ['appointment_identifier'],
        optionalFields: []
      },

      // Emergency intents
      'emergency': {
        keywords: ['emergency', 'help', 'urgent', 'sos', 'critical'],
        examples: [
          'emergency',
          'help me',
          'urgent',
          'sos',
          'critical situation',
          'need help'
        ],
        action: 'emergency',
        requiredFields: [],
        optionalFields: ['type']
      },

      // Logout intents
      'logout': {
        keywords: ['logout', 'sign out', 'exit', 'quit'],
        examples: [
          'logout',
          'sign out',
          'exit app',
          'quit',
          'log out'
        ],
        action: 'logout',
        requiredFields: [],
        optionalFields: []
      },

      // Medicine CRUD operations
      'update_medicine': {
        keywords: ['update', 'change', 'modify', 'edit', 'medicine', 'medication', 'med'],
        examples: [
          'update medicine',
          'change medication',
          'modify medicine entry',
          'edit medicine record',
          'update paracetamol dose',
          'change medicine time'
        ],
        action: 'updateMedicine',
        requiredFields: ['medicine_name'],
        optionalFields: ['dose', 'frequency', 'start_date', 'end_date', 'note']
      },

      'delete_medicine': {
        keywords: ['delete', 'remove', 'stop', 'medicine', 'medication', 'med'],
        examples: [
          'delete medicine',
          'remove medication',
          'stop taking medicine',
          'delete paracetamol',
          'remove medicine entry'
        ],
        action: 'deleteMedicine',
        requiredFields: ['medicine_name'],
        optionalFields: ['date']
      },

      // Blood Pressure CRUD operations
      'update_blood_pressure': {
        keywords: ['update', 'change', 'modify', 'edit', 'blood pressure', 'bp'],
        examples: [
          'update blood pressure',
          'change bp reading',
          'modify blood pressure',
          'edit bp entry',
          'update pressure reading'
        ],
        action: 'updateBloodPressure',
        requiredFields: ['systolic', 'diastolic'],
        optionalFields: ['date', 'time', 'note']
      },

      'delete_blood_pressure': {
        keywords: ['delete', 'remove', 'blood pressure', 'bp'],
        examples: [
          'delete blood pressure',
          'remove bp reading',
          'delete pressure entry',
          'remove blood pressure record'
        ],
        action: 'deleteBloodPressure',
        requiredFields: ['date'],
        optionalFields: ['time']
      },

      // Discharge CRUD operations
      'update_discharge': {
        keywords: ['update', 'change', 'modify', 'edit', 'discharge', 'bleeding', 'spotting'],
        examples: [
          'update discharge',
          'change discharge record',
          'modify bleeding entry',
          'edit discharge log',
          'update spotting record'
        ],
        action: 'updateDischarge',
        requiredFields: ['discharge_type'],
        optionalFields: ['date', 'time', 'note']
      },

      'delete_discharge': {
        keywords: ['delete', 'remove', 'discharge', 'bleeding', 'spotting'],
        examples: [
          'delete discharge',
          'remove discharge entry',
          'delete bleeding record',
          'remove discharge log'
        ],
        action: 'deleteDischarge',
        requiredFields: ['date'],
        optionalFields: ['time']
      },

      // Symptoms CRUD operations
      'update_symptoms': {
        keywords: ['update', 'change', 'modify', 'edit', 'symptoms', 'symptom'],
        examples: [
          'update symptoms',
          'change symptom entry',
          'modify symptoms',
          'edit symptom record',
          'update nausea entry'
        ],
        action: 'updateSymptoms',
        requiredFields: ['symptom'],
        optionalFields: ['date', 'time', 'note']
      },

      'delete_symptoms': {
        keywords: ['delete', 'remove', 'symptoms', 'symptom'],
        examples: [
          'delete symptoms',
          'remove symptom entry',
          'delete symptom record',
          'remove symptoms log'
        ],
        action: 'deleteSymptoms',
        requiredFields: ['date'],
        optionalFields: ['time']
      },

      // Weight CRUD operations
      'update_weight': {
        keywords: ['update', 'change', 'modify', 'edit', 'weight'],
        examples: [
          'update weight',
          'change weight entry',
          'modify weight record',
          'edit weight log',
          'update weight reading'
        ],
        action: 'updateWeight',
        requiredFields: ['weight'],
        optionalFields: ['date', 'week', 'note']
      },

      'delete_weight': {
        keywords: ['delete', 'remove', 'weight'],
        examples: [
          'delete weight',
          'remove weight entry',
          'delete weight record',
          'remove weight log'
        ],
        action: 'deleteWeight',
        requiredFields: ['date'],
        optionalFields: ['time']
      },

      // Mood CRUD operations
      'update_mood': {
        keywords: ['update', 'change', 'modify', 'edit', 'mood'],
        examples: [
          'update mood',
          'change mood entry',
          'modify mood record',
          'edit mood log',
          'update feeling'
        ],
        action: 'updateMood',
        requiredFields: ['mood'],
        optionalFields: ['intensity', 'date', 'note']
      },

      'delete_mood': {
        keywords: ['delete', 'remove', 'mood'],
        examples: [
          'delete mood',
          'remove mood entry',
          'delete mood record',
          'remove mood log'
        ],
        action: 'deleteMood',
        requiredFields: ['date'],
        optionalFields: ['time']
      },

      // Sleep CRUD operations
      'update_sleep': {
        keywords: ['update', 'change', 'modify', 'edit', 'sleep'],
        examples: [
          'update sleep',
          'change sleep entry',
          'modify sleep record',
          'edit sleep log',
          'update bedtime'
        ],
        action: 'updateSleep',
        requiredFields: ['duration'],
        optionalFields: ['bedtime', 'wake_time', 'quality', 'date', 'note']
      },

      'delete_sleep': {
        keywords: ['delete', 'remove', 'sleep'],
        examples: [
          'delete sleep',
          'remove sleep entry',
          'delete sleep record',
          'remove sleep log'
        ],
        action: 'deleteSleep',
        requiredFields: ['date'],
        optionalFields: ['time']
      }
    };
  }

  /**
   * Process user query with semantic understanding
   */
  async processQuery(userQuery, userContext = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🧠 Processing query:', userQuery);
      
      // 1. Find the best matching intent
      const bestIntent = await this.findBestIntent(userQuery);

      // 2. Extract structured data from the query
      const extractedData = await this.extractData(userQuery, bestIntent);

      // 3. Check if we have all required information
      const missingFields = this.checkMissingFields(extractedData, bestIntent);
      
      if (missingFields.length > 0) {
        // Generate follow-up questions
        return await this.generateFollowUpQuestions(bestIntent, missingFields, extractedData);
      }

      // 4. Execute the action
      return await this.executeAction(bestIntent, extractedData, userContext);

    } catch (error) {
      console.error('RAG processing error:', error);
      return {
        success: false,
        message: `❌ I'm having trouble understanding that. Could you try rephrasing your request?`,
        error: error.message
      };
    }
  }

  /**
   * Find the best matching intent using semantic similarity
   */
  async findBestIntent(userQuery) {
    const query = userQuery.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Ensure intentEmbeddings is valid
    if (!this.intentEmbeddings || typeof this.intentEmbeddings !== 'object') {
      console.error('intentEmbeddings is not valid:', this.intentEmbeddings);
      return {
        name: 'unknown',
        action: 'unknown',
        confidence: 0
      };
    }

    // Special case: If query contains analytics-related keywords, prioritize analytics intent
    const analyticsKeywords = ['analytics', 'stats', 'statistics', 'trend', 'chart', 'graph', 'report'];
    const hasAnalyticsKeyword = analyticsKeywords.some(keyword => query.includes(keyword));
    
    if (hasAnalyticsKeyword) {
      const analyticsIntent = this.intentEmbeddings['query_analytics'];
      if (analyticsIntent) {
        return {
          name: 'query_analytics',
          ...analyticsIntent,
          confidence: 1.0
        };
      }
    }

    // Special case: If query contains view-related keywords, prioritize view logs intents
    const viewLogsKeywords = ['logs', 'history', 'entries', 'records', 'show', 'view', 'display', 'my', 'all'];
    const hasViewLogsKeyword = viewLogsKeywords.some(keyword => query.includes(keyword));
    
    if (hasViewLogsKeyword) {
      if (query.includes('weight')) {
        const weightLogsIntent = this.intentEmbeddings['view_weight_logs'];
        if (weightLogsIntent) {
          return {
            name: 'view_weight_logs',
            ...weightLogsIntent,
            confidence: 1.0
          };
        }
      }
      
      if (query.includes('medicine')) {
        const medicineLogsIntent = this.intentEmbeddings['view_medicine_logs'];
        if (medicineLogsIntent) {
          return {
            name: 'view_medicine_logs',
            ...medicineLogsIntent,
            confidence: 1.0
          };
        }
      }
      
      if (query.includes('symptoms')) {
        const symptomsLogsIntent = this.intentEmbeddings['view_symptoms_logs'];
        if (symptomsLogsIntent) {
          return {
            name: 'view_symptoms_logs',
            ...symptomsLogsIntent,
            confidence: 1.0
          };
        }
      }
      
      if (query.includes('blood pressure') || query.includes('bp')) {
        const bpLogsIntent = this.intentEmbeddings['view_blood_pressure_logs'];
        if (bpLogsIntent) {
          return {
            name: 'view_blood_pressure_logs',
            ...bpLogsIntent,
            confidence: 1.0
          };
        }
      }
      
      if (query.includes('discharge')) {
        const dischargeLogsIntent = this.intentEmbeddings['view_discharge_logs'];
        if (dischargeLogsIntent) {
          return {
            name: 'view_discharge_logs',
            ...dischargeLogsIntent,
            confidence: 1.0
          };
        }
      }
    }

    for (const [intentName, intentData] of Object.entries(this.intentEmbeddings)) {
      let score = 0;

      // Check keyword matches
      for (const keyword of intentData.keywords) {
        if (query.includes(keyword.toLowerCase())) {
          score += 2; // Higher weight for keyword matches
        }
      }

      // Check example matches
      for (const example of intentData.examples) {
        const similarity = this.calculateSimilarity(query, example.toLowerCase());
        score += similarity;
      }

      // Normalize score
      score = score / (intentData.keywords.length + intentData.examples.length);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          name: intentName,
          ...intentData,
          confidence: score
        };
      }
    }

    // If no good match found, return a default intent
    if (!bestMatch || bestScore < 0.1) {
      return {
        name: 'general_chat',
        action: 'generalChat',
        requiredFields: [],
        optionalFields: [],
        confidence: 0
      };
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Extract structured data from user query
   */
  async extractData(userQuery, intent) {
    const data = {};
    const query = userQuery.toLowerCase();

    switch (intent.name) {
      case 'create_appointment':
        data.title = this.extractAppointmentTitle(query);
        data.date = this.extractDate(query);
        data.time = this.extractTime(query);
        data.location = this.extractLocation(query);
        break;

      case 'log_weight':
        data.weight = this.extractWeight(query);
        data.week_number = this.extractWeek(query);
        data.note = this.extractNote(query);
        break;

      case 'log_symptoms':
        data.symptom = this.extractSymptom(query);
        data.week_number = this.extractWeek(query);
        data.note = this.extractNote(query);
        break;

      case 'log_blood_pressure':
        const bp = this.extractBloodPressure(query);
        data.systolic = bp.systolic;
        data.diastolic = bp.diastolic;
        data.time = this.extractTime(query);
        data.week_number = this.extractWeek(query);
        data.note = this.extractNote(query);
        break;

      case 'log_medicine':
        console.log('🔍 DEBUG: Extracting medicine data from query:', query);
        data.name = this.extractMedicineName(query);
        data.dose = this.extractDose(query);
        data.time = this.extractTime(query);
        data.week_number = this.extractWeek(query);
        data.note = this.extractNote(query);
        console.log('🔍 DEBUG: Extracted medicine data:', data);
        break;

      case 'log_discharge':
        data.type = this.extractDischargeType(query);
        data.color = this.extractDischargeColor(query);
        data.bleeding = this.extractBleeding(query);
        data.week_number = this.extractWeek(query);
        data.note = this.extractNote(query);
        break;

      case 'create_task':
        data.title = this.extractTaskTitle(query);
        data.week = this.extractWeek(query);
        data.priority = this.extractPriority(query);
        data.note = this.extractNote(query);
        break;

      case 'navigate':
        data.screen = this.extractScreenName(query);
        break;

      case 'update_profile':
        data.field = this.extractProfileField(query);
        data.value = this.extractProfileValue(query);
        break;

      case 'get_data':
        data.type = this.extractDataType(query);
        data.week = this.extractWeek(query);
        data.date = this.extractDate(query);
        break;

      case 'update_appointment':
        data.appointment_identifier = this.extractAppointmentIdentifier(query);
        data.title = this.extractAppointmentTitle(query);
        data.date = this.extractDate(query);
        data.time = this.extractTime(query);
        data.location = this.extractLocation(query);
        data.note = this.extractNote(query);
        break;

      case 'delete_appointment':
        data.appointment_identifier = this.extractAppointmentIdentifier(query);
        break;

      case 'log_mood':
        data.mood = this.extractMood(query);
        data.intensity = this.extractIntensity(query);
        data.note = this.extractNote(query);
        break;

      case 'log_sleep':
        data.duration = this.extractSleepDuration(query);
        data.bedtime = this.extractBedtime(query);
        data.wake_time = this.extractWakeTime(query);
        data.quality = this.extractSleepQuality(query);
        data.note = this.extractNote(query);
        break;

      case 'query_analytics':
        data.metric = this.extractMetric(query);
        data.timeframe = this.extractTimeframe(query);
        data.chart_type = this.extractChartType(query);
        break;

      case 'view_weight_logs':
        data.week_number = this.extractWeek(query);
        data.limit = this.extractLimit(query);
        break;

      case 'view_medicine_logs':
        data.week_number = this.extractWeek(query);
        data.limit = this.extractLimit(query);
        break;

      case 'view_symptoms_logs':
        data.week_number = this.extractWeek(query);
        data.limit = this.extractLimit(query);
        break;

      case 'view_blood_pressure_logs':
        data.week_number = this.extractWeek(query);
        data.limit = this.extractLimit(query);
        break;

      case 'view_discharge_logs':
        data.week_number = this.extractWeek(query);
        data.limit = this.extractLimit(query);
        break;

      case 'undo_action':
        data.action_type = this.extractActionType(query);
        break;
    }

    return data;
  }

  /**
   * Extract appointment identifier from query
   */
  extractAppointmentIdentifier(query) {
    // Check for specific appointment types
    const appointmentTypes = ['ultrasound', 'checkup', 'consultation', 'blood test', 'scan', 'visit', 'examination'];
    for (const type of appointmentTypes) {
      if (query.includes(type)) {
        return { type: 'title', value: type };
      }
    }

    // Check for dates
    const date = this.extractDate(query);
    if (date) {
      return { type: 'date', value: date };
    }

    // Check for times
    const time = this.extractTime(query);
    if (time) {
      return { type: 'time', value: time };
    }

    // Check for locations
    const location = this.extractLocation(query);
    if (location) {
      return { type: 'location', value: location };
    }

    // Check for day names
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of dayNames) {
      if (query.includes(day)) {
        return { type: 'day', value: day };
      }
    }

    // Check for relative terms
    const relativeTerms = ['tomorrow', 'today', 'next week', 'first', 'second', 'last'];
    for (const term of relativeTerms) {
      if (query.includes(term)) {
        return { type: 'relative', value: term };
      }
    }

    return null;
  }

  /**
   * Extract appointment title from query
   */
  extractAppointmentTitle(query) {
    const appointmentTypes = ['ultrasound', 'checkup', 'consultation', 'blood test', 'scan', 'visit', 'examination'];
    for (const type of appointmentTypes) {
      if (query.includes(type)) {
        return type;
      }
    }
    return null;
  }

  /**
   * Extract date from query
   */
  extractDate(query) {
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
      /(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i,
      /(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december))/i,
      /(tomorrow|today|next week|next month)/i,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(\d{1,2}\/\d{1,2})/,
      /(\d{1,2}-\d{1,2})/
    ];

    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Extract time from query
   */
  extractTime(query) {
    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/,
      /(\d{1,2}\s*(?:am|pm|AM|PM))/,
      /(morning|afternoon|evening|night)/
    ];

    for (const pattern of timePatterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Extract location from query
   */
  extractLocation(query) {
    const locations = [
      'city hospital', 'medical center', 'doctor office', 'health center',
      'delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'pune',
      'hospital', 'clinic'
    ];

    // Check multi-word locations first (longer matches)
    for (const location of locations) {
      if (query.includes(location)) {
        return location;
      }
    }
    return null;
  }

  /**
   * Extract weight from query
   */
  extractWeight(query) {
    const weightMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|pounds?|lbs?)/);
    return weightMatch ? parseFloat(weightMatch[1]) : null;
  }

  /**
   * Extract week from query
   */
  extractWeek(query) {
    const weekMatch = query.match(/week\s+(\d+)/);
    return weekMatch ? parseInt(weekMatch[1]) : null;
  }

  /**
   * Extract limit from query
   */
  extractLimit(query) {
    const limitMatch = query.match(/(?:last|recent|top)\s+(\d+)/);
    return limitMatch ? parseInt(limitMatch[1]) : null;
  }

  /**
   * Extract symptom from query
   */
  extractSymptom(query) {
    const symptoms = [
      'nausea', 'vomiting', 'dizziness', 'headache', 'fatigue', 'back pain',
      'cramps', 'spotting', 'bleeding', 'swelling', 'heartburn', 'constipation',
      'morning sickness', 'mood swings', 'food cravings', 'aversion'
    ];

    for (const symptom of symptoms) {
      if (query.includes(symptom)) {
        return symptom;
      }
    }
    return null;
  }

  /**
   * Extract blood pressure from query
   */
  extractBloodPressure(query) {
    const bpMatch = query.match(/(\d+)\s*\/\s*(\d+)/);
    return bpMatch ? {
      systolic: parseInt(bpMatch[1]),
      diastolic: parseInt(bpMatch[2])
    } : { systolic: null, diastolic: null };
  }

  /**
   * Extract medicine name from query
   */
  extractMedicineName(query) {
    const medicines = [
      'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'iron', 'folic acid',
      'calcium', 'vitamin d', 'prenatal vitamins', 'omeprazole', 'ranitidine'
    ];

    for (const medicine of medicines) {
      if (query.includes(medicine)) {
        return medicine;
      }
    }
    return null;
  }

  /**
   * Extract dose from query
   */
  extractDose(query) {
    const doseMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:mg|ml|tablets?|pills?|drops?)/);
    return doseMatch ? doseMatch[0] : null;
  }

  /**
   * Extract discharge type from query
   */
  extractDischargeType(query) {
    const types = ['normal', 'spotting', 'heavy', 'light', 'abnormal'];
    for (const type of types) {
      if (query.includes(type)) {
        return type;
      }
    }
    return null;
  }

  /**
   * Extract discharge color from query
   */
  extractDischargeColor(query) {
    const colors = ['clear', 'white', 'pink', 'brown', 'red', 'yellow'];
    for (const color of colors) {
      if (query.includes(color)) {
        return color;
      }
    }
    return null;
  }

  /**
   * Extract bleeding status from query
   */
  extractBleeding(query) {
    if (query.includes('bleeding') || query.includes('blood') || query.includes('red')) {
      return 'yes';
    } else if (query.includes('no bleeding') || query.includes('no blood')) {
      return 'no';
    }
    return null;
  }

  /**
   * Extract task title from query
   */
  extractTaskTitle(query) {
    const tasks = [
      'ultrasound', 'blood test', 'urine test', 'checkup', 'consultation',
      'scan', 'examination', 'vaccination', 'glucose test'
    ];

    for (const task of tasks) {
      if (query.includes(task)) {
        return task;
      }
    }
    return null;
  }

  /**
   * Extract priority from query
   */
  extractPriority(query) {
    if (query.includes('high') || query.includes('urgent')) return 'high';
    if (query.includes('low')) return 'low';
    return 'medium';
  }

  /**
   * Extract screen name from query
   */
  extractScreenName(query) {
    const screens = {
      'home': ['home', 'main', 'dashboard'],
      'weight': ['weight', 'weigh', 'weight screen', 'weight tracking'],
      'symptoms': ['symptoms', 'symptom', 'symptom screen'],
      'medicine': ['medicine', 'medication', 'med', 'medicine screen'],
      'appointments': ['appointments', 'appointment', 'calendar', 'schedule'],
      'blood_pressure': ['blood pressure', 'bp', 'pressure', 'blood pressure screen'],
      'discharge': ['discharge', 'discharge log', 'bleeding', 'spotting'],
      'timeline': ['timeline', 'history', 'timeline screen'],
      'settings': ['settings', 'profile', 'profile screen'],
      'tasks': ['tasks', 'reminders', 'todo', 'task screen', 'all tasks']
    };

    for (const [screen, keywords] of Object.entries(screens)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return screen;
        }
      }
    }
    return null;
  }

  /**
   * Extract profile field from query
   */
  extractProfileField(query) {
    const fields = {
      'name': ['name'],
      'age': ['age'],
      'phone': ['phone', 'number'],
      'due_date': ['due date', 'due date'],
      'location': ['location', 'address']
    };

    for (const [field, keywords] of Object.entries(fields)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return field;
        }
      }
    }
    return null;
  }

  /**
   * Extract profile value from query
   */
  extractProfileValue(query) {
    // This would need more sophisticated parsing
    // For now, return the query as the value
    return query;
  }

  /**
   * Extract data type from query
   */
  extractDataType(query) {
    const types = {
      'appointments': ['appointments', 'appointment', 'schedule', 'upcoming', 'next', 'when'],
      'weight': ['weight', 'weigh'],
      'symptoms': ['symptoms', 'symptom'],
      'medicine': ['medicine', 'medication'],
      'blood_pressure': ['blood pressure', 'bp'],
      'discharge': ['discharge', 'bleeding'],
      'tasks': ['tasks', 'reminders']
    };

    for (const [type, keywords] of Object.entries(types)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return type;
        }
      }
    }
    return null;
  }

  /**
   * Extract note from query
   */
  extractNote(query) {
    const noteMatch = query.match(/note\s+(.+)/);
    return noteMatch ? noteMatch[1] : null;
  }

  /**
   * Check for missing required fields
   */
  checkMissingFields(data, intent) {
    console.log('🔍 DEBUG: Checking missing fields for intent:', intent.name);
    console.log('🔍 DEBUG: Required fields:', intent.requiredFields);
    console.log('🔍 DEBUG: Data to check:', data);
    
    const missing = [];
    for (const field of intent.requiredFields) {
      console.log(`🔍 DEBUG: Checking field '${field}':`, data[field]);
      if (!data[field]) {
        missing.push(field);
      }
    }
    console.log('🔍 DEBUG: Missing fields:', missing);
    return missing;
  }

  /**
   * Generate follow-up questions for missing information
   */
  async generateFollowUpQuestions(intent, missingFields, partialData) {
    let message = `🤖 I'd be happy to help you with that! I need a few more details:\n\n`;
    
    const fieldQuestions = {
      'title': '• **What type of appointment** would you like to schedule? (e.g., "ultrasound", "checkup")',
      'date': '• **What date** would you prefer? (e.g., "tomorrow", "next week", "October 14")',
      'time': '• **What time** works for you? (e.g., "2pm", "morning")',
      'location': '• **Where** should this be? (e.g., "City Hospital", "delhi")',
      'weight': '• **What\'s your weight**? (e.g., "65kg", "140 pounds")',
      'week': '• **Which week** should this be recorded for? (e.g., "week 12", "current week")',
      'symptom': '• **What symptoms** are you experiencing? (e.g., "nausea", "headache")',
      'systolic': '• **What\'s your systolic pressure**? (e.g., "120")',
      'diastolic': '• **What\'s your diastolic pressure**? (e.g., "80")',
      'name': '• **What medicine** did you take? (e.g., "paracetamol", "iron")',
      'dose': '• **What dose** did you take? (e.g., "500mg", "2 tablets")',
      'type': '• **What type of discharge**? (e.g., "normal", "spotting")',
      'color': '• **What color** is it? (e.g., "clear", "white", "pink")',
      'screen': '• **Which screen** would you like to go to? (e.g., "weight", "appointments")',
      'field': '• **What would you like to update**? (e.g., "name", "due date")',
      'value': '• **What\'s the new value**? (e.g., "Shreya", "June 24, 2026")',
      'mood': '• **How are you feeling**? (e.g., "happy", "anxious", "calm", "tired")',
      'intensity': '• **How intense is this feeling**? (e.g., "low", "medium", "high")',
      'duration': '• **How long did you sleep**? (e.g., "8 hours", "7.5 hours")',
      'bedtime': '• **What time did you go to bed**? (e.g., "10pm", "22:00")',
      'wake_time': '• **What time did you wake up**? (e.g., "6am", "06:00")',
      'quality': '• **How was your sleep quality**? (e.g., "excellent", "good", "fair", "poor")',
      'metric': '• **What would you like to analyze**? (e.g., "weight", "sleep", "mood")',
      'timeframe': '• **What timeframe**? (e.g., "this week", "last month", "all time")',
      'chart_type': '• **What type of chart**? (e.g., "line", "bar", "summary")',
      'action_type': '• **What type of action** to undo? (e.g., "weight", "appointment", "last")',
      
      // Medicine fields (for both logging and CRUD)
      'name': '• **What medicine** did you take? (e.g., "paracetamol", "iron tablets")',
      'frequency': '• **How often** do you take this medicine? (e.g., "twice daily", "as needed")',
      'start_date': '• **When did you start** taking this medicine? (e.g., "today", "last week")',
      'end_date': '• **When do you stop** taking this medicine? (e.g., "next week", "when symptoms stop")',
      
      // Blood Pressure CRUD fields  
      'pressure_reading': '• **What\'s your blood pressure reading**? (e.g., "120/80", "systolic 120 diastolic 80")',
      
      // Discharge CRUD fields
      'discharge_type': '• **What type of discharge**? (e.g., "normal", "spotting", "bleeding")',
      
      // Common CRUD fields
      'note': '• **Any additional notes**? (optional)',
      'update_date': '• **Which date** would you like to update/delete? (e.g., "today", "yesterday", "December 19")',
      'update_time': '• **What time**? (e.g., "morning", "2pm", "evening")'
    };

    for (const field of missingFields) {
      if (fieldQuestions[field]) {
        message += fieldQuestions[field] + '\n';
      }
    }

    // Add contextual tip based on intent
    const contextualTips = {
      'create_appointment': '💡 **Tip**: You can provide all details at once! For example: "make appointment for ultrasound tomorrow at 2pm at City Hospital"',
      'log_weight': '💡 **Tip**: You can provide all details at once! For example: "log weight 65kg for week 12 with note feeling good"',
      'log_symptoms': '💡 **Tip**: You can provide all details at once! For example: "log symptom nausea this morning with note mild discomfort"',
      'log_blood_pressure': '💡 **Tip**: You can provide all details at once! For example: "log blood pressure 120/80 this morning with note feeling normal"',
      'log_medicine': '💡 **Tip**: You can provide all details at once! For example: "log medicine paracetamol 500mg twice daily starting today"',
      'log_discharge': '💡 **Tip**: You can provide all details at once! For example: "log discharge normal this morning with note light flow"',
      'log_mood': '💡 **Tip**: You can provide all details at once! For example: "log mood happy with high intensity today feeling great"',
      'log_sleep': '💡 **Tip**: You can provide all details at once! For example: "log sleep 8 hours from 10pm to 6am with excellent quality"',
      'create_task': '💡 **Tip**: You can provide all details at once! For example: "create task buy vitamins for next week with note urgent"',
      'update_appointment': '💡 **Tip**: You can provide all details at once! For example: "update appointment tomorrow change time to 3pm"',
      'delete_appointment': '💡 **Tip**: You can provide all details at once! For example: "delete appointment on December 19"',
      'update_medicine': '💡 **Tip**: You can provide all details at once! For example: "update paracetamol change dose to 1000mg twice daily"',
      'delete_medicine': '💡 **Tip**: You can provide all details at once! For example: "delete paracetamol from yesterday"',
      'update_blood_pressure': '💡 **Tip**: You can provide all details at once! For example: "update blood pressure change reading to 110/70"',
      'delete_blood_pressure': '💡 **Tip**: You can provide all details at once! For example: "delete blood pressure from this morning"',
      'update_discharge': '💡 **Tip**: You can provide all details at once! For example: "update discharge change to spotting this morning"',
      'delete_discharge': '💡 **Tip**: You can provide all details at once! For example: "delete discharge from yesterday"',
      'update_symptoms': '💡 **Tip**: You can provide all details at once! For example: "update symptoms change nausea to mild headache"',
      'delete_symptoms': '💡 **Tip**: You can provide all details at once! For example: "delete symptoms from this morning"',
      'update_weight': '💡 **Tip**: You can provide all details at once! For example: "update weight change to 66kg for week 12"',
      'delete_weight': '💡 **Tip**: You can provide all details at once! For example: "delete weight from yesterday"',
      'update_mood': '💡 **Tip**: You can provide all details at once! For example: "update mood change to anxious with medium intensity"',
      'delete_mood': '💡 **Tip**: You can provide all details at once! For example: "delete mood from this morning"',
      'update_sleep': '💡 **Tip**: You can provide all details at once! For example: "update sleep change to 7 hours with good quality"',
      'delete_sleep': '💡 **Tip**: You can provide all details at once! For example: "delete sleep from last night"',
      'query_analytics': '💡 **Tip**: You can provide all details at once! For example: "show weight analytics for this month as line chart"',
      'get_data': '💡 **Tip**: You can provide all details at once! For example: "show my appointments for next week"',
      'navigate': '💡 **Tip**: You can provide all details at once! For example: "go to weight screen" or "navigate to appointments"'
    };

    const tip = contextualTips[intent.action] || '💡 **Tip**: You can provide all details at once! For example: "make appointment for ultrasound tomorrow at 2pm at City Hospital"';
    message += `\n${tip}`;

    return {
      success: true,
      message: message,
      requiresFollowUp: true,
      intent: intent,
      partialData: partialData,
      missingFields: missingFields
    };
  }

  /**
   * Execute the determined action
   */
  async executeAction(intent, data, userContext) {
    try {
      switch (intent.action) {
        case 'createAppointment':
          return await this.createAppointment(data, userContext);
        case 'logWeight':
          return await this.logWeight(data, userContext);
        case 'logSymptoms':
          return await this.logSymptoms(data, userContext);
        case 'logBloodPressure':
          return await this.logBloodPressure(data, userContext);
        case 'logMedicine':
          return await this.logMedicine(data, userContext);
        case 'logDischarge':
          return await this.logDischarge(data, userContext);
        case 'createTask':
          return await this.createTask(data, userContext);
        case 'navigate':
          return await this.navigate(data, userContext);
        case 'updateProfile':
          return await this.updateProfile(data, userContext);
        case 'getData':
          return await this.getData(data, userContext);
        case 'updateAppointment':
          return await this.updateAppointment(data, userContext);
        case 'deleteAppointment':
          return await this.deleteAppointment(data, userContext);
        case 'logMood':
          return await this.logMood(data, userContext);
        case 'logSleep':
          return await this.logSleep(data, userContext);
        case 'queryAnalytics':
          return await this.queryAnalytics(data, userContext);
        case 'viewWeightLogs':
          return await this.viewWeightLogs(data, userContext);
        case 'viewMedicineLogs':
          return await this.viewMedicineLogs(data, userContext);
        case 'viewSymptomsLogs':
          return await this.viewSymptomsLogs(data, userContext);
        case 'viewBloodPressureLogs':
          return await this.viewBloodPressureLogs(data, userContext);
        case 'viewDischargeLogs':
          return await this.viewDischargeLogs(data, userContext);
        case 'undoAction':
          return await this.undoAction(data, userContext);
        case 'emergency':
          return await this.triggerEmergency(data, userContext);
        case 'logout':
          return await this.logout(data, userContext);
        case 'generalChat':
          return await this.handleGeneralChat(data, userContext);
        
        // Medicine CRUD operations
        case 'updateMedicine':
          return await this.updateMedicine(data, userContext);
        case 'deleteMedicine':
          return await this.deleteMedicine(data, userContext);
        
        // Blood Pressure CRUD operations
        case 'updateBloodPressure':
          return await this.updateBloodPressure(data, userContext);
        case 'deleteBloodPressure':
          return await this.deleteBloodPressure(data, userContext);
        
        // Discharge CRUD operations
        case 'updateDischarge':
          return await this.updateDischarge(data, userContext);
        case 'deleteDischarge':
          return await this.deleteDischarge(data, userContext);
        
        // Symptoms CRUD operations
        case 'updateSymptoms':
          return await this.updateSymptoms(data, userContext);
        case 'deleteSymptoms':
          return await this.deleteSymptoms(data, userContext);
        
        // Weight CRUD operations
        case 'updateWeight':
          return await this.updateWeight(data, userContext);
        case 'deleteWeight':
          return await this.deleteWeight(data, userContext);
        
        // Mood CRUD operations
        case 'updateMood':
          return await this.updateMood(data, userContext);
        case 'deleteMood':
          return await this.deleteMood(data, userContext);
        
        // Sleep CRUD operations
        case 'updateSleep':
          return await this.updateSleep(data, userContext);
        case 'deleteSleep':
          return await this.deleteSleep(data, userContext);
        
        default:
          return {
            success: false,
            message: `❌ I'm not sure how to help with that. Could you try rephrasing your request?`
          };
      }
    } catch (error) {
      console.error('Action execution error:', error);
      return {
        success: false,
        message: `❌ Failed to execute action: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Convert natural language date to proper date format
   */
  convertToDate(dateString) {
    if (!dateString || dateString === 'TBD') {
      return new Date().toISOString().split('T')[0]; // Default to today
    }

    const today = new Date();
    const currentYear = today.getFullYear();

    // Handle "tomorrow"
    if (dateString.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yearStr = tomorrow.getFullYear();
      const monthStr = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dayStr = String(tomorrow.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Handle "today"
    if (dateString.toLowerCase().includes('today')) {
      const yearStr = today.getFullYear();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const dayStr = String(today.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Handle "next week"
    if (dateString.toLowerCase().includes('next week')) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const yearStr = nextWeek.getFullYear();
      const monthStr = String(nextWeek.getMonth() + 1).padStart(2, '0');
      const dayStr = String(nextWeek.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // Handle dates like "12 october" or "12 October 2025"
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];

    const dateMatch = dateString.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?/i);
    
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthName = dateMatch[2].toLowerCase();
      const year = dateMatch[3] ? parseInt(dateMatch[3]) : currentYear;
      const month = monthNames.indexOf(monthName);

      if (month !== -1) {
        const date = new Date(year, month, day); // month is already 0-indexed from indexOf
        // Use timezone-safe formatting to avoid day shifts
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        return `${yearStr}-${monthStr}-${dayStr}`;
      }
    }

    // Handle day names (monday, tuesday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = dayNames.findIndex(day => dateString.toLowerCase().includes(day));
    
    if (dayIndex !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      const daysUntilTarget = (dayIndex - currentDay + 7) % 7;
      targetDate.setDate(today.getDate() + daysUntilTarget);
      const yearStr = targetDate.getFullYear();
      const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(targetDate.getDate()).padStart(2, '0');
      return `${yearStr}-${monthStr}-${dayStr}`;
    }

    // If no pattern matches, return today's date
    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /**
   * Convert natural language time to proper time format
   */
  convertToTime(timeString) {
    if (!timeString || timeString === 'TBD') {
      return '09:00'; // Default to 9 AM
    }

    // Handle "morning", "afternoon", "evening"
    if (timeString.toLowerCase().includes('morning')) return '09:00';
    if (timeString.toLowerCase().includes('afternoon')) return '14:00';
    if (timeString.toLowerCase().includes('evening')) return '18:00';
    if (timeString.toLowerCase().includes('night')) return '20:00';

    // Handle time formats like "2pm", "2 pm", "14:00"
    const timeMatch = timeString.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

      // Convert to 24-hour format
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return '09:00'; // Default fallback
  }

  /**
   * Create appointment
   */
  async createAppointment(data, userContext) {
    try {
      const properDate = this.convertToDate(data.date);
      const properTime = this.convertToTime(data.time);
      await db.addAppointment({
        title: data.title || 'Appointment',
        content: 'Appointment scheduled via chat',
        appointment_date: properDate,
        appointment_time: properTime,
        appointment_location: data.location || 'TBD',
      });
      return {
        success: true,
        message: `📅 Appointment "${data.title || 'Appointment'}" scheduled for ${data.date || 'TBD'} at ${data.time || 'TBD'}${data.location ? ` at ${data.location}` : ''}`,
        action: 'navigate',
        screen: 'appointments'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to create appointment: ${error.message}` };
    }
  }

  /**
   * Log weight
   */
  async logWeight(data, userContext) {
    try {
      const wk = data.week_number || userContext.current_week || 12;
      await db.addWeight({ weight: data.weight, week_number: wk, note: data.note || '' });
      return {
        success: true,
        message: `⚖️ Weight ${data.weight}kg logged for week ${wk}${data.note ? ` (Note: ${data.note})` : ''}`,
        action: 'navigate', screen: 'weight'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to log weight: ${error.message}` };
    }
  }

  /**
   * Log symptoms
   */
  async logSymptoms(data, userContext) {
    try {
      const wk = data.week_number || userContext.current_week || 12;
      await db.addSymptom({ symptom: data.symptom, week_number: wk, note: data.note || '' });
      return {
        success: true,
        message: `🩺 Symptom "${data.symptom}" logged for week ${wk}${data.note ? ` (Note: ${data.note})` : ''}`,
        action: 'navigate', screen: 'symptoms'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to log symptoms: ${error.message}` };
    }
  }

  /**
   * Log blood pressure
   */
  async logBloodPressure(data, userContext) {
    try {
      const wk = data.week_number || userContext.current_week || 12;
      await db.addBloodPressure({ systolic: data.systolic, diastolic: data.diastolic, week_number: wk, time: data.time || new Date().toLocaleTimeString(), note: data.note || '' });
      return {
        success: true,
        message: `🩸 Blood pressure ${data.systolic}/${data.diastolic} logged for week ${wk}${data.note ? ` (Note: ${data.note})` : ''}`,
        action: 'navigate', screen: 'bloodpressure'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to log blood pressure: ${error.message}` };
    }
  }

  /**
   * Log medicine
   */
  async logMedicine(data, userContext) {
    try {
      const wk = data.week_number || userContext.current_week || 12;
      await db.addMedicine({ name: data.name, dose: data.dose || '', time: data.time || '', week_number: wk, note: data.note || '' });
      return {
        success: true,
        message: `💊 Medicine "${data.name}"${data.dose ? ` (${data.dose})` : ''} logged for week ${wk}${data.time ? ` at ${data.time}` : ''}${data.note ? ` (Note: ${data.note})` : ''}`,
        action: 'navigate', screen: 'medicine'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to log medicine: ${error.message}` };
    }
  }

  /**
   * Log discharge
   */
  async logDischarge(data, userContext) {
    try {
      const wk = data.week_number || userContext.current_week || 12;
      await db.addDischarge({ type: data.type, color: data.color, bleeding: data.bleeding || 'no', week_number: wk, note: data.note || '' });
      return {
        success: true,
        message: `🩸 Discharge log recorded for week ${wk}: ${data.type}, ${data.color}${data.note ? ` (Note: ${data.note})` : ''}`,
        action: 'navigate', screen: 'discharge'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to log discharge: ${error.message}` };
    }
  }

  /**
   * Create task
   */
  async createTask(data, userContext) {
    try {
      const wk = data.week || userContext.current_week || 12;
      await db.addTask({ title: data.title, content: data.note || '', starting_week: wk, ending_week: wk, task_priority: data.priority || 'medium', task_status: 'pending' });
      return {
        success: true,
        message: `✅ Task "${data.title}" created for week ${wk} with ${data.priority || 'medium'} priority`,
        action: 'navigate', screen: 'tasks'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to create task: ${error.message}` };
    }
  }

  /**
   * Navigate to screen
   */
  async navigate(data, userContext) {
    const screenNames = {
      'home': 'Home',
      'weight': 'Weight',
      'symptoms': 'Symptoms',
      'medicine': 'Medicine',
      'appointments': 'Calendar',
      'calendar': 'Calendar',
      'blood_pressure': 'BloodPressure',
      'discharge': 'Discharge',
      'timeline': 'Timeline',
      'settings': 'Settings',
      'tasks': 'AllTasks'
    };

    const screenDisplayName = screenNames[data.screen] || data.screen;
    const actualScreenName = screenNames[data.screen] || data.screen;
    
    return {
      success: true,
      message: `🚀 Navigating to ${screenDisplayName}...`,
      action: 'navigate',
      screen: actualScreenName
    };
  }

  /**
   * Update profile
   */
  async updateProfile(data, userContext) {
    try {
      const profile = await db.getLocalProfile() || {};
      profile[data.field] = data.value;
      await db.saveProfileLocally(profile);
      return {
        success: true,
        message: `👤 Profile updated successfully! ${data.field} set to ${data.value}`,
        action: 'navigate', screen: 'settings'
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to update profile: ${error.message}` };
    }
  }

  /**
   * Get data
   */
  async getData(data, userContext) {
    try {
      let result = [];
      switch (data.type) {
        case 'appointments': result = await db.getAppointments(); break;
        case 'weight': result = await db.getWeightHistory(); break;
        case 'symptoms': result = await db.getSymptomsHistory(); break;
        case 'medicine': result = await db.getMedicineHistory(); break;
        case 'blood_pressure': result = await db.getBloodPressureHistory(); break;
        case 'discharge': result = await db.getDischargeHistory(); break;
        case 'tasks': result = await db.getTasks(); break;
        default: throw new Error('Unknown data type');
      }

      let formattedMessage = '';
      switch (data.type) {
        case 'appointments':
          if (result.length === 0) {
            formattedMessage = '📅 You have no upcoming appointments scheduled.';
          } else {
            formattedMessage = '📅 **Your Upcoming Appointments:**\n\n';
            result.forEach((apt, index) => {
              formattedMessage += `${index + 1}. **${apt.title}** (ID: ${apt.id})\n`;
              formattedMessage += `   📅 Date: ${apt.appointment_date}\n`;
              formattedMessage += `   ⏰ Time: ${apt.appointment_time}\n`;
              formattedMessage += `   📍 Location: ${apt.appointment_location}\n`;
              formattedMessage += `   📝 Status: ${apt.appointment_status}\n\n`;
            });
          }
          break;
        case 'weight': formattedMessage = `⚖️ **Weight History:**\n\n${JSON.stringify(result, null, 2)}`; break;
        case 'symptoms': formattedMessage = `🤒 **Symptom Log:**\n\n${JSON.stringify(result, null, 2)}`; break;
        case 'medicine': formattedMessage = `💊 **Medicine Log:**\n\n${JSON.stringify(result, null, 2)}`; break;
        case 'blood_pressure': formattedMessage = `🩺 **Blood Pressure Log:**\n\n${JSON.stringify(result, null, 2)}`; break;
        case 'discharge': formattedMessage = `🩸 **Discharge Log:**\n\n${JSON.stringify(result, null, 2)}`; break;
        case 'tasks': formattedMessage = `✅ **Tasks:**\n\n${JSON.stringify(result, null, 2)}`; break;
        default: formattedMessage = `📊 **${data.type} Data:**\n\n${JSON.stringify(result, null, 2)}`;
      }
      return { success: true, message: formattedMessage, data: result };
    } catch (error) {
      return { success: false, message: `❌ Failed to fetch ${data.type} data: ${error.message}` };
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(data, userContext) {
    try {
      const appointments = await db.getAppointments();
      const matchingAppointments = this.findMatchingAppointments(appointments, data.appointment_identifier);
      
      if (matchingAppointments.length === 0) {
        return {
          success: false,
          message: `❌ No appointments found matching your criteria.`
        };
      }
      
      if (matchingAppointments.length > 1) {
        // Multiple matches - ask user to clarify
        let message = `🔍 I found ${matchingAppointments.length} appointments that match your request:\n\n`;
        matchingAppointments.forEach((apt, index) => {
          message += `${index + 1}. **${apt.title}** (ID: ${apt.id})\n`;
          message += `   📅 ${apt.appointment_date} at ${apt.appointment_time}\n`;
          message += `   📍 ${apt.appointment_location}\n\n`;
        });
        message += `Please specify which appointment you want to update by saying the number (1, 2, etc.) or provide more details.`;
        
        return {
          success: true,
          message: message,
          requiresFollowUp: true,
          intent: { action: 'updateAppointment' },
          partialData: data,
          missingFields: ['appointment_selection'],
          matchingAppointments: matchingAppointments
        };
      }
      
      // Single match - proceed with update
      const appointmentToUpdate = matchingAppointments[0];
      const updateData = {
        title: data.title || appointmentToUpdate.title,
        appointment_date: data.date ? this.convertToDate(data.date) : appointmentToUpdate.appointment_date,
        appointment_time: data.time ? this.convertToTime(data.time) : appointmentToUpdate.appointment_time,
        appointment_location: data.location || appointmentToUpdate.appointment_location,
        content: data.note || appointmentToUpdate.content
      };
      
      await db.updateAppointment(appointmentToUpdate.id, updateData);
      return {
        success: true,
        message: `✅ Appointment "${updateData.title}" updated successfully!\n\n📅 Date: ${updateData.appointment_date}\n⏰ Time: ${updateData.appointment_time}\n📍 Location: ${updateData.appointment_location}`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update appointment: ${error.message}`
      };
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(data, userContext) {
    try {
      const appointments = await db.getAppointments();
      const matchingAppointments = this.findMatchingAppointments(appointments, data.appointment_identifier);
      
      if (matchingAppointments.length === 0) {
        return {
          success: false,
          message: `❌ No appointments found matching your criteria.`
        };
      }
      
      if (matchingAppointments.length > 1) {
        // Multiple matches - ask user to clarify
        let message = `🔍 I found ${matchingAppointments.length} appointments that match your request:\n\n`;
        matchingAppointments.forEach((apt, index) => {
          message += `${index + 1}. **${apt.title}** (ID: ${apt.id})\n`;
          message += `   📅 ${apt.appointment_date} at ${apt.appointment_time}\n`;
          message += `   📍 ${apt.appointment_location}\n\n`;
        });
        message += `Please specify which appointment(s) you want to delete by saying:\n`;
        message += `• A number (1, 2, etc.) for a single appointment\n`;
        message += `• "all" to delete all matching appointments\n`;
        if (matchingAppointments.length === 2) {
          message += `• "both" to delete both appointments\n`;
        } else if (matchingAppointments.length > 2) {
          message += `• "first" or "last" to delete the first or last appointment\n`;
        }
        message += `• Or provide more specific details`;
        
        return {
          success: true,
          message: message,
          requiresFollowUp: true,
          intent: { action: 'deleteAppointment' },
          partialData: data,
          missingFields: ['appointment_selection'],
          matchingAppointments: matchingAppointments
        };
      }
      
      // Single match - proceed with deletion
      const appointmentToDelete = matchingAppointments[0];
      
      await db.deleteAppointment(appointmentToDelete.id);
      return {
        success: true,
        message: `✅ Appointment "${appointmentToDelete.title}" deleted successfully!`
      };
    } catch (error) {
      console.error('Delete appointment error:', error);
      return {
        success: false,
        message: `❌ Failed to delete appointment: ${error.message}`
      };
    }
  }

  /**
   * Find matching appointments based on identifier
   */
  findMatchingAppointments(appointments, identifier) {
    if (!identifier) return appointments;
    
    const matches = [];
    
    for (const appointment of appointments) {
      let isMatch = false;
      
      switch (identifier.type) {
        case 'title':
          isMatch = appointment.title && appointment.title.toLowerCase().includes(identifier.value.toLowerCase());
          break;
        case 'date':
          // Enhanced date matching to handle year-less dates
          isMatch = this.isDateMatch(appointment.appointment_date, identifier.value);
          break;
        case 'time':
          isMatch = appointment.appointment_time === this.convertToTime(identifier.value);
          break;
        case 'location':
          isMatch = appointment.appointment_location && appointment.appointment_location.toLowerCase().includes(identifier.value.toLowerCase());
          break;
        case 'day':
          const appointmentDate = new Date(appointment.appointment_date);
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const appointmentDay = dayNames[appointmentDate.getDay()];
          isMatch = appointmentDay === identifier.value.toLowerCase();
          break;
        case 'relative':
          if (identifier.value === 'first') {
            isMatch = appointments.indexOf(appointment) === 0;
          } else if (identifier.value === 'last') {
            isMatch = appointments.indexOf(appointment) === appointments.length - 1;
          } else if (identifier.value === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            isMatch = appointment.appointment_date === tomorrowStr;
          } else if (identifier.value === 'today') {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            isMatch = appointment.appointment_date === todayStr;
          }
          break;
      }
      
      if (isMatch) {
        matches.push(appointment);
      }
    }
    
    return matches;
  }

  /**
   * Enhanced date matching to handle year-less dates
   */
  isDateMatch(appointmentDate, queryDate) {
    // First try exact match
    const convertedQueryDate = this.convertToDate(queryDate);
    if (appointmentDate === convertedQueryDate) {
      return true;
    }
    
    // If no exact match and query doesn't contain a year, try month-day matching
    if (!queryDate.match(/\d{4}/)) {
      const appointmentDateObj = new Date(appointmentDate);
      const appointmentMonth = appointmentDateObj.getMonth() + 1; // 0-indexed
      const appointmentDay = appointmentDateObj.getDate();
      
      // Try to extract month and day from query
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'];
      
      const dateMatch = queryDate.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i);
      
      if (dateMatch) {
        const queryDay = parseInt(dateMatch[1]);
        const queryMonthName = dateMatch[2].toLowerCase();
        const queryMonth = monthNames.indexOf(queryMonthName) + 1; // 0-indexed to 1-indexed
        
        return queryDay === appointmentDay && queryMonth === appointmentMonth;
      }
    }
    
    return false;
  }

  /**
   * Trigger emergency
   */
  async triggerEmergency(data, userContext) {
    return {
      success: true,
      message: `🚨 Emergency mode activated! Help is on the way.`,
      action: 'emergency',
      emergency: true
    };
  }

  /**
   * Logout
   */
  async logout(data, userContext) {
    try {
      await db.deleteLocalProfile();
      return { success: true, message: '👋 Logging out... Goodbye!', action: 'logout' };
    } catch (error) {
      return { success: true, message: '👋 Logging out... Goodbye!', action: 'logout' };
    }
  }

  /**
   * Handle general chat
   */
  async handleGeneralChat(data, userContext) {
    return {
      success: true,
      message: 'I\'m here to help with your pregnancy journey! How can I assist you today?',
      action: 'generalChat'
    };
  }

  /**
   * Extract mood from query
   */
  extractMood(query) {
    const moods = {
      'happy': ['happy', 'joyful', 'cheerful', 'good', 'great', 'wonderful'],
      'sad': ['sad', 'down', 'depressed', 'blue', 'melancholy'],
      'anxious': ['anxious', 'worried', 'nervous', 'stressed', 'tense'],
      'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil'],
      'energetic': ['energetic', 'excited', 'pumped', 'motivated', 'active'],
      'tired': ['tired', 'exhausted', 'drained', 'fatigued', 'sleepy'],
      'frustrated': ['frustrated', 'annoyed', 'irritated', 'angry', 'mad']
    };

    for (const [mood, keywords] of Object.entries(moods)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return mood;
        }
      }
    }
    return null;
  }

  /**
   * Extract mood intensity from query
   */
  extractIntensity(query) {
    const intensityPatterns = [
      /very\s+(.*)/,
      /extremely\s+(.*)/,
      /quite\s+(.*)/,
      /somewhat\s+(.*)/,
      /a little\s+(.*)/,
      /slightly\s+(.*)/
    ];

    for (const pattern of intensityPatterns) {
      const match = query.match(pattern);
      if (match) {
        const intensity = match[1].toLowerCase();
        if (intensity.includes('very') || intensity.includes('extremely')) return 'high';
        if (intensity.includes('quite') || intensity.includes('somewhat')) return 'medium';
        if (intensity.includes('little') || intensity.includes('slightly')) return 'low';
      }
    }
    return 'medium'; // Default intensity
  }

  /**
   * Extract sleep duration from query
   */
  extractSleepDuration(query) {
    const durationPatterns = [
      /(\d+(?:\.\d+)?)\s*hours?/,
      /(\d+(?:\.\d+)?)\s*hrs?/,
      /slept\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)\s*hours?\s*of\s*sleep/
    ];

    for (const pattern of durationPatterns) {
      const match = query.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract bedtime from query
   */
  extractBedtime(query) {
    const timePatterns = [
      /went\s+to\s+bed\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /bedtime\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /slept\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    ];

    for (const pattern of timePatterns) {
      const match = query.match(pattern);
      if (match) {
        return this.convertToTime(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract wake time from query
   */
  extractWakeTime(query) {
    const timePatterns = [
      /woke\s+up\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /wake\s+up\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
      /got\s+up\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    ];

    for (const pattern of timePatterns) {
      const match = query.match(pattern);
      if (match) {
        return this.convertToTime(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract sleep quality from query
   */
  extractSleepQuality(query) {
    const qualityKeywords = {
      'excellent': ['excellent', 'great', 'amazing', 'perfect', 'wonderful'],
      'good': ['good', 'well', 'decent', 'fine', 'okay'],
      'fair': ['fair', 'average', 'ok', 'so-so'],
      'poor': ['poor', 'bad', 'terrible', 'awful', 'horrible']
    };

    for (const [quality, keywords] of Object.entries(qualityKeywords)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return quality;
        }
      }
    }
    return 'good'; // Default quality
  }

  /**
   * Extract metric from analytics query
   */
  extractMetric(query) {
    const metrics = {
      'weight': ['weight', 'weigh', 'kg', 'kilos', 'pounds', 'lbs'],
      'sleep': ['sleep', 'sleeping', 'bedtime', 'hours of sleep'],
      'mood': ['mood', 'feeling', 'emotions', 'mental health'],
      'symptoms': ['symptoms', 'pain', 'nausea', 'discomfort'],
      'appointments': ['appointments', 'visits', 'checkups', 'consultations']
    };

    for (const [metric, keywords] of Object.entries(metrics)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return metric;
        }
      }
    }
    return 'weight'; // Default metric
  }

  /**
   * Extract timeframe from analytics query
   */
  extractTimeframe(query) {
    const timeframes = {
      'today': ['today', 'this day'],
      'week': ['this week', 'past week', 'last 7 days'],
      'month': ['this month', 'past month', 'last month', '30 days'],
      'year': ['this year', 'past year', 'last year'],
      'all': ['all time', 'ever', 'total', 'overall']
    };

    for (const [timeframe, keywords] of Object.entries(timeframes)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return timeframe;
        }
      }
    }
    return 'week'; // Default timeframe
  }

  /**
   * Extract chart type from analytics query
   */
  extractChartType(query) {
    const chartTypes = {
      'line': ['trend', 'over time', 'progression', 'line'],
      'bar': ['bar', 'comparison', 'comparative'],
      'pie': ['pie', 'distribution', 'breakdown'],
      'summary': ['summary', 'overview', 'stats', 'statistics']
    };

    for (const [chartType, keywords] of Object.entries(chartTypes)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return chartType;
        }
      }
    }
    return 'summary'; // Default chart type
  }

  /**
   * Extract action type from undo query
   */
  extractActionType(query) {
    const actionTypes = {
      'weight': ['weight', 'weigh'],
      'appointment': ['appointment', 'visit', 'checkup'],
      'symptom': ['symptom', 'symptoms'],
      'mood': ['mood', 'feeling'],
      'sleep': ['sleep', 'sleeping'],
      'medicine': ['medicine', 'medication']
    };

    for (const [actionType, keywords] of Object.entries(actionTypes)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return actionType;
        }
      }
    }
    return 'last'; // Default to last action
  }

  /**
   * Log mood entry
   */
  async logMood(data, userContext) {
    try {
      const wk = userContext.current_week || 12;
      await db.addMood({ mood: data.mood, intensity: data.intensity || 'medium', week_number: wk, note: data.note || '' });
      return {
        success: true,
        message: `😊 Mood logged successfully!\n\n**Mood:** ${data.mood}\n**Intensity:** ${data.intensity || 'medium'}\n**Week:** ${wk}`
      };
    } catch (error) {
      return { success: false, message: `❌ Failed to log mood: ${error.message}` };
    }
  }

  /**
   * Log sleep entry
   */
  async logSleep(data, userContext) {
    try {
      const wk = userContext.current_week || 12;
      await db.addSleep({ duration: data.duration, bedtime: data.bedtime || null, wake_time: data.wake_time || null, quality: data.quality || 'good', week_number: wk, note: data.note || '' });
      let message = `😴 Sleep logged successfully!\n\n**Duration:** ${data.duration} hours`;
      if (data.bedtime) message += `\n**Bedtime:** ${data.bedtime}`;
      if (data.wake_time) message += `\n**Wake time:** ${data.wake_time}`;
      message += `\n**Quality:** ${data.quality || 'good'}\n**Week:** ${wk}`;
      return { success: true, message };
    } catch (error) {
      return { success: false, message: `❌ Failed to log sleep: ${error.message}` };
    }
  }

  /**
   * Query analytics (offline - computed from local data)
   */
  async queryAnalytics(data, userContext) {
    try {
      let allData = [];
      switch (data.metric) {
        case 'weight': allData = await db.getWeightHistory(); break;
        case 'sleep': allData = await db.getSleepHistory(); break;
        case 'mood': allData = await db.getMoodHistory(); break;
        case 'blood_pressure': allData = await db.getBloodPressureHistory(); break;
        case 'symptoms': allData = await db.getSymptomsHistory(); break;
        default: allData = [];
      }
      let message = `\ud83d\udcca **${data.metric.charAt(0).toUpperCase() + data.metric.slice(1)} Analytics**\n\n`;
      message += `**Total Entries:** ${allData.length}\n`;
      if (allData.length === 0) {
        message += '\nNo data yet. Start logging to see trends!';
      } else if (data.metric === 'weight') {
        const w = allData.map(e => parseFloat(e.weight)).filter(v => !isNaN(v));
        if (w.length) message += `**Min:** ${Math.min(...w)}kg  **Max:** ${Math.max(...w)}kg  **Avg:** ${(w.reduce((a,b)=>a+b,0)/w.length).toFixed(1)}kg\n`;
      } else if (data.metric === 'sleep') {
        const d = allData.map(e => parseFloat(e.duration)).filter(v => !isNaN(v));
        if (d.length) message += `**Min:** ${Math.min(...d)}h  **Max:** ${Math.max(...d)}h  **Avg:** ${(d.reduce((a,b)=>a+b,0)/d.length).toFixed(1)}h\n`;
      } else if (data.metric === 'mood') {
        const mc = {}; allData.forEach(e => { mc[e.mood] = (mc[e.mood]||0)+1; });
        for (const [mood, c] of Object.entries(mc)) message += `  ${mood}: ${c}\n`;
      }
      return { success: true, message, data: allData };
    } catch (error) {
      return { success: false, message: `\u274c Failed: ${error.message}` };
    }
  }

  createTextChart(labels, dataPoints, label, chartType) {
    const maxVal = Math.max(...dataPoints);
    let chart = `\`\`\`\n${label}\n`;
    for (let i = 0; i < labels.length; i++) {
      const bar = '\u2588'.repeat(Math.max(1, Math.round((dataPoints[i] / maxVal) * 30)));
      chart += `${labels[i].toString().padEnd(10)} ${bar} ${dataPoints[i]}\n`;
    }
    chart += `\`\`\`\n`;
    return chart;
  }

  createPieChart(labels, dataPoints) {
    const total = dataPoints.reduce((a, b) => a + b, 0);
    let chart = `\`\`\`\n`;
    for (let i = 0; i < labels.length; i++) {
      const pct = ((dataPoints[i] / total) * 100).toFixed(1);
      chart += `${labels[i].toString().padEnd(15)} ${'\u2588'.repeat(Math.round(pct / 3))} ${pct}%\n`;
    }
    chart += `\`\`\`\n`;
    return chart;
  }

  async viewWeightLogs(data) {
    try {
      const logs = await db.getWeightHistory();
      let fl = data.week_number ? logs.filter(l => l.week_number === data.week_number) : logs;
      if (data.limit) fl = fl.slice(0, data.limit);
      if (!fl.length) return { success: true, message: '\ud83d\udcca No weight entries found.' };
      let msg = `\ud83d\udcca **Weight Logs** (${fl.length})\n\n`;
      fl.forEach((l, i) => { msg += `${i + 1}. Wk ${l.week_number}: **${l.weight}kg**${l.note ? ' \u2014 ' + l.note : ''}\n`; });
      return { success: true, message: msg, data: fl };
    } catch (e) { return { success: false, message: `\u274c ${e.message}` }; }
  }

  async viewMedicineLogs(data) {
    try {
      const logs = await db.getMedicineHistory();
      let fl = data.week_number ? logs.filter(l => l.week_number === data.week_number) : logs;
      if (data.limit) fl = fl.slice(0, data.limit);
      if (!fl.length) return { success: true, message: '\ud83d\udc8a No medicine entries found.' };
      let msg = `\ud83d\udc8a **Medicine Logs** (${fl.length})\n\n`;
      fl.forEach((l, i) => { msg += `${i + 1}. **${l.name}** ${l.dose || ''}${l.time ? ' at ' + l.time : ''}\n`; });
      return { success: true, message: msg, data: fl };
    } catch (e) { return { success: false, message: `\u274c ${e.message}` }; }
  }

  async viewSymptomsLogs(data) {
    try {
      const logs = await db.getSymptomsHistory();
      let fl = data.week_number ? logs.filter(l => l.week_number === data.week_number) : logs;
      if (data.limit) fl = fl.slice(0, data.limit);
      if (!fl.length) return { success: true, message: '\ud83e\udd12 No symptom entries found.' };
      let msg = `\ud83e\udd12 **Symptoms Logs** (${fl.length})\n\n`;
      fl.forEach((l, i) => { msg += `${i + 1}. Wk ${l.week_number}: **${l.symptom}**\n`; });
      return { success: true, message: msg, data: fl };
    } catch (e) { return { success: false, message: `\u274c ${e.message}` }; }
  }

  async viewBloodPressureLogs(data) {
    try {
      const logs = await db.getBloodPressureHistory();
      let fl = data.week_number ? logs.filter(l => l.week_number === data.week_number) : logs;
      if (data.limit) fl = fl.slice(0, data.limit);
      if (!fl.length) return { success: true, message: '\ud83e\ude7a No BP entries found.' };
      let msg = `\ud83e\ude7a **Blood Pressure Logs** (${fl.length})\n\n`;
      fl.forEach((l, i) => { msg += `${i + 1}. Wk ${l.week_number}: **${l.systolic}/${l.diastolic}**\n`; });
      return { success: true, message: msg, data: fl };
    } catch (e) { return { success: false, message: `\u274c ${e.message}` }; }
  }

  async viewDischargeLogs(data) {
    try {
      const logs = await db.getDischargeHistory();
      let fl = data.week_number ? logs.filter(l => l.week_number === data.week_number) : logs;
      if (data.limit) fl = fl.slice(0, data.limit);
      if (!fl.length) return { success: true, message: '\ud83e\ude78 No discharge entries found.' };
      let msg = `\ud83e\ude78 **Discharge Logs** (${fl.length})\n\n`;
      fl.forEach((l, i) => { msg += `${i + 1}. Wk ${l.week_number}: ${l.type}, ${l.color}\n`; });
      return { success: true, message: msg, data: fl };
    } catch (e) { return { success: false, message: `\u274c ${e.message}` }; }
  }

  async undoAction() {
    return { success: false, message: '\u21a9\ufe0f Undo is not supported offline. Please edit or delete entries manually.' };
  }

  async updateMedicine(data) { try { const all = await db.getMedicineHistory(); const m = all.find(e => e.name && e.name.toLowerCase().includes((data.medicine_name||'').toLowerCase())); if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateMedicine(m.id, data); return {success:true,message:'\u2705 Medicine updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteMedicine(data) { try { const all = await db.getMedicineHistory(); const m = all.find(e => e.name && e.name.toLowerCase().includes((data.medicine_name||'').toLowerCase())); if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteMedicine(m.id); return {success:true,message:'\u2705 Medicine deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async updateBloodPressure(data) { try { const all = await db.getBloodPressureHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateBloodPressure(m.id, data); return {success:true,message:'\u2705 BP updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteBloodPressure(data) { try { const all = await db.getBloodPressureHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteBloodPressure(m.id); return {success:true,message:'\u2705 BP deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async updateDischarge(data) { try { const all = await db.getDischargeHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateDischarge(m.id, data); return {success:true,message:'\u2705 Discharge updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteDischarge(data) { try { const all = await db.getDischargeHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteDischarge(m.id); return {success:true,message:'\u2705 Discharge deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async updateSymptoms(data) { try { const all = await db.getSymptomsHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateSymptom(m.id, data); return {success:true,message:'\u2705 Symptom updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteSymptoms(data) { try { const all = await db.getSymptomsHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteSymptom(m.id); return {success:true,message:'\u2705 Symptom deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async updateWeight(data) { try { const all = await db.getWeightHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateWeight(m.id, data); return {success:true,message:'\u2705 Weight updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteWeight(data) { try { const all = await db.getWeightHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteWeight(m.id); return {success:true,message:'\u2705 Weight deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async updateMoodEntry(data) { try { const all = await db.getMoodHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateMood(m.id, data); return {success:true,message:'\u2705 Mood updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteMoodEntry(data) { try { const all = await db.getMoodHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteMood(m.id); return {success:true,message:'\u2705 Mood deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async updateSleepEntry(data) { try { const all = await db.getSleepHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.updateSleep(m.id, data); return {success:true,message:'\u2705 Sleep updated.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
  async deleteSleepEntry(data) { try { const all = await db.getSleepHistory(); const m = all[all.length-1]; if (!m) return {success:false,message:'\u274c Not found.'}; await db.deleteSleep(m.id); return {success:true,message:'\u2705 Sleep deleted.'}; } catch(e) { return {success:false,message:'\u274c '+e.message}; } }
}

// Export singleton instance
export const ragService = new RAGService();
export default ragService;
