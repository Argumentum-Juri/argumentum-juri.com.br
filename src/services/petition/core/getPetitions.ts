
import { supabase } from "@/integrations/supabase/client";
import { Petition } from "@/types";
import { PetitionStatus } from "@/types/enums";
import { handleSupabaseError } from "@/utils/utils";
import { PetitionSearchParams } from "./types";

export const getPetitions = async (params: PetitionSearchParams): Promise<{ data: Petition[]; count: number }> => {
  try {
    const startIndex = (params.page - 1) * params.limit;
    let query = supabase
      .from('petitions')
      .select('*, user:user_id (id, name, email, avatar_url)', { count: 'exact' })
      .order(params.sortBy || 'created_at', { ascending: params.sortDirection === 'asc' })
      .range(startIndex, startIndex + params.limit - 1);
  
    if (params.status) {
      query = query.eq('status', params.status);
    }
  
    if (params.search) {
      query = query.ilike('title', `%${params.search}%`);
    }
  
    const { data, error, count } = await query;
  
    if (error) {
      console.error("Error fetching petitions:", error);
      handleSupabaseError(error);
      return { data: [], count: 0 };
    }
  
    const mappedData = data?.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status as PetitionStatus,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      legal_area: item.legal_area,
      petition_type: item.petition_type,
      has_process: item.has_process,
      process_number: item.process_number,
      team_id: item.team_id,
      user_id: item.user_id,
      user: item.user
    })) as Petition[];
    
    return { data: mappedData, count: count || 0 };
  } catch (error) {
    console.error("Error in getPetitions:", error);
    handleSupabaseError(error);
    return { data: [], count: 0 };
  }
};

export const getAllPetitions = async (): Promise<Petition[]> => {
  try {
    const { data, error } = await supabase
      .from('petitions')
      .select('*, user:user_id (id, name, email, avatar_url)')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching all petitions:", error);
      handleSupabaseError(error);
      return [];
    }
    
    const petitions = data?.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status as PetitionStatus,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      legal_area: item.legal_area,
      petition_type: item.petition_type,
      has_process: item.has_process,
      process_number: item.process_number,
      team_id: item.team_id,
      user_id: item.user_id,
      user: item.user
    })) as Petition[];
    
    return petitions;
  } catch (error) {
    console.error("Error in getAllPetitions:", error);
    handleSupabaseError(error);
    return [];
  }
};
