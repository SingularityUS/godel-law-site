
/**
 * RedlineTabContent Component
 * 
 * Purpose: Enhanced redline tab with dynamic triggering based on available data
 */

import React from "react";
import { RedlineDocument } from "@/types/redlining";
import EmbeddedRedlineViewer from "@/components/redlining/EmbeddedRedlineViewer";
import ProcessingDocumentView from "./ProcessingDocumentView";

interface RedlineTabContentProps {
  isProcessing?: boolean;
  processingDocument?: any;
  isGeneratingRedline: boolean;
  redlineDocument: RedlineDocument | null;
  isLegalPipeline: boolean;
  output: any;
  onSaveRedline: (document: RedlineDocument) => void;
  onExportRedline: (document: RedlineDocument, format: string) => void;
}

const RedlineTabContent: React.FC<RedlineTabContentProps> = ({
  isProcessing,
  processingDocument,
  isGeneratingRedline,
  redlineDocument,
  isLegalPipeline,
  output,
  onSaveRedline,
  onExportRedline
}) => {
  // Show processing document view while pipeline is executing
  if (isProcessing && processingDocument) {
    return (
      <div className="h-full overflow-hidden">
        <ProcessingDocumentView document={processingDocument} />
      </div>
    );
  }

  // Show redline generation spinner
  if (isGeneratingRedline) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating comprehensive redline document...</p>
        </div>
      </div>
    );
  }

  // Show redline document when ready
  if (redlineDocument) {
    return (
      <div className="h-full overflow-hidden">
        <EmbeddedRedlineViewer
          document={redlineDocument}
          originalDocument={{
            type: output.metadata?.fileType || 'text/plain',
            preview: output.metadata?.originalPreview,
            name: output.metadata?.fileName || redlineDocument.metadata.fileName || 'Document'
          }}
          onSave={onSaveRedline}
          onExport={onExportRedline}
        />
      </div>
    );
  }

  // Enhanced empty state with dynamic pipeline detection
  const hasAnalyzableData = !!(
    output?.endpointResults?.length > 0 ||
    output?.pipelineResults?.length > 0 ||
    output?.output?.analysis ||
    output?.output?.citations ||
    output?.analysis ||
    output?.citations
  );

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-gray-600 mb-2">No redline document available</p>
        <p className="text-sm text-gray-500 mb-4">
          {hasAnalyzableData 
            ? "Processing pipeline results for comprehensive redline generation..."
            : "Run a document analysis pipeline to generate redline suggestions"
          }
        </p>
        
        {output && (
          <div className="mt-4 p-4 bg-blue-50 rounded border text-left">
            <p className="font-medium text-blue-800 mb-2">Pipeline Analysis Status:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <div>Pipeline Type: {output?.summary?.pipelineType || 'Document Analysis'}</div>
              <div>Endpoint Modules: {output?.endpoints?.length || 0}</div>
              <div>Total Modules: {output?.pipelineResults?.length || 0}</div>
              
              {/* Show endpoint module information */}
              {output?.endpoints && output.endpoints.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="font-medium">Endpoint Modules:</div>
                  {output.endpoints.map((endpoint: any, index: number) => (
                    <div key={index} className="ml-2 text-xs">
                      <span className="font-medium">{endpoint.moduleType}</span>
                      <span className="ml-1 opacity-75">({endpoint.nodeId})</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show available data indicators */}
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-xs opacity-75">Available Data:</div>
                <div>Endpoint Results: {output?.endpointResults?.length || 0}</div>
                <div>Pipeline Results: {output?.pipelineResults?.length || 0}</div>
                <div>Has Analysis Data: {!!(output?.output?.analysis || output?.analysis) ? 'Yes' : 'No'}</div>
                <div>Has Citation Data: {!!(output?.output?.citations || output?.citations) ? 'Yes' : 'No'}</div>
                <div>Original Content Available: {!!(output?.metadata?.originalContent) ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            {output?.metadata?.error && (
              <div className="mt-3 p-2 bg-yellow-100 rounded">
                <p className="text-xs font-medium text-yellow-800">Pipeline Error:</p>
                <p className="text-xs text-yellow-700">{output.metadata.userFriendlyError || output.metadata.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedlineTabContent;
