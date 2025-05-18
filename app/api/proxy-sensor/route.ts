import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Lấy URL từ body request
    const body = await request.json()
    const url = body.url || "https://v0-real-time-weather-web.vercel.app/api/sensor"

    console.log("Proxying request to:", url)

    // Thêm timestamp để tránh cache
    const timestamp = new Date().getTime()
    const urlWithTimestamp = `${url}${url.includes("?") ? "&" : "?"}t=${timestamp}`

    // Thực hiện fetch từ server (không có vấn đề CORS ở server)
    const response = await fetch(urlWithTimestamp, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "ESP32-Dashboard-Proxy",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Đọc dữ liệu từ response
    const data = await response.json()

    // Trả về dữ liệu cho client
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("Error in proxy-sensor:", error)
    return NextResponse.json(
      {
        error: "Lỗi khi lấy dữ liệu từ API bên ngoài",
        details: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
