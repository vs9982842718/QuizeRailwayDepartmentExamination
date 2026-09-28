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
    console.log('=== Starting bulk user creation ===');
    
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

    const password = '123456';
    
    // Named users
    const namedUsers = [
      'jitendra', 'jeetaram', 'surendra', 'joravar', 'neeraj',
      'rakesh', 'uma', 'chandraprakash', 'siyaram', 'anil'
    ];
    
    // Numbered users (01 to 100)
    const numberedUsers = Array.from({ length: 100 }, (_, i) => 
      String(i + 1).padStart(2, '0')
    );
    
    const allUsers = [...namedUsers, ...numberedUsers];
    console.log(`Total users to create: ${allUsers.length}`);
    
    const results = [];
    const errors = [];

    for (const username of allUsers) {
      try {
        console.log(`\n--- Processing user: ${username} ---`);
        const email = `${username}@miaoda.com`;

        // Check if user already exists by username
        console.log(`Checking if username "${username}" exists...`);
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('username, id')
          .eq('username', username)
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking username: ${checkError.message}`);
          errors.push({ username, error: `Check failed: ${checkError.message}` });
          continue;
        }

        if (existingProfile) {
          console.log(`Username "${username}" already exists, skipping`);
          results.push({ username, status: 'skipped', reason: 'username already exists' });
          continue;
        }

        // Check if email already exists
        console.log(`Checking if email "${email}" exists...`);
        const { data: existingAuth, error: authCheckError } = await supabase.auth.admin.listUsers();
        
        if (authCheckError) {
          console.error(`Error checking auth users: ${authCheckError.message}`);
        }
        
        const emailExists = existingAuth?.users?.some(u => u.email === email);
        if (emailExists) {
          console.log(`Email "${email}" already exists, skipping`);
          results.push({ username, status: 'skipped', reason: 'email already exists' });
          continue;
        }

        // Create user
        console.log(`Creating auth user for "${username}"...`);
        const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (signUpError) {
          console.error(`Auth creation error for "${username}":`, signUpError.message);
          errors.push({ username, error: `Auth error: ${signUpError.message}` });
          continue;
        }

        if (!authData.user) {
          console.error(`No user data returned for "${username}"`);
          errors.push({ username, error: 'No user data returned from auth' });
          continue;
        }

        console.log(`Auth user created with ID: ${authData.user.id}`);

        // Wait for trigger to create profile
        console.log('Waiting for trigger to create profile...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if profile was created by trigger
        console.log('Checking if profile was created by trigger...');
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (!profileCheck) {
          console.error(`Profile not created by trigger for user ID: ${authData.user.id}`);
          errors.push({ username, error: 'Profile not created by trigger' });
          continue;
        }

        console.log(`Profile found, updating with username and approval...`);

        // Update profile with username and approval
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username,
            approved: true,
            temporary_password: password,
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error(`Profile update error for "${username}":`, updateError.message);
          errors.push({ username, error: `Profile update error: ${updateError.message}` });
          continue;
        }

        console.log(`✓ User "${username}" created successfully`);
        results.push({ username, status: 'created', userId: authData.user.id });
      } catch (error) {
        console.error(`Unexpected error for "${username}":`, error);
        errors.push({ username, error: `Unexpected error: ${error.message}` });
      }
    }

    console.log('\n=== Bulk user creation completed ===');
    console.log(`Created: ${results.filter(r => r.status === 'created').length}`);
    console.log(`Skipped: ${results.filter(r => r.status === 'skipped').length}`);
    console.log(`Failed: ${errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: allUsers.length,
        created: results.filter(r => r.status === 'created').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        failed: errors.length,
        results,
        errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('FATAL ERROR in bulk user creation:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
