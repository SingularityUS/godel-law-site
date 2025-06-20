
/**
 * Redline Suggestion Tooltip Component
 * 
 * Purpose: Shows suggestion details and actions in a tooltip overlay with citation verification support
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit3, ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { RedlineSuggestion } from "@/types/redlining";

interface RedlineSuggestionTooltipProps {
  suggestion: RedlineSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onModify: () => void;
  position: { x: number; y: number };
}

const RedlineSuggestionTooltip: React.FC<RedlineSuggestionTooltipProps> = ({
  suggestion,
  onAccept,
  onReject,
  onModify,
  position
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'bg-blue-100 text-blue-800';
      case 'style': return 'bg-purple-100 text-purple-800';
      case 'legal': return 'bg-orange-100 text-orange-800';
      case 'clarity': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'partially_verified':
        return <AlertTriangle size={14} className="text-yellow-600" />;
      case 'not_found':
      case 'error':
        return <XCircle size={14} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getVerificationStatusColor = (status?: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partially_verified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_found':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewSource = () => {
    if (suggestion.sourceUrl) {
      window.open(suggestion.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isLegalCitation = suggestion.type === 'legal' && suggestion.verificationStatus;
  const hasVerifiableSource = suggestion.sourceUrl || (suggestion.alternativeUrls && suggestion.alternativeUrls.length > 0);

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge className={getTypeColor(suggestion.type)}>
          {suggestion.type}
        </Badge>
        <Badge variant="outline" className={getSeverityColor(suggestion.severity)}>
          {suggestion.severity}
        </Badge>
        {isLegalCitation && (
          <div className="flex items-center gap-1">
            {getVerificationStatusIcon(suggestion.verificationStatus)}
            <Badge variant="outline" className={getVerificationStatusColor(suggestion.verificationStatus)}>
              {suggestion.verificationStatus?.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Original:</div>
        <div className="text-sm bg-red-50 p-2 rounded text-red-700 line-through">
          {suggestion.originalText}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Suggested:</div>
        <div className="text-sm bg-green-50 p-2 rounded text-green-700">
          {suggestion.suggestedText}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">Explanation:</div>
        <div className="text-xs text-gray-800">{suggestion.explanation}</div>
      </div>

      {/* Citation verification details */}
      {isLegalCitation && (
        <div className="mb-3 border-t pt-2">
          <div className="text-xs text-gray-600 mb-1">Citation Verification:</div>
          
          {suggestion.verificationConfidence !== undefined && (
            <div className="text-xs text-gray-700 mb-1">
              Confidence: {(suggestion.verificationConfidence * 100).toFixed(0)}%
            </div>
          )}
          
          {suggestion.verificationDetails && (
            <div className="text-xs text-gray-600 space-y-1">
              {suggestion.verificationDetails.foundOnOfficialSite && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-green-500" />
                  <span>Found on official site</span>
                </div>
              )}
              {suggestion.verificationDetails.citationFormatCorrect && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-green-500" />
                  <span>Format correct</span>
                </div>
              )}
            </div>
          )}
          
          {suggestion.lastVerified && (
            <div className="text-xs text-gray-500 mt-1">
              Verified: {new Date(suggestion.lastVerified).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
          <Check size={12} className="mr-1" />
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={onReject}>
          <X size={12} className="mr-1" />
          Reject
        </Button>
        <Button size="sm" variant="outline" onClick={onModify}>
          <Edit3 size={12} className="mr-1" />
          Edit
        </Button>
        
        {/* View Source button for legal citations with verified sources */}
        {isLegalCitation && hasVerifiableSource && (
          <Button size="sm" variant="outline" onClick={handleViewSource} className="text-blue-600 hover:text-blue-700">
            <ExternalLink size={12} className="mr-1" />
            Source
          </Button>
        )}
      </div>

      {/* Alternative sources for citations */}
      {isLegalCitation && suggestion.alternativeUrls && suggestion.alternativeUrls.length > 0 && !suggestion.sourceUrl && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs text-gray-600 mb-1">Alternative Sources:</div>
          <div className="space-y-1">
            {suggestion.alternativeUrls.slice(0, 2).map((url, index) => (
              <button
                key={index}
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                className="text-xs text-blue-600 hover:text-blue-700 underline block truncate max-w-full"
              >
                {url.length > 40 ? `${url.substring(0, 40)}...` : url}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Tooltip arrow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
      </div>
    </div>
  );
};

export default RedlineSuggestionTooltip;
