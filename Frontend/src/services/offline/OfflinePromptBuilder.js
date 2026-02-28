/**
 * OfflinePromptBuilder - Builds prompts for LLM with user context
 * Port of Python prompt.py to JavaScript
 */

class OfflinePromptBuilder {
  constructor() {
    this.systemPrompt = this.getDefaultSystemPrompt();
  }

  getDefaultSystemPrompt() {
    return `You are BabyNest, an inclusive, empathetic, and knowledgeable pregnancy companion. You provide personalized, evidence-based guidance while being culturally sensitive and supportive.

Key capabilities:
- Schedule and manage appointments
- Track health metrics (weight, mood, symptoms, sleep, blood pressure)
- Provide pregnancy-related guidance based on the current week
- Answer questions about health and wellness during pregnancy

Guidelines:
- Always be supportive and encouraging
- If asked about medical advice, recommend consulting healthcare providers
- Keep responses concise and helpful
- Use a warm, caring tone while being informative
- When scheduling appointments, ask for necessary details
- Consider the user's current pregnancy week when providing advice`;
  }

  buildPrompt(query, retrievedContext = '', userContext = null) {
    const userContextSection = this.formatUserContext(userContext);
    const trackingDataSection = this.formatTrackingData(userContext?.tracking_data);

    return `${this.systemPrompt}

${userContextSection}

${trackingDataSection ? `Recent Health Tracking:\n${trackingDataSection}\n` : ''}

User Query: ${query}

${retrievedContext ? `Relevant Pregnancy Guidelines:\n${retrievedContext}\n` : ''}

Instructions:
1. Consider the user's current pregnancy week and location when providing advice
2. Be inclusive, supportive, and culturally sensitive
3. Provide structured, actionable responses
4. If the user's tracking data shows concerning patterns, address them gently
5. Always prioritize safety and recommend consulting healthcare providers when appropriate
6. Use a warm, caring tone while being informative
7. Keep responses concise - aim for 2-4 sentences for simple queries

Please provide a helpful, personalized response:`;
  }

  formatUserContext(userContext) {
    if (!userContext) {
      return 'User Profile: Not available (please complete profile setup)';
    }

    return `User Profile & Current Status:
- Pregnancy Week: ${userContext.current_week || 'Unknown'}
- Location: ${userContext.location || 'Unknown'}
- Age: ${userContext.age || 'Unknown'}
- Current Weight: ${userContext.weight || 'Unknown'} kg
- Due Date: ${userContext.due_date || 'Unknown'}`;
  }

  formatTrackingData(trackingData) {
    if (!trackingData) {
      return '';
    }

    const formatted = [];

    // Weight data
    const weightData = trackingData.weight || [];
    if (weightData.length > 0) {
      formatted.push('Weight Tracking:');
      weightData.slice(0, 3).forEach(entry => {
        formatted.push(`  Week ${entry.week}: ${entry.weight} kg${entry.note ? ` - ${entry.note}` : ''}`);
      });
    }

    // Medicine data
    const medicineData = trackingData.medicine || [];
    if (medicineData.length > 0) {
      formatted.push('Medicine Tracking:');
      medicineData.slice(0, 3).forEach(entry => {
        const status = entry.taken ? '✓ Taken' : '✗ Missed';
        formatted.push(`  Week ${entry.week}: ${entry.name} (${entry.dose}) at ${entry.time} - ${status}`);
      });
    }

    // Symptoms data
    const symptomsData = trackingData.symptoms || [];
    if (symptomsData.length > 0) {
      formatted.push('Recent Symptoms:');
      symptomsData.slice(0, 3).forEach(entry => {
        formatted.push(`  Week ${entry.week}: ${entry.symptom}${entry.note ? ` - ${entry.note}` : ''}`);
      });
    }

    // Blood pressure data
    const bpData = trackingData.blood_pressure || [];
    if (bpData.length > 0) {
      formatted.push('Blood Pressure:');
      bpData.slice(0, 3).forEach(entry => {
        formatted.push(`  Week ${entry.week}: ${entry.systolic}/${entry.diastolic} at ${entry.time}${entry.note ? ` - ${entry.note}` : ''}`);
      });
    }

    // Mood data
    const moodData = trackingData.mood || [];
    if (moodData.length > 0) {
      formatted.push('Mood Tracking:');
      moodData.slice(0, 3).forEach(entry => {
        formatted.push(`  Week ${entry.week}: ${entry.mood}${entry.intensity ? ` (${entry.intensity})` : ''}${entry.note ? ` - ${entry.note}` : ''}`);
      });
    }

    // Sleep data
    const sleepData = trackingData.sleep || [];
    if (sleepData.length > 0) {
      formatted.push('Sleep Tracking:');
      sleepData.slice(0, 3).forEach(entry => {
        formatted.push(`  Week ${entry.week}: ${entry.duration} hours${entry.quality ? ` (${entry.quality})` : ''}`);
      });
    }

    return formatted.join('\n');
  }

  buildActionPrompt(intent, partialData, userContext = null) {
    const contextSection = this.formatUserContext(userContext);
    
    return `${this.systemPrompt}

${contextSection}

The user wants to: ${intent}
Partial data collected: ${JSON.stringify(partialData)}

Please help complete this action by asking for any missing information in a friendly way.`;
  }

  buildAnalyticsPrompt(metric, data, userContext = null) {
    const contextSection = this.formatUserContext(userContext);
    
    return `${this.systemPrompt}

${contextSection}

The user is asking about their ${metric} analytics.
Data available: ${JSON.stringify(data)}

Please provide a helpful summary and any relevant insights about their ${metric} trends.`;
  }

  buildEmergencyPrompt(query, userContext = null) {
    return `EMERGENCY PROTOCOL ACTIVATED

The user may be experiencing a medical emergency.

User's message: ${query}

Current pregnancy week: ${userContext?.current_week || 'Unknown'}

IMPORTANT: 
1. Stay calm and provide immediate, clear guidance
2. Recommend calling emergency services (911 or local emergency number)
3. Provide basic safety instructions while waiting for help
4. Emphasize the importance of professional medical care

Provide a calm, supportive response with emergency guidance:`;
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

  resetSystemPrompt() {
    this.systemPrompt = this.getDefaultSystemPrompt();
  }
}

export const offlinePromptBuilder = new OfflinePromptBuilder();
export default offlinePromptBuilder;
