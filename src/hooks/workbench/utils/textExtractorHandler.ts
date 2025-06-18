
/**
 * Text Extractor Handler
 * 
 * Purpose: Handles text extractor module processing (pass-through behavior)
 */

export const handleTextExtractor = (nodeId: string, inputData: any, startTime: number) => {
  console.log(`Text extractor ${nodeId} operating as pass-through`);
  const processingTime = Date.now() - startTime;
  
  return {
    ...inputData,
    metadata: {
      ...inputData.metadata,
      processingTime,
      passedThrough: true,
      moduleType: 'text-extractor',
      timestamp: new Date().toISOString()
    }
  };
};
