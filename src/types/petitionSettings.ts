
export interface PetitionSettings {
  id?: string;
  user_id: string;
  use_letterhead: boolean;
  primary_color?: string;
  accent_color?: string;
  logo_url?: string | null;
  font_family: string;
  font_size: string;
  line_spacing: string;
  paragraph_indent: string;
  margin_size: string;
  letterhead_template_url?: string | null;
  petition_template_url?: string | null;
  
  // File storage metadata
  petition_template_storage_provider?: string | null;
  petition_template_r2_key?: string | null;
  
  logo_r2_key?: string | null;
  logo_storage_provider?: string | null;
  
  letterhead_template_r2_key?: string | null;
  letterhead_template_storage_provider?: string | null;
  
  // Original filenames for display purposes
  logo_original_filename?: string | null;
  letterhead_template_original_filename?: string | null;
  petition_template_original_filename?: string | null;
  
  // Temporary file objects for uploads
  fileObj?: File;
  letterheadFileObj?: File;
  templateFileObj?: File;
  fileType?: 'logo' | 'letterhead' | 'template';
  
  // Dates - alterado para string para compatibilidade com o tipo em index.ts
  created_at?: string;
  updated_at?: string;
}
