"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertCircle, Search } from "lucide-react"

interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  referenceNumber: string
  type: "credit" | "debit"
}

interface BoothMember {
  id: string
  uniqueCode: string
  name: string
  phoneNumber: string
  dailyAmount: number
  status: "active" | "inactive"
  joinDate: string
}

interface MatchedPayment {
  transactionId: string
  boothMemberId: string
  matchConfidence: "high" | "medium" | "low"
  matchReason: string
  isManualMatch: boolean
}

interface ReconciliationResult {
  transaction: BankTransaction
  matchedBooth?: BoothMember
  matchConfidence?: "high" | "medium" | "low"
  matchReason?: string
  status: "matched" | "unmatched" | "duplicate" | "amount_mismatch"
}

export function PaymentMatching() {
  const [booths, setBooths] = useState<BoothMember[]>([])
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [reconciliationResults, setReconciliationResults] = useState<ReconciliationResult[]>([])
  const [isMatching, setIsMatching] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  // Load data on component mount
  useEffect(() => {
    // Load booth members
    const savedBooths = localStorage.getItem("boothMembers")
    if (savedBooths) {
      setBooths(JSON.parse(savedBooths))
    }

    // Load transactions from uploaded statements
    const savedStatements = localStorage.getItem("uploadedStatements")
    if (savedStatements) {
      const statements = JSON.parse(savedStatements)
      const allTransactions = statements.flatMap((statement: any) => statement.transactions)
      setTransactions(allTransactions)
    }
  }, [])

  // Auto-match payments using booth unique codes
  const performAutoMatching = () => {
    setIsMatching(true)

    const results: ReconciliationResult[] = transactions.map((transaction) => {
      // Extract booth code from transaction description
      const boothCodeMatch = transaction.description.match(/MB\d{3}/i)

      if (boothCodeMatch) {
        const extractedCode = boothCodeMatch[0].toUpperCase()
        const matchedBooth = booths.find((booth) => booth.uniqueCode === extractedCode)

        if (matchedBooth) {
          // Check amount match
          const amountDifference = Math.abs(transaction.amount - matchedBooth.dailyAmount)
          const amountMatchPercentage = 1 - amountDifference / matchedBooth.dailyAmount

          let matchConfidence: "high" | "medium" | "low"
          let status: ReconciliationResult["status"]
          let matchReason: string

          if (amountMatchPercentage >= 0.95) {
            matchConfidence = "high"
            status = "matched"
            matchReason = "Exact booth code and amount match"
          } else if (amountMatchPercentage >= 0.8) {
            matchConfidence = "medium"
            status = "amount_mismatch"
            matchReason = `Booth code match, amount difference: ₹${amountDifference}`
          } else {
            matchConfidence = "low"
            status = "amount_mismatch"
            matchReason = `Booth code match, significant amount difference: ₹${amountDifference}`
          }

          return {
            transaction,
            matchedBooth,
            matchConfidence,
            matchReason,
            status,
          }
        }
      }

      // Try to match by amount if no booth code found
      const amountMatches = booths.filter((booth) => Math.abs(transaction.amount - booth.dailyAmount) <= 50)

      if (amountMatches.length === 1) {
        return {
          transaction,
          matchedBooth: amountMatches[0],
          matchConfidence: "medium" as const,
          matchReason: "Amount-based match (no booth code found)",
          status: "matched" as const,
        }
      }

      if (amountMatches.length > 1) {
        return {
          transaction,
          matchConfidence: "low" as const,
          matchReason: `Multiple booths with similar amounts (${amountMatches.length} matches)`,
          status: "duplicate" as const,
        }
      }

      return {
        transaction,
        matchReason: "No matching booth found",
        status: "unmatched" as const,
      }
    })

    setReconciliationResults(results)
    setIsMatching(false)

    const matchedCount = results.filter((r) => r.status === "matched").length
    const unmatchedCount = results.filter((r) => r.status === "unmatched").length

    toast({
      title: "Auto-matching Complete",
      description: `${matchedCount} matched, ${unmatchedCount} unmatched transactions`,
    })
  }

  // Manual match function
  const handleManualMatch = (transactionId: string, boothId: string) => {
    const booth = booths.find((b) => b.id === boothId)
    if (!booth) return

    setReconciliationResults((prev) =>
      prev.map((result) =>
        result.transaction.id === transactionId
          ? {
              ...result,
              matchedBooth: booth,
              matchConfidence: "high" as const,
              matchReason: "Manual match by user",
              status: "matched" as const,
            }
          : result,
      ),
    )

    toast({
      title: "Manual Match Applied",
      description: `Transaction matched with ${booth.name} (${booth.uniqueCode})`,
    })
  }

  // Filter results based on status and search term
  const filteredResults = reconciliationResults.filter((result) => {
    const statusMatch = filterStatus === "all" || result.status === filterStatus
    const searchMatch =
      searchTerm === "" ||
      result.transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.transaction.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.matchedBooth?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.matchedBooth?.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase())

    return statusMatch && searchMatch
  })

  const getStatusIcon = (status: ReconciliationResult["status"]) => {
    switch (status) {
      case "matched":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "unmatched":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "duplicate":
      case "amount_mismatch":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: ReconciliationResult["status"]) => {
    const variants = {
      matched: "default",
      unmatched: "destructive",
      duplicate: "secondary",
      amount_mismatch: "secondary",
    } as const

    return <Badge variant={variants[status]}>{status.replace("_", " ")}</Badge>
  }

  const stats = {
    total: reconciliationResults.length,
    matched: reconciliationResults.filter((r) => r.status === "matched").length,
    unmatched: reconciliationResults.filter((r) => r.status === "unmatched").length,
    issues: reconciliationResults.filter((r) => r.status === "duplicate" || r.status === "amount_mismatch").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold text-green-600">{stats.matched}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unmatched</p>
                <p className="text-2xl font-bold text-red-600">{stats.unmatched}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.issues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Matching</CardTitle>
              <CardDescription>Match bank transactions with booth member payments using unique codes</CardDescription>
            </div>
            <Button onClick={performAutoMatching} disabled={isMatching || transactions.length === 0}>
              {isMatching ? "Matching..." : "Start Auto-Match"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Transactions</Label>
              <Input
                id="search"
                placeholder="Search by description, reference, or booth..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="filter">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                  <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                  <SelectItem value="duplicate">Duplicate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Results</CardTitle>
          <CardDescription>Review and manually adjust payment matches as needed</CardDescription>
        </CardHeader>
        <CardContent>
          {reconciliationResults.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions to match</p>
              <p className="text-sm text-muted-foreground">Upload bank statements first, then run auto-matching</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Matched Booth</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {getStatusBadge(result.status)}
                      </div>
                    </TableCell>
                    <TableCell>{result.transaction.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.transaction.description}</p>
                        <p className="text-sm text-muted-foreground font-mono">{result.transaction.referenceNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">₹{result.transaction.amount}</TableCell>
                    <TableCell>
                      {result.matchedBooth ? (
                        <div>
                          <p className="font-medium">{result.matchedBooth.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{result.matchedBooth.uniqueCode}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No match</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.matchConfidence && (
                        <Badge
                          variant={
                            result.matchConfidence === "high"
                              ? "default"
                              : result.matchConfidence === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {result.matchConfidence}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.status === "unmatched" && (
                        <Select onValueChange={(boothId) => handleManualMatch(result.transaction.id, boothId)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Match" />
                          </SelectTrigger>
                          <SelectContent>
                            {booths
                              .filter((booth) => booth.status === "active")
                              .map((booth) => (
                                <SelectItem key={booth.id} value={booth.id}>
                                  {booth.uniqueCode}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
