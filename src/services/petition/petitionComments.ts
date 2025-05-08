
import { supabase } from "@/integrations/supabase/client";
import { PetitionComment } from "@/types";
import { extractAuthorInfo, getCurrentUserId } from "./utils";

export const petitionComments = {
  getComments: async (petitionId: string): Promise<PetitionComment[]> => {
    try {
      // First get comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('petition_comments')
        .select('*')
        .eq('petition_id', petitionId)
        .order('created_at', { ascending: false });
        
      if (commentsError) {
        throw commentsError;
      }
      
      if (!commentsData || commentsData.length === 0) {
        return [];
      }
      
      // Extract author IDs
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      
      // Get author information
      const { data: authorsData, error: authorsError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', authorIds);
      
      if (authorsError) {
        console.error("Error fetching comment authors:", authorsError);
      }
      
      // Create authors map for easy access
      const authorsMap = {};
      if (authorsData) {
        authorsData.forEach(author => {
          authorsMap[author.id] = author;
        });
      }
      
      // Build comments with author information
      return commentsData.map(comment => {
        const authorInfo = authorsMap[comment.author_id] ? {
          id: authorsMap[comment.author_id].id,
          name: authorsMap[comment.author_id].name,
          email: authorsMap[comment.author_id].email,
          avatar_url: authorsMap[comment.author_id].avatar_url
        } : null;
        
        return {
          id: comment.id,
          petition_id: comment.petition_id,
          author_id: comment.author_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          author: authorInfo
        };
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
  },
  
  addComment: async (petitionId: string, content: string): Promise<PetitionComment | null> => {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('petition_comments')
        .insert({
          petition_id: petitionId,
          content,
          author_id: userId
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Buscar informações do autor
      const { data: authorData, error: authorError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('id', userId)
        .single();
      
      if (authorError) {
        console.error("Error fetching comment author:", authorError);
      }
      
      const authorInfo = authorData ? {
        id: authorData.id,
        name: authorData.name,
        email: authorData.email,
        avatar_url: authorData.avatar_url
      } : null;
      
      return {
        id: data.id,
        petition_id: data.petition_id,
        author_id: data.author_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: authorInfo
      } as PetitionComment;
    } catch (error) {
      console.error("Error adding comment:", error);
      return null;
    }
  },
  
  deleteComment: async (commentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('petition_comments')
        .delete()
        .eq('id', commentId);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      return false;
    }
  }
};
