"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BoothMember {
  id: string
  uniqueCode: string
  name: string
  phoneNumber: string
  dailyAmount: number
  status: "active" | "inactive"
  joinDate: string
}

export function BoothManagement() {
  const [booths, setBooths] = useState<BoothMember[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingBooth, setEditingBooth] = useState<BoothMember | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    dailyAmount: "",
  })
  const { toast } = useToast()

  // Load booths from localStorage on component mount
  useEffect(() => {
    const savedBooths = localStorage.getItem("boothMembers")
    if (savedBooths) {
      setBooths(JSON.parse(savedBooths))
    } else {
      // Initialize with sample data
      const sampleBooths: BoothMember[] = Array.from({ length: 10 }, (_, i) => ({
        id: `booth-${i + 1}`,
        uniqueCode: `MB${String(i + 1).padStart(3, "0")}`,
        name: `Booth Member ${i + 1}`,
        phoneNumber: `+91 98765${String(i + 1).padStart(5, "0")}`,
        dailyAmount: 500 + i * 50,
        status: "active",
        joinDate: new Date(2024, 0, i + 1).toISOString().split("T")[0],
      }))
      setBooths(sampleBooths)
      localStorage.setItem("boothMembers", JSON.stringify(sampleBooths))
    }
  }, [])

  // Save booths to localStorage whenever booths change
  useEffect(() => {
    if (booths.length > 0) {
      localStorage.setItem("boothMembers", JSON.stringify(booths))
    }
  }, [booths])

  const generateUniqueCode = () => {
    const nextNumber = booths.length + 1
    return `MB${String(nextNumber).padStart(3, "0")}`
  }

  const handleAddBooth = () => {
    if (!formData.name || !formData.phoneNumber || !formData.dailyAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const newBooth: BoothMember = {
      id: `booth-${Date.now()}`,
      uniqueCode: generateUniqueCode(),
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      dailyAmount: Number.parseFloat(formData.dailyAmount),
      status: "active",
      joinDate: new Date().toISOString().split("T")[0],
    }

    setBooths([...booths, newBooth])
    setFormData({ name: "", phoneNumber: "", dailyAmount: "" })
    setIsAddDialogOpen(false)

    toast({
      title: "Success",
      description: `Booth member ${newBooth.name} added with code ${newBooth.uniqueCode}`,
    })
  }

  const handleEditBooth = (booth: BoothMember) => {
    setEditingBooth(booth)
    setFormData({
      name: booth.name,
      phoneNumber: booth.phoneNumber,
      dailyAmount: booth.dailyAmount.toString(),
    })
  }

  const handleUpdateBooth = () => {
    if (!editingBooth || !formData.name || !formData.phoneNumber || !formData.dailyAmount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const updatedBooths = booths.map((booth) =>
      booth.id === editingBooth.id
        ? {
            ...booth,
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            dailyAmount: Number.parseFloat(formData.dailyAmount),
          }
        : booth,
    )

    setBooths(updatedBooths)
    setEditingBooth(null)
    setFormData({ name: "", phoneNumber: "", dailyAmount: "" })

    toast({
      title: "Success",
      description: "Booth member updated successfully",
    })
  }

  const handleDeleteBooth = (boothId: string) => {
    const updatedBooths = booths.filter((booth) => booth.id !== boothId)
    setBooths(updatedBooths)

    toast({
      title: "Success",
      description: "Booth member deleted successfully",
    })
  }

  const toggleBoothStatus = (boothId: string) => {
    const updatedBooths = booths.map((booth) =>
      booth.id === boothId ? { ...booth, status: booth.status === "active" ? "inactive" : "active" } : booth,
    )
    setBooths(updatedBooths)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Booth Members</h2>
          <p className="text-muted-foreground">Manage your {booths.length} booth members and their unique codes</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Booth Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Booth Member</DialogTitle>
              <DialogDescription>
                Add a new booth member to the system. A unique code will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter booth member name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Daily Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.dailyAmount}
                  onChange={(e) => setFormData({ ...formData, dailyAmount: e.target.value })}
                  placeholder="Enter daily payment amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBooth} disabled={!formData.name || !formData.phoneNumber || !formData.dailyAmount}>
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Booth Members</CardTitle>
          <CardDescription>View and manage all registered booth members</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unique Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Daily Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {booths.map((booth) => (
                <TableRow key={booth.id}>
                  <TableCell className="font-mono font-semibold">{booth.uniqueCode}</TableCell>
                  <TableCell>{booth.name}</TableCell>
                  <TableCell>{booth.phoneNumber}</TableCell>
                  <TableCell>₹{booth.dailyAmount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={booth.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleBoothStatus(booth.id)}
                    >
                      {booth.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{booth.joinDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditBooth(booth)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteBooth(booth.id)}>
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
      <Dialog open={!!editingBooth} onOpenChange={() => setEditingBooth(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booth Member</DialogTitle>
            <DialogDescription>Update booth member information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Daily Amount (₹)</Label>
              <Input
                id="edit-amount"
                type="number"
                value={formData.dailyAmount}
                onChange={(e) => setFormData({ ...formData, dailyAmount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBooth(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBooth} disabled={!formData.name || !formData.phoneNumber || !formData.dailyAmount}>
              Update Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
