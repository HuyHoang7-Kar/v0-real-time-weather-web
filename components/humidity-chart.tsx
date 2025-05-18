"use client"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import type { SensorData } from "@/lib/types"

interface HumidityChartProps {
  data: SensorData[]
  loading: boolean
}

export default function HumidityChart({ data, loading }: HumidityChartProps) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu độ ẩm</p>
      </div>
    )
  }

  const formattedData = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          formatter={(value) => [`${value}%`, "Độ ẩm"]}
          labelFormatter={(label) => `Thời gian: ${label}`}
        />
        <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
