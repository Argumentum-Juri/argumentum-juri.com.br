-- Atualizar r2_keys existentes baseados nas URLs do Cloudflare R2
UPDATE petition_settings 
SET 
  logo_r2_key = CASE 
    WHEN logo_url LIKE '%r2.cloudflarestorage.com%' AND logo_r2_key IS NULL
    THEN SUBSTRING(logo_url FROM 'https://[^/]+/(.+)')
    ELSE logo_r2_key
  END,
  letterhead_template_r2_key = CASE 
    WHEN letterhead_template_url LIKE '%r2.cloudflarestorage.com%' AND letterhead_template_r2_key IS NULL
    THEN SUBSTRING(letterhead_template_url FROM 'https://[^/]+/(.+)')
    ELSE letterhead_template_r2_key
  END,
  petition_template_r2_key = CASE 
    WHEN petition_template_url LIKE '%r2.cloudflarestorage.com%' AND petition_template_r2_key IS NULL
    THEN SUBSTRING(petition_template_url FROM 'https://[^/]+/(.+)')
    ELSE petition_template_r2_key
  END
WHERE 
  (logo_url LIKE '%r2.cloudflarestorage.com%' AND logo_r2_key IS NULL) OR
  (letterhead_template_url LIKE '%r2.cloudflarestorage.com%' AND letterhead_template_r2_key IS NULL) OR
  (petition_template_url LIKE '%r2.cloudflarestorage.com%' AND petition_template_r2_key IS NULL);