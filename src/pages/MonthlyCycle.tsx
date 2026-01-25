import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MonthlyCycleRecord {
  id: string;
  empNo: string;
  patientName: string;
  allowMonth: string;
  cycleNo: number;
  status: "Active" | "Completed";
  createdAt: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const initialRecords: MonthlyCycleRecord[] = [
  { id: "1", empNo: "EMP001", patientName: "Ahmed Hassan", allowMonth: "January", cycleNo: 1, status: "Active", createdAt: "2024-01-15" },
  { id: "2", empNo: "EMP002", patientName: "Fatima Ali", allowMonth: "January", cycleNo: 2, status: "Completed", createdAt: "2024-01-10" },
  { id: "3", empNo: "EMP003", patientName: "Muhammad Khan", allowMonth: "February", cycleNo: 1, status: "Active", createdAt: "2024-02-01" },
];

const MonthlyCycle = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState<MonthlyCycleRecord[]>(initialRecords);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    empNo: "",
    allowMonth: "",
    cycleNo: "1",
  });

  const filteredRecords = records.filter(
    (record) =>
      record.empNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate entry
    const exists = records.some(
      (r) => r.empNo === formData.empNo && r.allowMonth === formData.allowMonth && r.cycleNo === parseInt(formData.cycleNo)
    );
    
    if (exists) {
      toast({
        title: "Duplicate Entry",
        description: "A record with this Employee No, Month, and Cycle already exists.",
        variant: "destructive",
      });
      return;
    }

    const newRecord: MonthlyCycleRecord = {
      id: Date.now().toString(),
      empNo: formData.empNo,
      patientName: "Patient Name",
      allowMonth: formData.allowMonth,
      cycleNo: parseInt(formData.cycleNo),
      status: "Active",
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRecords([newRecord, ...records]);
    setFormData({ empNo: "", allowMonth: "", cycleNo: "1" });
    setIsAddDialogOpen(false);
    toast({
      title: "Monthly Cycle Added",
      description: `Cycle record for ${formData.empNo} has been saved.`,
    });
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
    toast({
      title: "Record Deleted",
      description: "Monthly cycle record has been removed.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Monthly Cycle (Note Sheet)</h1>
          <p className="text-muted-foreground">Track employee monthly cycles and allowances</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Cycle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">New Monthly Cycle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee No *</Label>
                <Input
                  value={formData.empNo}
                  onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                  placeholder="Enter Employee No"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Allow Month *</Label>
                <Select value={formData.allowMonth} onValueChange={(value) => setFormData({ ...formData, allowMonth: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cycle No *</Label>
                <Select value={formData.cycleNo} onValueChange={(value) => setFormData({ ...formData, cycleNo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>Cycle {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Record</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="medical-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by Employee No or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="table-container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee No</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Allow Month</TableHead>
              <TableHead>Cycle No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record, index) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <TableCell className="font-medium">{record.empNo}</TableCell>
                <TableCell>{record.patientName}</TableCell>
                <TableCell>{record.allowMonth}</TableCell>
                <TableCell>Cycle {record.cycleNo}</TableCell>
                <TableCell>
                  <Badge variant={record.status === "Active" ? "default" : "secondary"}>
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell>{record.createdAt}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(record.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MonthlyCycle;
