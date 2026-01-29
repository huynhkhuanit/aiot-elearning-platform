import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { NodeStatus } from '@/types/ai-roadmap';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateProgressRequest {
  node_id: string;
  status: NodeStatus;
  notes?: string;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roadmapId } = await params;

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

    // 2. Parse request body
    const body: UpdateProgressRequest = await request.json();
    const { node_id, status, notes } = body;

    if (!node_id || !status) {
      return NextResponse.json(
        { success: false, error: 'node_id and status are required' },
        { status: 400 }
      );
    }

    // 3. Verify roadmap belongs to user
    const { data: roadmap, error: roadmapError } = await supabaseAdmin!
      .from('ai_generated_roadmaps')
      .select('id')
      .eq('id', roadmapId)
      .eq('user_id', userId)
      .single();

    if (roadmapError || !roadmap) {
      return NextResponse.json(
        { success: false, error: 'Roadmap not found' },
        { status: 404 }
      );
    }

    // 4. Upsert progress (try RPC first, fallback to direct upsert)
    try {
      const { data: result, error } = await supabaseAdmin!
        .rpc('update_node_progress', {
          p_roadmap_id: roadmapId,
          p_user_id: userId,
          p_node_id: node_id,
          p_status: status,
          p_notes: notes || null,
        });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (rpcError) {
      // Fallback to direct upsert
      const { data: result, error } = await supabaseAdmin!
        .from('ai_roadmap_node_progress')
        .upsert({
          roadmap_id: roadmapId,
          user_id: userId,
          node_id: node_id,
          status: status,
          notes: notes || null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        }, {
          onConflict: 'roadmap_id,node_id',
        })
        .select()
        .single();

      if (error) {
        console.error('Update progress error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: roadmapId } = await params;

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

    // 2. Fetch all progress for the roadmap
    const { data: progress, error } = await supabaseAdmin!
      .from('ai_roadmap_node_progress')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .eq('user_id', userId);

    if (error) {
      console.error('Get progress error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Convert to map format
    const progressMap: Record<string, { status: string; completed_at: string | null; notes: string | null }> = {};
    if (progress) {
      progress.forEach((p) => {
        progressMap[p.node_id] = {
          status: p.status,
          completed_at: p.completed_at,
          notes: p.notes,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: progressMap,
    });

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
