
/**
 * DocumentLibrary Component
 * 
 * Purpose: Modal component that displays uploaded documents and manages document selection
 * This component serves as the main interface for users to view, search, and interact with
 * their uploaded document collection.
 * 
 * Key Features:
 * - Modal overlay with document grid display
 * - Search functionality to filter documents by name
 * - Drag-and-drop support for adding documents to workspace
 * - Document deletion with confirmation
 * - Visual feedback during drag operations (fading, workspace highlighting)
 * 
 * Relationships:
 * - Called by Index.tsx when library button is clicked
 * - Uses useDocuments hook for data management
 * - Integrates with AIWorkbench for document node creation
 * - Communicates with DocumentUpload for file management
 * 
 * Data Flow:
 * 1. Receives documents from useDocuments hook
 * 2. Filters documents based on search term
 * 3. Handles drag operations and document selection
 * 4. Passes selected documents to parent via onDocumentSelect callback
 * 
 * Visual States:
 * - Default: Normal modal display with document grid
 * - Dragging: Faded modal with workspace highlight overlay
 * - Loading: Spinner while fetching documents
 * - Empty: Message when no documents exist
 */

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
  // Document management hook - provides CRUD operations for user documents
  const { documents, loading, deleteDocument, refetch } = useDocuments();
  
  // Local state for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag state tracking for visual feedback during drag operations
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Filters documents based on search term
   * Case-insensitive search that matches document names
   */
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Handles document deletion with optimistic UI updates
   * @param e - Mouse event (stopped to prevent bubble to document click)
   * @param docId - Document ID in database
   * @param storagePath - Storage path for file cleanup
   */
  const handleDelete = async (e: React.MouseEvent, docId: string, storagePath: string) => {
    e.stopPropagation();
    try {
      await deleteDocument(docId, storagePath);
      // Refresh the library immediately after deletion for real-time updates
      await refetch();
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
   * Handles document selection for direct addition to workspace
   * Converts stored document to workbench-compatible format
   * @param document - Document object from database
   */
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

  /**
   * Initiates drag operation for document
   * Sets up drag data transfer and visual feedback
   * @param e - Drag event
   * @param document - Document being dragged
   */
  const handleDragStart = (e: React.DragEvent, document: any) => {
    console.log('Drag started for document:', document.name);
    setIsDragging(true);
    
    // Convert stored document to the format expected by the workbench
    const file = {
      name: document.name,
      size: document.size,
      type: document.mime_type,
      lastModified: new Date(document.uploaded_at).getTime(),
      preview: document.preview_url
    };
    
    // Set the drag data in the same format as the workbench expects
    e.dataTransfer.setData("application/lovable-document", JSON.stringify(file));
    e.dataTransfer.effectAllowed = "copy";
    
    console.log('Drag data set:', file);
  };

  /**
   * Ends drag operation and resets visual state
   */
  const handleDragEnd = () => {
    console.log('Drag ended');
    setIsDragging(false);
  };

  /**
   * Prevents default drag over behavior to allow dropping
   * Required for proper drag-and-drop functionality
   */
  const handleModalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * Prevents modal from handling drop events
   * Allows events to bubble up to workspace for proper handling
   */
  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop prevented on modal, allowing bubble to workspace');
  };

  // Early return if modal is not open
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
      {/* Workspace highlight overlay - shows through when dragging */}
      {isDragging && (
        <div 
          className="absolute inset-0 bg-blue-100 bg-opacity-30 border-4 border-dashed border-blue-400 animate-pulse"
          style={{ pointerEvents: 'none' }}
        />
      )}
      
      {/* Main modal container */}
      <div 
        className={`bg-white border-2 border-black w-96 max-h-96 flex flex-col font-mono transition-all duration-300 ${
          isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Modal header with title and close button */}
        <div className="border-b-2 border-black p-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">DOCUMENT LIBRARY</h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-1">
            <X size={20} />
          </button>
        </div>
        
        {/* Search bar for filtering documents */}
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

        {/* Document list with loading, empty, and populated states */}
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

        {/* Drag instruction footer - only visible during drag operations */}
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
