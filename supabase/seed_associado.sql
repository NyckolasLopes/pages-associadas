DO $$
DECLARE
  v_uid UUID := gen_random_uuid();
  v_password_hash TEXT;
  v_email TEXT := 'nyckolas.lopes@gmail.com';
BEGIN
  -- Hashing 'Aspro@2026'
  v_password_hash := crypt('Aspro@2026', gen_salt('bf'));

  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    -- Create User in auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email, v_password_hash, now(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Nyckolas Lopes (Associado)"}', now(), now(), '', '', '', ''
    );
  ELSE
    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
    UPDATE auth.users SET encrypted_password = v_password_hash WHERE id = v_uid;
  END IF;

  -- Update Profile
  UPDATE public.profiles 
  SET 
    grupo_id = 'grupo-associado',
    lojas_vinculadas = '["1"]'::jsonb,
    proprietario = false,
    nome = 'Nyckolas Lopes (Associado)'
  WHERE id = v_uid;

END $$;
