
import { supabase } from "@/integrations/supabase/client";
import { PetitionReview } from "@/types";
import { getCurrentUserId } from "./utils";

// Interface para o tipo de dados retornado da tabela do Supabase
interface PetitionReviewDB {
  id: string;
  petition_id: string;
  content: string;
  reviewer_id: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// Função de mapeamento para converter dados do DB para o modelo de domínio
const mapDbToReview = (review: PetitionReviewDB): PetitionReview => {
  return {
    id: review.id,
    petition_id: review.petition_id,
    content: review.content,
    reviewer_id: review.reviewer_id,
    is_approved: review.is_approved,
    created_at: review.created_at,
    updated_at: review.updated_at,
    version: review.version,
    // Para compatibilidade retroativa
    createdAt: review.created_at,
    updatedAt: review.updated_at,
    isApproved: review.is_approved
  };
};

export const petitionReviews = {
  getReviews: async (petitionId: string): Promise<PetitionReview[]> => {
    try {
      const { data, error } = await supabase
        .from('petition_reviews')
        .select('*')
        .eq('petition_id', petitionId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Map DB fields to interface fields with correct type
      return data.map(review => mapDbToReview(review as PetitionReviewDB));
    } catch (error) {
      console.error("Error fetching petition reviews:", error);
      return [];
    }
  },
  
  createReview: async (petitionId: string, content: string, isApproved: boolean): Promise<PetitionReview | null> => {
    try {
      const userId = await getCurrentUserId();
      
      const { data, error } = await supabase
        .from('petition_reviews')
        .insert({
          petition_id: petitionId,
          content,
          is_approved: isApproved,
          reviewer_id: userId
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Map DB fields to interface fields with correct type
      return mapDbToReview(data as PetitionReviewDB);
    } catch (error) {
      console.error("Error creating review:", error);
      return null;
    }
  }
};
