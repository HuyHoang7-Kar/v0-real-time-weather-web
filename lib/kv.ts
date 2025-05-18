// Kiểm tra xem KV đã được cấu hình chưa
const isKVConfigured =
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_URL.startsWith("https://") &&
  process.env.KV_REST_API_TOKEN

// Biến lưu dữ liệu tạm thời nếu không dùng được KV
let localSensorData: any[] = []
let localLatestData: any = null
let localLastUpdated: string = new Date().toISOString()

// Import KV nếu được cấu hình
let kv: any = null
if (isKVConfigured) {
  try {
    const { kv: kvClient } = require("@vercel/kv")
    kv = kvClient
    console.log("✅ Vercel KV initialized successfully")
  } catch (error) {
    console.error("❌ Failed to initialize Vercel KV:", error)
  }
}

// Keys dùng trong KV
export const KV_KEYS = {
  SENSOR_DATA: "sensor_data",
  LATEST_DATA: "latest_data",
  LAST_UPDATED: "last_updated",
}

// Lấy toàn bộ dữ liệu sensor (mảng)
export async function getSensorData() {
  if (kv) {
    try {
      const data = await kv.get(KV_KEYS.SENSOR_DATA)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("❌ Error fetching sensor data from KV:", error)
      return localSensorData
    }
  } else {
    return localSensorData
  }
}

// Lấy bản dữ liệu mới nhất
export async function getLatestData() {
  if (kv) {
    try {
      return await kv.get(KV_KEYS.LATEST_DATA)
    } catch (error) {
      console.error("❌ Error fetching latest data from KV:", error)
      return localLatestData
    }
  } else {
    return localLatestData
  }
}

// Lấy thời gian cập nhật cuối cùng
export async function getLastUpdated() {
  if (kv) {
    try {
      const timestamp = await kv.get(KV_KEYS.LAST_UPDATED)
      return timestamp ? String(timestamp) : localLastUpdated
    } catch (error) {
      console.error("❌ Error fetching last updated time from KV:", error)
      return localLastUpdated
    }
  } else {
    return localLastUpdated
  }
}

// Lưu mảng dữ liệu cảm biến vào KV (hoặc local)
export async function saveSensorData(newData: any[]) {
  if (!Array.isArray(newData)) {
    console.warn("⚠️ saveSensorData: Dữ liệu không hợp lệ, phải là mảng")
    return false
  }

  let existingData: any[] = []

  if (kv) {
    try {
      const existing = await kv.get(KV_KEYS.SENSOR_DATA)
      existingData = Array.isArray(existing) ? existing : []
    } catch (error) {
      console.error("❌ Lỗi khi đọc dữ liệu cũ từ KV:", error)
    }
  } else {
    existingData = localSensorData
  }

  // Gộp và loại trùng timestamp
  const mergedData = [...existingData, ...newData]
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((item, index, self) =>
      index === self.findIndex((i) => i.timestamp === item.timestamp)
    )
    .slice(0, 100)

  console.log("💾 Đang lưu dữ liệu cảm biến, số lượng:", mergedData.length)

  if (kv) {
    try {
      await kv.set(KV_KEYS.SENSOR_DATA, mergedData)
      return true
    } catch (error) {
      console.error("❌ Lỗi khi lưu dữ liệu vào KV:", error)
      localSensorData = mergedData
      return false
    }
  } else {
    localSensorData = mergedData
    return true
  }
}

// Lưu bản mới nhất nếu timestamp mới hơn
export async function saveLatestData(data: any) {
  const now = new Date().toISOString()
  const incomingTimestamp = data?.timestamp ? new Date(data.timestamp).getTime() : 0

  const current = await getLatestData()
  const currentTimestamp = current?.timestamp ? new Date(current.timestamp).getTime() : 0

  console.log("🕒 Dữ liệu mới:", data?.timestamp)
  console.log("🕒 Dữ liệu hiện tại:", current?.timestamp)

  if (incomingTimestamp >= currentTimestamp) {
    if (kv) {
      try {
        await kv.set(KV_KEYS.LATEST_DATA, data)
        await kv.set(KV_KEYS.LAST_UPDATED, now)
        console.log("✅ Đã lưu bản latest mới")
        return true
      } catch (error) {
        console.error("❌ Lỗi khi lưu bản latest vào KV:", error)
        localLatestData = data
        localLastUpdated = now
        return false
      }
    } else {
      localLatestData = data
      localLastUpdated = now
      console.log("✅ Đã lưu bản latest mới (local)")
      return true
    }
  } else {
    console.warn("⚠️ Bỏ qua vì dữ liệu mới cũ hơn dữ liệu hiện tại")
    return false
  }
}

// Kiểm tra KV đang hoạt động
export function isKVAvailable() {
  return !!kv
}
