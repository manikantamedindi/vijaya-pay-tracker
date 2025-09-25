"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, UserPlus, Upload, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BoothPerson {
  id: number
  name: string
  phone: string
  vpa: string
  email: string | null
  booth_id: string | null
  role: string | null
  status: string | null
  inserted_at: string
  updated_at: string
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
  const [boothPeople, setBoothPeople] = useState<BoothPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingPerson, setEditingPerson] = useState<BoothPerson | null>(null)
  const [addingVPATo, setAddingVPATo] = useState<number | null>(null)
  const [newVPA, setNewVPA] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vpa: "",
    email: "",
    booth_id: "",
    role: "",
    status: "",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // Fetch booth people from API
  const fetchBoothPeople = async (page = 1) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/booth-people?page=${page}&limit=50`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch booth people')
      }
      
      const result: ApiResponse = await response.json()
      setBoothPeople(result.data)
      setCurrentPage(result.pagination.page)
      setTotalPages(result.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching booth people:', error)
      toast({
        title: "Error",
        description: "Failed to fetch booth people. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBoothPeople()
  }, [])

  const downloadSampleCSV = () => {
    const csvContent = `Name,Phone,VPA,Email,Booth ID,Role,Status
John Doe,9876543210,johndoe@ybl.com,john@example.com,booth1,manager,active
Jane Smith,9876543211,janesmith@ybl.com,jane@example.com,booth2,sales,inactive
Mike Johnson,9876543212,mike@ybl.com,mike@example.com,booth3,sales,active
Sarah Wilson,9876543213,sarah@ybl.com,sarah@example.com,booth1,manager,active`

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
      // For bulk upload, we need to call the API endpoint
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      const response = await fetch('/api/booth-people', {
        method: 'PATCH',
        body: formData, // This would require server-side handling of multipart form data
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to upload file')
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
    if (!formData.name || !formData.phone || !formData.vpa) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
          name: formData.name,
          phone: formData.phone,
          vpa: formData.vpa,
          email: formData.email || null,
          booth_id: formData.booth_id || null,
          role: formData.role || 'booth_person',
          status: formData.status || 'active'
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
      setFormData({ name: "", phone: "", vpa: "", email: "", booth_id: "", role: "", status: "" })
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
    setFormData({
      name: person.name,
      phone: person.phone,
      vpa: person.vpa,
      email: person.email || "",
      booth_id: person.booth_id || "",
      role: person.role || "",
      status: person.status || "",
    })
  }

  const handleUpdatePerson = async () => {
    if (!editingPerson || !formData.name || !formData.phone || !formData.vpa) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
          name: formData.name,
          phone: formData.phone,
          vpa: formData.vpa,
          email: formData.email || null,
          booth_id: formData.booth_id || null,
          role: formData.role || 'booth_person',
          status: formData.status || 'active'
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
      setFormData({ name: "", phone: "", vpa: "", email: "", booth_id: "", role: "", status: "" })
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

  const handleDeletePerson = async (personId: number) => {
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

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      fetchBoothPeople(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      fetchBoothPeople(currentPage - 1)
    }
  }

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
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with columns: Name, Phone, VPA, Email, Booth ID, Role, Status
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="booth_id">Booth ID</Label>
                    <Input
                      id="booth_id"
                      value={formData.booth_id}
                      onChange={(e) => setFormData({ ...formData, booth_id: e.target.value })}
                      placeholder="Booth ID (optional)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Role (optional)"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    placeholder="Status (optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPerson}>Add Person</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Booth People</CardTitle>
          <CardDescription>Manage all registered booth people and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>VPA</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Booth ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boothPeople.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell className="font-medium">{person.name}</TableCell>
                      <TableCell>{person.phone}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded">{person.vpa}</code></TableCell>
                      <TableCell>{person.email || '-'}</TableCell>
                      <TableCell>{person.booth_id || '-'}</TableCell>
                      <TableCell>{person.role || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={person.status === 'active' ? 'default' : 'secondary'}>
                          {person.status || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPerson(person)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setAddingVPATo(person.id)}>
                            <UserPlus className="h-4 w-4" />
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
              
              {boothPeople.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No booth people found. Add one to get started.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={goToPrevPage} 
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={goToNextPage} 
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPerson} onOpenChange={() => setEditingPerson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booth Person</DialogTitle>
            <DialogDescription>Update person information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-vpa">VPA *</Label>
              <Input
                id="edit-vpa"
                value={formData.vpa}
                onChange={(e) => setFormData({ ...formData, vpa: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-booth_id">Booth ID</Label>
                <Input
                  id="edit-booth_id"
                  value={formData.booth_id}
                  onChange={(e) => setFormData({ ...formData, booth_id: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Input
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPerson(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePerson}>Update Person</Button>
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
            <Button onClick={handleAddVPA}>Update VPA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
