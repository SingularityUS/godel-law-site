
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface StoredDocument {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  preview_url: string | null;
  user_id: string | null;
  uploaded_at: string | null;
  extracted_text: string | null;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  // Track subscription state to prevent multiple subscriptions
  const subscriptionRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const fetchDocuments = async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refetch = async () => {
    setRefreshing(true);
    // Add a small delay to ensure database transaction completion
    await new Promise(resolve => setTimeout(resolve, 500));
    await fetchDocuments();
  };

  const deleteDocument = async (documentId: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  // Set up real-time subscription with proper state management
  useEffect(() => {
    if (!user?.id || isSubscribedRef.current) return;

    console.log('Setting up real-time subscription for user:', user.id);

    const setupSubscription = () => {
      try {
        const channelName = `documents-changes-${user.id}-${Date.now()}`;
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'documents',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('New document added:', payload.new);
              setDocuments(prev => [payload.new as StoredDocument, ...prev]);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'documents',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Document deleted:', payload.old);
              setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              isSubscribedRef.current = true;
            } else if (status === 'CLOSED') {
              isSubscribedRef.current = false;
            }
          });

        subscriptionRef.current = channel;
        
        return channel;
      } catch (error) {
        console.error('Error setting up subscription:', error);
        isSubscribedRef.current = false;
        return null;
      }
    };

    // Add a small delay to prevent rapid subscription attempts
    const timeoutId = setTimeout(() => {
      setupSubscription();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (subscriptionRef.current && isSubscribedRef.current) {
        console.log('Cleaning up real-time subscription');
        try {
          supabase.removeChannel(subscriptionRef.current);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  return {
    documents,
    loading,
    refreshing,
    refetch,
    deleteDocument
  };
};
