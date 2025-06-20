
/**
 * Terminal Module Detector
 * 
 * Purpose: Detects terminal modules that can generate redline suggestions
 */

export interface TerminalModule {
  moduleType: string;
  nodeId: string;
}

/**
 * List of module types that can generate redline suggestions
 */
const REDLINE_CAPABLE_MODULES = [
  'grammar-analysis',
  'citation-finder',
  'legal-analysis',
  'style-checker'
];

export const detectTerminalModules = (pipelineOutput: any): TerminalModule[] => {
  console.log('=== DETECTING TERMINAL MODULES ===');
  console.log('Pipeline output structure:', {
    hasResults: !!pipelineOutput.results,
    hasPipelineResults: !!pipelineOutput.pipelineResults,
    hasEndpointResults: !!pipelineOutput.endpointResults,
    keys: Object.keys(pipelineOutput)
  });
  
  const terminalModules: TerminalModule[] = [];
  
  // Check pipeline results for redline-capable modules
  const pipelineResults = pipelineOutput.pipelineResults || pipelineOutput.results || [];
  console.log(`Checking ${pipelineResults.length} pipeline results`);
  
  pipelineResults.forEach((result: any) => {
    console.log(`Checking result:`, {
      nodeId: result.nodeId,
      moduleType: result.moduleType,
      hasResult: !!result.result,
      hasOutput: !!result.result?.output
    });
    
    if (REDLINE_CAPABLE_MODULES.includes(result.moduleType)) {
      console.log(`Found redline-capable module: ${result.moduleType} (${result.nodeId})`);
      
      // Verify the module has actual data to process
      let hasData = false;
      
      if (result.moduleType === 'grammar-analysis') {
        hasData = !!(result.result?.output?.issues && result.result.output.issues.length > 0);
      } else if (result.moduleType === 'citation-finder') {
        hasData = !!(result.result?.output?.citations && result.result.output.citations.length > 0);
      } else {
        // For other modules, check if result exists
        hasData = !!(result.result && result.result.output);
      }
      
      if (hasData) {
        terminalModules.push({
          moduleType: result.moduleType,
          nodeId: result.nodeId
        });
        console.log(`Added terminal module: ${result.moduleType} (${result.nodeId})`);
      } else {
        console.log(`Module ${result.moduleType} has no data to process`);
      }
    } else {
      console.log(`Module ${result.moduleType} is not redline-capable`);
    }
  });
  
  // Also check endpoint results if available
  const endpointResults = pipelineOutput.endpointResults || [];
  console.log(`Checking ${endpointResults.length} endpoint results`);
  
  endpointResults.forEach((result: any) => {
    if (REDLINE_CAPABLE_MODULES.includes(result.moduleType)) {
      // Check if we haven't already added this module
      const alreadyExists = terminalModules.some(tm => tm.nodeId === result.nodeId);
      if (!alreadyExists) {
        console.log(`Found additional terminal module in endpoints: ${result.moduleType} (${result.nodeId})`);
        terminalModules.push({
          moduleType: result.moduleType,
          nodeId: result.nodeId
        });
      }
    }
  });
  
  console.log(`Detected ${terminalModules.length} terminal modules:`, terminalModules);
  return terminalModules;
};
