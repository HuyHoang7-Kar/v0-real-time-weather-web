"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CurrentReadings from "@/components/current-readings"
import TemperatureChart from "@/components/temperature-chart"
import HumidityChart from "@/components/humidity-chart"
import ConnectionStatus from "@/components/connection-status"
import type { SensorData } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

// Endpoint API bên ngoài
const EXTERNAL_API_URL = "https://v0-real-time-weather-web.vercel.app/api/sensor"

export default function Dashboard() {
  const [data, setData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [dataSource, setDataSource] = useState<"api" | "external" | "manual" | "kv">("external")
  const MAX_RETRIES = 3

  const loadData = async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true)
    }

    try {
      // Sử dụng API proxy để tránh vấn đề CORS
      console.log("Fetching data from proxy API")

      const response = await fetch(`/api/proxy-sensor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: EXTERNAL_API_URL }),
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, response:`, errorText)

        // Nếu đã thử lại đủ số lần, hiển thị lỗi
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`)
        }

        // Thử lại sau 1 giây
        console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES})...`)
        setRetryCount((prev) => prev + 1)
        setTimeout(() => loadData(true), 1000)
        return
      }

      // Reset retry count on success
      setRetryCount(0)

      let apiData
      try {
        apiData = await response.json()
        console.log("API response:", apiData)
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error(`Không thể phân tích dữ liệu JSON: ${jsonError.message}`)
      }

      if (apiData.error) {
        console.error("API returned an error:", apiData.error)
        throw new Error(`API error: ${apiData.error}`)
      }

      // Cập nhật nguồn dữ liệu
      if (apiData.dataSource) {
        setDataSource(apiData.dataSource)
      } else {
        setDataSource("external")
      }

      if (apiData.allData && Array.isArray(apiData.allData) && apiData.allData.length > 0) {
        // Sử dụng trực tiếp dữ liệu từ API
        setData(apiData.allData)
        setLastUpdated(new Date(apiData.lastReceivedTime || new Date()))
        setError(null)
        console.log("Data loaded successfully:", apiData.allData.length, "records")
      } else if (apiData.latestData) {
        // Nếu chỉ có latestData, thêm vào mảng data
        const newData = [...data]
        // Kiểm tra xem dữ liệu đã tồn tại chưa
        const exists = newData.some((item) => item.id === apiData.latestData.id)
        if (!exists) {
          newData.push(apiData.latestData)
          setData(newData)
        }
        setLastUpdated(new Date(apiData.lastReceivedTime || new Date()))
        setError(null)
        console.log("Latest data added:", apiData.latestData)
      } else {
        console.log("No sensor data available")
        if (data.length === 0) {
          setError("Chưa có dữ liệu.")
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error)
      setError(`Không thể tải dữ liệu : ${error.message}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()

    // Cập nhật dữ liệu mỗi 10 giây thay vì 5 giây để giảm tải
    const interval = setInterval(loadData, 120000)
    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    setRetryCount(0) // Reset retry count on manual refresh
    await loadData()
  }

  const currentData = data.length > 0 ? data[data.length - 1] : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển cảm biến ESP32</h1>
        </div>
        <Button onClick={handleManualRefresh} variant="outline" size="sm" disabled={refreshing}>
          {refreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Làm mới dữ liệu
        </Button>
      </div>

      <ConnectionStatus externalApiUrl={EXTERNAL_API_URL} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data.length === 0 && !loading && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chưa có dữ liệu</AlertTitle>
          <AlertDescription>
            Chưa nhận được dữ liệu. Vui lòng kiểm tra kết nối hoặc thử làm mới dữ liệu.
          </AlertDescription>
        </Alert>
      )}

      <CurrentReadings data={currentData} loading={loading} lastUpdated={lastUpdated} />

      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="temperature">Nhiệt độ</TabsTrigger>
          <TabsTrigger value="humidity">Độ ẩm</TabsTrigger>
        </TabsList>
        <TabsContent value="temperature">
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ nhiệt độ</CardTitle>
              <CardDescription>Biểu đồ nhiệt độ theo thời gian thực .</CardDescription>
            </CardHeader>
            <CardContent>
              <TemperatureChart data={data} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="humidity">
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ độ ẩm</CardTitle>
              <CardDescription>Biểu đồ độ ẩm theo thời gian thực.</CardDescription>
            </CardHeader>
            <CardContent>
              <HumidityChart data={data} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug info */}
      <div className="mt-8 p-4 border rounded-md bg-gray-50">
        <h3 className="text-sm font-medium mb-2">Debug Info:</h3>
        <p className="text-xs text-gray-500">Số lượng dữ liệu: {data.length}</p>
        <p className="text-xs text-gray-500">Cập nhật lần cuối: {lastUpdated.toLocaleString()}</p>
        <p className="text-xs text-gray-500">
          Lần thử lại: {retryCount}/{MAX_RETRIES}
        </p>
        {currentData && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Dữ liệu mới nhất:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(currentData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
