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
      const response = await fetch('/api/booth-people?page=1&limit=1000') // Fetch all booth people
      
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
        customerVPAs: person.customerVPAs,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
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
        if (person.customerVPAs) {
          vpaToPersonMap.set(person.customerVPAs, person)
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
      {(transactions.length > 0 || isLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction Preview</CardTitle>
                <CardDescription>Preview of uploaded transaction data ({transactions.length} total)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleMatch} disabled={isLoading}>Match Transactions</Button>
                <Button 
                  onClick={addSampleTransactions} 
                  variant="outline"
                >
                  Add Sample Data
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                    {Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 w-8 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse"></div></TableCell>
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
                ) : (
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
                        {transactions.map((transaction, index) => (
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
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
              <VirtualizedTable
                data={unmatchedTransactions}
                columns={[
                  { key: 'transactionDate', header: 'Date', width: 'w-24' },
                  { key: 'transactionAmount', header: 'Amount', width: 'w-24', render: (value) => `₹${Number(value).toLocaleString()}` },
                  { key: 'customerVPA', header: 'Customer VPA', width: 'min-w-48' },
                  { key: 'rrn', header: 'RRN', width: 'w-32' }
                ]}
                rowHeight={48}
                visibleRows={15}
                className="border rounded-md"
              />
            ) : (
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
                    {getPaginatedData(unmatchedTransactions, unmatchedPage, unmatchedPerPage).map((transaction, index) => (
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
