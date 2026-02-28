/**
 * Offline Services Index
 * Central export for all offline-first services
 */

export { offlineDatabaseService } from './OfflineDatabaseService';
export { offlineContextCache } from './OfflineContextCache';
export { offlineIntentClassifier } from './OfflineIntentClassifier';
export { offlinePromptBuilder } from './OfflinePromptBuilder';
export { offlineAgentService } from './OfflineAgentService';
export { offlineAPIService } from './OfflineAPIService';
export { 
  PREGNANCY_GUIDELINES, 
  searchGuidelines, 
  getGuidelinesForWeek,
  formatGuidelinesForPrompt 
} from './GuidelinesData';

// Re-export default agent service
export { default } from './OfflineAgentService';
