
import React, { useState } from 'react';
import { FileText, X, Search, RefreshCw } from 'lucide-react';
import { useDocuments, StoredDocument } from '@/hooks/useDocuments';
import { toast } from '@/components/ui/use-toast';

interface DocumentLibraryProps {
  onDocumentSelect: (document: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  onDocumentSelect,
  isOpen,
  onClose
}) => {
  const { documents, loading, refreshing, deleteDocument, refetch } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, docId: string, storagePath: string) => {
    e.stopPropagation();
    try {
      await deleteDocument(docId, storagePath);
      toast({
        title: "Document deleted",
        description: "The document has been removed from your library.",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete the document.",
        variant: "destructive",
      });
    }
  };

  /**
   * Generate anchor tokens for text that doesn't have them
   */
  const generateAnchoredText = (originalText: string): { anchoredText: string; anchorCount: number } => {
    if (!originalText) return { anchoredText: '', anchorCount: 0 };
    
    const paragraphs = originalText.split(/\n\s*\n/);
    let anchoredContent = '';
    let anchorCount = 0;
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        const anchor = `⟦P-${String(index + 1).padStart(5, '0')}⟧`;
        anchoredContent += anchor + paragraph.trim();
        anchorCount++;
        
        if (index < paragraphs.length - 1) {
          anchoredContent += '\n\n';
        }
      }
    });
    
    return { anchoredText: anchoredContent, anchorCount };
  };

  const createFileFromDocument = (document: StoredDocument) => {
    let extractedText = '';
    let anchoredText = '';
    let anchorCount = 0;

    // Parse the stored extracted_text field
    if (document.extracted_text) {
      try {
        // Try to parse as JSON (new format)
        const parsedData = JSON.parse(document.extracted_text);
        extractedText = parsedData.original || '';
        anchoredText = parsedData.anchored || '';
        anchorCount = parsedData.anchorCount || 0;
        
        console.log('Parsed document data:', {
          name: document.name,
          hasOriginal: !!extractedText,
          hasAnchored: !!anchoredText,
          anchorCount
        });
      } catch (e) {
        // Fallback: treat as plain text (legacy format)
        extractedText = document.extracted_text;
        console.log('Legacy document format detected, generating anchored text for:', document.name);
        
        // Generate anchored text on-the-fly for legacy documents
        const generated = generateAnchoredText(extractedText);
        anchoredText = generated.anchoredText;
        anchorCount = generated.anchorCount;
      }
    }

    // If we still don't have anchored text but have extracted text, generate it
    if (!anchoredText && extractedText) {
      console.log('Generating anchored text for document without anchor tokens:', document.name);
      const generated = generateAnchoredText(extractedText);
      anchoredText = generated.anchoredText;
      anchorCount = generated.anchorCount;
    }

    return {
      name: document.name,
      size: document.size,
      type: document.mime_type,
      lastModified: new Date(document.uploaded_at || Date.now()).getTime(),
      preview: document.preview_url,
      extractedText: extractedText || undefined,
      anchoredText: anchoredText || undefined,
      anchorCount: anchorCount
    };
  };

  const handleDocumentClick = (document: StoredDocument) => {
    const file = createFileFromDocument(document);
    console.log('Document selected from library:', {
      name: file.name,
      hasExtractedText: !!file.extractedText,
      hasAnchoredText: !!file.anchoredText,
      anchorCount: file.anchorCount,
      textLength: file.extractedText?.length || 0
    });
    onDocumentSelect(file);
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, document: StoredDocument) => {
    console.log('Drag started for document:', document.name);
    setIsDragging(true);
    
    const file = createFileFromDocument(document);
    
    e.dataTransfer.setData("application/lovable-document", JSON.stringify(file));
    e.dataTransfer.effectAllowed = "copy";
    
    console.log('Drag data set with anchored text:', {
      name: file.name,
      hasExtractedText: !!file.extractedText,
      hasAnchoredText: !!file.anchoredText,
      anchorCount: file.anchorCount,
      textLength: file.extractedText?.length || 0
    });
  };

  const handleDragEnd = () => {
    console.log('Drag ended');
    setIsDragging(false);
  };

  const handleModalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop prevented on modal, allowing bubble to workspace');
  };

  const handleRefresh = () => {
    refetch();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isDragging ? 'bg-black bg-opacity-20' : 'bg-black bg-opacity-50'
      }`}
      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
      onDragOver={handleModalDragOver}
      onDrop={handleModalDrop}
    >
      {isDragging && (
        <div 
          className="absolute inset-0 bg-blue-100 bg-opacity-30 border-4 border-dashed border-blue-400 animate-pulse"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      <div 
        className={`bg-white border-2 border-black w-96 max-h-96 flex flex-col font-mono transition-all duration-300 ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="border-b-2 border-black p-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">DOCUMENT LIBRARY</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className="hover:bg-gray-100 p-1"
              disabled={refreshing}
              title="Refresh library"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="hover:bg-gray-100 p-1">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="border-b-2 border-black p-2">
          <div className="flex items-center border border-black">
            <Search size={16} className="ml-2" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading || refreshing ? (
            <div className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                {refreshing ? 'Refreshing...' : 'Loading...'}
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
            </div>
          ) : (
            <div className="p-2">
              {filteredDocuments.map((doc) => {
                const file = createFileFromDocument(doc);
                const hasText = !!file.extractedText;
                const hasAnchors = !!file.anchoredText && file.anchorCount > 0;
                
                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, doc)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleDocumentClick(doc)}
                    className="flex items-center justify-between p-2 border border-black mb-2 cursor-grab hover:bg-gray-100 group active:cursor-grabbing transition-colors"
                    title="Click to add to workspace or drag to position"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText size={16} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{doc.name}</div>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          <span>{Math.round(doc.size / 1024)} KB</span>
                          {hasText ? (
                            hasAnchors ? (
                              <span className="text-green-600">✓ Anchored ({file.anchorCount})</span>
                            ) : (
                              <span className="text-blue-600">✓ Text Ready</span>
                            )
                          ) : (
                            <span className="text-orange-600">⚠ No Text</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, doc.id, doc.storage_path)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isDragging && (
          <div className="border-t-2 border-black p-2 bg-blue-50 text-center text-sm font-bold text-blue-800">
            DRAG TO WORKSPACE TO ADD DOCUMENT
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentLibrary;
