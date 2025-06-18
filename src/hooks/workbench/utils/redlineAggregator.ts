/**
 * Redline Aggregation System
 * 
 * Purpose: Combines data from multiple pipeline endpoint modules into comprehensive redline documents
 */

import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { convertCitationsToRedline } from "@/utils/redlining/citationToRedline";
import { convertGrammarDataToRedlineSuggestions } from "./grammarTransformUtils";

export interface ModuleDataExtraction {
  nodeId: string;
  moduleType: string;
  hasGrammarData: boolean;
  hasCitationData: boolean;
  grammarAnalysis?: any;
  citationData?: any[];
  originalContent?: string;
  metadata?: any;
}

export class RedlineAggregator {
  
  /**
   * Create comprehensive redline document from multiple endpoint modules
   */
  static createComprehensiveRedline(
    endpointResults: any[], 
    fallbackOutput?: any
  ): RedlineDocument | null {
    console.log('=== REDLINE AGGREGATOR: CREATING COMPREHENSIVE REDLINE ===');
    console.log('Endpoint results count:', endpointResults.length);
    console.log('Endpoint results structure:', endpointResults.map(r => ({
      nodeId: r.nodeId,
      moduleType: r.moduleType,
      hasResult: !!r.result,
      resultKeys: r.result ? Object.keys(r.result) : []
    })));
    
    // Extract data from all endpoint modules
    const moduleExtractions = this.extractDataFromAllModules(endpointResults, fallbackOutput);
    console.log('Module extractions:', moduleExtractions.map(m => ({
      nodeId: m.nodeId,
      moduleType: m.moduleType,
      hasGrammarData: m.hasGrammarData,
      hasCitationData: m.hasCitationData,
      hasOriginalContent: !!m.originalContent
    })));
    
    // Find the best source for original content
    const originalContent = this.extractBestOriginalContent(moduleExtractions, fallbackOutput);
    console.log('Original content extraction result:', {
      found: !!originalContent,
      length: originalContent?.length || 0,
      preview: originalContent ? originalContent.substring(0, 100) + '...' : 'none'
    });
    
    if (!originalContent || originalContent.length === 0) {
      console.warn('No original content available for redline generation');
      return null;
    }
    
    // Combine all suggestions from different modules
    const allSuggestions = this.combineAllSuggestions(moduleExtractions);
    console.log('Combined suggestions result:', {
      totalSuggestions: allSuggestions.length,
      suggestionTypes: allSuggestions.map(s => s.type)
    });
    
    if (allSuggestions.length === 0) {
      console.warn('No suggestions generated from any endpoint modules');
      return null;
    }
    
    // Create the comprehensive redline document
    const redlineDocument: RedlineDocument = {
      id: `comprehensive-redline-${Date.now()}`,
      originalContent,
      currentContent: originalContent,
      suggestions: allSuggestions,
      metadata: {
        fileName: this.extractBestMetadata(moduleExtractions, fallbackOutput)?.fileName || 'Document',
        fileType: this.extractBestMetadata(moduleExtractions, fallbackOutput)?.fileType || 'text/plain',
        lastModified: new Date().toISOString(),
        totalSuggestions: allSuggestions.length,
        acceptedSuggestions: 0,
        rejectedSuggestions: 0,
        sourceModules: moduleExtractions.map(m => m.moduleType)
      },
      positionMap: this.extractBestMetadata(moduleExtractions, fallbackOutput)?.originalPositionMap
    };
    
    console.log('Comprehensive redline document created successfully:', {
      id: redlineDocument.id,
      suggestionCount: redlineDocument.suggestions.length,
      sourceModules: redlineDocument.metadata.sourceModules
    });
    
    return redlineDocument;
  }
  
  /**
   * Extract data from all endpoint modules
   */
  private static extractDataFromAllModules(
    endpointResults: any[], 
    fallbackOutput?: any
  ): ModuleDataExtraction[] {
    const extractions: ModuleDataExtraction[] = [];
    
    // Process each endpoint result
    endpointResults.forEach((result, index) => {
      console.log(`Processing endpoint result ${index}:`, {
        nodeId: result.nodeId,
        moduleType: result.moduleType,
        hasResult: !!result.result
      });
      
      const extraction = this.extractModuleData(result);
      if (extraction) {
        extractions.push(extraction);
        console.log(`Extracted data from ${result.moduleType}:`, {
          hasGrammarData: extraction.hasGrammarData,
          hasCitationData: extraction.hasCitationData,
          hasOriginalContent: !!extraction.originalContent
        });
      }
    });
    
    // If no extractions and we have fallback output, try to extract from it
    if (extractions.length === 0 && fallbackOutput) {
      console.log('No endpoint extractions, trying fallback output');
      const fallbackExtraction = this.extractModuleData({
        nodeId: 'fallback',
        moduleType: 'unknown',
        result: fallbackOutput
      });
      if (fallbackExtraction) {
        extractions.push(fallbackExtraction);
      }
    }
    
    return extractions;
  }
  
