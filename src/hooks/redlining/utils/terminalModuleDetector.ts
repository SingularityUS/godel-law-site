
/**
 * Terminal Module Detection Utility
 * 
 * Purpose: Identifies terminal modules (endpoints) in pipeline output
 */

export interface TerminalModule {
  nodeId: string;
  moduleType: string;
  hasOutput: boolean;
}

/**
 * Detect terminal modules from pipeline output
 */
export const detectTerminalModules = (pipelineOutput: any): TerminalModule[] => {
  console.log('=== DETECTING TERMINAL MODULES ===');
  
  const terminalModules: TerminalModule[] = [];
  
  // Check endpoint results (new pipeline system)
  if (pipelineOutput.endpointResults && Array.isArray(pipelineOutput.endpointResults)) {
    console.log(`Found ${pipelineOutput.endpointResults.length} endpoint results`);
    
    pipelineOutput.endpointResults.forEach((result: any) => {
      if (result.nodeId && result.moduleType && result.result) {
        terminalModules.push({
          nodeId: result.nodeId,
          moduleType: result.moduleType,
          hasOutput: !!result.result
        });
        console.log(`Terminal module: ${result.moduleType} (${result.nodeId})`);
      }
    });
  }
  
  // Fallback: Check pipeline results for isEndpoint flag
  if (terminalModules.length === 0 && pipelineOutput.pipelineResults) {
    console.log('Fallback: checking pipeline results for terminal modules');
    
    pipelineOutput.pipelineResults.forEach((result: any) => {
      if (result.isEndpoint && result.nodeId && result.moduleType) {
        terminalModules.push({
          nodeId: result.nodeId,
          moduleType: result.moduleType,
          hasOutput: !!result.result
        });
        console.log(`Terminal module (fallback): ${result.moduleType} (${result.nodeId})`);
      }
    });
  }
  
  console.log(`Total terminal modules detected: ${terminalModules.length}`);
  return terminalModules;
};
