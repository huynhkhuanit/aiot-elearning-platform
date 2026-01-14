import { NextRequest, NextResponse } from 'next/server';
import { queryOneBuilder } from '@/lib/db';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import crypto from 'crypto';

/**
 * GET /api/auth/recovery-key/download
 * 
 * Download recovery keys dưới dạng .txt file
 * Chỉ trả về keys nếu user vừa đăng ký (keys được lưu tạm trong session hoặc trả về từ register)
 * 
 * Body (POST) hoặc Query (GET):
 * - recoveryKeys: string[] (array of recovery keys)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookieToken = request.cookies.get('auth_token')?.value;
    const headerToken = extractTokenFromHeader(request.headers.get('Authorization'));
    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng đăng nhập',
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token không hợp lệ',
        },
        { status: 401 }
      );
    }

    // Get recovery keys from query params (passed from frontend)
    const { searchParams } = new URL(request.url);
    const recoveryKeysParam = searchParams.get('keys');

    if (!recoveryKeysParam) {
      return NextResponse.json(
        {
          success: false,
          message: 'Không tìm thấy recovery keys',
        },
        { status: 400 }
      );
    }

    let recoveryKeys: string[];
    try {
      recoveryKeys = JSON.parse(recoveryKeysParam);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Định dạng recovery keys không hợp lệ',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(recoveryKeys) || recoveryKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Recovery keys không hợp lệ',
        },
        { status: 400 }
      );
    }

    // Format recovery keys for download (similar to GitHub format)
    const content = `CodeSense AIoT Recovery Keys
=====================

Lưu ý: Hãy lưu trữ file này ở nơi an toàn. Mỗi recovery key chỉ có thể sử dụng một lần để khôi phục mật khẩu.

Nếu bạn mất tất cả các recovery keys này, bạn sẽ không thể khôi phục tài khoản nếu quên mật khẩu.

Danh sách Recovery Keys:
${recoveryKeys.map((key, index) => `${index + 1}. ${key}`).join('\n')}

Ngày tạo: ${new Date().toLocaleString('vi-VN')}

Cách sử dụng:
1. Nếu bạn quên mật khẩu và không thể truy cập email
2. Sử dụng một trong các recovery keys trên trong form "Quên mật khẩu"
3. Mỗi key chỉ có thể sử dụng một lần
4. Sau khi sử dụng hết, bạn cần tạo recovery keys mới sau khi đăng nhập

Bảo mật:
- Không chia sẻ recovery keys với bất kỳ ai
- Lưu trữ file này ở nơi an toàn, không lưu trên cloud công cộng
- Xóa file này sau khi đã sao lưu an toàn
`;

    // Return as downloadable text file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="codesense-aiot-recovery-keys-${Date.now()}.txt"`,
      },
    });
  } catch (error: any) {
    console.error('[RECOVERY KEY DOWNLOAD] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/recovery-key/download
 * 
 * Download recovery keys dưới dạng .txt file (POST version)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieToken = request.cookies.get('auth_token')?.value;
    const headerToken = extractTokenFromHeader(request.headers.get('Authorization'));
    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng đăng nhập',
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Token không hợp lệ',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recoveryKeys } = body;

    if (!Array.isArray(recoveryKeys) || recoveryKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Recovery keys không hợp lệ',
        },
        { status: 400 }
      );
    }

    // Format recovery keys for download (similar to GitHub format)
    const content = `CodeSense AIoT Recovery Keys
=====================

Lưu ý: Hãy lưu trữ file này ở nơi an toàn. Mỗi recovery key chỉ có thể sử dụng một lần để khôi phục mật khẩu.

Nếu bạn mất tất cả các recovery keys này, bạn sẽ không thể khôi phục tài khoản nếu quên mật khẩu.

Danh sách Recovery Keys:
${recoveryKeys.map((key: string, index: number) => `${index + 1}. ${key}`).join('\n')}

Ngày tạo: ${new Date().toLocaleString('vi-VN')}

Cách sử dụng:
1. Nếu bạn quên mật khẩu và không thể truy cập email
2. Sử dụng một trong các recovery keys trên trong form "Quên mật khẩu"
3. Mỗi key chỉ có thể sử dụng một lần
4. Sau khi sử dụng hết, bạn cần tạo recovery keys mới sau khi đăng nhập

Bảo mật:
- Không chia sẻ recovery keys với bất kỳ ai
- Lưu trữ file này ở nơi an toàn, không lưu trên cloud công cộng
- Xóa file này sau khi đã sao lưu an toàn
`;

    // Return as downloadable text file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="codesense-aiot-recovery-keys-${Date.now()}.txt"`,
      },
    });
  } catch (error: any) {
    console.error('[RECOVERY KEY DOWNLOAD] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau',
      },
      { status: 500 }
    );
  }
}

