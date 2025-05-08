
import { supabase } from "@/integrations/supabase/client";
import { Petition } from "@/types";
import { PetitionStatus } from "@/types/enums";
import { handleSupabaseError } from "@/utils/utils";
import { toast } from "sonner";

// Utility function to check if user has enough tokens
const checkUserTokens = async (requiredTokens: number = 16): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return false;
    
    const { data: tokenData, error } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', userData.user.id)
      .single();
      
    if (error || !tokenData) return false;
    return tokenData.tokens >= requiredTokens;
  } catch (error) {
    console.error("Error checking user tokens:", error);
    return false;
  }
};

// Utility function to deduct tokens
const deductTokens = async (amount: number, petitionId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return false;
    
    // Get current token balance
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', userData.user.id)
      .single();
      
    if (tokenError || !tokenData) return false;
    
    if (tokenData.tokens < amount) return false;
    
    // Deduct tokens from balance
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({ tokens: tokenData.tokens - amount })
      .eq('user_id', userData.user.id);
      
    if (updateError) return false;
    
    // Record transaction
    const { error: txError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userData.user.id,
        amount: -amount, // negative amount for deduction
        transaction_type: 'petition_creation',
        description: `Criação de petição: ${petitionId}`,
        petition_id: petitionId,
        metadata: { petition_id: petitionId, action: 'create' }
      });
      
    if (txError) console.error("Error recording token transaction:", txError);
    
    return true;
  } catch (error) {
    console.error("Error deducting tokens:", error);
    return false;
  }
};

// Get petition token cost
export const getPetitionTokenCost = async (): Promise<number> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) return 16; // Default cost
    
    const { data, error } = await supabase
      .from('petition_settings')
      .select('petition_token_cost')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    
    if (error || !data) return 16; // Default cost
    return data.petition_token_cost;
  } catch (error) {
    console.error("Error getting petition token cost:", error);
    return 16; // Default cost
  }
};

export const createPetition = async (petitionData: Omit<Petition, "id" | "createdAt" | "updatedAt">): Promise<Petition | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      throw new Error("Usuário não autenticado");
    }
    
    // Get the token cost for creating a petition
    const tokenCost = await getPetitionTokenCost();
    
    // Check if user has enough tokens
    const hasEnoughTokens = await checkUserTokens(tokenCost);
    if (!hasEnoughTokens) {
      toast.error(`Saldo insuficiente de tokens`, {
        description: `São necessários ${tokenCost} tokens para criar uma petição.`
      });
      return null;
    }
    
    const dataToInsert = {
      title: petitionData.title,
      description: petitionData.description,
      status: petitionData.status,
      legal_area: petitionData.legal_area,
      petition_type: petitionData.petition_type,
      has_process: petitionData.has_process,
      process_number: petitionData.process_number,
      team_id: petitionData.team_id,
      form_answers: petitionData.form_answers || {},
      user_id: userData.user.id
    };
    
    const { data, error } = await supabase
      .from('petitions')
      .insert(dataToInsert)
      .select()
      .single();
      
    if (error) {
      console.error("Error creating petition:", error);
      handleSupabaseError(error);
      return null;
    }
    
    // Deduct tokens from user's balance
    const tokensDeducted = await deductTokens(tokenCost, data.id);
    if (!tokensDeducted) {
      console.error("Failed to deduct tokens");
      // Continue with petition creation even if token deduction fails
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
      user_id: data.user_id,
      form_answers: data.form_answers
    } as Petition;
  } catch (error) {
    console.error("Error in createPetition:", error);
    handleSupabaseError(error);
    return null;
  }
};
