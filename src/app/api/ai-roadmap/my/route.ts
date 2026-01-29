import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 2. Try to use RPC function first, fallback to direct query
    try {
      const { data: roadmaps, error } = await supabaseAdmin!
        .rpc('get_user_roadmaps_summary', { p_user_id: userId });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: roadmaps || [],
      });
    } catch (rpcError) {
      // Fallback to direct query if RPC doesn't exist
      console.log('RPC not available, using direct query');
      
      const { data: roadmaps, error } = await supabaseAdmin!
        .from('ai_generated_roadmaps')
        .select(`
          id,
          title,
          description,
          total_estimated_hours,
          nodes,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching roadmaps:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch roadmaps' },
          { status: 500 }
        );
      }

      // Calculate progress for each roadmap
      const roadmapsWithProgress = await Promise.all(
        (roadmaps || []).map(async (roadmap) => {
          const totalNodes = Array.isArray(roadmap.nodes) ? roadmap.nodes.length : 0;
          
          const { count: completedCount } = await supabaseAdmin!
            .from('ai_roadmap_node_progress')
            .select('*', { count: 'exact', head: true })
            .eq('roadmap_id', roadmap.id)
            .eq('status', 'completed');

          const completedNodes = completedCount || 0;
          const progressPercentage = totalNodes > 0 
            ? Math.round((completedNodes / totalNodes) * 100) 
            : 0;

          return {
            id: roadmap.id,
            title: roadmap.title,
            description: roadmap.description,
            total_nodes: totalNodes,
            completed_nodes: completedNodes,
            progress_percentage: progressPercentage,
            created_at: roadmap.created_at,
            updated_at: roadmap.updated_at,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: roadmapsWithProgress,
      });
    }

  } catch (error) {
    console.error('Get roadmaps error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
