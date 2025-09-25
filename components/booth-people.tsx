"use client"

import { useState } from "react"
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
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import { addBoothPerson, updateBoothPerson, deleteBoothPerson, addVPAToPerson } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"

interface BoothPerson {
  id: string
  name: string
  phone: string
  address: string
  customerVPAs: Array<{
    id: string
    vpa: string
    isDefault: boolean
    isDisabled: boolean
    createdAt: string
  }>
  createdAt: string
}

export function BoothPeople() {
  const dispatch = useAppDispatch()
  const { boothPeople } = useAppSelector((state) => state.app)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingPerson, setEditingPerson] = useState<BoothPerson | null>(null)
  const [addingVPATo, setAddingVPATo] = useState<string | null>(null)
  const [newVPA, setNewVPA] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    customerVPA: "",
  })
  const { toast } = useToast()

  const downloadSampleCSV = () => {
    const csvContent = `Name,Phone,Address,Customer VPA (UPI)
John Doe,9876543210,123 Main Street,9876543210@yestp
Jane Smith,9876543211,456 Oak Avenue,9876543211@paytm
Mike Johnson,9876543212,789 Pine Road,9876543212@gpay
Sarah Wilson,9876543213,321 Elm Street,9876543213@phonepe`

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
      const text = await uploadFile.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("File must contain at least a header row and one data row")
      }

      const headers = lines[0].split(",").map((h) => h.trim())
      const expectedHeaders = ["Name", "Phone", "Address", "Customer VPA (UPI)"]

      const hasValidHeaders = expectedHeaders.every((expected) =>
        headers.some((header) => header.toLowerCase().includes(expected.toLowerCase())),
      )

      if (!hasValidHeaders) {
        throw new Error("Invalid file format. Please use the sample CSV format.")
      }

      let successCount = 0
      let errorCount = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())

        if (values.length >= 4 && values[0] && values[1] && values[3]) {
          const newPerson = {
            name: values[0],
            phone: values[1],
            address: values[2] || "",
            customerVPAs: [
              {
                id: Date.now().toString() + i,
                vpa: values[3],
                isDefault: true,
                isDisabled: false,
                createdAt: new Date().toISOString(),
              },
            ],
          }

          dispatch(addBoothPerson(newPerson))
          successCount++
        } else {
          errorCount++
        }
      }

      toast({
        title: "Bulk Upload Complete",
        description: `Successfully added ${successCount} people. ${errorCount > 0 ? `${errorCount} rows had errors.` : ""}`,
      })

      setIsBulkUploadOpen(false)
      setUploadFile(null)
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddPerson = () => {
    if (!formData.name || !formData.phone || !formData.customerVPA) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newPerson = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      customerVPAs: [
        {
          id: Date.now().toString(),
          vpa: formData.customerVPA,
          isDefault: true,
          isDisabled: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }

    dispatch(addBoothPerson(newPerson))
    setFormData({ name: "", phone: "", address: "", customerVPA: "" })
    setIsAddDialogOpen(false)

    toast({
      title: "Success",
      description: "Booth person added successfully",
    })
  }

  const handleEditPerson = (person: BoothPerson) => {
    setEditingPerson(person)
    setFormData({
      name: person.name,
      phone: person.phone,
      address: person.address,
      customerVPA: person.customerVPAs.find((vpa) => vpa.isDefault)?.vpa || "",
    })
  }

  const handleUpdatePerson = () => {
    if (!editingPerson || !formData.name || !formData.phone || !formData.customerVPA) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const updatedPerson: BoothPerson = {
      ...editingPerson,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      customerVPAs: editingPerson.customerVPAs.map((vpa) =>
        vpa.isDefault ? { ...vpa, vpa: formData.customerVPA } : vpa,
      ),
    }

    dispatch(updateBoothPerson(updatedPerson))
    setEditingPerson(null)
    setFormData({ name: "", phone: "", address: "", customerVPA: "" })

    toast({
      title: "Success",
      description: "Booth person updated successfully",
    })
  }

  const handleDeletePerson = (personId: string) => {
    dispatch(deleteBoothPerson(personId))
    toast({
      title: "Success",
      description: "Booth person deleted successfully",
    })
  }

  const handleAddVPA = () => {
    if (!addingVPATo || !newVPA) {
      toast({
        title: "Error",
        description: "Please enter a valid VPA",
        variant: "destructive",
      })
      return
    }

    dispatch(addVPAToPerson({ personId: addingVPATo, vpa: newVPA }))
    setAddingVPATo(null)
    setNewVPA("")

    toast({
      title: "Success",
      description: "New VPA added and set as default",
    })
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
                    Upload a CSV file with columns: Name, Phone, Address, Customer VPA (UPI)
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
                <DialogDescription>Add a new person with their VPA details</DialogDescription>
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
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerVPA">Customer VPA (UPI) *</Label>
                  <Input
                    id="customerVPA"
                    value={formData.customerVPA}
                    onChange={(e) => setFormData({ ...formData, customerVPA: e.target.value })}
                    placeholder="Enter UPI ID (e.g., 9876543210@yestp)"
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
          <CardDescription>Manage all registered booth people and their VPA details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Customer VPAs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boothPeople.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.phone}</TableCell>
                  <TableCell>{person.address}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {person.customerVPAs.map((vpa) => (
                        <div key={vpa.id} className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">{vpa.vpa}</code>
                          {vpa.isDefault && (
                            <Badge variant="default" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {vpa.isDisabled && (
                            <Badge variant="secondary" className="text-xs">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
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
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-customerVPA">Customer VPA (UPI) *</Label>
              <Input
                id="edit-customerVPA"
                value={formData.customerVPA}
                onChange={(e) => setFormData({ ...formData, customerVPA: e.target.value })}
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
            <DialogTitle>Add New VPA</DialogTitle>
            <DialogDescription>
              Add a new VPA for this person. The new VPA will become the default and old ones will be disabled.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-vpa">New Customer VPA (UPI)</Label>
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
            <Button onClick={handleAddVPA}>Add VPA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
