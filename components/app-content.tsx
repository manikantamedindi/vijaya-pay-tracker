"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { SimpleDashboard } from "@/components/simple-dashboard"
import { BoothPeople } from "@/components/booth-people"

export default function AppContent() {
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