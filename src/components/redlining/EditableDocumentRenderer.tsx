
/**
 * Editable Document Renderer Component
 * 
 * Purpose: Allows direct editing of document content in edit mode
 */

import React, { useState, useEffect, useRef } from "react";
import { RedlineDocument } from "@/types/redlining";
import { Textarea } from "@/components/ui/textarea";

interface EditableDocumentRendererProps {
  document: RedlineDocument;
  onContentChange: (newContent: string) => void;
  className?: string;
}

const EditableDocumentRenderer: React.FC<EditableDocumentRendererProps> = ({
  document,
  onContentChange,
  className = ""
}) => {
  const [localContent, setLocalContent] = useState(document.currentContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local content when document changes
  useEffect(() => {
    setLocalContent(document.currentContent);
  }, [document.currentContent]);

  // Debounced save - save changes 500ms after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localContent !== document.currentContent) {
        onContentChange(localContent);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localContent, document.currentContent, onContentChange]);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalContent(event.target.value);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localContent]);

  return (
    <div className="bg-gray-100 w-full h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white shadow-lg p-16 relative">
          <div className="mb-4 text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
            <strong>Edit Mode:</strong> You can directly edit the document content below. Changes are auto-saved. Switch back to View mode to see redline suggestions.
          </div>
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={handleContentChange}
            className={`w-full min-h-96 border-0 resize-none focus:ring-0 bg-transparent ${className}`}
            style={{
              fontFamily: 'Calibri, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '11pt',
              lineHeight: '1.15',
              color: '#000000'
            }}
            placeholder="Start typing your document content here..."
          />
        </div>
      </div>
    </div>
  );
};

export default EditableDocumentRenderer;
