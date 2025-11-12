-- ============================================
-- CRIAR PRIMEIRO USUÁRIO ADMINISTRADOR
-- Lince Track ERP
-- ============================================

-- INSTRUÇÕES:
-- 1. Abra o painel do Supabase: https://supabase.com/dashboard
-- 2. Vá em: SQL Editor
-- 3. Cole este script completo
-- 4. ALTERE o email e senha abaixo
-- 5. Execute o script
-- 6. Use as credenciais para fazer login no sistema

-- ============================================
-- CONFIGURAR AQUI
-- ============================================

-- ⚠️ ALTERE ESTAS INFORMAÇÕES:
DO $$
DECLARE
    user_email TEXT := 'admin@lincetrack.com';  -- ✏️ ALTERE O EMAIL AQUI
    user_password TEXT := 'Admin123!@#';         -- ✏️ ALTERE A SENHA AQUI
    user_name TEXT := 'Administrador';           -- ✏️ ALTERE O NOME AQUI
    new_user_id UUID;
BEGIN
    -- 1. Criar usuário na tabela auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;

    -- 2. Criar identidade do usuário
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id::text, user_email)::jsonb,
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- 3. Criar perfil do usuário como ADMIN
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_name,
        'admin',
        NOW(),
        NOW()
    );

    -- 4. Mostrar informações do usuário criado
    RAISE NOTICE '✅ Usuário criado com sucesso!';
    RAISE NOTICE '📧 Email: %', user_email;
    RAISE NOTICE '🔑 Senha: %', user_password;
    RAISE NOTICE '👤 Nome: %', user_name;
    RAISE NOTICE '🆔 ID: %', new_user_id;
    RAISE NOTICE '👑 Perfil: Administrador (admin)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Você já pode fazer login no sistema!';
    RAISE NOTICE '🌐 Acesse: http://localhost:3000/login';

END $$;

-- ============================================
-- VERIFICAR USUÁRIOS CRIADOS
-- ============================================

-- Ver todos os usuários cadastrados
SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
