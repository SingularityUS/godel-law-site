
export type UploadedFile = File & { 
  preview?: string; 
  extractedText?: string;
  anchoredText?: string; 
  anchorCount?: number; 
};

export const createSafeFileObject = (
  file: File, 
  fileUrl: string, 
  extractedText?: string, 
  anchoredText?: string, 
  anchorCount?: number
): UploadedFile => {
  // Create a new object that extends the file with additional properties
  const uploadedFile = Object.create(file) as UploadedFile;
  
  // Add the additional properties we need
  uploadedFile.preview = fileUrl;
  uploadedFile.extractedText = extractedText || '';
  uploadedFile.anchoredText = anchoredText || '';
  uploadedFile.anchorCount = anchorCount || 0;
  
  return uploadedFile;
};
