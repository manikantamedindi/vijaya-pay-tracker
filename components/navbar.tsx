"use client"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const isBoothPeople = pathname === "/booth-people";
  
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold hover:underline">
              Milk Factory Payment
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={isDashboard ? "default" : "ghost"}
              asChild
              className="flex items-center gap-2"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={isBoothPeople ? "default" : "ghost"}
              asChild
              className="flex items-center gap-2"
            >
              <Link href="/booth-people">
                <Users className="h-4 w-4" />
                Booth People
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
