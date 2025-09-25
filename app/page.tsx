import dynamic from "next/dynamic"
import { Providers } from "@/components/providers"

// Dynamically import the client component to prevent SSR issues
const DynamicAppContent = dynamic(() => import("@/components/app-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
})

export default function HomePage() {
  return (
    <Providers>
      <DynamicAppContent />
    </Providers>
  )
}
