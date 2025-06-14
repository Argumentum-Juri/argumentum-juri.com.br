
// src/services/petition/core/index.ts
import { getPetition } from './getPetition';
import { getPetitionDetail } from './getPetitionDetail';
import { getPetitions, getAllPetitions } from './getPetitions';
// Import everything from createPetition.ts
import { 
    createPetition, 
    DEFAULT_PETITION_COST,
    validateTokensForPetition,
} from './createPetition'; 
import { updatePetition, updatePetitionStatus } from './updatePetition';
import type { CreatePetitionParams, TokenValidationResult } from './createPetition';

// Group in petitionCore if you want to access them via petitionCore.functionName
export const petitionCore = {
  getPetition,
  getPetitionDetail,
  getPetitions,
  getAllPetitions,
  createPetition,
  updatePetition,
  updatePetitionStatus,
  validateTokensForPetition,
};

// Export individually to allow direct imports
export {
  getPetition,
  getPetitionDetail,
  getPetitions,
  getAllPetitions,
  createPetition,
  updatePetition,
  updatePetitionStatus,
  DEFAULT_PETITION_COST,
  validateTokensForPetition,
};

// Export types
export type { CreatePetitionParams, TokenValidationResult };
