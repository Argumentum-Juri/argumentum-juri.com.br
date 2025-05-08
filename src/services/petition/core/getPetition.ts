
import { supabase } from "@/integrations/supabase/client";
import { Petition } from "@/types";
import { PetitionStatus } from "@/types/enums";
import { handleSupabaseError } from "@/utils/utils";

export const getPetition = async (id: string): Promise<Petition | null> => {
  try {
    const { data, error } = await supabase
      .from('petitions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching petition:", error);
      handleSupabaseError(error);
      return null;
    }

    if (!data) {
      console.log("No petition found with ID:", id);
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
    console.error("Error in getPetition:", error);
    handleSupabaseError(error);
    return null;
  }
};
