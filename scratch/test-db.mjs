import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Try to sign in as officer (we don't have the password easily, maybe we can just query as anon or service role)
  // Let's use service_role to bypass RLS and just see if the trigger crashes.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
  if (!serviceKey) {
      console.log("No service key available to test DB directly without user login.");
      return;
  }
  const adminClient = createClient(supabaseUrl, serviceKey);

  // Pick a grievance
  const { data: grievance } = await adminClient.from('grievances').select('*').limit(1).single();
  if (!grievance) return console.log("No grievance found");

  console.log("Updating grievance status to see if triggers crash...");
  const { data, error } = await adminClient.from('grievances').update({ status: 'IN_PROGRESS' }).eq('id', grievance.id);
  
  if (error) {
      console.log("Error details:", JSON.stringify(error, null, 2));
  } else {
      console.log("Success:", data);
  }
}

test();
