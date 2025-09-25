"use client"

import { useState, useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { Navbar } from "@/components/navbar"
import { SimpleDashboard } from "@/components/simple-dashboard"
import { BoothPeople } from "@/components/booth-people"

function AppContent() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "booth-people">("dashboard")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="container mx-auto px-4 py-8">
        {currentPage === "dashboard" && <SimpleDashboard />}
        {currentPage === "booth-people" && <BoothPeople />}
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}
