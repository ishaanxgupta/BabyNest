import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineAgentService, offlineContextCache, offlineDatabaseService } from '../services/offline';
import { DEFAULT_USER_ID, FEATURES } from '../config/config';
import { searchGuidelines, getGuidelinesForWeek } from '../services/offline/GuidelinesData';

/**
 * AgentContext - Manages AI agent context and user data
 * 
 * FULLY OFFLINE VERSION - No backend API calls
 * All data is stored locally on the device using SQLite
 * 
 * Usage:
 * 1. Call initializeContext() when user is ready (after login/profile setup)
 * 2. Use isContextReady() to check if context is available
 * 3. Context will be automatically initialized on first chat interaction
 */

const AgentContext = createContext();

export const useAgentContext = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
};

export const AgentProvider = ({ children }) => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchContext = async (user_id = DEFAULT_USER_ID, force = false) => {
    if (isInitialized && !force) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await offlineAgentService.initialize();
      const userContext = await offlineContextCache.getContext(user_id);
      
      if (userContext) {
        setContext(userContext);
        setLastUpdated(new Date());
        setIsInitialized(true);
      } else {
        setError('Profile not set up. Please complete your profile first.');
        setIsInitialized(false);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching offline context:', err);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshContext = async (user_id = DEFAULT_USER_ID) => {
    try {
      await offlineContextCache.invalidateCache(user_id);
      await fetchContext(user_id, true);
    } catch (err) {
      console.warn('Context refresh failed:', err.message);
      setError(err.message);
    }
  };

  const getTaskRecommendations = async (week = null, user_id = DEFAULT_USER_ID) => {
    try {
      const userContext = await offlineContextCache.getContext(user_id);
      const currentWeek = week || userContext?.current_week || 1;
      
      const tasks = await offlineDatabaseService.getTasks(currentWeek);
      const guidelines = getGuidelinesForWeek(currentWeek, 5);
      
      const pendingTasks = tasks.filter(t => t.task_status === 'pending');
      const highPriorityTasks = pendingTasks.filter(t => t.task_priority === 'high');

      return {
        recommendations: `Based on your current week (${currentWeek}), here are your recommendations:\n\n` +
          pendingTasks.slice(0, 3).map(t => `• ${t.title}: ${t.content}`).join('\n') +
          (guidelines.length > 0 ? `\n\nGuidelines for this week:\n` + 
            guidelines.slice(0, 2).map(g => `• ${g.title}`).join('\n') : ''),
        current_week: currentWeek,
        tasks: pendingTasks,
        guidelines: guidelines,
        context_used: {
          weight: userContext?.tracking_data?.weight || [],
          symptoms: userContext?.tracking_data?.symptoms || [],
          medicine: userContext?.tracking_data?.medicine || []
        }
      };
    } catch (err) {
      console.error('Error getting task recommendations:', err);
      throw err;
    }
  };

  const getCacheStatus = async () => {
    try {
      const stats = offlineContextCache.getCacheStats();
      return {
        cache_system: 'offline_sqlite',
        cache_status: 'active',
        auto_update: true,
        ...stats,
        note: 'Running in fully offline mode - all data stored locally'
      };
    } catch (err) {
      console.error('Error getting cache status:', err);
      throw err;
    }
  };

  const initializeContext = async (user_id = DEFAULT_USER_ID) => {
    await fetchContext(user_id, true);
  };

  const isContextReady = () => {
    return isInitialized && context !== null;
  };

  const runAgent = async (query, user_id = DEFAULT_USER_ID) => {
    try {
      return await offlineAgentService.run(query, user_id);
    } catch (err) {
      console.error('Error running offline agent:', err);
      throw err;
    }
  };

  const updateCacheForDataType = async (dataType, operation = 'update', user_id = DEFAULT_USER_ID) => {
    try {
      await offlineContextCache.updateCache(user_id, dataType, operation);
      await fetchContext(user_id, true);
    } catch (err) {
      console.error('Error updating cache:', err);
    }
  };

  const value = {
    context,
    loading,
    error,
    lastUpdated,
    isInitialized,
    fetchContext,
    refreshContext,
    initializeContext,
    isContextReady,
    getTaskRecommendations,
    getCacheStatus,
    runAgent,
    updateCacheForDataType,
    isOfflineMode: true,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}; 