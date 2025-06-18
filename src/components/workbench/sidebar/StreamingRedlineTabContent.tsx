
/**
 * StreamingRedlineTabContent Component
 * 
 * Purpose: Enhanced redline tab that displays streaming results as they arrive
 * Enhanced to handle immediate display during pipeline execution
 */

import React from "react";
import { RedlineDocument } from "@/types/redlining";
import EmbeddedRedlineViewer from "@/components/redlining/EmbeddedRedlineViewer";
import { Progress } from "@/components/ui/progress";

interface StreamingRedlineTabContentProps {
  isGeneratingRedline: boolean;
  redlineDocument: RedlineDocument | null;
  isLegalPipeline: boolean;
  output: any;
  streamingProgress?: {
    completed: number;
    total: number;
    hasPartialResults: boolean;
  };
  onSaveRedline: (document: RedlineDocument) => void;
  onExportRedline: (document: RedlineDocument, format: string) => void;
  isPipelineExecuting?: boolean;
  isExecuting?: boolean;
}

const StreamingRedlineTabContent: React.FC<StreamingRedlineTabContentProps> = ({
  isGeneratingRedline,
  redlineDocument,
  isLegalPipeline,
  output,
  streamingProgress,
  onSaveRedline,
  onExportRedline,
  isPipelineExecuting = false,
  isExecuting = false
}) => {
  // Listen for early streaming callback registration
  React.useEffect(() => {
    const handleRegisterStreamingCallback = (event: CustomEvent) => {
      console.log('StreamingRedlineTabContent: Registering streaming callback early', event.detail);
      
      // Emit callback registration event that streaming hook can listen to
      const callbackEvent = new CustomEvent('streamingCallbackReady', {
        detail: {
          component: 'StreamingRedlineTabContent',
          timestamp: new Date().toISOString(),
          source: event.detail.source
        }
      });
      window.dispatchEvent(callbackEvent);
    };

    window.addEventListener('registerStreamingCallback', handleRegisterStreamingCallback as EventListener);
    
    return () => {
      window.removeEventListener('registerStreamingCallback', handleRegisterStreamingCallback as EventListener);
    };
  }, []);

  // Show pipeline executing state with enhanced messaging
  if ((isPipelineExecuting || isExecuting) && !streamingProgress?.hasPartialResults && !redlineDocument) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Pipeline Executing...</p>
          <p className="text-sm text-gray-500 mt-2">
            Redline suggestions will appear as batches complete
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded border text-xs">
            <p className="text-blue-700">
              ✨ Streaming results enabled - you'll see updates in real-time!
            </p>
            <p className="text-blue-600 mt-1">
              Pipeline started at {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state during initial generation
  if (isGeneratingRedline && !streamingProgress?.hasPartialResults && !redlineDocument) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating redline document...</p>
          {streamingProgress && streamingProgress.total > 0 && (
            <div className="mt-4 w-64">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Processing batches</span>
                <span>{streamingProgress.completed}/{streamingProgress.total}</span>
              </div>
              <Progress 
                value={(streamingProgress.completed / streamingProgress.total) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show redline viewer with streaming updates
  if (redlineDocument) {
    return (
      <div className="h-full flex flex-col">
        {/* Streaming progress indicator */}
        {(isGeneratingRedline || isPipelineExecuting || isExecuting) && streamingProgress && streamingProgress.total > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">
                Processing in progress...
              </span>
              <span className="text-blue-600">
                {streamingProgress.completed}/{streamingProgress.total} batches
              </span>
            </div>
            <Progress 
              value={(streamingProgress.completed / streamingProgress.total) * 100} 
              className="h-1 mt-2"
            />
            <p className="text-xs text-blue-600 mt-1">
              You can start reviewing and editing completed suggestions
            </p>
          </div>
        )}

        {/* Redline viewer */}
        <div className="flex-1 overflow-hidden">
          <EmbeddedRedlineViewer
            document={redlineDocument}
            originalDocument={{
              type: output.metadata?.fileType || 'text/plain',
              preview: output.metadata?.originalPreview,
              name: output.metadata?.fileName || 'Document'
            }}
            onSave={onSaveRedline}
            onExport={onExportRedline}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <p className="text-gray-600 mb-2">No redline document available</p>
        <p className="text-sm text-gray-500">
          {isLegalPipeline 
            ? "Unable to generate redline from current pipeline output"
            : "Run a legal document analysis pipeline to generate redline suggestions"
          }
        </p>
        {isLegalPipeline && (
          <div className="mt-4 p-3 bg-yellow-50 rounded border text-xs text-left">
            <p className="font-medium text-yellow-800 mb-1">Debug Info:</p>
            <p className="text-yellow-700">Pipeline Type: {output?.summary?.pipelineType || 'Unknown'}</p>
            <p className="text-yellow-700">Has Analysis: {!!output?.output?.analysis ? 'Yes' : 'No'}</p>
            <p className="text-yellow-700">Analysis Items: {output?.output?.analysis?.length || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingRedlineTabContent;
