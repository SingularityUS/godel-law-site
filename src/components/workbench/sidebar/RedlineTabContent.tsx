
/**
 * RedlineTabContent Component
 * 
 * Purpose: Content for the redline tab in the workspace sidebar
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
      <ProcessingDocumentView document={processingDocument} />
    );
  }

  // Show redline generation spinner
  if (isGeneratingRedline) {
    return (
      <div className="flex items-center justify-center h-full">
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
    );
  }

  // Default empty state
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

export default RedlineTabContent;
