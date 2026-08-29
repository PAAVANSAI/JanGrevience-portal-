import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS and fetch all grievances with location data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("grievances")
      .select(`
        id, 
        grievance_number, 
        subject, 
        status, 
        upvote_count, 
        latitude, 
        longitude,
        categories(name)
      `)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Map data error:", error);
      return NextResponse.json({ grievances: [] });
    }

    return NextResponse.json({ grievances: data || [] });
  } catch (err: any) {
    console.error("Map API error:", err);
    return NextResponse.json({ grievances: [] });
  }
}
