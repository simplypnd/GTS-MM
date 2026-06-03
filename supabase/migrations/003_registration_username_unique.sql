-- Unique public username (stored as profiles.display_name)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_lower_key
  ON public.profiles (lower(trim(display_name)));

-- Signup trigger hardening (safe to re-run)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, is_mediator)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
      NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
      'User'
    ),
    'buyer'::public.profile_role,
    FALSE
  );
  RETURN NEW;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
