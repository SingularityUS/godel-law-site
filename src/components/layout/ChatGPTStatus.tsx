
/**
 * ChatGPTStatus Component
 * 
 * Purpose: Displays real-time ChatGPT API connection status and token usage
 * Shows connection state, current model, and cumulative token usage tracking
 */

import React, { useState, useEffect } from "react";
import { Zap, AlertCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatGPTTokens } from "@/hooks/useChatGPTTokens";

type ConnectionStatus = 'untested' | 'testing' | 'connected' | 'error';

const ChatGPTStatus: React.FC = () => {
  const { user } = useAuth();
  const { tokenUsage, addTokens, getFormattedTokenCount } = useChatGPTTokens();
  const [status, setStatus] = useState<ConnectionStatus>('untested');
  const [currentModel, setCurrentModel] = useState<string>('');
  const [lastTestTime, setLastTestTime] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Test connection on component mount
  useEffect(() => {
    if (user) {
      testConnection();
    }
  }, [user]);

  const testConnection = async () => {
    setStatus('testing');
    setErrorMessage('');
    
    try {
      // Test with GPT-4.1 as the default model
      const testPrompt = 'Test connection. Please respond with "Connection successful."';
      const estimatedInputTokens = Math.ceil(testPrompt.length / 4);
      
      console.log(`ChatGPT connection test - estimated tokens: ${estimatedInputTokens}`);
      
      // Use GPT-4.1 as the primary model
      const selectedModel = 'gpt-4.1-2025-04-14';
      const maxTokens = 100;

      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          prompt: testPrompt,
          model: selectedModel,
          maxTokens: maxTokens,
          systemPrompt: 'You are a test assistant. Respond concisely to confirm the connection is working.'
        }
      });

      if (error) {
        console.error('ChatGPT connection test error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Connection failed');
        return;
      }

      if (data && data.response) {
        setStatus('connected');
        setCurrentModel(data.model || selectedModel);
        setLastTestTime(new Date().toLocaleTimeString());
        setErrorMessage('');
        
        // Update token usage using the centralized hook
        if (data.usage && data.usage.total_tokens) {
          console.log(`Connection test used ${data.usage.total_tokens} tokens`);
          addTokens(data.usage.total_tokens);
        }
        
        console.log(`ChatGPT connection test successful: ${data.response}`);
      } else {
        setStatus('error');
        setErrorMessage('No response received');
      }
    } catch (error: any) {
      console.error('ChatGPT connection test failed:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Connection test failed');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'testing': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <Wifi size={12} className="text-white" />;
      case 'testing': return <Clock size={12} className="text-white animate-spin" />;
      case 'error': return <WifiOff size={12} className="text-white" />;
      default: return <AlertCircle size={12} className="text-white" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return `Connected (GPT-4.1)`;
      case 'testing': return 'Testing...';
      case 'error': return errorMessage ? `Error: ${errorMessage}` : 'Connection Failed';
      default: return 'Not Tested';
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className="text-sm font-medium text-gray-700" title={errorMessage}>
          {getStatusText()}
        </span>
      </div>

      {/* Token Usage */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Zap size={14} />
        <span>{getFormattedTokenCount()} tokens</span>
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={testConnection}
        disabled={status === 'testing'}
        className="h-7 px-2 text-xs"
      >
        Test
      </Button>

      {lastTestTime && (
        <span className="text-xs text-gray-500">
          Last: {lastTestTime}
        </span>
      )}
    </div>
  );
};

export default ChatGPTStatus;
