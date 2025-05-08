
// Exporta todos os serviços de petição de forma agregada

import { petitionCore } from './core';
import { petitionDocuments } from './petitionDocuments';
import { petitionReviews } from './petitionReviews';
import { petitionComments } from './petitionComments';
import { petitionAttachments } from './petitionAttachments';
import { petitionSettings } from './petitionSettings';

// Agregando todos os serviços em um único objeto para manter compatibilidade
export const petitionService = {
  // Operações básicas de petição
  getPetition: petitionCore.getPetition,
  getPetitionDetail: petitionCore.getPetitionDetail,
  getPetitions: petitionCore.getPetitions,
  createPetition: petitionCore.createPetition,
  updatePetition: petitionCore.updatePetition,
  updatePetitionStatus: petitionCore.updatePetitionStatus,
  getAllPetitions: petitionCore.getAllPetitions, // Expose getAllPetitions directly

  // Operações de documentos
  getPetitionDocuments: petitionDocuments.getPetitionDocuments,
  getDocumentDownloadUrl: petitionDocuments.getDocumentDownloadUrl,
  uploadDocument: petitionDocuments.uploadDocument,
  deleteDocument: petitionDocuments.deleteDocument,
  generateDocument: petitionDocuments.generateDocument,

  // Operações de revisão
  getReviews: petitionReviews.getReviews,
  createReview: petitionReviews.createReview,

  // Operações de comentários
  getComments: petitionComments.getComments,
  addComment: petitionComments.addComment,
  deleteComment: petitionComments.deleteComment,

  // Operações de anexos
  getAttachments: petitionAttachments.getAttachments,
  uploadAttachment: petitionAttachments.uploadAttachment,
  deleteAttachment: petitionAttachments.deleteAttachment,
  
  // Add petitionSettings
  petitionSettings,
  
  // Expose the modules for direct access if needed
  petitionCore,
  petitionDocuments,
  petitionReviews,
  petitionComments,
  petitionAttachments
};

// Exportar todos os módulos individualmente para permitir importações específicas
export * from './core';
export * from './petitionDocuments';
export * from './petitionReviews';
export * from './petitionComments';
export * from './petitionAttachments';
export * from './petitionSettings';

// Manter compatibilidade com importações existentes
export default petitionService;
