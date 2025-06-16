
import React, { forwardRef } from "react";
import WorkbenchContainer from "./workbench/WorkbenchContainer";

/**
 * AIWorkbench Component
 * 
 * Purpose: Main entry point for the AI workflow editor
 * This component serves as the primary interface for the visual workflow
 * editor, now refactored into smaller, focused components for better
 * maintainability and separation of concerns.
 * 
 * Architecture Changes:
 * - Simplified to be a thin wrapper around WorkbenchContainer
 * - Delegates all functionality to specialized child components
 * - Maintains the same external API for backward compatibility
 * - Passes through all props and refs to child components
 * 
 * Key Benefits of Refactoring:
 * - Improved code organization and maintainability
 * - Better separation of concerns between components
 * - Easier testing of individual component pieces
 * - Reduced complexity in each component file
 * 
 * Integration Points:
 * - Used by Index page as the main workspace component
 * - Receives uploaded files and editing state from parent
 * - Communicates module editing events via callbacks
 * - Exposes imperative API for document node creation
 */

interface AIWorkbenchProps {
  onModuleEdit: (nodeId: string, node: any) => void;
  editingPromptNodeId?: string;
  uploadedFiles?: any[];
}

const AIWorkbench = forwardRef<any, AIWorkbenchProps>(function AIWorkbench(
  props,
  ref
) {
  return <WorkbenchContainer {...props} ref={ref} />;
});

export default AIWorkbench;
