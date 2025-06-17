
/**
 * useWorkspaceState Hook
 * 
 * Purpose: Manages workspace persistence to Supabase
 * Handles auto-saving, loading, and state synchronization
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Node, Edge } from "@xyflow/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface WorkspaceData {
  id?: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  isDefault: boolean;
}

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export const useWorkspaceState = () => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceData>({
    name: "Default Workspace",
    nodes: [],
    edges: [],
    isDefault: true
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Debounce timer for auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Load workspace from Supabase
   */
  const loadWorkspace = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading workspace:', error);
        setSaveStatus(prev => ({ ...prev, error: error.message }));
        return;
      }

      if (data) {
        setWorkspace({
          id: data.id,
          name: data.name,
          nodes: data.nodes_data as Node[] || [],
          edges: data.edges_data as Edge[] || [],
          isDefault: data.is_default
        });
      } else {
        // No workspace found, create default
        await createDefaultWorkspace();
      }
    } catch (error: any) {
      console.error('Error loading workspace:', error);
      setSaveStatus(prev => ({ ...prev, error: error.message }));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Create default workspace
   */
  const createDefaultWorkspace = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: user.id,
          name: 'Default Workspace',
          nodes_data: [],
          edges_data: [],
          is_default: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default workspace:', error);
        return;
      }

      setWorkspace({
        id: data.id,
        name: data.name,
        nodes: [],
        edges: [],
        isDefault: true
      });
    } catch (error: any) {
      console.error('Error creating default workspace:', error);
      setSaveStatus(prev => ({ ...prev, error: error.message }));
    }
  }, [user]);

  /**
   * Save workspace to Supabase
   */
  const saveWorkspace = useCallback(async (workspaceData: WorkspaceData) => {
    if (!user || !workspaceData.id) return;

    setSaveStatus(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const { error } = await supabase
        .from('workspaces')
        .update({
          nodes_data: workspaceData.nodes,
          edges_data: workspaceData.edges,
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceData.id);

      if (error) {
        console.error('Error saving workspace:', error);
        setSaveStatus(prev => ({ 
          ...prev, 
          isSaving: false, 
          error: error.message 
        }));
        toast.error('Failed to save workspace');
        return;
      }

      setSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        error: null
      });
    } catch (error: any) {
      console.error('Error saving workspace:', error);
      setSaveStatus(prev => ({ 
        ...prev, 
        isSaving: false, 
        error: error.message 
      }));
      toast.error('Failed to save workspace');
    }
  }, [user]);

  /**
   * Debounced auto-save function
   */
  const debouncedSave = useCallback((workspaceData: WorkspaceData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveWorkspace(workspaceData);
    }, 1000); // Save after 1 second of inactivity
  }, [saveWorkspace]);

  /**
   * Update nodes and trigger auto-save
   */
  const updateNodes = useCallback((nodes: Node[]) => {
    const updatedWorkspace = { ...workspace, nodes };
    setWorkspace(updatedWorkspace);
    debouncedSave(updatedWorkspace);
  }, [workspace, debouncedSave]);

  /**
   * Update edges and trigger auto-save
   */
  const updateEdges = useCallback((edges: Edge[]) => {
    const updatedWorkspace = { ...workspace, edges };
    setWorkspace(updatedWorkspace);
    debouncedSave(updatedWorkspace);
  }, [workspace, debouncedSave]);

  /**
   * Load workspace on component mount
   */
  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    workspace,
    saveStatus,
    isLoading,
    updateNodes,
    updateEdges,
    loadWorkspace,
    saveWorkspace: () => saveWorkspace(workspace)
  };
};
