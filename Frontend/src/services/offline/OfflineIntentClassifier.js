/**
 * OfflineIntentClassifier - Classifies user query intent for routing
 * Port of Python intent.py to JavaScript with enhanced detection
 */

class OfflineIntentClassifier {
  constructor() {
    this.intentPatterns = {
      // Appointment-related patterns
      appointments: {
        keywords: ['appointment', 'schedule', 'book', 'meeting', 'visit', 'consultation', 'doctor', 'checkup'],
        patterns: [
          /\bappointment\b/i,
          /\bschedule\b.*\b(visit|doctor|checkup)\b/i,
          /\bbook\b.*\b(appointment|visit)\b/i,
          /\bsee\b.*\bdoctor\b/i,
        ]
      },
      
      // Weight-related patterns
      weight: {
        keywords: ['weight', 'weigh', 'kg', 'kilos', 'pounds', 'lbs', 'gained', 'lost'],
        patterns: [
          /\bweight\b/i,
          /\bweigh\b/i,
          /\b\d+\s*(kg|kilos?|pounds?|lbs)\b/i,
          /\bgained?\b.*\b(weight|kg)\b/i,
          /\blost?\b.*\b(weight|kg)\b/i,
        ]
      },
      
      // Symptom-related patterns
      symptoms: {
        keywords: ['symptom', 'symptoms', 'feeling', 'pain', 'ache', 'nausea', 'sick', 'dizzy', 'headache', 'fatigue', 'cramp'],
        patterns: [
          /\bsymptom\b/i,
          /\bfeeling\b.*\b(sick|dizzy|tired|nauseous)\b/i,
          /\bhave\b.*\b(pain|ache|nausea|headache|cramp)\b/i,
          /\bmorning\s*sickness\b/i,
        ]
      },
      
      // Blood pressure patterns
      blood_pressure: {
        keywords: ['blood pressure', 'bp', 'pressure', 'systolic', 'diastolic', 'hypertension'],
        patterns: [
          /\bblood\s*pressure\b/i,
          /\bbp\b/i,
          /\b\d{2,3}\/\d{2,3}\b/, // Pattern like 120/80
          /\bsystolic\b/i,
          /\bdiastolic\b/i,
        ]
      },
      
      // Medicine patterns
      medicine: {
        keywords: ['medicine', 'medication', 'med', 'pill', 'tablet', 'drug', 'took', 'taking', 'prescription', 'supplement', 'vitamin'],
        patterns: [
          /\bmedicine\b/i,
          /\bmedication\b/i,
          /\btook\b.*\b(pill|tablet|medicine|medication)\b/i,
          /\btaking\b.*\b(medicine|medication|supplement)\b/i,
          /\bprescription\b/i,
        ]
      },
      
      // Discharge patterns
      discharge: {
        keywords: ['discharge', 'bleeding', 'spotting', 'flow', 'mucus'],
        patterns: [
          /\bdischarge\b/i,
          /\bbleeding\b/i,
          /\bspotting\b/i,
          /\bvaginal\b/i,
        ]
      },
      
      // Mood patterns
      mood: {
        keywords: ['mood', 'feeling', 'happy', 'sad', 'anxious', 'stressed', 'calm', 'emotional', 'depressed', 'worried'],
        patterns: [
          /\bmood\b/i,
          /\bfeeling\b\s*(happy|sad|anxious|stressed|calm|emotional|depressed|worried)\b/i,
          /\bi\s*(am|feel)\s*(happy|sad|anxious|stressed|calm|emotional|depressed|worried)\b/i,
        ]
      },
      
      // Sleep patterns
      sleep: {
        keywords: ['sleep', 'slept', 'sleeping', 'bedtime', 'wake', 'woke', 'insomnia', 'rest', 'tired', 'fatigue'],
        patterns: [
          /\bsleep\b/i,
          /\bslept\b/i,
          /\bbedtime\b/i,
          /\bwoke\b.*\bup\b/i,
          /\binsomnia\b/i,
          /\bhours?\s*of\s*sleep\b/i,
        ]
      },
      
      // Guidelines patterns
      guidelines: {
        keywords: ['vaccine', 'vaccination', 'guideline', 'recommend', 'test', 'scan', 'ultrasound', 'screening', 'what should', 'advice'],
        patterns: [
          /\bvaccin(e|ation)\b/i,
          /\bguideline\b/i,
          /\brecommend\b/i,
          /\bwhat\s*(test|scan|should)\b/i,
          /\bscreening\b/i,
          /\bultrasound\b/i,
          /\badvice\b/i,
        ]
      },
      
      // Task patterns
      tasks: {
        keywords: ['task', 'todo', 'reminder', 'to-do', 'checklist'],
        patterns: [
          /\btask\b/i,
          /\btodo\b/i,
          /\bto-do\b/i,
          /\breminder\b/i,
          /\bchecklist\b/i,
        ]
      },
      
      // Emergency patterns
      emergency: {
        keywords: ['emergency', 'urgent', 'help', 'sos', 'danger', 'severe', 'bleeding heavily', 'cant breathe', 'chest pain'],
        patterns: [
          /\bemergency\b/i,
          /\burgent\b/i,
          /\bsos\b/i,
          /\bhelp\s*me\b/i,
          /\bsevere\s*(pain|bleeding)\b/i,
          /\bcant?\s*breathe\b/i,
          /\bchest\s*pain\b/i,
        ]
      },
      
      // Analytics/Query patterns
      analytics: {
        keywords: ['analytics', 'stats', 'statistics', 'trend', 'average', 'summary', 'report', 'show', 'history', 'track'],
        patterns: [
          /\banalytics\b/i,
          /\bstats\b/i,
          /\btrend\b/i,
          /\bshow\b.*\b(weight|sleep|mood|history)\b/i,
          /\bsummary\b/i,
          /\breport\b/i,
        ]
      },

      // Navigation patterns
      navigation: {
        keywords: ['go to', 'open', 'show', 'navigate', 'take me'],
        patterns: [
          /\bgo\s*to\b/i,
          /\bopen\b.*\b(screen|page|settings|profile|calendar|home)\b/i,
          /\bnavigate\b.*\bto\b/i,
          /\btake\s*me\s*to\b/i,
        ]
      },
    };
  }

