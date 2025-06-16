/**
 * useDataFlow Hook
 * 
 * Purpose: Manages data flowing through the AI workbench pipeline
 * This hook simulates and tracks data as it flows between nodes,
 * generating mock data based on module types for preview purposes.
 * 
 * Key Responsibilities:
 * - Generate mock data based on node/module types
 * - Track data state for each edge connection
 * - Provide data transformation simulation
 * - Handle data flow updates when nodes change
 */

import { useState, useCallback, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { ModuleKind } from "@/data/modules";

interface DataFlowState {
  [edgeId: string]: {
    inputData: any;
    outputData: any;
    dataType: 'text' | 'json' | 'binary' | 'error';
    isProcessing: boolean;
  };
}

export const useDataFlow = (nodes: Node[], edges: Edge[]) => {
  const [dataFlowState, setDataFlowState] = useState<DataFlowState>({});

  /**
   * Generate mock data based on module type
   */
  const generateMockData = useCallback((moduleType: ModuleKind | 'document-input', isInput = false) => {
    if (moduleType === 'document-input') {
      return {
        type: 'document',
        content: 'Sample document content for processing with multiple paragraphs and various formatting elements...',
        metadata: { 
          pages: 3, 
          wordCount: 150,
          fileSize: '2.3MB',
          createdAt: '2024-01-15T10:30:00Z',
          author: 'John Doe',
          language: 'en-US'
        },
        structure: {
          headers: ['Introduction', 'Main Content', 'Conclusion'],
          paragraphs: 12,
          images: 3,
          tables: 1
        }
      };
    }

    switch (moduleType) {
      case 'text-extractor':
        return isInput 
          ? { 
              type: 'document', 
              content: 'PDF document content with embedded images and complex formatting...',
              binary: new Array(1000).fill(0).map(() => Math.floor(Math.random() * 255))
            }
          : { 
              extractedText: 'Extracted text from document with preserved formatting and structure. This includes multiple paragraphs with various content types...',
              confidence: 0.952,
              metadata: {
                extractionTime: 2.4,
                charactersExtracted: 15420,
                errorRate: 0.003
              },
              structure: {
                paragraphs: [
                  { id: 1, text: 'First paragraph with introduction...', confidence: 0.98 },
                  { id: 2, text: 'Second paragraph with main content...', confidence: 0.94 },
                  { id: 3, text: 'Third paragraph with conclusions...', confidence: 0.97 }
                ],
                images: [
                  { id: 'img1', description: 'Chart showing data trends', ocrText: 'Revenue: $2.5M' },
                  { id: 'img2', description: 'Company logo', ocrText: 'ACME Corp' }
                ]
              }
            };
      
      case 'paragraph-splitter':
        return isInput
          ? { 
              extractedText: 'Long text content with multiple paragraphs that need to be split and processed individually for better analysis...',
              metadata: { totalLength: 5847, estimatedParagraphs: 8 }
            }
          : { 
              paragraphs: [
                'First paragraph containing introduction and overview of the topic...',
                'Second paragraph with detailed analysis and key findings...',
                'Third paragraph discussing methodology and approach...',
                'Fourth paragraph presenting results and conclusions...'
              ],
              count: 4,
              statistics: {
                averageLength: 156,
                totalWords: 624,
                readabilityScore: 7.2
              },
              metadata: {
                processingTime: 0.8,
                splitCriteria: 'semantic_boundaries',
                confidence: 0.91
              }
            };
      
      case 'grammar-checker':
        return isInput
          ? { 
              paragraphs: ['Text with various grammatical errors that need correction and improvement...'],
              settings: { strictness: 'high', language: 'en-US' }
            }
          : { 
              corrections: [
                { 
                  original: 'Text with errors that needs fixing...',
                  corrected: 'Text with errors that need fixing...',
                  suggestions: 2,
                  confidence: 0.95,
                  errorType: 'subject_verb_agreement'
                }
              ],
              summary: {
                totalErrors: 12,
                corrected: 10,
                suggestions: 2,
                improvementScore: 0.83
              },
              statistics: {
                grammarScore: 8.5,
                readabilityImprovement: 1.2,
                processingTime: 1.5
              }
            };
      
      case 'citation-finder':
        return isInput
          ? { 
              paragraphs: ['Text containing various citations and references that need to be identified and extracted...'],
              citationFormats: ['APA', 'MLA', 'Chicago']
            }
          : { 
              citations: [
                { 
                  text: 'Smith et al. (2023) found significant correlations...',
                  source: 'Academic paper',
                  format: 'APA',
                  confidence: 0.92,
                  location: { paragraph: 2, position: 45 }
                },
                {
                  text: 'According to Johnson (2022), the methodology...',
                  source: 'Journal article',
                  format: 'APA', 
                  confidence: 0.88,
                  location: { paragraph: 3, position: 12 }
                }
              ],
              statistics: {
                totalFound: 15,
                verified: 12,
                needsVerification: 3,
                averageConfidence: 0.89
              }
            };
      
      case 'citation-verifier':
        return isInput
          ? { 
              citations: ['Smith, J. (2023). Research Methods in AI. Journal of Technology, 15(3), 123-145.'],
              databases: ['PubMed', 'IEEE', 'ACM Digital Library']
            }
          : { 
              verified: [
                { 
                  citation: 'Smith, J. (2023). Research Methods in AI. Journal of Technology, 15(3), 123-145.',
                  isValid: true,
                  confidence: 0.94,
                  source: 'IEEE Xplore',
                  doi: '10.1109/JTech.2023.123456',
                  verificationDetails: {
                    authorExists: true,
                    journalExists: true,
                    dateValid: true,
                    pageNumbersValid: true
                  }
                }
              ],
              statistics: {
                totalVerified: 12,
                validCitations: 10,
                invalidCitations: 2,
                averageConfidence: 0.91,
                verificationTime: 45.2
              }
            };
      
      case 'style-guide-enforcer':
        return isInput
          ? { 
              text: 'Text that needs style checking and formatting according to specific guidelines...',
              styleGuide: 'APA 7th Edition',
              checkTypes: ['formatting', 'citations', 'references']
            }
          : { 
              styleChecked: 'Style-corrected text with proper formatting, consistent citation style, and improved readability...',
              violations: [
                {
                  type: 'formatting',
                  description: 'Inconsistent heading levels',
                  severity: 'medium',
                  location: 'Section 2.1',
                  suggestion: 'Use proper heading hierarchy'
                }
              ],
              improvements: {
                formattingScore: 9.2,
                consistencyScore: 8.8,
                compliancePercentage: 94.5
              }
            };
      
      case 'custom':
        return isInput
          ? { 
              input: 'Custom input data with complex nested structures and various data types...',
              configuration: {
                processingMode: 'advanced',
                options: { enableCaching: true, timeout: 30000 },
                metadata: { version: '2.1.0', apiKey: 'xxx-xxx-xxx' }
              }
            }
          : { 
              output: 'Custom processed data with transformed content and enhanced metadata...',
              customField: 'transformed_value',
              results: {
                processingTime: 12.3,
                memoryUsed: '45MB',
                cacheHits: 8,
                cacheMisses: 2
              },
              analysis: {
                complexity: 'high',
                accuracy: 0.967,
                recommendations: ['optimize_caching', 'reduce_memory_usage']
              }
            };
      
      default:
        return { 
          data: 'Processed data with enhanced formatting and structure...',
          timestamp: new Date().toISOString(),
          metadata: {
            processingDuration: Math.random() * 10,
            confidence: 0.8 + Math.random() * 0.2,
            version: '1.0.0'
          },
          statistics: {
            inputSize: Math.floor(Math.random() * 10000),
            outputSize: Math.floor(Math.random() * 8000),
            compressionRatio: 0.7 + Math.random() * 0.3
          }
        };
    }
  }, []);

  /**
   * Update data flow when edges or nodes change
   */
  useEffect(() => {
    const newDataFlowState: DataFlowState = {};

    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        const sourceModuleType = sourceNode.data?.moduleType as ModuleKind | 'document-input';
        const targetModuleType = targetNode.data?.moduleType as ModuleKind | 'document-input';

        const outputData = generateMockData(sourceModuleType, false);
        const inputData = generateMockData(targetModuleType, true);

        newDataFlowState[edge.id] = {
          inputData,
          outputData,
          dataType: typeof outputData === 'string' ? 'text' : 'json',
          isProcessing: false
        };
      }
    });

    setDataFlowState(newDataFlowState);
  }, [nodes, edges, generateMockData]);

  /**
   * Get data for a specific edge
   */
  const getEdgeData = useCallback((edgeId: string) => {
    return dataFlowState[edgeId] || null;
  }, [dataFlowState]);

  /**
   * Simulate data processing
   */
  const simulateProcessing = useCallback((edgeId: string) => {
    setDataFlowState(prev => ({
      ...prev,
      [edgeId]: {
        ...prev[edgeId],
        isProcessing: true
      }
    }));

    // Simulate processing delay
    setTimeout(() => {
      setDataFlowState(prev => ({
        ...prev,
        [edgeId]: {
          ...prev[edgeId],
          isProcessing: false
        }
      }));
    }, 1000);
  }, []);

  return {
    dataFlowState,
    getEdgeData,
    simulateProcessing
  };
};
