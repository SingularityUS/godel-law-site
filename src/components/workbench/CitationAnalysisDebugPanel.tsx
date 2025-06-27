import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Zap, AlertTriangle } from 'lucide-react';

interface DebugEvent {
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  data?: any;
}

export const CitationAnalysisDebugPanel: React.FC = () => {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const handleDebugEvent = (event: CustomEvent) => {
      const newEvent: DebugEvent = {
        timestamp: new Date().toISOString(),
        type: event.type as any,
        source: event.detail.source || 'unknown',
        message: event.detail.message || '',
        data: event.detail.data
      };
      
      setEvents(prev => {
        const updated = [...prev, newEvent];
        // Keep only last 100 events
        return updated.slice(-100);
      });
    };

    // Listen for debug events
    window.addEventListener('debug:citation', handleDebugEvent as EventListener);
    window.addEventListener('debug:anchor', handleDebugEvent as EventListener);
    window.addEventListener('debug:drop', handleDebugEvent as EventListener);

    return () => {
      window.removeEventListener('debug:citation', handleDebugEvent as EventListener);
      window.removeEventListener('debug:anchor', handleDebugEvent as EventListener);
      window.removeEventListener('debug:drop', handleDebugEvent as EventListener);
    };
  }, []);

  const clearEvents = () => {
    setEvents([]);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <Zap className="w-4 h-4 text-green-500" />;
      default: return <Bug className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Bug className="w-4 h-4 mr-2" />
          Citation Debug ({events.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-mono">Citation Analysis Debug</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {events.length} events
              </Badge>
              <Button onClick={clearEvents} variant="ghost" size="sm">
                Clear
              </Button>
              <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 max-h-80 overflow-y-auto font-mono text-xs">
          {events.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No debug events yet. Try dropping a document or triggering citation analysis.
            </div>
          ) : (
            <div className="space-y-1">
              {events.map((event, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger className={`w-full text-left p-2 rounded border ${getEventColor(event.type)} hover:bg-opacity-75`}>
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {event.source}
                      </Badge>
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </div>
                    <div className="text-xs mt-1 truncate">
                      {event.message}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 p-2 bg-gray-50 rounded text-xs">
                    <div className="whitespace-pre-wrap">{event.message}</div>
                    {event.data && (
                      <div className="mt-2 p-2 bg-gray-100 rounded">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
