
/**
 * useWorkspaceManager Hook
 * 
 * Purpose: Manages saving and loading of user workspaces
 * Handles workspace persistence and restoration
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceData {
  id?: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  created_at?: string;
  updated_at?: string;
}

export const useWorkspaceManager = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Save current workspace
   */
  const saveWorkspace = useCallback(async (
    name: string,
    nodes: Node[],
    edges: Edge[],
    workspaceId?: string
  ): Promise<string | null> => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const workspaceData = {
        name,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (workspaceId) {
        // Update existing workspace
        result = await supabase
          .from('workspaces')
          .update(workspaceData)
          .eq('id', workspaceId)
          .select()
          .single();
      } else {
        // Create new workspace
        result = await supabase
          .from('workspaces')
          .insert({
            ...workspaceData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      return result.data.id;
    } catch (error: any) {
      setSaveError(error.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Load workspace by ID
   */
  const loadWorkspace = useCallback(async (workspaceId: string): Promise<WorkspaceData | null> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error) {
        throw error;
      }

      return {
        ...data,
        nodes: JSON.parse(data.nodes),
        edges: JSON.parse(data.edges)
      };
    } catch (error) {
      console.error('Error loading workspace:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get user's workspaces
   */
  const getUserWorkspaces = useCallback(async (): Promise<WorkspaceData[]> => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }
  }, []);

  /**
   * Auto-save current workspace
   */
  const autoSave = useCallback(async (nodes: Node[], edges: Edge[]): Promise<string | null> => {
    const autoSaveName = `Auto-saved Workspace ${new Date().toLocaleString()}`;
    return await saveWorkspace(autoSaveName, nodes, edges);
  }, [saveWorkspace]);

  return {
    isSaving,
    isLoading,
    saveError,
    saveWorkspace,
    loadWorkspace,
    getUserWorkspaces,
    autoSave
  };
};
