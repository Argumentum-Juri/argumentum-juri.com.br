
CREATE OR REPLACE FUNCTION public.insert_petition_comment(
  p_petition_id UUID,
  p_author_id UUID,
  p_content TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.petition_comments (petition_id, author_id, content)
  VALUES (p_petition_id, p_author_id, p_content);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_petition_comments(
  p_petition_id UUID
) RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', pc.id,
      'petition_id', pc.petition_id,
      'author_id', pc.author_id,
      'content', pc.content,
      'created_at', pc.created_at,
      'updated_at', pc.updated_at,
      'author', json_build_object(
        'id', p.id,
        'name', p.name,
        'email', p.email,
        'avatar_url', p.avatar_url
      )
    )
  FROM 
    public.petition_comments pc
    JOIN public.profiles p ON pc.author_id = p.id
  WHERE 
    pc.petition_id = p_petition_id
  ORDER BY 
    pc.created_at DESC;
END;
$$;
