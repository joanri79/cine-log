-- Insert existing users from auth.users into public.usuarios
-- This is useful if you have users created before the trigger was added
INSERT INTO public.usuarios (id, mail, nombre)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1)
FROM auth.users
ON CONFLICT (id) DO NOTHING;
