import { type NextRequest, NextResponse } from "next/server"

// Lưu trữ các yêu cầu gần đây
const recentRequests: any[] = []

export async function GET() {
  return NextResponse.json({
    recentRequests,
    serverTime: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    // Lưu thông tin yêu cầu
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const bodyText = await request.text()
    let bodyJson = null

    try {
      bodyJson = JSON.parse(bodyText)
    } catch (e) {
      // Không làm gì nếu không phải JSON
    }

    const requestInfo = {
      method: "POST",
      timestamp: new Date().toISOString(),
      headers,
      bodyText,
      bodyJson,
    }

    // Thêm vào đầu mảng
    recentRequests.unshift(requestInfo)

    // Giữ chỉ 10 yêu cầu gần nhất
    if (recentRequests.length > 10) {
      recentRequests.length = 10
    }

    // Trả về dữ liệu đã nhận
    return NextResponse.json({
      message: "Dữ liệu đã được nhận",
      data: bodyJson,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in debug-sensor POST:", error)
    return NextResponse.json({ error: "Lỗi khi xử lý yêu cầu", details: String(error) }, { status: 500 })
  }
}
