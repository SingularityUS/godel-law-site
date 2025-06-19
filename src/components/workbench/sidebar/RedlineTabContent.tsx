
/**
 * RedlineTabContent Component
 * 
 * Purpose: Redline tab using the new simplified redline processing system
 */

import React from "react";
import { RedlineDocument } from "@/types/redlining";
import EmbeddedRedlineViewer from "@/components/redlining/EmbeddedRedlineViewer";
import ProcessingDocumentView from "./ProcessingDocumentView";
import { useRedlineProcessor } from "@/hooks/redlining/useRedlineProcessor";

interface RedlineTabContentProps {
  isProcessing?: boolean;
  processingDocument?: any;
  output: any;
  previewDocument?: { name: string; type: string; preview?: string } | null;
  onSaveRedline: (document: RedlineDocument) => void;
  onExportRedline: (document: RedlineDocument, format: string) => void;
}

const RedlineTabContent: React.FC<RedlineTabContentProps> = ({
  isProcessing,
  processingDocument,
  output,
  previewDocument,
  onSaveRedline,
  onExportRedline
}) => {
  // Use the new redline processor
  const {
    document: redlineDocument,
    isProcessing: isGeneratingRedline,
    error: redlineError,
    terminalModules
  } = useRedlineProcessor({
    pipelineOutput: output,
    enabled: !isProcessing && !!output
  });

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
          <p className="text-gray-600">Processing terminal modules for redline generation...</p>
          {terminalModules.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Found {terminalModules.length} terminal modules: {terminalModules.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show redline document when ready
  if (redlineDocument) {
    // Priority: Use previewDocument if available (contains full content)
    // Fallback: Use output metadata (may be truncated)
    const originalDocument = previewDocument ? {
      type: previewDocument.type,
      preview: previewDocument.preview,
      name: previewDocument.name
    } : {
      type: output?.metadata?.fileType || 'text/plain',
      preview: output?.metadata?.originalPreview,
      name: output?.metadata?.fileName || redlineDocument.metadata.fileName || 'Document'
    };

    console.log('🎯 REDLINE TAB: Original document source:', {
      usingPreviewDocument: !!previewDocument,
      previewLength: previewDocument?.preview?.length || 0,
      fallbackLength: output?.metadata?.originalPreview?.length || 0,
      documentName: originalDocument.name
    });

    return (
      <div className="h-full overflow-hidden">
        <EmbeddedRedlineViewer
          document={redlineDocument}
          originalDocument={originalDocument}
          onSave={onSaveRedline}
          onExport={onExportRedline}
        />
      </div>
    );
  }

  // Show error state
  if (redlineError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Redline Generation Error</h3>
          <p className="text-gray-600 mb-4">{redlineError}</p>
          <div className="text-sm text-gray-500">
            <p>This can happen if:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>No terminal modules were found in the pipeline</li>
              <li>Terminal modules didn't produce analyzable output</li>
              <li>Original document content is missing</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state with pipeline information
  const hasOutput = !!output;
  const hasTerminalData = output?.endpointResults?.length > 0 || output?.pipelineResults?.some((r: any) => r.isEndpoint);

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-gray-600 mb-2">No redline document available</p>
        <p className="text-sm text-gray-500 mb-4">
          {!hasOutput 
            ? "Run a pipeline to generate redline suggestions"
            : !hasTerminalData 
            ? "No terminal modules found in pipeline output"
            : "Waiting for terminal module data..."
          }
        </p>
        
        {hasOutput && (
          <div className="mt-4 p-4 bg-blue-50 rounded border text-left">
            <p className="font-medium text-blue-800 mb-2">Pipeline Status:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <div>Pipeline Type: {output?.summary?.pipelineType || 'Document Analysis'}</div>
              <div>Endpoint Results: {output?.endpointResults?.length || 0}</div>
              <div>Pipeline Results: {output?.pipelineResults?.length || 0}</div>
              
              {output?.endpointResults && output.endpointResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="font-medium">Terminal Modules:</div>
                  {output.endpointResults.map((result: any, index: number) => (
                    <div key={index} className="ml-2 text-xs">
                      <span className="font-medium">{result.moduleType}</span>
                      <span className="ml-1 opacity-75">({result.nodeId})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedlineTabContent;
