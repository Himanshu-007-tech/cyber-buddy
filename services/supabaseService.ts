
import { createClient } from '@supabase/supabase-js';
import { Message, MessageRole } from '../types';

const SUPABASE_URL = 'https://nxbhshsiqbtosghnczrf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YmhzaHNpcWJ0b3NnaG5jenJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTg3MDgsImV4cCI6MjA4NjczNDcwOH0.5-kN-JwK2VY3fgDXQfa-LsLP79j0Hm72feo4Kpz1PQU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Persists a message to the Supabase backend.
 */
export const saveMessageToBackend = async (userName: string, message: Message) => {
  try {
    // Only save valid data, skip large blob URLs which won't work on reload anyway
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          id: message.id,
          user_name: userName,
          role: message.role,
          text: message.text,
          image_url: message.imageUrl?.startsWith('blob:') ? null : message.imageUrl,
          timestamp: message.timestamp.toISOString(),
        }
      ]);

    if (error) {
      console.warn('Sync Failed:', error.message);
    }
  } catch (err) {
    console.error('Supabase Sync Failure:', err);
  }
};

/**
 * Retrieves the chat history for a specific student.
 */
export const getChatHistory = async (userName: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_name', userName)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Fetch Failed:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      role: row.role as MessageRole,
      text: row.text,
      timestamp: new Date(row.timestamp),
      imageUrl: row.image_url,
    }));
  } catch (err) {
    console.error('Supabase Fetch Failure:', err);
    return [];
  }
};

/**
 * Clears the chat history for a student.
 */
export const clearUserHistory = async (userName: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('user_name', userName);

    if (error) {
      console.error('Clear Failed:', error.message);
    }
  } catch (err) {
    console.error('Supabase Delete Failure:', err);
  }
};
