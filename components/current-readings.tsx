import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ThermometerIcon, Droplets, Clock } from "lucide-react"
import type { SensorData } from "@/lib/types"

interface CurrentReadingsProps {
  data: SensorData | null
  loading: boolean
  lastUpdated: Date
}

export default function CurrentReadings({ data, loading, lastUpdated }: CurrentReadingsProps) {
  // Hàm định dạng thời gian
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date)
  }

  // Hàm định dạng ngày
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nhiệt độ hiện tại</CardTitle>
          <ThermometerIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {loading || !data ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">{data.temperature}°C</div>
          )}
          <p className="text-xs text-muted-foreground">
            Cập nhật lần cuối:{" "}
            {loading || !data
              ? "Đang tải..."
              : `${formatTime(new Date(data.timestamp))} - ${formatDate(new Date(data.timestamp))}`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Độ ẩm hiện tại</CardTitle>
          <Droplets className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {loading || !data ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">{data.humidity}%</div>
          )}
          <p className="text-xs text-muted-foreground">
            Cập nhật lần cuối:{" "}
            {loading || !data
              ? "Đang tải..."
              : `${formatTime(new Date(data.timestamp))} - ${formatDate(new Date(data.timestamp))}`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cập nhật dữ liệu</CardTitle>
          <Clock className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">Dữ liệu được tải lúc:</div>
          <div className="text-lg font-semibold">{formatTime(lastUpdated)}</div>
          <p className="text-xs text-muted-foreground">{formatDate(lastUpdated)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
