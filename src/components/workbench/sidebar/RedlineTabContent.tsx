
/**
 * RedlineTabContent Component
 * 
 * Purpose: Content for the redline tab in the workspace sidebar with enhanced debugging
 * Extracted from WorkspaceSidebar for better organization
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
          <p className="text-gray-600">Generating redline document...</p>
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
            name: output.metadata?.fileName || 'Document'
          }}
          onSave={onSaveRedline}
          onExport={onExportRedline}
        />
      </div>
    );
  }

  // Enhanced empty state with detailed debugging
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-gray-600 mb-2">No redline document available</p>
        <p className="text-sm text-gray-500 mb-4">
          {isLegalPipeline 
            ? "Analyzing pipeline output for redline generation..."
            : "Run a legal document analysis pipeline to generate redline suggestions"
          }
        </p>
        
        {isLegalPipeline && (
          <div className="mt-4 p-4 bg-blue-50 rounded border text-left">
            <p className="font-medium text-blue-800 mb-2">Pipeline Analysis:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <div>Pipeline Type: {output?.summary?.pipelineType || 'Legal Document Analysis'}</div>
              <div>Has Grammar Analysis: {!!output?.output?.analysis ? 'Yes' : 'No'}</div>
              <div>Grammar Items: {output?.output?.analysis?.length || 0}</div>
              <div>Has Citations: {!!output?.output?.citations ? 'Yes' : 'No'}</div>
              <div>Citation Count: {output?.output?.citations?.length || 0}</div>
              <div>Processing Stats: {output?.output?.processingStats ? 'Available' : 'None'}</div>
              <div>Has Metadata: {!!output?.metadata ? 'Yes' : 'No'}</div>
              <div>Has Original Content: {!!(output?.metadata?.originalContent || output?.originalContent) ? 'Yes' : 'No'}</div>
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
