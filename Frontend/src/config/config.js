/**
 * BabyNest Configuration
 * 
 * This file contains all configuration values that were previously in .env
 * These values are embedded directly for offline APK deployment
 */

// Model Configuration - Llama.rn settings
export const MODEL_NAME = 'Qwen/Qwen3-0.6B-GGUF';
export const HF_TO_GGUF = 'Qwen/Qwen3-0.6B-GGUF';
export const GGUF_FILE = 'qwen3-0.6b-q4_0.gguf';

// Backend URL - Not used in offline mode but kept for reference
export const BASE_URL = 'http://localhost:5000';

// App Configuration
export const APP_MODE = 'offline'; // 'offline' or 'online'
export const DEBUG_MODE = __DEV__;

// LLM Configuration
export const LLM_CONFIG = {
  maxTokens: 256,
  temperature: 0.7,
  topP: 0.9,
  nCtx: 2048,
  nGpuLayers: 0, // Disabled for stability on mobile
  nThreads: 2,   // Reduced for mobile stability
};

// Cache Configuration
export const CACHE_CONFIG = {
  maxCacheSizeMb: 10,
  maxTrackingEntries: 10,
  maxCacheAgeDays: 30,
  maxMemoryCacheSize: 50,
  responseCacheTTL: 30 * 60 * 1000, // 30 minutes
  maxResponseCacheSize: 100,
};

// Vector Store Configuration
export const VECTOR_STORE_CONFIG = {
  maxElements: 10000,
  dimension: 384,
  efConstruction: 200,
  M: 16,
};

// Database Configuration
export const DATABASE_CONFIG = {
  name: 'babynest.db',
  version: '1.0',
  description: 'BabyNest Local Database',
};

// Default User ID (for single-user offline mode)
export const DEFAULT_USER_ID = 'default';

// Feature Flags
export const FEATURES = {
  useOfflineMode: true,
  enableRAG: true,
  enableVectorSearch: true,
  enableMockEmbeddings: true,
  enableCaching: true,
};

// Export all as default object for convenience
export default {
  MODEL_NAME,
  HF_TO_GGUF,
  GGUF_FILE,
  BASE_URL,
  APP_MODE,
  DEBUG_MODE,
  LLM_CONFIG,
  CACHE_CONFIG,
  VECTOR_STORE_CONFIG,
  DATABASE_CONFIG,
  DEFAULT_USER_ID,
  FEATURES,
};
