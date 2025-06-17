
/**
 * useWorkspaceStorage Hook
 * 
 * Purpose: Handles Supabase storage operations for workspace data
 * Manages loading, saving, and creating workspaces in the database
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Node, Edge } from "@xyflow/react";

export interface WorkspaceData {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  isDefault: boolean;
}

export interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export const useWorkspaceStorage = () => {
  const [workspace, setWorkspace] = useState<WorkspaceData>({
    id: '',
    name: 'Default Workspace',
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

  /**
   * Load workspace from Supabase
   */
  const loadWorkspace = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setIsLoading(false);
        return;
      }

      // Try to load the default workspace
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        console.error('Error loading workspace:', error);
        throw error;
      }

      if (data) {
        console.log('Loaded workspace from database:', data);
        setWorkspace({
          id: data.id,
          name: data.name,
          nodes: (data.nodes_data as unknown as Node[]) || [],
          edges: (data.edges_data as unknown as Edge[]) || [],
          isDefault: data.is_default
        });
      } else {
        // Create default workspace if none exists
        await createDefaultWorkspace(user.id);
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
      setSaveStatus(prev => ({ ...prev, error: 'Failed to load workspace' }));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a default workspace
   */
  const createDefaultWorkspace = async (userId: string) => {
    try {
      console.log('Creating default workspace for user:', userId);
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          user_id: userId,
          name: 'Default Workspace',
          nodes_data: JSON.parse(JSON.stringify([])),
          edges_data: JSON.parse(JSON.stringify([])),
          is_default: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default workspace:', error);
        throw error;
      }

      if (data) {
        console.log('Created default workspace:', data);
        setWorkspace({
          id: data.id,
          name: data.name,
          nodes: [],
          edges: [],
          isDefault: true
        });
      }
    } catch (error) {
      console.error('Failed to create default workspace:', error);
      setSaveStatus(prev => ({ ...prev, error: 'Failed to create workspace' }));
    }
  };

  /**
   * Save workspace to Supabase
   */
  const saveWorkspace = async (workspaceData: WorkspaceData) => {
    if (!workspaceData.id) {
      console.log('No workspace ID, skipping save');
      return;
    }

    try {
      setSaveStatus(prev => ({ ...prev, isSaving: true, error: null }));

      const { error } = await supabase
        .from('workspaces')
        .update({
          nodes_data: JSON.parse(JSON.stringify(workspaceData.nodes)),
          edges_data: JSON.parse(JSON.stringify(workspaceData.edges)),
          updated_at: new Date().toISOString()
        })
        .eq('id', workspaceData.id);

      if (error) {
        console.error('Error saving workspace:', error);
        throw error;
      }

      console.log('Workspace saved successfully');
      setSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        error: null
      }));
    } catch (error) {
      console.error('Failed to save workspace:', error);
      setSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        error: 'Failed to save workspace'
      }));
    }
  };

  return {
    workspace,
    setWorkspace,
    saveStatus,
    isLoading,
    loadWorkspace,
    saveWorkspace
  };
};
