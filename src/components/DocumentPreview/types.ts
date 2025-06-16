
export interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    type: string;
    size: number;
    preview?: string;
    file?: any;
  } | null;
}

export interface DocumentContentState {
  content: string;
  isLoading: boolean;
  error: string | null;
}
