
import { PetitionStatus } from "@/types/enums";
import { Json } from "@/integrations/supabase/types";

export interface PetitionSearchParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
}

export interface Petition {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category?: string;
  content?: string;
  target?: number | string; // Allow both number and string to handle conversion
  current_signatures?: number | string; // Allow both number and string to handle conversion
  status: string;
  form_type?: string;
  form_schema?: any[] | string; // Allow both array and string to handle conversion
  created_at?: string;
  updated_at?: string;
  team_id?: string;
  petition_type?: string;
  legal_area?: string;
  process_number?: string;
  has_process?: boolean;
  rejection_count?: number;
  form_answers?: Json;
}
