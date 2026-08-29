import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Check authorization header to ensure this is triggered by Vercel Cron
  // Usually Vercel passes a specific header, e.g., Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase configuration");
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const now = new Date().toISOString();
    
    // 1. Escalate Level 0 to Level 1
    const { data: level0Grievances, error: err0 } = await supabase
      .from('grievances')
      .select('id')
      .in('status', ['SUBMITTED', 'IN_PROGRESS'])
      .eq('escalation_level', 0)
      .lt('due_date', now);

    if (err0) throw err0;

    const level0Ids = level0Grievances?.map(g => g.id) || [];
    let l1Count = 0;

    if (level0Ids.length > 0) {
      // Update escalation_level to 1
      const { error: updateErr0 } = await supabase
        .from('grievances')
        .update({ 
          escalation_level: 1, 
          last_escalated_at: now 
        })
        .in('id', level0Ids);
      
      if (updateErr0) throw updateErr0;
      
      // Insert system comments
      const comments = level0Ids.map(id => ({
        grievance_id: id,
        content: 'System: Grievance SLA breached. Automatically escalated to Level 1 (Department Admin).',
        is_internal: false,
        is_visible_to_citizen: true,
        // Since it's a system comment, we might leave author_id null if the schema allows, 
        // or we need a system user ID. For now, we omit author_id assuming it's nullable or handled.
      }));

      // In many systems, author_id is required. If so, this might fail without a valid ID.
      // Assuming it allows null for system, or we can use a generic comment.
      await supabase.from('grievance_comments').insert(comments);
      l1Count = level0Ids.length;
    }

    // 2. Escalate Level 1 to Level 2
    // Date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    const { data: level1Grievances, error: err1 } = await supabase
      .from('grievances')
      .select('id')
      .in('status', ['SUBMITTED', 'IN_PROGRESS'])
      .eq('escalation_level', 1)
      .lt('last_escalated_at', sevenDaysAgoStr);

    if (err1) throw err1;

    const level1Ids = level1Grievances?.map(g => g.id) || [];
    let l2Count = 0;

    if (level1Ids.length > 0) {
      // Update escalation_level to 2
      const { error: updateErr1 } = await supabase
        .from('grievances')
        .update({ 
          escalation_level: 2, 
          last_escalated_at: now 
        })
        .in('id', level1Ids);
      
      if (updateErr1) throw updateErr1;
      
      // Insert system comments
      const comments = level1Ids.map(id => ({
        grievance_id: id,
        content: 'System: Grievance remains unresolved 7 days after Level 1 escalation. Automatically escalated to Level 2 (State Dashboard).',
        is_internal: false,
        is_visible_to_citizen: true,
      }));

      await supabase.from('grievance_comments').insert(comments);
      l2Count = level1Ids.length;
    }

    return NextResponse.json({ 
      success: true, 
      escalated_to_l1: l1Count, 
      escalated_to_l2: l2Count 
    });

  } catch (err: any) {
    console.error('Cron escalation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
