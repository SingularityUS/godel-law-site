
/**
 * Text Extractor Handler
 * 
 * Purpose: Handles text extractor module processing (deprecated behavior)
 */

export const handleTextExtractor = (nodeId: string, inputData: any, startTime: number) => {
  console.log(`Text extractor ${nodeId} operating as pass-through (deprecated behavior)`);
  const processingTime = Date.now() - startTime;
  
  return {
    ...inputData,
    metadata: {
      ...inputData.metadata,
      processingTime,
      passedThrough: true,
      moduleType: 'text-extractor',
      timestamp: new Date().toISOString(),
      note: 'Text extraction handled by document processor - this module is now pass-through'
    }
  };
};
