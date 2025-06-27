
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
  // Create a proper extended File object that preserves the File prototype
  const uploadedFile = file as UploadedFile;
  
  // Add the additional properties we need
  uploadedFile.preview = fileUrl;
  uploadedFile.extractedText = extractedText || '';
  uploadedFile.anchoredText = anchoredText || '';
  uploadedFile.anchorCount = anchorCount || 0;
  
  return uploadedFile;
};
