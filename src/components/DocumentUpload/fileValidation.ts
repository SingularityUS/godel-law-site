
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  // Basic file validation
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }
  
  if (!file.name || file.name.trim() === '') {
    return { isValid: false, error: 'File has no name' };
  }
  
  if (typeof file.size !== 'number' || file.size <= 0) {
    return { isValid: false, error: 'Invalid file size' };
  }
  
  // File type validation
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];
  
  if (!file.type || !allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported file type' };
  }
  
  return { isValid: true };
};

export const sanitizeFilename = (filename: string): string => {
  const extensionMatch = filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
  const extension = extensionMatch ? '.' + extensionMatch[1] : '';
  let nameWithoutExt = extension ? filename.slice(0, -extension.length) : filename;
  nameWithoutExt = nameWithoutExt
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return nameWithoutExt + extension;
};
