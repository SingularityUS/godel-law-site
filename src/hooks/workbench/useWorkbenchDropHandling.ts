
/**
 * useWorkbenchDropHandling Hook
 * 
 * Purpose: Handles document and module drop operations for the workbench
 * Extracted from useWorkbenchDragDrop for better separation of concerns
 * 
 * Key Responsibilities:
 * - Processes document drops from library
 * - Handles module drops from palette
 * - Manages node creation and updates
 * - Coordinates with positioning system
 * - Automatically triggers citation analysis for dropped documents
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useWorkbenchPositioning } from "./useWorkbenchPositioning";
import { useCitationAnalysis } from "./useCitationAnalysis";

type AllNodes = Node<any>;

interface UseWorkbenchDropHandlingProps {
  nodes: AllNodes[];
  setNodes: React.Dispatch<React.SetStateAction<AllNodes[]>>;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  clearDragOverStates: () => void;
}

export const useWorkbenchDropHandling = ({
  nodes,
  setNodes,
  reactFlowWrapper,
  clearDragOverStates
}: UseWorkbenchDropHandlingProps) => {
  const { getNodeAtPosition, calculateFlowPosition } = useWorkbenchPositioning({
    nodes,
    reactFlowWrapper
  });

  const { processCitations } = useCitationAnalysis();

  /**
   * Automatically process citations for dropped documents
   */
  const autoProcessDroppedDocument = useCallback(async (fileData: any) => {
    console.log('🔍 Auto-processing dropped document:', {
      name: fileData.name,
      hasExtractedText: !!fileData.extractedText,
      hasAnchoredText: !!fileData.anchoredText,
      anchorCount: fileData.anchorCount || 0
    });

    try {
      // Prioritize anchored text over extracted text
      const textToAnalyze = fileData.anchoredText || fileData.extractedText;
      
      if (!textToAnalyze) {
        console.log('❌ No text content available for citation analysis');
        return;
      }

      // Check if document has anchor tokens
      const hasAnchors = /⟦P-\d{5}⟧/.test(textToAnalyze);
      
      if (!hasAnchors) {
        console.log('⚠️ Document does not contain anchor tokens, skipping auto-processing');
        console.log('Text preview:', textToAnalyze.substring(0, 200) + '...');
        return;
      }

      console.log('✅ Auto-processing citations for dropped document:', fileData.name);
      console.log('📍 Document has anchor tokens, triggering citation analysis...');
      
      // Trigger citation analysis
      await processCitations(textToAnalyze, fileData.name);
      
      console.log('🎉 Citation analysis completed for dropped document:', fileData.name);
    } catch (error) {
      console.error('💥 Citation analysis failed for dropped document:', error);
      // Don't throw error to prevent disrupting the drop operation
    }
  }, [processCitations]);

  /**
   * Handle document drops from library or module drops from palette
   */
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      console.log('📥 Drop event received in workbench');
      clearDragOverStates();
      
      // Handle document file drops from library
      const docData = event.dataTransfer.getData("application/lovable-document");
      if (docData) {
        console.log('📄 Document data found:', docData.substring(0, 200) + '...');
        const fileData = JSON.parse(docData);
        console.log('📋 Parsed file data:', {
          name: fileData.name,
          type: fileData.type,
          hasExtractedText: !!fileData.extractedText,
          hasAnchoredText: !!fileData.anchoredText,
          anchorCount: fileData.anchorCount || 0
        });
        
        // Trigger sidebar document preview
        const previewEvent = new CustomEvent('showDocumentInSidebar', {
          detail: {
            name: fileData.name,
            type: fileData.type,
            preview: fileData.preview
          }
        });
        window.dispatchEvent(previewEvent);
        
        // Check if dropping on an existing document node for replacement
        const targetNode = getNodeAtPosition(event.clientX, event.clientY);
        
        if (targetNode && targetNode.type === "document-input") {
          console.log('🔄 Updating existing document node:', targetNode.id);
          // Update existing document input node with new document
          setNodes((nds) =>
            nds.map((node) =>
              node.id === targetNode.id
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      documentName: fileData.name,
                      file: fileData,
                      isDragOver: false
                    }
                  }
                : node
            )
          );
          
          // Auto-process citations for replaced document
          autoProcessDroppedDocument(fileData);
          return;
        }
        
        // Create new document input node at drop position
        const pos = calculateFlowPosition(event.clientX, event.clientY);
        console.log('📍 Calculated position:', pos);
        
        // Create unique node ID and new document node
        const nodeId = `doc-${Date.now()}-${fileData.name}`;
        const newNode = {
          id: nodeId,
          type: "document-input",
          position: pos,
          data: { moduleType: "document-input" as const, documentName: fileData.name, file: fileData },
          draggable: true,
        };
        
        console.log('➕ Creating new document node:', newNode.id);
        setNodes((nds) => [...nds, newNode]);
        
        // Auto-process citations for new document
        autoProcessDroppedDocument(fileData);
        return;
      }
      
      // Handle module palette drops
      const transfer = event.dataTransfer.getData("application/json");
      if (!transfer) {
        console.log('❌ No transfer data found');
        return;
      }
      
      // Parse module data and create helper node
      const module = JSON.parse(transfer);
      const pos = calculateFlowPosition(event.clientX, event.clientY);
      
      // Generate unique ID and create helper node
      const nodeId = (Math.floor(Math.random() * 1e8)).toString();
      const newNode = {
        id: nodeId,
        type: "helper",
        position: pos,
        data: { moduleType: module.type },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, getNodeAtPosition, clearDragOverStates, calculateFlowPosition, autoProcessDroppedDocument]
  );

  return {
    onDrop
  };
};
