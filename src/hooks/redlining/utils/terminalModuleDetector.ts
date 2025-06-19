
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
  console.log('Pipeline output structure:', {
    hasResults: !!pipelineOutput.results,
    resultsLength: pipelineOutput.results?.length || 0,
    hasEndpointResults: !!pipelineOutput.endpointResults,
    endpointResultsLength: pipelineOutput.endpointResults?.length || 0,
    outputKeys: Object.keys(pipelineOutput)
  });
  
  const terminalModules: TerminalModule[] = [];
  
  // Check results array (current pipeline system structure)
  if (pipelineOutput.results && Array.isArray(pipelineOutput.results)) {
    console.log(`Found ${pipelineOutput.results.length} results`);
    
    // Find the last non-document-input module (which should be the terminal)
    const processingModules = pipelineOutput.results.filter((result: any) => 
      result.moduleType && result.moduleType !== 'document-input'
    );
    
    if (processingModules.length > 0) {
      // The last processing module is typically the terminal module
      const lastModule = processingModules[processingModules.length - 1];
      terminalModules.push({
        nodeId: lastModule.nodeId,
        moduleType: lastModule.moduleType,
        hasOutput: !!lastModule.result
      });
      console.log(`Terminal module identified: ${lastModule.moduleType} (${lastModule.nodeId})`);
    }
  }
  
  // Fallback: Check endpoint results (new pipeline system)
  if (terminalModules.length === 0 && pipelineOutput.endpointResults && Array.isArray(pipelineOutput.endpointResults)) {
    console.log(`Fallback: Found ${pipelineOutput.endpointResults.length} endpoint results`);
    
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
  
  // Additional fallback: Check pipeline results for isEndpoint flag
  if (terminalModules.length === 0 && pipelineOutput.pipelineResults) {
    console.log('Final fallback: checking pipeline results for terminal modules');
    
    pipelineOutput.pipelineResults.forEach((result: any) => {
      if (result.isEndpoint && result.nodeId && result.moduleType) {
        terminalModules.push({
          nodeId: result.nodeId,
          moduleType: result.moduleType,
          hasOutput: !!result.result
        });
        console.log(`Terminal module (final fallback): ${result.moduleType} (${result.nodeId})`);
      }
    });
  }
  
  console.log(`Total terminal modules detected: ${terminalModules.length}`);
  return terminalModules;
};
