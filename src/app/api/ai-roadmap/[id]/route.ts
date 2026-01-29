import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
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

    // 2. Fetch roadmap (only active ones)
    const { data: roadmap, error: roadmapError } = await supabaseAdmin!
      .from('ai_generated_roadmaps')
      .select('*')
      .eq('id', roadmapId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (roadmapError) {
      console.error('Error fetching roadmap:', roadmapError);
      // Check if it's a "not found" error or something else
      if (roadmapError.code === 'PGRST116' || roadmapError.message?.includes('No rows')) {
        return NextResponse.json(
          { success: false, error: 'Roadmap not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to fetch roadmap: ' + roadmapError.message },
        { status: 500 }
      );
    }

    if (!roadmap) {
      return NextResponse.json(
        { success: false, error: 'Roadmap not found' },
        { status: 404 }
      );
    }

    // 3. Fetch progress for all nodes
    const { data: progress, error: progressError } = await supabaseAdmin!
      .from('ai_roadmap_node_progress')
      .select('node_id, status, completed_at, notes')
      .eq('roadmap_id', roadmapId)
      .eq('user_id', userId);

    // Convert progress to a map
    const progressMap: Record<string, string> = {};
    if (progress) {
      progress.forEach((p) => {
        progressMap[p.node_id] = p.status;
      });
    }

    // 4. Return roadmap with progress
    return NextResponse.json({
      success: true,
      data: {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        total_estimated_hours: roadmap.total_estimated_hours,
        phases: roadmap.phases,
        nodes: roadmap.nodes,
        edges: roadmap.edges,
        generation_metadata: roadmap.generation_metadata,
        created_at: roadmap.created_at,
        progress: progressMap,
      },
    });

  } catch (error) {
    console.error('Get roadmap error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // 2. Soft delete (set is_active to false)
    const { error } = await supabaseAdmin!
      .from('ai_generated_roadmaps')
      .update({ is_active: false })
      .eq('id', roadmapId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete roadmap error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete roadmap' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Roadmap deleted successfully',
    });

  } catch (error) {
    console.error('Delete roadmap error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
