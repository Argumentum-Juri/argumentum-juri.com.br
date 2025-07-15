
-- Create a trigger to sync team tokens with owner tokens when the owner's tokens change
CREATE OR REPLACE FUNCTION public.sync_owner_tokens_to_team()
RETURNS trigger AS $$
DECLARE
  team_id_var UUID;
BEGIN
  -- Find the team where user is owner
  SELECT team_id INTO team_id_var
  FROM public.team_members
  WHERE user_id = NEW.user_id
  AND role = 'owner'
  LIMIT 1;
  
  -- If this user is a team owner, update the team's tokens
  IF team_id_var IS NOT NULL THEN
    UPDATE public.teams
    SET tokens = NEW.tokens
    WHERE id = team_id_var;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_tokens table to sync when tokens are updated
DROP TRIGGER IF EXISTS sync_tokens_after_update ON public.user_tokens;
CREATE TRIGGER sync_tokens_after_update
AFTER UPDATE ON public.user_tokens
FOR EACH ROW
WHEN (NEW.tokens IS DISTINCT FROM OLD.tokens)
EXECUTE FUNCTION public.sync_owner_tokens_to_team();

-- Create trigger on user_tokens table to sync when tokens are inserted
DROP TRIGGER IF EXISTS sync_tokens_after_insert ON public.user_tokens;
CREATE TRIGGER sync_tokens_after_insert
AFTER INSERT ON public.user_tokens
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_tokens_to_team();

-- Create a trigger to sync team member changes
CREATE OR REPLACE FUNCTION public.sync_team_on_role_change()
RETURNS trigger AS $$
DECLARE
  old_owner_id UUID;
  new_owner_id UUID;
  owner_tokens INTEGER;
BEGIN
  -- If role changed to owner
  IF NEW.role = 'owner' AND (OLD.role IS NULL OR OLD.role <> 'owner') THEN
    -- Find old owner
    SELECT user_id INTO old_owner_id
    FROM public.team_members
    WHERE team_id = NEW.team_id
    AND role = 'owner'
    AND user_id <> NEW.user_id;
    
    -- If there was an old owner, remove their owner role
    IF old_owner_id IS NOT NULL THEN
      UPDATE public.team_members
      SET role = 'gestor'
      WHERE team_id = NEW.team_id
      AND user_id = old_owner_id;
    END IF;
    
    -- Get new owner's tokens
    SELECT tokens INTO owner_tokens
    FROM public.user_tokens
    WHERE user_id = NEW.user_id;
    
    -- Update team tokens to match new owner's tokens
    UPDATE public.teams
    SET tokens = COALESCE(owner_tokens, 0)
    WHERE id = NEW.team_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on team_members table
DROP TRIGGER IF EXISTS sync_team_on_role_change ON public.team_members;
CREATE TRIGGER sync_team_on_role_change
AFTER UPDATE ON public.team_members
FOR EACH ROW
WHEN (NEW.role IS DISTINCT FROM OLD.role)
EXECUTE FUNCTION public.sync_team_on_role_change();
