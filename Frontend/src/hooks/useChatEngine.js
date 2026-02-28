import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateResponse } from '../model/model';
import { ragService } from '../services/RAGService';
import { conversationContext } from '../services/ConversationContext';
import { offlineAgentService } from '../services/offline';
import { DEFAULT_USER_ID, FEATURES } from '../config/config';

export const useChatEngine = (isInitialized, context, refreshContext) => {
  const [conversation, setConversation] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const cancellationRef = useRef(0);

  // Load chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        const storedChats = await AsyncStorage.getItem('chat_history');
        if (storedChats) {
          const parsedChats = JSON.parse(storedChats);
          if (Array.isArray(parsedChats)) {
            setConversation(parsedChats);
            parsedChats.forEach(msg => {
              if (msg?.role && msg?.content) {
                conversationContext.addMessage(msg.role, msg.content);
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to load chats", error);
      }
    };
    loadChats();
  }, []);

  const saveChats = useCallback(async (newConversation) => {
    try {
      await AsyncStorage.setItem('chat_history', JSON.stringify(newConversation));
    } catch (error) {
      console.error("Failed to save chats", error);
    }
  }, []);

  const generateID = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const clearConversation = useCallback(async () => {
    cancellationRef.current += 1;
    setConversation([]);
    conversationContext.clearConversationHistory();
    await saveChats([]);
  }, [saveChats]);

  const sendMessage = useCallback(async (text, useRAGMode, initializeContext) => {
    if (!text || !text.trim()) return;

    if (!isInitialized) {
      try {
        await initializeContext();
      } catch (error) {
        console.warn('Failed to initialize context:', error);
      }
    }

    const formatTime = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const userMessage = { 
      id: generateID(), 
      role: "user", 
      content: text,
      timestamp: formatTime()
    };
    const cancellationId = cancellationRef.current;
    
    conversationContext.addMessage('user', text);
    setIsGenerating(true);

    setConversation(prev => {
      const newHistory = [...prev, userMessage];
      saveChats(newHistory);
      return newHistory;
    });

    try {
      let response = null;
      let result = null;

      const updatedConversationForModel = [...conversation, userMessage];
      conversationContext.setUserContext(context);

      if (useRAGMode) {
        if (conversationContext.hasPendingFollowUp()) {
          if (__DEV__) console.log('🤖 Processing follow-up response with RAG...');
          result = await conversationContext.processFollowUpResponse(text, ragService);
        } else {
          if (__DEV__) console.log('🤖 Processing new query with RAG...');
          result = await ragService.processQuery(text, context);
        }
      } else {
        if (__DEV__) console.log('📞 Processing with local model...');
        const startTime = Date.now();
        response = await generateResponse(updatedConversationForModel);
        if (__DEV__) {
            const endTime = Date.now();
            console.log(`⏱️ Model Response Latency: ${endTime - startTime}ms`);
        }
        
        result = { message: response, intent: 'general_chat', action: null };
      }

      // Handle RAG Result
      if (result && typeof result === 'object') {
        response = result.message;

        if (result.requiresFollowUp && result.intent && result.partialData && result.missingFields) {
          conversationContext.setPendingFollowUp(
            result.intent,
            result.partialData,
            result.missingFields
          );
        } else {
          conversationContext.clearPendingFollowUp();
        }
      } else {
        // Use offline agent service instead of backend API
        if (__DEV__) console.log('🔌 Using offline agent service...');
        try {
          const agentResult = await offlineAgentService.run(text, DEFAULT_USER_ID);
          
          if (agentResult && typeof agentResult === 'object') {
            response = agentResult.message;
            result = agentResult;
          } else if (typeof agentResult === 'string') {
            response = agentResult;
            result = { message: agentResult, intent: 'general', action: null };
          }
        } catch (agentError) {
          console.warn('Offline agent failed, using local model:', agentError.message);
          response = await generateResponse(updatedConversationForModel);
          result = { message: response, intent: 'general_chat', action: null };
        }
      }

      // Cancellation Guard
      if (cancellationId !== cancellationRef.current) {
        if (__DEV__) console.log('🚫 AI response blocked: Conversation was cleared.');
        return;
      }

      if (response) {
        const botMessage = { 
          id: generateID(), 
          role: "assistant", 
          content: response,
          timestamp: formatTime()
        };
        setConversation(prev => {
          const newHistory = [...prev, botMessage];
          saveChats(newHistory);
          return newHistory;
        });
        conversationContext.addMessage('assistant', response);
      }

      return result;

    } catch (error) {
      Alert.alert("Error", "Failed to generate response: " + error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }, [isInitialized, context, saveChats, conversation]);

  return {
    conversation,
    isGenerating,
    sendMessage,
    clearConversation
  };
};
