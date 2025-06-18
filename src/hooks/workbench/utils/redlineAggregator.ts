/**
 * Redline Aggregation System
 * 
 * Purpose: Combines data from multiple pipeline endpoint modules into comprehensive redline documents
 */

import { RedlineDocument, RedlineSuggestion } from "@/types/redlining";
import { convertCitationsToRedline } from "@/utils/redlining/citationToRedline";

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
    console.log('Endpoint results:', endpointResults.length);
    
    // Extract data from all endpoint modules
    const moduleExtractions = this.extractDataFromAllModules(endpointResults, fallbackOutput);
    console.log('Module extractions:', moduleExtractions);
    
    // Find the best source for original content
    const originalContent = this.extractBestOriginalContent(moduleExtractions, fallbackOutput);
    if (!originalContent || originalContent.length === 0) {
      console.warn('No original content available for redline generation');
      return null;
    }
    
    // Combine all suggestions from different modules
    const allSuggestions = this.combineAllSuggestions(moduleExtractions);
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
    endpointResults.forEach(result => {
      const extraction = this.extractModuleData(result);
      if (extraction) {
        extractions.push(extraction);
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
      return null;
    }
    
    const result = moduleResult.result;
    const extraction: ModuleDataExtraction = {
      nodeId: moduleResult.nodeId || 'unknown',
      moduleType: moduleResult.moduleType || 'unknown',
      hasGrammarData: false,
      hasCitationData: false
    };
    
    // Look for grammar analysis data
    const grammarData = this.findGrammarData(result);
    if (grammarData) {
      extraction.hasGrammarData = true;
      extraction.grammarAnalysis = result;
    }
    
    // Look for citation data
    const citationData = this.findCitationData(result);
    if (citationData && citationData.length > 0) {
      extraction.hasCitationData = true;
      extraction.citationData = citationData;
    }
    
    // Extract original content and metadata
    extraction.originalContent = this.extractOriginalContent(result);
    extraction.metadata = result.metadata || {};
    
    return extraction;
  }
  
  /**
   * Find grammar analysis data in any object structure
   */
  private static findGrammarData(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    // Direct analysis array check
    if (obj.analysis && Array.isArray(obj.analysis) && obj.analysis.length > 0) {
      return true;
    }
    
    // Check nested output
    if (obj.output && obj.output.analysis && Array.isArray(obj.output.analysis) && obj.output.analysis.length > 0) {
      return true;
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
   * Combine suggestions from all modules
   */
  private static combineAllSuggestions(extractions: ModuleDataExtraction[]): RedlineSuggestion[] {
    const allSuggestions: RedlineSuggestion[] = [];
    
    extractions.forEach((extraction, index) => {
      // Add grammar suggestions
      if (extraction.hasGrammarData && extraction.grammarAnalysis) {
        try {
          const grammarSuggestions = this.convertGrammarToRedline(extraction.grammarAnalysis, extraction.nodeId);
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
    
    return allSuggestions;
  }
  
  /**
   * Convert grammar analysis to redline suggestions (simplified)
   */
  private static convertGrammarToRedline(grammarResult: any, sourceId: string): RedlineSuggestion[] {
    // This is a simplified version - we'll use the existing transformation logic
    try {
      const { transformGrammarData } = require('@/hooks/redlining/useRedlineDataTransform')();
      const transformed = transformGrammarData(grammarResult);
      return transformed?.suggestions || [];
    } catch (error) {
      console.error('Error in grammar transformation:', error);
      return [];
    }
  }
}
