
/**
 * useWorkspaceManager Hook
 * 
 * Purpose: Manages saving and loading of user workspaces
 * Handles workspace persistence and restoration
 */

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  /**
   * Save current workspace
   */
  const saveWorkspace = useCallback(async (
    name: string,
    nodes: Node[],
    edges: Edge[],
    workspaceId?: string
  ): Promise<string | null> => {
    if (!user) {
      setSaveError("User not authenticated");
      return null;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const workspaceData = {
        name,
        nodes_data: nodes,
        edges_data: edges,
        user_id: user.id
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
          .insert(workspaceData)
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
  }, [user]);

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
        id: data.id,
        name: data.name,
        nodes: Array.isArray(data.nodes_data) ? data.nodes_data as Node[] : [],
        edges: Array.isArray(data.edges_data) ? data.edges_data as Edge[] : [],
        created_at: data.created_at,
        updated_at: data.updated_at
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
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        nodes: [] as Node[],
        edges: [] as Edge[],
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }
  }, [user]);

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
