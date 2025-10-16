"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Users, CreditCard, CheckCircle, Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { setTransactions, setUploadedFile, clearAllData, clearTransactionData, initializeStoreFromSession, setBoothPeople } from "@/lib/store"
import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { VirtualizedTable } from "./virtualized-table"

interface Transaction {
  sno: string
  transactionDate: string
  transactionAmount: number
  rrn: string
  customerVPA: string
  isMatched?: boolean
  matchedPersonId?: string
  route_no?: string
  cc_no?: string
}

export function SimpleDashboard() {
  const dispatch = useAppDispatch()
  const { boothPeople, transactions, uploadedFile } = useAppSelector((state) => state.app)
  const [file, setFile] = useState<File | null>(null)
  const [fileSize, setFileSize] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingBoothPeople, setIsFetchingBoothPeople] = useState(false)
  const { toast } = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50) // Show 50 items per page
  const [unmatchedPage, setUnmatchedPage] = useState(1)
  const [unmatchedPerPage] = useState(50)

  // Progress tracking
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Load data from session storage on component mount
  useEffect(() => {
    // Initialize store from session storage on client side
    initializeStoreFromSession()
    // Fetch booth people from API
    fetchBoothPeopleFromAPI()

    // Development-only: Handle HMR issues
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: HMR safety checks enabled');
    }
  }, [])

  // Fetch booth people from API
  const fetchBoothPeopleFromAPI = async () => {
    try {
      setIsFetchingBoothPeople(true)
      const response = await fetch('/api/booth-people?limit=all') // Fetch all booth people

      if (!response.ok) {
        throw new Error('Failed to fetch booth people')
      }

      const result = await response.json()

      // Store booth people in Redux store
      // Convert API data to match our store format
      const boothPeopleData = result.data.map((person: any) => ({
        id: person.id,
        name: person.name,
        phone: person.phone,
        vpa: person.vpa, // Use 'vpa' which is the actual column name
        customerVPAs: person.vpa, // Keep customerVPAs for compatibility
        route_no: person.route_no,
        cc_no: person.cc_no,
        email: person.email,
        status: person.status,
        createdAt: person.inserted_at,
        inserted_at: person.inserted_at,
        updated_at: person.updated_at
      }))

      dispatch(setBoothPeople(boothPeopleData))

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
      ["S.NO", "Transaction Date", "Transaction Amount", "RRN", "Customer VPA"],
      ["1", "01-10-2025", "15000", "562998387734", "9866496670@yestp"],
      ["2", "01-10-2025", "8500", "562998387735", "9876543210@paytm"],
      ["3", "01-10-2025", "22000", "562998387736", "9988776655@gpay"],
      ["4", "01-10-2025", "11200", "562998387737", "9123456789@phonepe"],
      ["5", "01-10-2025", "18500", "562998387738", "9555666777@yestp"],
      ["6", "02-10-2025", "9500", "562998387739", "9876509876@paytm"],
      ["7", "02-10-2025", "16500", "562998387740", "9123987654@gpay"],
      ["8", "02-10-2025", "7800", "562998387741", "9987654321@phonepe"],
      ["9", "02-10-2025", "13200", "562998387742", "9765498765@yestp"],
      ["10", "02-10-2025", "21000", "562998387743", "9876543211@paytm"],
      ["11", "03-10-2025", "11800", "562998387744", "9123456788@gpay"],
      ["12", "03-10-2025", "9400", "562998387745", "9988776656@phonepe"],
      ["13", "03-10-2025", "17300", "562998387746", "9555666778@yestp"],
      ["14", "03-10-2025", "12700", "562998387747", "9876509877@paytm"],
      ["15", "03-10-2025", "8500", "562998387748", "9123987655@gpay"],
      ["16", "04-10-2025", "19800", "562998387749", "9987654322@phonepe"],
      ["17", "04-10-2025", "11400", "562998387750", "9765498766@yestp"],
      ["18", "04-10-2025", "15600", "562998387751", "9876543212@paytm"],
      ["19", "04-10-2025", "8900", "562998387752", "9123456787@gpay"],
      ["20", "04-10-2025", "20300", "562998387753", "9988776657@phonepe"],
      ["21", "05-10-2025", "14700", "562998387754", "9555666779@yestp"],
      ["22", "05-10-2025", "10800", "562998387755", "9876509878@paytm"],
      ["23", "05-10-2025", "16900", "562998387756", "9123987656@gpay"],
      ["24", "05-10-2025", "12300", "562998387757", "9987654323@phonepe"],
      ["25", "05-10-2025", "18600", "562998387758", "9765498767@yestp"],
      ["26", "06-10-2025", "9100", "562998387759", "9876543213@paytm"],
      ["27", "06-10-2025", "17400", "562998387760", "9123456786@gpay"],
      ["28", "06-10-2025", "13800", "562998387761", "9988776658@phonepe"],
      ["29", "06-10-2025", "10500", "562998387762", "9555666780@yestp"],
      ["30", "06-10-2025", "19200", "562998387763", "9876509879@paytm"],
      ["31", "07-10-2025", "11600", "562998387764", "9123987657@gpay"],
      ["32", "07-10-2025", "14800", "562998387765", "9987654324@phonepe"],
      ["33", "07-10-2025", "8700", "562998387766", "9765498768@yestp"],
      ["34", "07-10-2025", "15900", "562998387767", "9876543214@paytm"],
      ["35", "07-10-2025", "12100", "562998387768", "9123456785@gpay"],
      ["36", "08-10-2025", "18300", "562998387769", "9988776659@phonepe"],
      ["37", "08-10-2025", "9700", "562998387770", "9555666781@yestp"],
      ["38", "08-10-2025", "16400", "562998387771", "9876509880@paytm"],
      ["39", "08-10-2025", "13300", "562998387772", "9123987658@gpay"],
      ["40", "08-10-2025", "19700", "562998387773", "9987654325@phonepe"],
      ["41", "09-10-2025", "10900", "562998387774", "9765498769@yestp"],
      ["42", "09-10-2025", "15200", "562998387775", "9876543215@paytm"],
      ["43", "09-10-2025", "8500", "562998387776", "9123456784@gpay"],
      ["44", "09-10-2025", "17600", "562998387777", "9988776660@phonepe"],
      ["45", "09-10-2025", "12800", "562998387778", "9555666782@yestp"],
      ["46", "10-10-2025", "18900", "562998387779", "9876509881@paytm"],
      ["47", "10-10-2025", "11400", "562998387780", "9123987659@gpay"],
      ["48", "10-10-2025", "16700", "562998387781", "9987654326@phonepe"],
      ["49", "10-10-2025", "10200", "562998387782", "9765498770@yestp"],
      ["50", "10-10-2025", "14500", "562998387783", "9876543216@paytm"]
    ]

    const csvContent = sampleData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transaction_template_50_records.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Template Downloaded",
      description: "50-record CSV template downloaded successfully",
      variant: "success",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      console.log("No file selected, showing error toast")
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setIsProcessing(true)
    setProgress(0)
    setProgressMessage('Reading file...')

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        console.log("CSV Content preview:", text.substring(0, 500) + "...")

        // Parse CSV with better error handling and performance optimization
        const lines = text.trim().split('\n')
        console.log("Total lines in CSV:", lines.length)

        if (lines.length < 2) {
          toast({
            title: "Invalid CSV file",
            description: "CSV file must contain at least a header and one data row",
            variant: "destructive",
          })
          setIsLoading(false)
          setIsProcessing(false)
          return
        }

        const headers = lines[0].split(',').map(h => h.trim())
        console.log("CSV Headers:", headers)

        // Check if required columns exist
        const requiredColumns = ['S.NO', 'Transaction Date', 'Transaction Amount', 'RRN', 'Customer VPA']
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))

        if (missingColumns.length > 0) {
          toast({
            title: "Missing required columns",
            description: `Missing columns: ${missingColumns.join(', ')}`,
            variant: "destructive",
          })
          setIsLoading(false)
          setIsProcessing(false)
          return
        }

        const transactions: Transaction[] = []
        const startTime = performance.now()

        // Process transactions in batches for better performance with large files
        const batchSize = 500
        let processedLines = 0

        setProgressMessage('Parsing transactions...')

        // Process transactions starting from line 1 (skip header)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue // Skip empty lines

          const values = line.split(',').map(value => value.trim())

          if (values.length < headers.length) {
            console.warn(`Skipping line ${i + 1}: insufficient columns`)
            continue
          }

          try {
            const transaction: Transaction = {
              sno: values[0] || '',
              transactionDate: values[1] || '',
              transactionAmount: parseFloat(values[2]) || 0,
              rrn: values[3] || '',
              customerVPA: values[4] || '',
              isMatched: false,
            }

            transactions.push(transaction)
            processedLines++

            // Update progress for large files
            if (processedLines % batchSize === 0) {
              const progressPercent = Math.round((processedLines / (lines.length - 1)) * 100)
              setProgress(progressPercent)
              setProgressMessage(`Processed ${processedLines} of ${lines.length - 1} transactions...`)
              console.log(`Processed ${processedLines} transactions... (${progressPercent}%)`)
            }
          } catch (error) {
            console.error(`Error parsing line ${i + 1}:`, error)
            continue
          }
        }

        const endTime = performance.now()
        console.log(`Successfully parsed ${transactions.length} transactions in ${(endTime - startTime).toFixed(2)}ms`)

        setProgressMessage('Saving data...')
        setProgress(95)

        // Batch dispatch for better performance
        dispatch(setTransactions(transactions))
        dispatch(setUploadedFile(file.name))

        setProgress(100)
        setProgressMessage('Complete!')

        toast({
          title: "Success!",
          description: `Successfully uploaded ${transactions.length} transactions`,
        })

        // Reset progress after a delay
        setTimeout(() => {
          setIsProcessing(false)
          setProgress(0)
          setProgressMessage('')
        }, 1000)

      } catch (error) {
        console.error("Error parsing CSV:", error)
        toast({
          title: "Error parsing CSV",
          description: "Please check the file format and try again",
          variant: "destructive",
        })
        setIsProcessing(false)
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "Please try again or select a different file",
        variant: "destructive",
      })
      setIsLoading(false)
      setIsProcessing(false)
    }

    reader.readAsText(file)
  }

  const handleClearData = useCallback(() => {
    try {
      console.log("Clear button clicked, attempting to dispatch clearTransactionData");

      // Check if dispatch and clearTransactionData are available
      if (!dispatch) {
        console.error("Dispatch is not available");
        return;
      }

      if (!clearTransactionData) {
        console.error("clearTransactionData action is not available");
        return;
      }

      // Try to dispatch the action
      dispatch(clearTransactionData());

      // Clear local state
      setFile(null);
      setFileSize("");

      console.log("Clear completed successfully");

      toast({
        title: "Success",
        description: "Transaction data cleared successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error clearing transaction data:", error);
      toast({
        title: "Error",
        description: "Failed to clear transaction data. Please try again.",
        variant: "destructive",
      });
    }
  }, [dispatch, toast]);

  const handleMatch = async () => {
    setIsLoading(true)
    setIsProcessing(true)
    setProgress(0)
    setProgressMessage('Preparing matching data...')

    try {
      console.log("=== Starting Matching Process ===")
      console.log("Total transactions:", transactions.length)
      console.log("Total booth people:", boothPeople.length)

      setProgressMessage('Building VPA lookup map...')
      // Create a Map for faster lookup of booth people by VPA
      const vpaToPersonMap = new Map<string, any>()
      boothPeople.forEach(person => {
        // Use both customerVPAs and vpa fields to support both field names
        const vpa = person.customerVPAs || person.vpa
        if (vpa) {
          vpaToPersonMap.set(vpa, person)
        }
      })

      console.log(`Created VPA lookup map with ${vpaToPersonMap.size} entries`)

      setProgressMessage('Matching transactions...')
      // Process transactions in batches for better performance
      const batchSize = 500
      const updatedTransactions: Transaction[] = []
      let processedCount = 0

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, Math.min(i + batchSize, transactions.length))
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactions.length / batchSize)}`)

        const batchResults = batch.map((transaction) => {
          const matchedPerson = vpaToPersonMap.get(transaction.customerVPA)

          return {
            ...transaction,
            isMatched: !!matchedPerson,
            matchedPersonId: matchedPerson?.id || undefined,
            route_no: matchedPerson?.route_no || undefined,
            cc_no: matchedPerson?.cc_no || undefined,
          }
        })

        updatedTransactions.push(...batchResults)
        processedCount += batch.length

        const progressPercent = Math.round((processedCount / transactions.length) * 100)
        setProgress(progressPercent)
        setProgressMessage(`Matched ${processedCount} of ${transactions.length} transactions...`)

        // Allow UI to update between batches
        if (i + batchSize < transactions.length) {
          // Small delay to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      setProgressMessage('Saving results...')
      setProgress(95)

      dispatch(setTransactions(updatedTransactions))

      const matchedCount = updatedTransactions.filter(t => t.isMatched).length
      console.log(`Matching complete: ${matchedCount} out of ${transactions.length} matched`)

      setProgress(100)
      setProgressMessage('Matching complete!')

      toast({
        title: "Matching Complete",
        description: `Matched ${matchedCount} out of ${transactions.length} transactions`,
        variant: "success",
      })

      // Reset progress after a delay
      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
        setProgressMessage('')
      }, 1000)

    } catch (error) {
      console.error("Error during matching:", error)
      toast({
        title: "Error",
        description: "Failed to match transactions. Please try again.",
        variant: "destructive",
      })
      setIsProcessing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const addSampleTransactions = () => {
    const sampleTransactions: Transaction[] = [
      {
        sno: "1",
        transactionDate: "20-09-2025",
        transactionAmount: 12850,
        rrn: "562998387734",
        customerVPA: "9866496670@yestp",
        isMatched: false
      },
      {
        sno: "2",
        transactionDate: "20-09-2025",
        transactionAmount: 15000,
        rrn: "562998387735",
        customerVPA: "9876543210@paytm",
        isMatched: false
      },
      {
        sno: "3",
        transactionDate: "20-09-2025",
        transactionAmount: 8500,
        rrn: "562998387736",
        customerVPA: "9988776655@gpay",
        isMatched: false
      }
    ]

    dispatch(setTransactions(sampleTransactions))
    toast({
      title: "Sample Data Added",
      description: "Added 3 sample transactions for testing",
      variant: "success",
    })
  }

  const matchedTransactions = transactions.filter((t) => t.isMatched)
  const unmatchedTransactions = transactions.filter((t) => !t.isMatched)
  const totalAmount = transactions.reduce((sum, t) => sum + t.transactionAmount, 0)

  // Pagination helpers
  const getPaginatedData = (data: Transaction[], page: number, perPage: number) => {
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number, perPage: number) => {
    return Math.ceil(totalItems / perPage)
  }

  const handlePageChange = (newPage: number, totalPages: number, setPage: (page: number) => void) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

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

      {/* Progress Indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{progressMessage}</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Button variant="destructive" onClick={handleClearData} size="sm">
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Preview</CardTitle>
              <CardDescription>{transactions.length === 0 ? 'Upload transaction data to see preview' : `Preview of uploaded transaction data (${transactions.length} total)`}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleMatch} disabled={isLoading || transactions.length === 0}>Match Transactions</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(isLoading || transactions.length === 0) ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-16">S.NO</TableHead>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead className="w-24">Amount</TableHead>
                      <TableHead className="w-32">RRN</TableHead>
                      <TableHead className="min-w-48">Customer VPA</TableHead>
                      <TableHead className="w-32">Route No</TableHead>
                      <TableHead className="w-32">CC No</TableHead>
                      <TableHead className="w-24">Match Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: transactions.length === 0 ? 3 : 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <>
                {transactions.length > 50 ? (
                  <div className="overflow-x-auto max-h-[400px]">
                    <VirtualizedTable
                      data={transactions}
                      columns={[
                        { key: 'sno', header: 'S.NO', width: 'w-16' },
                        { key: 'transactionDate', header: 'Date', width: 'w-24' },
                        { key: 'transactionAmount', header: 'Amount', width: 'w-24', render: (value) => `₹${Number(value).toLocaleString()}` },
                        { key: 'rrn', header: 'RRN', width: 'w-32' },
                        { key: 'customerVPA', header: 'Customer VPA', width: 'min-w-48' },
                        {
                          key: 'isMatched',
                          header: 'Status',
                          width: 'w-24',
                          render: (value) => (
                            <Badge variant={value ? "default" : "secondary"} className="text-xs">
                              {value ? "Matched" : "Unmatched"}
                            </Badge>
                          )
                        }
                      ]}
                      rowHeight={48}
                      visibleRows={15}
                      className="border rounded-md"
                    />
                  </div>
                ) : (
              <div className="overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-16">S.NO</TableHead>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead className="w-24">Amount</TableHead>
                      <TableHead className="w-32">RRN</TableHead>
                      <TableHead className="min-w-48">Customer VPA</TableHead>
                      <TableHead className="w-32">Route No</TableHead>
                      <TableHead className="w-32">CC No</TableHead>
                      <TableHead className="w-24">Match Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(transactions, currentPage, itemsPerPage).map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.sno}</TableCell>
                        <TableCell>{transaction.transactionDate}</TableCell>
                        <TableCell className="font-medium">₹{transaction.transactionAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.rrn}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.customerVPA}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.route_no || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.cc_no || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.isMatched ? "default" : "secondary"} className="text-xs">
                            {transaction.isMatched ? "Matched" : "Unmatched"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
                )}
                {/* Pagination Controls for Transaction Table */}
                {transactions.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1, getTotalPages(transactions.length, itemsPerPage), setCurrentPage)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {currentPage} of {getTotalPages(transactions.length, itemsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1, getTotalPages(transactions.length, itemsPerPage), setCurrentPage)}
                        disabled={currentPage === getTotalPages(transactions.length, itemsPerPage)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      {/* Unmatched Values */}
      {unmatchedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Unmatched Transactions ({unmatchedTransactions.length})</CardTitle>
                <CardDescription>{unmatchedTransactions.length} transactions could not be matched</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(unmatchedPage - 1, getTotalPages(unmatchedTransactions.length, unmatchedPerPage), setUnmatchedPage)}
                  disabled={unmatchedPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {unmatchedPage} of {getTotalPages(unmatchedTransactions.length, unmatchedPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(unmatchedPage + 1, getTotalPages(unmatchedTransactions.length, unmatchedPerPage), setUnmatchedPage)}
                  disabled={unmatchedPage === getTotalPages(unmatchedTransactions.length, unmatchedPerPage)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {unmatchedTransactions.length > 50 ? (
              <div className="overflow-x-auto max-h-[400px]">
                <VirtualizedTable
                  data={unmatchedTransactions}
                  columns={[
                    { key: 'transactionDate', header: 'Date', width: 'w-24' },
                    { key: 'transactionAmount', header: 'Amount', width: 'w-24', render: (value) => `₹${Number(value).toLocaleString()}` },
                    { key: 'customerVPA', header: 'Customer VPA', width: 'min-w-48' },
                    { key: 'route_no', header: 'Route No', width: 'w-32' },
                    { key: 'cc_no', header: 'CC No', width: 'w-32' },
                    { key: 'rrn', header: 'RRN', width: 'w-32' }
                  ]}
                  rowHeight={48}
                  visibleRows={15}
                  className="border rounded-md"
                />
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead className="w-24">Amount</TableHead>
                      <TableHead className="min-w-48">Customer VPA</TableHead>
                      <TableHead className="w-32">Route No</TableHead>
                      <TableHead className="w-32">CC No</TableHead>
                      <TableHead className="w-32">RRN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedData(unmatchedTransactions, unmatchedPage, unmatchedPerPage).map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{transaction.transactionDate}</TableCell>
                        <TableCell className="font-medium">₹{transaction.transactionAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.customerVPA}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.route_no || '-'}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.cc_no || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{transaction.rrn}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Pagination Controls for Unmatched Table */}
            {unmatchedTransactions.length > unmatchedPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((unmatchedPage - 1) * unmatchedPerPage) + 1} to {Math.min(unmatchedPage * unmatchedPerPage, unmatchedTransactions.length)} of {unmatchedTransactions.length} unmatched transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(unmatchedPage - 1, getTotalPages(unmatchedTransactions.length, unmatchedPerPage), setUnmatchedPage)}
                    disabled={unmatchedPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {unmatchedPage} of {getTotalPages(unmatchedTransactions.length, unmatchedPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(unmatchedPage + 1, getTotalPages(unmatchedTransactions.length, unmatchedPerPage), setUnmatchedPage)}
                    disabled={unmatchedPage === getTotalPages(unmatchedTransactions.length, unmatchedPerPage)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
