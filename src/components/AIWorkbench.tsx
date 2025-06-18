
import React, { forwardRef } from "react";
import WorkbenchContainer from "./workbench/WorkbenchContainer";

/**
 * AIWorkbench Component
 * 
 * Purpose: Backward compatibility wrapper for the AI Workbench
 * This component maintains the existing API while delegating all
 * functionality to the refactored WorkbenchContainer component.
 * 
 * Architecture Changes:
 * - Now a simple wrapper around WorkbenchContainer
 * - Maintains same external API for backward compatibility
 * - All functionality moved to WorkbenchContainer
 * - Simplified component hierarchy
 * 
 * Integration Points:
 * - Used by Index page as the main workspace component
 * - Passes through all props and refs to WorkbenchContainer
 */

interface AIWorkbenchProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
  onOpenSidebar?: () => void;
}

const AIWorkbench = forwardRef<any, AIWorkbenchProps>(function AIWorkbench(
  props,
  ref
) {
  return <WorkbenchContainer {...props} ref={ref} />;
});

export default AIWorkbench;
