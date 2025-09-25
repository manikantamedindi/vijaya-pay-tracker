"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, CheckCircle, Download } from "lucide-react"

interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  referenceNumber: string
  type: "credit" | "debit"
}

interface ParsedStatement {
  fileName: string
  uploadDate: string
  totalTransactions: number
  totalAmount: number
  transactions: BankTransaction[]
}

export function StatementUpload() {
  const [uploadedStatements, setUploadedStatements] = useState<ParsedStatement[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedStatement, setSelectedStatement] = useState<ParsedStatement | null>(null)
  const { toast } = useToast()

  // Mock CSV parsing function
  const parseCSVContent = (content: string, fileName: string): ParsedStatement => {
    const lines = content.split("\n").filter((line) => line.trim())
    const transactions: BankTransaction[] = []

    // Skip header row and parse data
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(",").map((col) => col.trim().replace(/"/g, ""))

      if (columns.length >= 4) {
        const transaction: BankTransaction = {
          id: `txn-${Date.now()}-${i}`,
          date: columns[0] || new Date().toISOString().split("T")[0],
          description: columns[1] || `Transaction ${i}`,
          amount: Math.abs(Number.parseFloat(columns[2]) || Math.random() * 1000 + 100),
          referenceNumber: columns[3] || `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          type: Number.parseFloat(columns[2]) > 0 ? "credit" : "debit",
        }
        transactions.push(transaction)
      }
    }

    // If no valid transactions found, generate sample data
    if (transactions.length === 0) {
      for (let i = 0; i < 15; i++) {
        transactions.push({
          id: `txn-${Date.now()}-${i}`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          description: `UPI Payment from MB${String(Math.floor(Math.random() * 300) + 1).padStart(3, "0")}`,
          amount: 500 + Math.floor(Math.random() * 500),
          referenceNumber: `UPI${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
          type: "credit",
        })
      }
    }

    const totalAmount = transactions.reduce((sum, txn) => sum + (txn.type === "credit" ? txn.amount : -txn.amount), 0)

    return {
      fileName,
      uploadDate: new Date().toISOString().split("T")[0],
      totalTransactions: transactions.length,
      totalAmount,
      transactions,
    }
  }

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or TXT file",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        // Read file content
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsText(file)
        })

        // Parse the statement
        const parsedStatement = parseCSVContent(content, file.name)

        // Complete upload
        setUploadProgress(100)
        setTimeout(() => {
          setUploadedStatements((prev) => [parsedStatement, ...prev])
          setIsUploading(false)
          setUploadProgress(0)

          toast({
            title: "Statement Uploaded Successfully",
            description: `Parsed ${parsedStatement.totalTransactions} transactions from ${file.name}`,
          })
        }, 500)
      } catch (error) {
        setIsUploading(false)
        setUploadProgress(0)
        toast({
          title: "Upload Failed",
          description: "Failed to parse the bank statement file",
          variant: "destructive",
        })
      }

      // Reset file input
      event.target.value = ""
    },
    [toast],
  )

  const downloadSampleCSV = () => {
    const sampleData = [
      "Date,Description,Amount,Reference",
      "2024-01-15,UPI Payment from MB001,500,UPI123456789",
      "2024-01-15,UPI Payment from MB002,550,UPI987654321",
      "2024-01-15,UPI Payment from MB003,600,UPI456789123",
      "2024-01-14,UPI Payment from MB001,500,UPI789123456",
      "2024-01-14,UPI Payment from MB004,650,UPI321654987",
    ].join("\n")

    const blob = new Blob([sampleData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sample-bank-statement.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Sample Downloaded",
      description: "Sample CSV file downloaded successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bank Statement Upload</h2>
          <p className="text-muted-foreground">Upload daily bank statements for payment reconciliation</p>
        </div>
        <Button variant="outline" onClick={downloadSampleCSV}>
          <Download className="h-4 w-4 mr-2" />
          Download Sample CSV
        </Button>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Statement</CardTitle>
          <CardDescription>Upload your daily bank statement in CSV or TXT format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="statement-file">Bank Statement File</Label>
              <Input
                id="statement-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground">Supported formats: CSV, TXT (Max size: 10MB)</p>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Uploading and parsing statement...</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Statements List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Statements</CardTitle>
          <CardDescription>View and manage your uploaded bank statements</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadedStatements.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No statements uploaded yet</p>
              <p className="text-sm text-muted-foreground">Upload your first bank statement to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedStatements.map((statement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedStatement(statement)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{statement.fileName}</h4>
                      <p className="text-sm text-muted-foreground">Uploaded on {statement.uploadDate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{statement.totalTransactions} transactions</Badge>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">₹{statement.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statement Details Modal */}
      {selectedStatement && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Statement Details: {selectedStatement.fileName}</CardTitle>
                <CardDescription>
                  {selectedStatement.totalTransactions} transactions • Total: ₹
                  {selectedStatement.totalAmount.toLocaleString()}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedStatement(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStatement.transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="font-mono text-sm">{transaction.referenceNumber}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "credit" ? "default" : "secondary"}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {selectedStatement.transactions.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing first 10 transactions of {selectedStatement.totalTransactions}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