  /**
   * Extract data from a single module result
   */
  private static extractModuleData(moduleResult: any): ModuleDataExtraction | null {
    if (!moduleResult || !moduleResult.result) {
      console.warn('No result in module result:', moduleResult);
      return null;
    }
    
    const result = moduleResult.result;
    const extraction: ModuleDataExtraction = {
      nodeId: moduleResult.nodeId || 'unknown',
      moduleType: moduleResult.moduleType || 'unknown',
      hasGrammarData: false,
      hasCitationData: false
    };
    
    console.log(`Extracting data from ${extraction.moduleType} module:`, {
      resultKeys: Object.keys(result),
      hasOutput: !!result.output,
      outputKeys: result.output ? Object.keys(result.output) : []
    });
    
    // Look for grammar analysis data with enhanced detection
    const hasGrammarData = this.findGrammarData(result);
    if (hasGrammarData) {
      extraction.hasGrammarData = true;
      extraction.grammarAnalysis = result;
      console.log(`Found grammar data in ${extraction.moduleType}`);
    }
    
    // Look for citation data
    const citationData = this.findCitationData(result);
    if (citationData && citationData.length > 0) {
      extraction.hasCitationData = true;
      extraction.citationData = citationData;
      console.log(`Found ${citationData.length} citations in ${extraction.moduleType}`);
    }
    
    // Extract original content and metadata
    extraction.originalContent = this.extractOriginalContent(result);
    extraction.metadata = result.metadata || {};
    
    console.log(`Module extraction complete for ${extraction.moduleType}:`, {
      hasGrammarData: extraction.hasGrammarData,
      hasCitationData: extraction.hasCitationData,
      originalContentLength: extraction.originalContent?.length || 0
    });
    
    return extraction;
  }
  
  /**
   * Enhanced grammar data detection
   */
  private static findGrammarData(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    console.log('Checking for grammar data in object:', {
      hasOutput: !!obj.output,
      hasAnalysis: !!obj.output?.analysis,
      analysisIsArray: Array.isArray(obj.output?.analysis),
      analysisLength: obj.output?.analysis?.length || 0,
      hasFinalOutput: !!obj.finalOutput,
      hasDirectAnalysis: !!obj.analysis
    });
    
    // Check multiple paths for analysis data
    const analysisPaths = [
      obj.output?.analysis,
      obj.finalOutput?.output?.analysis,
      obj.analysis,
      obj.result?.output?.analysis
    ];
    
    for (const path of analysisPaths) {
      if (path && Array.isArray(path) && path.length > 0) {
        console.log('Found grammar analysis data:', {
          pathLength: path.length,
          firstItem: path[0]
        });
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Find citation data in any object structure
   */
  private static findCitationData(obj: any): any[] | null {
    if (!obj || typeof obj !== 'object') return null;
    
    // Direct citations array check
    if (obj.citations && Array.isArray(obj.citations) && obj.citations.length > 0) {
      return obj.citations;
    }
    
    // Check nested output
    if (obj.output && obj.output.citations && Array.isArray(obj.output.citations) && obj.output.citations.length > 0) {
      return obj.output.citations;
    }
    
    return null;
  }
  
  /**
   * Extract original content from various possible locations
   */
  private static extractOriginalContent(obj: any): string {
    const contentPaths = [
      obj?.metadata?.originalContent,
      obj?.originalContent,
      obj?.input?.originalContent,
      obj?.input?.content,
      obj?.metadata?.content,
      obj?.content
    ];
    
    for (const path of contentPaths) {
      if (path && typeof path === 'string' && path.length > 0) {
        return path;
      }
    }
    
    return '';
  }
  
  /**
   * Find the best original content from all module extractions
   */
  private static extractBestOriginalContent(
    extractions: ModuleDataExtraction[], 
    fallbackOutput?: any
  ): string {
    // Try to get content from extractions first
    for (const extraction of extractions) {
      if (extraction.originalContent && extraction.originalContent.length > 0) {
        return extraction.originalContent;
      }
    }
    
    // Fallback to output paths
    if (fallbackOutput) {
      return this.extractOriginalContent(fallbackOutput);
    }
    
    return '';
  }
  
  /**
   * Extract the best metadata from all module extractions
   */
  private static extractBestMetadata(
    extractions: ModuleDataExtraction[], 
    fallbackOutput?: any
  ): any {
    for (const extraction of extractions) {
      if (extraction.metadata && Object.keys(extraction.metadata).length > 0) {
        return extraction.metadata;
      }
    }
    
    return fallbackOutput?.metadata || {};
  }
  
  /**
   * Combine suggestions from all modules with enhanced conversion
   */
  private static combineAllSuggestions(extractions: ModuleDataExtraction[]): RedlineSuggestion[] {
    const allSuggestions: RedlineSuggestion[] = [];
    
    extractions.forEach((extraction, index) => {
      console.log(`Processing suggestions for ${extraction.moduleType} (${extraction.nodeId})`);
      
      // Add grammar suggestions using direct conversion
      if (extraction.hasGrammarData && extraction.grammarAnalysis) {
        try {
          const grammarSuggestions = convertGrammarDataToRedlineSuggestions(
            extraction.grammarAnalysis, 
            extraction.nodeId
          );
          allSuggestions.push(...grammarSuggestions);
          console.log(`Added ${grammarSuggestions.length} grammar suggestions from ${extraction.moduleType}`);
        } catch (error) {
          console.error(`Error converting grammar data from ${extraction.moduleType}:`, error);
        }
      }
      
      // Add citation suggestions
      if (extraction.hasCitationData && extraction.citationData) {
        try {
          const citationSuggestions = convertCitationsToRedline(extraction.citationData, extraction.nodeId);
          allSuggestions.push(...citationSuggestions);
          console.log(`Added ${citationSuggestions.length} citation suggestions from ${extraction.moduleType}`);
        } catch (error) {
          console.error(`Error converting citation data from ${extraction.moduleType}:`, error);
        }
      }
    });
    
    console.log(`Total combined suggestions: ${allSuggestions.length}`);
    return allSuggestions;
  }
}
