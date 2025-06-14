
export interface Team {
  id?: string;
  name?: string; // Made optional to match with TeamContext
  created_at?: string;
  updated_at?: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id?: string;
  team_id: string;
  user_id: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  name?: string;
  email: string;
  avatar_url?: string;
  created_at?: string; 
  updated_at?: string;
  is_admin?: boolean;
  oab_number?: string;
  person_type?: 'fisica' | 'juridica';
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface TeamInvite {
  id?: string;
  team_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  inviter_id?: string;
  role: string;
  created_at?: string;
  expires_at?: string;
  team?: Team;
}
