
export interface ProfileData {
  name: string;
  phone: string;
  oab_number: string;
  person_type: 'fisica' | 'juridica';
  document: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  office_areas: string;
  delegation_areas: string;
  team_size: string;
  purchase_reason: string;
  delegation_intent: string;
  choice_reason: string;
  social_media: string;
  terms_accepted?: boolean;
}

export interface Profile {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  oab_number?: string;
  person_type?: 'fisica' | 'juridica';
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_admin?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  office_areas?: string;
  delegation_areas?: string;
  team_size?: string;
  purchase_reason?: string;
  delegation_intent?: string;
  choice_reason?: string;
  social_media?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
}
