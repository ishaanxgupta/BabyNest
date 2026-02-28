/**
 * OfflineAgentService - Main agent service for offline operation
 * Port of Python agent.py to JavaScript - orchestrates all offline services
 */

import { offlineDatabaseService } from './OfflineDatabaseService';
import { offlineContextCache } from './OfflineContextCache';
import { offlineIntentClassifier } from './OfflineIntentClassifier';
import { offlinePromptBuilder } from './OfflinePromptBuilder';
import { searchGuidelines, getGuidelinesForWeek, formatGuidelinesForPrompt } from './GuidelinesData';
import { generateResponse } from '../../model/model';
import { DEFAULT_USER_ID } from '../../config/config';

class OfflineAgentService {
  constructor() {
    this.isInitialized = false;
    this.currentUserId = DEFAULT_USER_ID;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await offlineDatabaseService.initialize();
      await offlineContextCache.initialize();
      this.isInitialized = true;
      console.log('✅ OfflineAgentService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OfflineAgentService:', error);
      throw error;
    }
  }

  async run(query, userId = DEFAULT_USER_ID) {
    await this.initialize();

    if (!query || typeof query !== 'string') {
      return 'Please ask a valid question.';
    }

    try {
      // Step 1: Get user context from cache
      const userContext = await this.getUserContext(userId);
      
      if (!userContext) {
        return 'Your profile is not set up yet. Please complete your profile in the Profile section to get personalized guidance.';
      }

      // Step 2: Classify intent
      const intentResult = offlineIntentClassifier.classifyWithConfidence(query);
      const intent = intentResult.intent;

      console.log(`🎯 Intent classified: ${intent} (confidence: ${intentResult.confidence.toFixed(2)})`);

      // Step 3: Handle specialized intents
      if (intent === 'emergency') {
        return this.handleEmergency(query, userContext);
      }

      // Step 4: Handle intent-specific actions
      const intentHandler = this.getIntentHandler(intent);
      if (intentHandler) {
        return await intentHandler(query, userContext);
      }

      // Step 5: For general queries, use RAG with guidelines
      return await this.handleGeneralQuery(query, userContext);

    } catch (error) {
      console.error('Error processing query:', error);
      return `I apologize, but I encountered an issue processing your request. Please try again. Error: ${error.message}`;
    }
  }

  getIntentHandler(intent) {
    const handlers = {
      appointments: this.handleAppointments.bind(this),
      weight: this.handleWeight.bind(this),
      symptoms: this.handleSymptoms.bind(this),
      blood_pressure: this.handleBloodPressure.bind(this),
      medicine: this.handleMedicine.bind(this),
      discharge: this.handleDischarge.bind(this),
      mood: this.handleMood.bind(this),
      sleep: this.handleSleep.bind(this),
      guidelines: this.handleGuidelines.bind(this),
      tasks: this.handleTasks.bind(this),
      analytics: this.handleAnalytics.bind(this),
      navigation: this.handleNavigation.bind(this),
    };

    return handlers[intent] || null;
  }

  async handleEmergency(query, userContext) {
    const prompt = offlinePromptBuilder.buildEmergencyPrompt(query, userContext);
    
    // Return immediate emergency response without waiting for LLM
    const immediateResponse = `🚨 **Emergency Alert**

If you're experiencing severe symptoms, please:

1. **Call Emergency Services** (911 or your local emergency number) immediately
2. **Contact your healthcare provider** right away
3. **Stay calm** and don't drive yourself - ask someone to take you or call an ambulance

Common pregnancy emergencies requiring immediate care:
- Heavy bleeding
- Severe abdominal pain
- Chest pain or difficulty breathing
- Severe headache with vision changes
- Significantly reduced or no fetal movement

You're currently at week ${userContext?.current_week || 'unknown'}. Your safety is the priority.

**Please seek professional medical help immediately.**`;

    return {
      message: immediateResponse,
      emergency: true,
      intent: 'emergency'
    };
  }

  async handleAppointments(query, userContext) {
    const appointments = await offlineDatabaseService.getAppointments();
    const currentWeek = userContext?.current_week || 1;
    
    const upcomingAppts = appointments.filter(a => 
      a.appointment_status === 'pending' && 
      new Date(a.appointment_date) >= new Date()
    );

    if (query.toLowerCase().includes('show') || query.toLowerCase().includes('list') || query.toLowerCase().includes('what')) {
      if (upcomingAppts.length === 0) {
        return {
          message: `You don't have any upcoming appointments scheduled. Would you like to create one? I can help you schedule an appointment with your healthcare provider.`,
          intent: 'appointments',
          action: 'list'
        };
      }

      const apptList = upcomingAppts.slice(0, 5).map(a => 
        `• **${a.title}** on ${a.appointment_date} at ${a.appointment_time}\n  📍 ${a.appointment_location}`
      ).join('\n\n');

      return {
        message: `📅 **Your Upcoming Appointments:**\n\n${apptList}\n\nWould you like to schedule a new appointment or modify an existing one?`,
        intent: 'appointments',
        action: 'list'
      };
    }

    // For creating/scheduling appointments
    return {
      message: `I can help you schedule an appointment! Please provide:\n\n1. **Type of appointment** (e.g., Checkup, Ultrasound, Blood Test)\n2. **Preferred date**\n3. **Preferred time**\n4. **Location/Hospital**\n\nYou can say something like: "Schedule a checkup for tomorrow at 10 AM at City Hospital"`,
      intent: 'appointments',
      action: 'create',
      requiresFollowUp: true,
      requiredFields: ['title', 'date', 'time', 'location']
    };
  }

  async handleWeight(query, userContext) {
    const weightLogs = await offlineDatabaseService.getWeightLogs(10);
    const currentWeek = userContext?.current_week || 1;

    // Check if user wants to view weight history
    if (query.toLowerCase().includes('show') || query.toLowerCase().includes('history') || query.toLowerCase().includes('trend')) {
      if (weightLogs.length === 0) {
        return {
          message: `You haven't logged any weight entries yet. At week ${currentWeek}, tracking your weight is important! Would you like to log your current weight?`,
          intent: 'weight',
          action: 'list'
        };
      }

      const weightHistory = weightLogs.slice(0, 5).map(w => 
        `• Week ${w.week_number}: **${w.weight} kg**${w.note ? ` - ${w.note}` : ''}`
      ).join('\n');

      const latestWeight = weightLogs[0]?.weight;
      const previousWeight = weightLogs[1]?.weight;
      const change = latestWeight && previousWeight ? (latestWeight - previousWeight).toFixed(1) : null;

      let trend = '';
      if (change) {
        const changeText = change > 0 ? `+${change}` : change;
        trend = `\n\n📊 **Recent change:** ${changeText} kg since last entry`;
      }

      return {
        message: `⚖️ **Your Weight History:**\n\n${weightHistory}${trend}\n\nHealthy weight gain during pregnancy varies by trimester. Consult your healthcare provider for personalized guidance.`,
        intent: 'weight',
        action: 'list'
      };
    }

    // Check if user is logging weight
    const weightMatch = query.match(/(\d+\.?\d*)\s*(kg|kilos?|pounds?|lbs)?/i);
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      
      // Save to database
      await offlineDatabaseService.logWeight({
        week_number: currentWeek,
        weight: weight,
        note: ''
      });

      // Update cache
      await offlineContextCache.updateCache(this.currentUserId, 'weight', 'create');

      return {
        message: `✅ **Weight logged successfully!**\n\n📊 Week ${currentWeek}: **${weight} kg**\n\nKeep tracking your weight weekly for the best insights. Is there anything else you'd like to log?`,
        intent: 'weight',
        action: 'log',
        success: true
      };
    }

    return {
      message: `I can help you track your weight! You're currently at week ${currentWeek}.\n\nJust tell me your weight, for example: "My weight is 65 kg" or simply "65 kg"\n\nWould you like to log your weight or see your weight history?`,
      intent: 'weight',
      requiresFollowUp: true,
      requiredFields: ['weight']
    };
  }

  async handleSymptoms(query, userContext) {
    const symptomLogs = await offlineDatabaseService.getSymptomLogs(10);
    const currentWeek = userContext?.current_week || 1;

    if (query.toLowerCase().includes('show') || query.toLowerCase().includes('history') || query.toLowerCase().includes('list')) {
      if (symptomLogs.length === 0) {
        return {
          message: `You haven't logged any symptoms yet. Tracking symptoms helps identify patterns and concerns. What symptoms are you experiencing?`,
          intent: 'symptoms',
          action: 'list'
        };
      }

      const symptomHistory = symptomLogs.slice(0, 5).map(s => 
        `• Week ${s.week_number}: **${s.symptom}**${s.note ? ` - ${s.note}` : ''}`
      ).join('\n');

      return {
        message: `📋 **Your Recent Symptoms:**\n\n${symptomHistory}\n\nIf any symptoms are severe or concerning, please consult your healthcare provider.`,
        intent: 'symptoms',
        action: 'list'
      };
    }

    // Common symptoms to detect
    const commonSymptoms = ['nausea', 'headache', 'fatigue', 'dizzy', 'cramp', 'back pain', 'swelling', 'heartburn', 'constipation', 'insomnia'];
    const detectedSymptom = commonSymptoms.find(s => query.toLowerCase().includes(s));

    if (detectedSymptom) {
      await offlineDatabaseService.logSymptom({
        week_number: currentWeek,
        symptom: detectedSymptom,
        note: query
      });

      await offlineContextCache.updateCache(this.currentUserId, 'symptoms', 'create');

      return {
        message: `✅ **Symptom logged:** ${detectedSymptom}\n\n📅 Week ${currentWeek}\n\nCommon during pregnancy, but if symptoms persist or worsen, please consult your healthcare provider. Is there anything else you'd like to track?`,
        intent: 'symptoms',
        action: 'log',
        success: true
      };
    }

    return {
      message: `I can help you track symptoms at week ${currentWeek}.\n\nCommon pregnancy symptoms include:\n• Nausea/Morning sickness\n• Fatigue\n• Headaches\n• Back pain\n• Heartburn\n\nWhat symptoms are you experiencing?`,
      intent: 'symptoms',
      requiresFollowUp: true,
      requiredFields: ['symptom']
    };
  }

  async handleBloodPressure(query, userContext) {
    const bpLogs = await offlineDatabaseService.getBloodPressureLogs(10);
    const currentWeek = userContext?.current_week || 1;

    // Check for BP reading in query (e.g., 120/80)
    const bpMatch = query.match(/(\d{2,3})\s*[\/\\]\s*(\d{2,3})/);
    
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      await offlineDatabaseService.logBloodPressure({
        week_number: currentWeek,
        systolic,
        diastolic,
        time,
        note: ''
      });

      await offlineContextCache.updateCache(this.currentUserId, 'blood_pressure', 'create');

      let assessment = '';
      if (systolic < 120 && diastolic < 80) {
        assessment = '✅ Normal blood pressure';
      } else if (systolic < 140 && diastolic < 90) {
        assessment = '⚠️ Slightly elevated - monitor closely';
      } else {
        assessment = '🚨 High blood pressure - please consult your healthcare provider';
      }

      return {
        message: `✅ **Blood Pressure Logged**\n\n📊 **${systolic}/${diastolic} mmHg** at ${time}\n📅 Week ${currentWeek}\n\n${assessment}\n\nRegular monitoring is important during pregnancy. Keep tracking!`,
        intent: 'blood_pressure',
        action: 'log',
        success: true
      };
    }

    if (query.toLowerCase().includes('show') || query.toLowerCase().includes('history')) {
      if (bpLogs.length === 0) {
        return {
          message: `You haven't logged any blood pressure readings yet. Regular BP monitoring is important during pregnancy. What's your current reading? (e.g., "120/80")`,
          intent: 'blood_pressure',
          action: 'list'
        };
      }

      const bpHistory = bpLogs.slice(0, 5).map(bp => 
        `• Week ${bp.week_number}: **${bp.systolic}/${bp.diastolic}** at ${bp.time}`
      ).join('\n');

      return {
        message: `💓 **Your Blood Pressure History:**\n\n${bpHistory}\n\nNormal pregnancy BP is typically below 140/90 mmHg. Consult your provider if readings are consistently high.`,
        intent: 'blood_pressure',
        action: 'list'
      };
    }

    return {
      message: `I can help you track your blood pressure at week ${currentWeek}.\n\nPlease provide your reading in the format: **systolic/diastolic**\nExample: "120/80" or "My BP is 118/75"`,
      intent: 'blood_pressure',
      requiresFollowUp: true,
      requiredFields: ['systolic', 'diastolic']
    };
  }

  async handleMedicine(query, userContext) {
    const medicineLogs = await offlineDatabaseService.getMedicineLogs(10);
    const currentWeek = userContext?.current_week || 1;

    if (query.toLowerCase().includes('show') || query.toLowerCase().includes('history') || query.toLowerCase().includes('list')) {
      if (medicineLogs.length === 0) {
        return {
          message: `You haven't logged any medications yet. Would you like to log a prescription or supplement you're taking?`,
          intent: 'medicine',
          action: 'list'
        };
      }

      const medHistory = medicineLogs.slice(0, 5).map(m => {
        const status = m.taken ? '✅' : '⏳';
        return `${status} **${m.name}** - ${m.dose} at ${m.time} (Week ${m.week_number})`;
      }).join('\n');

      return {
        message: `💊 **Your Medicine Log:**\n\n${medHistory}\n\nWould you like to log a new medication?`,
        intent: 'medicine',
        action: 'list'
      };
    }

    return {
      message: `I can help you log your medication at week ${currentWeek}.\n\nPlease provide:\n1. **Medicine name** (e.g., Folic Acid, Iron supplement)\n2. **Dose** (e.g., 500mg, 1 tablet)\n3. **Time** (e.g., Morning, 8 AM)\n\nExample: "Took Folic Acid 5mg this morning"`,
      intent: 'medicine',
      requiresFollowUp: true,
      requiredFields: ['name', 'dose', 'time']
    };
  }

  async handleDischarge(query, userContext) {
    const currentWeek = userContext?.current_week || 1;

    return {
      message: `I can help you log discharge information at week ${currentWeek}.\n\n**Note:** Some discharge is normal during pregnancy, but please consult your healthcare provider if you notice:\n• Heavy bleeding\n• Unusual color or odor\n• Accompanied by pain or fever\n\nWould you like to log your observation? Please describe the type, color, and any bleeding.`,
      intent: 'discharge',
      requiresFollowUp: true,
      requiredFields: ['type', 'color', 'bleeding']
    };
  }

  async handleMood(query, userContext) {
    const moodLogs = await offlineDatabaseService.getMoodLogs(10);
    const currentWeek = userContext?.current_week || 1;

    const moods = ['happy', 'sad', 'anxious', 'stressed', 'calm', 'excited', 'tired', 'emotional', 'worried', 'peaceful'];
    const detectedMood = moods.find(m => query.toLowerCase().includes(m));

    if (detectedMood) {
      await offlineDatabaseService.logMood({
        week_number: currentWeek,
        mood: detectedMood,
        intensity: '',
        note: query
      });

      await offlineContextCache.updateCache(this.currentUserId, 'mood', 'create');

      return {
        message: `✅ **Mood logged:** ${detectedMood}\n\n📅 Week ${currentWeek}\n\nEmotional changes are common during pregnancy due to hormonal shifts. Remember to:\n• Practice self-care\n• Talk to loved ones\n• Rest when needed\n\nYour feelings are valid! 💕`,
        intent: 'mood',
        action: 'log',
        success: true
      };
    }

    return {
      message: `How are you feeling today? 💭\n\nCommon moods to track:\n• Happy 😊\n• Anxious 😟\n• Calm 😌\n• Tired 😴\n• Emotional 🥺\n\nJust tell me how you're feeling!`,
      intent: 'mood',
      requiresFollowUp: true,
      requiredFields: ['mood']
    };
  }

  async handleSleep(query, userContext) {
    const sleepLogs = await offlineDatabaseService.getSleepLogs(10);
    const currentWeek = userContext?.current_week || 1;

    // Look for hours in query
    const hoursMatch = query.match(/(\d+\.?\d*)\s*(hours?|hrs?)/i);
    
    if (hoursMatch) {
      const duration = parseFloat(hoursMatch[1]);

      await offlineDatabaseService.logSleep({
        week_number: currentWeek,
        duration,
        bedtime: '',
        wake_time: '',
        quality: '',
        note: query
      });

      await offlineContextCache.updateCache(this.currentUserId, 'sleep', 'create');

      let advice = '';
      if (duration < 6) {
        advice = '😴 Try to get more rest - aim for 7-9 hours. Consider naps during the day.';
      } else if (duration >= 7 && duration <= 9) {
        advice = '✨ Great sleep duration! Keep maintaining this healthy pattern.';
      } else {
        advice = '💤 Good rest! Quality sleep is essential during pregnancy.';
      }

      return {
        message: `✅ **Sleep logged:** ${duration} hours\n\n📅 Week ${currentWeek}\n\n${advice}`,
        intent: 'sleep',
        action: 'log',
        success: true
      };
    }

    if (query.toLowerCase().includes('show') || query.toLowerCase().includes('history')) {
      if (sleepLogs.length === 0) {
        return {
          message: `You haven't logged any sleep entries yet. How many hours did you sleep last night?`,
          intent: 'sleep',
          action: 'list'
        };
      }

      const avgSleep = sleepLogs.reduce((sum, s) => sum + s.duration, 0) / sleepLogs.length;

      const sleepHistory = sleepLogs.slice(0, 5).map(s => 
        `• Week ${s.week_number}: **${s.duration} hours**${s.quality ? ` (${s.quality})` : ''}`
      ).join('\n');

      return {
        message: `😴 **Your Sleep History:**\n\n${sleepHistory}\n\n📊 **Average:** ${avgSleep.toFixed(1)} hours\n\nAim for 7-9 hours of sleep. Consider a pregnancy pillow for better comfort!`,
        intent: 'sleep',
        action: 'list'
      };
    }

    return {
      message: `I can help you track your sleep at week ${currentWeek}.\n\nHow many hours did you sleep? Just say something like "I slept 7 hours" or "7 hours of sleep"`,
      intent: 'sleep',
      requiresFollowUp: true,
      requiredFields: ['duration']
    };
  }

  async handleGuidelines(query, userContext) {
    const currentWeek = userContext?.current_week || 1;

    // Search for relevant guidelines
    const relevantGuidelines = searchGuidelines(query, currentWeek, 3);
    const weekGuidelines = getGuidelinesForWeek(currentWeek, 3);

    const allGuidelines = [...relevantGuidelines];
    weekGuidelines.forEach(g => {
      if (!allGuidelines.find(rg => rg.id === g.id)) {
        allGuidelines.push(g);
      }
    });

    const guidanceText = allGuidelines.slice(0, 4).map(g => 
      `📌 **${g.title}** (Weeks ${g.week_range})\n   ${g.content}`
    ).join('\n\n');

    return {
      message: `📚 **Pregnancy Guidelines for Week ${currentWeek}:**\n\n${guidanceText}\n\n*These guidelines are based on MoHFW, FOGSI, and WHO recommendations. Always consult your healthcare provider for personalized advice.*`,
      intent: 'guidelines',
      action: 'info'
    };
  }

  async handleTasks(query, userContext) {
    const currentWeek = userContext?.current_week || 1;
    const tasks = await offlineDatabaseService.getTasks(currentWeek);

    const pendingTasks = tasks.filter(t => t.task_status === 'pending');
    const highPriorityTasks = pendingTasks.filter(t => t.task_priority === 'high');

    if (pendingTasks.length === 0) {
      return {
        message: `✅ You're all caught up for week ${currentWeek}! No pending tasks.\n\nWould you like to see upcoming tasks for the next few weeks?`,
        intent: 'tasks',
        action: 'list'
      };
    }

    const taskList = pendingTasks.slice(0, 5).map(t => {
      const priority = t.task_priority === 'high' ? '🔴' : t.task_priority === 'medium' ? '🟡' : '🟢';
      return `${priority} **${t.title}**\n   ${t.content}`;
    }).join('\n\n');

    return {
      message: `📋 **Tasks for Week ${currentWeek}:**\n\n${taskList}\n\n${highPriorityTasks.length > 0 ? `⚠️ You have ${highPriorityTasks.length} high-priority task(s).` : ''}`,
      intent: 'tasks',
      action: 'list'
    };
  }

  async handleAnalytics(query, userContext) {
    const currentWeek = userContext?.current_week || 1;

    // Determine what analytics to show
    let analyticsType = 'overview';
    if (query.toLowerCase().includes('weight')) analyticsType = 'weight';
    else if (query.toLowerCase().includes('sleep')) analyticsType = 'sleep';
    else if (query.toLowerCase().includes('mood')) analyticsType = 'mood';
    else if (query.toLowerCase().includes('blood') || query.toLowerCase().includes('bp')) analyticsType = 'blood_pressure';

    const [weightLogs, sleepLogs, moodLogs, bpLogs] = await Promise.all([
      offlineDatabaseService.getWeightLogs(10),
      offlineDatabaseService.getSleepLogs(10),
      offlineDatabaseService.getMoodLogs(10),
      offlineDatabaseService.getBloodPressureLogs(10),
    ]);

    let analyticsMessage = `📊 **Health Analytics - Week ${currentWeek}**\n\n`;

    if (analyticsType === 'overview' || analyticsType === 'weight') {
      if (weightLogs.length > 0) {
        const latestWeight = weightLogs[0].weight;
        const avgWeight = weightLogs.reduce((sum, w) => sum + w.weight, 0) / weightLogs.length;
        analyticsMessage += `⚖️ **Weight:** Current ${latestWeight} kg | Avg ${avgWeight.toFixed(1)} kg\n`;
      }
    }

    if (analyticsType === 'overview' || analyticsType === 'sleep') {
      if (sleepLogs.length > 0) {
        const avgSleep = sleepLogs.reduce((sum, s) => sum + s.duration, 0) / sleepLogs.length;
        analyticsMessage += `😴 **Sleep:** Avg ${avgSleep.toFixed(1)} hours/night\n`;
      }
    }

    if (analyticsType === 'overview' || analyticsType === 'blood_pressure') {
      if (bpLogs.length > 0) {
        const latestBP = bpLogs[0];
        analyticsMessage += `💓 **Blood Pressure:** Latest ${latestBP.systolic}/${latestBP.diastolic} mmHg\n`;
      }
    }

    analyticsMessage += `\n*Keep tracking for better insights! Regular monitoring helps identify trends and concerns early.*`;

    return {
      message: analyticsMessage,
      intent: 'analytics',
      action: 'view'
    };
  }

  async handleNavigation(query, userContext) {
    const screens = {
      home: ['home', 'main', 'dashboard'],
      profile: ['profile', 'settings', 'account'],
      calendar: ['calendar', 'appointments', 'schedule'],
      weight: ['weight', 'weigh'],
      symptoms: ['symptoms'],
      chat: ['chat', 'assistant'],
    };

    for (const [screen, keywords] of Object.entries(screens)) {
      if (keywords.some(k => query.toLowerCase().includes(k))) {
        return {
          message: `Taking you to the ${screen.charAt(0).toUpperCase() + screen.slice(1)} screen...`,
          intent: 'navigation',
          action: 'navigate',
          screen: screen.charAt(0).toUpperCase() + screen.slice(1)
        };
      }
    }

    return {
      message: `Where would you like to go? Available screens:\n• Home\n• Profile\n• Calendar\n• Weight\n• Symptoms\n• Chat`,
      intent: 'navigation'
    };
  }

  async handleGeneralQuery(query, userContext) {
    const currentWeek = userContext?.current_week || 1;

    // Get relevant guidelines for context
    const relevantGuidelines = searchGuidelines(query, currentWeek, 3);
    const guidelinesContext = formatGuidelinesForPrompt(relevantGuidelines);

    // Build prompt with context
    const prompt = offlinePromptBuilder.buildPrompt(query, guidelinesContext, userContext);

    // Generate response using local LLM
    try {
      const conversation = [
        { role: 'system', content: offlinePromptBuilder.getDefaultSystemPrompt() },
        { role: 'user', content: prompt }
      ];

      const response = await generateResponse(conversation);

      if (response) {
        return {
          message: response,
          intent: 'general',
          action: null
        };
      }
    } catch (error) {
      console.error('LLM generation error:', error);
    }

    // Fallback response
    return {
      message: `I understand you're asking about pregnancy at week ${currentWeek}. ${guidelinesContext ? 'Here\'s some relevant information:\n\n' + guidelinesContext : 'How can I help you? I can assist with appointments, tracking health metrics, or providing pregnancy guidance.'}`,
      intent: 'general',
      action: null
    };
  }

  async getUserContext(userId = DEFAULT_USER_ID) {
    return await offlineContextCache.getContext(userId);
  }

  async updateCache(userId = DEFAULT_USER_ID, dataType = null, operation = 'update') {
    await offlineContextCache.updateCache(userId, dataType, operation);
  }

  async invalidateCache(userId = null) {
    await offlineContextCache.invalidateCache(userId);
  }

  getCacheStats() {
    return offlineContextCache.getCacheStats();
  }
}

// Export singleton instance
export const offlineAgentService = new OfflineAgentService();
export default offlineAgentService;
