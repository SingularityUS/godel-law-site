
import { supabase } from "@/integrations/supabase/client";
import { extractDocumentText } from "@/hooks/workbench/utils/documentProcessor";
import { sanitizeFilename } from "./fileValidation";
import { createSafeFileObject, UploadedFile } from "./fileUtils";

export const dispatchAnchoringStartEvent = (documentName: string, source: string) => {
  console.log(`📤 [UPLOAD] Dispatching anchoringStarted event for: ${documentName} (source: ${source})`);
  const anchoringStartEvent = new CustomEvent('anchoringStarted', {
    detail: {
      documentName,
      source
    }
  });
  window.dispatchEvent(anchoringStartEvent);
};

export const dispatchProgressEvent = (documentName: string, progress: number, step: string) => {
  console.log(`📊 [UPLOAD] Progress update for ${documentName}: ${progress}% - ${step}`);
  const progressEvent = new CustomEvent('anchoringProgress', {
    detail: {
      documentName,
      progress,
      step
    }
  });
  window.dispatchEvent(progressEvent);
};

export const dispatchCompletionEvent = (
  documentName: string, 
  extractedText: string, 
  anchoredText: string, 
  anchorCount: number,
  source: string
) => {
  console.log(`✅ [UPLOAD] Dispatching completion event for: ${documentName}`, {
    source,
    anchorCount,
    extractedTextLength: extractedText.length,
    anchoredTextLength: anchoredText.length,
    hasAnchorTags: /⟦P-\d{5}⟧/.test(anchoredText)
  });
  
  const completionEvent = new CustomEvent('anchorTokensComplete', {
    detail: {
      documentName,
      documentText: extractedText || '',
      anchoredText: anchoredText || '',
      anchorCount,
      source
    }
  });
  window.dispatchEvent(completionEvent);
};

export const dispatchErrorEvent = (documentName: string, error: string, source: string) => {
  console.error(`❌ [UPLOAD] Dispatching error event for: ${documentName} (source: ${source}) - ${error}`);
  const errorEvent = new CustomEvent('anchoringError', {
    detail: {
      documentName,
      error,
      source
    }
  });
  window.dispatchEvent(errorEvent);
};

export const processDocumentUpload = async (
  file: File,
  userId: string,
  setAnalysisStatus: (status: string) => void
): Promise<UploadedFile> => {
  const sanitizedFilename = sanitizeFilename(file.name);
  const storagePath = `${userId}/${Date.now()}_${sanitizedFilename}`;

  console.log(`🚀 [UPLOAD] Starting document upload process for: ${file.name}`);
  setAnalysisStatus("Uploading to storage...");
  
  // Upload file to storage
  const { data: uploadData, error: fileError } = await supabase
    .storage
    .from("documents")
    .upload(storagePath, file, { upsert: false });

  if (fileError) {
    throw new Error(`Upload failed: ${fileError.message}`);
  }

  const fileUrl = supabase.storage.from("documents").getPublicUrl(storagePath).data.publicUrl;
  console.log(`📁 [UPLOAD] File uploaded to storage: ${storagePath}`);

  // Dispatch anchoring started event
  dispatchAnchoringStartEvent(file.name, 'upload');

  setAnalysisStatus("Extracting text and generating anchor tokens...");
  dispatchProgressEvent(file.name, 50, 'Extracting text and generating anchor tokens...');

  // Extract text content using the existing processor
  console.log(`📄 [UPLOAD] Extracting text from uploaded document: ${file.name}`);
  const mockNode = {
    id: 'temp',
    type: 'documentInput',
    position: { x: 0, y: 0 },
    data: {
      file: file,
      documentName: file.name,
      isUploaded: true,
      moduleType: 'document-input' as const
    }
  };

  // Pass 'upload' as source to trigger proper event dispatching
  const extractionResult = await extractDocumentText(mockNode, 'upload');
  const extractedText = extractionResult.processableContent;
  const anchoredText = extractionResult.anchoredContent;
  const anchorCount = extractionResult.anchorMap.length;

  console.log(`📊 [UPLOAD] Text extraction completed for: ${file.name}`, {
    originalLength: extractionResult.metadata.originalLength,
    processableLength: extractionResult.metadata.processableLength,
    anchoredLength: extractionResult.metadata.anchoredLength,
    anchorCount: extractionResult.metadata.anchorCount,
    extractedSuccessfully: extractionResult.metadata.extractedSuccessfully,
    hasAnchorTags: anchoredText ? /⟦P-\d{5}⟧/.test(anchoredText) : false
  });

  dispatchProgressEvent(file.name, 90, 'Saving to database...');
  setAnalysisStatus("Saving document to database...");

  // Insert document record with both extracted and anchored text
  const { data: docRow, error: insertError } = await supabase
    .from("documents")
    .insert([
      {
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size: file.size,
        preview_url: fileUrl,
        user_id: userId,
        extracted_text: JSON.stringify({
          original: extractedText || '',
          anchored: anchoredText || '',
          anchorCount: anchorCount
        })
      },
    ])
    .select()
    .single();

  if (insertError) {
    throw new Error(`Database insert failed: ${insertError.message}`);
  }

  console.log(`💾 [UPLOAD] Document saved to database with ID: ${docRow.id}`);

  // Create safe file object with validation
  const uploadedFile = createSafeFileObject(file, fileUrl, extractedText, anchoredText, anchorCount);
  
  // Dispatch anchoring completion event
  dispatchCompletionEvent(file.name, extractedText || '', anchoredText || '', anchorCount, 'upload');

  console.log(`🎉 [UPLOAD] Upload process completed successfully for: ${file.name}`);
  return uploadedFile;
};
