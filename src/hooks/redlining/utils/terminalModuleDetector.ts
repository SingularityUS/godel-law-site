
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
 * Detect terminal modules from pipeline output with enhanced robustness
 */
export const detectTerminalModules = (pipelineOutput: any): TerminalModule[] => {
  console.log('=== DETECTING TERMINAL MODULES (Enhanced) ===');
  console.log('Pipeline output structure:', {
    hasResults: !!pipelineOutput.results,
    resultsLength: pipelineOutput.results?.length || 0,
    hasEndpointResults: !!pipelineOutput.endpointResults,
    endpointResultsLength: pipelineOutput.endpointResults?.length || 0,
    hasPipelineResults: !!pipelineOutput.pipelineResults,
    pipelineResultsLength: pipelineOutput.pipelineResults?.length || 0,
    outputKeys: Object.keys(pipelineOutput || {})
  });
  
  const terminalModules: TerminalModule[] = [];
  
  // Try multiple data sources in order of preference
  const dataSources = [
    { name: 'endpointResults', data: pipelineOutput.endpointResults },
    { name: 'results', data: pipelineOutput.results },
    { name: 'pipelineResults', data: pipelineOutput.pipelineResults }
  ];
  
  for (const source of dataSources) {
    if (source.data && Array.isArray(source.data) && source.data.length > 0) {
      console.log(`Using ${source.name} for terminal module detection (${source.data.length} items)`);
      
      // Filter out document-input modules and find processing endpoints
      const processingModules = source.data.filter((result: any) => 
        result.moduleType && 
        result.moduleType !== 'document-input' && 
        result.nodeId &&
        result.result // Must have actual result data
      );
      
      if (processingModules.length > 0) {
        // For 'results' array, take the last processing module (terminal)
        if (source.name === 'results') {
          const lastModule = processingModules[processingModules.length - 1];
          terminalModules.push({
            nodeId: lastModule.nodeId,
            moduleType: lastModule.moduleType,
            hasOutput: !!lastModule.result
          });
          console.log(`Terminal module from ${source.name}: ${lastModule.moduleType} (${lastModule.nodeId})`);
        }
        // For endpoint arrays, take all modules
        else {
          processingModules.forEach((result: any) => {
            terminalModules.push({
              nodeId: result.nodeId,
              moduleType: result.moduleType,
              hasOutput: !!result.result
            });
            console.log(`Terminal module from ${source.name}: ${result.moduleType} (${result.nodeId})`);
          });
        }
        
        break; // Use first successful source
      }
    }
  }
  
  console.log(`Total terminal modules detected: ${terminalModules.length}`);
  return terminalModules;
};
