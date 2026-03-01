import React, { createContext, useContext, useState } from 'react';
import * as db from '../services/database';

/**
 * AgentContext - Manages AI agent context and user data
 * 
 * FULLY OFFLINE: All data fetched from local AsyncStorage via database.js
 * No backend API calls are made.
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

  const fetchContext = async (user_id = "default", force = false) => {
    if (isInitialized && !force) return;

    setLoading(true);
    setError(null);
    
    try {
      const profile = await db.getLocalProfile();
      const appointments = await db.getAppointments();
      const tasks = await db.getTasks();
      const weightHistory = await db.getWeightHistory();
      const symptomsHistory = await db.getSymptomsHistory();
      const medicineHistory = await db.getMedicineHistory();
      const bpHistory = await db.getBloodPressureHistory();

      const data = {
        user_id,
        profile: profile || {},
        name: profile?.name || 'Guest',
        due_date: profile?.due_date || null,
        current_week: profile?.current_week || 12,
        appointments: appointments || [],
        tasks: tasks || [],
        weight_history: weightHistory || [],
        symptoms_history: symptomsHistory || [],
        medicine_history: medicineHistory || [],
        blood_pressure_history: bpHistory || [],
      };

      setContext(data);
      setLastUpdated(new Date());
      setIsInitialized(true);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching agent context:', err);
      setIsInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshContext = async (user_id = "default") => {
    try {
      await fetchContext(user_id, true);
    } catch (err) {
      setError(err.message);
      console.error('Error refreshing context:', err);
    }
  };

  const getTaskRecommendations = async (week = null, user_id = "default") => {
    try {
      const tasks = await db.getTasks();
      if (week) {
        return tasks.filter(t => t.starting_week <= week && t.ending_week >= week);
      }
      return tasks.filter(t => t.task_status !== 'completed');
    } catch (err) {
      console.error('Error getting task recommendations:', err);
      throw err;
    }
  };

  const getCacheStatus = async () => {
    return {
      initialized: isInitialized,
      lastUpdated: lastUpdated?.toISOString() || null,
      hasProfile: context?.profile !== null,
    };
  };

  const initializeContext = async (user_id = "default") => {
    await fetchContext(user_id, true);
  };

  const isContextReady = () => {
    return isInitialized && context !== null;
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
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}; 