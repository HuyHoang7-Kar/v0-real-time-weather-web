"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw } from "lucide-react"

// Endpoint API bên ngoài
const EXTERNAL_API_URL = "https://v0-real-time-weather-web.vercel.app/api/sensor"

export default function DebugPage() {
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Sử dụng API proxy để tránh vấn đề CORS
      const response = await fetch(`/api/proxy-sensor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: EXTERNAL_API_URL }),
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setApiData(data)
      console.log("Debug API response:", data)
    } catch (error) {
      console.error("Error fetching API data:", error)
      setError(`Lỗi khi tải dữ liệu: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Tự động làm mới mỗi 10 giây
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Debug API Bên Ngoài</h1>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
          <h2 className="text-lg font-semibold mb-2">Lỗi</h2>
          <p>{error}</p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông tin API Bên Ngoài</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
            <p className="font-medium">API URL: {EXTERNAL_API_URL}</p>
            <p className="text-sm mt-2">Dữ liệu được cập nhật tự động mỗi 10 giây thông qua proxy server.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="formatted">
              <TabsList className="mb-4">
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="formatted">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Thời gian nhận dữ liệu cuối cùng:</h3>
                    <p className="text-sm">
                      {apiData?.lastReceivedTime
                        ? new Date(apiData.lastReceivedTime).toLocaleString("vi-VN")
                        : "Chưa có dữ liệu"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Tổng số bản ghi:</h3>
                    <p className="text-sm">{apiData?.totalRecords || 0}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Nguồn dữ liệu:</h3>
                    <p className="text-sm">{apiData?.dataSource || "API bên ngoài"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Dữ liệu mới nhất:</h3>
                    {apiData?.latestData ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">Nhiệt độ: {apiData.latestData.temperature}°C</p>
                        <p className="text-sm">Độ ẩm: {apiData.latestData.humidity}%</p>
                        <p className="text-sm">
                          Thời gian: {new Date(apiData.latestData.timestamp).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px] text-sm">
                  {JSON.stringify(apiData, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {apiData?.allData && apiData.allData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dữ liệu cảm biến</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-2 text-left font-medium">ID</th>
                    <th className="p-2 text-left font-medium">Nhiệt độ</th>
                    <th className="p-2 text-left font-medium">Độ ẩm</th>
                    <th className="p-2 text-left font-medium">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {apiData.allData.map((item: any, index: number) => (
                    <tr key={item.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="p-2 text-sm">{item.id}</td>
                      <td className="p-2 text-sm">{item.temperature}°C</td>
                      <td className="p-2 text-sm">{item.humidity}%</td>
                      <td className="p-2 text-sm">{new Date(item.timestamp).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
