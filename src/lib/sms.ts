type SMSProvider = 'twilio' | 'esms' | 'supabase' | 'console';

interface SendSMSOptions {
  to: string; // Phone number in E.164 format (e.g., +84123456789)
  message: string;
}

/**
 * Send SMS message
 * 
 * Supported providers:
 * - esms: Esms.vn SMS service (Khuyến nghị cho Việt Nam - giá rẻ, dễ tích hợp)
 * - twilio: Twilio SMS service (quốc tế, đắt hơn)
 * - supabase: Supabase Auth phone verification (uses Supabase's built-in SMS)
 * - console: Log to console (development only)
 * 
 * Environment variables required:
 * - SMS_PROVIDER: 'esms' | 'twilio' | 'supabase' | 'console' (default: 'console')
 * 
 * For Esms.vn (Khuyến nghị cho VN):
 * - ESMS_API_KEY: API Key từ Esms.vn
 * - ESMS_SECRET_KEY: Secret Key từ Esms.vn
 * - ESMS_BRANDNAME: Brandname đã đăng ký (tùy chọn)
 * 
 * For Twilio:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_PHONE_NUMBER: Your Twilio phone number (e.g., +1234567890)
 * 
 * For Supabase:
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */
export async function sendSMS(options: SendSMSOptions): Promise<void> {
  const provider = (process.env.SMS_PROVIDER || 'console') as SMSProvider;

  // Normalize phone number
  let normalizedPhone: string;
  if (provider === 'esms') {
    // Esms.vn sử dụng định dạng số VN (0xxx hoặc 84xxx)
    normalizedPhone = normalizePhoneForVN(options.to);
  } else {
    // Other providers use E.164 format
    normalizedPhone = normalizePhoneNumber(options.to);
  }

  if (provider === 'esms') {
    return sendSMSViaEsms({ ...options, to: normalizedPhone });
  } else if (provider === 'twilio') {
    return sendSMSViaTwilio({ ...options, to: normalizedPhone });
  } else if (provider === 'supabase') {
    return sendSMSViaSupabase({ ...options, to: normalizedPhone });
  } else {
    return sendSMSViaConsole({ ...options, to: normalizedPhone });
  }
}

/**
 * Normalize phone number for Vietnamese services (Esms.vn)
 * Returns format: 0xxxxxxxxx or 84xxxxxxxxx
 */
function normalizePhoneForVN(phone: string): string {
  if (!phone || phone.trim().length === 0) {
    throw new Error('Số điện thoại không được để trống');
  }

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    throw new Error('Số điện thoại không hợp lệ');
  }

  // If starts with 84, remove it and add 0
  if (cleaned.startsWith('84')) {
    cleaned = '0' + cleaned.substring(2);
  }
  // If doesn't start with 0, add 0
  else if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }

  // Validate Vietnamese phone number (10 digits starting with 0)
  if (!/^0\d{9}$/.test(cleaned)) {
    throw new Error('Số điện thoại Việt Nam không hợp lệ. Định dạng: 0xxxxxxxxx (10 chữ số)');
  }

  return cleaned;
}

/**
 * Normalize phone number to E.164 format
 * Supports Vietnamese phone numbers (starting with 0 or +84)
 * 
 * Examples:
 * - "0123456789" -> "+84123456789"
 * - "+84123456789" -> "+84123456789"
 * - "84123456789" -> "+84123456789"
 * - "+1234567890" -> "+1234567890" (other countries)
 */
function normalizePhoneNumber(phone: string): string {
  if (!phone || phone.trim().length === 0) {
    throw new Error('Số điện thoại không được để trống');
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.length === 0) {
    throw new Error('Số điện thoại không hợp lệ');
  }

  // If already in E.164 format (starts with +), return as is
  if (cleaned.startsWith('+')) {
    // Validate it has at least country code + number (minimum 8 digits after +)
    if (cleaned.length < 9) {
      throw new Error('Số điện thoại không hợp lệ. Định dạng: +84xxxxxxxxx');
    }
    return cleaned;
  }

  // If starts with 0, replace with +84 (Vietnam country code)
  if (cleaned.startsWith('0')) {
    // Remove leading 0 and add +84
    cleaned = '+84' + cleaned.substring(1);
  }
  // If starts with 84 (without +), add +
  else if (cleaned.startsWith('84')) {
    cleaned = '+' + cleaned;
  }
  // If doesn't start with country code, assume Vietnam and add +84
  else {
    cleaned = '+84' + cleaned;
  }

  // Final validation: should have at least 8 digits after country code
  const digitsAfterPlus = cleaned.substring(1).replace(/\D/g, '');
  if (digitsAfterPlus.length < 8) {
    throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập đầy đủ số điện thoại.');
  }

  return cleaned;
}

/**
 * Send SMS via Esms.vn (Dịch vụ SMS Việt Nam)
 * Website: https://esms.vn
 * API Docs: https://esms.vn/api
 */
