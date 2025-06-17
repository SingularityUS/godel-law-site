
/**
 * Module Progress Types
 * 
 * Purpose: Type definitions for module-specific progress tracking
 */

import { ModuleKind } from "@/data/modules";

// Enhanced progress interface for module-specific tracking
export interface ModuleProgress {
  completed: number;
  total: number;
  moduleType: ModuleKind;
  inputType: 'chunks' | 'paragraphs' | 'documents';
  outputGenerated?: number;
  outputType?: string;
}
