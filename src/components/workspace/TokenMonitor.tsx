
import React from "react";
import { AlertTriangle, Info, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  calculateTokenUsage, 
  formatTokenCount, 
  getContextUtilization, 
  getOptimizationSuggestions,
  MODEL_SPECS,
  type TokenEstimate 
} from "@/utils/tokenCalculation";

export type UploadedFile = File & { preview?: string; extractedText?: string };

interface TokenMonitorProps {
  prompt: string;
  documents: UploadedFile[];
  model?: string;
  className?: string;
}

const TokenMonitor: React.FC<TokenMonitorProps> = ({
  prompt,
  documents,
  model = 'gpt-4.1-2025-04-14',
  className = ""
}) => {
  const estimate = calculateTokenUsage(
    prompt,
    documents,
    "You are a helpful AI assistant that helps users analyze and work with their documents.",
    model
  );

  const utilization = getContextUtilization(estimate.totalTokens, model);
  const suggestions = getOptimizationSuggestions(estimate, model);
  const modelSpec = MODEL_SPECS[model];

  const getUtilizationColor = () => {
    if (utilization > 90) return "bg-red-500";
    if (utilization > 75) return "bg-yellow-500";
    if (utilization > 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const getUtilizationVariant = () => {
    if (utilization > 90) return "destructive";
    if (utilization > 75) return "default";
    return "default";
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Token Usage Overview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">Token Usage</h4>
          <span className="text-xs text-gray-500">{modelSpec.name}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Context Usage</span>
            <span className="font-medium">
              {formatTokenCount(estimate.totalTokens)} / {formatTokenCount(modelSpec.maxContextTokens)}
            </span>
          </div>
          
          <Progress 
            value={utilization} 
            className="h-2"
          />
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Prompt:</span>
              <div className="font-medium">{formatTokenCount(estimate.promptTokens)}</div>
            </div>
            <div>
              <span className="text-gray-500">Documents:</span>
              <div className="font-medium">{formatTokenCount(estimate.documentTokens)}</div>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <div className="font-medium text-green-600">{formatTokenCount(estimate.remainingTokens)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Estimation */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={14} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Estimated Cost</span>
        </div>
        <div className="text-lg font-bold text-blue-800">
          ${estimate.estimatedCost.toFixed(4)}
        </div>
        <div className="text-xs text-blue-600">
          Based on {formatTokenCount(estimate.totalTokens)} tokens
        </div>
      </div>

      {/* Document Breakdown */}
      {documents.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Document Breakdown</h5>
          <div className="space-y-1">
            {documents.map((doc, index) => {
              const docTokens = doc.extractedText ? Math.ceil(doc.extractedText.length / 4) : 0;
              return (
                <div key={index} className="flex justify-between text-xs">
                  <span className="truncate flex-1 mr-2" title={doc.name}>
                    {doc.name}
                  </span>
                  <span className="font-medium text-gray-600">
                    {formatTokenCount(docTokens)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings and Suggestions */}
      {!estimate.isWithinLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Context window exceeded! Total tokens ({formatTokenCount(estimate.totalTokens)}) 
            exceed the limit ({formatTokenCount(modelSpec.maxContextTokens)}). 
            Please reduce document content or prompt length.
          </AlertDescription>
        </Alert>
      )}

      {suggestions.length > 0 && estimate.isWithinLimit && (
        <Alert variant={getUtilizationVariant()}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="text-xs">• {suggestion}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TokenMonitor;
