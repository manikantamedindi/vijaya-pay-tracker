"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Download,
  FileText,
} from "lucide-react"

interface DashboardStats {
  totalBooths: number
  activeBooths: number
  totalTransactions: number
  matchedTransactions: number
  totalAmount: number
  unmatchedAmount: number
  reconciliationRate: number
}

interface ChartData {
  name: string
  value: number
  amount?: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooths: 0,
    activeBooths: 0,
    totalTransactions: 0,
    matchedTransactions: 0,
    totalAmount: 0,
    unmatchedAmount: 0,
    reconciliationRate: 0,
  })

  const [dailyData, setDailyData] = useState<ChartData[]>([])
  const [statusData, setStatusData] = useState<ChartData[]>([])
  const [trendData, setTrendData] = useState<ChartData[]>([])

  useEffect(() => {
    // Load and calculate stats from localStorage
    const booths = JSON.parse(localStorage.getItem("boothMembers") || "[]")
    const statements = JSON.parse(localStorage.getItem("uploadedStatements") || "[]")
    const reconciliationResults = JSON.parse(localStorage.getItem("reconciliationResults") || "[]")

    const totalBooths = booths.length
    const activeBooths = booths.filter((b: any) => b.status === "active").length

    const allTransactions = statements.flatMap((s: any) => s.transactions)
    const totalTransactions = allTransactions.length
    const totalAmount = allTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)

    const matchedTransactions = reconciliationResults.filter((r: any) => r.status === "matched").length
    const unmatchedAmount = allTransactions
      .filter((t: any) => !reconciliationResults.some((r: any) => r.transaction.id === t.id && r.status === "matched"))
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const reconciliationRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0

    setStats({
      totalBooths,
      activeBooths,
      totalTransactions,
      matchedTransactions,
      totalAmount,
      unmatchedAmount,
      reconciliationRate,
    })

    // Generate chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        value: Math.floor(Math.random() * 50) + 20,
        amount: Math.floor(Math.random() * 25000) + 15000,
      }
    }).reverse()

    setDailyData(last7Days)

    setStatusData([
      { name: "Matched", value: matchedTransactions },
      { name: "Unmatched", value: totalTransactions - matchedTransactions },
      { name: "Issues", value: Math.floor(totalTransactions * 0.1) },
    ])

    setTrendData([
      { name: "Jan", value: 85 },
      { name: "Feb", value: 88 },
      { name: "Mar", value: 92 },
      { name: "Apr", value: 89 },
      { name: "May", value: 94 },
      { name: "Jun", value: 96 },
    ])
  }, [])

  const COLORS = ["#22c55e", "#ef4444", "#f59e0b"]

  const generateReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
      summary: {
        totalBooths: stats.totalBooths,
        reconciliationRate: stats.reconciliationRate.toFixed(1) + "%",
        totalAmount: "₹" + stats.totalAmount.toLocaleString(),
        unmatchedAmount: "₹" + stats.unmatchedAmount.toLocaleString(),
      },
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reconciliation-report-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Overview of payment reconciliation activities</p>
        </div>
        <Button onClick={generateReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Booths</p>
                <p className="text-2xl font-bold">{stats.totalBooths}</p>
                <p className="text-xs text-muted-foreground">{stats.activeBooths} active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.matchedTransactions} matched
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />₹{stats.unmatchedAmount.toLocaleString()} unmatched
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reconciliation Rate</p>
                <p className="text-2xl font-bold">{stats.reconciliationRate.toFixed(1)}%</p>
                <Progress value={stats.reconciliationRate} className="mt-2" />
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                {stats.reconciliationRate >= 90 ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Transactions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Transaction Volume</CardTitle>
            <CardDescription>Number of transactions processed daily</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
            <CardDescription>Distribution of transaction matching status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Trend</CardTitle>
          <CardDescription>Monthly reconciliation rate performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest reconciliation activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "Auto-match completed",
                description: "85 transactions matched automatically",
                time: "2 minutes ago",
                status: "success",
              },
              {
                action: "Statement uploaded",
                description: "Daily statement for 2024-01-15 processed",
                time: "15 minutes ago",
                status: "info",
              },
              {
                action: "Manual match applied",
                description: "Transaction matched with MB045",
                time: "1 hour ago",
                status: "success",
              },
              {
                action: "Booth member added",
                description: "New booth member MB301 registered",
                time: "2 hours ago",
                status: "info",
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${activity.status === "success" ? "bg-green-100" : "bg-blue-100"}`}>
                  {activity.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Calendar className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <Badge variant="outline">{activity.time}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
