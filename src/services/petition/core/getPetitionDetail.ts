
import { supabase } from "@/integrations/supabase/client";
import { PetitionDetail } from "@/types";
import { PetitionStatus } from "@/types/enums";
import { extractAuthorInfo } from "../utils";
import { handleSupabaseError } from "@/utils/utils";

export const getPetitionDetail = async (id: string): Promise<PetitionDetail | null> => {
  try {
    const { data, error } = await supabase
      .from('petitions')
      .select(`
        *,
        profiles:user_id (
          id,
          name,
          email,
          avatar_url
        ),
        petition_reviews:petition_reviews (
          id,
          content,
          created_at
        ),
        petition_attachments:petition_attachments (
          id,
          file_name,
          file_type,
          storage_path,
          petition_id,
          created_at,
          size
        ),
        comments:petition_comments (
          id,
          petition_id,
          author_id,
          content,
          created_at,
          updated_at
        ),
        form_answers
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching petition detail:", error);
      handleSupabaseError(error);
      return null;
    }
    
    if (!data) {
      console.log("No petition detail found with ID:", id);
      return null;
    }

    const attachments = Array.isArray(data.petition_attachments) 
      ? data.petition_attachments.map(a => {
          // Calculate the public URL for each attachment
          const path = a.storage_path || `${a.petition_id}/attachments/${a.file_name}`;
          const { data: urlData } = supabase.storage
            .from('petition-files')
            .getPublicUrl(path);
            
          return {
            id: a.id,
            file_name: a.file_name,
            file_type: a.file_type,
            file_url: urlData?.publicUrl || '',
            storage_path: a.storage_path || '',
            petition_id: a.petition_id,
            created_at: a.created_at,
            size: a.size || 0
          };
        })
      : [];

    const comments = [];
    if (Array.isArray(data.comments) && data.comments.length > 0) {
      const authorIds = [...new Set(data.comments.map(c => c.author_id))];
      
      const { data: authorsData, error: authorsError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', authorIds);
      
      if (authorsError) {
        console.error("Error fetching comment authors:", authorsError);
        handleSupabaseError(authorsError);
      }
      
      const authorsMap = {};
      if (authorsData) {
        authorsData.forEach(author => {
          authorsMap[author.id] = author;
        });
      }
      
      data.comments.forEach(c => {
        const authorInfo = authorsMap[c.author_id] ? {
          id: authorsMap[c.author_id].id,
          name: authorsMap[c.author_id].name,
          email: authorsMap[c.author_id].email,
          avatar_url: authorsMap[c.author_id].avatar_url
        } : null;
        
        comments.push({
          id: c.id,
          petition_id: c.petition_id,
          author_id: c.author_id,
          content: c.content,
          created_at: c.created_at,
          updated_at: c.updated_at,
          author: authorInfo
        });
      });
    }

    const result: PetitionDetail = {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status as PetitionStatus,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // For backward compatibility
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      legal_area: data.legal_area,
      petition_type: data.petition_type,
      has_process: data.has_process,
      process_number: data.process_number,
      team_id: data.team_id,
      user_id: data.user_id,
      user: data.profiles,
      reviews: Array.isArray(data.petition_reviews) ? data.petition_reviews : [],
      attachments: attachments,
      comments: comments
    };

    return result;
  } catch (error) {
    console.error("Error in getPetitionDetail:", error);
    handleSupabaseError(error);
    return null;
  }
};
