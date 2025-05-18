"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, Send, Info, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function DebugApiPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [testTemp, setTestTemp] = useState("25.5")
  const [testHumidity, setTestHumidity] = useState("60")
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [apiStatus, setApiStatus] = useState<"idle" | "success" | "error">("idle")
  const [serverTime, setServerTime] = useState<string | null>(null)
  const [sensorData, setSensorData] = useState<any[]>([])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/debug-sensor?t=${timestamp}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.recentRequests || [])
        setServerTime(data.serverTime)
        setApiStatus("success")
      } else {
        console.error("Failed to fetch debug data")
        setApiStatus("error")
      }

      // Fetch sensor data
      const sensorResponse = await fetch(`/api/sensor?t=${timestamp}`, { cache: "no-store" })
      if (sensorResponse.ok) {
        const data = await sensorResponse.json()
        setSensorData(data.allData || [])
      }
    } catch (error) {
      console.error("Error fetching debug data:", error)
      setApiStatus("error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()

    // Tự động làm mới mỗi 10 giây
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSendTest = async () => {
    setSendingTest(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/debug-sensor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: Number.parseFloat(testTemp),
          humidity: Number.parseFloat(testHumidity),
        }),
      })

      const result = await response.json()
      setTestResult(result)

      // Nếu thành công, tải lại dữ liệu
      if (response.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu test:", error)
      setTestResult({ error: "Không thể kết nối đến API" })
    } finally {
      setSendingTest(false)
    }
  }

  // Thêm hàm để gửi dữ liệu test đến endpoint chính
  const handleSendToMainAPI = async () => {
    setSendingTest(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/sensor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          temperature: Number.parseFloat(testTemp),
          humidity: Number.parseFloat(testHumidity),
        }),
      })

      const result = await response.json()
      setTestResult({
        ...result,
        message: "Dữ liệu đã được gửi đến API chính",
        endpoint: "/api/sensor",
      })

      // Nếu thành công, tải lại dữ liệu
      if (response.ok) {
        await fetchRequests()
      }
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu test đến API chính:", error)
      setTestResult({ error: "Không thể kết nối đến API chính" })
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Debug API Requests</h1>
        <div className="flex items-center gap-2">
          <Badge variant={apiStatus === "success" ? "success" : apiStatus === "error" ? "destructive" : "outline"}>
            {apiStatus === "success" ? "API Online" : apiStatus === "error" ? "API Offline" : "Checking..."}
          </Badge>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Thông tin API Debug</AlertTitle>
        <AlertDescription>
          <p>
            API Debug URL: <code className="bg-muted p-1 rounded">/api/debug-sensor</code>
          </p>
          <p>
            API Chính URL: <code className="bg-muted p-1 rounded">/api/sensor</code>
          </p>
          <p>
            Phương thức: <code className="bg-muted p-1 rounded">POST</code>
          </p>
          <p>
            Content-Type: <code className="bg-muted p-1 rounded">application/json</code>
          </p>
          <p>
            Định dạng dữ liệu: <code className="bg-muted p-1 rounded">{`{"temperature": 25.5, "humidity": 60}`}</code>
          </p>
          {serverTime && (
            <p className="mt-2">
              Thời gian server:{" "}
              <code className="bg-muted p-1 rounded">{new Date(serverTime).toLocaleString("vi-VN")}</code>
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Gửi yêu cầu test</CardTitle>
            <CardDescription>Gửi dữ liệu test đến API để kiểm tra kết nối với ESP32</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Nhiệt độ (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={testTemp}
                  onChange={(e) => setTestTemp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Độ ẩm (%)</Label>
                <Input
                  id="humidity"
                  type="number"
                  step="0.1"
                  value={testHumidity}
                  onChange={(e) => setTestHumidity(e.target.value)}
                />
              </div>
            </div>

            {testResult && (
              <div className="p-4 rounded-md bg-green-50 border border-green-200">
                <h3 className="font-medium mb-2">Kết quả:</h3>
                <pre className="text-sm overflow-auto p-2 bg-black/5 rounded">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleSendTest} disabled={sendingTest}>
              {sendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Gửi đến API Debug
            </Button>
            <Button onClick={handleSendToMainAPI} disabled={sendingTest} variant="secondary">
              {sendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Gửi đến API Chính
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dữ liệu cảm biến hiện tại</CardTitle>
            <CardDescription>Hiển thị dữ liệu cảm biến từ API chính</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sensorData.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Chưa có dữ liệu cảm biến</AlertTitle>
                <AlertDescription>
                  Chưa có dữ liệu cảm biến nào được lưu trữ. Hãy thử gửi dữ liệu test đến API chính.
                </AlertDescription>
              </Alert>
            ) : (
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
                    {sensorData.map((item, index) => (
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Các yêu cầu API gần đây</CardTitle>
            <CardDescription>Hiển thị 10 yêu cầu API gần nhất được gửi đến endpoint debug</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Chưa có yêu cầu API nào được ghi nhận</AlertTitle>
                <AlertDescription>
                  Hãy thử gửi yêu cầu test từ form phía trên hoặc từ ESP32 của bạn để kiểm tra kết nối.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {requests.map((request, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 py-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{new Date(request.timestamp).toLocaleString("vi-VN")}</div>
                        <div className="text-sm px-2 py-1 rounded bg-primary/10 text-primary">{request.method}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Tabs defaultValue="json">
                        <TabsList className="mb-2">
                          <TabsTrigger value="json">JSON</TabsTrigger>
                          <TabsTrigger value="headers">Headers</TabsTrigger>
                          <TabsTrigger value="raw">Raw</TabsTrigger>
                        </TabsList>

                        <TabsContent value="json">
                          {request.bodyJson ? (
                            <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-60">
                              {JSON.stringify(request.bodyJson, null, 2)}
                            </pre>
                          ) : (
                            <div className="text-sm text-muted-foreground p-3">Không thể parse JSON</div>
                          )}
                        </TabsContent>

                        <TabsContent value="headers">
                          <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-60">
                            {JSON.stringify(request.headers, null, 2)}
                          </pre>
                        </TabsContent>

                        <TabsContent value="raw">
                          <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-60">
                            {request.bodyText || "Không có dữ liệu"}
                          </pre>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 py-3 text-sm text-muted-foreground">
            Dữ liệu được cập nhật tự động mỗi 10 giây
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mã ESP32 mẫu</CardTitle>
          <CardDescription>Mã Arduino cho ESP32 để gửi dữ liệu đến API</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Cấu hình WiFi
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Cấu hình API
const char* serverUrl = "https://v0-real-time-weather-web.vercel.app/api/sensor";

// Cấu hình cảm biến DHT
#define DHTPIN 4     // Chân kết nối với cảm biến DHT
#define DHTTYPE DHT22   // DHT 22 (AM2302)
DHT dht(DHTPIN, DHTTYPE);

// Biến để theo dõi thời gian
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Gửi dữ liệu mỗi 5 giây

void setup() {
  Serial.begin(115200);
  
  // Khởi tạo cảm biến DHT
  dht.begin();
  
  // Kết nối WiFi
  WiFi.begin(ssid, password);
  Serial.println("Đang kết nối WiFi...");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("Đã kết nối WiFi!");
  Serial.print("Địa chỉ IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Kiểm tra xem đã đến thời gian gửi dữ liệu chưa
  if ((millis() - lastTime) > timerDelay) {
    // Kiểm tra kết nối WiFi
    if (WiFi.status() == WL_CONNECTED) {
      // Đọc dữ liệu từ cảm biến
      float humidity = dht.readHumidity();
      float temperature = dht.readTemperature();
      
      // Kiểm tra xem việc đọc có thành công không
      if (isnan(humidity) || isnan(temperature)) {
        Serial.println("Không thể đọc dữ liệu từ cảm biến DHT!");
      } else {
        // Hiển thị dữ liệu trên Serial Monitor
        Serial.print("Nhiệt độ: ");
        Serial.print(temperature);
        Serial.print(" °C, Độ ẩm: ");
        Serial.print(humidity);
        Serial.println(" %");
        
        // Gửi dữ liệu lên server
        sendSensorData(temperature, humidity);
      }
    } else {
      Serial.println("WiFi đã ngắt kết nối");
      // Thử kết nối lại
      WiFi.reconnect();
    }
    
    lastTime = millis();
  }
}

void sendSensorData(float temperature, float humidity) {
  HTTPClient http;
  
  // Bắt đầu kết nối
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Tạo JSON
  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Gửi POST request
  int httpResponseCode = http.POST(jsonString);
  
  // Kiểm tra kết quả
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("Error on sending POST: ");
    Serial.println(httpResponseCode);
  }
  
  // Kết thúc kết nối
  http.end();
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
