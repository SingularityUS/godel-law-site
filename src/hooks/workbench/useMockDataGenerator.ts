
/**
 * useMockDataGenerator Hook
 * 
 * Purpose: Generates mock data for different module types with optional ChatGPT integration
 * Provides realistic test data for workflow preview and testing
 */

import { useCallback } from "react";
import { ModuleKind } from "@/data/modules";
import { useChatGPTApi } from "./useChatGPTApi";

export const useMockDataGenerator = () => {
  const { callChatGPT } = useChatGPTApi();

  /**
   * Generate enhanced mock data with potential ChatGPT integration
   */
  const generateMockData = useCallback(async (moduleType: ModuleKind | 'document-input', isInput = false, useRealChatGPT = false, customPrompt?: string) => {
    // Enhanced mock data for modules
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

      case 'legal-summary':
      case 'legal-qa':
      case 'contract-analyzer':
      case 'legal-translator':
      case 'legal-researcher':
      case 'clause-identifier':
      case 'risk-assessor':
      case 'compliance-checker':
        // Use real ChatGPT for legal modules if available and requested
        if (useRealChatGPT) {
          const inputText = "Sample legal document content for analysis...";
          const systemPrompt = typeof customPrompt === 'string' ? customPrompt : `You are a legal AI assistant specialized in ${moduleType.replace('-', ' ')}.`;
          
          try {
            const chatGPTResponse = await callChatGPT(inputText, systemPrompt);
            
            return {
              legalAnalysis: chatGPTResponse.response || chatGPTResponse.error,
              model: chatGPTResponse.model || 'gpt-4o-mini',
              usage: chatGPTResponse.usage || { total_tokens: 0 },
              processingTime: chatGPTResponse.processingTime || 0,
              timestamp: chatGPTResponse.timestamp,
              isRealResponse: !chatGPTResponse.error,
              error: chatGPTResponse.error || null,
              moduleType: moduleType
            };
          } catch (error) {
            console.error('ChatGPT processing failed:', error);
          }
        }

        // Fallback to mock data for legal modules
        return { 
          legalAnalysis: `Mock ${moduleType.replace('-', ' ')} analysis with comprehensive legal insights and professional recommendations...`,
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
          },
          moduleType: moduleType
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

  return { generateMockData };
};
