"use client"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users } from "lucide-react"

interface NavbarProps {
  currentPage: "dashboard" | "booth-people"
  onPageChange: (page: "dashboard" | "booth-people") => void
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Milk Factory Payment</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={currentPage === "dashboard" ? "default" : "ghost"}
              onClick={() => onPageChange("dashboard")}
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentPage === "booth-people" ? "default" : "ghost"}
              onClick={() => onPageChange("booth-people")}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Booth People
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
