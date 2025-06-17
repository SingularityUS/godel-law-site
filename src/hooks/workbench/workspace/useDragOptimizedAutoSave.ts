
/**
 * useDragOptimizedAutoSave Hook
 * 
 * Purpose: Handles drag-aware automatic saving of workspace changes
 * Optimizes performance by avoiding saves during active drag operations
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { Node, Edge } from "@xyflow/react";

interface WorkspaceData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  isDefault: boolean;
}

interface UseDragOptimizedAutoSaveProps {
  workspace: WorkspaceData;
  saveWorkspace: (workspaceData: WorkspaceData) => Promise<void>;
  normalSaveDelay?: number;
  dragSaveDelay?: number;
}

export const useDragOptimizedAutoSave = ({
  workspace,
  saveWorkspace,
  normalSaveDelay = 3000,
  dragSaveDelay = 1000
}: UseDragOptimizedAutoSaveProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Create a lightweight workspace fingerprint for change detection
   * More efficient than JSON.stringify of entire workspace
   */
  const createWorkspaceFingerprint = useCallback((nodes: Node[], edges: Edge[]) => {
    const nodeFingerprint = nodes.map(n => `${n.id}:${n.position.x}:${n.position.y}:${n.type}`).join('|');
    const edgeFingerprint = edges.map(e => `${e.id}:${e.source}:${e.target}`).join('|');
    return `${nodeFingerprint}##${edgeFingerprint}`;
  }, []);

  /**
   * Mark drag state as active and set timeout to clear it
   */
  const startDragging = useCallback(() => {
    setIsDragging(true);
    
    // Clear any existing drag timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    
    // Set timeout to end dragging state if no more drag events
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
    }, 500); // 500ms of inactivity to consider drag ended
  }, []);

  /**
   * Debounced save function that respects drag state
   */
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Use appropriate delay based on drag state
    const delay = isDragging ? dragSaveDelay : normalSaveDelay;

    saveTimeoutRef.current = setTimeout(() => {
      const currentFingerprint = createWorkspaceFingerprint(workspace.nodes, workspace.edges);

      // Only save if the workspace has actually changed
      if (currentFingerprint !== lastSavedRef.current && workspace.id) {
        console.log('Auto-saving workspace changes...');
        saveWorkspace(workspace);
        lastSavedRef.current = currentFingerprint;
      }
    }, delay);
  }, [workspace, saveWorkspace, isDragging, dragSaveDelay, normalSaveDelay, createWorkspaceFingerprint]);

  /**
   * Trigger auto-save when workspace changes, but be smart about it
   */
  useEffect(() => {
    if (workspace.id) {
      // If dragging, don't save immediately - wait for drag to complete
      if (!isDragging) {
        debouncedSave();
      }
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workspace.nodes, workspace.edges, debouncedSave, isDragging]);

  /**
   * Initialize the last saved reference when workspace loads
   */
  useEffect(() => {
    if (workspace.id) {
      lastSavedRef.current = createWorkspaceFingerprint(workspace.nodes, workspace.edges);
    }
  }, [workspace.id, createWorkspaceFingerprint]);

  /**
   * Save immediately when dragging stops
   */
  useEffect(() => {
    if (!isDragging && workspace.id) {
      // Small delay to ensure drag state has fully settled
      const immediateTimeout = setTimeout(() => {
        debouncedSave();
      }, 100);
      
      return () => clearTimeout(immediateTimeout);
    }
  }, [isDragging, workspace.id, debouncedSave]);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
    };
  }, []);

  return {
    startDragging,
    isDragging
  };
};