  classifyIntent(query) {
    if (!query || typeof query !== 'string') {
      return 'general';
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Check for emergency first (highest priority)
    if (this.matchesIntent(normalizedQuery, 'emergency')) {
      return 'emergency';
    }

    // Score-based intent detection for better accuracy
    const scores = {};
    
    for (const [intent, config] of Object.entries(this.intentPatterns)) {
      if (intent === 'emergency') continue;
      
      let score = 0;
      
      // Check keywords
      for (const keyword of config.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      // Check regex patterns (higher weight)
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedQuery)) {
          score += 2;
        }
      }
      
      if (score > 0) {
        scores[intent] = score;
      }
    }

    // Find highest scoring intent
    let maxScore = 0;
    let bestIntent = 'general';
    
    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    }

    return bestIntent;
  }

  matchesIntent(query, intentName) {
    const config = this.intentPatterns[intentName];
    if (!config) return false;

    // Check keywords
    for (const keyword of config.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    // Check patterns
    for (const pattern of config.patterns) {
      if (pattern.test(query)) {
        return true;
      }
    }

    return false;
  }

  // Get all possible intents for debugging
  getAllIntents() {
    return Object.keys(this.intentPatterns);
  }

  // Get intent with confidence score
  classifyWithConfidence(query) {
    if (!query || typeof query !== 'string') {
      return { intent: 'general', confidence: 0, scores: {} };
    }

    const normalizedQuery = query.toLowerCase().trim();
    const scores = {};
    
    // Check for emergency first
    if (this.matchesIntent(normalizedQuery, 'emergency')) {
      return { intent: 'emergency', confidence: 1.0, scores: { emergency: 10 } };
    }

    for (const [intent, config] of Object.entries(this.intentPatterns)) {
      if (intent === 'emergency') continue;
      
      let score = 0;
      
      for (const keyword of config.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedQuery)) {
          score += 2;
        }
      }
      
      if (score > 0) {
        scores[intent] = score;
      }
    }

    const maxScore = Math.max(...Object.values(scores), 0);
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    
    let bestIntent = 'general';
    for (const [intent, score] of Object.entries(scores)) {
      if (score === maxScore) {
        bestIntent = intent;
        break;
      }
    }

    const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1.0) : 0;

    return { intent: bestIntent, confidence, scores };
  }
}

export const offlineIntentClassifier = new OfflineIntentClassifier();
export default offlineIntentClassifier;
