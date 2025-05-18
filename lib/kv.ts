// Kiểm tra xem KV đã được cấu hình chưa
const isKVConfigured =
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_URL.startsWith("https://") &&
  process.env.KV_REST_API_TOKEN

// Biến lưu trữ dữ liệu tạm thời khi không có KV
let localSensorData: any[] = []
let localLatestData: any = null
let localLastUpdated: string = new Date().toISOString()

// Import KV chỉ khi đã được cấu hình
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

// Các khóa được sử dụng trong KV store
export const KV_KEYS = {
  SENSOR_DATA: "sensor_data",
  LATEST_DATA: "latest_data",
  LAST_UPDATED: "last_updated",
}

// Hàm helper để lấy dữ liệu cảm biến từ KV hoặc bộ nhớ cục bộ
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
    console.log("⚠️ Using local storage for sensor data")
    return localSensorData
  }
}

// Hàm helper để lấy dữ liệu mới nhất
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

// Hàm helper để lấy thời gian cập nhật cuối cùng
export async function getLastUpdated() {
  if (kv) {
    try {
      const timestamp = await kv.get(KV_KEYS.LAST_UPDATED)
      return timestamp ? (timestamp as string) : localLastUpdated
    } catch (error) {
      console.error("❌ Error fetching last updated time from KV:", error)
      return localLastUpdated
    }
  } else {
    return localLastUpdated
  }
}

// Hàm helper để lưu dữ liệu cảm biến vào KV hoặc bộ nhớ cục bộ
export async function saveSensorData(newData: any[]) {
  const currentData = await getSensorData()
  const latestTime = new Date(currentData.at(-1)?.timestamp || 0)

  const validNewData = newData.filter(d => {
    const t = new Date(d.timestamp)
    return !isNaN(t.getTime()) && t > latestTime
  })

  const combined = [...currentData, ...validNewData]
  const limited = combined.slice(-100)

  console.log("💾 Saving valid sensor data, count:", validNewData.length)
  console.log("📊 Total stored records:", limited.length)

  if (kv) {
    try {
      await kv.set(KV_KEYS.SENSOR_DATA, limited)
      return true
    } catch (error) {
      console.error("❌ Error saving sensor data to KV:", error)
      localSensorData = limited
      return false
    }
  } else {
    localSensorData = limited
    return true
  }
}

// Hàm helper để lưu dữ liệu mới nhất (chỉ khi timestamp mới hơn)
export async function saveLatestData(data: any) {
  const now = new Date().toISOString()
  const incomingTimestamp = data?.timestamp ? new Date(data.timestamp).getTime() : 0

  const current = await getLatestData()
  const currentTimestamp = current?.timestamp ? new Date(current.timestamp).getTime() : 0

  console.log("🕒 Incoming latest data timestamp:", data?.timestamp)
  console.log("🕒 Current stored latest data timestamp:", current?.timestamp)

  if (incomingTimestamp >= currentTimestamp) {
    if (kv) {
      try {
        await kv.set(KV_KEYS.LATEST_DATA, data)
        await kv.set(KV_KEYS.LAST_UPDATED, now)
        console.log("✅ Saved new latest data")
        return true
      } catch (error) {
        console.error("❌ Error saving latest data to KV:", error)
        localLatestData = data
        localLastUpdated = now
        return false
      }
    } else {
      localLatestData = data
      localLastUpdated = now
      console.log("✅ Saved new latest data (local)")
      return true
    }
  } else {
    console.warn("⚠️ Ignored incoming data because it is older than current data")
    return false
  }
}

// Kiểm tra trạng thái KV
export function isKVAvailable() {
  return !!kv
}
