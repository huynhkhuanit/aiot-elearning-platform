import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key-here") {
      return NextResponse.json(
        { 
          error: "OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env.local file.",
          details: "Get your API key from: https://platform.openai.com/api-keys"
        },
        { status: 500 }
      )
    }

    const { code, language } = await request.json()

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Bạn là một chuyên gia đánh giá code chuyên nghiệp trên nền tảng học lập trình trực tuyến CodeSense AIoT - một trang web học lập trình cho sinh viên và người mới bắt đầu tại Việt Nam.

NGỮ CẢNH:
- Đây là code được viết bởi học viên đang học lập trình
- Mục đích: Thực hành và học tập các kỹ năng lập trình cơ bản đến nâng cao
- Đối tượng: Sinh viên, học sinh, người mới bắt đầu học lập trình
- Nền tảng: CodeSense AIoT - E-learning platform cho lập trình viên Việt Nam

CODE CẦN ĐÁNH GIÁ (${language}):
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

YÊU CẦU ĐÁNH GIÁ:
1. Phân tích code trong bối cảnh học tập (không phải production)
2. Đánh giá dựa trên level của người học (cơ bản, trung bình, nâng cao)
3. Nhận xét cụ thể về từng khía cạnh của code
4. Đưa ra gợi ý cải thiện phù hợp với trình độ
5. Khuyến khích và động viên học viên tiếp tục học tập

ĐỊNH DẠNG PHẢN HỒI (JSON):
{
  "score": <điểm từ 0-10 (số thập phân), dựa trên độ phức tạp và chất lượng code>,
  "pros": [
    "<2-4 điểm mạnh CỤ THỂ của code, ví dụ: 'Sử dụng đúng cú pháp vòng lặp for', 'Code có cấu trúc rõ ràng', 'Đặt tên biến có ý nghĩa'>",
    "..."
  ],
  "cons": [
    "<2-4 điểm CẦN CẢI THIỆN, ví dụ: 'Thiếu xử lý lỗi khi input không hợp lệ', 'Nên thêm comment giải thích logic', 'Có thể tối ưu thuật toán bằng cách...'>",
    "..."
  ],
  "suggestions": [
    "<2-4 gợi ý CỤ THỂ và DỄ THỰC HIỆN để cải thiện code, ví dụ: 'Thêm try-catch để bắt lỗi', 'Tách function nhỏ hơn để dễ đọc', 'Sử dụng const thay vì let cho biến không đổi'>",
    "..."
  ]
}

TIÊU CHÍ ĐÁNH GIÁ:
- Cú pháp (Syntax): Code có chạy được không? Có lỗi cú pháp không?
- Logic: Thuật toán có đúng không? Xử lý edge case chưa?
- Best Practices: Tuân thủ quy ước đặt tên, cấu trúc code
- Hiệu năng: Có cách tối ưu hơn không?
- Bảo mật: Có lỗ hổng bảo mật cơ bản không? (SQL injection, XSS, etc.)
- Khả năng đọc: Code dễ hiểu không? Comment đủ chưa?
- Khả năng mở rộng: Code có dễ maintain và scale không?

LƯU Ý:
- Tất cả phản hồi phải bằng TIẾNG VIỆT
- Đánh giá phải CỤ THỂ, không chung chung
- Khuyến khích tích cực, không làm nản lòng học viên
- Nếu code quá đơn giản, gợi ý thêm tính năng mới
- Nếu code phức tạp, khen ngợi và gợi ý cải thiện nhỏ

Hãy trả về JSON format chính xác như trên.`,
    })

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI")
    }

    const reviewData = JSON.parse(jsonMatch[0])

    // Validate response structure
    if (
      typeof reviewData.score !== "number" ||
      !Array.isArray(reviewData.pros) ||
      !Array.isArray(reviewData.cons) ||
      !Array.isArray(reviewData.suggestions)
    ) {
      throw new Error("Invalid review data structure")
    }

    return NextResponse.json(reviewData)
  } catch (error) {
    console.error("AI Review Error:", error)
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { 
            error: "OpenAI API key issue",
            details: "Please check your OPENAI_API_KEY in .env.local file"
          },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to generate AI review",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
