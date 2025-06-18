
/**
 * RedlineSidebar Component
 * 
 * Purpose: Displays suggestions sidebar with list of pending suggestions
 */

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RedlineSuggestion } from "@/types/redlining";

interface RedlineSidebarProps {
  suggestions: RedlineSuggestion[];
  selectedSuggestionId: string | null;
  onSuggestionClick: (suggestionId: string) => void;
}

const RedlineSidebar: React.FC<RedlineSidebarProps> = ({
  suggestions,
  selectedSuggestionId,
  onSuggestionClick
}) => {
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return (
    <div className="w-80 border-l bg-gray-50 flex flex-col flex-shrink-0">
      <div className="p-4 border-b bg-white flex-shrink-0">
        <h3 className="font-semibold text-lg text-gray-800">
          Suggestions ({pendingSuggestions.length})
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Click on suggestions to review and accept/reject changes
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {pendingSuggestions.length > 0 ? (
            pendingSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-150 ${
                  selectedSuggestionId === suggestion.id
                    ? 'bg-blue-100 border-blue-400 shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => onSuggestionClick(suggestion.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                      suggestion.severity === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {suggestion.type} - {suggestion.severity}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 font-medium">
                    {suggestion.explanation}
                  </p>
                  
                  <div className="text-xs space-y-1">
                    <div className="p-2 bg-red-50 rounded border-l-2 border-red-300">
                      <span className="font-medium text-red-700">From:</span> "{suggestion.originalText}"
                    </div>
                    <div className="p-2 bg-green-50 rounded border-l-2 border-green-300">
                      <span className="font-medium text-green-700">To:</span> "{suggestion.suggestedText}"
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No pending suggestions</p>
              <p className="text-xs mt-1">All suggestions have been reviewed</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RedlineSidebar;
