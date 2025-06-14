
import { supabase } from "@/integrations/supabase/client";
import { Petition } from "./types";
import { documentService } from "@/services/documentService";

// Define the default petition cost
export const DEFAULT_PETITION_COST = 16;

// Define interface for token validation result
export interface TokenValidationResult {
  hasEnoughTokens: boolean;
  tokenCost: number;
  currentTeamTokens: number;
}

export interface CreatePetitionParams {
  title: string;
  description?: string;
  legal_area?: string;
  petition_type?: string;
  target?: string;
  form_answers?: Record<string, any>;
  team_id?: string | null;
  has_process?: boolean;
  process_number?: string | null;
  content?: string;
  category?: string;
  form_type?: string;
  form_schema?: string | null;
}

// Function to validate tokens before creating a petition
export const validateTokensForPetition = async (
  userId: string,
  teamId: string
): Promise<TokenValidationResult> => {
  try {
    // Use a direct query instead of RPC for better TypeScript compatibility
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', userId)
      .single();
    
    if (tokenError) throw tokenError;
    
    const currentTeamTokens = tokenData?.tokens || 0;
    const tokenCost = DEFAULT_PETITION_COST;
    
    return {
      hasEnoughTokens: currentTeamTokens >= tokenCost,
      tokenCost,
      currentTeamTokens
    };
  } catch (error) {
    console.error('Error validating tokens:', error);
    throw new Error('Failed to validate token balance');
  }
};

export const createPetition = async (
  petitionData: CreatePetitionParams
): Promise<Petition> => {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    
    if (!userId) throw new Error('User not authenticated');
    
    const teamId = petitionData.team_id;
    if (!teamId) throw new Error('Team ID is required');
    
    // Validate tokens first (simplified for type safety)
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', userId)
      .maybeSingle(); // Alterado de .single() para .maybeSingle()
    
    if (tokenError && tokenError.code !== 'PGRST116') throw tokenError;
    
    const currentTeamTokens = tokenData?.tokens || 0;
    const tokensToDeduct = DEFAULT_PETITION_COST; // Renamed from tokenCost to tokensToDeduct
    
    if (currentTeamTokens < tokensToDeduct) {
      throw new Error(`Insufficient tokens. You need ${tokensToDeduct} tokens but have ${currentTeamTokens}.`);
    }
    
    // Prepare the petition data
    const newPetition = {
      title: petitionData.title,
      description: petitionData.description || '',
      legal_area: petitionData.legal_area || null,
      petition_type: petitionData.petition_type || null,
      has_process: petitionData.has_process || false,
      process_number: petitionData.process_number || null,
      target: petitionData.target || null,
      form_answers: petitionData.form_answers || {},
      content: petitionData.content || '',
      category: petitionData.category || null,
      form_type: petitionData.form_type || null,
      form_schema: petitionData.form_schema || null,
      team_id: teamId,
      user_id: userId,
      status: 'pending' as const
    };
    
    // Create the petition
    const { data: petition, error } = await supabase
      .from('petitions')
      .insert(newPetition)
      .select()
      .single();
    
    if (error) throw error;
    
    // Charge the team for the petition
    const { error: chargeError } = await supabase.functions.invoke(
      'charge-team-for-petition',
      {
        body: {
          teamId, // Parâmetro correto
          petitionId: petition.id,
          tokensToDeduct, // Parâmetro correto
          chargedByUserId: userId // Parâmetro correto
        }
      }
    );
    
    if (chargeError) {
      console.error('Error charging team for petition:', chargeError);
      // Continue anyway, as the petition is already created
    }
    
    // After creating the petition, save the format settings for it
    try {
      await documentService.savePetitionFormatSettings(petition.id, userId);
    } catch (formatError) {
      console.error('Error saving format settings:', formatError);
      // We don't throw here to avoid blocking petition creation
    }
    
    return petition as Petition;
  } catch (error) {
    console.error('Error in createPetition:', error);
    throw error;
  }
};
