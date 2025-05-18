import { type NextRequest, NextResponse } from "next/server"

// URL của datasheet bên ngoài - thay thế bằng URL thực của bạn
const EXTERNAL_DATA_URL = "https://example.com/your-datasheet-url"

export async function GET(request: NextRequest) {
  try {
    // Lấy tham số URL từ request
    const url = request.nextUrl.searchParams.get("url") || EXTERNAL_DATA_URL

    console.log("Fetching external data from:", url)

    // Fetch dữ liệu từ URL bên ngoài
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Đọc dữ liệu dưới dạng text
    const text = await response.text()

    // Kiểm tra định dạng dữ liệu
    let data
    let format = "unknown"

    // Thử parse JSON
    try {
      data = JSON.parse(text)
      format = "json"
    } catch (e) {
      // Nếu không phải JSON, giả sử là CSV
      const rows = text.trim().split("\n")

      // Kiểm tra xem có phải CSV không
      if (rows.length > 0 && rows[0].includes(",")) {
        format = "csv"

        // Xác định header
        const headers = rows[0].split(",")

        // Parse dữ liệu
        data = rows.slice(1).map((row, index) => {
          const values = row.split(",")
          const rowData: Record<string, any> = { id: `row-${index}` }

          headers.forEach((header, i) => {
            const value = values[i]
            // Thử chuyển đổi sang số nếu có thể
            const numValue = Number(value)
            rowData[header.trim()] = isNaN(numValue) ? value : numValue
          })

          return rowData
        })
      } else {
        // Nếu không phải CSV, trả về text nguyên bản
        data = { rawText: text }
      }
    }

    return NextResponse.json({
      format,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching external data:", error)
    return NextResponse.json(
      {
        error: "Lỗi khi lấy dữ liệu từ nguồn bên ngoài",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
