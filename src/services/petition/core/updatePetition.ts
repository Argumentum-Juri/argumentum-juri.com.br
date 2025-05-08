
import { supabase } from "@/integrations/supabase/client";
import { Petition } from "@/types";
import { PetitionStatus } from "@/types/enums";
import { handleSupabaseError } from "@/utils/utils";

export const updatePetition = async (id: string, updates: Partial<Petition>): Promise<Petition | null> => {
  try {
    const dbUpdates: any = { ...updates };
    
    if (updates.createdAt) {
      dbUpdates.created_at = updates.createdAt;
      delete dbUpdates.createdAt;
    }
    
    if (updates.updatedAt) {
      dbUpdates.updated_at = updates.updatedAt;
      delete dbUpdates.updatedAt;
    }
    
    const { data, error } = await supabase
      .from('petitions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error("Error updating petition:", error);
      handleSupabaseError(error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status as PetitionStatus,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      legal_area: data.legal_area,
      petition_type: data.petition_type,
      has_process: data.has_process,
      process_number: data.process_number,
      team_id: data.team_id,
      user_id: data.user_id
    } as Petition;
  } catch (error) {
    console.error("Error in updatePetition:", error);
    handleSupabaseError(error);
    return null;
  }
};

export const updatePetitionStatus = async (id: string, status: PetitionStatus): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('petitions')
      .update({ status })
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating petition status:", error);
    handleSupabaseError(error);
    return false;
  }
};
