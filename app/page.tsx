import Dashboard from "@/components/dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Home() {
  // Thêm timestamp để tránh cache
  const timestamp = Date.now()

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="flex justify-end mb-4 gap-2">
        <Link href={`/debug?t=${timestamp}`}>
          <Button variant="outline" size="sm">
            Debug
          </Button>
        </Link>
        <Link href={`/debug-api?t=${timestamp}`}>
          <Button variant="outline" size="sm">
            Debug API
          </Button>
        </Link>
      </div>
      <Dashboard />
    </main>
  )
}
