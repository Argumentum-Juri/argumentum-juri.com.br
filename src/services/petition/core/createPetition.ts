
import { Petition } from "./types";
import { documentService } from "@/services/documentService";
import { getGoAuthToken } from "@/contexts/GoAuthContext";
import { goApiClient } from "@/lib/goApiClient";

// Define the default petition cost (mantido para referência no frontend)
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

// Function to validate tokens before creating a petition (mantida para uso em UI)
export const validateTokensForPetition = async (
  userId: string,
  teamId: string
): Promise<TokenValidationResult> => {
  try {
    console.log(`[validateTokensForPetition] 🔍 Validando tokens - User: ${userId}, Team: ${teamId}`);
    
    // Use Go API client for validation
    const tokenResult = await goApiClient.getTeamTokenBalance(teamId);
    
    if (tokenResult.error) {
      console.error('[validateTokensForPetition] ❌ Erro ao buscar tokens da equipe:', tokenResult.error);
      throw new Error(tokenResult.error);
    }
    
    const currentTeamTokens = tokenResult.data?.tokens || 0;
    const tokenCost = DEFAULT_PETITION_COST;
    
    console.log(`[validateTokensForPetition] 💰 Saldo atual da equipe: ${currentTeamTokens}, Custo: ${tokenCost}`);
    
    return {
      hasEnoughTokens: currentTeamTokens >= tokenCost,
      tokenCost,
      currentTeamTokens
    };
  } catch (error) {
    console.error('[validateTokensForPetition] ❌ Erro na validação:', error);
    throw new Error('Failed to validate token balance');
  }
};

export const createPetition = async (
  petitionData: CreatePetitionParams,
  userId?: string
): Promise<Petition> => {
  try {
    console.log('[createPetition] 🚀 Iniciando criação de petição');
    
    // Get Go Auth token
    const goAuthToken = getGoAuthToken();
    if (!goAuthToken) {
      console.error('[createPetition] ❌ Token Go Auth não encontrado');
      throw new Error('Go Auth token not found');
    }

    const teamId = petitionData.team_id;
    if (!teamId) {
      console.error('[createPetition] ❌ Team ID é obrigatório');
      throw new Error('Team ID is required');
    }
    
    console.log(`[createPetition] 🔑 Using Go Auth token, Team: ${teamId}`);

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
      status: 'pending' as const
    };
    
    console.log('[createPetition] 📝 Criando petição via GoApiClient...');
    
    // Create the petition using the GoApiClient
    // A Edge Function agora cuida da validação de tokens e débito automaticamente
    const petitionResult = await goApiClient.createPetition(newPetition);
    
    if (petitionResult.error) {
      console.error('[createPetition] ❌ Erro ao criar petição:', petitionResult.error);
      throw new Error(petitionResult.error);
    }
    
    const petition = petitionResult.data;
    if (!petition?.id) {
      console.error('[createPetition] ❌ Petição criada mas ID não retornado:', petitionResult);
      throw new Error('Petition created but ID not returned');
    }
    
    console.log(`[createPetition] ✅ Petição criada: ${petition.id} (tokens debitados automaticamente pela Edge Function)`);
    
    // After creating the petition, save the format settings for it
    try {
      console.log('[createPetition] 💾 Salvando configurações de formato...');
      if (petition.user_id) {
        await documentService.savePetitionFormatSettings(petition.id, petition.user_id);
        console.log('[createPetition] ✅ Configurações de formato salvas');
      }
    } catch (formatError) {
      console.error('[createPetition] ⚠️ Erro ao salvar configurações de formato:', formatError);
      // We don't throw here to avoid blocking petition creation
    }
    
    console.log('[createPetition] 🎉 Petição criada com sucesso!');
    return petition as Petition;
  } catch (error) {
    console.error('[createPetition] 💥 Erro geral na criação:', error);
    throw error;
  }
};
