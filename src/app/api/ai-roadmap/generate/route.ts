import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import type { UserProfile, GenerateRoadmapResponse, AIGeneratedRoadmapDB } from '@/types/ai-roadmap';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

interface GenerateRequest {
  profile: UserProfile;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // 2. Parse request body
    const body: GenerateRequest = await request.json();
    const { profile } = body;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile is required' },
        { status: 400 }
      );
    }

    // 3. Save user profile to database (optional - continue even if fails)
    let savedProfile = null;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin!
        .from('user_ai_profiles')
        .insert({
          user_id: userId,
          current_job_role: profile.currentRole, // Map camelCase to snake_case
          target_role: profile.targetRole,
          current_skills: profile.currentSkills,
          skill_level: profile.skillLevel,
          learning_style: profile.learningStyle,
          hours_per_week: profile.hoursPerWeek,
          target_months: profile.targetMonths,
          preferred_language: profile.preferredLanguage,
          focus_areas: profile.focusAreas || [],
        })
        .select()
        .single();

      if (!profileError && profileData) {
        savedProfile = profileData;
      } else {
        // Table might not exist yet - this is OK, continue without saving
        console.warn('Profile save skipped (table may not exist):', profileError?.message || 'Unknown error');
      }
    } catch (err: any) {
      // Non-critical error - continue without saving profile
      console.warn('Profile save error (non-critical):', err?.message || err);
    }

    // 4. Call FastAPI to generate roadmap
    const startTime = Date.now();
    
    let fastApiResponse: Response;
    try {
      fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            current_role: profile.currentRole, // FastAPI expects current_role
            target_role: profile.targetRole,
            current_skills: profile.currentSkills,
            skill_level: profile.skillLevel,
            learning_style: profile.learningStyle,
            hours_per_week: profile.hoursPerWeek,
            target_months: profile.targetMonths,
            preferred_language: profile.preferredLanguage,
            focus_areas: profile.focusAreas,
          },
        }),
        // Add timeout
        signal: AbortSignal.timeout(60000), // 60 seconds timeout
      });
    } catch (fetchError: any) {
      console.error('FastAPI connection error:', fetchError);
      
      // Check if it's a timeout or connection error
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'AI service timeout. Vui lòng thử lại sau.' 
          },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Không thể kết nối đến AI service. Vui lòng kiểm tra FastAPI đã chạy chưa (http://localhost:8000).' 
        },
        { status: 503 }
      );
    }

    if (!fastApiResponse.ok) {
      const errorText = await fastApiResponse.text();
      let errorMessage = 'Failed to generate roadmap';
      
      try {
        const errorJson = JSON.parse(errorText);
        const detail = errorJson.detail || errorText;
        
        // Handle specific Groq API errors
        if (detail.includes('rate_limit') || detail.includes('429')) {
          errorMessage = 'Groq API rate limit exceeded. Vui lòng đợi 1 phút và thử lại. (Free tier: 30 requests/phút)';
        } else if (detail.includes('invalid_api_key') || detail.includes('401') || detail.includes('GROQ_API_KEY')) {
          errorMessage = 'Groq API key không hợp lệ. Vui lòng kiểm tra GROQ_API_KEY trong ai-service/.env. Lấy API key miễn phí tại: https://console.groq.com/';
        } else if (detail.includes('connection') || detail.includes('503')) {
          errorMessage = 'Không thể kết nối đến Groq API. Vui lòng kiểm tra kết nối internet.';
        } else {
          errorMessage = `AI service error: ${detail.substring(0, 200)}`;
        }
      } catch {
        // If can't parse, use raw error text
        if (errorText.includes('rate_limit') || errorText.includes('429')) {
          errorMessage = 'Groq API rate limit exceeded. Vui lòng đợi 1 phút.';
        } else if (errorText.includes('401') || errorText.includes('api_key')) {
          errorMessage = 'Groq API key không hợp lệ. Lấy key miễn phí tại: https://console.groq.com/';
        } else {
          errorMessage = errorText.substring(0, 200) || 'Failed to generate roadmap';
        }
      }
      
      console.error('FastAPI error:', errorText);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: fastApiResponse.status >= 500 ? 503 : fastApiResponse.status }
      );
    }

    let aiResponse: any;
    try {
      aiResponse = await fastApiResponse.json();
    } catch (parseError) {
      console.error('Failed to parse FastAPI response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }
    
    const totalLatency = Date.now() - startTime;

    // 5. Save generated roadmap to database
    let savedRoadmap = null;
    try {
      const { data: roadmapData, error: roadmapError } = await supabaseAdmin!
        .from('ai_generated_roadmaps')
        .insert({
          user_id: userId,
          profile_id: savedProfile?.id || null,
          title: aiResponse.roadmap.roadmap_title,
          description: aiResponse.roadmap.roadmap_description,
          total_estimated_hours: aiResponse.roadmap.total_estimated_hours,
          phases: aiResponse.roadmap.phases,
          nodes: aiResponse.roadmap.nodes,
          edges: aiResponse.roadmap.edges,
          generation_metadata: {
            ...aiResponse.metadata,
            total_latency_ms: totalLatency,
          },
          is_active: true,
        })
        .select()
        .single();

      if (roadmapError) {
        console.error('Error saving roadmap:', roadmapError);
        
        // If table doesn't exist, return roadmap data anyway (user can still view it)
        if (roadmapError.code === 'PGRST204' || roadmapError.message?.includes('does not exist') || roadmapError.message?.includes('schema cache')) {
          console.warn('Roadmap table does not exist. Returning roadmap without saving.');
          // Return roadmap with a temporary ID
          return NextResponse.json({
            success: true,
            data: {
              id: `temp-${Date.now()}`,
              ...aiResponse.roadmap,
              metadata: {
                ...aiResponse.metadata,
                total_latency_ms: totalLatency,
              },
            },
            warning: 'Roadmap generated successfully but not saved to database. Please run database migration (scripts/ai-roadmap-schema.sql) to enable persistence.',
          });
        }
        
        return NextResponse.json(
          { success: false, error: 'Failed to save roadmap to database: ' + roadmapError.message },
          { status: 500 }
        );
      }
      
      savedRoadmap = roadmapData;
      console.log('Roadmap saved successfully with ID:', savedRoadmap.id);
    } catch (err: any) {
      console.error('Unexpected error saving roadmap:', err);
      // Return roadmap anyway if it was generated successfully
      return NextResponse.json({
        success: true,
        data: {
          id: `temp-${Date.now()}`,
          ...aiResponse.roadmap,
          metadata: {
            ...aiResponse.metadata,
            total_latency_ms: totalLatency,
          },
        },
        warning: 'Roadmap generated but database save failed: ' + (err?.message || 'Unknown error'),
      });
    }

    // 6. Return success response
    if (!savedRoadmap) {
      // This shouldn't happen, but handle it gracefully
      console.warn('Roadmap was not saved but no error was thrown');
      return NextResponse.json({
        success: true,
        data: {
          id: `temp-${Date.now()}`,
          ...aiResponse.roadmap,
          metadata: {
            ...aiResponse.metadata,
            total_latency_ms: totalLatency,
          },
        },
        warning: 'Roadmap generated but not saved to database.',
      });
    }
    
    console.log('Returning roadmap with ID:', savedRoadmap.id);
    return NextResponse.json({
      success: true,
      data: {
        id: savedRoadmap.id,
        ...aiResponse.roadmap,
        metadata: {
          ...aiResponse.metadata,
          total_latency_ms: totalLatency,
        },
      },
    });

  } catch (error: any) {
    console.error('Generate roadmap error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
