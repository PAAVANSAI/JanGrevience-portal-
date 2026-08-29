import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzrxuhplnkjepidilmro.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LAqSrcWvszxOFDLi-icoMQ_pYbf_khx';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const usersToCreate = [
  { email: 'citizen@test.com', password: 'password123', meta: { full_name: 'Test Citizen', phone: '9999999991' } },
  { email: 'officer@test.com', password: 'password123', meta: { full_name: 'Test Officer', phone: '9999999992' } },
  { email: 'deptadmin@test.com', password: 'password123', meta: { full_name: 'Test Dept Admin', phone: '9999999993' } },
  { email: 'superadmin@test.com', password: 'password123', meta: { full_name: 'Test Super Admin', phone: '9999999994' } }
];

async function seedUsers() {
  console.log('Starting user creation...');
  
  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: u.meta
      }
    });

    if (error) {
      console.log(`Error creating ${u.email}:`, error.message);
    } else {
      console.log(`Successfully created ${u.email}`);
    }
  }
  
  console.log('\nAll done! Now run the SQL script to update their roles.');
}

seedUsers();
