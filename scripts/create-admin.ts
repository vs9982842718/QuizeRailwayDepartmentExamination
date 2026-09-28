import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env file
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdminAccount() {
  const username = 'admin';
  const password = 'Admin@Quiz2026!#$';
  const email = `${username}@miaoda.com`;

  console.log('Creating admin account...');

  try {
    // Step 1: Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('Error creating admin account:', signUpError.message);
      return;
    }

    if (!authData.user) {
      console.error('No user data returned');
      return;
    }

    console.log('Admin user created with ID:', authData.user.id);

    // Step 2: Update the user's role to admin and set approved=true using service role key
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin', approved: true })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating admin role:', updateError.message);
      return;
    }

    console.log('✅ Admin account created successfully!');
    console.log('='.repeat(50));
    console.log('Admin Credentials:');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('='.repeat(50));
    console.log('⚠️  Please save these credentials securely!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createAdminAccount();
