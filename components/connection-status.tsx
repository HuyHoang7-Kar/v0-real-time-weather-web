"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertCircle, ExternalLink, FileText, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConnectionStatusProps {
  externalApiUrl?: string
}

export default function ConnectionStatus({ externalApiUrl }: ConnectionStatusProps) {
  const [status, setStatus] = useState<"connected" | "disconnected" | "unknown" | "external" | "manual" | "kv">(
    "unknown",
  )
  const [lastReceived, setLastReceived] = useState<string | null>(null)
  const [latestData, setLatestData] = useState<any>(null)
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const checkConnection = async () => {
    if (isChecking) return

    setIsChecking(true)
    try {
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime()

      // Sử dụng API cục bộ để proxy request đến API bên ngoài
      // Điều này giúp tránh vấn đề CORS
      const response = await fetch(`/api/proxy-sensor?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: externalApiUrl || "https://v0-real-time-weather-web.vercel.app/api/sensor",
        }),
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Connection status API response:", data)

        setLastReceived(data.lastReceivedTime)
        setLatestData(data.latestData)
        setTotalRecords(data.totalRecords || 0)
        setError(null)
        setRetryCount(0)

        // Đặt trạng thái là external vì đang sử dụng API bên ngoài
        setStatus("external")
      } else {
        const errorText = await response.text()
        console.error(`HTTP error! status: ${response.status}, response:`, errorText)
        setStatus("unknown")
        setError(`HTTP error: ${response.status}`)

        // Tăng số lần thử lại
        setRetryCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra kết nối:", error)
      setStatus("unknown")
      setError(`Không thể kết nối đến API. Vui lòng kiểm tra kết nối mạng.`)

      // Tăng số lần thử lại
      setRetryCount((prev) => prev + 1)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()

    // Kiểm tra kết nối mỗi 10 giây
    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [externalApiUrl])

  // Tính thời gian từ lần nhận cuối cùng
  const getTimeSinceLastReceived = () => {
    if (!lastReceived) return "Chưa có dữ liệu"

    const lastTime = new Date(lastReceived).getTime()
    const now = Date.now()
    const diffMs = now - lastTime

    // Chuyển đổi thành phút
    const diffMinutes = Math.floor(diffMs / (60 * 1000))

    if (diffMinutes < 1) return "Vừa nhận"
    if (diffMinutes === 1) return "1 phút trước"
    if (diffMinutes < 60) return `${diffMinutes} phút trước`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours === 1) return "1 giờ trước"
    if (diffHours < 24) return `${diffHours} giờ trước`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return "1 ngày trước"
    return `${diffDays} ngày trước`
  }

  const handleManualRefresh = () => {
    checkConnection()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status === "connected" && (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  ESP32 đã kết nối
                </Badge>
              </>
            )}
            {status === "disconnected" && (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  ESP32 mất kết nối
                </Badge>
              </>
            )}
            {status === "unknown" && (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Chưa nhận được dữ liệu
                </Badge>
              </>
            )}
            {status === "external" && (
              <>
                <ExternalLink className="h-5 w-5 text-blue-500" />
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Cập nhật dữ liệu
                </Badge>
              </>
            )}
            {status === "manual" && (
              <>
                <FileText className="h-5 w-5 text-purple-500" />
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Dữ liệu nhập thủ công
                </Badge>
              </>
            )}
            {status === "kv" && (
              <>
                <Database className="h-5 w-5 text-emerald-500" />
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Dữ liệu từ Vercel KV
                </Badge>
              </>
            )}

            <Button variant="ghost" size="sm" onClick={handleManualRefresh} disabled={isChecking} className="ml-2">
              <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-sm text-muted-foreground">Dữ liệu cuối cùng: {getTimeSinceLastReceived()}</div>
            <div className="text-xs text-muted-foreground mt-1">Tổng số bản ghi: {totalRecords}</div>
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
