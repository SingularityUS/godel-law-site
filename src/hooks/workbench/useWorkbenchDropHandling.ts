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
 * - Supports multiple document queue building
 */

import { useCallback } from "react";
import { Node } from "@xyflow/react";
import { useWorkbenchPositioning } from "./useWorkbenchPositioning";

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
  const { getNodeAtPosition, calculateFlowPosition, getNextDocumentPosition } = useWorkbenchPositioning({
    nodes,
    reactFlowWrapper
  });

  /**
   * Enhanced debugging function for document data validation
   */
  const debugDocumentData = (fileData: any, source: string) => {
    console.log(`🔍 [DROP-${source}] Document debugging:`, {
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
   * Enhanced event dispatching with validation and comprehensive logging
   */
  const dispatchAnchorEvents = (fileData: any, source: string) => {
    console.log(`📡 [DROP-${source}] Starting anchor event dispatch for: ${fileData.name}`);
    
    // Always dispatch anchoring started event
    console.log(`📤 [DROP-${source}] Dispatching anchoringStarted event`);
    const anchoringStartEvent = new CustomEvent('anchoringStarted', {
      detail: {
        documentName: fileData.name,
        source: source
      }
    });
    window.dispatchEvent(anchoringStartEvent);
    
    // Check if we have valid anchor data
    const hasValidAnchorData = fileData.anchoredText && 
                              fileData.anchorCount > 0 && 
                              /⟦P-\d{5}⟧/.test(fileData.anchoredText);
    
    console.log(`🔎 [DROP-${source}] Anchor data validation:`, {
      hasAnchoredText: !!fileData.anchoredText,
      anchorCount: fileData.anchorCount,
      hasValidFormat: fileData.anchoredText ? /⟦P-\d{5}⟧/.test(fileData.anchoredText) : false,
      isValid: hasValidAnchorData
    });
    
    if (hasValidAnchorData) {
      console.log(`✅ [DROP-${source}] Document has valid anchor data - dispatching completion event`);
      const completionEvent = new CustomEvent('anchorTokensComplete', {
        detail: {
          documentName: fileData.name,
          documentText: fileData.extractedText || '',
          anchoredText: fileData.anchoredText,
          anchorCount: fileData.anchorCount,
          source: source
        }
      });
      console.log(`📤 [DROP-${source}] Dispatching anchorTokensComplete event with:`, {
        documentName: fileData.name,
        anchorCount: fileData.anchorCount,
        anchoredTextLength: fileData.anchoredText.length,
        hasValidAnchors: /⟦P-\d{5}⟧/.test(fileData.anchoredText)
      });
      window.dispatchEvent(completionEvent);
    } else {
      const errorReason = !fileData.anchoredText ? 'No anchored text available' : 
                         fileData.anchorCount === 0 ? 'Zero anchor count' :
                         'Invalid anchor text format - missing anchor tags';
      
      console.warn(`⚠️ [DROP-${source}] Document lacks valid anchor data: ${errorReason}`);
      console.warn(`🔍 [DROP-${source}] Anchor text analysis:`, {
        anchoredTextExists: !!fileData.anchoredText,
        anchoredTextLength: fileData.anchoredText?.length || 0,
        anchorCount: fileData.anchorCount || 0,
        firstChars: fileData.anchoredText ? fileData.anchoredText.substring(0, 100) : 'N/A',
        containsAnchorPattern: fileData.anchoredText ? /⟦P-\d{5}⟧/.test(fileData.anchoredText) : false
      });
      
      const errorEvent = new CustomEvent('anchoringError', {
        detail: {
          documentName: fileData.name,
          error: errorReason,
          source: source,
          debugInfo: {
            hasAnchoredText: !!fileData.anchoredText,
            anchorCount: fileData.anchorCount || 0,
            textLength: fileData.anchoredText?.length || 0
          }
        }
      });
      console.log(`📤 [DROP-${source}] Dispatching anchoringError event: ${errorReason}`);
      window.dispatchEvent(errorEvent);
    }
  };

  /**
   * Check if a document with the same name already exists in the workbench
   * Modified to allow multiple documents with the same name by adding unique identifiers
   */
  const documentExists = useCallback((documentName: string) => {
    // Allow multiple documents with the same name by checking for exact duplicates
    // This prevents true duplicates while allowing legitimate multiple additions
    return nodes.some(node => 
      node.type === "document-input" && 
      node.data?.documentName === documentName &&
      node.data?.file?.size && // Only consider it a duplicate if it has the same size
      node.data?.file?.uploaded_at // and same upload timestamp
    );
  }, [nodes]);

  /**
   * Generate a unique document name to prevent conflicts
   */
  const generateUniqueDocumentName = useCallback((originalName: string, fileData: any) => {
    const baseName = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
    const extension = originalName.match(/\.[^/.]+$/)?.[0] || "";
    const timestamp = Date.now();
    
    // Check if we need to make it unique
    const existingNames = nodes
      .filter(node => node.type === "document-input")
      .map(node => node.data?.documentName)
      .filter(Boolean);
    
    if (!existingNames.includes(originalName)) {
      return originalName;
    }
    
    // If the name exists, add a timestamp to make it unique
    return `${baseName}_${timestamp}${extension}`;
  }, [nodes]);

  /**
   * Handle document drops from library or module drops from palette
   */
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      console.log('📥 [DROP] Drop event received in workbench');
      clearDragOverStates();
      
      // Handle document file drops from library
      const docData = event.dataTransfer.getData("application/lovable-document");
      if (docData) {
        console.log('📄 [DROP] Document data found, length:', docData.length);
        
        try {
          const fileData = JSON.parse(docData);
          console.log('📋 [DROP] Parsed file data successfully:', {
            name: fileData.name,
            type: fileData.type,
            size: fileData.size || 'unknown'
          });
          
          // Enhanced debugging
          debugDocumentData(fileData, 'LIBRARY');
          
          // Trigger sidebar document preview immediately
          const previewEvent = new CustomEvent('showDocumentInSidebar', {
            detail: {
              name: fileData.name,
              type: fileData.type,
              preview: fileData.preview
            }
          });
          console.log('📤 [DROP] Dispatching sidebar preview event');
          window.dispatchEvent(previewEvent);
          
          // Check if dropping on an existing document node for replacement
          const targetNode = getNodeAtPosition(event.clientX, event.clientY);
          
          if (targetNode && targetNode.type === "document-input") {
            console.log('🔄 [DROP] Updating existing document node:', targetNode.id);
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
            
            // CRITICAL: Always dispatch anchor events for document drops
            console.log('🚀 [DROP] Force dispatching anchor events for document replacement');
            dispatchAnchorEvents(fileData, 'drag-drop-replace');
            return;
          }
          
          // Check if document already exists in workbench (prevent duplicates)
          if (documentExists(fileData.name)) {
            console.log('⚠️ [DROP] Document already exists in workbench, creating unique copy:', fileData.name);
            // Generate a unique name for this document
            const uniqueName = generateUniqueDocumentName(fileData.name, fileData);
            fileData.name = uniqueName;
            console.log('🔄 [DROP] Using unique name:', uniqueName);
          }
          
          // Create new document input node at appropriate position
          const pos = getNextDocumentPosition();
          console.log('📍 [DROP] Calculated position for new document:', pos);
          
          // Create unique node ID and new document node
          const nodeId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newNode = {
            id: nodeId,
            type: "document-input",
            position: pos,
            data: { 
              moduleType: "document-input" as const, 
              documentName: fileData.name, 
              file: fileData 
            },
            draggable: true,
          };
          
          console.log('➕ [DROP] Creating new document node:', newNode.id);
          setNodes((nds) => [...nds, newNode]);
          
          // CRITICAL: Always dispatch anchor events for new document drops
          console.log('🚀 [DROP] Force dispatching anchor events for new document');
          dispatchAnchorEvents(fileData, 'drag-drop-new');
          
        } catch (parseError) {
          console.error('💥 [DROP] Failed to parse document data:', parseError);
          console.error('📄 [DROP] Raw data preview:', docData.substring(0, 200) + '...');
        }
        
        return;
      }
      
      // Handle module palette drops
      const transfer = event.dataTransfer.getData("application/json");
      if (!transfer) {
        console.log('❌ [DROP] No transfer data found');
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
      console.log('➕ [DROP] Creating new helper node:', newNode.id, 'type:', module.type);
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, getNodeAtPosition, clearDragOverStates, calculateFlowPosition, getNextDocumentPosition, documentExists, generateUniqueDocumentName]
  );

  return {
    onDrop
  };
};
