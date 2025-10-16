"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, UserPlus, Upload, Download, Search, X, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useData } from "@/components/providers/data-provider"

interface BoothPerson {
  id: string
  route_no?: string
  vpa: string
  cc_no: string
  phone: string
  name?: string
  updated_at: string
  inserted_at: string
}

interface ApiResponse {
  data: BoothPerson[]
  count: number
  pagination: {
    page: number
    limit: number
    totalPages: number
  }
}

export function BoothPeople() {
  const { boothPeople: globalBoothPeople, isLoading: globalIsLoading, refreshData } = useData()
  const [boothPeople, setBoothPeople] = useState<BoothPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingPerson, setEditingPerson] = useState<BoothPerson | null>(null)
  const [addingVPATo, setAddingVPATo] = useState<string | null>(null)
  const [newVPA, setNewVPA] = useState("")
  const [formData, setFormData] = useState({
    route_no: "",
    vpa: "",
    cc_no: "",
    phone: "",
    name: "",
  })
  const [editFormData, setEditFormData] = useState({
    route_no: "",
    vpa: "",
    cc_no: "",
    phone: "",
    name: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState<BoothPerson[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteProgress, setDeleteProgress] = useState(0)
  const [deleteProgressMessage, setDeleteProgressMessage] = useState('')
  const { toast } = useToast()

  // Filter data based on search query
  const filterData = (data: BoothPerson[], query: string) => {
    if (!query.trim()) return data
    
    const searchTerm = query.toLowerCase()
    return data.filter(person => 
      (person.name?.toLowerCase() || '').includes(searchTerm) ||
      (person.route_no?.toLowerCase() || '').includes(searchTerm) ||
      person.phone.toLowerCase().includes(searchTerm) ||
      person.vpa.toLowerCase().includes(searchTerm) ||
      person.cc_no.toLowerCase().includes(searchTerm)
    )
  }

  // Handle individual checkbox selection
  const handleSelectPerson = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(filteredData.map(person => person.id)))
      setSelectAll(true)
    }
  }

  // Update selectAll state when individual selections change
  useEffect(() => {
    if (filteredData.length === 0) {
      setSelectAll(false)
    } else {
      setSelectAll(selectedIds.size === filteredData.length)
    }
  }, [selectedIds, filteredData])

  // Bulk delete selected records
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select records to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
      return
    }

    const idsToDelete = Array.from(selectedIds)
    const totalCount = idsToDelete.length
    const batchSize = 1000 // API limit

    try {
      setIsDeleting(true)
      setDeleteProgress(0)
      setDeleteProgressMessage(`Preparing to delete ${totalCount} records...`)

      let deletedCount = 0
      const failedBatches: string[] = []

      // Process in batches to handle API limit
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        const totalBatches = Math.ceil(idsToDelete.length / batchSize)

        setDeleteProgressMessage(`Deleting batch ${batchNumber} of ${totalBatches} (${batch.length} records)...`)

        try {
          const response = await fetch('/api/booth-people/bulk-delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: batch }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.details || `Failed to delete batch ${batchNumber}`)
          }

          const result = await response.json()
          deletedCount += result.count

          // Update progress
          const progress = Math.round((deletedCount / totalCount) * 100)
          setDeleteProgress(progress)

        } catch (batchError) {
          console.error(`Error deleting batch ${batchNumber}:`, batchError)
          failedBatches.push(`Batch ${batchNumber}: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
        }
      }

      // Remove deleted records from state and session storage
      const remainingPeople = boothPeople.filter(person => !selectedIds.has(person.id))
      setBoothPeople(remainingPeople)
      saveSessionData(remainingPeople)
      
      // Clear selection
      setSelectedIds(new Set())
      setSelectAll(false)

      if (failedBatches.length > 0) {
        // Some batches failed
        setDeleteProgressMessage(`Deleted ${deletedCount} of ${totalCount} records. Some batches failed.`)
        toast({
          title: "Partial Success",
          description: `Deleted ${deletedCount} of ${totalCount} records. Errors: ${failedBatches.length}`,
          variant: "destructive",
        })
      } else {
        // All records deleted successfully
        setDeleteProgress(100)
        setDeleteProgressMessage(`Successfully deleted ${deletedCount} records`)
        toast({
          title: "Success",
          description: `Successfully deleted ${deletedCount} records`,
        })
      }

      // Clear progress after a delay
      setTimeout(() => {
        setIsDeleting(false)
        setDeleteProgress(0)
        setDeleteProgressMessage('')
      }, 3000)

    } catch (error) {
      console.error('Error deleting records:', error)
      setIsDeleting(false)
      setDeleteProgress(0)
      setDeleteProgressMessage('')
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete selected records",
        variant: "destructive",
      })
    }
  }

  // Session storage key
  const SESSION_STORAGE_KEY = 'booth_people_data'
  const SESSION_STORAGE_EXPIRY = 30 * 60 * 1000 // 30 minutes

  // Check if data exists in session storage and is not expired
  const getSessionData = (): BoothPerson[] | null => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!stored) return null
      
      const { data, timestamp } = JSON.parse(stored)
      const now = new Date().getTime()
      
      // Check if data is expired (30 minutes)
      if (now - timestamp > SESSION_STORAGE_EXPIRY) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error reading session storage:', error)
      return null
    }
  }

  // Save data to session storage
  const saveSessionData = (data: BoothPerson[]) => {
    try {
      const dataToStore = {
        data,
        timestamp: new Date().getTime()
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToStore))
    } catch (error) {
      console.error('Error saving to session storage:', error)
    }
  }

  // Fetch booth people from API - now uses global data provider
  const fetchBoothPeople = async () => {
    await refreshData()
  }

  // Clear session storage and refresh data
  const clearSessionAndRefresh = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    refreshData()
  }

  useEffect(() => {
    // Clear any stale session data on component mount
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    // Data is already loaded by global provider, just sync
    setBoothPeople(globalBoothPeople)
    setIsLoading(globalIsLoading)
  }, [])

  // Sync with global data
  useEffect(() => {
    setBoothPeople(globalBoothPeople)
    setIsLoading(globalIsLoading)
  }, [globalBoothPeople, globalIsLoading])

  // Apply filtering when data or search query changes
  useEffect(() => {
    const filtered = filterData(boothPeople, searchQuery)
    setFilteredData(filtered)
  }, [boothPeople, searchQuery])

  const downloadSampleCSV = () => {
    const csvContent = `Route No,VPA,CC No,Phone,Name
ROUTE001,johndoe@ybl,CC1234567890,9876543210,John Doe
ROUTE002,janesmith@ybl,CC1234567891,9876543211,Jane Smith
ROUTE003,mike@ybl,CC1234567892,9876543212,Mike Johnson
ROUTE004,sarah@ybl,CC1234567893,9876543213,Sarah Wilson`

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "booth_people_sample.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const [csvPreview, setCsvPreview] = useState<any[]>([])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      
      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length >= 2) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Map common header variations to standard names for new schema
          const headerMapping: { [key: string]: string } = {
            'route_no': 'route_no',
            'route no': 'route_no',
            'route': 'route_no',
            'vpa': 'vpa',
            'upi id': 'vpa',
            'upi': 'vpa',
            'cc_no': 'cc_no',
            'cc no': 'cc_no',
            'cc': 'cc_no',
            'phone': 'phone',
            'mobile': 'phone',
            'contact': 'phone',
            'name': 'name',
            'person name': 'name',
            'full name': 'name'
          };
          
          // Normalize headers using the mapping
          const normalizedHeaders = headers.map(header => headerMapping[header] || header);
          
          const previewData = lines.slice(1, 6).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};
            normalizedHeaders.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            return row;
          });
          setCsvPreview(previewData);
        } else {
          setCsvPreview([]);
        }
      } catch (error) {
        console.error('Error reading CSV file:', error);
        setCsvPreview([]);
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Parse CSV file
      const text = await uploadFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row')
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Map common header variations to standard names
      const headerMapping: { [key: string]: string } = {
        'name': 'name',
        'phone': 'phone',
        'customerVPAs': 'customerVPAs',
        'customervpas': 'customerVPAs', // lowercase version
        'customer_vpas': 'customerVPAs',
        'vpa': 'customerVPAs',
        'vpas': 'customerVPAs',
        'email': 'email',
        'status': 'status',
        // Additional variations for robustness
        'vpa': 'customerVPAs',
        'vpas': 'customerVPAs'
      };
      
      // Normalize headers using the mapping
      const normalizedHeaders = headers.map(header => headerMapping[header] || header);
      
      // Validate required headers
      const requiredHeaders = ['vpa', 'cc_no']
      const missingHeaders = requiredHeaders.filter(h => !normalizedHeaders.includes(h))
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
      }

      // Parse CSV data
      const boothPeople = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim())
        const record: any = {}
        
        normalizedHeaders.forEach((header, i) => {
          if (values[i] && values[i] !== '') {
            record[header] = values[i]
          }
        })

        // Validate required fields
        if (!record.vpa || !record.cc_no) {
          throw new Error(`Row ${index + 2}: Missing required fields (vpa, cc_no)`)
        }

        // Validate VPA format
        const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/
        if (!vpaRegex.test(record.vpa)) {
          throw new Error(`Row ${index + 2}: Invalid VPA format. Must be like username@bank`)
        }

        return {
          route_no: record.route_no || null,
          vpa: record.vpa,
          cc_no: record.cc_no,
          phone: record.phone || null,
          name: record.name || null
        }
      })

      // Create FormData for file upload
      const formData = new FormData()
      
      // Convert the parsed data back to CSV format for the API
      const csvContent = [
        'route_no,vpa,cc_no,phone,name', // headers
        ...boothPeople.map(person => 
          `${person.route_no || ''},${person.vpa},${person.cc_no},${person.phone || ''},${person.name || ''}`
        )
      ].join('\n')
      
      // Create a Blob from the CSV content
      const csvBlob = new Blob([csvContent], { type: 'text/csv' })
      formData.append('file', csvBlob, 'bulk_upload.csv')
      
      const response = await fetch('/api/booth-people', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to upload booth people')
      }
      
      const result = await response.json()
      toast({
        title: "Bulk Upload Complete",
        description: result.message || `Successfully added ${result.count || 0} people.`,
      })

      setIsBulkUploadOpen(false)
      setUploadFile(null)
      fetchBoothPeople() // Refresh the data after upload
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddPerson = async () => {
    if (!formData.vpa || !formData.cc_no) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (VPA and CC No)",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/booth-people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_no: formData.route_no || null,
          vpa: formData.vpa,
          cc_no: formData.cc_no,
          phone: formData.phone || null,
          name: formData.name || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to add person')
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: "Booth person added successfully",
      })

      setIsAddDialogOpen(false)
      setFormData({ route_no: "", vpa: "", cc_no: "", phone: "", name: "" })
      fetchBoothPeople() // Refresh the data after adding
    } catch (error) {
      console.error('Error adding person:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add person",
        variant: "destructive",
      })
    }
  }

  const handleEditPerson = (person: BoothPerson) => {
    setEditingPerson(person)
    setEditFormData({
      route_no: person.route_no || "",
      vpa: person.vpa,
      cc_no: person.cc_no,
      phone: person.phone || "",
      name: person.name || "",
    })
  }

  const handleUpdatePerson = async () => {
    if (!editingPerson || !editFormData.vpa || !editFormData.cc_no) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (VPA and CC No)",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/booth-people', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPerson.id,
          route_no: editFormData.route_no || null,
          vpa: editFormData.vpa,
          cc_no: editFormData.cc_no,
          phone: editFormData.phone || null,
          name: editFormData.name || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to update person')
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: "Booth person updated successfully",
      })

      setEditingPerson(null)
      setEditFormData({ name: "", phone: "", customerVPAs: "", email: "", status: "" })
      fetchBoothPeople() // Refresh the data after update
    } catch (error) {
      console.error('Error updating person:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update person",
        variant: "destructive",
      })
    }
  }

  const handleDeletePerson = async (personId: string) => {
    if (!window.confirm('Are you sure you want to delete this person?')) {
      return
    }

    try {
      const response = await fetch(`/api/booth-people?id=${personId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to delete person')
      }

      toast({
        title: "Success",
        description: "Booth person deleted successfully",
      })

      fetchBoothPeople() // Refresh the data after deletion
    } catch (error) {
      console.error('Error deleting person:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete person",
        variant: "destructive",
      })
    }
  }

  // Add VPA function - for the current API structure, this updates the VPA
  const handleAddVPA = async () => {
    if (!addingVPATo || !newVPA) {
      toast({
        title: "Error",
        description: "Please enter a valid VPA",
        variant: "destructive",
      })
      return
    }

    try {
      // Update the person's VPA
      const response = await fetch('/api/booth-people', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: addingVPATo,
          vpa: newVPA,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to update VPA')
      }

      const result = await response.json()
      toast({
        title: "Success",
        description: "VPA updated successfully",
      })

      setAddingVPATo(null)
      setNewVPA("")
      fetchBoothPeople() // Refresh data after update
    } catch (error) {
      console.error('Error updating VPA:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update VPA",
        variant: "destructive",
      })
    }
  }

  // Removed pagination functions since we fetch all records at once

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booth People</h2>
          <p className="text-muted-foreground">Manage booth people and their VPA details</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Upload Booth People</DialogTitle>
                <DialogDescription>Upload a CSV file to add multiple booth people at once</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulk-file">CSV File</Label>
                  <Input
                    id="bulk-file"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with columns: Route No, VPA, CC No, Phone, Name
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>
                
                {/* CSV Preview */}
                {csvPreview.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Preview (First 5 rows)</Label>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(csvPreview[0]).map((header) => (
                              <TableHead key={header} className="text-xs">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value: any, i) => (
                                <TableCell key={i} className="text-xs py-2">
                                  {value || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkUpload} disabled={!uploadFile || isUploading}>
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) {
              setFormData({ route_no: "", vpa: "", cc_no: "", phone: "", name: "" })
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Booth Person</DialogTitle>
                <DialogDescription>Add a new person with their details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="route_no">Route No</Label>
                  <Input
                    id="route_no"
                    value={formData.route_no}
                    onChange={(e) => setFormData({ ...formData, route_no: e.target.value })}
                    placeholder="Enter route number (optional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vpa">VPA *</Label>
                  <Input
                    id="vpa"
                    value={formData.vpa}
                    onChange={(e) => setFormData({ ...formData, vpa: e.target.value })}
                    placeholder="Enter UPI ID (e.g., name@ybl)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cc_no">CC No *</Label>
                  <Input
                    id="cc_no"
                    value={formData.cc_no}
                    onChange={(e) => setFormData({ ...formData, cc_no: e.target.value })}
                    placeholder="Enter CC number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number (optional)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name (optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPerson} disabled={!formData.vpa || !formData.cc_no}>
                  Add Person
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Booth People</CardTitle>
              <CardDescription>Manage all registered booth people and their details</CardDescription>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {filteredData.length} of {boothPeople.length} records
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Total Booth Members: {filteredData.length}
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedIds.size})
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIds(new Set())
                        setSelectAll(false)
                      }}
                    >
                      Clear Selection
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSessionAndRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search all columns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[calc(100vh-250px)] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background border-b z-20 shadow-sm">
                          <TableRow className="bg-background">
                            <TableHead className="w-12 bg-background">
                              <Checkbox
                                checked={selectAll}
                                onCheckedChange={(checked) => handleSelectAll()}
                              />
                            </TableHead>
                            <TableHead className="w-16 bg-background">S.No</TableHead>
                            <TableHead className="bg-background">Route No</TableHead>
                            <TableHead className="bg-background">VPA</TableHead>
                            <TableHead className="bg-background">CC No</TableHead>
                            <TableHead className="bg-background">Phone</TableHead>
                            <TableHead className="bg-background">Name</TableHead>
                            <TableHead className="bg-background">Updated Date</TableHead>
                            <TableHead className="bg-background">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.map((person, index) => (
                            <TableRow key={person.id} className={selectedIds.has(person.id) ? "bg-muted/50" : ""}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(person.id)}
                                  onCheckedChange={(checked) => handleSelectPerson(person.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell>{person.route_no || '-'}</TableCell>
                              <TableCell><code className="bg-muted px-2 py-1 rounded">{person.vpa}</code></TableCell>
                              <TableCell>{person.cc_no}</TableCell>
                              <TableCell>{person.phone}</TableCell>
                              <TableCell>{person.name || '-'}</TableCell>
                              <TableCell>{new Date(person.updated_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleEditPerson(person)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDeletePerson(person.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
              
              {filteredData.length === 0 && boothPeople.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No matching records found for "{searchQuery}".
                </div>
              )}
              
              {boothPeople.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No booth people found. Add one to get started.
                </div>
              )}

            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingPerson} onOpenChange={(open) => {
        if (!open) {
          setEditingPerson(null)
          setEditFormData({ route_no: "", vpa: "", cc_no: "", phone: "", name: "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booth Person</DialogTitle>
            <DialogDescription>Update person information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-route_no">Route No</Label>
              <Input
                id="edit-route_no"
                value={editFormData.route_no}
                onChange={(e) => setEditFormData({ ...editFormData, route_no: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-vpa">VPA *</Label>
              <Input
                id="edit-vpa"
                value={editFormData.vpa}
                onChange={(e) => setEditFormData({ ...editFormData, vpa: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-cc_no">CC No *</Label>
              <Input
                id="edit-cc_no"
                value={editFormData.cc_no}
                onChange={(e) => setEditFormData({ ...editFormData, cc_no: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingPerson(null)
              setEditFormData({ route_no: "", vpa: "", cc_no: "", phone: "", name: "" })
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePerson} disabled={!editFormData.vpa || !editFormData.cc_no}>
              Update Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add VPA Dialog */}
      <Dialog open={!!addingVPATo} onOpenChange={() => setAddingVPATo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update VPA</DialogTitle>
            <DialogDescription>
              Update the VPA for this person.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-vpa">New VPA</Label>
              <Input
                id="new-vpa"
                value={newVPA}
                onChange={(e) => setNewVPA(e.target.value)}
                placeholder="Enter new UPI ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingVPATo(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddVPA} disabled={!newVPA}>
              Update VPA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Progress Indicator */}
      {isDeleting && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 min-w-[250px] z-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Deleting Records...</span>
          </div>
          {deleteProgressMessage && (
            <p className="text-xs text-muted-foreground mb-2">{deleteProgressMessage}</p>
          )}
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${deleteProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      </div>
  )
}
