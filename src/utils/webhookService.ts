
import { DocumentInfo } from '@/types';
import { petitionService } from '@/services';

// External webhook URL for document generation
const DOCUMENT_GENERATION_WEBHOOK = 'https://n8n.srv764902.hstgr.cloud/webhook/417d34d8-5675-4c30-a5d9-e7bba1959fcd';

const generateDocument = async (petitionId: string): Promise<DocumentInfo> => {
  try {
    // Fetch the complete petition data to send to the webhook
    const petition = await petitionService.getPetitionDetail(petitionId);
    
    if (!petition) {
      throw new Error('Petição não encontrada');
    }
    
    console.log('Sending petition data to webhook for generation:', petition.id);
    
    // Send petition data to the webhook
    const response = await fetch(DOCUMENT_GENERATION_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        petition_id: petition.id,
        title: petition.title,
        description: petition.description,
        status: petition.status,
        legal_area: petition.legal_area,
        petition_type: petition.petition_type,
        has_process: petition.has_process,
        process_number: petition.process_number,
        created_at: petition.createdAt,
        updated_at: petition.updatedAt,
        user: petition.user ? {
          id: petition.user.id,
          name: petition.user.name,
          email: petition.user.email
        } : null,
        attachments: petition.attachments
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Falha ao gerar documento' }));
      console.error('Error response from webhook:', errorData);
      return {
        id: '',
        name: '',
        type: '',
        size: 0,
        url: '',
        success: false,
        error: errorData.message || 'Falha ao gerar documento'
      };
    }

    const documentInfo = await response.json();
    return validateDocumentInfo(documentInfo);
  } catch (error: any) {
    console.error('Error in generateDocument:', error);
    return {
      id: '',
      name: '',
      type: '',
      size: 0,
      url: '',
      success: false,
      error: error.message || 'Falha ao gerar documento'
    };
  }
};

// Fix DocumentInfo validation
function validateDocumentInfo(data: any): DocumentInfo {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid document info: not an object');
  }
  
  // Ensure required fields exist
  if (!data.id || typeof data.id !== 'string') {
    throw new Error('Invalid document info: missing id');
  }
  
  // Add required success field if missing
  const result = { 
    ...data,
    success: data.success !== undefined ? data.success : true
  };
  
  return result as DocumentInfo;
}

export const handlePetitionGeneration = async (petitionId: string) => {
  try {
    // Generate the document
    const documentInfo = await generateDocument(petitionId);

    // Check if the document was generated successfully
    if (!documentInfo.success) {
      // Handle error cases
      console.error('Error generating document:', documentInfo.error);
      return {
        success: false,
        error: documentInfo.error || 'Unknown error generating document'
      };
    }

    // Log the successful document generation
    console.log('Document generated successfully:', documentInfo);

    // Return success
    return { success: true, documentInfo };
  } catch (error: any) {
    console.error('Error in handlePetitionGeneration:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};
