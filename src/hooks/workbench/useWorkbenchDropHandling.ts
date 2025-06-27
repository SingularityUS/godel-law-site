
/**
 * useWorkbenchDropHandling Hook
 * 
 * Purpose: Handles document and module drop operations for the workbench
 * Refactored to use specialized hooks for better separation of concerns
 * 
 * Key Responsibilities:
 * - Processes document drops from library
 * - Handles module drops from palette
 * - Manages node creation and updates
 * - Coordinates with positioning system
 * - Uses event-driven citation analysis triggering
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useWorkbenchPositioning } from "./useWorkbenchPositioning";
import { useAnchorTokenCompletionListener } from "./useAnchorTokenCompletionListener";

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

  // Initialize the anchor token completion listener
  useAnchorTokenCompletionListener();

  /**
   * Enhanced debugging function for document data validation
   */
  const debugDocumentData = (fileData: any, source: string) => {
    console.log(`🔍 [${source}] Document debugging:`, {
      name: fileData.name,
      type: fileData.type,
      hasExtractedText: !!fileData.extractedText,
      extractedTextLength: fileData.extractedText?.length || 0,
      hasAnchoredText: !!fileData.anchoredText,
      anchoredTextLength: fileData.anchoredText?.length || 0,
      anchorCount: fileData.anchorCount || 0,
      anchoredTextPreview: fileData.anchoredText ? fileData.anchoredText.substring(0, 200) + '...' : 'None',
      containsAnchorTags: fileData.anchoredText ? /⟦P-\d{5}⟧/.test(fileData.anchoredText) : false
    });
  };

  /**
   * Enhanced event dispatching with validation
   */
  const dispatchAnchorEvents = (fileData: any, source: string) => {
    console.log(`📡 [${source}] Dispatching anchor events for: ${fileData.name}`);
    
    // Always dispatch anchoring started event
    const anchoringStartEvent = new CustomEvent('anchoringStarted', {
      detail: {
        documentName: fileData.name,
        source: source
      }
    });
    console.log(`📤 [${source}] Dispatching anchoringStarted event`);
    window.dispatchEvent(anchoringStartEvent);
    
    // Check if we have valid anchor data
    const hasValidAnchorData = fileData.anchoredText && 
                              fileData.anchorCount > 0 && 
                              /⟦P-\d{5}⟧/.test(fileData.anchoredText);
    
    if (hasValidAnchorData) {
      console.log(`✅ [${source}] Document has valid anchor data - dispatching completion event`);
      const completionEvent = new CustomEvent('anchorTokensComplete', {
        detail: {
          documentName: fileData.name,
          documentText: fileData.extractedText || '',
          anchoredText: fileData.anchoredText,
          anchorCount: fileData.anchorCount,
          source: source
        }
      });
      console.log(`📤 [${source}] Dispatching anchorTokensComplete event with:`, {
        documentName: fileData.name,
        anchorCount: fileData.anchorCount,
        anchoredTextLength: fileData.anchoredText.length
      });
      window.dispatchEvent(completionEvent);
    } else {
      console.warn(`⚠️ [${source}] Document lacks valid anchor data - dispatching error event`);
      const errorEvent = new CustomEvent('anchoringError', {
        detail: {
          documentName: fileData.name,
          error: hasValidAnchorData ? 'No anchored text available' : 'Invalid anchor text format - missing anchor tags',
          source: source
        }
      });
      console.log(`📤 [${source}] Dispatching anchoringError event`);
      window.dispatchEvent(errorEvent);
    }
  };

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
        
        try {
          const fileData = JSON.parse(docData);
          console.log('📋 Parsed file data successfully');
          
          // Enhanced debugging
          debugDocumentData(fileData, 'drag-drop');
          
          // Trigger sidebar document preview immediately
          const previewEvent = new CustomEvent('showDocumentInSidebar', {
            detail: {
              name: fileData.name,
              type: fileData.type,
              preview: fileData.preview
            }
          });
          console.log('📤 Dispatching sidebar preview event');
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
            
            // Dispatch anchor events for replaced document
            dispatchAnchorEvents(fileData, 'drag-drop-replace');
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
          
          // Dispatch anchor events for new document
          dispatchAnchorEvents(fileData, 'drag-drop-new');
          
        } catch (parseError) {
          console.error('💥 Failed to parse document data:', parseError);
          console.error('Raw data:', docData);
        }
        
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
      console.log('➕ Creating new helper node:', newNode.id, 'type:', module.type);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, getNodeAtPosition, clearDragOverStates, calculateFlowPosition]
  );

  return {
    onDrop
  };
};
