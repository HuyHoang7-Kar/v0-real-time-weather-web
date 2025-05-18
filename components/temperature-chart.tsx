"use client"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import type { SensorData } from "@/lib/types"

interface TemperatureChartProps {
  data: SensorData[]
  loading: boolean
}

export default function TemperatureChart({ data, loading }: TemperatureChartProps) {
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu nhiệt độ</p>
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
        <YAxis domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          formatter={(value) => [`${value}°C`, "Nhiệt độ"]}
          labelFormatter={(label) => `Thời gian: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
