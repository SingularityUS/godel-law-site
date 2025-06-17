/**
 * useDataFlow Hook
 * 
 * Purpose: Manages data flowing through the AI workbench pipeline
 * This hook simulates and tracks data as it flows between nodes,
 * generating mock data based on module types for preview purposes.
 * Now includes ChatGPT integration for enhanced processing capabilities.
 */

import { useState, useCallback, useEffect } from "react";
import { Node, Edge } from "@xyflow/react";
import { ModuleKind } from "@/data/modules";
import { supabase } from "@/integrations/supabase/client";
import { useChatGPTTokens } from "@/hooks/useChatGPTTokens";

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
  const { addTokens } = useChatGPTTokens();

  /**
   * Call ChatGPT API through Supabase Edge Function
   */
  const callChatGPT = useCallback(async (prompt: string, systemPrompt?: string, model = 'gpt-4o-mini') => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-gpt', {
        body: {
          prompt,
          systemPrompt,
          model,
          maxTokens: 2000
        }
      });

      if (error) throw error;
      
      // Track token usage
      if (data.usage && data.usage.total_tokens) {
        addTokens(data.usage.total_tokens);
      }
      
      return data;
    } catch (error: any) {
      console.error('ChatGPT API call failed:', error);
      return {
        error: error.message || 'ChatGPT processing failed',
        timestamp: new Date().toISOString()
      };
    }
  }, [addTokens]);

  
  /**
   * Generate enhanced mock data with potential ChatGPT integration
   */
  const generateMockData = useCallback(async (moduleType: ModuleKind | 'document-input', isInput = false, useRealChatGPT = false, customPrompt?: string) => {
    // For ChatGPT Assistant module, always use real API if available
    if (moduleType === 'chatgpt-assistant' && !isInput && useRealChatGPT) {
      const inputText = "Sample input data for ChatGPT processing...";
      const systemPrompt = typeof customPrompt === 'string' ? customPrompt : "You are a helpful AI assistant that processes and analyzes content.";
      
      const chatGPTResponse = await callChatGPT(inputText, systemPrompt);
      
      return {
        chatgptResponse: chatGPTResponse.response || chatGPTResponse.error,
        model: chatGPTResponse.model || 'gpt-4o-mini',
        usage: chatGPTResponse.usage || { total_tokens: 0 },
        processingTime: chatGPTResponse.processingTime || 0,
        timestamp: chatGPTResponse.timestamp,
        isRealResponse: !chatGPTResponse.error,
        error: chatGPTResponse.error || null
      };
    }

    // Enhanced mock data for other modules
    if (moduleType === 'document-input') {
      return {
        type: 'document',
        content: 'Advanced document content with complex structure, multiple sections, embedded data, and comprehensive metadata for AI processing...',
        metadata: { 
          pages: 5, 
          wordCount: 2847,
          fileSize: '4.2MB',
          createdAt: '2024-01-15T10:30:00Z',
          author: 'Dr. Sarah Johnson',
          language: 'en-US',
          documentType: 'research_paper'
        },
        structure: {
          headers: ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion'],
          paragraphs: 28,
          images: 7,
          tables: 4,
          citations: 45
        },
        aiProcessingReady: true
      };
    }

    switch (moduleType) {
      case 'text-extractor':
        return isInput 
          ? { 
              type: 'document', 
              content: 'Complex PDF document with advanced formatting, embedded images, tables, and multi-column layouts requiring sophisticated extraction...',
              binary: new Array(2000).fill(0).map(() => Math.floor(Math.random() * 255)),
              extractionChallenges: ['embedded_images', 'complex_tables', 'multi_column_layout']
            }
          : { 
              extractedText: 'Professionally extracted text maintaining document structure and semantic meaning. Advanced OCR and layout analysis preserved formatting hierarchy and content relationships...',
              confidence: 0.97,
              metadata: {
                extractionTime: 3.8,
                charactersExtracted: 28420,
                errorRate: 0.001,
                aiEnhanced: true
              },
              structure: {
                paragraphs: [
                  { id: 1, text: 'Executive summary with key findings and strategic recommendations...', confidence: 0.99, aiProcessed: true },
                  { id: 2, text: 'Detailed methodology section with comprehensive analytical framework...', confidence: 0.96, aiProcessed: true },
                  { id: 3, text: 'Results and implications with statistical significance testing...', confidence: 0.98, aiProcessed: true }
                ],
                images: [
                  { id: 'img1', description: 'Advanced data visualization showing trend analysis', ocrText: 'Q4 Revenue Growth: +23.5%', aiDescription: 'Bar chart with quarterly progression' },
                  { id: 'img2', description: 'Corporate organizational structure diagram', ocrText: 'Executive Leadership Team', aiDescription: 'Hierarchical flowchart with roles' }
                ]
              },
              chatgptEnhanced: useRealChatGPT
            };
      
      case 'paragraph-splitter':
        return isInput
          ? { 
              extractedText: 'Comprehensive text content with complex paragraph structures, nested ideas, and intricate logical relationships requiring intelligent segmentation for optimal processing...',
              metadata: { totalLength: 12847, estimatedParagraphs: 18, complexity: 'high' }
            }
          : { 
              paragraphs: [
                'Introduction paragraph establishing context and research objectives with clear thesis statement and methodological overview...',
                'Literature review section synthesizing current research trends and identifying knowledge gaps in the field...',
                'Methodology paragraph detailing experimental design, data collection procedures, and analytical frameworks...',
                'Results section presenting quantitative findings with statistical significance and confidence intervals...',
                'Discussion paragraph interpreting results within broader theoretical context and practical implications...',
                'Conclusion summarizing key contributions and suggesting directions for future research endeavors...'
              ],
              count: 6,
              statistics: {
                averageLength: 287,
                totalWords: 1722,
                readabilityScore: 8.4,
                complexity: 'academic',
                aiOptimized: true
              },
              metadata: {
                processingTime: 1.2,
                splitCriteria: 'semantic_ai_boundaries',
                confidence: 0.94,
                chatgptEnhanced: useRealChatGPT
              }
            };
      
      case 'grammar-checker':
        return isInput
          ? { 
              paragraphs: ['Academic text requiring comprehensive grammatical analysis, style refinement, and clarity enhancement for publication-ready quality...'],
              settings: { strictness: 'academic', language: 'en-US', style: 'formal' }
            }
          : { 
              corrections: [
                { 
                  original: 'The data shows significant correlations between variables that was unexpected...',
                  corrected: 'The data show significant correlations between variables that were unexpected...',
                  suggestions: 3,
                  confidence: 0.97,
                  errorType: 'subject_verb_agreement',
                  explanation: 'Data is plural, requiring plural verb forms'
                },
                {
                  original: 'The methodology utilized advanced statistical techniques for analyzing complex datasets.',
                  corrected: 'The methodology used advanced statistical techniques to analyze complex datasets.',
                  suggestions: 2,
                  confidence: 0.93,
                  errorType: 'wordiness',
                  explanation: 'Simplified for clarity and conciseness'
                }
              ],
              summary: {
                totalErrors: 18,
                corrected: 16,
                suggestions: 4,
                improvementScore: 0.89,
                aiEnhanced: true
              },
              statistics: {
                grammarScore: 9.2,
                readabilityImprovement: 2.1,
                processingTime: 2.3,
                chatgptEnhanced: useRealChatGPT
              }
            };
      
      case 'citation-finder':
        return isInput
          ? { 
              paragraphs: ['Research text containing diverse citation formats, academic references, and bibliographic entries requiring comprehensive identification and extraction...'],
              citationFormats: ['APA', 'MLA', 'Chicago', 'IEEE']
            }
          : { 
              citations: [
                { 
                  text: 'Johnson et al. (2024) demonstrated significant improvements in AI-assisted document processing...',
                  source: 'Peer-reviewed journal article',
                  format: 'APA',
                  confidence: 0.96,
                  location: { paragraph: 2, position: 67 },
                  aiVerified: true
                },
                {
                  text: 'According to Smith and Williams (2023), machine learning approaches show promise...',
                  source: 'Conference proceedings',
                  format: 'APA', 
                  confidence: 0.91,
                  location: { paragraph: 4, position: 23 },
                  aiVerified: true
                }
              ],
              statistics: {
                totalFound: 28,
                verified: 25,
                needsVerification: 3,
                averageConfidence: 0.92,
                aiEnhanced: true,
                chatgptEnhanced: useRealChatGPT
              }
            };
      
      case 'citation-verifier':
        return isInput
          ? { 
              citations: ['Johnson, A., Smith, B., & Davis, C. (2024). AI-Enhanced Document Processing: A Comprehensive Analysis. Journal of Information Technology, 28(4), 234-267.'],
              databases: ['PubMed', 'IEEE Xplore', 'ACM Digital Library', 'Google Scholar']
            }
          : { 
              verified: [
                { 
                  citation: 'Johnson, A., Smith, B., & Davis, C. (2024). AI-Enhanced Document Processing: A Comprehensive Analysis. Journal of Information Technology, 28(4), 234-267.',
                  isValid: true,
                  confidence: 0.97,
                  source: 'IEEE Xplore Digital Library',
                  doi: '10.1109/JIT.2024.987654',
                  verificationDetails: {
                    authorExists: true,
                    journalExists: true,
                    dateValid: true,
                    pageNumbersValid: true,
                    doiResolvable: true
                  },
                  aiVerified: true
                }
              ],
              statistics: {
                totalVerified: 25,
                validCitations: 23,
                invalidCitations: 2,
                averageConfidence: 0.94,
                verificationTime: 67.8,
                aiEnhanced: true,
                chatgptEnhanced: useRealChatGPT
              }
            };
      
      case 'style-guide-enforcer':
        return isInput
          ? { 
              text: 'Academic manuscript requiring comprehensive style guide compliance checking and formatting standardization according to publication requirements...',
              styleGuide: 'APA 7th Edition',
              checkTypes: ['formatting', 'citations', 'references', 'structure']
            }
          : { 
              styleChecked: 'Style-corrected manuscript with comprehensive formatting compliance, consistent citation styling, proper heading hierarchy, and enhanced academic readability...',
              violations: [
                {
                  type: 'formatting',
                  description: 'Inconsistent heading levels in sections 2.1-2.3',
                  severity: 'medium',
                  location: 'Methodology section',
                  suggestion: 'Apply proper APA heading hierarchy (Level 1-5)',
                  aiCorrected: true
                },
                {
                  type: 'citations',
                  description: 'Missing page numbers for direct quotes',
                  severity: 'high',
                  location: 'Literature Review',
                  suggestion: 'Add page numbers: (Author, Year, p. XX)',
                  aiCorrected: true
                }
              ],
              improvements: {
                formattingScore: 9.4,
                consistencyScore: 9.1,
                compliancePercentage: 96.8,
                aiEnhanced: true,
                chatgptEnhanced: useRealChatGPT
              }
            };
      
      case 'chatgpt-assistant':
        return isInput
          ? { 
              input: 'Complex input data requiring AI analysis and intelligent processing with contextual understanding...',
              configuration: {
                processingMode: 'intelligent_analysis',
                options: { enableChatGPT: true, model: 'gpt-4o-mini', maxTokens: 2000 },
                metadata: { version: '3.0.0', apiIntegration: 'openai' }
              }
            }
          : { 
              output: 'AI-generated analysis with comprehensive insights, structured recommendations, and intelligent content processing...',
              aiResponse: 'Based on the input data, I have identified several key patterns and provided detailed analysis with actionable recommendations for optimization.',
              results: {
                processingTime: 4.7,
                tokensUsed: 1247,
                model: 'gpt-4o-mini',
                confidence: 0.92
              },
              analysis: {
                complexity: 'high',
                accuracy: 0.94,
                recommendations: ['implement_ai_optimization', 'enhance_data_structure', 'improve_processing_workflow'],
                chatgptEnhanced: true
              }
            };
      
      case 'custom':
        return isInput
          ? { 
              input: 'Custom input data with flexible structure for specialized AI processing and analysis...',
              configuration: {
                processingMode: 'custom_advanced',
                options: { enableChatGPT: true, customLogic: true, timeout: 45000 },
                metadata: { version: '2.5.0', customization: 'user_defined' }
              }
            }
          : { 
              output: 'Custom processed output with specialized transformations and AI-enhanced analysis tailored to specific requirements...',
              customField: 'ai_enhanced_value',
              results: {
                processingTime: 15.8,
                memoryUsed: '78MB',
                cacheHits: 12,
                cacheMisses: 3,
                aiProcessed: true
              },
              analysis: {
                complexity: 'very_high',
                accuracy: 0.96,
                recommendations: ['optimize_ai_processing', 'implement_caching', 'enhance_performance'],
                chatgptEnhanced: useRealChatGPT
              }
            };
      
      default:
        return { 
          data: 'Advanced processed data with AI-enhanced formatting, intelligent analysis, and structured insights...',
          timestamp: new Date().toISOString(),
          metadata: {
            processingDuration: Math.random() * 15,
            confidence: 0.85 + Math.random() * 0.15,
            version: '2.0.0',
            aiEnhanced: true
          },
          statistics: {
            inputSize: Math.floor(Math.random() * 25000),
            outputSize: Math.floor(Math.random() * 20000),
            compressionRatio: 0.75 + Math.random() * 0.25,
            chatgptEnhanced: useRealChatGPT
          }
        };
    }
  }, [callChatGPT]);

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

        // For now, use mock data. Real ChatGPT integration will be triggered on demand
        const outputData = generateMockData(sourceModuleType, false, false);
        const inputData = generateMockData(targetModuleType, true, false);

        // Handle promises from async generateMockData
        Promise.all([outputData, inputData]).then(([output, input]) => {
          newDataFlowState[edge.id] = {
            inputData: input,
            outputData: output,
            dataType: typeof output === 'string' ? 'text' : 'json',
            isProcessing: false
          };
        });
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
   * Simulate data processing with real ChatGPT integration
   */
  const simulateProcessing = useCallback(async (edgeId: string) => {
    const edgeData = dataFlowState[edgeId];
    if (!edgeData) return;

    setDataFlowState(prev => ({
      ...prev,
      [edgeId]: {
        ...prev[edgeId],
        isProcessing: true
      }
    }));

    // Find the target node to determine if it should use ChatGPT
    const edge = edges.find(e => e.id === edgeId);
    const targetNode = edge ? nodes.find(n => n.id === edge.target) : null;
    const moduleType = targetNode?.data?.moduleType as ModuleKind;
    const customPrompt = targetNode?.data?.promptOverride;

    // Simulate processing delay
    setTimeout(async () => {
      let enhancedOutput = edgeData.outputData;

      // Use real ChatGPT for supported modules
      if (moduleType === 'chatgpt-assistant' || (targetNode?.data?.supportsChatGPT && Math.random() > 0.5)) {
        try {
          // Ensure customPrompt is properly typed as string or undefined
          const promptOverride = typeof customPrompt === 'string' ? customPrompt : undefined;
          enhancedOutput = await generateMockData(moduleType, false, true, promptOverride);
        } catch (error) {
          console.error('ChatGPT processing failed:', error);
        }
      }

      setDataFlowState(prev => ({
        ...prev,
        [edgeId]: {
          ...prev[edgeId],
          outputData: enhancedOutput,
          isProcessing: false
        }
      }));
    }, 2000);
  }, [dataFlowState, edges, nodes, generateMockData]);

  return {
    dataFlowState,
    getEdgeData,
    simulateProcessing,
    callChatGPT
  };
};
