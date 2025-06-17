
/**
 * General Response Parser Utility
 * 
 * Purpose: Handles generic JSON parsing with fallback strategies and proper type validation
 */

export const parseJsonResponse = (response: any, moduleType: string): any => {
  console.log(`Parsing JSON response for ${moduleType}, type: ${typeof response}, length: ${typeof response === 'string' ? response.length : 'N/A'}`);
  
  // Handle non-string responses
  let responseString: string;
  if (typeof response === 'string') {
    responseString = response;
  } else if (response && typeof response === 'object') {
    // If response is already an object, return it directly
    console.log(`Response is already an object for ${moduleType}, returning directly`);
    return response;
  } else if (response === null || response === undefined) {
    console.error(`Response is null/undefined for ${moduleType}`);
    return { error: `No response received for ${moduleType}` };
  } else {
    // Convert to string as fallback
    responseString = String(response);
    console.warn(`Converting non-string response to string for ${moduleType}`);
  }
  
  // Try direct JSON parsing first
  try {
    const parsed = JSON.parse(responseString);
    console.log(`Direct JSON parsing successful for ${moduleType}`);
    return parsed;
  } catch (error) {
    console.warn(`Direct JSON parsing failed for ${moduleType}, attempting extraction`);
  }

  // Try to extract JSON from text response
  try {
    // Look for JSON blocks in the response with enhanced patterns
    const jsonPatterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```\s*([\s\S]*?)\s*```/,
      /\{[\s\S]*?\}/,
      /\[[\s\S]*?\]/
    ];
    
    for (const pattern of jsonPatterns) {
      const jsonMatch = responseString.match(pattern);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        try {
          const parsed = JSON.parse(jsonString.trim());
          console.log(`JSON extraction successful for ${moduleType}`);
          return parsed;
        } catch (parseError) {
          console.warn(`Failed to parse extracted JSON for ${moduleType}:`, parseError);
          continue;
        }
      }
    }
  } catch (error) {
    console.warn(`JSON extraction failed for ${moduleType}`);
  }

  // Return the original response as fallback with error indication
  console.log(`Using raw text response for ${moduleType} (parsing failed)`);
  return {
    rawResponse: responseString,
    parseError: true,
    moduleType: moduleType
  };
};
