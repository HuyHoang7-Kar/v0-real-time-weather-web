import { type NextRequest, NextResponse } from "next/server"
import { getSensorData, saveSensorData, saveLatestData, getLastUpdated, isKVAvailable } from "@/lib/kv"

export async function POST(request: NextRequest) {
  try {
    console.log("POST request received at /api/sensor")

    // Kiểm tra có phải dữ liệu thủ công (manualData=true) không
    const isManualData = request.nextUrl.searchParams.get("manualData") === "true"

    if (isManualData) {
      let body
      try {
        body = await request.json()
        console.log("Manual data received:", body)
      } catch (error) {
        console.error("Error parsing manual data:", error)
        return NextResponse.json({ error: "Không thể đọc dữ liệu" }, { status: 400 })
      }

      if (Array.isArray(body)) {
        const parsedData = body.map((item, index) => ({
          id: item.id || `manual-${Date.now()}-${index}`,
          temperature: Number(item.temperature ?? item.temp ?? 0),
          humidity: Number(item.humidity ?? item.hum ?? 0),
          timestamp: item.timestamp || item.time || new Date().toISOString(),
        }))

        const currentData = await getSensorData()
        const newData = [...currentData, ...parsedData].slice(-100) // Giới hạn 100 bản ghi

        await saveSensorData(newData)

        if (parsedData.length > 0) {
          // Lấy bản ghi mới nhất dựa trên timestamp
          const latest = parsedData.reduce((prev, curr) => {
            return new Date(curr.timestamp) > new Date(prev.timestamp) ? curr : prev
          }, parsedData[0])
          await saveLatestData(latest)
        }

        return NextResponse.json(
          {
            message: "Dữ liệu thủ công đã được lưu",
            count: parsedData.length,
            dataSource: "manual",
            kvStatus: isKVAvailable() ? "connected" : "local",
          },
          { status: 200 },
        )
      }

      // Nếu dữ liệu manual không phải array
      return NextResponse.json({ error: "Dữ liệu thủ công phải là mảng" }, { status: 400 })
    }

    // Xử lý POST thông thường (ví dụ từ ESP32)
    let bodyText
    try {
      bodyText = await request.text()
      console.log("Raw request body:", bodyText)
    } catch (error) {
      console.error("Error reading request body:", error)
      return NextResponse.json({ error: "Không thể đọc dữ liệu request" }, { status: 400 })
    }

    let body
    try {
      body = JSON.parse(bodyText)
      console.log("Parsed JSON body:", body)
    } catch (error) {
      console.error("Error parsing JSON:", error)
      return NextResponse.json({ error: "Invalid JSON format", rawBody: bodyText }, { status: 400 })
    }

    const temperature = Number(body.temperature)
    const humidity = Number(body.humidity)

    if (isNaN(temperature) || isNaN(humidity)) {
      console.error("Invalid data types after conversion:", { temperature, humidity })
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ. Yêu cầu temperature và humidity là số." },
        { status: 400 },
      )
    }

    const newData = {
      id: Date.now().toString(),
      temperature,
      humidity,
      timestamp: new Date().toISOString(),
    }

    const currentData = await getSensorData()
    const updatedData = [...currentData, newData].slice(-100) // Giới hạn 100 bản ghi

    await saveSensorData(updatedData)
    await saveLatestData(newData)

    console.log("Data saved successfully:", newData)

    return NextResponse.json(
      {
        ...newData,
        kvStatus: isKVAvailable() ? "connected" : "local",
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error processing sensor data:", error)
    return NextResponse.json(
      {
        error: "Lỗi khi xử lý yêu cầu",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("GET request received at /api/sensor")

    const allData = await getSensorData()
    const lastUpdated = await getLastUpdated()

    const latestData = allData.length > 0 ? allData[allData.length - 1] : null

    return NextResponse.json(
      {
        lastReceivedTime: lastUpdated,
        latestData,
        totalRecords: allData.length,
        allData,
        dataSource: "api",
        kvStatus: isKVAvailable() ? "connected" : "local",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching sensor data:", error)
    return NextResponse.json(
      {
        error: "Lỗi khi lấy dữ liệu cảm biến",
        details: String(error),
        lastReceivedTime: new Date().toISOString(),
        latestData: null,
        totalRecords: 0,
        allData: [],
        kvStatus: isKVAvailable() ? "connected" : "local",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Content-Type": "application/json",
        },
      },
    )
  }
}
