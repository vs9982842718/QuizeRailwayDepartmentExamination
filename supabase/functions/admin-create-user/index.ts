import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Admin Create User Request ===');
    
    // Get request body
    const { username, email, password } = await req.json();
    
    console.log('Username:', username);
    console.log('Email:', email || 'Not provided');
    console.log('Password length:', password?.length);
    
    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Username can only contain letters, numbers, and underscores' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Use provided email or generate one
    const finalEmail = email?.trim() || `${username}@miaoda.com`;
    console.log('Final email:', finalEmail);
    
    // Check if username already exists
    console.log('Checking if username exists...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (checkError) {
      console.error('Database check error:', checkError);
      return new Response(
        JSON.stringify({ error: `Database error: ${checkError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (existingProfile) {
      console.log('Username already exists');
      return new Response(
        JSON.stringify({ error: `Username "${username}" already exists` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Create auth user
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: finalEmail,
      password: password,
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: `Auth error: ${authError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!authData.user) {
      console.error('No user data returned');
      return new Response(
        JSON.stringify({ error: 'No user data returned from auth' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('Auth user created with ID:', authData.user.id);
    console.log('Waiting for trigger to create profile...');
    
    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if profile was created
    console.log('Checking if profile exists...');
    const { data: profileCheck, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (profileCheckError) {
      console.error('Profile check error:', profileCheckError);
      return new Response(
        JSON.stringify({ error: `Profile check error: ${profileCheckError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!profileCheck) {
      console.error('Profile not created by trigger');
      return new Response(
        JSON.stringify({ error: 'Profile was not created by trigger. Check database trigger.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('Profile found, updating...');
    
    // Update profile with username and approval
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: username,
        approved: true,
        temporary_password: password,
      })
      .eq('id', authData.user.id);
    
    if (updateError) {
      console.error('Profile update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Profile update error: ${updateError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log('✓ User created successfully!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User "${username}" created successfully`,
        userId: authData.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: `Unexpected error: ${error.message}`,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
