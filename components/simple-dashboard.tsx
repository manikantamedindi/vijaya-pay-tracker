"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Users, CreditCard, CheckCircle, Download, Trash2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { setTransactions, setUploadedFile, clearAllData, clearTransactionData, initializeStoreFromSession, setBoothPeople } from "@/lib/store"
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
  const [fileSize, setFileSize] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingBoothPeople, setIsFetchingBoothPeople] = useState(false)
  const { toast } = useToast()

  // Load data from session storage on component mount
  useEffect(() => {
    // Initialize store from session storage on client side
    initializeStoreFromSession()
    // Fetch booth people from API
    fetchBoothPeopleFromAPI()
  }, [])

  // Fetch booth people from API
  const fetchBoothPeopleFromAPI = async () => {
    try {
      setIsFetchingBoothPeople(true)
      const response = await fetch('/api/booth-people?page=1&limit=1000') // Fetch all booth people
      
      if (!response.ok) {
        throw new Error('Failed to fetch booth people')
      }
      
      const result = await response.json()
      console.log('Fetched booth people from API:', result.data)
      
      // Store booth people in Redux store
      // Convert API data to match our store format
      const boothPeopleData = result.data.map((person: any) => ({
        id: person.id,
        name: person.name,
        phone: person.phone,
        customerVPAs: person.customerVPAs,
        email: person.email,
        status: person.status,
        createdAt: person.inserted_at,
        inserted_at: person.inserted_at,
        updated_at: person.updated_at
      }))
      
      dispatch(setBoothPeople(boothPeopleData))
      console.log('Set booth people in Redux store:', boothPeopleData)
      
    } catch (error) {
      console.error('Error fetching booth people:', error)
      toast({
        title: "Error",
        description: "Failed to fetch booth people for matching. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFetchingBoothPeople(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Format file size
      const sizeInMB = selectedFile.size / (1024 * 1024)
      if (sizeInMB < 1) {
        setFileSize(`${(selectedFile.size / 1024).toFixed(1)} KB`)
      } else {
        setFileSize(`${sizeInMB.toFixed(1)} MB`)
      }
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

    setIsLoading(true)

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

      // Simulate loading delay for better UX
      setTimeout(() => {
        dispatch(setTransactions(parsedTransactions))
        dispatch(setUploadedFile(file.name))
        setIsLoading(false)

        toast({
          title: "Success",
          description: `Uploaded ${parsedTransactions.length} transactions`,
        })
      }, 1500)
    }

    reader.readAsText(file)
  }

  const addSampleTransactions = () => {
    const sampleTransactions = [
      {
        sno: "1",
        transactionDate: "2024-01-15",
        transactionAmount: 100.00,
        rrn: "RRN001",
        customerVPA: "9866496670@yestp",
        isMatched: false
      },
      {
        sno: "2", 
        transactionDate: "2024-01-16",
        transactionAmount: 200.00,
        rrn: "RRN002",
        customerVPA: "1234567890@paytm",
        isMatched: false
      },
      {
        sno: "3",
        transactionDate: "2024-01-17", 
        transactionAmount: 150.00,
        rrn: "RRN003",
        customerVPA: "9866496670@yestp",
        isMatched: false
      },
      {
        sno: "4",
        transactionDate: "2024-01-18",
        transactionAmount: 300.00,
        rrn: "RRN004", 
        customerVPA: "9999999999@upi",
        isMatched: false
      }
    ];
    
    dispatch(setTransactions(sampleTransactions));
    console.log("Added sample transactions:", sampleTransactions);
  };

  const handleMatch = () => {
    console.log("[v0] Starting matching process...")
    console.log("[v0] Current booth people count:", boothPeople.length)
    console.log("[v0] Current transactions count:", transactions.length)

    console.log(
      "[v0] Available booth people:",
      boothPeople.map((p) => ({
        id: p.id,
        name: p.name,
        vpa: p.customerVPAs, // Now a string
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

    // Always check from the current booth people data
    if (boothPeople.length === 0) {
      console.log("[v0] No booth people data available, attempting to fetch...")
      toast({
        title: "No Booth People Data",
        description: "Attempting to fetch booth people data. Please try matching again in a moment.",
        variant: "destructive",
      })
      // Attempt to re-fetch booth people data
      fetchBoothPeopleFromAPI()
      return
    }

    if (transactions.length === 0) {
      toast({
        title: "No Transactions",
        description: "Please upload transaction data before matching.",
        variant: "destructive",
      })
      return
    }

    const updatedTransactions = transactions.map((transaction) => {
      const normalizedTransactionVPA = transaction.customerVPA.trim().toLowerCase()

      const matchingPerson = boothPeople.find((person) => {
        const normalizedPersonVPA = person.customerVPAs.trim().toLowerCase()
        const isMatch = normalizedPersonVPA === normalizedTransactionVPA

        console.log("[v0] Comparing VPAs:", {
          transactionVPA: normalizedTransactionVPA,
          personVPA: normalizedPersonVPA,
          isMatch: isMatch,
        })

        return isMatch
      })

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
    const unmatchedCount = updatedTransactions.filter((t) => !t.isMatched).length

    console.log(
      "[v0] Matching complete. Total matched:",
      totalMatchedCount,
      "Previously matched:",
      previouslyMatchedCount,
      "Total transactions:",
      updatedTransactions.length,
      "Unmatched transactions:",
      unmatchedCount
    )

    console.log("[v0] Unmatched transactions:", 
      updatedTransactions.filter((t) => !t.isMatched).map((t) => ({
        customerVPA: t.customerVPA,
        amount: t.transactionAmount
      }))
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
    <div className="space-y-4">
      {/* Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Booth People</p>
                <p className="text-xl font-bold">{boothPeople.length}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{transactions.length}</p>
              </div>
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matched</p>
                <p className="text-xl font-bold">{matchedTransactions.length}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">₹{totalAmount.toLocaleString()}</p>
              </div>
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload */}
      <div className="flex items-center gap-3">
            <Button variant="outline" onClick={downloadSampleCSV} size="sm">
              <Download className="h-3 w-3 mr-2" />
              Download Template
            </Button>
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="flex-1 text-sm h-8"
            />
            <Button onClick={handleSubmit} disabled={!file} size="sm">
              <Upload className="h-3 w-3 mr-2" />
              Submit
            </Button>
            <Button variant="destructive" onClick={() => { 
              try {
                console.log("Clear button clicked, dispatching clearTransactionData");
                dispatch(clearTransactionData()); 
                setFile(null); 
                setFileSize(""); 
                console.log("Clear completed successfully");
              } catch (error) {
                console.error("Error in clear button handler:", error);
              }
            }} size="sm">
              <Trash2 className="h-3 w-3 mr-2" />
              Clear
            </Button>
          </div>
          {uploadedFile && (
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Uploaded: {uploadedFile} ({fileSize})
            </div>
          )}



      {/* Transaction Preview Table */}
      {(transactions.length > 0 || isLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction Preview</CardTitle>
                <CardDescription>Preview of uploaded transaction data</CardDescription>
              </div>
              <Button onClick={handleMatch} disabled={isLoading}>Match Transactions</Button>
              <Button 
                onClick={addSampleTransactions} 
                variant="outline"
                className="ml-2"
              >
                Add Sample Data
              </Button>
              <Button 
                onClick={() => {
                  console.log("=== Manual Test ===");
                  console.log("Booth People Count:", boothPeople.length);
                  console.log("Transactions Count:", transactions.length);
                  console.log("Booth People Data:", boothPeople);
                  console.log("Transactions Data:", transactions);
                  handleMatch();
                }} 
                variant="outline"
                className="ml-2"
              >
                Test Matching
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.NO</TableHead>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-24">Amount</TableHead>
                    <TableHead className="w-32">RRN</TableHead>
                    <TableHead className="min-w-48">Customer VPA</TableHead>
                    <TableHead className="w-24">Match Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Skeleton loading rows
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    transactions.slice(0, 10).map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.sno}</TableCell>
                        <TableCell>{transaction.transactionDate}</TableCell>
                        <TableCell className="font-medium">₹{transaction.transactionAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.rrn}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.customerVPA}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.isMatched ? "default" : "secondary"} className="text-xs">
                            {transaction.isMatched ? "Matched" : "Unmatched"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {transactions.length > 10 && (
              <p className="text-xs text-muted-foreground mt-3">
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Unmatched Transactions</CardTitle>
                <CardDescription>{unmatchedTransactions.length} transactions could not be matched</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {/* Previous page logic */}} disabled={true}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => {/* Next page logic */}} disabled={true}>
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-24">Amount</TableHead>
                    <TableHead className="min-w-48">Customer VPA</TableHead>
                    <TableHead className="w-32">RRN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmatchedTransactions.slice(0, 20).map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{transaction.transactionDate}</TableCell>
                      <TableCell className="font-medium">₹{transaction.transactionAmount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.customerVPA}</TableCell>
                      <TableCell className="font-mono text-xs">{transaction.rrn}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {unmatchedTransactions.length > 20 && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing first 20 of {unmatchedTransactions.length} unmatched transactions
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
