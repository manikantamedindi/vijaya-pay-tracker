"use client"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import Image from "next/image"

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isDashboard = pathname === "/dashboard" || pathname === "/";
  const isBoothPeople = pathname === "/booth-people";
  
  return (
    <nav className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/vijaya-logo.svg" 
                alt="Vijaya Logo" 
                width={120} 
                height={40}
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Milk Factory Payment</h1>
                <p className="text-xs text-gray-600">Payment Reconciliation System</p>
              </div>
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
            
            {user && (
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
