"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Info, AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

export default function SetupKVPage() {
  const [kvStatus, setKvStatus] = useState<"connected" | "local" | "unknown">("unknown")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkKVStatus = async () => {
      try {
        const response = await fetch("/api/sensor?t=" + Date.now(), {
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          if (data.kvStatus) {
            setKvStatus(data.kvStatus)
          }
        }
      } catch (error) {
        console.error("Error checking KV status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkKVStatus()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Đã sao chép vào clipboard!")
      })
      .catch((err) => {
        console.error("Không thể sao chép: ", err)
      })
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Thiết lập Vercel KV</h1>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {kvStatus === "connected" ? (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Vercel KV đã được cấu hình thành công</AlertTitle>
              <AlertDescription>
                Ứng dụng của bạn đã được kết nối với Vercel KV và sẵn sàng lưu trữ dữ liệu cảm biến.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-6" variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vercel KV chưa được cấu hình</AlertTitle>
              <AlertDescription>
                Ứng dụng đang sử dụng bộ nhớ tạm thời để lưu trữ dữ liệu. Dữ liệu sẽ bị mất khi khởi động lại server.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hướng dẫn thiết lập Vercel KV</CardTitle>
                <CardDescription>
                  Vercel KV là một cơ sở dữ liệu key-value dựa trên Redis, giúp lưu trữ dữ liệu cảm biến của bạn một
                  cách bền vững.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Bước 1: Liên kết dự án với Vercel</h3>
                  <p className="text-sm text-muted-foreground">
                    Đảm bảo dự án của bạn đã được liên kết với Vercel bằng cách chạy lệnh sau trong terminal:
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">npx vercel link</pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("npx vercel link")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Bước 2: Thêm tích hợp Upstash (Vercel KV)</h3>
                  <p className="text-sm text-muted-foreground">Thêm tích hợp Upstash Redis vào dự án của bạn:</p>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      npx vercel add integration upstash
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("npx vercel add integration upstash")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Lệnh này sẽ mở trình duyệt và hướng dẫn bạn qua quá trình thiết lập Upstash.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Bước 3: Kéo biến môi trường</h3>
                  <p className="text-sm text-muted-foreground">
                    Sau khi thiết lập Upstash, kéo biến môi trường về máy của bạn:
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">npx vercel env pull</pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("npx vercel env pull")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Bước 4: Khởi động lại ứng dụng</h3>
                  <p className="text-sm text-muted-foreground">Khởi động lại ứng dụng để áp dụng các thay đổi:</p>
                  <div className="relative">
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">npx vercel dev</pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard("npx vercel dev")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Lưu ý</AlertTitle>
                  <AlertDescription>
                    <p>
                      Nếu bạn đang triển khai trên Vercel, hãy đảm bảo rằng bạn đã triển khai lại ứng dụng sau khi thiết
                      lập Vercel KV.
                    </p>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://vercel.com/docs/storage/vercel-kv" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Tài liệu Vercel KV
                        </a>
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
