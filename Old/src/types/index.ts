
import { PostgrestError } from "@supabase/supabase-js";
import { PetitionStatus } from "./enums"; // Assumindo que este arquivo enum existe e é necessário

// Re-export PetitionStatus enum
export { PetitionStatus };

// Importado do Arquivo1, assumindo que './profile' existe
import { Profile } from './profile';
export type { Profile };

// Interfaces do Arquivo2
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
}

export interface PetitionCategory {
  id: number;
  name: string;
  description: string;
}

// Interfaces do Arquivo1
export interface UserTokens {
  id: string;
  user_id: string;
  tokens: number;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  transaction_type: 'credit' | 'debit';
  created_at: string;
  payment_id?: string;
}

// Interface 'PetitionSettings' mesclada
export interface PetitionSettings {
  id: string;
  user_id: string;
  font_family: string;
  font_size: string;
  line_spacing: string;
  margin_size: string;
  paragraph_indent: string;
  primary_color: string;
  accent_color: string;
  use_letterhead: boolean;
  logo_url: string | null;
  logo_r2_key: string | null;
  logo_storage_provider: string | null;
  logo_original_filename?: string | null;
  letterhead_template_url: string | null;
  letterhead_template_r2_key: string | null;
  letterhead_template_storage_provider: string | null;
  letterhead_template_original_filename?: string | null;
  petition_template_url: string | null;
  petition_template_r2_key: string | null;
  petition_template_storage_provider: string | null;
  petition_template_original_filename?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetitionAttachment { 
  id: string;
  petition_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  storage_path: string;
  size: number;
  created_at: string;
  storage_provider?: string;
  r2_key?: string;
}

export interface PetitionComment {
  id: string;
  petition_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

// Interface 'Petition' mesclada com campos compatíveis
export interface Petition {
  id: string;
  title: string;
  description: string;
  status: PetitionStatus;
  created_at: string;
  updated_at: string;
  createdAt?: string; // Alias para compatibilidade
  updatedAt?: string; // Alias para compatibilidade
  user_id: string;
  legal_area?: string;
  petition_type?: string;
  has_process?: boolean;
  process_number?: string;
  team_id?: string;
  form_answers?: Record<string, any>;
  user?: {
    id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  reviews?: {
    id: string;
    content: string;
    created_at: string;
  }[];
  attachments?: PetitionAttachment[];
  comments?: PetitionComment[];
  content?: string;
  collaborators?: Collaborator[];
  template?: string;
  is_public?: boolean;
  slug?: string;
  category?: string;
}

export interface PetitionDocument {
  id: string;
  petition_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_url?: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  storage_provider?: string;
  r2_key?: string;
}

export interface PetitionReview {
  id: string;
  petition_id: string;
  content: string;
  reviewer_id?: string;
  is_approved?: boolean;
  created_at: string;
  updated_at?: string;
  version?: number;
  // Alias para compatibilidade
  createdAt?: string;
  updatedAt?: string;
  isApproved?: boolean;
}

export interface PetitionCreationResult {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  legal_area: string | null;
  petition_type: string | null;
  has_process: boolean;
  process_number: string | null;
  team_id: string | null;
}

// Estendendo Petition para PetitionDetail
export interface PetitionDetail extends Petition {
  petition_documents?: PetitionDocument[];
}

export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  success: boolean;
  error?: string;
}

export interface DocumentUploadResult {
  id: string;
  success: boolean;
  file_name?: string;
  file_type?: string;
  petition_id?: string;
  file_url?: string;
  error?: string;
}

export interface PetitionSearchParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PetitionError {
  message: string;
  code?: string;
  details?: string;
}

export interface PetitionListResponse {
  data: Petition[];
  error: any;
}

export interface AttachmentUploadResult {
  success: boolean;
  attachment_name?: string;
  attachment_url?: string;
  error?: string;
}

// Erro potencial de Supabase, pode ser útil
export type { PostgrestError };
