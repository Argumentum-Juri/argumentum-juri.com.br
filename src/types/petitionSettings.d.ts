
export interface PetitionSettings {
  id?: string;
  user_id: string;
  primary_color?: string;
  accent_color?: string;
  use_letterhead?: boolean;
  margin_size?: string;
  font_family?: string;
  font_size?: string;
  line_spacing?: string;
  paragraph_indent?: string;
  logo_url?: string;
  logo_r2_key?: string;
  logo_storage_provider?: string;
  logo_original_filename?: string;
  letterhead_template_url?: string;
  letterhead_template_r2_key?: string;
  letterhead_template_storage_provider?: string;
  letterhead_template_original_filename?: string;
  petition_template_url?: string;
  petition_template_r2_key?: string;
  petition_template_storage_provider?: string;
  petition_template_original_filename?: string;
  created_at?: string;
  updated_at?: string;
}
