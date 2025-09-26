-- Fix security issues in functions by setting proper search_path
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, registration_number, full_name, area)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'registration_number',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'area'
  );
  RETURN new;
END;
$$;