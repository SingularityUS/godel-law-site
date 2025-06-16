
import { useState, useEffect } from "react";
import { extractDocumentContent } from "./documentUtils";
import { DocumentContentState } from "./types";

export const useDocumentContent = (
  isOpen: boolean,
  document: { type: string; preview?: string } | null
): DocumentContentState => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      extractContent();
    }
  }, [isOpen, document]);

  const extractContent = async () => {
    if (!document) return;

    setIsLoading(true);
    setError(null);
    setContent("");

    try {
      const extractedContent = await extractDocumentContent(document);
      setContent(extractedContent);
    } catch (err) {
      console.error("Error extracting document content:", err);
      setError("Failed to load document content. The file may be corrupted or in an unsupported format.");
    } finally {
      setIsLoading(false);
    }
  };

  return { content, isLoading, error };
};
