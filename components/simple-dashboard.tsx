"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Users, CreditCard, CheckCircle, Download } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { setTransactions, setUploadedFile } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface Transaction {
  sno: string
  transactionDate: string
  transactionAmount: number
  rrn: string
  customerVPA: string
  isMatched?: boolean
  matchedPersonId?: string
}

export function SimpleDashboard() {
  const dispatch = useAppDispatch()
  const { boothPeople, transactions, uploadedFile } = useAppSelector((state) => state.app)
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ["S.NO", "TRANSACTION_DATE", "TRANSACTION_AMOUNT", "RRN", "CUSTOMER VPA (UPI)"],
      ["1", "20-09-2025", "12850", "562998387734", "9866496670@yestp"],
      ["2", "20-09-2025", "15000", "562998387735", "9876543210@paytm"],
      ["3", "20-09-2025", "8500", "562998387736", "9988776655@gpay"],
      ["4", "20-09-2025", "22000", "562998387737", "9123456789@phonepe"],
      ["5", "20-09-2025", "11200", "562998387738", "9555666777@yestp"],
    ]

    const csvContent = sampleData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample_transaction_data.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Sample Downloaded",
      description: "Sample CSV file downloaded successfully",
    })
  }

  const handleSubmit = () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",")

      const parsedTransactions: Transaction[] = lines.slice(1).map((line, index) => {
        const values = line.split(",")
        return {
          sno: values[0] || (index + 1).toString(),
          transactionDate: values[1] || "",
          transactionAmount: Number.parseFloat(values[2]) || 0,
          rrn: values[3] || "",
          customerVPA: values[4] || "",
          isMatched: false,
        }
      })

      dispatch(setTransactions(parsedTransactions))
      dispatch(setUploadedFile(file.name))

      toast({
        title: "Success",
        description: `Uploaded ${parsedTransactions.length} transactions`,
      })
    }

    reader.readAsText(file)
  }

  const handleMatch = () => {
    console.log("[v0] Starting matching process...")

    console.log(
      "[v0] Available booth people:",
      boothPeople.map((p) => ({
        id: p.id,
        name: p.name,
        vpas: p.customerVPAs.filter((vpa) => !vpa.isDisabled).map((vpa) => vpa.vpa),
      })),
    )
    console.log(
      "[v0] All transactions to process:",
      transactions.map((t) => ({
        vpa: t.customerVPA,
        amount: t.transactionAmount,
        currentlyMatched: t.isMatched,
      })),
    )

    const updatedTransactions = transactions.map((transaction) => {
      const normalizedTransactionVPA = transaction.customerVPA.trim().toLowerCase()

      const matchingPerson = boothPeople.find((person) =>
        person.customerVPAs.some((vpa) => {
          const normalizedPersonVPA = vpa.vpa.trim().toLowerCase()
          const isMatch = normalizedPersonVPA === normalizedTransactionVPA && !vpa.isDisabled

          console.log("[v0] Comparing VPAs:", {
            transactionVPA: normalizedTransactionVPA,
            personVPA: normalizedPersonVPA,
            isDisabled: vpa.isDisabled,
            isMatch: isMatch,
          })

          return isMatch
        }),
      )

      if (matchingPerson) {
        console.log("[v0] Found match:", {
          transactionVPA: transaction.customerVPA,
          matchedPerson: matchingPerson.name,
          personId: matchingPerson.id,
        })

        return {
          ...transaction,
          isMatched: true,
          matchedPersonId: matchingPerson.id,
        }
      } else {
        console.log("[v0] No match found for VPA:", transaction.customerVPA)
        return {
          ...transaction,
          isMatched: false,
          matchedPersonId: undefined,
        }
      }
    })

    dispatch(setTransactions(updatedTransactions))

    const totalMatchedCount = updatedTransactions.filter((t) => t.isMatched).length
    const previouslyMatchedCount = transactions.filter((t) => t.isMatched).length

    console.log(
      "[v0] Matching complete. Total matched:",
      totalMatchedCount,
      "Previously matched:",
      previouslyMatchedCount,
      "Total transactions:",
      updatedTransactions.length,
    )

    toast({
      title: "Matching Complete",
      description: `${totalMatchedCount} transactions matched out of ${updatedTransactions.length} total`,
    })
  }

  const matchedTransactions = transactions.filter((t) => t.isMatched)
  const unmatchedTransactions = transactions.filter((t) => !t.isMatched)
  const totalAmount = transactions.reduce((sum, t) => sum + t.transactionAmount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Upload and match transaction data</p>
      </div>

      {/* Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total People</p>
                <p className="text-2xl font-bold">{boothPeople.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold">{matchedTransactions.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Transaction File</CardTitle>
          <CardDescription>Upload CSV file with transaction data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="flex-1" />
            <Button onClick={handleSubmit} disabled={!file}>
              <Upload className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>{uploadedFile && <p className="text-sm text-muted-foreground">Last uploaded: {uploadedFile}</p>}</div>
            <Button variant="outline" onClick={downloadSampleCSV}>
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Preview Table */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction Preview</CardTitle>
                <CardDescription>Preview of uploaded transaction data</CardDescription>
              </div>
              <Button onClick={handleMatch}>Match Transactions</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.NO</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>RRN</TableHead>
                  <TableHead>Customer VPA</TableHead>
                  <TableHead>Match Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.sno}</TableCell>
                    <TableCell>{transaction.transactionDate}</TableCell>
                    <TableCell>₹{transaction.transactionAmount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.rrn}</TableCell>
                    <TableCell className="font-mono">{transaction.customerVPA}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.isMatched ? "default" : "secondary"}>
                        {transaction.isMatched ? "Matched" : "Unmatched"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {transactions.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4">
                Showing first 10 of {transactions.length} transactions
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unmatched Values */}
      {unmatchedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unmatched Transactions</CardTitle>
            <CardDescription>{unmatchedTransactions.length} transactions could not be matched</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Customer VPA</TableHead>
                  <TableHead>RRN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatchedTransactions.slice(0, 5).map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.transactionDate}</TableCell>
                    <TableCell>₹{transaction.transactionAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">{transaction.customerVPA}</TableCell>
                    <TableCell>{transaction.rrn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
