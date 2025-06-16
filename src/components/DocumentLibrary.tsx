
import React, { useState } from 'react';
import { FileText, X, Search } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
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
  const { documents, loading, deleteDocument } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDocumentClick = (document: any) => {
    // Convert stored document to the format expected by the workbench
    const file = {
      name: document.name,
      size: document.size,
      type: document.mime_type,
      lastModified: new Date(document.uploaded_at).getTime(),
      preview: document.preview_url
    };
    onDocumentSelect(file);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white border-2 border-black w-96 max-h-96 flex flex-col font-mono">
        <div className="border-b-2 border-black p-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">DOCUMENT LIBRARY</h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-1">
            <X size={20} />
          </button>
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
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No documents match your search' : 'No documents uploaded yet'}
            </div>
          ) : (
            <div className="p-2">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  className="flex items-center justify-between p-2 border border-black mb-2 cursor-pointer hover:bg-gray-100 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText size={16} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{doc.name}</div>
                      <div className="text-xs text-gray-600">
                        {Math.round(doc.size / 1024)} KB
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentLibrary;
