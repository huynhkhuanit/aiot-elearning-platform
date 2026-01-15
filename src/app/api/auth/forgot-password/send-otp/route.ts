import { NextRequest, NextResponse } from 'next/server';
import { queryOneBuilder, insert, update, queryBuilder } from '@/lib/db';
import { sendEmail, generateOTPEmailHTML, generateOTPEmailText } from '@/lib/email';
import { sendSMS, generateOTPSMSMessage } from '@/lib/sms';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password/send-otp
 * 
 * Gửi mã OTP 6 số về email hoặc số điện thoại
 * 
 * Body:
 * - method: 'email' | 'phone'
 * - email?: string (nếu method = 'email')
 * - phone?: string (nếu method = 'phone')
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, email, phone } = body;

    // Validate input
    if (!method || !['email', 'phone'].includes(method)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Phương thức không hợp lệ. Vui lòng chọn email hoặc số điện thoại',
        },
        { status: 400 }
      );
    }

    if (method === 'email' && !email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng nhập email',
        },
        { status: 400 }
      );
    }

    if (method === 'phone' && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng nhập số điện thoại',
        },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await queryOneBuilder<{
      id: string;
      email: string;
      phone: string | null;
    }>('users', {
      select: 'id, email, phone',
      filters: method === 'email' ? { email } : { phone },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json(
        {
          success: true,
          message: 'Nếu tài khoản tồn tại, mã OTP đã được gửi',
        },
        { status: 200 }
      );
    }

    // Check if user has the required contact method
    if (method === 'email' && user.email !== email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email không khớp với tài khoản',
        },
        { status: 400 }
      );
    }

    if (method === 'phone' && (!user.phone || user.phone !== phone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Số điện thoại không khớp với tài khoản',
        },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    console.log('[SEND OTP] Generated OTP:', {
      otp,
      expiresAt: expiresAt.toISOString(),
      expiresIn: '10 minutes',
      now: new Date().toISOString(),
    });

    // Hash OTP for storage
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const otpHash = crypto
      .createHash('sha256')
      .update(otp + secret)
      .digest('hex');

    // Store OTP in user_metadata
    const metaKey = `password_reset_otp_${method}`;
    const metaValue = JSON.stringify({
      hash: otpHash,
      expiresAt: expiresAt.toISOString(),
      attempts: 0,
      maxAttempts: 5,
    });

    // Check if OTP already exists
    const existingOtp = await queryOneBuilder<{ 
      id: string;
      meta_value: string;
    }>('user_metadata', {
      select: 'id, meta_value',
      filters: {
        user_id: user.id,
        meta_key: metaKey,
      },
    });

    if (existingOtp) {
      // Log old OTP info before updating
      try {
        const oldOtpData = JSON.parse(existingOtp.meta_value);
        const oldExpiresAt = new Date(oldOtpData.expiresAt);
        const now = new Date();
        console.log('[SEND OTP] Replacing existing OTP:', {
          oldExpiresAt: oldExpiresAt.toISOString(),
          now: now.toISOString(),
          oldExpired: now.getTime() > oldExpiresAt.getTime(),
        });
      } catch (e) {
        console.log('[SEND OTP] Could not parse old OTP data');
      }
      
      // Update existing OTP
      // Note: update(table, filters, data) - filters first, then data
      const updateResult = await update('user_metadata', 
        { user_id: user.id, meta_key: metaKey },
        { meta_value: metaValue, updated_at: new Date().toISOString() }
      );
      console.log('[SEND OTP] Updated existing OTP record:', {
        rowsUpdated: updateResult.length,
        newExpiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Insert new OTP
      await insert('user_metadata', {
        user_id: user.id,
        meta_key: metaKey,
        meta_value: metaValue,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('[SEND OTP] Created new OTP record');
    }

    // Send OTP via email/SMS service
    if (method === 'email') {
      try {
        // Get user's full name for personalized email
        const userWithName = await queryOneBuilder<{
          full_name: string | null;
        }>('users', {
          select: 'full_name',
          filters: { id: user.id },
        });

        const userName = userWithName?.full_name || undefined;

        // Send email with OTP
        await sendEmail({
          to: email,
          subject: 'Mã xác thực đặt lại mật khẩu - CodeSense AIoT',
          html: generateOTPEmailHTML(otp, userName),
          text: generateOTPEmailText(otp, userName),
        });

        console.log(`✅ OTP email sent to ${email}`);
      } catch (emailError: any) {
        console.error('[FORGOT PASSWORD SEND OTP] Email error:', emailError);
        // Don't fail the request if email fails (for development)
        // In production, you might want to throw or log to monitoring service
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] Email failed, OTP: ${otp}`);
        }
      }
    } else if (method === 'phone') {
      try {
        // Normalize phone number and send SMS
        const smsMessage = generateOTPSMSMessage(otp);
        await sendSMS({
          to: phone,
          message: smsMessage,
        });

        console.log(`✅ OTP SMS sent to ${phone}`);
      } catch (smsError: any) {
        console.error('[FORGOT PASSWORD SEND OTP] SMS error:', smsError);
        
        // In development, log OTP even if SMS fails
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] SMS failed, OTP for ${phone}: ${otp}`);
          console.log(`[DEV] OTP expires at: ${expiresAt.toISOString()}`);
          // In development, continue even if SMS fails
        } else {
          // In production, return error response
          return NextResponse.json(
            {
              success: false,
              message: `Không thể gửi SMS: ${smsError.message || 'Lỗi không xác định'}`,
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Mã OTP đã được gửi đến ${method === 'email' ? 'email' : 'số điện thoại'} của bạn`,
        // Only return OTP in development
        ...(process.env.NODE_ENV === 'development' && { otp }),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[FORGOT PASSWORD SEND OTP] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau',
      },
      { status: 500 }
    );
  }
}