async function sendSMSViaEsms(options: SendSMSOptions): Promise<void> {
  try {
    const apiKey = process.env.ESMS_API_KEY;
    const secretKey = process.env.ESMS_SECRET_KEY;
    const brandname = process.env.ESMS_BRANDNAME || '';

    if (!apiKey || !secretKey) {
      throw new Error('ESMS_API_KEY và ESMS_SECRET_KEY phải được cấu hình trong .env.local');
    }

    // Esms.vn API endpoint
    const apiUrl = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json';

    // Prepare phone number (remove leading 0, add 84)
    const phoneNumber = options.to.startsWith('0') ? '84' + options.to.substring(1) : options.to;

    // Prepare request body
    const requestBody = {
      ApiKey: apiKey,
      SecretKey: secretKey,
      Phone: phoneNumber,
      Content: options.message,
      Brandname: brandname, // Optional: Brandname đã đăng ký
      SmsType: 2, // 2 = Brandname, 4 = FastSMS
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Esms.vn API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // Check Esms.vn response
    if (result.CodeResult === '100') {
      console.log(`✅ SMS sent via Esms.vn to ${options.to}:`, result.SMSID);
    } else {
      // Esms.vn error codes
      const errorMessages: Record<string, string> = {
        '99': 'Lỗi không xác định',
        '101': 'Đăng nhập thất bại. Kiểm tra API Key và Secret Key',
        '102': 'Tài khoản đã bị khóa',
        '103': 'Số dư tài khoản không đủ',
        '104': 'Brandname không hợp lệ',
        '105': 'Số điện thoại không hợp lệ',
        '106': 'Nội dung tin nhắn không hợp lệ',
      };

      const errorMessage = errorMessages[result.CodeResult] || `Lỗi Esms.vn: ${result.CodeResult}`;
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('❌ Esms.vn SMS error:', error);
    throw error;
  }
}

/**
 * Send SMS via Twilio
 */
async function sendSMSViaTwilio(options: SendSMSOptions): Promise<void> {
  try {
    let twilio: any;
    try {
      twilio = require('twilio');
    } catch (importError: any) {
      if (importError.code === 'MODULE_NOT_FOUND' || importError.message?.includes('Cannot find module')) {
        throw new Error('Twilio package not installed. Run: npm install twilio');
      }
      throw importError;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID và TWILIO_AUTH_TOKEN phải được cấu hình trong .env.local');
    }

    if (!fromPhone) {
      throw new Error('TWILIO_PHONE_NUMBER phải được cấu hình trong .env.local');
    }

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: options.message,
      from: fromPhone,
      to: options.to,
    });

    console.log(`✅ SMS sent via Twilio to ${options.to}:`, message.sid);
  } catch (error: any) {
    console.error('❌ Twilio SMS error:', error);
    if (error.code === 21211) {
      throw new Error('Số điện thoại không hợp lệ. Vui lòng kiểm tra định dạng số điện thoại.');
    }
    if (error.code === 21608) {
      throw new Error('Số điện thoại Twilio chưa được xác minh. Vui lòng xác minh số điện thoại trong Twilio Console.');
    }
    throw error;
  }
}

/**
 * Send SMS via Supabase Auth (using phone OTP)
 * Note: Supabase Auth sends OTP automatically, so we use their API
 */
async function sendSMSViaSupabase(options: SendSMSOptions): Promise<void> {
  try {
    const { supabaseAdmin } = await import('./supabase');

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    // Extract OTP from message (format: "Mã OTP của bạn là: 123456")
    const otpMatch = options.message.match(/\d{6}/);
    if (!otpMatch) {
      throw new Error('Không thể trích xuất OTP từ tin nhắn');
    }

    const otp = otpMatch[0];

    // Use Supabase Auth to send OTP
    // Note: Supabase Auth requires the phone to be associated with a user
    // For password reset, we'll use a workaround by creating a temporary auth session
    
    // Alternative: Use Supabase Edge Functions or direct Twilio integration
    // For now, we'll log a warning and suggest using Twilio directly
    console.warn('⚠️ Supabase Auth SMS requires user authentication. Consider using Twilio for password reset OTP.');
    
    // Try to use Supabase's signInWithOtp (but this requires the phone to be in auth.users)
    // This is a limitation - Supabase Auth OTP is for authentication, not custom messages
    throw new Error('Supabase Auth không hỗ trợ gửi SMS tùy chỉnh. Vui lòng sử dụng Twilio (SMS_PROVIDER=twilio)');
  } catch (error: any) {
    console.error('❌ Supabase SMS error:', error);
    throw error;
  }
}

/**
 * Send SMS via Console (development only)
 */
async function sendSMSViaConsole(options: SendSMSOptions): Promise<void> {
  console.log('\n📱 ===== SMS (CONSOLE MODE) =====');
  console.log('To:', options.to);
  console.log('Message:', options.message);
  console.log('===================================\n');
}

/**
 * Generate OTP SMS message
 */
export function generateOTPSMSMessage(otp: string): string {
  return `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai. - CodeSense AIoT`;
}

