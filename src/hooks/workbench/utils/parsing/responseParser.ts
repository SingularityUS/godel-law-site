
/**
 * General Response Parser Utility
 * 
 * Purpose: Handles generic JSON parsing with fallback strategies
 */

export const parseJsonResponse = (response: string, moduleType: string): any => {
  console.log(`Parsing JSON response for ${moduleType}, length: ${response.length}`);
  
  // Try direct JSON parsing first
  try {
    const parsed = JSON.parse(response);
    console.log(`Direct JSON parsing successful for ${moduleType}`);
    return parsed;
  } catch (error) {
    console.warn(`Direct JSON parsing failed for ${moduleType}, attempting extraction`);
  }

  // Try to extract JSON from text response
  try {
    // Look for JSON blocks in the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                     response.match(/\{[\s\S]*\}/) ||
                     response.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonString.trim());
      console.log(`JSON extraction successful for ${moduleType}`);
      return parsed;
    }
  } catch (error) {
    console.warn(`JSON extraction failed for ${moduleType}`);
  }

  // Return the original response as fallback
  console.log(`Using raw text response for ${moduleType}`);
  return response;
};
