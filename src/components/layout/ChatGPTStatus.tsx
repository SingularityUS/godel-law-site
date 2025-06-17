
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

type ConnectionStatus = 'untested' | 'testing' | 'connected' | 'error';

interface TokenUsage {
  totalTokens: number;
  lastUpdated: string;
}

const ChatGPTStatus: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('untested');
  const [currentModel, setCurrentModel] = useState<string>('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ totalTokens: 0, lastUpdated: '' });
  const [lastTestTime, setLastTestTime] = useState<string>('');

  // Load token usage from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedUsage = localStorage.getItem(`chatgpt_tokens_${user.id}`);
      if (savedUsage) {
        setTokenUsage(JSON.parse(savedUsage));
      }
    }
  }, [user]);

  // Test connection on component mount
  useEffect(() => {
    if (user) {
      testConnection();
    }
  }, [user]);

  const testConnection = async () => {
    setStatus('testing');
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          prompt: 'Hi',
          model: 'gpt-4o-mini',
          maxTokens: 10
        }
      });

      if (error) throw error;

      if (data.response) {
        setStatus('connected');
        setCurrentModel(data.model || 'gpt-4o-mini');
        setLastTestTime(new Date().toLocaleTimeString());
        
        // Update token usage
        if (data.usage && data.usage.total_tokens) {
          updateTokenUsage(data.usage.total_tokens);
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('ChatGPT connection test failed:', error);
      setStatus('error');
    }
  };

  const updateTokenUsage = (newTokens: number) => {
    if (!user) return;
    
    const updatedUsage = {
      totalTokens: tokenUsage.totalTokens + newTokens,
      lastUpdated: new Date().toISOString()
    };
    
    setTokenUsage(updatedUsage);
    localStorage.setItem(`chatgpt_tokens_${user.id}`, JSON.stringify(updatedUsage));
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
      case 'connected': return `Connected (${currentModel})`;
      case 'testing': return 'Testing...';
      case 'error': return 'Connection Failed';
      default: return 'Not Tested';
    }
  };

  const formatTokenCount = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>

      {/* Token Usage */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Zap size={14} />
        <span>{formatTokenCount(tokenUsage.totalTokens)} tokens</span>
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
